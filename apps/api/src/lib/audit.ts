import type { Request } from 'express';
import { prisma } from './prisma.js';

/**
 * Mencatat akses dan perubahan data pribadi — kewajiban UU PDP No. 27/2022.
 *
 * Sengaja tidak melempar error: kegagalan mencatat audit tidak boleh menggagalkan
 * permintaan yang sedang berjalan, tapi harus terlihat di log server.
 */
export async function catatAudit(
  req: Request,
  aksi: string,
  entitas: string,
  entitasId?: string,
  detail?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.sub ?? null,
        aksi,
        entitas,
        entitasId: entitasId ?? null,
        ip: (req.ip ?? '').slice(0, 45) || null,
        detail: detail ? (detail as object) : undefined,
      },
    });
  } catch (err) {
    console.error('Gagal menulis audit log:', err);
  }
}

export const AKSI = {
  LOGIN_BERHASIL: 'LOGIN_BERHASIL',
  LOGIN_GAGAL: 'LOGIN_GAGAL',
  AKTIVASI_AKUN: 'AKTIVASI_AKUN',
  DAFTARKAN_WARGA: 'DAFTARKAN_WARGA',
  LOGOUT: 'LOGOUT',
  LIHAT_PENDUDUK: 'LIHAT_PENDUDUK',
  UBAH_PENDUDUK: 'UBAH_PENDUDUK',
  HAPUS_PENDUDUK: 'HAPUS_PENDUDUK',
  EKSPOR_PENDUDUK: 'EKSPOR_PENDUDUK',
} as const;
