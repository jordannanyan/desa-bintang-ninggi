import { z } from 'zod';
import { KATEGORI_UMKM, STATUS_PESANAN } from '../constants/umkm.js';

export const umkmSchema = z.object({
  nama: z.string().min(3).max(150),
  kategori: z.enum(KATEGORI_UMKM),
  deskripsi: z.string().max(2000).optional(),
  alamat: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  whatsapp: z
    .string()
    .regex(/^(\+62|62|0)8\d{7,12}$/, 'Nomor WhatsApp tidak valid (contoh: 08123456789)'),
  namaBank: z.string().max(60).optional(),
  nomorRekening: z.string().max(40).optional(),
  atasNama: z.string().max(120).optional(),
  qrisBerkasId: z.string().uuid().optional(),
  logoId: z.string().uuid().optional(),
});

export const produkSchema = z.object({
  nama: z.string().min(3).max(150),
  deskripsi: z.string().max(2000).optional(),
  harga: z.number().nonnegative('Harga tidak boleh negatif'),
  satuan: z.string().max(20).default('pcs'),
  stok: z.number().int().nonnegative().default(0),
  fotoId: z.string().uuid().optional(),
  aktif: z.boolean().default(true),
});

export const buatPesananSchema = z.object({
  umkmId: z.string().uuid(),
  item: z
    .array(
      z.object({
        produkId: z.string().uuid(),
        jumlah: z.number().int().min(1),
      }),
    )
    .min(1, 'Keranjang masih kosong'),
  catatan: z.string().max(500).optional(),
  alamatKirim: z.string().max(255).optional(),
});

/** Pembeli mengunggah bukti transfer QRIS. */
export const unggahBuktiBayarSchema = z.object({
  berkasId: z.string().uuid(),
  nominal: z.number().positive().optional(),
  tanggalTransfer: z.coerce.date().optional(),
  catatan: z.string().max(255).optional(),
});

/** Penjual memutuskan bukti bayar diterima atau tidak. */
export const verifikasiBayarSchema = z
  .object({
    diterima: z.boolean(),
    alasanTolak: z.string().max(500).optional(),
  })
  .refine((v) => v.diterima || (v.alasanTolak && v.alasanTolak.length > 0), {
    message: 'Alasan penolakan wajib diisi agar pembeli tahu apa yang harus diperbaiki',
    path: ['alasanTolak'],
  });

export const ubahStatusPesananSchema = z.object({
  status: z.enum(STATUS_PESANAN),
  catatan: z.string().max(500).optional(),
});

export const ulasanSchema = z.object({
  produkId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  komentar: z.string().max(1000).optional(),
});

export type UmkmInput = z.infer<typeof umkmSchema>;
export type ProdukInput = z.infer<typeof produkSchema>;
export type BuatPesananInput = z.infer<typeof buatPesananSchema>;
export type UnggahBuktiBayarInput = z.infer<typeof unggahBuktiBayarSchema>;
export type VerifikasiBayarInput = z.infer<typeof verifikasiBayarSchema>;
