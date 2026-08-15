import { Router } from 'express';
import { DASHBOARD_PERANGKAT, DASHBOARD_WARGA, SECTIONS } from '@desa/shared';

/** Modul yang endpoint-nya sudah ditulis tangan dan tidak perlu router stub. */
const SUDAH_ADA = new Set([
  'layanan',
  'kependudukan',
  'profil',
  'pengaduan',
  'keuangan',
  'pembangunan',
  'umkm',
  'bumdes',
  'pertanian',
  'peternakan',
  'perikanan',
  'pendidikan',
  'kesehatan',
  'lowongan',
  'bantuan-sosial',
  'peta',
  'kalender',
  'galeri',
  'kontak',
  // Ketiganya dilayani /api/dokumen dengan penyaringan `jenis`, bukan prefix
  // sendiri. Tanpa dicantumkan di sini, peta endpoint menyebutnya "kerangka"
  // padahal halamannya sudah berfungsi.
  'pemerintahan',
  'download',
  'ppid',
  'beranda',
]);

/**
 * Membuat router placeholder untuk tiap section yang belum digarap.
 *
 * Tujuannya bukan menunda pekerjaan, melainkan membuat seluruh permukaan API
 * terlihat sejak awal: `GET /api` memetakan semua endpoint yang direncanakan
 * beserta fasenya, sehingga storyboard dan frontend bisa jalan lebih dulu.
 */
export function daftarStub(): { router: Router; peta: PetaEndpoint[] } {
  const router = Router();
  const peta: PetaEndpoint[] = [];

  for (const section of SECTIONS) {
    if (SUDAH_ADA.has(section.id)) continue;

    const basis = `/${section.id}`;
    peta.push({
      section: section.title,
      no: section.no,
      fase: section.phase,
      basis: `/api${basis}`,
      status: 'stub',
    });

    router.use(basis, buatStub(section.title, section.phase));
  }

  for (const dash of [DASHBOARD_PERANGKAT, DASHBOARD_WARGA]) {
    const basis = dash.route; // /admin dan /warga
    peta.push({ section: dash.title, no: 0, fase: dash.phase, basis: `/api${basis}`, status: 'stub' });
    router.use(basis, buatStub(dash.title, dash.phase));
  }

  return { router, peta };
}

export interface PetaEndpoint {
  section: string;
  no: number;
  fase: number;
  basis: string;
  status: 'stub' | 'siap';
}

function buatStub(judul: string, fase: number): Router {
  const r = Router();
  r.all('*', (req, res) => {
    res.status(501).json({
      ok: false,
      error: {
        code: 'BELUM_DIIMPLEMENTASI',
        message: `Modul "${judul}" dijadwalkan pada Fase ${fase}. Endpoint ${req.method} ${req.baseUrl}${req.path} belum tersedia.`,
      },
    });
  });
  return r;
}
