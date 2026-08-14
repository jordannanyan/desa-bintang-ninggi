import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env, isProd } from './config/env.js';
import { apiRoutes } from './routes/index.js';
import { penangananError, tidakDitemukan } from './middleware/error.js';

export function buatApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());

  // Di VPS, Apache menyajikan frontend dan API dari domain yang sama, sehingga
  // CORS sebenarnya tidak terpakai. Aturan ini tetap ada untuk mode pengembangan
  // (Vite di :5173, API di :4000) dan bila kelak dipisah ke subdomain.
  const asalDiizinkan = env.WEB_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(
    cors({
      origin: (origin, cb) =>
        !origin || asalDiizinkan.includes(origin)
          ? cb(null, true)
          : cb(new Error('Asal permintaan tidak diizinkan')),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(isProd ? 'combined' : 'dev'));

  // Berkas unggahan (foto pengaduan, lampiran surat, galeri).
  app.use('/uploads', express.static(env.UPLOAD_DIR, { maxAge: '7d' }));

  app.get('/health', (_req, res) => res.json({ ok: true, data: { status: 'sehat' } }));

  // Login dan pengajuan surat dibatasi agar NIK tidak bisa dicoba-coba massal.
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60_000, limit: 20, standardHeaders: true }));
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true }));

  app.use('/api', apiRoutes);

  app.use(tidakDitemukan);
  app.use(penangananError);

  return app;
}
