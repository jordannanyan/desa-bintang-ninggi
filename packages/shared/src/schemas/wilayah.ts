import { z } from 'zod';

/** RT/RW dipisah dari data penduduk karena dipakai juga oleh peta dan pengaduan. */

export const rwSchema = z.object({
  nomor: z.string().min(1).max(5),
  ketua: z.string().max(120).optional(),
});

export const rtSchema = z.object({
  nomor: z.string().min(1).max(5),
  rwId: z.string().uuid(),
  ketua: z.string().max(120).optional(),
});

export type RwInput = z.infer<typeof rwSchema>;
export type RtInput = z.infer<typeof rtSchema>;

/**
 * Ringkasan statistik kependudukan.
 *
 * Seluruhnya agregat — tidak ada satu pun kolom yang bisa dilacak ke individu,
 * karena bentuk inilah yang ditampilkan di halaman publik.
 */
export interface StatistikKependudukan {
  totalPenduduk: number;
  totalKk: number;
  lakiLaki: number;
  perempuan: number;
  balita: number;
  lansia: number;
  pendatang: number;
  disabilitas: number;
  kelahiranTahunIni: number;
  kematianTahunIni: number;
  pindahTahunIni: number;
  perKelompokUsia: Array<{ label: string; jumlah: number }>;
  perPendidikan: Array<{ label: string; jumlah: number }>;
  perAgama: Array<{ label: string; jumlah: number }>;
  perPekerjaan: Array<{ label: string; jumlah: number }>;
  perStatusKawin: Array<{ label: string; jumlah: number }>;
  perRt: Array<{ label: string; jumlah: number }>;
}

/** Kelompok usia yang lazim dipakai laporan desa. */
export const KELOMPOK_USIA = [
  { label: '0-4 tahun', min: 0, max: 4 },
  { label: '5-14 tahun', min: 5, max: 14 },
  { label: '15-24 tahun', min: 15, max: 24 },
  { label: '25-44 tahun', min: 25, max: 44 },
  { label: '45-59 tahun', min: 45, max: 59 },
  { label: '60 tahun ke atas', min: 60, max: 200 },
] as const;
