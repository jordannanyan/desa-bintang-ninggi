import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi'),

  /** Kunci penandatangan JWT akses (15 menit). */
  JWT_SECRET: z.string().min(32, 'JWT_SECRET minimal 32 karakter'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET minimal 32 karakter'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),

  /** 32 byte hex — mengenkripsi NIK & nomor KK di database (AES-256-GCM). */
  DATA_ENCRYPTION_KEY: z.string().length(64, 'DATA_ENCRYPTION_KEY harus 64 karakter hex'),
  /** Kunci HMAC untuk kolom *_hash yang dipakai mencari tanpa mendekripsi. */
  DATA_HASH_KEY: z.string().min(32),

  WEB_ORIGIN: z.string().default('http://localhost:5173'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().default(5),

  /** Basis URL publik untuk QR verifikasi surat. */
  PUBLIC_BASE_URL: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Konfigurasi .env tidak valid:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
