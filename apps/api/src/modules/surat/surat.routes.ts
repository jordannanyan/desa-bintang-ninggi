import { resolve } from 'node:path';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { ajukanSuratSchema, filterSuratSchema, tinjauSuratSchema } from '@desa/shared';
import { prisma } from '../../lib/prisma.js';
import { validasi } from '../../middleware/validate.js';
import { wajibLogin, wajibPeran } from '../../middleware/auth.js';
import * as surat from './surat.service.js';

export const suratRoutes = Router();

const async_ =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

// ── Publik ──

/** Katalog jenis surat beserta field yang harus diisi — form dibangun dari sini. */
suratRoutes.get(
  '/jenis',
  async_(async (_req, res) => {
    const template = await prisma.templateSurat.findMany({
      where: { aktif: true },
      orderBy: { urutan: 'asc' },
      select: { kode: true, nama: true, fieldTambahan: true, lampiranWajib: true },
    });
    res.json({ ok: true, data: template });
  }),
);

/**
 * Verifikasi keaslian surat lewat QR. Tanpa login — tautannya memang ditujukan
 * untuk siapa pun yang memegang lembar suratnya.
 */
suratRoutes.get(
  '/verifikasi/:kode',
  async_(async (req, res) => {
    res.json({ ok: true, data: await surat.verifikasiSurat(req.params.kode) });
  }),
);

// ── Warga ──

suratRoutes.post(
  '/',
  wajibLogin,
  validasi(ajukanSuratSchema),
  async_(async (req, res) => {
    res.status(201).json({ ok: true, data: await surat.ajukanSurat(req, req.body) });
  }),
);

suratRoutes.get(
  '/saya',
  wajibLogin,
  validasi(filterSuratSchema, 'query'),
  async_(async (req, res) => {
    res.json({ ok: true, ...(await surat.suratSaya(req.user!.sub, res.locals.query)) });
  }),
);

suratRoutes.get(
  '/saya/:id',
  wajibLogin,
  async_(async (req, res) => {
    res.json({ ok: true, data: await surat.detailPengajuan(req, req.params.id, true) });
  }),
);

suratRoutes.get(
  '/saya/:id/pdf',
  wajibLogin,
  async_(async (req, res) => {
    const berkas = await surat.berkasPdf(req, req.params.id, true);
    res.download(resolve(berkas.path), berkas.nama);
  }),
);

// ── Perangkat desa ──

const perangkat = [wajibLogin, wajibPeran('PERANGKAT', 'ADMIN')] as const;

suratRoutes.get(
  '/',
  ...perangkat,
  validasi(filterSuratSchema, 'query'),
  async_(async (_req, res) => {
    res.json({ ok: true, ...(await surat.daftarPengajuan(res.locals.query)) });
  }),
);

suratRoutes.get(
  '/:id',
  ...perangkat,
  async_(async (req, res) => {
    res.json({ ok: true, data: await surat.detailPengajuan(req, req.params.id) });
  }),
);

suratRoutes.patch(
  '/:id/tinjau',
  ...perangkat,
  validasi(tinjauSuratSchema),
  async_(async (req, res) => {
    res.json({ ok: true, data: await surat.tinjauPengajuan(req, req.params.id, req.body) });
  }),
);

suratRoutes.post(
  '/:id/terbitkan',
  ...perangkat,
  async_(async (req, res) => {
    res.json({ ok: true, data: await surat.terbitkanSurat(req, req.params.id) });
  }),
);

suratRoutes.get(
  '/:id/pdf',
  ...perangkat,
  async_(async (req, res) => {
    const berkas = await surat.berkasPdf(req, req.params.id, false);
    res.download(resolve(berkas.path), berkas.nama);
  }),
);

// ── Pengaturan template (admin) ──

suratRoutes.put(
  '/template/:kode',
  wajibLogin,
  wajibPeran('ADMIN'),
  async_(async (req, res) => {
    const { isiTemplate, formatNomor, fieldTambahan, lampiranWajib, aktif } = req.body ?? {};
    const template = await prisma.templateSurat.update({
      where: { kode: req.params.kode },
      data: { isiTemplate, formatNomor, fieldTambahan, lampiranWajib, aktif },
    });
    res.json({ ok: true, data: { kode: template.kode } });
  }),
);
