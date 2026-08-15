import { z } from 'zod';

/**
 * Tujuh section — BumDes, Pertanian, Peternakan, Perikanan, Pendidikan,
 * Kesehatan, dan Lowongan Kerja — membutuhkan bentuk data yang sama:
 * informasi tertulis, daftar fasilitas, jadwal, dan harga komoditas.
 * Semuanya dibedakan lewat kolom `sektor`, bukan tujuh skema terpisah.
 */

export const SEKTOR = [
  'BUMDES',
  'PERTANIAN',
  'PETERNAKAN',
  'PERIKANAN',
  'PENDIDIKAN',
  'KESEHATAN',
  'KETENAGAKERJAAN',
] as const;

export type Sektor = (typeof SEKTOR)[number];

export const LABEL_SEKTOR: Record<Sektor, string> = {
  BUMDES: 'BumDes',
  PERTANIAN: 'Pertanian',
  PETERNAKAN: 'Peternakan',
  PERIKANAN: 'Perikanan',
  PENDIDIKAN: 'Pendidikan',
  KESEHATAN: 'Kesehatan',
  KETENAGAKERJAAN: 'Ketenagakerjaan',
};

/** Saran kategori per sektor, mengikuti daftar pada dokumen rencana desa. */
export const KATEGORI_SEKTOR: Record<Sektor, string[]> = {
  BUMDES: ['Profil', 'Unit Usaha', 'Laporan', 'Produk', 'Penyewaan Alat', 'Investasi Desa'],
  PERTANIAN: ['Jadwal Tanam', 'Pupuk', 'Bantuan', 'Penyuluhan', 'Alat Pertanian', 'Irigasi'],
  PETERNAKAN: ['Vaksin Ternak', 'Penyakit', 'Bantuan', 'Bibit', 'Jadwal Penyuluhan'],
  PERIKANAN: ['Bibit Ikan', 'Bantuan', 'Pelatihan'],
  PENDIDIKAN: ['Beasiswa', 'Perpustakaan Desa', 'Jadwal Belajar', 'Kursus'],
  KESEHATAN: ['Jadwal Imunisasi', 'Ambulans', 'Stunting', 'Ibu Hamil', 'Jadwal Dokter'],
  KETENAGAKERJAAN: ['Pelatihan Kerja', 'Informasi Umum'],
};

export const informasiSektorSchema = z.object({
  sektor: z.enum(SEKTOR),
  kategori: z.string().min(2).max(80),
  judul: z.string().min(5, 'Judul minimal 5 karakter').max(200),
  isi: z.string().min(10, 'Isi minimal 10 karakter'),
  gambarId: z.string().uuid().optional(),
  lampiranId: z.string().uuid().optional(),
  urutan: z.coerce.number().int().min(0).default(0),
  terbit: z.boolean().default(true),
});

export const JENIS_FASILITAS = [
  'PAUD',
  'SD',
  'POSYANDU',
  'PUSTU',
  'PUSKESMAS',
  'PERPUSTAKAAN',
  'KANTOR_DESA',
  'BALAI_DESA',
  'MASJID',
  'GEREJA',
  'PASAR',
  'LAPANGAN',
  'IRIGASI',
  'LAINNYA',
] as const;

export type JenisFasilitas = (typeof JENIS_FASILITAS)[number];

export const LABEL_FASILITAS: Record<JenisFasilitas, string> = {
  PAUD: 'PAUD',
  SD: 'Sekolah Dasar',
  POSYANDU: 'Posyandu',
  PUSTU: 'Pustu',
  PUSKESMAS: 'Puskesmas',
  PERPUSTAKAAN: 'Perpustakaan Desa',
  KANTOR_DESA: 'Kantor Desa',
  BALAI_DESA: 'Balai Desa',
  MASJID: 'Masjid',
  GEREJA: 'Gereja',
  PASAR: 'Pasar',
  LAPANGAN: 'Lapangan',
  IRIGASI: 'Irigasi',
  LAINNYA: 'Lainnya',
};

/** Fasilitas yang ditampilkan pada halaman sektor tertentu. */
export const FASILITAS_SEKTOR: Partial<Record<Sektor, JenisFasilitas[]>> = {
  PENDIDIKAN: ['PAUD', 'SD', 'PERPUSTAKAAN'],
  KESEHATAN: ['POSYANDU', 'PUSTU', 'PUSKESMAS'],
  PERTANIAN: ['IRIGASI'],
};

export const fasilitasSchema = z.object({
  jenis: z.enum(JENIS_FASILITAS),
  nama: z.string().min(3).max(150),
  alamat: z.string().max(255).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  kontak: z.string().max(60).optional(),
  jamOperasional: z.string().max(120).optional(),
  keterangan: z.string().max(2000).optional(),
  fotoId: z.string().uuid().optional(),
  aktif: z.boolean().default(true),
});

export const hargaKomoditasSchema = z.object({
  sektor: z.enum(SEKTOR),
  komoditas: z.string().min(2).max(100),
  satuan: z.string().min(1).max(30),
  harga: z.coerce.number().nonnegative(),
  tanggal: z.coerce.date(),
  sumber: z.string().max(120).optional(),
  catatan: z.string().max(255).optional(),
});

export const JENIS_LOWONGAN = ['LOWONGAN', 'MAGANG', 'PELATIHAN', 'REKRUTMEN'] as const;

export const LABEL_LOWONGAN: Record<(typeof JENIS_LOWONGAN)[number], string> = {
  LOWONGAN: 'Lowongan Kerja',
  MAGANG: 'Magang',
  PELATIHAN: 'Pelatihan Kerja',
  REKRUTMEN: 'Rekrutmen Perusahaan',
};

export const lowonganSchema = z.object({
  jenis: z.enum(JENIS_LOWONGAN).default('LOWONGAN'),
  judul: z.string().min(5).max(200),
  penyelenggara: z.string().min(2).max(150),
  deskripsi: z.string().min(10),
  persyaratan: z.string().optional(),
  lokasi: z.string().max(150).optional(),
  imbalan: z.string().max(120).optional(),
  kontak: z.string().max(150).optional(),
  batasLamar: z.coerce.date().optional(),
  aktif: z.boolean().default(true),
});

export type InformasiSektorInput = z.infer<typeof informasiSektorSchema>;
export type FasilitasInput = z.infer<typeof fasilitasSchema>;
export type HargaKomoditasInput = z.infer<typeof hargaKomoditasSchema>;
export type LowonganInput = z.infer<typeof lowonganSchema>;
