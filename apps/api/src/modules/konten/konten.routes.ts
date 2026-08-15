import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { agendaSchema, beritaSchema, pengumumanSchema } from '@desa/shared';
import { prisma } from '../../lib/prisma.js';
import { validasi } from '../../middleware/validate.js';
import { wajibLogin, wajibPeran } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';

const async_ =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const perangkat = [wajibLogin, wajibPeran('PERANGKAT', 'ADMIN')] as const;

const halamanSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(10),
});

/**
 * Slug dibuat dari judul, dengan akhiran acak bila bentrok.
 * Dipakai di URL berita supaya alamatnya terbaca manusia, bukan UUID.
 */
async function buatSlug(judul: string, kecualiId?: string): Promise<string> {
  const dasar =
    judul
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80) || 'berita';

  for (let i = 0; i < 20; i++) {
    const kandidat = i === 0 ? dasar : `${dasar}-${i + 1}`;
    const ada = await prisma.berita.findUnique({ where: { slug: kandidat } });
    if (!ada || ada.id === kecualiId) return kandidat;
  }
  return `${dasar}-${Date.now()}`;
}

// ─────────────────────────────────────────────
// BERITA
// ─────────────────────────────────────────────

export const beritaRoutes = Router();

beritaRoutes.get(
  '/',
  validasi(halamanSchema, 'query'),
  async_(async (req, res) => {
    const { page, perPage } = res.locals.query;
    // Tamu hanya melihat yang sudah terbit; perangkat desa juga melihat draf.
    const bolehLihatDraf = req.user?.peran === 'PERANGKAT' || req.user?.peran === 'ADMIN';
    const where = bolehLihatDraf ? {} : { terbit: true };

    const [total, data] = await Promise.all([
      prisma.berita.count({ where }),
      prisma.berita.findMany({
        where,
        orderBy: [{ terbitPada: 'desc' }, { dibuatPada: 'desc' }],
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          slug: true,
          judul: true,
          ringkasan: true,
          sampulUrl: true,
          penulis: true,
          terbit: true,
          terbitPada: true,
          dilihat: true,
        },
      }),
    ]);

    res.json({ ok: true, data, meta: { page, perPage, total } });
  }),
);

beritaRoutes.get(
  '/:slug',
  async_(async (req, res) => {
    const berita = await prisma.berita.findUnique({ where: { slug: req.params.slug } });
    if (!berita) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Berita tidak ditemukan');

    const bolehLihatDraf = req.user?.peran === 'PERANGKAT' || req.user?.peran === 'ADMIN';
    if (!berita.terbit && !bolehLihatDraf) {
      throw new AppError(404, 'TIDAK_DITEMUKAN', 'Berita tidak ditemukan');
    }

    if (berita.terbit) {
      await prisma.berita.update({
        where: { id: berita.id },
        data: { dilihat: { increment: 1 } },
      });
    }

    res.json({ ok: true, data: berita });
  }),
);

beritaRoutes.post(
  '/',
  ...perangkat,
  validasi(beritaSchema),
  async_(async (req, res) => {
    const berita = await prisma.berita.create({
      data: {
        ...req.body,
        slug: await buatSlug(req.body.judul),
        terbitPada: req.body.terbit ? new Date() : null,
      },
    });
    res.status(201).json({ ok: true, data: { id: berita.id, slug: berita.slug } });
  }),
);

beritaRoutes.put(
  '/:id',
  ...perangkat,
  validasi(beritaSchema),
  async_(async (req, res) => {
    const lama = await prisma.berita.findUnique({ where: { id: req.params.id } });
    if (!lama) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Berita tidak ditemukan');

    const berita = await prisma.berita.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        slug: await buatSlug(req.body.judul, lama.id),
        // Tanggal terbit ditetapkan sekali, saat pertama kali diterbitkan.
        // Menyunting berita lama tidak boleh melompatkannya ke urutan teratas.
        terbitPada: req.body.terbit ? (lama.terbitPada ?? new Date()) : null,
      },
    });
    res.json({ ok: true, data: { id: berita.id, slug: berita.slug } });
  }),
);

beritaRoutes.delete(
  '/:id',
  ...perangkat,
  async_(async (req, res) => {
    await prisma.berita.delete({ where: { id: req.params.id } });
    res.json({ ok: true, data: { dihapus: true } });
  }),
);

// ─────────────────────────────────────────────
// PENGUMUMAN
// ─────────────────────────────────────────────

export const pengumumanRoutes = Router();

