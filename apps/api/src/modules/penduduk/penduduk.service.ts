import type { Request } from 'express';
import type {
  FilterPendudukInput,
  NonaktifkanPendudukInput,
  PendudukInput,
} from '@desa/shared';
import { prisma } from '../../lib/prisma.js';
import { dekripsi, enkripsi, hashPencarian, maskNik } from '../../lib/crypto.js';
import { AKSI, catatAudit } from '../../lib/audit.js';
import { AppError } from '../../middleware/error.js';

/**
 * NIK tersimpan terenkripsi, jadi tidak bisa dicari dengan LIKE.
 * Pencarian NIK dilakukan lewat kolom HMAC yang deterministik dan ter-index;
 * pencarian nama tetap LIKE biasa karena nama memang bukan rahasia.
 */
function bangunFilter(f: FilterPendudukInput) {
  const where: Record<string, unknown> = {};

  if (f.q?.trim()) {
    const q = f.q.trim();
    where.OR = /^\d{16}$/.test(q)
      ? [{ nikHash: hashPencarian(q) }]
      : [{ nama: { contains: q } }];
  }

  if (f.rtId) where.kartuKeluarga = { rtId: f.rtId };
  if (f.jenisKelamin) where.jenisKelamin = f.jenisKelamin;

  switch (f.status) {
    case 'AKTIF':
      where.tanggalMeninggal = null;
      where.tanggalPindah = null;
      break;
    case 'MENINGGAL':
      where.tanggalMeninggal = { not: null };
      break;
    case 'PINDAH':
      where.tanggalPindah = { not: null };
      break;
    case 'SEMUA':
      break;
  }

  return where;
}

const hitungUsia = (lahir: Date) => {
  const kini = new Date();
  let usia = kini.getFullYear() - lahir.getFullYear();
  const bulan = kini.getMonth() - lahir.getMonth();
  if (bulan < 0 || (bulan === 0 && kini.getDate() < lahir.getDate())) usia--;
  return usia;
};

/**
 * Daftar penduduk. NIK ditampilkan tersamar — melihat daftar tidak boleh
 * berarti memanen 16 digit NIK seluruh warga desa sekaligus.
 */
export async function daftarPenduduk(req: Request, filter: FilterPendudukInput) {
  const where = bangunFilter(filter);

  const [total, baris] = await Promise.all([
    prisma.penduduk.count({ where }),
    prisma.penduduk.findMany({
      where,
      orderBy: [{ nama: 'asc' }],
      skip: (filter.page - 1) * filter.perPage,
      take: filter.perPage,
      include: {
        kartuKeluarga: { include: { rt: { include: { rw: true } } } },
      },
    }),
  ]);

  await catatAudit(req, AKSI.LIHAT_PENDUDUK, 'Penduduk', undefined, {
    jumlah: baris.length,
    kataKunci: filter.q ?? null,
  });

  return {
    data: baris.map((p) => ({
      id: p.id,
      nik: maskNik(dekripsi(p.nikEnc)),
      nama: p.nama,
      jenisKelamin: p.jenisKelamin,
      tanggalLahir: p.tanggalLahir,
      usia: hitungUsia(p.tanggalLahir),
      pekerjaan: p.pekerjaan,
      hubunganKeluarga: p.hubunganKeluarga,
      alamat: p.kartuKeluarga.alamat,
      rt: p.kartuKeluarga.rt.nomor,
      rw: p.kartuKeluarga.rt.rw.nomor,
      status: p.tanggalMeninggal ? 'MENINGGAL' : p.tanggalPindah ? 'PINDAH' : 'AKTIF',
    })),
    meta: { page: filter.page, perPage: filter.perPage, total },
  };
}

/** Detail lengkap termasuk NIK utuh. Selalu tercatat di audit log. */
export async function detailPenduduk(req: Request, id: string) {
  const p = await prisma.penduduk.findUnique({
    where: { id },
    include: {
      kartuKeluarga: {
        include: {
          rt: { include: { rw: true } },
          anggota: { select: { id: true, nama: true, hubunganKeluarga: true } },
        },
      },
    },
  });

  if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Data penduduk tidak ditemukan');

  await catatAudit(req, AKSI.LIHAT_PENDUDUK, 'Penduduk', p.id, { nama: p.nama, lengkap: true });

  return {
    ...p,
    nik: dekripsi(p.nikEnc),
    nikEnc: undefined,
    nikHash: undefined,
    usia: hitungUsia(p.tanggalLahir),
    kartuKeluarga: {
      ...p.kartuKeluarga,
      nomorKk: dekripsi(p.kartuKeluarga.nomorKkEnc),
      nomorKkEnc: undefined,
      nomorKkHash: undefined,
    },
  };
}

/**
 * Mencari Kartu Keluarga berdasarkan nomornya, atau membuatnya bila belum ada.
 * Dipakai baik oleh form entri maupun impor CSV.
 */
