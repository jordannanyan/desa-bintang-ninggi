import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  KATEGORI_PENGADUAN,
  STATUS_PENGADUAN,
  buatPengaduanSchema,
} from '@desa/shared';
import { prisma } from '../../lib/prisma.js';
import { validasi } from '../../middleware/validate.js';
import { wajibLogin, wajibPeran } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { catatAudit } from '../../lib/audit.js';
import { kodeAcak } from '../../lib/crypto.js';

export const pengaduanRoutes = Router();

const async_ =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const perangkat = [wajibLogin, wajibPeran('PERANGKAT', 'ADMIN')] as const;

const filterSchema = z.object({
  status: z.enum(STATUS_PENGADUAN).optional(),
  kategori: z.enum(KATEGORI_PENGADUAN).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(20),
});

const tanggapiSchema = z
  .object({
    status: z.enum(STATUS_PENGADUAN),
    isi: z.string().min(5, 'Tanggapan minimal 5 karakter').max(2000),
  })
  .refine((v) => v.status !== 'DITOLAK' || v.isi.length >= 10, {
    message: 'Alasan penolakan harus dijelaskan',
    path: ['isi'],
  });

/** Nama pelapor disamarkan sebagian pada tampilan publik. */
const samarkanNama = (nama: string) =>
  nama
    .split(' ')
    .map((b, i) => (i === 0 ? b : `${b[0] ?? ''}${'*'.repeat(Math.max(b.length - 1, 0))}`))
    .join(' ');

// ── Publik ──

/**
 * Daftar pengaduan yang bisa dilihat siapa saja.
 *
 * Inilah yang membuat kanal pengaduan berguna: warga bisa melihat laporan
 * sudah ditangani atau belum, tanpa harus bertanya ke kantor desa. Yang
 * ditampilkan sengaja terbatas — tidak ada koordinat GPS dan tidak ada
 * identitas pelapor, karena keduanya menunjuk ke rumah orang.
 */
