import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { suratRoutes } from '../modules/surat/surat.routes.js';
import { daftarStub, type PetaEndpoint } from './stub.js';

export const apiRoutes = Router();

// ── Modul yang sudah bertulang ──
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/layanan/surat', suratRoutes);

const petaSiap: PetaEndpoint[] = [
  { section: 'Autentikasi', no: 0, fase: 1, basis: '/api/auth', status: 'siap' },
  { section: 'Pelayanan Online', no: 4, fase: 1, basis: '/api/layanan/surat', status: 'siap' },
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
