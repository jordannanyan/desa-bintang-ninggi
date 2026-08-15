import { resolve } from 'node:path';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { JENIS_DOKUMEN, dokumenSchema } from '@desa/shared';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { validasi } from '../../middleware/validate.js';
import { wajibLogin, wajibPeran } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';

export const dokumenRoutes = Router();

const async_ =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const perangkat = [wajibLogin, wajibPeran('PERANGKAT', 'ADMIN')] as const;

const filterSchema = z.object({
  /** Beberapa jenis sekaligus, dipisah koma: PERDES,PERKADES */
  jenis: z.string().optional(),
  tahun: z.coerce.number().int().optional(),
  q: z.string().optional(),
});

/**
 * Satu tabel dokumen menopang tiga section: Pemerintahan Desa, PPID, dan
 * Download Center. Yang membedakan hanya kolom `jenis`, jadi perangkat desa
 * cukup mengunggah sekali dan berkasnya muncul di tempat yang tepat.
 */
dokumenRoutes.get(
  '/',
  validasi(filterSchema, 'query'),
  async_(async (req, res) => {
    const { jenis, tahun, q } = res.locals.query;

    const daftarJenis = jenis
      ? jenis
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => (JENIS_DOKUMEN as readonly string[]).includes(s))
      : [];

    // Dokumen non-publik hanya terlihat perangkat desa. Draf peraturan yang
    // belum ditetapkan tidak boleh terbaca warga sebagai aturan yang berlaku.
    const bolehLihatSemua = req.user?.peran === 'PERANGKAT' || req.user?.peran === 'ADMIN';

    const where: Record<string, unknown> = {
      ...(bolehLihatSemua ? {} : { publik: true }),
      ...(daftarJenis.length ? { jenis: { in: daftarJenis } } : {}),
      ...(tahun ? { tahun } : {}),
      ...(q?.trim() ? { judul: { contains: q.trim() } } : {}),
    };

    const data = await prisma.dokumen.findMany({
      where,
      orderBy: [{ tahun: 'desc' }, { dibuatPada: 'desc' }],
      include: { berkas: true },
      take: 200,
    });

    res.json({
      ok: true,
      data: data.map((d) => ({
        id: d.id,
        jenis: d.jenis,
        judul: d.judul,
        nomor: d.nomor,
        tahun: d.tahun,
        ringkasan: d.ringkasan,
        publik: d.publik,
        jumlahUnduh: d.jumlahUnduh,
        adaBerkas: Boolean(d.berkasId),
        ukuranByte: d.berkas?.ukuranByte ?? null,
        dibuatPada: d.dibuatPada,
      })),
    });
  }),
);

/** Tahun yang tersedia, untuk penyaring di halaman publik. */
dokumenRoutes.get(
  '/tahun',
  async_(async (_req, res) => {
    const baris = await prisma.dokumen.groupBy({
      by: ['tahun'],
      where: { publik: true },
      _count: true,
      orderBy: { tahun: 'desc' },
    });
    res.json({
      ok: true,
      data: baris.map((b) => ({ tahun: b.tahun, jumlah: Number(b._count) })),
    });
  }),
);

/**
 * Unduh berkas dokumen. Penghitung unduhan dinaikkan di sini, bukan di
 * frontend, supaya angkanya mencerminkan unduhan yang benar-benar terjadi.
 */
dokumenRoutes.get(
  '/:id/unduh',
  async_(async (req, res) => {
    const d = await prisma.dokumen.findUnique({
      where: { id: req.params.id },
      include: { berkas: true },
    });

    if (!d?.berkas) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Berkas tidak tersedia');

    const bolehLihatSemua = req.user?.peran === 'PERANGKAT' || req.user?.peran === 'ADMIN';
    if (!d.publik && !bolehLihatSemua) {
      throw new AppError(404, 'TIDAK_DITEMUKAN', 'Berkas tidak tersedia');
    }

    await prisma.dokumen.update({
      where: { id: d.id },
      data: { jumlahUnduh: { increment: 1 } },
    });

    // Nama berkas yang diunduh memakai judul dokumen, bukan nama acak di disk.
    const ekstensi = d.berkas.namaAsli.match(/\.[a-z0-9]+$/i)?.[0] ?? '.pdf';
    const namaBersih = `${d.judul.replace(/[^\w\s-]/g, '').slice(0, 80)}${ekstensi}`;

    res.download(resolve(env.UPLOAD_DIR, d.berkas.path), namaBersih);
  }),
);

// ── Perangkat desa ──

dokumenRoutes.post(
  '/',
  ...perangkat,
  validasi(dokumenSchema),
  async_(async (req, res) => {
    const d = await prisma.dokumen.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: d.id } });
  }),
);

dokumenRoutes.put(
  '/:id',
  ...perangkat,
  validasi(dokumenSchema),
  async_(async (req, res) => {
    await prisma.dokumen.update({ where: { id: req.params.id }, data: req.body });
    res.json({ ok: true, data: { id: req.params.id } });
  }),
);

dokumenRoutes.delete(
  '/:id',
  ...perangkat,
  async_(async (req, res) => {
    await prisma.dokumen.delete({ where: { id: req.params.id } });
    res.json({ ok: true, data: { dihapus: true } });
  }),
);
