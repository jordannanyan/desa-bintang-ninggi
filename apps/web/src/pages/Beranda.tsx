import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SECTIONS, LABEL_KATEGORI_AGENDA } from '@desa/shared';
import { api } from '../lib/api';

interface DataBeranda {
  profil: {
    namaDesa: string;
    kecamatan: string;
    kabupaten: string;
    sambutanKades: string | null;
    videoProfilUrl: string | null;
    jamPelayanan: Record<string, string> | null;
    nomorDarurat: Record<string, string> | null;
  } | null;
  statistik: {
    totalPenduduk: number;
    totalKk: number;
    totalUmkm: number;
    totalRt: number;
    luasWilayahKm: string | null;
  };
  berita: Array<{
    slug: string;
    judul: string;
    ringkasan: string | null;
    sampulUrl: string | null;
    terbitPada: string | null;
  }>;
  pengumuman: Array<{ id: string; judul: string; penting: boolean; mulai: string }>;
  agenda: Array<{
    id: string;
    judul: string;
    kategori: keyof typeof LABEL_KATEGORI_AGENDA;
    mulai: string;
    lokasi: string | null;
  }>;
}

const LAYANAN_CEPAT = ['layanan', 'pengaduan', 'keuangan', 'kependudukan', 'download', 'ppid'];

const angka = (n: number) => n.toLocaleString('id-ID');
const tanggal = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '';

