import { Router } from 'express';
import { JENIS_SURAT, ajukanSuratSchema, filterSuratSchema, tinjauSuratSchema } from '@desa/shared';
import { validasi } from '../../middleware/validate.js';
import { wajibLogin, wajibPeran } from '../../middleware/auth.js';

export const suratRoutes = Router();

const belum = (apa: string) => (_req: unknown, res: any) =>
  res.status(501).json({ ok: false, error: { code: 'BELUM_DIIMPLEMENTASI', message: `TODO: ${apa}` } });

/** Katalog jenis surat + field yang harus diisi — dipakai form dinamis di frontend. */
suratRoutes.get('/jenis', (_req, res) => {
  res.json({ ok: true, data: JENIS_SURAT });
});

/** Verifikasi QR Code pada surat cetak. Publik, tanpa login. */
suratRoutes.get('/verifikasi/:kode', belum('verifikasi keaslian surat via hash dokumen'));

suratRoutes.post('/', wajibLogin, validasi(ajukanSuratSchema), belum('ajukan surat baru'));
suratRoutes.get('/saya', wajibLogin, validasi(filterSuratSchema, 'query'), belum('riwayat surat milik warga'));
suratRoutes.get('/saya/:id', wajibLogin, belum('detail pengajuan milik warga'));
suratRoutes.get('/saya/:id/pdf', wajibLogin, belum('unduh PDF surat yang sudah disetujui'));

// ── Sisi perangkat desa ──
suratRoutes.get('/', wajibLogin, wajibPeran('PERANGKAT', 'ADMIN'), validasi(filterSuratSchema, 'query'), belum('daftar seluruh pengajuan'));
suratRoutes.patch('/:id/tinjau', wajibLogin, wajibPeran('PERANGKAT', 'ADMIN'), validasi(tinjauSuratSchema), belum('setujui / tolak pengajuan'));
suratRoutes.post('/:id/terbitkan', wajibLogin, wajibPeran('PERANGKAT', 'ADMIN'), belum('generate PDF + nomor surat + QR'));
