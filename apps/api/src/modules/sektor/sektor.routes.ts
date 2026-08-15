import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  JENIS_FASILITAS,
  JENIS_LOWONGAN,
  SEKTOR,
  fasilitasSchema,
  hargaKomoditasSchema,
  informasiSektorSchema,
  lowonganSchema,
} from '@desa/shared';
import { prisma } from '../../lib/prisma.js';
import { validasi } from '../../middleware/validate.js';
import { wajibLogin, wajibPeran } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';

const async_ =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const perangkat = [wajibLogin, wajibPeran('PERANGKAT', 'ADMIN')] as const;
const angka = (v: unknown) => (v === null || v === undefined ? null : Number(v));

// ─────────────────────────────────────────────
// INFORMASI SEKTORAL
// ─────────────────────────────────────────────

export const informasiRoutes = Router();

informasiRoutes.get(
  '/',
  validasi(z.object({ sektor: z.enum(SEKTOR).optional() }), 'query'),
  async_(async (req, res) => {
    const { sektor } = res.locals.query;
    const bolehLihatDraf = req.user?.peran === 'PERANGKAT' || req.user?.peran === 'ADMIN';

    const data = await prisma.informasiSektor.findMany({
      where: { ...(sektor ? { sektor } : {}), ...(bolehLihatDraf ? {} : { terbit: true }) },
      orderBy: [{ kategori: 'asc' }, { urutan: 'asc' }, { dibuatPada: 'desc' }],
      include: { gambar: true, lampiran: true },
    });

    res.json({
      ok: true,
      data: data.map((i) => ({
        id: i.id,
        sektor: i.sektor,
        kategori: i.kategori,
        judul: i.judul,
        isi: i.isi,
        terbit: i.terbit,
        urutan: i.urutan,
        gambarUrl: i.gambar ? `/uploads/${i.gambar.path}` : null,
        lampiranUrl: i.lampiran ? `/uploads/${i.lampiran.path}` : null,
        diperbaruiPada: i.diperbaruiPada,
      })),
    });
  }),
);

informasiRoutes.post(
  '/',
  ...perangkat,
  validasi(informasiSektorSchema),
  async_(async (req, res) => {
    const i = await prisma.informasiSektor.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: i.id } });
  }),
);

informasiRoutes.put(
  '/:id',
  ...perangkat,
  validasi(informasiSektorSchema),
  async_(async (req, res) => {
    await prisma.informasiSektor.update({ where: { id: req.params.id }, data: req.body });
    res.json({ ok: true, data: { id: req.params.id } });
  }),
);

informasiRoutes.delete(
  '/:id',
  ...perangkat,
  async_(async (req, res) => {
    await prisma.informasiSektor.delete({ where: { id: req.params.id } });
    res.json({ ok: true, data: { dihapus: true } });
  }),
);

// ─────────────────────────────────────────────
// FASILITAS
// ─────────────────────────────────────────────

export const fasilitasRoutes = Router();

fasilitasRoutes.get(
  '/',
  validasi(z.object({ jenis: z.string().optional() }), 'query'),
  async_(async (_req, res) => {
    const { jenis } = res.locals.query;
    const daftar = jenis
      ? jenis
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => (JENIS_FASILITAS as readonly string[]).includes(s))
      : [];

    const data = await prisma.fasilitas.findMany({
      where: { aktif: true, ...(daftar.length ? { jenis: { in: daftar } } : {}) },
      orderBy: [{ jenis: 'asc' }, { nama: 'asc' }],
      include: { foto: true },
    });

    res.json({
      ok: true,
      data: data.map((f) => ({
        id: f.id,
        jenis: f.jenis,
        nama: f.nama,
        alamat: f.alamat,
        latitude: angka(f.latitude),
        longitude: angka(f.longitude),
        kontak: f.kontak,
        jamOperasional: f.jamOperasional,
        keterangan: f.keterangan,
        fotoUrl: f.foto ? `/uploads/${f.foto.path}` : null,
      })),
    });
  }),
);

fasilitasRoutes.post(
  '/',
  ...perangkat,
  validasi(fasilitasSchema),
  async_(async (req, res) => {
    const f = await prisma.fasilitas.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: f.id } });
  }),
);

fasilitasRoutes.put(
  '/:id',
  ...perangkat,
  validasi(fasilitasSchema),
  async_(async (req, res) => {
    await prisma.fasilitas.update({ where: { id: req.params.id }, data: req.body });
    res.json({ ok: true, data: { id: req.params.id } });
  }),
);

fasilitasRoutes.delete(
  '/:id',
  ...perangkat,
  async_(async (req, res) => {
    await prisma.fasilitas.update({ where: { id: req.params.id }, data: { aktif: false } });
    res.json({ ok: true, data: { dinonaktifkan: true } });
  }),
);

// ─────────────────────────────────────────────
// HARGA KOMODITAS
// ─────────────────────────────────────────────

export const hargaRoutes = Router();