/** Mengubah tautan YouTube biasa menjadi alamat sematan. */
function urlSemat(url: string): string | null {
  const m = /(?:youtu\.be\/|v=)([\w-]{11})/.exec(url);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export function Beranda() {
  const cepat = SECTIONS.filter((s) => LAYANAN_CEPAT.includes(s.id));

  const { data } = useQuery({
    queryKey: ['beranda'],
    queryFn: async () => (await api.get<{ ok: true; data: DataBeranda }>('/beranda')).data.data,
  });

  const namaDesa = data?.profil?.namaDesa ?? 'Bintang Ninggi I';
  const semat = data?.profil?.videoProfilUrl ? urlSemat(data.profil.videoProfilUrl) : null;

  const statistik = [
    { label: 'Jumlah Penduduk', nilai: data ? angka(data.statistik.totalPenduduk) : '—' },
    { label: 'Jumlah KK', nilai: data ? angka(data.statistik.totalKk) : '—' },
    { label: 'UMKM Terdaftar', nilai: data ? angka(data.statistik.totalUmkm) : '—' },
    { label: 'Jumlah RT', nilai: data ? angka(data.statistik.totalRt) : '—' },
  ];

  return (
    <>
      <section className="bg-desa-700 text-white">
        <div className="kontainer grid gap-8 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-2 text-sm font-medium text-desa-200">Selamat datang di laman resmi</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Desa {namaDesa}</h1>
            {data?.profil && (
              <p className="mt-1 text-sm text-desa-200">
                Kecamatan {data.profil.kecamatan}, Kabupaten {data.profil.kabupaten}
              </p>
            )}
            <p className="mt-4 max-w-xl text-desa-100">
              Urus surat tanpa datang ke kantor, pantau penggunaan anggaran, dan sampaikan
              laporan langsung dari rumah.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/layanan" className="tombol-utama bg-white text-desa-700 hover:bg-desa-50">
                Ajukan Surat
              </Link>
              <Link
                to="/pengaduan"
                className="tombol-sekunder border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                Sampaikan Pengaduan
              </Link>
            </div>
          </div>

          <div className="aspect-video overflow-hidden rounded-xl border border-white/20 bg-white/10">
            {semat ? (
              <iframe
                src={semat}
                title="Video Profil Desa"
                className="h-full w-full"
                allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-desa-100">
                Video Profil Desa belum diisi
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="kontainer -mt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statistik.map((s) => (
            <div key={s.label} className="kartu text-center">
              <p className="text-2xl font-bold text-desa-700">{s.nilai}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {data?.profil?.sambutanKades && (
        <section className="kontainer pt-12">
          <div className="kartu">
            <h2 className="mb-2 text-lg font-bold text-slate-900">Sambutan Kepala Desa</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {data.profil.sambutanKades}
            </p>
          </div>
        </section>
      )}

      <section className="kontainer py-12">
        <h2 className="mb-1 text-xl font-bold text-slate-900">Layanan Cepat</h2>
        <p className="mb-6 text-sm text-slate-500">
          Pintu masuk ke layanan yang paling sering dipakai warga.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cepat.map((s) => (
            <Link
              key={s.id}
              to={s.route}
              className="kartu transition hover:border-desa-300 hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="kontainer grid items-start gap-6 pb-12 lg:grid-cols-3">
        <div className="kartu">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Berita Terbaru</h3>
            <Link to="/berita" className="text-xs text-desa-600 hover:underline">
              semua
            </Link>
          </div>
          {data?.berita.length ? (
            <ul className="space-y-3">
              {data.berita.map((b) => (
                <li key={b.slug}>
                  <Link to={`/berita/${b.slug}`} className="group block">
                    <p className="text-sm font-medium text-slate-800 group-hover:text-desa-700">
                      {b.judul}
                    </p>
                    <p className="text-xs text-slate-400">{tanggal(b.terbitPada)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Belum ada berita.</p>
          )}
        </div>

        <div className="kartu">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Pengumuman</h3>
            <Link to="/pengumuman" className="text-xs text-desa-600 hover:underline">
              semua
            </Link>
          </div>
          {data?.pengumuman.length ? (
            <ul className="space-y-3">
              {data.pengumuman.map((p) => (
                <li key={p.id}>
                  <p className="text-sm font-medium text-slate-800">
                    {p.penting && (
                      <span className="mr-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                        Penting
                      </span>
                    )}
                    {p.judul}
                  </p>
                  <p className="text-xs text-slate-400">{tanggal(p.mulai)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Belum ada pengumuman.</p>
          )}
        </div>

        <div className="kartu">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Agenda Kegiatan</h3>
            <Link to="/agenda" className="text-xs text-desa-600 hover:underline">
              semua
            </Link>
          </div>
          {data?.agenda.length ? (
            <ul className="space-y-3">
              {data.agenda.map((a) => (
                <li key={a.id}>
                  <p className="text-sm font-medium text-slate-800">{a.judul}</p>
                  <p className="text-xs text-slate-400">
                    {tanggal(a.mulai)}
                    {a.lokasi && ` · ${a.lokasi}`}
                  </p>
                  <span className="text-xs text-desa-600">
                    {LABEL_KATEGORI_AGENDA[a.kategori]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Belum ada agenda.</p>
          )}
        </div>
      </section>

      <section className="kontainer grid items-start gap-4 pb-16 sm:grid-cols-3">
        <div className="kartu">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Cuaca Hari Ini</h3>
          {/* TODO Fase 4: ambil dari API BMKG berdasarkan koordinat desa. */}
          <p className="text-sm text-slate-400">Belum tersedia</p>
        </div>

        <div className="kartu">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Jam Pelayanan</h3>
          {data?.profil?.jamPelayanan ? (
            <ul className="space-y-1 text-sm text-slate-600">
              {Object.entries(data.profil.jamPelayanan).map(([hari, jam]) => (
                <li key={hari} className="flex justify-between gap-2">
                  <span className="capitalize">{hari.replace(/_/g, ' – ')}</span>
                  <span className="text-slate-800">{jam}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Belum diisi</p>
          )}
        </div>

        <div className="kartu">
          <h3 className="mb-2 text-sm font-semibold text-slate-900">Nomor Darurat</h3>
          {data?.profil?.nomorDarurat ? (
            <ul className="space-y-1 text-sm text-slate-600">
              {Object.entries(data.profil.nomorDarurat)
                .filter(([, no]) => no && no !== '-')
                .map(([nama, no]) => (
                  <li key={nama} className="flex justify-between gap-2">
                    <span className="capitalize">{nama.replace(/_/g, ' ')}</span>
                    <a href={`tel:${no}`} className="font-medium text-desa-700 hover:underline">
                      {no}
                    </a>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Belum diisi</p>
          )}
        </div>
      </section>
    </>
  );
}