async function siapkanKartuKeluarga(input: {
  nomorKk: string;
  alamat: string;
  rt: string;
  rw: string;
  dusun?: string;
  kodePos?: string;
}) {
  const nomorKkHash = hashPencarian(input.nomorKk);
  const adaKk = await prisma.kartuKeluarga.findUnique({ where: { nomorKkHash } });
  if (adaKk) return adaKk;

  const rw = await prisma.rw.upsert({
    where: { nomor: input.rw },
    update: {},
    create: { nomor: input.rw },
  });

  const rt = await prisma.rt.upsert({
    where: { rwId_nomor: { rwId: rw.id, nomor: input.rt } },
    update: {},
    create: { nomor: input.rt, rwId: rw.id },
  });

  return prisma.kartuKeluarga.create({
    data: {
      nomorKkEnc: enkripsi(input.nomorKk),
      nomorKkHash,
      alamat: input.alamat,
      dusun: input.dusun,
      kodePos: input.kodePos,
      rtId: rt.id,
    },
  });
}

type DataAlamat = { alamat: string; rt: string; rw: string; dusun?: string; kodePos?: string };

export async function tambahPenduduk(
  req: Request,
  input: PendudukInput & DataAlamat,
) {
  const nikHash = hashPencarian(input.nik);
  if (await prisma.penduduk.findUnique({ where: { nikHash } })) {
    throw new AppError(409, 'NIK_SUDAH_ADA', 'NIK ini sudah terdaftar di data penduduk');
  }

  const kk = await siapkanKartuKeluarga(input);

  const penduduk = await prisma.penduduk.create({
    data: {
      nikEnc: enkripsi(input.nik),
      nikHash,
      nama: input.nama,
      tempatLahir: input.tempatLahir,
      tanggalLahir: input.tanggalLahir,
      jenisKelamin: input.jenisKelamin,
      agama: input.agama,
      pendidikan: input.pendidikan,
      pekerjaan: input.pekerjaan,
      statusKawin: input.statusKawin,
      kewarganegaraan: input.kewarganegaraan,
      hubunganKeluarga: input.hubunganKeluarga,
      namaAyah: input.namaAyah,
      namaIbu: input.namaIbu,
      golonganDarah: input.golonganDarah,
      noAktaLahir: input.noAktaLahir,
      noAktaKawin: input.noAktaKawin,
      disabilitas: input.disabilitas,
      pendatang: input.pendatang,
      kartuKeluargaId: kk.id,
    },
  });

  await catatAudit(req, AKSI.UBAH_PENDUDUK, 'Penduduk', penduduk.id, {
    aksi: 'TAMBAH',
    nama: input.nama,
    nik: maskNik(input.nik),
  });

  return { id: penduduk.id, nama: penduduk.nama };
}

export async function ubahPenduduk(
  req: Request,
  id: string,
  input: PendudukInput & DataAlamat,
) {
  const lama = await prisma.penduduk.findUnique({ where: { id } });
  if (!lama) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Data penduduk tidak ditemukan');

  const nikHash = hashPencarian(input.nik);
  if (nikHash !== lama.nikHash) {
    const bentrok = await prisma.penduduk.findUnique({ where: { nikHash } });
    if (bentrok) {
      throw new AppError(409, 'NIK_SUDAH_ADA', 'NIK ini sudah dipakai data penduduk lain');
    }
  }

  const kk = await siapkanKartuKeluarga(input);

  await prisma.penduduk.update({
    where: { id },
    data: {
      nikEnc: enkripsi(input.nik),
      nikHash,
      nama: input.nama,
      tempatLahir: input.tempatLahir,
      tanggalLahir: input.tanggalLahir,
      jenisKelamin: input.jenisKelamin,
      agama: input.agama,
      pendidikan: input.pendidikan,
      pekerjaan: input.pekerjaan,
      statusKawin: input.statusKawin,
      kewarganegaraan: input.kewarganegaraan,
      hubunganKeluarga: input.hubunganKeluarga,
      namaAyah: input.namaAyah,
      namaIbu: input.namaIbu,
      golonganDarah: input.golonganDarah,
      noAktaLahir: input.noAktaLahir,
      noAktaKawin: input.noAktaKawin,
      disabilitas: input.disabilitas,
      pendatang: input.pendatang,
      kartuKeluargaId: kk.id,
    },
  });

  // Nilai lama ikut dicatat agar perubahan bisa ditelusuri, bukan hanya diketahui terjadi.
  await catatAudit(req, AKSI.UBAH_PENDUDUK, 'Penduduk', id, {
    aksi: 'UBAH',
    nama: input.nama,
    namaSebelumnya: lama.nama !== input.nama ? lama.nama : undefined,
  });

  return { id, nama: input.nama };
}

export async function nonaktifkanPenduduk(
  req: Request,
  id: string,
  input: NonaktifkanPendudukInput,
) {
  const p = await prisma.penduduk.findUnique({ where: { id } });
  if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Data penduduk tidak ditemukan');

  await prisma.penduduk.update({
    where: { id },
    data:
      input.alasan === 'MENINGGAL'
        ? { tanggalMeninggal: input.tanggal }
        : { tanggalPindah: input.tanggal },
  });

  // Akun login ikut dibekukan supaya tidak bisa dipakai orang lain.
  await prisma.user.updateMany({
    where: { pendudukId: id },
    data: { status: 'DIBEKUKAN' },
  });

  await catatAudit(req, AKSI.HAPUS_PENDUDUK, 'Penduduk', id, {
    nama: p.nama,
    alasan: input.alasan,
    tanggal: input.tanggal,
    keterangan: input.keterangan,
  });

  return { id, nama: p.nama, alasan: input.alasan };
}

