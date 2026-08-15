import { z } from 'zod';

/**
 * Satu tabel dokumen menopang tiga section sekaligus: Pemerintahan Desa,
 * PPID, dan Download Center. Yang membedakan hanya kolom `jenis`, sehingga
 * perangkat desa cukup mengunggah sekali dan berkasnya muncul di tempat
 * yang tepat.
 */

export const JENIS_DOKUMEN = [
  'PERDES',
  'PERKADES',
  'SK_KADES',
  'RPJMDES',
  'RKPDES',
  'APBDES',
  'REALISASI_APBDES',
  'PPID_BERKALA',
  'PPID_SETIAP_SAAT',
  'PPID_SERTA_MERTA',
  'FORMULIR',
  'PROPOSAL',
  'LAPORAN',
] as const;

export type JenisDokumen = (typeof JENIS_DOKUMEN)[number];

export const LABEL_JENIS_DOKUMEN: Record<JenisDokumen, string> = {
  PERDES: 'Peraturan Desa',
  PERKADES: 'Peraturan Kepala Desa',
  SK_KADES: 'SK Kepala Desa',
  RPJMDES: 'RPJMDes',
  RKPDES: 'RKPDes',
  APBDES: 'APBDes',
  REALISASI_APBDES: 'Laporan Realisasi APBDes',
  PPID_BERKALA: 'Informasi Berkala',
  PPID_SETIAP_SAAT: 'Informasi Setiap Saat',
  PPID_SERTA_MERTA: 'Informasi Serta Merta',
  FORMULIR: 'Formulir',
  PROPOSAL: 'Proposal',
  LAPORAN: 'Laporan',
};

/** Pengelompokan jenis dokumen menurut halaman yang menampilkannya. */
export const DOKUMEN_PEMERINTAHAN: JenisDokumen[] = [
  'PERDES',
  'PERKADES',
  'SK_KADES',
  'RPJMDES',
  'RKPDES',
  'APBDES',
  'REALISASI_APBDES',
];

export const DOKUMEN_PPID: JenisDokumen[] = [
  'PPID_BERKALA',
  'PPID_SETIAP_SAAT',
  'PPID_SERTA_MERTA',
];

export const DOKUMEN_UNDUHAN: JenisDokumen[] = ['FORMULIR', 'PROPOSAL', 'LAPORAN'];

/** Penjelasan klasifikasi PPID sesuai UU 14/2008 tentang Keterbukaan Informasi Publik. */
export const KETERANGAN_PPID: Record<string, string> = {
  PPID_BERKALA:
    'Informasi yang wajib disediakan dan diumumkan secara berkala, sekurang-kurangnya enam bulan sekali.',
  PPID_SETIAP_SAAT:
    'Informasi yang wajib tersedia setiap saat dan dapat diminta warga kapan pun.',
  PPID_SERTA_MERTA:
    'Informasi yang wajib diumumkan serta-merta karena menyangkut hajat hidup orang banyak dan ketertiban umum.',
};

export const dokumenSchema = z.object({
  jenis: z.enum(JENIS_DOKUMEN),
  judul: z.string().min(5, 'Judul minimal 5 karakter').max(200),
  nomor: z.string().max(80).optional(),
  tahun: z.coerce.number().int().min(1945).max(2100),
  ringkasan: z.string().max(2000).optional(),
  berkasId: z.string().uuid().optional(),
  publik: z.boolean().default(true),
});

export type DokumenInput = z.infer<typeof dokumenSchema>;
