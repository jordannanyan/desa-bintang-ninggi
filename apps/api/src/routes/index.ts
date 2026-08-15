import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { suratRoutes } from '../modules/surat/surat.routes.js';
import { pendudukRoutes, wilayahRoutes } from '../modules/penduduk/penduduk.routes.js';
import {
  agendaRoutes,
  beritaRoutes,
  galeriRoutes,
  pengumumanRoutes,
} from '../modules/konten/konten.routes.js';
import { berandaRoutes, profilRoutes } from '../modules/profil/profil.routes.js';
import { berkasRoutes } from '../modules/berkas/berkas.routes.js';
import { pengaduanRoutes } from '../modules/pengaduan/pengaduan.routes.js';
import { keuanganRoutes } from '../modules/keuangan/keuangan.routes.js';
import { pembangunanRoutes } from '../modules/pembangunan/pembangunan.routes.js';
import { dokumenRoutes } from '../modules/dokumen/dokumen.routes.js';
import { umkmRoutes } from '../modules/umkm/umkm.routes.js';
import {
  bantuanRoutes,
  fasilitasRoutes,
  hargaRoutes,
  informasiRoutes,
  lowonganRoutes,
  petaRoutes,
} from '../modules/sektor/sektor.routes.js';
import {
  absensiRoutes,
  asetRoutes,
  kegiatanRoutes,
  sayaRoutes,
  sertifikatRoutes,
  statistikRoutes,
  tagihanRoutes,
} from '../modules/tatausaha/tatausaha.routes.js';
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
apiRoutes.use('/galeri', galeriRoutes);
apiRoutes.use('/berkas', berkasRoutes);
apiRoutes.use('/pengaduan', pengaduanRoutes);
apiRoutes.use('/keuangan', keuanganRoutes);
apiRoutes.use('/pembangunan', pembangunanRoutes);
apiRoutes.use('/dokumen', dokumenRoutes);
apiRoutes.use('/umkm', umkmRoutes);
apiRoutes.use('/informasi', informasiRoutes);
apiRoutes.use('/fasilitas', fasilitasRoutes);
apiRoutes.use('/harga-komoditas', hargaRoutes);
apiRoutes.use('/lowongan', lowonganRoutes);
apiRoutes.use('/bantuan-sosial', bantuanRoutes);
apiRoutes.use('/peta', petaRoutes);
apiRoutes.use('/absensi', absensiRoutes);
apiRoutes.use('/aset', asetRoutes);
apiRoutes.use('/tagihan', tagihanRoutes);
apiRoutes.use('/sertifikat', sertifikatRoutes);
apiRoutes.use('/kegiatan', kegiatanRoutes);
apiRoutes.use('/saya', sayaRoutes);
apiRoutes.use('/statistik', statistikRoutes);

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
  { section: 'Berkas Unggahan', no: 0, fase: 2, basis: '/api/berkas', status: 'siap' },
  { section: 'Pengaduan Masyarakat', no: 8, fase: 2, basis: '/api/pengaduan', status: 'siap' },
  { section: 'Transparansi Keuangan', no: 6, fase: 2, basis: '/api/keuangan', status: 'siap' },
  { section: 'Pembangunan Desa', no: 7, fase: 2, basis: '/api/pembangunan', status: 'siap' },
  { section: 'Dokumen (PPID + Unduhan)', no: 21, fase: 2, basis: '/api/dokumen', status: 'siap' },
  { section: 'UMKM Desa', no: 9, fase: 3, basis: '/api/umkm', status: 'siap' },
  { section: 'Informasi Sektoral', no: 10, fase: 3, basis: '/api/informasi', status: 'siap' },
  { section: 'Fasilitas Desa', no: 12, fase: 4, basis: '/api/fasilitas', status: 'siap' },
  { section: 'Harga Komoditas', no: 13, fase: 3, basis: '/api/harga-komoditas', status: 'siap' },
  { section: 'Lowongan Kerja', no: 17, fase: 3, basis: '/api/lowongan', status: 'siap' },
  { section: 'Bantuan Sosial', no: 16, fase: 3, basis: '/api/bantuan-sosial', status: 'siap' },
  { section: 'Peta Desa Interaktif', no: 20, fase: 4, basis: '/api/peta', status: 'siap' },
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
