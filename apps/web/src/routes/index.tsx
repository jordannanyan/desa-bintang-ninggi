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
import { Aktivasi } from '../pages/Aktivasi';
import { Pengaduan } from '../pages/Pengaduan';
import { BuatPengaduan } from '../pages/BuatPengaduan';
import { LacakPengaduan } from '../pages/LacakPengaduan';
import { PengaduanList, PengaduanDetail } from '../pages/admin/PengaduanKelola';
import { Keuangan } from '../pages/Keuangan';
import { Pembangunan, ProyekDetail } from '../pages/Pembangunan';
import { PemerintahanDesa, Ppid, DownloadCenter } from '../pages/Dokumen';
import { Umkm } from '../pages/Umkm';
import {
  BumDes,
  Kesehatan,
  Pendidikan,
  Perikanan,
  Pertanian,
  Peternakan,
} from '../pages/Sektor';
import {
  BantuanSosial,
  KalenderDesa,
  Kontak,
  Lowongan,
  StatusBantuan,
} from '../pages/Lainnya';
import { Galeri, Peta } from '../pages/Peta';
import { UmkmToko } from '../pages/UmkmToko';
import { PesananSaya, PesananDetail } from '../pages/warga/PesananSaya';
import { TokoSaya } from '../pages/warga/TokoSaya';
import { KeuanganKelola } from '../pages/admin/KeuanganKelola';
import { PembangunanKelola } from '../pages/admin/PembangunanKelola';
import { DokumenKelola } from '../pages/admin/DokumenKelola';
import {
  BantuanKelola,
  FasilitasKelola,
  GaleriKelola,
  HargaKelola,
  InformasiKelola,
  LowonganKelola,
} from '../pages/admin/SektorKelola';
import { AkunWarga } from '../pages/admin/AkunWarga';
import { BeritaKelola } from '../pages/admin/BeritaKelola';
import { AgendaKelola } from '../pages/admin/AgendaKelola';
import { ProfilDesaForm } from '../pages/admin/ProfilDesaForm';
import { TagihanKelola } from '../pages/admin/TagihanKelola';
import { BerandaAdmin } from '../pages/admin/BerandaAdmin';
import { BerandaWarga } from '../pages/warga/BerandaWarga';
import { AbsensiKelola, AsetKelola, StatistikDashboard } from '../pages/admin/TataUsaha';
import {
  DataPribadi,
  PajakDesa,
  PengaduanSaya,
  RiwayatKegiatan,
  SertifikatSaya,
  TagihanSaya,
} from '../pages/warga/DataSaya';
import { BAGIAN_PROFIL } from '../pages/ProfilDesa';
import {
  AlihVerifikasi,
  KeHalaman,
  KeranjangInfo,
  PermohonanInformasi,
} from '../pages/Alias';

/**
 * Halaman yang sudah digarap, menggantikan kerangka yang dibangkitkan registry.
 * Kunci = rute penuh. Menambah halaman asli cukup didaftarkan di sini.
 */
/**
 * Sub-item Profil Desa adalah blok-blok pada satu halaman panjang, bukan
 * halaman terpisah: memecahnya jadi tiga belas halaman membuat pembaca harus
 * bolak-balik untuk hal yang seharusnya bisa digulir sekali.
 */
const RUTE_PROFIL = Object.fromEntries(
  BAGIAN_PROFIL.map((b) => [`/profil/${b.id}`, <KeHalaman tujuan={`/profil#${b.id}`} />]),
);

/** Sub-item Pemerintahan Desa membuka daftar dokumen dengan jenis tersaring. */
const RUTE_PEMERINTAHAN = Object.fromEntries(
  (
    [
      ['perdes', 'PERDES'],
      ['perkades', 'PERKADES'],
      ['sk-kades', 'SK_KADES'],
      ['rpjmdes', 'RPJMDES'],
      ['rkpdes', 'RKPDES'],
      ['apbdes', 'APBDES'],
      ['realisasi-apbdes', 'REALISASI_APBDES'],
    ] as const
  ).map(([jalur, jenis]) => [
    `/pemerintahan/${jalur}`,
    <PemerintahanDesa saringAwal={jenis} />,
  ]),
);

