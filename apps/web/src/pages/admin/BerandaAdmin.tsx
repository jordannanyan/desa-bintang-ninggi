import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LABEL_STATUS, formatRupiahRingkas } from '@desa/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { BarKategori } from '../../components/viz/BarKategori';
import { BatangProporsi } from '../../components/viz/StatTile';
import { BatangKemajuan, TrenGaris } from '../../components/viz/TrenGaris';
import { KATEGORI, TINTA } from '../../components/viz/tokens';

export interface Ringkasan {
  penduduk: number;
  kk: number;
  lakiLaki: number;
  perempuan: number;
  suratMenunggu: number;
  suratTerbitTahunIni: number;
  pengaduanBaru: number;
  pengaduanSelesai: number;
  umkm: number;
  proyekBerjalan: number;
  tagihanBelum: number;
  berita: number;
  dokumen: number;
  suratPerStatus: { label: string; jumlah: number }[];
  pengaduanPerKategori: { label: string; jumlah: number }[];
  asetPerKondisi: { label: string; jumlah: number }[];
  keuangan: {
    tahun: number;
    versi: string;
    pendapatanPagu: number;
    pendapatanRealisasi: number;
    belanjaPagu: number;
    belanjaRealisasi: number;
  } | null;
  tren: { label: string; suratMasuk: number; suratTerbit: number; pengaduan: number }[];
}

export const useRingkasan = () =>
  useQuery({
    queryKey: ['ringkasan-admin'],
    // Angka-angka ini berubah sepanjang hari. Disegarkan berkala supaya
    // perangkat desa tidak perlu memuat ulang halaman untuk tahu ada
    // pengajuan baru.
    refetchInterval: 60_000,
    queryFn: async () => (await api.get('/statistik')).data.data as Ringkasan,
  });

/** `JALAN_RUSAK` → `Jalan rusak`. */
export const manusiawi = (kode: string) =>
  kode.charAt(0) + kode.slice(1).toLowerCase().replace(/_/g, ' ');

