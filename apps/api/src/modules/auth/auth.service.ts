import argon2 from 'argon2';
import type { Request } from 'express';
import type {
  AktivasiWargaInput,
  LoginPerangkatInput,
  LoginWargaInput,
  Peran,
} from '@desa/shared';
import { prisma } from '../../lib/prisma.js';
import { hashPencarian, kodeAcak, maskNik } from '../../lib/crypto.js';
import { buatAccessToken, buatRefreshToken, cabutSemuaSesi } from '../../lib/token.js';
import { AKSI, catatAudit } from '../../lib/audit.js';
import { AppError } from '../../middleware/error.js';

const MAKS_GAGAL = 5;
const DURASI_KUNCI_MENIT = 15;
const MASA_BERLAKU_KODE_HARI = 7;

/**
 * Pesan yang sama untuk NIK salah, PIN salah, dan akun tidak ada.
 *
 * Membedakan ketiganya berarti memberi tahu penyerang bahwa sebuah NIK
 * terdaftar di desa ini — informasi yang tidak perlu diberikan cuma-cuma.
 */
const PESAN_KREDENSIAL_SALAH = 'NIK atau PIN tidak cocok';

const konteksReq = (req: Request) => ({
  userAgent: req.headers['user-agent'],
  ip: req.ip,
});

function pastikanTidakTerkunci(user: { terkunciSampai: Date | null }) {
  if (user.terkunciSampai && user.terkunciSampai > new Date()) {
    const sisaMenit = Math.ceil((user.terkunciSampai.getTime() - Date.now()) / 60_000);
    throw new AppError(
      429,
      'AKUN_TERKUNCI',
      `Terlalu banyak percobaan gagal. Coba lagi dalam ${sisaMenit} menit.`,
    );
  }
}

async function catatKegagalan(userId: string, gagalSekarang: number) {
  const gagal = gagalSekarang + 1;
  await prisma.user.update({
    where: { id: userId },
    data: {
      gagalLogin: gagal,
      terkunciSampai:
        gagal >= MAKS_GAGAL ? new Date(Date.now() + DURASI_KUNCI_MENIT * 60_000) : null,
    },
  });
}

async function terbitkanSesi(
  req: Request,
  user: { id: string; peran: string; pendudukId: string | null },
) {
  await prisma.user.update({
    where: { id: user.id },
    data: { gagalLogin: 0, terkunciSampai: null, loginTerakhir: new Date() },
  });

  const payload = {
    sub: user.id,
    peran: user.peran as Peran,
    pendudukId: user.pendudukId ?? undefined,
  };

  return {
    accessToken: buatAccessToken(payload),
    refreshToken: await buatRefreshToken(user.id, konteksReq(req)),
    peran: user.peran,
  };
}

/**
 * Perangkat desa mendaftarkan warga dari data penduduk yang sudah ada.
 * Yang keluar adalah kode aktivasi sekali pakai — bukan PIN. PIN ditetapkan
 * warga sendiri, sehingga perangkat desa pun tidak pernah tahu PIN warga.
 */
export async function daftarkanWarga(req: Request, nik: string) {
  const penduduk = await prisma.penduduk.findUnique({
    where: { nikHash: hashPencarian(nik) },
    include: { user: true },
  });

  if (!penduduk) {
    throw new AppError(404, 'PENDUDUK_TIDAK_DITEMUKAN', 'NIK tidak ada di data penduduk desa');
  }
  if (penduduk.user?.status === 'AKTIF') {
    throw new AppError(409, 'AKUN_SUDAH_AKTIF', `${penduduk.nama} sudah punya akun aktif`);
  }

  const kodeAktivasi = kodeAcak(8);
  const kodeExpiredAt = new Date(Date.now() + MASA_BERLAKU_KODE_HARI * 86_400_000);

  const user = penduduk.user
    ? await prisma.user.update({
        where: { id: penduduk.user.id },
        data: { kodeAktivasi, kodeExpiredAt, status: 'BELUM_AKTIF' },
      })
    : await prisma.user.create({
        data: {
          peran: 'WARGA',
          status: 'BELUM_AKTIF',
          kodeAktivasi,
          kodeExpiredAt,
          pendudukId: penduduk.id,
        },
      });

  await catatAudit(req, AKSI.DAFTARKAN_WARGA, 'User', user.id, {
    nik: maskNik(nik),
    nama: penduduk.nama,
  });

  return {
    nama: penduduk.nama,
    nik: maskNik(nik),
    kodeAktivasi,
    berlakuSampai: kodeExpiredAt,
  };
}