pengumumanRoutes.get(
  '/',
  async_(async (req, res) => {
    // Bawaannya hanya yang masih berlaku hari ini — pengumuman kedaluwarsa
    // di halaman depan lebih membingungkan daripada tidak ada pengumuman.
    const semua = req.query.semua === 'true';
    const kini = new Date();

    const data = await prisma.pengumuman.findMany({
      where: semua
        ? {}
        : {
            mulai: { lte: kini },
            OR: [{ selesai: null }, { selesai: { gte: kini } }],
          },
      orderBy: [{ penting: 'desc' }, { mulai: 'desc' }],
      take: semua ? 100 : 20,
    });

    res.json({ ok: true, data });
  }),
);

pengumumanRoutes.post(
  '/',
  ...perangkat,
  validasi(pengumumanSchema),
  async_(async (req, res) => {
    const p = await prisma.pengumuman.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: p.id } });
  }),
);

pengumumanRoutes.put(
  '/:id',
  ...perangkat,
  validasi(pengumumanSchema),
  async_(async (req, res) => {
    await prisma.pengumuman.update({ where: { id: req.params.id }, data: req.body });
    res.json({ ok: true, data: { id: req.params.id } });
  }),
);

pengumumanRoutes.delete(
  '/:id',
  ...perangkat,
  async_(async (req, res) => {
    await prisma.pengumuman.delete({ where: { id: req.params.id } });
    res.json({ ok: true, data: { dihapus: true } });
  }),
);

// ─────────────────────────────────────────────
// AGENDA
// ─────────────────────────────────────────────

export const agendaRoutes = Router();

agendaRoutes.get(
  '/',
  async_(async (req, res) => {
    const lampau = req.query.lampau === 'true';
    const kini = new Date();

    const data = await prisma.agenda.findMany({
      where: lampau ? { mulai: { lt: kini } } : { mulai: { gte: kini } },
      orderBy: { mulai: lampau ? 'desc' : 'asc' },
      take: 50,
    });

    res.json({ ok: true, data });
  }),
);

agendaRoutes.post(
  '/',
  ...perangkat,
  validasi(agendaSchema),
  async_(async (req, res) => {
    const a = await prisma.agenda.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: a.id } });
  }),
);

agendaRoutes.put(
  '/:id',
  ...perangkat,
  validasi(agendaSchema),
  async_(async (req, res) => {
    await prisma.agenda.update({ where: { id: req.params.id }, data: req.body });
    res.json({ ok: true, data: { id: req.params.id } });
  }),
);

agendaRoutes.delete(
  '/:id',
  ...perangkat,
  async_(async (req, res) => {
    await prisma.agenda.delete({ where: { id: req.params.id } });
    res.json({ ok: true, data: { dihapus: true } });
  }),
);

// ─────────────────────────────────────────────
// GALERI
// ─────────────────────────────────────────────

export const galeriRoutes = Router();

const galeriSchema = z
  .object({
    judul: z.string().min(3).max(200),
    jenis: z.enum(['FOTO', 'VIDEO', 'DRONE']),
    berkasId: z.string().uuid().optional(),
    urlEksternal: z.string().max(255).optional(),
    keterangan: z.string().max(2000).optional(),
  })
  .refine((v) => v.berkasId || v.urlEksternal, {
    message: 'Unggah berkas atau isi tautan videonya',
    path: ['berkasId'],
  });

galeriRoutes.get(
  '/',
  validasi(z.object({ jenis: z.enum(['FOTO', 'VIDEO', 'DRONE']).optional() }), 'query'),
  async_(async (_req, res) => {
    const { jenis } = res.locals.query;

    const data = await prisma.galeri.findMany({
      where: jenis ? { jenis } : {},
      orderBy: { dibuatPada: 'desc' },
      take: 200,
      include: { berkas: true },
    });

    res.json({
      ok: true,
      data: data.map((g) => ({
        id: g.id,
        judul: g.judul,
        jenis: g.jenis,
        url: g.berkas ? `/uploads/${g.berkas.path}` : null,
        urlEksternal: g.urlEksternal,
        keterangan: g.keterangan,
        dibuatPada: g.dibuatPada,
      })),
    });
  }),
);

galeriRoutes.post(
  '/',
  ...perangkat,
  validasi(galeriSchema),
  async_(async (req, res) => {
    const g = await prisma.galeri.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: g.id } });
  }),
);

galeriRoutes.delete(
  '/:id',
  ...perangkat,
  async_(async (req, res) => {
    await prisma.galeri.delete({ where: { id: req.params.id } });
    res.json({ ok: true, data: { dihapus: true } });
  }),
);