pengaduanRoutes.get(
  '/',
  validasi(filterSchema, 'query'),
  async_(async (_req, res) => {
    const { status, kategori, page, perPage } = res.locals.query;
    const where = { ...(status ? { status } : {}), ...(kategori ? { kategori } : {}) };

    const [total, baris] = await Promise.all([
      prisma.pengaduan.count({ where }),
      prisma.pengaduan.findMany({
        where,
        orderBy: { dibuatPada: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: {
          pelapor: { include: { penduduk: { select: { nama: true } } } },
          _count: { select: { foto: true, tanggapan: true } },
        },
      }),
    ]);

    res.json({
      ok: true,
      data: baris.map((p) => ({
        id: p.id,
        kodeLacak: p.kodeLacak,
        kategori: p.kategori,
        judul: p.judul,
        deskripsi: p.deskripsi,
        lokasiTeks: p.lokasiTeks,
        status: p.status,
        pelapor: p.anonim ? 'Anonim' : samarkanNama(p.pelapor?.penduduk?.nama ?? 'Warga'),
        jumlahFoto: p._count.foto,
        jumlahTanggapan: p._count.tanggapan,
        dibuatPada: p.dibuatPada,
      })),
      meta: { page, perPage, total },
    });
  }),
);

pengaduanRoutes.get(
  '/statistik',
  async_(async (_req, res) => {
    const [perStatus, perKategori, total] = await Promise.all([
      prisma.pengaduan.groupBy({ by: ['status'], _count: true }),
      prisma.pengaduan.groupBy({ by: ['kategori'], _count: true }),
      prisma.pengaduan.count(),
    ]);

    res.json({
      ok: true,
      data: {
        total,
        perStatus: perStatus.map((r) => ({ label: r.status, jumlah: Number(r._count) })),
        perKategori: perKategori
          .map((r) => ({ label: r.kategori, jumlah: Number(r._count) }))
          .sort((a, b) => b.jumlah - a.jumlah),
      },
    });
  }),
);

/** Pelacakan lewat kode, tanpa login — untuk warga yang melapor lalu menutup halaman. */
pengaduanRoutes.get(
  '/lacak/:kode',
  async_(async (req, res) => {
    const p = await prisma.pengaduan.findUnique({
      where: { kodeLacak: req.params.kode.toUpperCase() },
      include: {
        tanggapan: { orderBy: { dibuatPada: 'asc' } },
        foto: { include: { berkas: true } },
      },
    });

    if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Kode laporan tidak dikenali');

    res.json({
      ok: true,
      data: {
        kodeLacak: p.kodeLacak,
        kategori: p.kategori,
        judul: p.judul,
        deskripsi: p.deskripsi,
        lokasiTeks: p.lokasiTeks,
        status: p.status,
        dibuatPada: p.dibuatPada,
        foto: p.foto.map((f) => `/uploads/${f.berkas.path}`),
        tanggapan: p.tanggapan.map((t) => ({
          isi: t.isi,
          status: t.status,
          dibuatPada: t.dibuatPada,
        })),
      },
    });
  }),
);

// ── Warga ──

pengaduanRoutes.post(
  '/',
  wajibLogin,
  validasi(buatPengaduanSchema),
  async_(async (req, res) => {
    const input = req.body;

    const p = await prisma.pengaduan.create({
      data: {
        kodeLacak: `ADU-${new Date().getFullYear()}-${kodeAcak(6)}`,
        pelaporId: req.user!.sub,
        anonim: input.anonim,
        kategori: input.kategori,
        judul: input.judul,
        deskripsi: input.deskripsi,
        lokasiTeks: input.lokasiTeks,
        latitude: input.latitude,
        longitude: input.longitude,
        status: 'BARU',
        foto: input.fotoIds.length
          ? { create: input.fotoIds.map((berkasId: string) => ({ berkasId })) }
          : undefined,
      },
    });

    await catatAudit(req, 'BUAT_PENGADUAN', 'Pengaduan', p.id, { kodeLacak: p.kodeLacak });

    res.status(201).json({ ok: true, data: { id: p.id, kodeLacak: p.kodeLacak } });
  }),
);

pengaduanRoutes.get(
  '/saya',
  wajibLogin,
  async_(async (req, res) => {
    const data = await prisma.pengaduan.findMany({
      where: { pelaporId: req.user!.sub },
      orderBy: { dibuatPada: 'desc' },
      include: { tanggapan: { orderBy: { dibuatPada: 'desc' }, take: 1 } },
    });

    res.json({
      ok: true,
      data: data.map((p) => ({
        id: p.id,
        kodeLacak: p.kodeLacak,
        kategori: p.kategori,
        judul: p.judul,
        status: p.status,
        anonim: p.anonim,
        dibuatPada: p.dibuatPada,
        tanggapanTerakhir: p.tanggapan[0]?.isi ?? null,
      })),
    });
  }),
);

// ── Perangkat desa ──

/**
 * Detail lengkap termasuk koordinat dan identitas pelapor.
 *
 * Laporan boleh tampil anonim di halaman publik, tapi identitasnya tetap
 * terlihat perangkat desa. Tanpa itu, kanal pengaduan akan cepat dipenuhi
 * laporan palsu yang tidak bisa ditelusuri ke siapa pun.
 */
pengaduanRoutes.get(
  '/:id',
  ...perangkat,
  async_(async (req, res) => {
    const p = await prisma.pengaduan.findUnique({
      where: { id: req.params.id },
      include: {
        pelapor: { include: { penduduk: { select: { nama: true } } } },
        foto: { include: { berkas: true } },
        tanggapan: { orderBy: { dibuatPada: 'asc' } },
      },
    });

    if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Pengaduan tidak ditemukan');

    await catatAudit(req, 'LIHAT_PENGADUAN', 'Pengaduan', p.id, { kodeLacak: p.kodeLacak });

    res.json({
      ok: true,
      data: {
        ...p,
        pelapor: p.pelapor?.penduduk?.nama ?? 'Tidak diketahui',
        anonimDiPublik: p.anonim,
        foto: p.foto.map((f) => ({ id: f.id, url: `/uploads/${f.berkas.path}` })),
      },
    });
  }),
);

pengaduanRoutes.post(
  '/:id/tanggapi',
  ...perangkat,
  validasi(tanggapiSchema),
  async_(async (req, res) => {
    const p = await prisma.pengaduan.findUnique({ where: { id: req.params.id } });
    if (!p) throw new AppError(404, 'TIDAK_DITEMUKAN', 'Pengaduan tidak ditemukan');

    if (p.status === 'SELESAI') {
      throw new AppError(409, 'SUDAH_SELESAI', 'Laporan ini sudah ditutup');
    }

    await prisma.$transaction([
      prisma.pengaduan.update({
        where: { id: p.id },
        data: { status: req.body.status },
      }),
      prisma.tanggapanPengaduan.create({
        data: {
          pengaduanId: p.id,
          isi: req.body.isi,
          status: req.body.status,
          olehUserId: req.user!.sub,
        },
      }),
    ]);

    await catatAudit(req, 'TANGGAPI_PENGADUAN', 'Pengaduan', p.id, {
      status: req.body.status,
      kodeLacak: p.kodeLacak,
    });

    res.json({ ok: true, data: { id: p.id, status: req.body.status } });
  }),
);
