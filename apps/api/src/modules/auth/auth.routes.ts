import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import {
  aktivasiWargaSchema,
  loginPerangkatSchema,
  loginWargaSchema,
  nikSchema,
  pinSchema,
} from '@desa/shared';
import { validasi } from '../../middleware/validate.js';
import { wajibLogin, wajibPeran } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { cabutRefreshToken, rotasiRefreshToken } from '../../lib/token.js';
import { AKSI, catatAudit } from '../../lib/audit.js';
import { isProd } from '../../config/env.js';
import * as auth from './auth.service.js';

export const authRoutes = Router();

const KUKI_REFRESH = 'desa_refresh';

/**
 * Refresh token dikirim sebagai cookie httpOnly, bukan di body JSON.
 * Cookie httpOnly tidak bisa dibaca JavaScript, sehingga XSS di halaman mana pun
 * tidak bisa mencuri token yang berumur 30 hari itu. Access token yang berumur
 * 15 menit tetap dikirim di body untuk disimpan di memori aplikasi.
 */
function pasangKukiRefresh(res: Response, token: string) {
  res.cookie(KUKI_REFRESH, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 30 * 86_400_000,
  });
}

/** Membungkus handler async agar error-nya sampai ke penangananError. */
const async_ =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

// ── Pendaftaran warga oleh perangkat desa ──

authRoutes.post(
  '/daftarkan-warga',
  wajibLogin,
  wajibPeran('PERANGKAT', 'ADMIN'),
  validasi(z.object({ nik: nikSchema })),
  async_(async (req, res) => {
    const hasil = await auth.daftarkanWarga(req, req.body.nik);
    res.status(201).json({ ok: true, data: hasil });
  }),
);

// ── Alur akun warga ──

authRoutes.post(
  '/aktivasi',
  validasi(aktivasiWargaSchema),
  async_(async (req, res) => {
    const hasil = await auth.aktivasiWarga(req, req.body);
    res.json({ ok: true, data: hasil });
  }),
);

authRoutes.post(
  '/login',
  validasi(loginWargaSchema),
  async_(async (req, res) => {
    const { refreshToken, ...sisa } = await auth.loginWarga(req, req.body);
    pasangKukiRefresh(res, refreshToken);
    res.json({ ok: true, data: sisa });
  }),
);

authRoutes.post(
  '/login-perangkat',
  validasi(loginPerangkatSchema),
  async_(async (req, res) => {
    const { refreshToken, ...sisa } = await auth.loginPerangkat(req, req.body);
    pasangKukiRefresh(res, refreshToken);
    res.json({ ok: true, data: sisa });
  }),
);

authRoutes.post(
  '/refresh',
  async_(async (req, res) => {
    const token = req.cookies?.[KUKI_REFRESH];
    if (!token) throw new AppError(401, 'TANPA_REFRESH_TOKEN', 'Sesi tidak ditemukan');

    const hasil = await rotasiRefreshToken(token, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
    if (!hasil) {
      res.clearCookie(KUKI_REFRESH, { path: '/api/auth' });
      throw new AppError(401, 'SESI_BERAKHIR', 'Sesi Anda telah berakhir, silakan login ulang');
    }

    pasangKukiRefresh(res, hasil.refreshToken);
    res.json({ ok: true, data: { accessToken: hasil.accessToken } });
  }),
);

authRoutes.post(
  '/logout',
  async_(async (req, res) => {
    const token = req.cookies?.[KUKI_REFRESH];
    if (token) await cabutRefreshToken(token);
    res.clearCookie(KUKI_REFRESH, { path: '/api/auth' });
    if (req.user) await catatAudit(req, AKSI.LOGOUT, 'User', req.user.sub);
    res.json({ ok: true, data: { pesan: 'Berhasil keluar' } });
  }),
);

// ── Akun yang sedang login ──

authRoutes.get(
  '/saya',
  wajibLogin,
  async_(async (req, res) => {
    res.json({ ok: true, data: await auth.profilSaya(req.user!.sub) });
  }),
);

authRoutes.post(
  '/ganti-pin',
  wajibLogin,
  validasi(z.object({ pinLama: pinSchema, pinBaru: pinSchema })),
  async_(async (req, res) => {
    await auth.gantiPin(req.user!.sub, req.body.pinLama, req.body.pinBaru);
    res.clearCookie(KUKI_REFRESH, { path: '/api/auth' });
    res.json({ ok: true, data: { pesan: 'PIN berhasil diganti. Silakan login ulang.' } });
  }),
);
