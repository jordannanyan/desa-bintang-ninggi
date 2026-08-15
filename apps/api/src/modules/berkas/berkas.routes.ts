import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { wajibLogin, wajibPeran } from '../../middleware/auth.js';
import { validasi } from '../../middleware/validate.js';
import { AppError } from '../../middleware/error.js';
import { MIME_DIIZINKAN, bersihkanBerkasYatim, simpanBerkas } from './berkas.service.js';

export const berkasRoutes = Router();

const async_ =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

/**
 * Berkas ditahan di memori, bukan langsung ditulis ke disk.
 *
 * Gambar masih harus dikecilkan dan metadatanya dibuang sebelum layak
 * disimpan; menulisnya lebih dulu berarti berkas asli sempat mendarat di
 * server dalam bentuk apa adanya.
 */
const unggah = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => cb(null, MIME_DIIZINKAN.includes(file.mimetype)),
});

const KATEGORI = ['pengaduan', 'lampiran-surat', 'galeri', 'dokumen', 'proyek', 'umkm'] as const;

const kategoriSchema = z.object({
  kategori: z.enum(KATEGORI).default('lampiran-surat'),
});

/** Unggah satu berkas. Wajib login — tidak ada unggahan anonim. */
berkasRoutes.post(
  '/',
  wajibLogin,
  unggah.single('berkas'),
  validasi(kategoriSchema, 'query'),
  async_(async (req, res) => {
    if (!req.file) {
      throw new AppError(
        400,
        'BERKAS_KOSONG',
        `Pilih berkas lebih dulu. Maksimal ${env.MAX_UPLOAD_MB} MB per berkas.`,
      );
    }

    const hasil = await simpanBerkas(req.file, {
      kategori: res.locals.query.kategori,
      olehUserId: req.user!.sub,
    });

    res.status(201).json({ ok: true, data: hasil });
  }),
);

/** Unggah beberapa berkas sekaligus, mis. foto pengaduan. */
berkasRoutes.post(
  '/banyak',
  wajibLogin,
  unggah.array('berkas', 5),
  validasi(kategoriSchema, 'query'),
  async_(async (req, res) => {
    const daftar = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!daftar.length) throw new AppError(400, 'BERKAS_KOSONG', 'Pilih berkas lebih dulu');

    const hasil = [];
    for (const file of daftar) {
      hasil.push(
        await simpanBerkas(file, {
          kategori: res.locals.query.kategori,
          olehUserId: req.user!.sub,
        }),
      );
    }

    res.status(201).json({ ok: true, data: hasil });
  }),
);

/** Pembersihan berkas yatim. Dijalankan admin, atau lewat cron di server. */
berkasRoutes.post(
  '/bersihkan',
  wajibLogin,
  wajibPeran('ADMIN'),
  async_(async (_req, res) => {
    const jumlah = await bersihkanBerkasYatim();
    res.json({ ok: true, data: { dihapus: jumlah } });
  }),
);
