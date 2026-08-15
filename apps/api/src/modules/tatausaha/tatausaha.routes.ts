import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { validasi } from '../../middleware/validate.js';
import { wajibLogin, wajibPeran } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { dekripsi } from '../../lib/crypto.js';
import { AKSI, catatAudit } from '../../lib/audit.js';

const async_ =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const perangkat = [wajibLogin, wajibPeran('PERANGKAT', 'ADMIN')] as const;
const angka = (v: unknown) => Number(v ?? 0);

/** Mengambil pendudukId dari sesi. Dipakai seluruh endpoint "milik saya". */
async function pendudukSaya(req: Request) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
  if (!user?.pendudukId) {
    throw new AppError(
      400,
      'DATA_PENDUDUK_TIDAK_ADA',
      'Akun Anda belum tertaut ke data penduduk. Hubungi kantor desa.',
    );
  }
  return user.pendudukId;
}

// ─────────────────────────────────────────────
// ABSENSI PERANGKAT
// ─────────────────────────────────────────────

export const absensiRoutes = Router();

const absensiSchema = z.object({
  perangkatId: z.string().uuid(),
  tanggal: z.coerce.date(),
  status: z.enum(['HADIR', 'IZIN', 'SAKIT', 'DINAS_LUAR', 'ALPA']).default('HADIR'),
  jamMasuk: z.string().max(5).optional(),
  jamPulang: z.string().max(5).optional(),
  catatan: z.string().max(255).optional(),
});

absensiRoutes.get(
  '/',
  ...perangkat,
  validasi(z.object({ bulan: z.string().optional() }), 'query'),
  async_(async (_req, res) => {
    // Bawaannya bulan berjalan: itulah rentang yang hampir selalu dilihat.
    const acuan = res.locals.query.bulan ? new Date(`${res.locals.query.bulan}-01`) : new Date();
    const awal = new Date(acuan.getFullYear(), acuan.getMonth(), 1);
    const akhir = new Date(acuan.getFullYear(), acuan.getMonth() + 1, 0);

    const [daftarPerangkat, absensi] = await Promise.all([
      prisma.perangkat.findMany({
        where: { aktif: true },
        orderBy: { urutan: 'asc' },
        include: { penduduk: { select: { nama: true } } },
      }),
      prisma.absensi.findMany({
        where: { tanggal: { gte: awal, lte: akhir } },
        orderBy: { tanggal: 'desc' },
      }),
    ]);

    res.json({
      ok: true,
      data: {
        bulan: `${awal.getFullYear()}-${String(awal.getMonth() + 1).padStart(2, '0')}`,
        perangkat: daftarPerangkat.map((p) => {
          const miliknya = absensi.filter((a) => a.perangkatId === p.id);
          const hitung = (s: string) => miliknya.filter((a) => a.status === s).length;
          return {
            id: p.id,
            nama: p.penduduk.nama,
            jabatan: p.jabatan,
            hadir: hitung('HADIR'),
            izin: hitung('IZIN'),
            sakit: hitung('SAKIT'),
            dinasLuar: hitung('DINAS_LUAR'),
            alpa: hitung('ALPA'),
          };
        }),
        catatan: absensi.map((a) => ({
          id: a.id,
          perangkatId: a.perangkatId,
          tanggal: a.tanggal,
          status: a.status,
          jamMasuk: a.jamMasuk,
          jamPulang: a.jamPulang,
          catatan: a.catatan,
        })),
      },
    });
  }),
);

absensiRoutes.post(
  '/',
  ...perangkat,
  validasi(absensiSchema),
  async_(async (req, res) => {
    const { perangkatId, tanggal, ...sisa } = req.body;
    // Satu catatan per orang per hari. Pencatatan ulang memperbaiki angkanya,
    // bukan menambah baris kembar yang membuat rekap tidak bisa dipercaya.
    const a = await prisma.absensi.upsert({
      where: { perangkatId_tanggal: { perangkatId, tanggal } },
      update: sisa,
      create: { perangkatId, tanggal, ...sisa },
    });
    res.status(201).json({ ok: true, data: { id: a.id } });
  }),
);

// ─────────────────────────────────────────────
// INVENTARIS ASET
// ─────────────────────────────────────────────

export const asetRoutes = Router();

