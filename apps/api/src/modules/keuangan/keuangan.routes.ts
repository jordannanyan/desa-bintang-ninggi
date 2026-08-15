import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { anggaranSchema, itemAnggaranSchema } from '@desa/shared';
import { prisma } from '../../lib/prisma.js';
import { validasi } from '../../middleware/validate.js';
import { wajibLogin, wajibPeran } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';

export const keuanganRoutes = Router();

const async_ =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const perangkat = [wajibLogin, wajibPeran('PERANGKAT', 'ADMIN')] as const;

/** Decimal Prisma dikirim sebagai string; diubah ke number agar frontend tidak perlu menebak. */
const angka = (v: unknown) => Number(v ?? 0);

// ── Publik ──

/** Daftar tahun anggaran yang tersedia, untuk pemilih tahun di halaman publik. */
keuanganRoutes.get(
  '/tahun',
  async_(async (_req, res) => {
    const daftar = await prisma.anggaran.findMany({
      orderBy: [{ tahun: 'desc' }, { versi: 'asc' }],
      select: { id: true, tahun: true, versi: true, dikunci: true },
    });
    res.json({ ok: true, data: daftar });
  }),
);

/**
 * Ringkasan APBDes satu tahun: total, rincian per bidang, dan per sumber dana.
 *
 * Perhitungan dilakukan di sini, bukan di frontend, supaya angka yang muncul
 * di halaman publik tidak bergantung pada versi peramban yang dipakai warga.
 */
keuanganRoutes.get(
  '/:tahun',
  validasi(z.object({ tahun: z.coerce.number().int() }), 'params'),
  async_(async (req, res) => {
    const tahun = Number(req.params.tahun);

    const anggaran = await prisma.anggaran.findFirst({
      where: { tahun },
      orderBy: { versi: 'desc' },
      include: { item: { orderBy: [{ jenis: 'asc' }, { bidang: 'asc' }] } },
    });

    if (!anggaran) {
      throw new AppError(404, 'TIDAK_DITEMUKAN', `Anggaran tahun ${tahun} belum diisi`);
    }

    const item = anggaran.item.map((i) => ({
      id: i.id,
      jenis: i.jenis,
      bidang: i.bidang,
      uraian: i.uraian,
      sumberDana: i.sumberDana,
      pagu: angka(i.pagu),
      realisasi: angka(i.realisasi),
    }));

    const totalPer = (jenis: string) =>
      item
        .filter((i) => i.jenis === jenis)
        .reduce(
          (t, i) => ({ pagu: t.pagu + i.pagu, realisasi: t.realisasi + i.realisasi }),
          { pagu: 0, realisasi: 0 },
        );

    const kelompokkan = (kunci: 'bidang' | 'sumberDana', jenis?: string) => {
      const peta = new Map<string, { pagu: number; realisasi: number }>();
      for (const i of item) {
        if (jenis && i.jenis !== jenis) continue;
        const k = i[kunci];
        const kini = peta.get(k) ?? { pagu: 0, realisasi: 0 };
        peta.set(k, { pagu: kini.pagu + i.pagu, realisasi: kini.realisasi + i.realisasi });
      }
      return [...peta.entries()]
        .map(([label, v]) => ({ label, ...v }))
        .sort((a, b) => b.pagu - a.pagu);
    };

    res.json({
      ok: true,
      data: {
        tahun: anggaran.tahun,
        versi: anggaran.versi,
        dikunci: anggaran.dikunci,
        pendapatan: totalPer('PENDAPATAN'),
        belanja: totalPer('BELANJA'),
        pembiayaan: totalPer('PEMBIAYAAN'),
        perBidangBelanja: kelompokkan('bidang', 'BELANJA'),
        perSumberDana: kelompokkan('sumberDana', 'PENDAPATAN'),
        item,
      },
    });
  }),
);

// ── Perangkat desa ──

keuanganRoutes.post(
  '/',
  ...perangkat,
  validasi(anggaranSchema),
  async_(async (req, res) => {
    const ada = await prisma.anggaran.findUnique({
      where: { tahun_versi: { tahun: req.body.tahun, versi: req.body.versi } },
    });
    if (ada) {
      throw new AppError(
        409,
        'SUDAH_ADA',
        `Anggaran ${req.body.tahun} versi ${req.body.versi} sudah ada`,
      );
    }

    const a = await prisma.anggaran.create({ data: req.body });
    res.status(201).json({ ok: true, data: { id: a.id } });
  }),
);

keuanganRoutes.post(
  '/:anggaranId/item',
  ...perangkat,
  validasi(itemAnggaranSchema),
  async_(async (req, res) => {
    const anggaran = await prisma.anggaran.findUnique({ where: { id: req.params.anggaranId } });
    if (!anggaran) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Anggaran tidak ditemukan');

    // Anggaran yang sudah dikunci tidak bisa ditambah rinciannya. Angka yang
    // sudah dipublikasikan sebagai laporan resmi tidak boleh berubah diam-diam.
    if (anggaran.dikunci) {
      throw new AppError(
        409,
        'ANGGARAN_DIKUNCI',
        'Anggaran ini sudah dikunci. Buka kuncinya lebih dulu bila memang perlu diubah.',
      );
    }

    const item = await prisma.itemAnggaran.create({
      data: { ...req.body, anggaranId: anggaran.id },
    });
    res.status(201).json({ ok: true, data: { id: item.id } });
  }),
);

keuanganRoutes.put(
  '/item/:id',
  ...perangkat,
  validasi(itemAnggaranSchema),
  async_(async (req, res) => {
    const item = await prisma.itemAnggaran.findUnique({
      where: { id: req.params.id },
      include: { anggaran: true },
    });
    if (!item) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Rincian tidak ditemukan');
    if (item.anggaran.dikunci) {
      throw new AppError(409, 'ANGGARAN_DIKUNCI', 'Anggaran ini sudah dikunci');
    }

    await prisma.itemAnggaran.update({ where: { id: req.params.id }, data: req.body });
    res.json({ ok: true, data: { id: req.params.id } });
  }),
);

keuanganRoutes.delete(
  '/item/:id',
  ...perangkat,
  async_(async (req, res) => {
    const item = await prisma.itemAnggaran.findUnique({
      where: { id: req.params.id },
      include: { anggaran: true },
    });
    if (!item) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Rincian tidak ditemukan');
    if (item.anggaran.dikunci) {
      throw new AppError(409, 'ANGGARAN_DIKUNCI', 'Anggaran ini sudah dikunci');
    }

    await prisma.itemAnggaran.delete({ where: { id: req.params.id } });
    res.json({ ok: true, data: { dihapus: true } });
  }),
);

/** Mengunci atau membuka anggaran. Hanya admin. */
keuanganRoutes.patch(
  '/:id/kunci',
  wajibLogin,
  wajibPeran('ADMIN'),
  validasi(z.object({ dikunci: z.boolean() })),
  async_(async (req, res) => {
    await prisma.anggaran.update({
      where: { id: req.params.id },
      data: { dikunci: req.body.dikunci },
    });
    res.json({ ok: true, data: { dikunci: req.body.dikunci } });
  }),
);