function salam() {
  const jam = new Date().getHours();
  if (jam < 11) return 'Selamat pagi';
  if (jam < 15) return 'Selamat siang';
  if (jam < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/**
 * Kartu antrean: satu angka yang menuntut tindakan, bisa langsung diklik.
 *
 * Warna kuning hanya muncul bila angkanya > 0 dan selalu berdampingan dengan
 * teks — status tidak pernah disandikan warna saja.
 */
function KartuAntrean({
  label,
  nilai,
  ke,
  ajakan,
}: {
  label: string;
  nilai: number;
  ke: string;
  ajakan: string;
}) {
  const perlu = nilai > 0;
  return (
    <Link
      to={ke}
      className={`kartu group flex flex-col justify-between transition hover:-translate-y-0.5 hover:shadow-md ${
        perlu ? 'border-l-4 border-l-amber-400' : ''
      }`}
    >
      <p className="text-xs" style={{ color: TINTA.sekunder }}>
        {label}
      </p>
      <p
        className="mt-1 text-4xl font-bold leading-none"
        style={{ color: perlu ? '#b45309' : TINTA.redup }}
      >
        {nilai}
      </p>
      <p className="mt-2 text-xs font-medium text-desa-700 group-hover:underline">
        {perlu ? ajakan : 'Tidak ada antrean'} →
      </p>
    </Link>
  );
}

export function BerandaAdmin() {
  const { pengguna } = useAuth();
  const { data, isLoading } = useRingkasan();

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="kartu h-28 animate-pulse bg-slate-100" />
        ))}
      </div>
    );
  }

  const totalAntrean = data.suratMenunggu + data.pengaduanBaru + data.tagihanBelum;

  const pintasan = [
    { label: 'Tambah penduduk', ke: '/admin/penduduk/baru' },
    { label: 'Tulis berita', ke: '/admin/berita' },
    { label: 'Buat agenda', ke: '/admin/agenda' },
    { label: 'Catat absensi', ke: '/admin/absensi' },
    { label: 'Unggah dokumen', ke: '/admin/dokumen' },
    { label: 'Profil desa', ke: '/admin/profil-desa' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          {salam()}
          {pengguna?.nama ? `, ${pengguna.nama.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {totalAntrean === 0
            ? 'Tidak ada yang menunggu tindakan hari ini.'
            : `${totalAntrean} hal menunggu ditindaklanjuti.`}
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Perlu Ditindaklanjuti</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <KartuAntrean
            label="Surat menunggu persetujuan"
            nilai={data.suratMenunggu}
            ke="/admin/surat"
            ajakan="Tinjau sekarang"
          />
          <KartuAntrean
            label="Pengaduan belum ditangani"
            nilai={data.pengaduanBaru}
            ke="/admin/pengaduan"
            ajakan="Lihat laporan"
          />
          <KartuAntrean
            label="Tagihan belum dibayar"
            nilai={data.tagihanBelum}
            ke="/admin/tagihan"
            ajakan="Kelola tagihan"
          />
        </div>
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrenGaris
            judul="Enam Bulan Terakhir"
            keterangan="Arahkan kursor pada satu bulan untuk melihat seluruh angkanya."
            sumbu={data.tren.map((t) => t.label)}
            seri={[
              { label: 'Surat masuk', nilai: data.tren.map((t) => t.suratMasuk) },
              { label: 'Surat terbit', nilai: data.tren.map((t) => t.suratTerbit) },
              { label: 'Pengaduan', nilai: data.tren.map((t) => t.pengaduan) },
            ]}
          />
        </div>

        <div className="kartu">
          <h3 className="text-sm font-semibold text-slate-900">
            Realisasi APBDes {data.keuangan?.tahun ?? new Date().getFullYear()}
          </h3>
          {data.keuangan ? (
            <>
              <p className="mt-0.5 text-xs text-slate-400">
                APBDes {data.keuangan.versi.toLowerCase()}
              </p>
              <div className="mt-4 space-y-4">
                <BatangKemajuan
                  label="Pendapatan"
                  nilai={data.keuangan.pendapatanRealisasi}
                  target={data.keuangan.pendapatanPagu}
                  format={formatRupiahRingkas}
                  warna={KATEGORI[0]}
                />
                <BatangKemajuan
                  label="Belanja"
                  nilai={data.keuangan.belanjaRealisasi}
                  target={data.keuangan.belanjaPagu}
                  format={formatRupiahRingkas}
                  warna={KATEGORI[1]}
                />
              </div>
              <Link
                to="/admin/keuangan"
                className="mt-4 inline-block text-xs font-medium text-desa-700 hover:underline"
              >
                Kelola anggaran →
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-400">
              Anggaran tahun ini belum disusun.{' '}
              <Link to="/admin/keuangan" className="font-medium text-desa-700 hover:underline">
                Susun sekarang
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-2">
        <BarKategori
          judul="Pengajuan Surat per Status"
          keterangan="Seluruh pengajuan yang pernah masuk."
          data={data.suratPerStatus.map((s) => ({
            label: LABEL_STATUS[s.label as keyof typeof LABEL_STATUS] ?? manusiawi(s.label),
            jumlah: s.jumlah,
          }))}
          satuan="pengajuan"
        />
        <BarKategori
          judul="Pengaduan per Kategori"
          data={[...data.pengaduanPerKategori]
            .sort((a, b) => b.jumlah - a.jumlah)
            .map((p) => ({ label: manusiawi(p.label), jumlah: p.jumlah }))}
          satuan="laporan"
        />
      </section>

      <section className="grid items-start gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <BatangProporsi
            judul="Komposisi Penduduk"
            bagian={[
              { label: 'Laki-laki', jumlah: data.lakiLaki },
              { label: 'Perempuan', jumlah: data.perempuan },
            ]}
          />
        </div>

        <div className="kartu lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Ringkasan Desa</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {[
              ['Penduduk aktif', data.penduduk, '/admin/penduduk'],
              ['Kartu Keluarga', data.kk, '/admin/penduduk'],
              ['Surat terbit tahun ini', data.suratTerbitTahunIni, '/admin/surat'],
              ['Pengaduan selesai', data.pengaduanSelesai, '/admin/pengaduan'],
              ['UMKM aktif', data.umkm, '/umkm'],
              ['Proyek berjalan', data.proyekBerjalan, '/admin/pembangunan'],
              ['Berita terbit', data.berita, '/admin/berita'],
              ['Dokumen tersimpan', data.dokumen, '/admin/dokumen'],
            ].map(([label, nilai, ke]) => (
              <div key={label as string}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd>
                  <Link
                    to={ke as string}
                    className="text-xl font-semibold tabular-nums text-slate-900 hover:text-desa-700"
                  >
                    {(nilai as number).toLocaleString('id-ID')}
                  </Link>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Pintasan</h2>
        <div className="flex flex-wrap gap-2">
          {pintasan.map((p) => (
            <Link
              key={p.ke}
              to={p.ke}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-desa-300 hover:text-desa-700"
            >
              {p.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
