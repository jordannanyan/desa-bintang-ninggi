import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Peran } from '@desa/shared';
import { env } from '../config/env.js';
import { prisma } from './prisma.js';
import type { PayloadToken } from '../middleware/auth.js';

/**
 * Access token berumur pendek (15 menit) dipadu refresh token berumur panjang.
 *
 * Refresh token TIDAK disimpan apa adanya di database — yang disimpan hashnya,
 * persis seperti password. Kalau tabel bocor, token yang tercuri tidak bisa
 * dipakai. Setiap kali dipakai, token lama dicabut dan diganti yang baru
 * (rotasi), sehingga token yang sempat tersalin hanya berguna sekali.
 */

export function buatAccessToken(payload: PayloadToken): string {
  // ACCESS_TOKEN_TTL berasal dari .env sehingga bertipe string biasa, sedangkan
  // @types/jsonwebtoken menuntut format durasi ("15m", "1h"). Nilainya sudah
  // divalidasi di config/env.ts, jadi cukup ditegaskan tipenya di sini.
  const expiresIn = env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export async function buatRefreshToken(
  userId: string,
  konteks: { userAgent?: string; ip?: string } = {},
): Promise<string> {
  const token = crypto.randomBytes(48).toString('base64url');
  const expiredAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiredAt,
      userAgent: konteks.userAgent?.slice(0, 255),
      ip: konteks.ip?.slice(0, 45),
    },
  });

  return token;
}

/**
 * Menukar refresh token dengan sepasang token baru. Mengembalikan null bila
 * token tidak dikenal, sudah dicabut, atau kedaluwarsa — pemanggil yang
 * memutuskan pesan errornya.
 */
export async function rotasiRefreshToken(
  token: string,
  konteks: { userAgent?: string; ip?: string } = {},
): Promise<{ accessToken: string; refreshToken: string } | null> {
  const tersimpan = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!tersimpan || tersimpan.dicabutPada || tersimpan.expiredAt < new Date()) return null;
  if (tersimpan.user.status !== 'AKTIF') return null;

  await prisma.refreshToken.update({
    where: { id: tersimpan.id },
    data: { dicabutPada: new Date() },
  });

  const payload: PayloadToken = {
    sub: tersimpan.user.id,
    peran: tersimpan.user.peran as Peran,
    pendudukId: tersimpan.user.pendudukId ?? undefined,
  };

  return {
    accessToken: buatAccessToken(payload),
    refreshToken: await buatRefreshToken(tersimpan.user.id, konteks),
  };
}

export async function cabutRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), dicabutPada: null },
    data: { dicabutPada: new Date() },
  });
}

/** Dipakai saat perangkat desa membekukan akun atau warga mengganti PIN. */
export async function cabutSemuaSesi(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, dicabutPada: null },
    data: { dicabutPada: new Date() },
  });
}
