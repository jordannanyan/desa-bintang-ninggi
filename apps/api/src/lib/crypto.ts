import crypto from 'node:crypto';
import { env } from '../config/env.js';

const ALGO = 'aes-256-gcm';
const key = Buffer.from(env.DATA_ENCRYPTION_KEY, 'hex');

/**
 * Enkripsi data pribadi (NIK, nomor KK) sebelum masuk database.
 * Format keluaran: iv(hex).tag(hex).ciphertext(hex)
 */
export function enkripsi(nilai: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const terenkripsi = Buffer.concat([cipher.update(nilai, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}.${tag.toString('hex')}.${terenkripsi.toString('hex')}`;
}

export function dekripsi(tersimpan: string): string {
  const [ivHex, tagHex, dataHex] = tersimpan.split('.');
  if (!ivHex || !tagHex || !dataHex) throw new Error('Format ciphertext tidak valid');

  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

/**
 * HMAC deterministik untuk kolom pencarian (`nikHash`, `nomorKkHash`).
 * Deterministik agar bisa di-index & unique, tapi tetap tidak bisa dibalik.
 */
export function hashPencarian(nilai: string): string {
  return crypto.createHmac('sha256', env.DATA_HASH_KEY).update(nilai.trim()).digest('hex');
}

/** Menyamarkan NIK untuk ditampilkan di UI/log: 6371xxxxxxxx1234 */
export function maskNik(nik: string): string {
  if (nik.length !== 16) return '****';
  return `${nik.slice(0, 4)}${'x'.repeat(8)}${nik.slice(-4)}`;
}

/** Hash isi PDF surat — nilai inilah yang diverifikasi lewat QR Code. */
export function hashDokumen(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function kodeAcak(panjang = 8): string {
  return crypto.randomBytes(panjang).toString('base64url').slice(0, panjang).toUpperCase();
}