const asetSchema = z.object({
  nama: z.string().min(3).max(150),
  kategori: z.string().min(2).max(80),
  kodeInventaris: z.string().max(60).optional(),
  tahunPerolehan: z.coerce.number().int().min(1900).max(2100),
  nilai: z.coerce.number().nonnegative(),
  jumlah: z.coerce.number().int().min(1).default(1),
  satuan: z.string().max(20).default('unit'),
  kondisi: z.enum(['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT']).default('BAIK'),
  lokasi: z.string().max(150).optional(),
  sumberDana: z.string().max(80).optional(),
  keterangan: z.string().max(2000).optional(),
  fotoId: z.string().uuid().optional(),
});

asetRoutes.get(
  '/',
  ...perangkat,
  async_(async (_req, res) => {
    const data = await prisma.aset.findMany({
      orderBy: [{ kategori: 'asc' }, { nama: 'asc' }],
      include: { foto: true },
    });

    const totalNilai = data.reduce((t, a) => t + angka(a.nilai) * a.jumlah, 0);

    res.json({
      ok: true,
      data: data.map((a) => ({
        ...a,
        nilai: angka(a.nilai),
        fotoUrl: a.foto ? `/uploads/${a.foto.path}` : null,
        foto: undefined,
      })),
      meta: {
        totalNilai,
        jumlahJenis: data.length,
        rusak: data.filter((a) => a.kondisi !== 'BAIK').length,
      },
    });
  }),
);

asetRoutes.post(
  '/',
  ...perangkat,
  validasi(asetSchema),
  async_(async (req, res) => {
    const a = await prisma.aset.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: a.id } });
  }),
);

asetRoutes.put(
  '/:id',
  ...perangkat,
  validasi(asetSchema),
  async_(async (req, res) => {
    await prisma.aset.update({ where: { id: req.params.id }, data: req.body });
    res.json({ ok: true, data: { id: req.params.id } });
  }),
);

asetRoutes.delete(
  '/:id',
  ...perangkat,
  async_(async (req, res) => {
    await prisma.aset.delete({ where: { id: req.params.id } });
    res.json({ ok: true, data: { dihapus: true } });
  }),
);

// ─────────────────────────────────────────────
// TAGIHAN & PAJAK DESA
// ─────────────────────────────────────────────

export const tagihanRoutes = Router();

const tagihanSchema = z.object({
  pendudukId: z.string().uuid(),
  jenis: z.enum(['PBB', 'IURAN_DESA', 'SEWA_ASET', 'LAINNYA']),
  judul: z.string().min(3).max(200),
  tahun: z.coerce.number().int().min(2015).max(2100),
  periode: z.string().max(20).optional(),
  jumlah: z.coerce.number().nonnegative(),
  jatuhTempo: z.coerce.date().optional(),
  catatan: z.string().max(255).optional(),
});

/** Tagihan milik sendiri, diambil dari sesi. */
tagihanRoutes.get(
  '/saya',
  wajibLogin,
  async_(async (req, res) => {
    const pendudukId = await pendudukSaya(req);
    const data = await prisma.tagihan.findMany({
      where: { pendudukId },
      orderBy: [{ status: 'asc' }, { jatuhTempo: 'asc' }],
    });

    res.json({
      ok: true,
      data: data.map((t) => ({ ...t, jumlah: angka(t.jumlah) })),
      meta: {
        belumBayar: data
          .filter((t) => t.status === 'BELUM_BAYAR')
          .reduce((s, t) => s + angka(t.jumlah), 0),
      },
    });
  }),
);

tagihanRoutes.get(
  '/',
  ...perangkat,
  validasi(z.object({ status: z.string().optional() }), 'query'),
  async_(async (_req, res) => {
    const { status } = res.locals.query;
    const data = await prisma.tagihan.findMany({
      where: status ? { status: status as never } : {},
      orderBy: [{ tahun: 'desc' }, { status: 'asc' }],
      take: 300,
      include: { penduduk: { select: { nama: true } } },
    });

    res.json({
      ok: true,
      data: data.map((t) => ({
        ...t,
        jumlah: angka(t.jumlah),
        penduduk: t.penduduk.nama,
      })),
    });
  }),
);

tagihanRoutes.post(
  '/',
  ...perangkat,
  validasi(tagihanSchema),
  async_(async (req, res) => {
    const t = await prisma.tagihan.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: t.id } });
  }),
);

tagihanRoutes.patch(
  '/:id/status',
  ...perangkat,
  validasi(z.object({ status: z.enum(['BELUM_BAYAR', 'LUNAS', 'DIBATALKAN']) })),
  async_(async (req, res) => {
    await prisma.tagihan.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status,
        dibayarPada: req.body.status === 'LUNAS' ? new Date() : null,
      },
    });
    res.json({ ok: true, data: { status: req.body.status } });
  }),
);

