import { z } from 'zod';

export const KATEGORI_PENGADUAN = [
  'JALAN_RUSAK',
  'LAMPU_MATI',
  'SAMPAH',
  'BANJIR',
  'PELAYANAN',
  'KONFLIK_SOSIAL',
  'KEBAKARAN',
  'INFRASTRUKTUR',
] as const;

export const STATUS_PENGADUAN = ['BARU', 'DIVERIFIKASI', 'DITANGANI', 'SELESAI', 'DITOLAK'] as const;

export const buatPengaduanSchema = z.object({
  kategori: z.enum(KATEGORI_PENGADUAN),
  judul: z.string().min(5).max(150),
  deskripsi: z.string().min(10).max(2000),
  lokasiTeks: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  fotoIds: z.array(z.string().uuid()).max(5).default([]),
  anonim: z.boolean().default(false),
});

export type KategoriPengaduan = (typeof KATEGORI_PENGADUAN)[number];
export type StatusPengaduan = (typeof STATUS_PENGADUAN)[number];
export type BuatPengaduanInput = z.infer<typeof buatPengaduanSchema>;