const HALAMAN_ASLI: Record<string, JSX.Element> = {
  ...RUTE_PROFIL,
  ...RUTE_PEMERINTAHAN,

  // Perangkat desa dan uraian tugasnya tinggal di Profil Desa; dua salinan
  // daftar yang sama hanya menjamin salah satunya lekas basi.
  '/pemerintahan/perangkat': <KeHalaman tujuan="/profil#perangkat" />,
  '/pemerintahan/tugas': <KeHalaman tujuan="/profil#perangkat" />,

  '/layanan/status': <KeHalaman tujuan="/warga/surat" />,
  '/layanan/verifikasi/:kode': <AlihVerifikasi />,
  '/pengaduan/buat': <BuatPengaduan />,
  '/pengaduan/status': <KeHalaman tujuan="/pengaduan/lacak" />,
  '/umkm/keranjang': <KeranjangInfo />,
  '/umkm/pesanan': <KeHalaman tujuan="/warga/pesanan" />,
  '/bantuan-sosial/cek': <KeHalaman tujuan="/warga/bantuan" />,
  '/ppid/permohonan': <PermohonanInformasi />,

  '/kependudukan': <Kependudukan />,
  '/layanan': <Layanan />,
  '/profil': <ProfilDesa />,
  '/berita': <BeritaList />,
  '/pengaduan': <Pengaduan />,
  '/keuangan': <Keuangan />,
  '/pembangunan': <Pembangunan />,
  '/pemerintahan': <PemerintahanDesa />,
  '/ppid': <Ppid />,
  '/download': <DownloadCenter />,
  '/admin/pengaduan': <PengaduanList />,
  '/admin/keuangan': <KeuanganKelola />,
  '/admin/pembangunan': <PembangunanKelola />,
  '/admin/dokumen': <DokumenKelola />,
  '/admin/informasi': <InformasiKelola />,
  '/admin/fasilitas': <FasilitasKelola />,
  '/admin/harga': <HargaKelola />,
  '/admin/lowongan': <LowonganKelola />,
  '/admin/bantuan': <BantuanKelola />,
  '/admin/galeri': <GaleriKelola />,
  '/pengumuman': <Pengumuman />,
  '/agenda': <Agenda />,
  '/admin/penduduk': <PendudukList />,
  '/admin/surat': <SuratList />,
  '/admin/berita': <BeritaKelola />,
  '/admin/agenda': <AgendaKelola />,
  '/admin/tagihan': <TagihanKelola />,
  '/admin/absensi': <AbsensiKelola />,
  '/admin/aset': <AsetKelola />,
  '/admin/statistik': <StatistikDashboard />,
  '/warga/surat': <SuratSaya />,
  '/warga/profil': <DataPribadi />,
  '/warga/pajak': <PajakDesa />,
  '/warga/tagihan': <TagihanSaya />,
  '/warga/pengaduan': <PengaduanSaya />,
  '/warga/sertifikat': <SertifikatSaya />,
  '/warga/kegiatan': <RiwayatKegiatan />,
  '/warga/pesanan': <PesananSaya />,
  '/admin/profil-desa': <ProfilDesaForm />,
  '/umkm': <Umkm />,
  '/warga/umkm': <TokoSaya />,
  '/bumdes': <BumDes />,
  '/pertanian': <Pertanian />,
  '/peternakan': <Peternakan />,
  '/perikanan': <Perikanan />,
  '/pendidikan': <Pendidikan />,
  '/kesehatan': <Kesehatan />,
  '/lowongan': <Lowongan />,
  '/bantuan-sosial': <BantuanSosial />,
  '/kalender': <KalenderDesa />,
  '/galeri': <Galeri />,
  '/peta': <Peta />,
  '/kontak': <Kontak />,
  '/warga/bantuan': <StatusBantuan />,
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
    // Beranda dashboard menjawab "apa yang harus saya kerjakan sekarang",
    // bukan sekadar mendaftar ulang menu yang sudah ada di samping.
    { index: true, element: dash.route === '/admin' ? <BerandaAdmin /> : <BerandaWarga /> },
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

    // Sub-rute yang tidak berasal dari menu registry. Yang alamatnya sama
    // persis dengan item menu tidak boleh ditaruh di sini — ia akan bentrok
    // dengan rute bangkitan di atas; daftarkan di HALAMAN_ASLI saja.
    ...(dash.route === '/warga' ? [{ path: 'pesanan/:id', element: <PesananDetail /> }] : []),
    ...(dash.route === '/admin'
      ? [
          { path: 'penduduk/impor', element: <PendudukImpor /> },
          { path: 'penduduk/baru', element: <PendudukForm /> },
          { path: 'penduduk/:id', element: <PendudukForm /> },
          { path: 'akun/:id', element: <AkunWarga /> },
          { path: 'pengaduan/:id', element: <PengaduanDetail /> },
          { path: 'surat/:id', element: <SuratDetail /> },
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
      { path: 'aktivasi', element: <Aktivasi /> },
      { path: 'masuk-perangkat', element: <MasukPerangkat /> },

      // Verifikasi surat sengaja di akar, bukan di bawah /layanan: alamatnya
      // ikut tercetak di bawah QR pada lembar surat, jadi harus sependek
      // mungkin agar tetap terbaca dan mudah diketik ulang bila QR rusak.
      { path: 'verifikasi', element: <Verifikasi /> },
      { path: 'verifikasi/:kode', element: <Verifikasi /> },

      { path: 'layanan/ajukan/:kode', element: <AjukanSurat /> },
      { path: 'berita/:slug', element: <BeritaDetail /> },
      { path: 'pengaduan/lacak', element: <LacakPengaduan /> },
      { path: 'pengaduan/lacak/:kode', element: <LacakPengaduan /> },
      { path: 'pembangunan/:id', element: <ProyekDetail /> },
      { path: 'umkm/:id', element: <UmkmToko /> },
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
