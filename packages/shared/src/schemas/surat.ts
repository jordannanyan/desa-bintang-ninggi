import { z } from 'zod';
import { JENIS_SURAT, STATUS_PENGAJUAN } from '../constants/surat.js';

const kodeSurat = JENIS_SURAT.map((s) => s.kode) as [string, ...string[]];

export const ajukanSuratSchema = z.object({
  jenisSurat: z.enum(kodeSurat),
  keperluan: z.string().min(5, 'Keperluan minimal 5 karakter').max(500),
  /** Field dinamis sesuai `fieldTambahan` pada katalog jenis surat. */
  data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  lampiranIds: z.array(z.string().uuid()).default([]),
});

export const tinjauSuratSchema = z
  .object({
    status: z.enum(STATUS_PENGAJUAN),
    catatan: z.string().max(500).optional(),
  })
  .refine((v) => v.status !== 'DITOLAK' || (v.catatan && v.catatan.length > 0), {
    message: 'Alasan penolakan wajib diisi',
    path: ['catatan'],
  });

export const filterSuratSchema = z.object({
  status: z.enum(STATUS_PENGAJUAN).optional(),
  jenisSurat: z.enum(kodeSurat).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});

export type AjukanSuratInput = z.infer<typeof ajukanSuratSchema>;
export type TinjauSuratInput = z.infer<typeof tinjauSuratSchema>;
export type FilterSuratInput = z.infer<typeof filterSuratSchema>;
