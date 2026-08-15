import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Request } from 'express';
import type { AjukanSuratInput, FilterSuratInput, TinjauSuratInput } from '@desa/shared';
import { prisma } from '../../lib/prisma.js';
import { dekripsi, hashDokumen as hitungHash, kodeAcak, maskNik } from '../../lib/crypto.js';
import { catatAudit } from '../../lib/audit.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.js';
import { buatKodeVerifikasi, buatNomorSurat } from './nomor.js';
import { buatPdfSurat, isiTemplate, placeholderKosong } from './pdf.js';

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const tanggalPanjang = (d: Date) => `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;

/** Kode lacak yang dipegang warga: BN1-2026-0001A7 */
const buatKodeLacak = () =>
  `BN1-${new Date().getFullYear()}-${kodeAcak(6)}`;

// ── Pengajuan oleh warga ──

export async function ajukanSurat(req: Request, input: AjukanSuratInput) {
  const template = await prisma.templateSurat.findUnique({
    where: { kode: input.jenisSurat },
  });
  if (!template?.aktif) {
    throw new AppError(400, 'JENIS_TIDAK_TERSEDIA', 'Jenis surat ini sedang tidak dilayani');
  }

  const pemohon = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    include: { penduduk: true },
  });
  if (!pemohon?.penduduk) {
    throw new AppError(
      400,
      'DATA_PENDUDUK_TIDAK_ADA',
      'Akun Anda belum tertaut ke data penduduk. Hubungi kantor desa.',
    );
  }

  // Satu pengajuan aktif per jenis surat. Tanpa ini, satu orang bisa menekan
  // tombol berkali-kali dan membanjiri antrean perangkat desa dengan duplikat.
  const sudahAntre = await prisma.pengajuanSurat.findFirst({
    where: {
      pemohonId: pemohon.id,
      templateId: template.id,
      status: { in: ['DIPROSES', 'DISETUJUI'] },
    },
  });
  if (sudahAntre) {
    throw new AppError(
      409,
      'PENGAJUAN_MASIH_BERJALAN',
      `Anda masih punya pengajuan ${template.nama} yang sedang diproses (${sudahAntre.kodeLacak}).`,
    );
  }

  const pengajuan = await prisma.pengajuanSurat.create({
    data: {
      kodeLacak: buatKodeLacak(),
      templateId: template.id,
      pemohonId: pemohon.id,
      keperluan: input.keperluan,
      data: input.data,
      status: 'DIPROSES',
      lampiran: input.lampiranIds.length
        ? { create: input.lampiranIds.map((berkasId) => ({ berkasId })) }
        : undefined,
      riwayat: {
        create: { status: 'DIPROSES', catatan: 'Pengajuan diterima', olehUserId: pemohon.id },
      },
    },
  });

  await catatAudit(req, 'AJUKAN_SURAT', 'PengajuanSurat', pengajuan.id, {
    jenis: template.nama,
    kodeLacak: pengajuan.kodeLacak,
  });

  return { id: pengajuan.id, kodeLacak: pengajuan.kodeLacak, status: pengajuan.status };
}

export async function suratSaya(userId: string, filter: FilterSuratInput) {
  const where = {
    pemohonId: userId,
    ...(filter.status ? { status: filter.status } : {}),
  };

  const [total, baris] = await Promise.all([
    prisma.pengajuanSurat.count({ where }),
    prisma.pengajuanSurat.findMany({
      where,
      orderBy: { dibuatPada: 'desc' },
      skip: (filter.page - 1) * filter.perPage,
      take: filter.perPage,
      include: { template: { select: { nama: true, kode: true } } },
    }),
  ]);

  return {
    data: baris.map((p) => ({
      id: p.id,
      kodeLacak: p.kodeLacak,
      jenis: p.template.nama,
      keperluan: p.keperluan,
      status: p.status,
      catatan: p.catatan,
      nomorSurat: p.nomorSurat,
      adaPdf: Boolean(p.pdfPath),
      dibuatPada: p.dibuatPada,
      ditinjauPada: p.ditinjauPada,
    })),
    meta: { page: filter.page, perPage: filter.perPage, total },
  };
}

// ── Sisi perangkat desa ──

export async function daftarPengajuan(filter: FilterSuratInput) {
  const where: Record<string, unknown> = {};
  if (filter.status) where.status = filter.status;
  if (filter.jenisSurat) where.template = { kode: filter.jenisSurat };
  if (filter.q?.trim()) where.kodeLacak = { contains: filter.q.trim() };

  const [total, baris] = await Promise.all([
    prisma.pengajuanSurat.count({ where }),
    prisma.pengajuanSurat.findMany({
      where,
      // Yang paling lama menunggu didahulukan — antrean, bukan tumpukan.
      orderBy: [{ status: 'asc' }, { dibuatPada: 'asc' }],
      skip: (filter.page - 1) * filter.perPage,
      take: filter.perPage,
      include: {
        template: { select: { nama: true } },
        pemohon: { include: { penduduk: { select: { nama: true } } } },
        _count: { select: { lampiran: true } },
      },
    }),
  ]);

  return {
    data: baris.map((p) => ({
      id: p.id,
      kodeLacak: p.kodeLacak,
      jenis: p.template.nama,
      pemohon: p.pemohon.penduduk?.nama ?? '—',
      keperluan: p.keperluan,
      status: p.status,
      jumlahLampiran: p._count.lampiran,
      nomorSurat: p.nomorSurat,
      dibuatPada: p.dibuatPada,
    })),
    meta: { page: filter.page, perPage: filter.perPage, total },
  };
}

export async function detailPengajuan(req: Request, id: string, hanyaMilikSendiri = false) {
  const p = await prisma.pengajuanSurat.findUnique({
    where: { id },
    include: {
      template: true,
      pemohon: {
        include: {
          penduduk: {
            include: { kartuKeluarga: { include: { rt: { include: { rw: true } } } } },
          },
        },
      },
      lampiran: { include: { berkas: true } },
      riwayat: { orderBy: { dibuatPada: 'asc' } },
    },
  });

  if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Pengajuan tidak ditemukan');
  if (hanyaMilikSendiri && p.pemohonId !== req.user!.sub) {
    throw new AppError(403, 'AKSES_DITOLAK', 'Ini bukan pengajuan Anda');
  }

  const pdd = p.pemohon.penduduk;

  return {
    id: p.id,
    kodeLacak: p.kodeLacak,
    jenis: p.template.nama,
    kodeJenis: p.template.kode,
    keperluan: p.keperluan,
    data: p.data,
    status: p.status,
    catatan: p.catatan,
    nomorSurat: p.nomorSurat,
    kodeVerifikasi: p.kodeVerifikasi,
    adaPdf: Boolean(p.pdfPath),
    dibuatPada: p.dibuatPada,
    ditinjauPada: p.ditinjauPada,
    pemohon: pdd
      ? {
          nama: pdd.nama,
          // NIK disamarkan bahkan bagi perangkat desa saat meninjau: yang
          // dibutuhkan untuk memutuskan adalah nama dan kelengkapan berkas,
          // bukan 16 digit NIK. NIK utuh baru dipakai saat surat dirender.
          nik: maskNik(dekripsi(pdd.nikEnc)),
          tempatLahir: pdd.tempatLahir,
          tanggalLahir: pdd.tanggalLahir,
          jenisKelamin: pdd.jenisKelamin,
          pekerjaan: pdd.pekerjaan,
          alamat: `${pdd.kartuKeluarga.alamat} RT ${pdd.kartuKeluarga.rt.nomor}/RW ${pdd.kartuKeluarga.rt.rw.nomor}`,
        }
      : null,
    lampiran: p.lampiran.map((l) => ({
      id: l.id,
      nama: l.berkas.namaAsli,
      url: `/uploads/${l.berkas.path}`,
    })),
    riwayat: p.riwayat,
  };
}

export async function tinjauPengajuan(req: Request, id: string, input: TinjauSuratInput) {
  const p = await prisma.pengajuanSurat.findUnique({ where: { id } });
  if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Pengajuan tidak ditemukan');

  if (p.status === 'SIAP_DIAMBIL') {
    throw new AppError(
      409,
      'SUDAH_SELESAI',
      'Surat ini sudah selesai dan tidak bisa diubah statusnya lagi',
    );
  }

  await prisma.$transaction([
    prisma.pengajuanSurat.update({
      where: { id },
      data: {
        status: input.status,
        catatan: input.catatan ?? null,
        peninjauId: req.user!.sub,
        ditinjauPada: new Date(),
      },
    }),
    prisma.riwayatStatusSurat.create({
      data: {
        pengajuanId: id,
        status: input.status,
        catatan: input.catatan,
        olehUserId: req.user!.sub,
      },
    }),
  ]);

  await catatAudit(req, 'TINJAU_SURAT', 'PengajuanSurat', id, {
    status: input.status,
    kodeLacak: p.kodeLacak,
  });

  return { id, status: input.status };
}

/**
 * Menerbitkan surat: memberi nomor, merender PDF, menghitung hash, menempel QR.
 *
 * Dijalankan setelah disetujui — bukan saat diajukan. Kalau PDF dibuat lebih
 * awal, akan ada berkas berkop desa beredar tanpa persetujuan siapa pun.
 */
export async function terbitkanSurat(req: Request, id: string) {
  const p = await prisma.pengajuanSurat.findUnique({
    where: { id },
    include: {
      template: true,
      pemohon: {
        include: {
          penduduk: {
            include: { kartuKeluarga: { include: { rt: { include: { rw: true } } } } },
          },
        },
      },
    },
  });

  if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Pengajuan tidak ditemukan');
  if (p.status !== 'DISETUJUI') {
    throw new AppError(
      400,
      'BELUM_DISETUJUI',
      'Surat hanya bisa diterbitkan setelah pengajuannya disetujui',
    );
  }
  if (p.pdfPath) {
    throw new AppError(409, 'SUDAH_TERBIT', 'Surat ini sudah pernah diterbitkan');
  }

  const pdd = p.pemohon.penduduk;
  if (!pdd) throw new AppError(400, 'DATA_TIDAK_LENGKAP', 'Data penduduk pemohon tidak ditemukan');

  const desa = await prisma.profilDesa.findUnique({ where: { id: 1 } });
  if (!desa) throw new AppError(400, 'PROFIL_DESA_KOSONG', 'Profil desa belum diisi');

  const kades = await prisma.perangkat.findFirst({
    where: { aktif: true, jabatan: { contains: 'Kepala Desa' } },
    include: { penduduk: { select: { nama: true } } },
  });

  const nomorSurat = await buatNomorSurat(p.template.kode, p.template.formatNomor);
  const kodeVerifikasi = buatKodeVerifikasi();
  const tanggalTerbit = new Date();

  const nilai: Record<string, unknown> = {
    ...(p.data as Record<string, unknown>),
    nama: pdd.nama,
    nik: dekripsi(pdd.nikEnc),
    nomorKk: dekripsi(pdd.kartuKeluarga.nomorKkEnc),
    tempatLahir: pdd.tempatLahir,
    tanggalLahir: tanggalPanjang(pdd.tanggalLahir),
    tempatTanggalLahir: `${pdd.tempatLahir}, ${tanggalPanjang(pdd.tanggalLahir)}`,
    jenisKelamin: pdd.jenisKelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan',
    agama: pdd.agama,
    pekerjaan: pdd.pekerjaan,
    pendidikan: pdd.pendidikan,
    // Huruf kapital di awal tiap kata. Bentuk "kawin" atau "cerai hidup"
    // dengan huruf kecil terbaca janggal pada surat dinas.
    statusKawin: pdd.statusKawin
      .toLowerCase()
      .split('_')
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      .join(' '),
    kewarganegaraan: pdd.kewarganegaraan,
    alamat: `${pdd.kartuKeluarga.alamat}, RT ${pdd.kartuKeluarga.rt.nomor}/RW ${pdd.kartuKeluarga.rt.rw.nomor}`,
    rt: pdd.kartuKeluarga.rt.nomor,
    rw: pdd.kartuKeluarga.rt.rw.nomor,
    dusun: pdd.kartuKeluarga.dusun ?? '',
    desa: desa.namaDesa,
    kecamatan: desa.kecamatan,
    kabupaten: desa.kabupaten,
    keperluan: p.keperluan,
    nomorSurat,
    tanggal: tanggalPanjang(tanggalTerbit),
  };

  const isiSurat = isiTemplate(p.template.isiTemplate, nilai);
  const kosong = placeholderKosong(isiSurat);

  const pdf = await buatPdfSurat({
    namaDesa: desa.namaDesa,
    kecamatan: desa.kecamatan,
    kabupaten: desa.kabupaten,
    provinsi: desa.provinsi,
    alamatKantor: desa.alamatKantor,
    kodePos: desa.kodePos,
    judulSurat: p.template.nama,
    nomorSurat,
    isiSurat,
    penandatanganNama: kades?.penduduk.nama ?? '..............................',
    penandatanganJabatan: kades?.jabatan ?? 'Kepala Desa',
    kodeVerifikasi,
    tanggalTerbit,
  });

  const relatif = join(
    'surat',
    String(tanggalTerbit.getFullYear()),
    `${p.kodeLacak}.pdf`,
  );
  const absolut = join(env.UPLOAD_DIR, relatif);
  await mkdir(dirname(absolut), { recursive: true });
  await writeFile(absolut, pdf);

  await prisma.pengajuanSurat.update({
    where: { id },
    data: {
      nomorSurat,
      kodeVerifikasi,
      // Hash dihitung dari PDF final. Satu huruf diubah, hash tidak lagi cocok —
      // inilah yang sebenarnya diperiksa halaman verifikasi.
      hashDokumen: hitungHash(pdf),
      pdfPath: relatif,
      ditandatanganiOleh: kades?.penduduk.nama ?? null,
      ditandatanganiPada: tanggalTerbit,
      status: 'SIAP_DIAMBIL',
      riwayat: {
        create: {
          status: 'SIAP_DIAMBIL',
          catatan: `Surat terbit dengan nomor ${nomorSurat}`,
          olehUserId: req.user!.sub,
        },
      },
    },
  });

  await catatAudit(req, 'TERBITKAN_SURAT', 'PengajuanSurat', id, {
    nomorSurat,
    kodeVerifikasi,
    kodeLacak: p.kodeLacak,
  });

  return {
    id,
    nomorSurat,
    kodeVerifikasi,
    peringatan: kosong.length
      ? `Ada isian yang belum terisi dan tercetak apa adanya: ${kosong.join(', ')}`
      : undefined,
  };
}

/**
 * Verifikasi publik — dibuka siapa saja yang memindai QR pada lembar surat.
 *
 * Yang ditampilkan sengaja seminimal mungkin: cukup untuk memastikan surat itu
 * asli, tanpa membocorkan data pribadi pemohon. Nama pun disamarkan sebagian,
 * karena tautan ini bisa dibuka siapa pun yang memegang atau memotret surat.
 */
export async function verifikasiSurat(kode: string) {
  const p = await prisma.pengajuanSurat.findUnique({
    where: { kodeVerifikasi: kode.toUpperCase() },
    include: {
      template: { select: { nama: true } },
      pemohon: { include: { penduduk: { select: { nama: true } } } },
    },
  });

  if (!p || !p.nomorSurat) {
    return { sah: false as const, pesan: 'Kode tidak dikenali. Surat ini tidak terdaftar.' };
  }

  await prisma.pengajuanSurat.update({
    where: { id: p.id },
    data: { jumlahVerifikasi: { increment: 1 } },
  });

  const nama = p.pemohon.penduduk?.nama ?? '';
  const namaSamar = nama
    .split(' ')
    .map((bagian, i) => (i === 0 ? bagian : `${bagian[0] ?? ''}${'*'.repeat(Math.max(bagian.length - 1, 0))}`))
    .join(' ');

  return {
    sah: true as const,
    nomorSurat: p.nomorSurat,
    jenis: p.template.nama,
    atasNama: namaSamar,
    tanggalTerbit: p.ditandatanganiPada,
    ditandatanganiOleh: p.ditandatanganiOleh,
    hashDokumen: p.hashDokumen,
    jumlahVerifikasi: p.jumlahVerifikasi + 1,
  };
}

export async function berkasPdf(req: Request, id: string, hanyaMilikSendiri: boolean) {
  const p = await prisma.pengajuanSurat.findUnique({ where: { id } });
  if (!p?.pdfPath) throw new AppError(404, 'BELUM_TERBIT', 'Surat belum diterbitkan');
  if (hanyaMilikSendiri && p.pemohonId !== req.user!.sub) {
    throw new AppError(403, 'AKSES_DITOLAK', 'Ini bukan surat Anda');
  }

  await catatAudit(req, 'UNDUH_SURAT', 'PengajuanSurat', id, { kodeLacak: p.kodeLacak });
  return { path: join(env.UPLOAD_DIR, p.pdfPath), nama: `${p.kodeLacak}.pdf` };
}
