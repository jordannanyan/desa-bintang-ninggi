import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DASHBOARD_PERANGKAT, DASHBOARD_WARGA, SECTIONS, type Peran } from '@desa/shared';
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { HalamanPlaceholder, dariSection } from '../components/HalamanPlaceholder';
import { RuteTerproteksi } from '../components/RuteTerproteksi';
import { Beranda } from '../pages/Beranda';
import { Masuk } from '../pages/Masuk';
import { MasukPerangkat } from '../pages/MasukPerangkat';
import { Kependudukan } from '../pages/Kependudukan';
import { Layanan } from '../pages/Layanan';
import { AjukanSurat } from '../pages/AjukanSurat';
import { Verifikasi } from '../pages/Verifikasi';
import { PendudukList } from '../pages/admin/PendudukList';
import { PendudukForm } from '../pages/admin/PendudukForm';
import { PendudukImpor } from '../pages/admin/PendudukImpor';
import { SuratList } from '../pages/admin/SuratList';
import { SuratDetail } from '../pages/admin/SuratDetail';
import { SuratSaya } from '../pages/warga/SuratSaya';
import { ProfilDesa } from '../pages/ProfilDesa';
import { BeritaList, BeritaDetail } from '../pages/Berita';
import { Agenda, Pengumuman } from '../pages/PengumumanAgenda';
import { BeritaKelola } from '../pages/admin/BeritaKelola';
import { AgendaKelola } from '../pages/admin/AgendaKelola';
import { ProfilDesaForm } from '../pages/admin/ProfilDesaForm';

/**
 * Halaman yang sudah digarap, menggantikan kerangka yang dibangkitkan registry.
 * Kunci = rute penuh. Menambah halaman asli cukup didaftarkan di sini.
 */
const HALAMAN_ASLI: Record<string, JSX.Element> = {
  '/kependudukan': <Kependudukan />,
  '/layanan': <Layanan />,
  '/profil': <ProfilDesa />,
  '/berita': <BeritaList />,
  '/pengumuman': <Pengumuman />,
  '/agenda': <Agenda />,
  '/admin/penduduk': <PendudukList />,
  '/admin/surat': <SuratList />,
  '/admin/berita': <BeritaKelola />,
  '/admin/agenda': <AgendaKelola />,
  '/warga/surat': <SuratSaya />,
};

/**
 * Seluruh rute dibangkitkan dari registry SECTIONS di @desa/shared.
 *
 * Menambah/menghapus halaman cukup dilakukan di satu tempat, dan storyboard
 * (`npm run storyboard`) otomatis ikut sinkron. Ganti `element` sebuah section
 * dengan komponen asli begitu halaman itu digarap.
 */

const rutePublik = SECTIONS.flatMap((section) => {
  // Beranda ditangani terpisah sebagai rute index, jadi rute sectionnya
  // tidak dibangkitkan di sini. Sub-halamannya TETAP harus dibangkitkan:
  // /berita, /pengumuman, dan /agenda berasal dari sana, dan sempat hilang
  // karena seluruh section beranda ikut tersaring keluar.
  const ruteSection =
    section.route === '/'
      ? []
      : [{ path: section.route, element: HALAMAN_ASLI[section.route] ?? dariSection(section) }];

  const ruteSubHalaman = section.items
    .filter((item) => item.path)
    .map((item) => {
      const rute = `${section.route}${item.path}`.replace('//', '/');
      return {
        path: rute,
        element: HALAMAN_ASLI[rute] ?? (
          <HalamanPlaceholder
            judul={`${section.title} — ${item.label}`}
            ringkasan={item.note ?? `Sub-halaman dari ${section.title}.`}
            fase={section.phase}
            items={[]}
            route={section.route}
          />
        ),
      };
    });

  return [...ruteSection, ...ruteSubHalaman];
});

/**
 * Dashboard dibungkus RuteTerproteksi: tamu diarahkan ke halaman login yang
 * sesuai, dan warga tidak bisa membuka dashboard perangkat sekadar dengan
 * mengetik alamatnya. Penjagaan sebenarnya tetap di backend.
 */
const ruteDashboard = (
  dash: typeof DASHBOARD_PERANGKAT | typeof DASHBOARD_WARGA,
  penjaga: { peran: Peran[]; halamanMasuk: string },
) => ({
  path: dash.route,
  element: <RuteTerproteksi peran={penjaga.peran} halamanMasuk={penjaga.halamanMasuk} />,
  children: [
    {
      element: <DashboardLayout judul={dash.title} basis={dash.route} menu={dash.items} />,
      children: ruteIsiDashboard(dash),
    },
  ],
});

const ruteIsiDashboard = (dash: typeof DASHBOARD_PERANGKAT | typeof DASHBOARD_WARGA) => [
    {
      index: true,
      element: (
        <HalamanPlaceholder
          judul={dash.title}
          ringkasan={dash.summary}
          fase={dash.phase}
          items={dash.items}
          route={dash.route}
        />
      ),
    },
    ...dash.items
      .filter((item) => item.path)
      .map((item) => ({
        path: item.path!.replace(/^\//, ''),
        element: HALAMAN_ASLI[`${dash.route}${item.path}`] ?? (
          <HalamanPlaceholder
            judul={item.label}
            ringkasan={`Modul ${item.label} pada ${dash.title}.`}
            fase={dash.phase}
            items={[]}
            route={dash.route}
          />
        ),
      })),

    // Sub-rute yang tidak berasal dari menu registry.
    ...(dash.route === '/admin'
      ? [
          { path: 'penduduk/impor', element: <PendudukImpor /> },
          { path: 'penduduk/baru', element: <PendudukForm /> },
          { path: 'penduduk/:id', element: <PendudukForm /> },
          { path: 'surat/:id', element: <SuratDetail /> },
          { path: 'profil-desa', element: <ProfilDesaForm /> },
        ]
      : []),
];

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Beranda /> },
      { path: 'masuk', element: <Masuk /> },
      {
        path: 'aktivasi',
        element: (
          <HalamanPlaceholder
            judul="Aktivasi Akun"
            ringkasan="Warga menukar kode aktivasi dari perangkat desa menjadi PIN miliknya sendiri."
            fase={1}
            items={[]}
            route="/aktivasi"
          />
        ),
      },
      { path: 'masuk-perangkat', element: <MasukPerangkat /> },

      // Verifikasi surat sengaja di akar, bukan di bawah /layanan: alamatnya
      // ikut tercetak di bawah QR pada lembar surat, jadi harus sependek
      // mungkin agar tetap terbaca dan mudah diketik ulang bila QR rusak.
      { path: 'verifikasi', element: <Verifikasi /> },
      { path: 'verifikasi/:kode', element: <Verifikasi /> },

      { path: 'layanan/ajukan/:kode', element: <AjukanSurat /> },
      { path: 'berita/:slug', element: <BeritaDetail /> },
      ...rutePublik,
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
  ruteDashboard(DASHBOARD_PERANGKAT, {
    peran: ['PERANGKAT', 'ADMIN'],
    halamanMasuk: '/masuk-perangkat',
  }),
  ruteDashboard(DASHBOARD_WARGA, {
    peran: ['WARGA', 'PERANGKAT', 'ADMIN'],
    halamanMasuk: '/masuk',
  }),
]);
