import { z } from 'zod';

/**
 * NIK adalah identitas publik, bukan rahasia. Karena itu login TIDAK boleh
 * hanya bermodal NIK: warga mengaktifkan akun sekali (diverifikasi perangkat
 * desa atau OTP WhatsApp), lalu login dengan NIK + PIN miliknya sendiri.
 */
export const nikSchema = z
  .string()
  .regex(/^\d{16}$/, 'NIK harus 16 digit angka');

export const pinSchema = z
  .string()
  .regex(/^\d{6}$/, 'PIN harus 6 digit angka');

export const loginWargaSchema = z.object({
  nik: nikSchema,
  pin: pinSchema,
});

export const aktivasiWargaSchema = z
  .object({
    nik: nikSchema,
    kodeAktivasi: z.string().min(6, 'Kode aktivasi tidak valid'),
    pin: pinSchema,
    konfirmasiPin: pinSchema,
  })
  .refine((v) => v.pin === v.konfirmasiPin, {
    message: 'Konfirmasi PIN tidak sama',
    path: ['konfirmasiPin'],
  });

export const loginPerangkatSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
});

export const PERAN = ['WARGA', 'PERANGKAT', 'ADMIN'] as const;
export type Peran = (typeof PERAN)[number];

export type LoginWargaInput = z.infer<typeof loginWargaSchema>;
export type AktivasiWargaInput = z.infer<typeof aktivasiWargaSchema>;
export type LoginPerangkatInput = z.infer<typeof loginPerangkatSchema>;