// ─────────────────────────────────────────────
// SERTIFIKAT & RIWAYAT KEGIATAN
// ─────────────────────────────────────────────

export const sertifikatRoutes = Router();

sertifikatRoutes.get(
  '/saya',
  wajibLogin,
  async_(async (req, res) => {
    const pendudukId = await pendudukSaya(req);
    const data = await prisma.sertifikat.findMany({
      where: { pendudukId },
      orderBy: { tanggalMulai: 'desc' },
      include: { berkas: true },
    });

    res.json({
      ok: true,
      data: data.map((s) => ({
        id: s.id,
        namaPelatihan: s.namaPelatihan,
        penyelenggara: s.penyelenggara,
        tanggalMulai: s.tanggalMulai,
        tanggalSelesai: s.tanggalSelesai,
        nomorSertifikat: s.nomorSertifikat,
        berkasUrl: s.berkas ? `/uploads/${s.berkas.path}` : null,
      })),
    });
  }),
);

sertifikatRoutes.post(
  '/',
  ...perangkat,
  validasi(
    z.object({
      pendudukId: z.string().uuid(),
      namaPelatihan: z.string().min(3).max(200),
      penyelenggara: z.string().min(2).max(150),
      tanggalMulai: z.coerce.date(),
      tanggalSelesai: z.coerce.date().optional(),
      nomorSertifikat: z.string().max(80).optional(),
      berkasId: z.string().uuid().optional(),
    }),
  ),
  async_(async (req, res) => {
    const s = await prisma.sertifikat.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: s.id } });
  }),
);

export const kegiatanRoutes = Router();

kegiatanRoutes.get(
  '/saya',
  wajibLogin,
  async_(async (req, res) => {
    const pendudukId = await pendudukSaya(req);
    const data = await prisma.kegiatanWarga.findMany({
      where: { pendudukId },
      orderBy: { tanggal: 'desc' },
    });
    res.json({ ok: true, data });
  }),
);

kegiatanRoutes.post(
  '/',
  ...perangkat,
  validasi(
    z.object({
      pendudukId: z.string().uuid(),
      agendaId: z.string().uuid().optional(),
      judul: z.string().min(3).max(200),
      tanggal: z.coerce.date(),
      peran: z.string().max(80).optional(),
      keterangan: z.string().max(255).optional(),
    }),
  ),
  async_(async (req, res) => {
    const k = await prisma.kegiatanWarga.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: k.id } });
  }),
);

// ─────────────────────────────────────────────
// DATA PRIBADI WARGA
// ─────────────────────────────────────────────

export const sayaRoutes = Router();

/**
 * Data kependudukan milik sendiri.
 *
 * NIK ditampilkan utuh di sini — berbeda dengan daftar penduduk yang
 * menyamarkannya. Ini data milik orang yang sedang melihatnya, dan ia memang
 * berhak tahu apa yang tercatat tentang dirinya.
 */
sayaRoutes.get(
  '/',
  wajibLogin,
  async_(async (req, res) => {
    const pendudukId = await pendudukSaya(req);
    const p = await prisma.penduduk.findUnique({
      where: { id: pendudukId },
      include: { kartuKeluarga: { include: { rt: { include: { rw: true } } } } },
    });
    if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Data penduduk tidak ditemukan');

    await catatAudit(req, AKSI.LIHAT_PENDUDUK, 'Penduduk', p.id, { miliknyaSendiri: true });

    res.json({
      ok: true,
      data: {
        nik: dekripsi(p.nikEnc),
        nomorKk: dekripsi(p.kartuKeluarga.nomorKkEnc),
        nama: p.nama,
        tempatLahir: p.tempatLahir,
        tanggalLahir: p.tanggalLahir,
        jenisKelamin: p.jenisKelamin,
        agama: p.agama,
        pendidikan: p.pendidikan,
        pekerjaan: p.pekerjaan,
        statusKawin: p.statusKawin,
        kewarganegaraan: p.kewarganegaraan,
        hubunganKeluarga: p.hubunganKeluarga,
        namaAyah: p.namaAyah,
        namaIbu: p.namaIbu,
        golonganDarah: p.golonganDarah,
        alamat: p.kartuKeluarga.alamat,
        rt: p.kartuKeluarga.rt.nomor,
        rw: p.kartuKeluarga.rt.rw.nomor,
        dusun: p.kartuKeluarga.dusun,
      },
    });
  }),
);

