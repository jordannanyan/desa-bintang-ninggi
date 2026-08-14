import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

/**
 * Penomoran surat.
 *
 * Formatnya TIDAK dikunci di kode — diambil dari tabel `pengaturan` (global)
 * atau `template_surat.formatNomor` (khusus per jenis), keduanya bisa diubah
 * perangkat desa lewat dashboard tanpa deploy ulang.
 */

const ROMAWI = [
  'I', 'II', 'III', 'IV', 'V', 'VI',
  'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
];

const FORMAT_BAWAAN = '470/{{urut}}/BN-I/{{bulanRomawi}}/{{tahun}}';

async function ambilPengaturan<T>(kunci: string, bawaan: T): Promise<T> {
  const baris = await prisma.pengaturan.findUnique({ where: { kunci } });
  return baris ? (baris.nilai as T) : bawaan;
}

/**
 * Mengambil nomor urut berikutnya secara aman.
 *
 * Dua perangkat desa bisa menyetujui surat pada detik yang sama. Tanpa
 * penambahan atomik, keduanya akan membaca angka yang sama dan menerbitkan
 * nomor kembar — kesalahan yang baru ketahuan berbulan-bulan kemudian saat
 * arsip dicocokkan. `increment` dijalankan database, bukan aplikasi.
 */
async function urutBerikutnya(tahun: number, kodeSurat: string): Promise<number> {
  for (let percobaan = 0; percobaan < 3; percobaan++) {
    try {
      const counter = await prisma.counterSurat.upsert({
        where: { tahun_kodeSurat: { tahun, kodeSurat } },
        create: { tahun, kodeSurat, urutTerakhir: 1 },
        update: { urutTerakhir: { increment: 1 } },
      });
      return counter.urutTerakhir;
    } catch (err) {
      // P2002: dua permintaan membuat baris counter yang sama bersamaan.
      // Percobaan berikutnya akan menemukan barisnya dan cukup menambah.
      const bentrok =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
      if (!bentrok || percobaan === 2) throw err;
    }
  }
  throw new Error('Gagal mengambil nomor urut surat');
}

export async function buatNomorSurat(
  kodeSurat: string,
  formatTemplate?: string | null,
): Promise<string> {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();

  const format = formatTemplate ?? (await ambilPengaturan('format_nomor_surat', FORMAT_BAWAAN));
  const perJenis = await ambilPengaturan('nomor_urut_per_jenis', false);

  // Kosong = satu rangkaian nomor untuk semua jenis surat, praktik paling umum.
  const urut = await urutBerikutnya(tahun, perJenis ? kodeSurat : '');

  return format
    .replace(/\{\{urut\}\}/g, String(urut).padStart(3, '0'))
    .replace(/\{\{urutPolos\}\}/g, String(urut))
    .replace(/\{\{tahun\}\}/g, String(tahun))
    .replace(/\{\{bulan\}\}/g, String(sekarang.getMonth() + 1).padStart(2, '0'))
    .replace(/\{\{bulanRomawi\}\}/g, ROMAWI[sekarang.getMonth()])
    .replace(/\{\{kodeSurat\}\}/g, kodeSurat);
}

/** Kode singkat pada QR — cukup pendek untuk dibaca ulang manual bila QR rusak. */
export function buatKodeVerifikasi(): string {
  const huruf = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa I, O, 0, 1 yang mudah tertukar
  let kode = '';
  for (let i = 0; i < 10; i++) kode += huruf[Math.floor(Math.random() * huruf.length)];
  return `${kode.slice(0, 5)}-${kode.slice(5)}`;
}