/**
 * Harga terbaru per komoditas, beserta perubahannya dari catatan sebelumnya.
 *
 * Arah pergerakan dihitung di sini karena itulah yang sebenarnya dicari
 * petani dan nelayan: bukan angka hari ini saja, melainkan naik atau turun.
 */
hargaRoutes.get(
  '/',
  validasi(z.object({ sektor: z.enum(SEKTOR).optional() }), 'query'),
  async_(async (_req, res) => {
    const { sektor } = res.locals.query;

    const semua = await prisma.hargaKomoditas.findMany({
      where: sektor ? { sektor } : {},
      orderBy: [{ komoditas: 'asc' }, { tanggal: 'desc' }],
      take: 500,
    });

    const perKomoditas = new Map<string, typeof semua>();
    for (const h of semua) {
      const kunci = `${h.sektor}|${h.komoditas}`;
      perKomoditas.set(kunci, [...(perKomoditas.get(kunci) ?? []), h]);
    }

    res.json({
      ok: true,
      data: [...perKomoditas.values()].map((riwayat) => {
        const kini = riwayat[0];
        const lalu = riwayat[1];
        return {
          sektor: kini.sektor,
          komoditas: kini.komoditas,
          satuan: kini.satuan,
          harga: Number(kini.harga),
          tanggal: kini.tanggal,
          sumber: kini.sumber,
          hargaSebelumnya: lalu ? Number(lalu.harga) : null,
          tanggalSebelumnya: lalu?.tanggal ?? null,
          riwayat: riwayat.slice(0, 12).map((r) => ({
            tanggal: r.tanggal,
            harga: Number(r.harga),
          })),
        };
      }),
    });
  }),
);

hargaRoutes.post(
  '/',
  ...perangkat,
  validasi(hargaKomoditasSchema),
  async_(async (req, res) => {
    // Satu komoditas hanya punya satu catatan per tanggal. Pencatatan ulang
    // di hari yang sama memperbaiki angkanya, bukan menambah baris kembar.
    const h = await prisma.hargaKomoditas.upsert({
      where: {
        sektor_komoditas_tanggal: {
          sektor: req.body.sektor,
          komoditas: req.body.komoditas,
          tanggal: req.body.tanggal,
        },
      },
      update: req.body,
      create: req.body,
    });
    res.status(201).json({ ok: true, data: { id: h.id } });
  }),
);

hargaRoutes.delete(
  '/:id',
  ...perangkat,
  async_(async (req, res) => {
    await prisma.hargaKomoditas.delete({ where: { id: req.params.id } });
    res.json({ ok: true, data: { dihapus: true } });
  }),
);

// ─────────────────────────────────────────────
// LOWONGAN KERJA
// ─────────────────────────────────────────────

export const lowonganRoutes = Router();

lowonganRoutes.get(
  '/',
  validasi(z.object({ jenis: z.enum(JENIS_LOWONGAN).optional() }), 'query'),
  async_(async (_req, res) => {
    const { jenis } = res.locals.query;

    const data = await prisma.lowongan.findMany({
      where: { aktif: true, ...(jenis ? { jenis } : {}) },
      orderBy: [{ dibuatPada: 'desc' }],
      take: 100,
    });

    const kini = new Date();
    res.json({
      ok: true,
      // Yang batas lamarnya sudah lewat tetap ditampilkan tapi ditandai,
      // supaya warga tahu lowongan itu pernah ada dan tidak terus bertanya.
      data: data.map((l) => ({ ...l, kedaluwarsa: Boolean(l.batasLamar && l.batasLamar < kini) })),
    });
  }),
);

lowonganRoutes.post(
  '/',
  ...perangkat,
  validasi(lowonganSchema),
  async_(async (req, res) => {
    const l = await prisma.lowongan.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: l.id } });
  }),
);

lowonganRoutes.put(
  '/:id',
  ...perangkat,
  validasi(lowonganSchema),
  async_(async (req, res) => {
    await prisma.lowongan.update({ where: { id: req.params.id }, data: req.body });
    res.json({ ok: true, data: { id: req.params.id } });
  }),
);

lowonganRoutes.delete(
  '/:id',
  ...perangkat,
  async_(async (req, res) => {
    await prisma.lowongan.delete({ where: { id: req.params.id } });
    res.json({ ok: true, data: { dihapus: true } });
  }),
);

// ─────────────────────────────────────────────
// BANTUAN SOSIAL
// ─────────────────────────────────────────────

export const bantuanRoutes = Router();

const programSchema = z.object({
  kode: z.string().min(2).max(30),
  nama: z.string().min(3).max(150),
  deskripsi: z.string().max(2000).optional(),
  tahun: z.coerce.number().int().min(2015).max(2100),
  aktif: z.boolean().default(true),
});

