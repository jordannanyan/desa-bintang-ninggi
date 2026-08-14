import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import {
  filterPendudukSchema,
  nonaktifkanPendudukSchema,
  pendudukSchema,
  rtSchema,
  rwSchema,
} from '@desa/shared';
import { validasi } from '../../middleware/validate.js';
import { wajibLogin, wajibPeran } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { prisma } from '../../lib/prisma.js';
import * as penduduk from './penduduk.service.js';
import { contohCsv, eksporPendudukCsv, imporPendudukCsv } from './penduduk.csv.js';

export const pendudukRoutes = Router();

const async_ =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

/** Alamat menempel di Kartu Keluarga, jadi ikut dikirim bersama data penduduk. */
const alamatSchema = z.object({
  alamat: z.string().min(3).max(255),
  rt: z.string().min(1).max(5),
  rw: z.string().min(1).max(5),
  dusun: z.string().max(80).optional(),
  kodePos: z.string().max(10).optional(),
});

const pendudukLengkapSchema = pendudukSchema.merge(alamatSchema);

// CSV ditahan di memori, tidak ditulis ke disk: berkas ini berisi NIK seluruh
// warga, dan tidak ada alasan menyisakan salinannya di server setelah diproses.
const unggahCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const boleh = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    cb(null, boleh.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv'));
  },
});

// ── Statistik agregat: publik ──
// Tidak menerima parameter apa pun yang bisa mempersempit hasil ke individu.
pendudukRoutes.get(
  '/statistik',
  async_(async (_req, res) => {
    res.json({ ok: true, data: await penduduk.statistikKependudukan() });
  }),
);

// ── Selebihnya hanya perangkat desa ──
pendudukRoutes.use(wajibLogin, wajibPeran('PERANGKAT', 'ADMIN'));

pendudukRoutes.get(
  '/',
  validasi(filterPendudukSchema, 'query'),
  async_(async (req, res) => {
    const hasil = await penduduk.daftarPenduduk(req, res.locals.query);
    res.json({ ok: true, ...hasil });
  }),
);

pendudukRoutes.post(
  '/',
  validasi(pendudukLengkapSchema),
  async_(async (req, res) => {
    res.status(201).json({ ok: true, data: await penduduk.tambahPenduduk(req, req.body) });
  }),
);

// Diletakkan sebelum '/:id' agar tidak tertangkap sebagai id.
pendudukRoutes.get('/contoh-csv', (_req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="contoh-data-penduduk.csv"');
  res.send(contohCsv());
});

pendudukRoutes.post(
  '/impor',
  unggahCsv.single('berkas'),
  async_(async (req, res) => {
    if (!req.file) throw new AppError(400, 'BERKAS_KOSONG', 'Pilih berkas CSV lebih dulu');

    const hasil = await imporPendudukCsv(req, req.file.buffer.toString('utf8'), {
      perbaruiYangAda: req.body?.perbaruiYangAda === 'true',
    });
    res.json({ ok: true, data: hasil });
  }),
);

// Ekspor berisi NIK seluruh warga — dibatasi ADMIN saja.
pendudukRoutes.get(
  '/ekspor',
  wajibPeran('ADMIN'),
  async_(async (req, res) => {
    const csv = await eksporPendudukCsv(req);
    const tanggal = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="penduduk-${tanggal}.csv"`);
    res.send(csv);
  }),
);

pendudukRoutes.get(
  '/:id',
  async_(async (req, res) => {
    res.json({ ok: true, data: await penduduk.detailPenduduk(req, req.params.id) });
  }),
);

pendudukRoutes.put(
  '/:id',
  validasi(pendudukLengkapSchema),
  async_(async (req, res) => {
    res.json({ ok: true, data: await penduduk.ubahPenduduk(req, req.params.id, req.body) });
  }),
);

/**
 * Bukan DELETE, melainkan penandaan meninggal atau pindah.
 * Riwayat surat yang pernah terbit atas nama orang itu harus tetap tertelusur.
 */
pendudukRoutes.post(
  '/:id/nonaktifkan',
  validasi(nonaktifkanPendudukSchema),
  async_(async (req, res) => {
    res.json({
      ok: true,
      data: await penduduk.nonaktifkanPenduduk(req, req.params.id, req.body),
    });
  }),
);

// ── RT / RW ──

export const wilayahRoutes = Router();

wilayahRoutes.get(
  '/',
  async_(async (_req, res) => {
    const rw = await prisma.rw.findMany({
      include: { rtList: { orderBy: { nomor: 'asc' } } },
      orderBy: { nomor: 'asc' },
    });
    res.json({ ok: true, data: rw });
  }),
);

wilayahRoutes.use(wajibLogin, wajibPeran('PERANGKAT', 'ADMIN'));

wilayahRoutes.post(
  '/rw',
  validasi(rwSchema),
  async_(async (req, res) => {
    res.status(201).json({ ok: true, data: await prisma.rw.create({ data: req.body }) });
  }),
);

wilayahRoutes.post(
  '/rt',
  validasi(rtSchema),
  async_(async (req, res) => {
    res.status(201).json({ ok: true, data: await prisma.rt.create({ data: req.body }) });
  }),
);
