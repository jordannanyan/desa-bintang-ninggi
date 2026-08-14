import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DASHBOARD_PERANGKAT, DASHBOARD_WARGA, SECTIONS, type Peran } from '@desa/shared';
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { HalamanPlaceholder, dariSection } from '../components/HalamanPlaceholder';
import { RuteTerproteksi } from '../components/RuteTerproteksi';
import { Beranda } from '../pages/Beranda';
import { Masuk } from '../pages/Masuk';
import { MasukPerangkat } from '../pages/MasukPerangkat';

/**
 * Seluruh rute dibangkitkan dari registry SECTIONS di @desa/shared.
 *
 * Menambah/menghapus halaman cukup dilakukan di satu tempat, dan storyboard
 * (`npm run storyboard`) otomatis ikut sinkron. Ganti `element` sebuah section
 * dengan komponen asli begitu halaman itu digarap.
 */

const rutePublik = SECTIONS
  .filter((s) => s.route !== '/')
  .flatMap((section) => [
    { path: section.route, element: dariSection(section) },
    // Sub-halaman yang punya path sendiri, mis. /profil/sejarah
    ...section.items
      .filter((item) => item.path)
      .map((item) => ({
        path: `${section.route}${item.path}`.replace('//', '/'),
        element: (
          <HalamanPlaceholder
            judul={`${section.title} — ${item.label}`}
            ringkasan={item.note ?? `Sub-halaman dari ${section.title}.`}
            fase={section.phase}
            items={[]}
            route={section.route}
          />
        ),
      })),
  ]);

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
        element: (
          <HalamanPlaceholder
            judul={item.label}
            ringkasan={`Modul ${item.label} pada ${dash.title}.`}
            fase={dash.phase}
            items={[]}
            route={dash.route}
          />
        ),
      })),
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