/** Daftar program bantuan. Publik — programnya memang perlu diketahui warga. */
bantuanRoutes.get(
  '/',
  async_(async (_req, res) => {
    const data = await prisma.programBantuan.findMany({
      orderBy: [{ tahun: 'desc' }, { nama: 'asc' }],
      include: { _count: { select: { penerima: true } } },
    });

    res.json({
      ok: true,
      // Jumlah penerima dibuka sebagai angka agregat, tetapi daftar namanya
      // tidak. Siapa yang menerima bantuan adalah informasi yang sensitif
      // secara sosial di desa.
      data: data.map((p) => ({
        id: p.id,
        kode: p.kode,
        nama: p.nama,
        deskripsi: p.deskripsi,
        tahun: p.tahun,
        aktif: p.aktif,
        jumlahPenerima: p._count.penerima,
      })),
    });
  }),
);

/**
 * Status bantuan milik sendiri.
 *
 * Diambil dari sesi, BUKAN dari NIK yang diketik. Endpoint publik yang
 * menerima NIK bisa dipakai menyisir siapa saja penerima bantuan di desa.
 */
bantuanRoutes.get(
  '/saya',
  wajibLogin,
  async_(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.sub } });
    if (!user?.pendudukId) {
      throw new AppError(
        400,
        'DATA_PENDUDUK_TIDAK_ADA',
        'Akun Anda belum tertaut ke data penduduk. Hubungi kantor desa.',
      );
    }

    const data = await prisma.penerimaBantuan.findMany({
      where: { pendudukId: user.pendudukId },
      orderBy: { periode: 'desc' },
      include: { program: true },
    });

    res.json({
      ok: true,
      data: data.map((p) => ({
        id: p.id,
        program: p.program.nama,
        kode: p.program.kode,
        tahun: p.program.tahun,
        periode: p.periode,
        nominal: p.nominal ? Number(p.nominal) : null,
        status: p.status,
        dicairkanPada: p.dicairkanPada,
      })),
    });
  }),
);

bantuanRoutes.post(
  '/',
  ...perangkat,
  validasi(programSchema),
  async_(async (req, res) => {
    const p = await prisma.programBantuan.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: p.id } });
  }),
);

bantuanRoutes.post(
  '/:id/penerima',
  ...perangkat,
  validasi(
    z.object({
      pendudukId: z.string().uuid(),
      periode: z.string().min(4).max(20),
      nominal: z.coerce.number().nonnegative().optional(),
      status: z.string().max(30).default('TERDAFTAR'),
    }),
  ),
  async_(async (req, res) => {
    const p = await prisma.penerimaBantuan.create({
      data: { ...req.body, programId: req.params.id },
    });
    res.status(201).json({ ok: true, data: { id: p.id } });
  }),
);

// ─────────────────────────────────────────────
// PETA DESA
// ─────────────────────────────────────────────

export const petaRoutes = Router();

/**
 * Seluruh titik yang punya koordinat, dikumpulkan dari data yang sudah ada.
 *
 * Peta tidak menyimpan datanya sendiri: fasilitas, proyek, dan UMKM sudah
 * punya koordinat masing-masing. Menyalinnya ke tabel peta hanya akan
 * membuat dua sumber kebenaran yang cepat berbeda isi.
 *
 * Pengaduan sengaja TIDAK ikut. Titiknya menunjuk ke rumah pelapor.
 */
petaRoutes.get(
  '/',
  async_(async (_req, res) => {
    const [fasilitas, proyek, umkm, profil] = await Promise.all([
      prisma.fasilitas.findMany({
        where: { aktif: true, latitude: { not: null } },
        select: { id: true, nama: true, jenis: true, alamat: true, latitude: true, longitude: true },
      }),
      prisma.proyek.findMany({
        where: { latitude: { not: null } },
        select: { id: true, nama: true, lokasi: true, status: true, latitude: true, longitude: true },
      }),
      prisma.umkm.findMany({
        where: { aktif: true, latitude: { not: null } },
        select: { id: true, nama: true, kategori: true, alamat: true, latitude: true, longitude: true },
      }),
      prisma.profilDesa.findUnique({ where: { id: 1 } }),
    ]);

    res.json({
      ok: true,
      data: {
        pusat: {
          latitude: angka(profil?.latitude) ?? -1.044231,
          longitude: angka(profil?.longitude) ?? 114.84645,
        },
        titik: [
          ...fasilitas.map((f) => ({
            id: f.id,
            lapisan: 'FASILITAS',
            jenis: f.jenis,
            nama: f.nama,
            keterangan: f.alamat,
            latitude: angka(f.latitude)!,
            longitude: angka(f.longitude)!,
            tautan: null,
          })),
          ...proyek.map((p) => ({
            id: p.id,
            lapisan: 'PROYEK',
            jenis: p.status,
            nama: p.nama,
            keterangan: p.lokasi,
            latitude: angka(p.latitude)!,
            longitude: angka(p.longitude)!,
            tautan: `/pembangunan/${p.id}`,
          })),
          ...umkm.map((u) => ({
            id: u.id,
            lapisan: 'UMKM',
            jenis: u.kategori,
            nama: u.nama,
            keterangan: u.alamat,
            latitude: angka(u.latitude)!,
            longitude: angka(u.longitude)!,
            tautan: `/umkm/${u.id}`,
          })),
        ],
      },
    });
  }),
);
