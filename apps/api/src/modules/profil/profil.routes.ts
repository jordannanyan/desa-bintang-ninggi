import { Router, type NextFunction, type Request, type Response } from 'express';
import { perangkatSchema, profilDesaSchema } from '@desa/shared';
import { prisma } from '../../lib/prisma.js';
import { validasi } from '../../middleware/validate.js';
import { wajibLogin, wajibPeran } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { statistikKependudukan } from '../penduduk/penduduk.service.js';

export const profilRoutes = Router();
export const berandaRoutes = Router();

const async_ =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const perangkat = [wajibLogin, wajibPeran('PERANGKAT', 'ADMIN')] as const;

// ── Profil desa (satu baris) ──

profilRoutes.get(
  '/',
  async_(async (_req, res) => {
    const profil = await prisma.profilDesa.findUnique({ where: { id: 1 } });
    res.json({ ok: true, data: profil });
  }),
);

profilRoutes.put(
  '/',
  ...perangkat,
  validasi(profilDesaSchema),
  async_(async (req, res) => {
    const profil = await prisma.profilDesa.upsert({
      where: { id: 1 },
      update: req.body,
      create: { id: 1, ...req.body },
    });
    res.json({ ok: true, data: { id: profil.id } });
  }),
);

// ── Perangkat desa ──

profilRoutes.get(
  '/perangkat',
  async_(async (_req, res) => {
    const daftar = await prisma.perangkat.findMany({
      where: { aktif: true },
      orderBy: [{ urutan: 'asc' }, { jabatan: 'asc' }],
      include: { penduduk: { select: { nama: true } } },
    });

    // Hanya nama dan jabatan yang dibuka ke publik. Sisa data penduduk
    // perangkat desa bukan konsumsi umum hanya karena mereka pejabat.
    res.json({
      ok: true,
      data: daftar.map((p) => ({
        id: p.id,
        nama: p.penduduk.nama,
        jabatan: p.jabatan,
        uraianTugas: p.uraianTugas,
        fotoUrl: p.fotoUrl,
        urutan: p.urutan,
      })),
    });
  }),
);

profilRoutes.post(
  '/perangkat',
  ...perangkat,
  validasi(perangkatSchema),
  async_(async (req, res) => {
    const ada = await prisma.perangkat.findUnique({
      where: { pendudukId: req.body.pendudukId },
    });
    if (ada) {
      throw new AppError(409, 'SUDAH_TERDAFTAR', 'Orang ini sudah terdaftar sebagai perangkat');
    }

    const p = await prisma.perangkat.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: p.id } });
  }),
);

profilRoutes.put(
  '/perangkat/:id',
  ...perangkat,
  validasi(perangkatSchema),
  async_(async (req, res) => {
    await prisma.perangkat.update({ where: { id: req.params.id }, data: req.body });
    res.json({ ok: true, data: { id: req.params.id } });
  }),
);

profilRoutes.delete(
  '/perangkat/:id',
  ...perangkat,
  async_(async (req, res) => {
    // Dinonaktifkan, bukan dihapus: surat yang pernah ditandatangani orang ini
    // tetap harus bisa ditelusuri siapa penandatangannya.
    await prisma.perangkat.update({
      where: { id: req.params.id },
      data: { aktif: false, akhirMenjabat: new Date() },
    });
    res.json({ ok: true, data: { dinonaktifkan: true } });
  }),
);

// ── Lembaga desa ──

profilRoutes.get(
  '/lembaga',
  async_(async (_req, res) => {
    const data = await prisma.lembaga.findMany({
      include: { anggota: { orderBy: { urutan: 'asc' } } },
    });
    res.json({ ok: true, data });
  }),
);

// ── Beranda ──

/**
 * Satu panggilan untuk seluruh isi halaman muka.
 *
 * Digabung karena beranda dibuka paling sering, sering dari ponsel dengan
 * sinyal seadanya: satu permintaan jauh lebih baik daripada lima permintaan
 * paralel yang masing-masing menunggu koneksi.
 */
berandaRoutes.get(
  '/',
  async_(async (_req, res) => {
    const kini = new Date();

    const [profil, statistik, berita, pengumuman, agenda, jumlahUmkm, jumlahRt] =
      await Promise.all([
        prisma.profilDesa.findUnique({ where: { id: 1 } }),
        statistikKependudukan(),
        prisma.berita.findMany({
          where: { terbit: true },
          orderBy: { terbitPada: 'desc' },
          take: 3,
          select: {
            slug: true,
            judul: true,
            ringkasan: true,
            sampulUrl: true,
            terbitPada: true,
          },
        }),
        prisma.pengumuman.findMany({
          where: {
            mulai: { lte: kini },
            OR: [{ selesai: null }, { selesai: { gte: kini } }],
          },
          orderBy: [{ penting: 'desc' }, { mulai: 'desc' }],
          take: 3,
          select: { id: true, judul: true, penting: true, mulai: true },
        }),
        prisma.agenda.findMany({
          where: { mulai: { gte: kini } },
          orderBy: { mulai: 'asc' },
          take: 3,
          select: { id: true, judul: true, kategori: true, mulai: true, lokasi: true },
        }),
        prisma.umkm.count({ where: { aktif: true } }),
        prisma.rt.count(),
      ]);

    res.json({
      ok: true,
      data: {
        profil: profil && {
          namaDesa: profil.namaDesa,
          kecamatan: profil.kecamatan,
          kabupaten: profil.kabupaten,
          sambutanKades: profil.sambutanKades,
          videoProfilUrl: profil.videoProfilUrl,
          jamPelayanan: profil.jamPelayanan,
          nomorDarurat: profil.nomorDarurat,
          luasWilayahKm: profil.luasWilayahKm,
        },
        statistik: {
          totalPenduduk: statistik.totalPenduduk,
          totalKk: statistik.totalKk,
          totalUmkm: jumlahUmkm,
          totalRt: jumlahRt,
          luasWilayahKm: profil?.luasWilayahKm ?? null,
        },
        berita,
        pengumuman,
        agenda,
      },
    });
  }),
);
