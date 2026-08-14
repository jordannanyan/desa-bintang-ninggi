import { z } from 'zod';

/** Berita, pengumuman, dan agenda — konten yang dikelola perangkat desa. */

export const beritaSchema = z.object({
  judul: z.string().min(5, 'Judul minimal 5 karakter').max(200),
  ringkasan: z.string().max(500).optional(),
  isi: z.string().min(20, 'Isi berita minimal 20 karakter'),
  sampulUrl: z.string().max(255).optional(),
  penulis: z.string().min(2).max(120),
  /** false = tersimpan sebagai draf, belum tampil di halaman publik. */
  terbit: z.boolean().default(false),
});

export const pengumumanSchema = z
  .object({
    judul: z.string().min(5).max(200),
    isi: z.string().min(10),
    penting: z.boolean().default(false),
    mulai: z.coerce.date(),
    selesai: z.coerce.date().optional(),
    berkasUrl: z.string().max(255).optional(),
  })
  .refine((v) => !v.selesai || v.selesai >= v.mulai, {
    message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
    path: ['selesai'],
  });

export const KATEGORI_AGENDA = [
  'MUSYAWARAH_DESA',
  'POSYANDU',
  'GOTONG_ROYONG',
  'FESTIVAL',
  'HARI_BESAR',
  'RAPAT_RT',
  'LAINNYA',
] as const;

export const LABEL_KATEGORI_AGENDA: Record<(typeof KATEGORI_AGENDA)[number], string> = {
  MUSYAWARAH_DESA: 'Musyawarah Desa',
  POSYANDU: 'Posyandu',
  GOTONG_ROYONG: 'Gotong Royong',
  FESTIVAL: 'Festival',
  HARI_BESAR: 'Hari Besar',
  RAPAT_RT: 'Rapat RT',
  LAINNYA: 'Lainnya',
};

export const agendaSchema = z
  .object({
    judul: z.string().min(5).max(200),
    kategori: z.enum(KATEGORI_AGENDA).default('LAINNYA'),
    deskripsi: z.string().max(2000).optional(),
    mulai: z.coerce.date(),
    selesai: z.coerce.date().optional(),
    lokasi: z.string().max(200).optional(),
    penyelenggara: z.string().max(120).optional(),
  })
  .refine((v) => !v.selesai || v.selesai >= v.mulai, {
    message: 'Waktu selesai tidak boleh sebelum waktu mulai',
    path: ['selesai'],
  });

export type BeritaInput = z.infer<typeof beritaSchema>;
export type PengumumanInput = z.infer<typeof pengumumanSchema>;
export type AgendaInput = z.infer<typeof agendaSchema>;
