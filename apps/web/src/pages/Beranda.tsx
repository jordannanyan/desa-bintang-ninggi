import { Link } from 'react-router-dom';
import { SECTIONS } from '@desa/shared';

/** Angka contoh — diganti hasil GET /api/kependudukan/ringkasan saat Fase 1 digarap. */
const STATISTIK_CONTOH = [
  { label: 'Jumlah Penduduk', nilai: '—' },
  { label: 'Jumlah KK', nilai: '—' },
  { label: 'UMKM Terdaftar', nilai: '—' },
  { label: 'RT / RW', nilai: '—' },
];

const LAYANAN_CEPAT = ['layanan', 'pengaduan', 'keuangan', 'kependudukan', 'download', 'ppid'];

export function Beranda() {
  const cepat = SECTIONS.filter((s) => LAYANAN_CEPAT.includes(s.id));

  return (
    <>
      <section className="bg-desa-700 text-white">
        <div className="kontainer grid gap-8 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="mb-2 text-sm font-medium text-desa-200">Selamat datang di laman resmi</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Desa Bintang Ninggi I</h1>
            <p className="mt-4 max-w-xl text-desa-100">
              Urus surat tanpa datang ke kantor, pantau penggunaan anggaran, dan sampaikan laporan
              langsung dari rumah.
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

          {/* TODO: ganti dengan video profil desa dari ProfilDesa.videoProfilUrl */}
          <div className="grid aspect-video place-items-center rounded-xl border border-white/20 bg-white/10 text-sm text-desa-100">
            Video Profil Desa
          </div>
        </div>
      </section>

      <section className="kontainer -mt-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATISTIK_CONTOH.map((s) => (
            <div key={s.label} className="kartu text-center">
              <p className="text-2xl font-bold text-desa-700">{s.nilai}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="kontainer py-12">
        <h2 className="mb-1 text-xl font-bold text-slate-900">Layanan Cepat</h2>
        <p className="mb-6 text-sm text-slate-500">Pintu masuk ke layanan yang paling sering dipakai warga.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cepat.map((s) => (
            <Link key={s.id} to={s.route} className="kartu transition hover:border-desa-300 hover:shadow-md">
              <h3 className="font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="kontainer grid gap-6 pb-12 lg:grid-cols-3">
        {/* TODO Fase 1: isi dari GET /api/berita, /api/pengumuman, /api/agenda */}
        {['Berita Terbaru', 'Pengumuman', 'Agenda Kegiatan'].map((judul) => (
          <div key={judul} className="kartu">
            <h3 className="mb-3 font-semibold text-slate-900">{judul}</h3>
            <p className="text-sm text-slate-400">Belum ada data.</p>
          </div>
        ))}
      </section>

      <section className="kontainer grid gap-4 pb-16 sm:grid-cols-3">
        {/* TODO: Cuaca dari API BMKG; jam pelayanan & nomor darurat dari ProfilDesa */}
        {['Cuaca Hari Ini', 'Jam Pelayanan', 'Nomor Darurat'].map((judul) => (
          <div key={judul} className="kartu">
            <h3 className="mb-2 text-sm font-semibold text-slate-900">{judul}</h3>
            <p className="text-sm text-slate-400">—</p>
          </div>
        ))}
      </section>
    </>
  );
}
