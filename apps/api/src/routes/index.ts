import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { suratRoutes } from '../modules/surat/surat.routes.js';
import { pendudukRoutes, wilayahRoutes } from '../modules/penduduk/penduduk.routes.js';
import {
  agendaRoutes,
  beritaRoutes,
  pengumumanRoutes,
} from '../modules/konten/konten.routes.js';
import { berandaRoutes, profilRoutes } from '../modules/profil/profil.routes.js';
import { loginOpsional } from '../middleware/auth.js';
import { daftarStub, type PetaEndpoint } from './stub.js';

export const apiRoutes = Router();

// Peran dibaca bila token ada, tanpa menolak tamu. Berita draf hanya tampil
// bagi perangkat desa, dan itu perlu diketahui pada endpoint yang publik.
apiRoutes.use(loginOpsional);

// ── Modul yang sudah bertulang ──
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/beranda', berandaRoutes);
apiRoutes.use('/profil', profilRoutes);
apiRoutes.use('/kependudukan', pendudukRoutes);
apiRoutes.use('/wilayah', wilayahRoutes);
apiRoutes.use('/layanan/surat', suratRoutes);
apiRoutes.use('/berita', beritaRoutes);
apiRoutes.use('/pengumuman', pengumumanRoutes);
apiRoutes.use('/agenda', agendaRoutes);

const petaSiap: PetaEndpoint[] = [
  { section: 'Autentikasi', no: 0, fase: 1, basis: '/api/auth', status: 'siap' },
  { section: 'Beranda', no: 1, fase: 1, basis: '/api/beranda', status: 'siap' },
  { section: 'Profil Desa', no: 2, fase: 1, basis: '/api/profil', status: 'siap' },
  { section: 'Pelayanan Online', no: 4, fase: 1, basis: '/api/layanan/surat', status: 'siap' },
  { section: 'Data Kependudukan', no: 5, fase: 1, basis: '/api/kependudukan', status: 'siap' },
  { section: 'Wilayah RT/RW', no: 5, fase: 1, basis: '/api/wilayah', status: 'siap' },
  { section: 'Berita', no: 1, fase: 1, basis: '/api/berita', status: 'siap' },
  { section: 'Pengumuman', no: 1, fase: 1, basis: '/api/pengumuman', status: 'siap' },
  { section: 'Agenda', no: 1, fase: 1, basis: '/api/agenda', status: 'siap' },
];

// ── Placeholder untuk section lain, dibangkitkan dari registry @desa/shared ──
const { router: stubRouter, peta: petaStub } = daftarStub();
apiRoutes.use(stubRouter);

/** Peta seluruh permukaan API — berguna saat menyusun storyboard & integrasi FE. */
apiRoutes.get('/', (_req, res) => {
  res.json({
    ok: true,
    data: {
      nama: 'API Website Desa Bintang Ninggi I',
      versi: '0.1.0',
      endpoint: [...petaSiap, ...petaStub].sort((a, b) => a.fase - b.fase || a.no - b.no),
    },
  });
});