/** Warga menukar kode aktivasi dengan PIN miliknya sendiri. */
export async function aktivasiWarga(req: Request, input: AktivasiWargaInput) {
  const penduduk = await prisma.penduduk.findUnique({
    where: { nikHash: hashPencarian(input.nik) },
    include: { user: true },
  });

  const user = penduduk?.user;
  const kodeCocok =
    user?.kodeAktivasi != null &&
    user.kodeAktivasi === input.kodeAktivasi.toUpperCase() &&
    user.kodeExpiredAt != null &&
    user.kodeExpiredAt > new Date();

  if (!kodeCocok || !user) {
    throw new AppError(
      400,
      'AKTIVASI_GAGAL',
      'NIK atau kode aktivasi tidak cocok, atau kodenya sudah kedaluwarsa',
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      kredensialHash: await argon2.hash(input.pin, { type: argon2.argon2id }),
      status: 'AKTIF',
      kodeAktivasi: null,
      kodeExpiredAt: null,
      gagalLogin: 0,
      terkunciSampai: null,
    },
  });

  await catatAudit(req, AKSI.AKTIVASI_AKUN, 'User', user.id, { nik: maskNik(input.nik) });

  return { nama: penduduk!.nama };
}

export async function loginWarga(req: Request, input: LoginWargaInput) {
  const penduduk = await prisma.penduduk.findUnique({
    where: { nikHash: hashPencarian(input.nik) },
    include: { user: true },
  });

  const user = penduduk?.user;

  if (!user || !user.kredensialHash || user.status === 'BELUM_AKTIF') {
    throw new AppError(401, 'KREDENSIAL_SALAH', PESAN_KREDENSIAL_SALAH);
  }
  if (user.status === 'DIBEKUKAN') {
    throw new AppError(403, 'AKUN_DIBEKUKAN', 'Akun Anda dibekukan. Hubungi kantor desa.');
  }
  pastikanTidakTerkunci(user);

  if (!(await argon2.verify(user.kredensialHash, input.pin))) {
    await catatKegagalan(user.id, user.gagalLogin);
    await catatAudit(req, AKSI.LOGIN_GAGAL, 'User', user.id, { nik: maskNik(input.nik) });
    throw new AppError(401, 'KREDENSIAL_SALAH', PESAN_KREDENSIAL_SALAH);
  }

  await catatAudit(req, AKSI.LOGIN_BERHASIL, 'User', user.id);
  return { ...(await terbitkanSesi(req, user)), nama: penduduk!.nama };
}

export async function loginPerangkat(req: Request, input: LoginPerangkatInput) {
  const user = await prisma.user.findUnique({
    where: { username: input.username },
    include: { penduduk: true },
  });

  if (!user || !user.kredensialHash || user.peran === 'WARGA') {
    throw new AppError(401, 'KREDENSIAL_SALAH', 'Username atau password salah');
  }
  if (user.status !== 'AKTIF') {
    throw new AppError(403, 'AKUN_TIDAK_AKTIF', 'Akun Anda tidak aktif. Hubungi admin.');
  }
  pastikanTidakTerkunci(user);

  if (!(await argon2.verify(user.kredensialHash, input.password))) {
    await catatKegagalan(user.id, user.gagalLogin);
    await catatAudit(req, AKSI.LOGIN_GAGAL, 'User', user.id, { username: input.username });
    throw new AppError(401, 'KREDENSIAL_SALAH', 'Username atau password salah');
  }

  await catatAudit(req, AKSI.LOGIN_BERHASIL, 'User', user.id);
  return {
    ...(await terbitkanSesi(req, user)),
    nama: user.penduduk?.nama ?? user.username ?? 'Perangkat Desa',
  };
}

/** Ganti PIN mencabut seluruh sesi lain — perangkat lain ikut terlempar keluar. */
export async function gantiPin(userId: string, pinLama: string, pinBaru: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.kredensialHash || !(await argon2.verify(user.kredensialHash, pinLama))) {
    throw new AppError(400, 'PIN_LAMA_SALAH', 'PIN lama tidak cocok');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { kredensialHash: await argon2.hash(pinBaru, { type: argon2.argon2id }) },
  });
  await cabutSemuaSesi(userId);
}

export async function profilSaya(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { penduduk: { select: { nama: true, jenisKelamin: true, tanggalLahir: true } } },
  });
  if (!user) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Akun tidak ditemukan');

  return {
    id: user.id,
    peran: user.peran,
    username: user.username,
    nama: user.penduduk?.nama ?? user.username,
    loginTerakhir: user.loginTerakhir,
  };
}