/**
 * Statistik agregat untuk halaman publik Data Kependudukan.
 *
 * Tidak menerima parameter apa pun yang bisa mempersempit hasil ke individu —
 * itu batas yang menjaga halaman ini tetap aman dibuka siapa saja.
 */
export async function statistikKependudukan() {
  const aktif = { tanggalMeninggal: null, tanggalPindah: null };
  const awalTahun = new Date(new Date().getFullYear(), 0, 1);

  const [
    totalPenduduk,
    totalKk,
    lakiLaki,
    perempuan,
    pendatang,
    disabilitas,
    kematianTahunIni,
    pindahTahunIni,
    perAgamaRaw,
    perPendidikanRaw,
    perPekerjaanRaw,
    perStatusKawinRaw,
    semuaUsia,
    rtList,
  ] = await Promise.all([
    prisma.penduduk.count({ where: aktif }),
    prisma.kartuKeluarga.count(),
    prisma.penduduk.count({ where: { ...aktif, jenisKelamin: 'LAKI_LAKI' } }),
    prisma.penduduk.count({ where: { ...aktif, jenisKelamin: 'PEREMPUAN' } }),
    prisma.penduduk.count({ where: { ...aktif, pendatang: true } }),
    prisma.penduduk.count({ where: { ...aktif, disabilitas: { not: null } } }),
    prisma.penduduk.count({ where: { tanggalMeninggal: { gte: awalTahun } } }),
    prisma.penduduk.count({ where: { tanggalPindah: { gte: awalTahun } } }),
    prisma.penduduk.groupBy({ by: ['agama'], where: aktif, _count: true }),
    prisma.penduduk.groupBy({ by: ['pendidikan'], where: aktif, _count: true }),
    prisma.penduduk.groupBy({ by: ['pekerjaan'], where: aktif, _count: true }),
    prisma.penduduk.groupBy({ by: ['statusKawin'], where: aktif, _count: true }),
    prisma.penduduk.findMany({
      where: aktif,
      select: { tanggalLahir: true, kartuKeluarga: { select: { rtId: true } } },
    }),
    prisma.rt.findMany({ include: { rw: true }, orderBy: { nomor: 'asc' } }),
  ]);

  // Usia dihitung di aplikasi, bukan di SQL, agar tidak bergantung pada fungsi
  // tanggal yang berbeda-beda antar versi MySQL/MariaDB.
  const kelompok = [
    { label: '0-4 tahun', min: 0, max: 4 },
    { label: '5-14 tahun', min: 5, max: 14 },
    { label: '15-24 tahun', min: 15, max: 24 },
    { label: '25-44 tahun', min: 25, max: 44 },
    { label: '45-59 tahun', min: 45, max: 59 },
    { label: '60 tahun ke atas', min: 60, max: 200 },
  ];

  const perKelompokUsia = kelompok.map((k) => ({ label: k.label, jumlah: 0 }));
  const perRtHitung = new Map<string, number>();
  let balita = 0;
  let lansia = 0;

  for (const p of semuaUsia) {
    const usia = hitungUsia(p.tanggalLahir);
    if (usia <= 4) balita++;
    if (usia >= 60) lansia++;

    const idx = kelompok.findIndex((k) => usia >= k.min && usia <= k.max);
    if (idx >= 0) perKelompokUsia[idx].jumlah++;

    const rtId = p.kartuKeluarga.rtId;
    perRtHitung.set(rtId, (perRtHitung.get(rtId) ?? 0) + 1);
  }

  const petakan = (rows: Array<Record<string, unknown>>, kunci: string) =>
    rows
      .map((r) => ({ label: String(r[kunci]), jumlah: Number(r._count) }))
      .sort((a, b) => b.jumlah - a.jumlah);

  return {
    totalPenduduk,
    totalKk,
    lakiLaki,
    perempuan,
    balita,
    lansia,
    pendatang,
    disabilitas,
    kelahiranTahunIni: semuaUsia.filter((p) => p.tanggalLahir >= awalTahun).length,
    kematianTahunIni,
    pindahTahunIni,
    perKelompokUsia,
    perAgama: petakan(perAgamaRaw, 'agama'),
    perPendidikan: petakan(perPendidikanRaw, 'pendidikan'),
    perPekerjaan: petakan(perPekerjaanRaw, 'pekerjaan').slice(0, 15),
    perStatusKawin: petakan(perStatusKawinRaw, 'statusKawin'),
    perRt: rtList
      .map((rt) => ({
        label: `RT ${rt.nomor} / RW ${rt.rw.nomor}`,
        jumlah: perRtHitung.get(rt.id) ?? 0,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}
