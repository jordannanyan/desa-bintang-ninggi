import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { STATUS_PROYEK, progresProyekSchema, proyekSchema } from '@desa/shared';
import { prisma } from '../../lib/prisma.js';
import { validasi } from '../../middleware/validate.js';
import { wajibLogin, wajibPeran } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';

export const pembangunanRoutes = Router();

const async_ =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const perangkat = [wajibLogin, wajibPeran('PERANGKAT', 'ADMIN')] as const;

const filterSchema = z.object({
  tahun: z.coerce.number().int().optional(),
  status: z.enum(STATUS_PROYEK).optional(),
});

// ── Publik ──

/**
 * Daftar proyek beserta progresnya.
 *
 * Semuanya terbuka, termasuk nilai proyek, kontraktor, dan sumber dana —
 * justru itu inti dari section ini. Titik koordinat proyek juga dibuka,
 * berbeda dengan pengaduan: proyek adalah pekerjaan umum di ruang publik,
 * bukan rumah seseorang.
 */
pembangunanRoutes.get(
  '/',
  validasi(filterSchema, 'query'),
  async_(async (_req, res) => {
    const { tahun, status } = res.locals.query;
    const where = { ...(tahun ? { tahun } : {}), ...(status ? { status } : {}) };

    const proyek = await prisma.proyek.findMany({
      where,
      orderBy: [{ tahun: 'desc' }, { tanggalMulai: 'desc' }],
      include: { _count: { select: { progres: true } } },
    });

    res.json({
      ok: true,
      data: proyek.map((p) => ({
        id: p.id,
        nama: p.nama,
        deskripsi: p.deskripsi,
        lokasi: p.lokasi,
        latitude: p.latitude ? Number(p.latitude) : null,
        longitude: p.longitude ? Number(p.longitude) : null,
        nilai: Number(p.nilai),
        sumberDana: p.sumberDana,
        kontraktor: p.kontraktor,
        pengawas: p.pengawas,
        tanggalMulai: p.tanggalMulai,
        tanggalSelesai: p.tanggalSelesai,
        status: p.status,
        persentase: p.persentase,
        tahun: p.tahun,
        jumlahProgres: p._count.progres,
      })),
    });
  }),
);

pembangunanRoutes.get(
  '/ringkasan',
  async_(async (_req, res) => {
    const [perStatus, perTahun, agregat] = await Promise.all([
      prisma.proyek.groupBy({ by: ['status'], _count: true }),
      prisma.proyek.groupBy({ by: ['tahun'], _count: true, _sum: { nilai: true } }),
      prisma.proyek.aggregate({ _count: true, _sum: { nilai: true } }),
    ]);

    res.json({
      ok: true,
      data: {
        totalProyek: agregat._count,
        totalNilai: Number(agregat._sum.nilai ?? 0),
        perStatus: perStatus.map((r) => ({ label: r.status, jumlah: Number(r._count) })),
        perTahun: perTahun
          .map((r) => ({
            tahun: r.tahun,
            jumlah: Number(r._count),
            nilai: Number(r._sum.nilai ?? 0),
          }))
          .sort((a, b) => b.tahun - a.tahun),
      },
    });
  }),
);

pembangunanRoutes.get(
  '/:id',
  async_(async (req, res) => {
    const p = await prisma.proyek.findUnique({
      where: { id: req.params.id },
      include: {
        progres: {
          orderBy: { tanggal: 'desc' },
          include: { foto: true },
        },
      },
    });

    if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Proyek tidak ditemukan');

    res.json({
      ok: true,
      data: {
        ...p,
        nilai: Number(p.nilai),
        latitude: p.latitude ? Number(p.latitude) : null,
        longitude: p.longitude ? Number(p.longitude) : null,
        progres: p.progres.map((g) => ({
          id: g.id,
          tanggal: g.tanggal,
          persentase: g.persentase,
          catatan: g.catatan,
          fotoUrl: g.foto ? `/uploads/${g.foto.path}` : null,
        })),
      },
    });
  }),
);

// ── Perangkat desa ──

pembangunanRoutes.post(
  '/',
  ...perangkat,
  validasi(proyekSchema),
  async_(async (req, res) => {
    const p = await prisma.proyek.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: p.id } });
  }),
);

pembangunanRoutes.put(
  '/:id',
  ...perangkat,
  validasi(proyekSchema),
  async_(async (req, res) => {
    await prisma.proyek.update({ where: { id: req.params.id }, data: req.body });
    res.json({ ok: true, data: { id: req.params.id } });
  }),
);

pembangunanRoutes.delete(
  '/:id',
  ...perangkat,
  async_(async (req, res) => {
    await prisma.proyek.delete({ where: { id: req.params.id } });
    res.json({ ok: true, data: { dihapus: true } });
  }),
);

/**
 * Menambah catatan progres.
 *
 * Persentase pada proyek ikut diperbarui dari catatan terbaru, supaya angka
 * yang tampil di daftar tidak pernah berbeda dari catatan terakhirnya —
 * ketidakcocokan semacam itu justru merusak kepercayaan pada halaman
 * transparansi.
 */
pembangunanRoutes.post(
  '/:id/progres',
  ...perangkat,
  validasi(progresProyekSchema),
  async_(async (req, res) => {
    const proyek = await prisma.proyek.findUnique({ where: { id: req.params.id } });
    if (!proyek) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Proyek tidak ditemukan');

    const [progres] = await prisma.$transaction([
      prisma.progresProyek.create({
        data: {
          proyekId: proyek.id,
          tanggal: req.body.tanggal,
          persentase: req.body.persentase,
          catatan: req.body.catatan,
          fotoId: req.body.fotoId,
        },
      }),
      prisma.proyek.update({
        where: { id: proyek.id },
        data: {
          persentase: req.body.persentase,
          status:
            req.body.persentase >= 100
              ? 'SELESAI'
              : proyek.status === 'PERENCANAAN'
                ? 'BERJALAN'
                : proyek.status,
        },
      }),
    ]);

    res.status(201).json({ ok: true, data: { id: progres.id } });
  }),
);