/**
 * Ringkasan untuk beranda dashboard warga.
 *
 * Yang ditampilkan hanya milik warga itu sendiri — tidak ada satu pun angka
 * sedesa di sini, karena beranda warga menjawab "apa yang sedang berjalan
 * untuk saya", bukan "seperti apa desa ini".
 */
sayaRoutes.get(
  '/ringkasan',
  wajibLogin,
  async_(async (req, res) => {
    const userId = req.user!.sub;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { penduduk: { select: { nama: true } } },
    });
    const pendudukId = user?.pendudukId ?? null;

    // Surat dan pesanan bergantung pada akun; tagihan, bantuan, dan sertifikat
    // bergantung pada data penduduk yang tertaut. Akun tanpa tautan tetap
    // dilayani dengan nol, bukan galat — ia masih bisa mengajukan surat.
    const [
      suratDiproses,
      suratSiapDiambil,
      pengaduanAktif,
      pesananAktif,
      tagihanBelum,
      tagihanNilai,
      bantuanAktif,
      sertifikat,
    ] = await Promise.all([
      prisma.pengajuanSurat.count({ where: { pemohonId: userId, status: 'DIPROSES' } }),
      prisma.pengajuanSurat.count({ where: { pemohonId: userId, status: 'SIAP_DIAMBIL' } }),
      prisma.pengaduan.count({
        where: { pelaporId: userId, status: { in: ['BARU', 'DIVERIFIKASI', 'DITANGANI'] } },
      }),
      prisma.pesanan.count({
        where: {
          pembeliId: userId,
          status: { in: ['MENUNGGU_PEMBAYARAN', 'MENUNGGU_VERIFIKASI', 'DIPROSES_PENJUAL'] },
        },
      }),
      pendudukId
        ? prisma.tagihan.count({ where: { pendudukId, status: 'BELUM_BAYAR' } })
        : Promise.resolve(0),
      pendudukId
        ? prisma.tagihan.aggregate({
            where: { pendudukId, status: 'BELUM_BAYAR' },
            _sum: { jumlah: true },
          })
        : Promise.resolve(null),
      pendudukId
        ? prisma.penerimaBantuan.count({ where: { pendudukId } })
        : Promise.resolve(0),
      pendudukId ? prisma.sertifikat.count({ where: { pendudukId } }) : Promise.resolve(0),
    ]);

    res.json({
      ok: true,
      data: {
        tertaut: Boolean(pendudukId),
        nama: user?.penduduk?.nama ?? null,
        suratDiproses,
        suratSiapDiambil,
        pengaduanAktif,
        pesananAktif,
        tagihanBelum,
        tagihanNilai: angka(tagihanNilai?._sum.jumlah),
        bantuanAktif,
        sertifikat,
      },
    });
  }),
);

// ─────────────────────────────────────────────
// STATISTIK DASHBOARD
// ─────────────────────────────────────────────

export const statistikRoutes = Router();

/** Nama bulan pendek untuk sumbu grafik — dibentuk sekali, dipakai berulang. */
const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** Enam bulan terakhir termasuk bulan berjalan, urut dari yang paling lama. */
function enamBulanTerakhir() {
  const kini = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(kini.getFullYear(), kini.getMonth() - (5 - i), 1);
    return {
      awal: d,
      akhir: new Date(d.getFullYear(), d.getMonth() + 1, 1),
      label: NAMA_BULAN[d.getMonth()],
    };
  });
}

/**
 * Angka-angka yang paling sering ditanyakan perangkat desa, dalam satu panggilan.
 *
 * Digabung karena beranda dashboard membukanya setiap kali perangkat desa
 * masuk: satu permintaan jauh lebih baik daripada belasan permintaan paralel.
 */
