import { z } from 'zod';
import {
  AGAMA,
  GOLONGAN_DARAH,
  HUBUNGAN_KELUARGA,
  KEWARGANEGARAAN,
  PEKERJAAN,
  PENDIDIKAN,
  STATUS_PERKAWINAN,
} from '../constants/kependudukan.js';
import { nikSchema } from './auth.js';

const nomorKkSchema = z.string().regex(/^\d{16}$/, 'Nomor KK harus 16 digit angka');

/**
 * Form data penduduk mengikuti susunan Kartu Keluarga.
 *
 * `pekerjaan` sengaja berupa string bebas dengan daftar saran, bukan enum ketat:
 * daftar pekerjaan Dukcapil panjang dan sesekali berubah, dan perangkat desa
 * harus bisa memasukkan yang belum terdaftar tanpa menunggu rilis baru.
 */
export const pendudukSchema = z.object({
  nik: nikSchema,
  nomorKk: nomorKkSchema,
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(120),
  jenisKelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN']),
  tempatLahir: z.string().min(2).max(80),
  tanggalLahir: z.coerce.date().max(new Date(), 'Tanggal lahir tidak boleh di masa depan'),
  agama: z.enum(AGAMA),
  pendidikan: z.enum(PENDIDIKAN),
  pekerjaan: z.string().min(2).max(60),
  statusKawin: z.enum(['BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI']),
  hubunganKeluarga: z.enum(HUBUNGAN_KELUARGA),
  kewarganegaraan: z.enum(KEWARGANEGARAAN).default('WNI'),
  namaAyah: z.string().max(120).optional(),
  namaIbu: z.string().max(120).optional(),
  golonganDarah: z.enum(GOLONGAN_DARAH).optional(),
  noAktaLahir: z.string().max(50).optional(),
  noAktaKawin: z.string().max(50).optional(),
  disabilitas: z.string().max(60).optional(),
  pendatang: z.boolean().default(false),
});

export const kartuKeluargaSchema = z.object({
  nomorKk: nomorKkSchema,
  alamat: z.string().min(5).max(255),
  rt: z.string().max(5),
  rw: z.string().max(5),
  dusun: z.string().max(80).optional(),
  kodePos: z.string().max(10).optional(),
});

export const filterPendudukSchema = z.object({
  /** Nama (pencarian sebagian) atau NIK lengkap 16 digit. */
  q: z.string().optional(),
  rtId: z.string().uuid().optional(),
  jenisKelamin: z.enum(['LAKI_LAKI', 'PEREMPUAN']).optional(),
  /** Bawaannya hanya menampilkan penduduk aktif. */
  status: z.enum(['AKTIF', 'MENINGGAL', 'PINDAH', 'SEMUA']).default('AKTIF'),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(25),
});

/**
 * Penduduk tidak pernah dihapus permanen.
 *
 * Riwayat surat yang pernah terbit atas nama seseorang harus tetap bisa
 * ditelusuri, jadi yang dilakukan adalah menandai meninggal atau pindah.
 */
export const nonaktifkanPendudukSchema = z
  .object({
    alasan: z.enum(['MENINGGAL', 'PINDAH']),
    tanggal: z.coerce.date().max(new Date(), 'Tanggal tidak boleh di masa depan'),
    keterangan: z.string().max(255).optional(),
  })
  .strict();

export type NonaktifkanPendudukInput = z.infer<typeof nonaktifkanPendudukSchema>;

/** Hasil impor CSV, dikembalikan apa adanya agar perangkat desa tahu baris mana yang gagal. */
export interface HasilImporPenduduk {
  totalBaris: number;
  berhasil: number;
  dilewati: number;
  gagal: Array<{ baris: number; nama?: string; pesan: string }>;
}

export const STATUS_PERKAWINAN_LABEL = STATUS_PERKAWINAN;
export const PEKERJAAN_SARAN = PEKERJAAN;

export type PendudukInput = z.infer<typeof pendudukSchema>;
export type KartuKeluargaInput = z.infer<typeof kartuKeluargaSchema>;
export type FilterPendudukInput = z.infer<typeof filterPendudukSchema>;
