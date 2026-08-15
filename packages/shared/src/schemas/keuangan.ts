import { z } from 'zod';

/** Transparansi Keuangan dan Pembangunan Desa. */

export const JENIS_ANGGARAN = ['PENDAPATAN', 'BELANJA', 'PEMBIAYAAN'] as const;

export const LABEL_JENIS_ANGGARAN: Record<(typeof JENIS_ANGGARAN)[number], string> = {
  PENDAPATAN: 'Pendapatan',
  BELANJA: 'Belanja',
  PEMBIAYAAN: 'Pembiayaan',
};

/**
 * Bidang belanja mengikuti Permendagri 20/2018 tentang Pengelolaan Keuangan Desa.
 * Dipakai sebagai daftar saran, bukan pilihan tertutup — penamaan di tiap desa
 * bisa sedikit berbeda dan tidak perlu menunggu rilis baru untuk menyesuaikan.
 */
export const BIDANG_BELANJA = [
  'Penyelenggaraan Pemerintahan Desa',
  'Pelaksanaan Pembangunan Desa',
  'Pembinaan Kemasyarakatan Desa',
  'Pemberdayaan Masyarakat Desa',
  'Penanggulangan Bencana, Darurat dan Mendesak Desa',
] as const;

export const SUMBER_DANA = [
  'Dana Desa',
  'Alokasi Dana Desa',
  'Dana Bagi Hasil Pajak dan Retribusi',
  'Pendapatan Asli Desa',
  'Bantuan Keuangan Provinsi',
  'Bantuan Keuangan Kabupaten',
  'Lain-lain Pendapatan yang Sah',
] as const;

export const anggaranSchema = z.object({
  tahun: z.coerce.number().int().min(2015).max(2100),
  versi: z.string().max(30).default('MURNI'),
});

export const itemAnggaranSchema = z.object({
  jenis: z.enum(JENIS_ANGGARAN),
  bidang: z.string().min(3).max(150),
  uraian: z.string().min(3).max(255),
  sumberDana: z.string().min(2).max(80),
  pagu: z.coerce.number().nonnegative('Pagu tidak boleh negatif'),
  realisasi: z.coerce.number().nonnegative('Realisasi tidak boleh negatif').default(0),
});

export const STATUS_PROYEK = ['PERENCANAAN', 'BERJALAN', 'SELESAI', 'TERTUNDA'] as const;

export const LABEL_STATUS_PROYEK: Record<(typeof STATUS_PROYEK)[number], string> = {
  PERENCANAAN: 'Perencanaan',
  BERJALAN: 'Sedang berjalan',
  SELESAI: 'Selesai',
  TERTUNDA: 'Tertunda',
};

export const proyekSchema = z
  .object({
    nama: z.string().min(5).max(200),
    deskripsi: z.string().max(2000).optional(),
    lokasi: z.string().min(3).max(200),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    nilai: z.coerce.number().nonnegative(),
    sumberDana: z.string().min(2).max(80),
    kontraktor: z.string().max(150).optional(),
    pengawas: z.string().max(150).optional(),
    tanggalMulai: z.coerce.date(),
    tanggalSelesai: z.coerce.date().optional(),
    status: z.enum(STATUS_PROYEK).default('PERENCANAAN'),
    persentase: z.coerce.number().int().min(0).max(100).default(0),
    tahun: z.coerce.number().int().min(2015).max(2100),
  })
  .refine((v) => !v.tanggalSelesai || v.tanggalSelesai >= v.tanggalMulai, {
    message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
    path: ['tanggalSelesai'],
  });

export const progresProyekSchema = z.object({
  tanggal: z.coerce.date(),
  persentase: z.coerce.number().int().min(0).max(100),
  catatan: z.string().max(2000).optional(),
  fotoId: z.string().uuid().optional(),
});

export type ItemAnggaranInput = z.infer<typeof itemAnggaranSchema>;
export type ProyekInput = z.infer<typeof proyekSchema>;
export type ProgresProyekInput = z.infer<typeof progresProyekSchema>;

/** Rupiah tanpa desimal — jumlah anggaran desa selalu bulat dalam praktiknya. */
export const formatRupiah = (nilai: number | string) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(nilai));

/** Bentuk ringkas untuk angka besar di kartu statistik: Rp 1,2 M */
export function formatRupiahRingkas(nilai: number | string): string {
  const n = Number(nilai);
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(0)} jt`;
  if (n >= 1_000) return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return formatRupiah(n);
}