statistikRoutes.get(
  '/',
  ...perangkat,
  async_(async (_req, res) => {
    const tahunIni = new Date().getFullYear();
    const awalTahun = new Date(tahunIni, 0, 1);
    const aktif = { tanggalMeninggal: null, tanggalPindah: null };
    const bulan = enamBulanTerakhir();

    const [
      penduduk,
      kk,
      lakiLaki,
      perempuan,
      suratMenunggu,
      suratTerbitTahunIni,
      pengaduanBaru,
      pengaduanSelesai,
      umkm,
      proyekBerjalan,
      tagihanBelum,
      berita,
      dokumen,
      suratPerStatus,
      pengaduanPerKategori,
      asetPerKondisi,
      anggaran,
      masukPerBulan,
      terbitPerBulan,
      aduanPerBulan,
    ] = await Promise.all([
      prisma.penduduk.count({ where: aktif }),
      prisma.kartuKeluarga.count(),
      prisma.penduduk.count({ where: { ...aktif, jenisKelamin: 'LAKI_LAKI' } }),
      prisma.penduduk.count({ where: { ...aktif, jenisKelamin: 'PEREMPUAN' } }),
      prisma.pengajuanSurat.count({ where: { status: 'DIPROSES' } }),
      prisma.pengajuanSurat.count({
        where: { status: 'SIAP_DIAMBIL', ditandatanganiPada: { gte: awalTahun } },
      }),
      prisma.pengaduan.count({ where: { status: { in: ['BARU', 'DIVERIFIKASI'] } } }),
      prisma.pengaduan.count({ where: { status: 'SELESAI' } }),
      prisma.umkm.count({ where: { aktif: true } }),
      prisma.proyek.count({ where: { status: 'BERJALAN' } }),
      prisma.tagihan.count({ where: { status: 'BELUM_BAYAR' } }),
      prisma.berita.count({ where: { terbit: true } }),
      prisma.dokumen.count(),
      prisma.pengajuanSurat.groupBy({ by: ['status'], _count: true }),
      prisma.pengaduan.groupBy({ by: ['kategori'], _count: true }),
      prisma.aset.groupBy({ by: ['kondisi'], _count: true }),
      prisma.anggaran.findFirst({
        where: { tahun: tahunIni },
        orderBy: { versi: 'desc' },
        include: { item: { select: { jenis: true, pagu: true, realisasi: true } } },
      }),
      // Deret waktu dihitung sebagai enam hitungan terpisah, bukan satu query
      // GROUP BY tanggal: fungsi pemotong bulan berbeda antar versi
      // MySQL/MariaDB, dan enam COUNT bersamaan tetap murah pada skala desa.
      Promise.all(
        bulan.map((b) =>
          prisma.pengajuanSurat.count({ where: { dibuatPada: { gte: b.awal, lt: b.akhir } } }),
        ),
      ),
      Promise.all(
        bulan.map((b) =>
          prisma.pengajuanSurat.count({
            where: { ditandatanganiPada: { gte: b.awal, lt: b.akhir } },
          }),
        ),
      ),
      Promise.all(
        bulan.map((b) =>
          prisma.pengaduan.count({ where: { dibuatPada: { gte: b.awal, lt: b.akhir } } }),
        ),
      ),
    ]);

    const belanja = (anggaran?.item ?? []).filter((i) => i.jenis === 'BELANJA');
    const pendapatan = (anggaran?.item ?? []).filter((i) => i.jenis === 'PENDAPATAN');
    const jumlahkan = (
      daftar: { pagu: unknown; realisasi: unknown }[],
      kolom: 'pagu' | 'realisasi',
    ) => daftar.reduce((t, i) => t + angka(i[kolom]), 0);

    res.json({
      ok: true,
      data: {
        penduduk,
        kk,
        lakiLaki,
        perempuan,
        suratMenunggu,
        suratTerbitTahunIni,
        pengaduanBaru,
        pengaduanSelesai,
        umkm,
        proyekBerjalan,
        tagihanBelum,
        berita,
        dokumen,

        suratPerStatus: suratPerStatus.map((s) => ({ label: s.status, jumlah: s._count })),
        pengaduanPerKategori: pengaduanPerKategori.map((p) => ({
          label: p.kategori,
          jumlah: p._count,
        })),
        asetPerKondisi: asetPerKondisi.map((a) => ({ label: a.kondisi, jumlah: a._count })),

        keuangan: anggaran
          ? {
              tahun: anggaran.tahun,
              versi: anggaran.versi,
              pendapatanPagu: jumlahkan(pendapatan, 'pagu'),
              pendapatanRealisasi: jumlahkan(pendapatan, 'realisasi'),
              belanjaPagu: jumlahkan(belanja, 'pagu'),
              belanjaRealisasi: jumlahkan(belanja, 'realisasi'),
            }
          : null,

        tren: bulan.map((b, i) => ({
          label: b.label,
          suratMasuk: masukPerBulan[i],
          suratTerbit: terbitPerBulan[i],
          pengaduan: aduanPerBulan[i],
        })),
      },
    });
  }),
);
