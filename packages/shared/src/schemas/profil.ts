import { z } from 'zod';

/** Profil desa — satu baris, disunting perangkat desa lewat dashboard. */
export const profilDesaSchema = z.object({
  namaDesa: z.string().min(2).max(120),
  kecamatan: z.string().min(2).max(80),
  kabupaten: z.string().min(2).max(80),
  provinsi: z.string().min(2).max(80),
  kodePos: z.string().max(10).optional(),
  luasWilayahKm: z.coerce.number().nonnegative().optional(),
  sejarah: z.string().optional(),
  visi: z.string().optional(),
  /** Daftar poin misi. */
  misi: z.array(z.string().min(3)).optional(),
  sambutanKades: z.string().optional(),
  prestasi: z
    .array(
      z.object({
        judul: z.string().min(3).max(200),
        tahun: z.coerce.number().int().min(1900).max(2100),
        keterangan: z.string().max(500).optional(),
      }),
    )
    .optional(),
  potensi: z
    .array(
      z.object({
        judul: z.string().min(3).max(200),
        keterangan: z.string().max(500).optional(),
      }),
    )
    .optional(),
  videoProfilUrl: z.string().max(255).optional(),
  jamPelayanan: z.record(z.string(), z.string()).optional(),
  nomorDarurat: z.record(z.string(), z.string()).optional(),
  alamatKantor: z.string().max(255).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  waDesa: z.string().max(30).optional(),
  email: z.string().email('Format email tidak valid').max(120).optional().or(z.literal('')),
  facebook: z.string().max(255).optional(),
  instagram: z.string().max(255).optional(),
  tiktok: z.string().max(255).optional(),
  youtube: z.string().max(255).optional(),
});

export const perangkatSchema = z.object({
  pendudukId: z.string().uuid('Pilih perangkat dari data penduduk'),
  jabatan: z.string().min(3).max(80),
  uraianTugas: z.string().max(2000).optional(),
  urutan: z.coerce.number().int().min(0).default(0),
  fotoUrl: z.string().max(255).optional(),
  mulaiMenjabat: z.coerce.date().optional(),
  aktif: z.boolean().default(true),
});

export const JENIS_LEMBAGA = ['BPD', 'LPM', 'PKK', 'KARANG_TARUNA', 'BUMDES'] as const;

export const LABEL_LEMBAGA: Record<(typeof JENIS_LEMBAGA)[number], string> = {
  BPD: 'Badan Permusyawaratan Desa',
  LPM: 'Lembaga Pemberdayaan Masyarakat',
  PKK: 'Pemberdayaan Kesejahteraan Keluarga',
  KARANG_TARUNA: 'Karang Taruna',
  BUMDES: 'Badan Usaha Milik Desa',
};

export type ProfilDesaInput = z.infer<typeof profilDesaSchema>;
export type PerangkatInput = z.infer<typeof perangkatSchema>;
