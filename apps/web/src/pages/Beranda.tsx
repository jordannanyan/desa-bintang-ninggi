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

/** Judul bagian dengan tautan "semua" di kanan. */
function JudulBagian({
  judul,
  ringkas,
  ke,
}: {
  judul: string;
  ringkas?: string;
  ke?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{judul}</h2>
        {ringkas && <p className="mt-0.5 text-sm text-slate-500">{ringkas}</p>}
      </div>
      {ke && (
        <Link
          to={ke}
          className="text-sm font-medium text-desa-700 hover:underline"
        >
          Lihat semua →
        </Link>
      )}
    </div>
  );
}

const LANGKAH = [
  {
    judul: 'Masuk dengan NIK',
    isi: 'Aktivasi sekali pakai kode dari kantor desa, lalu cukup NIK dan PIN untuk seterusnya.',
  },
  {
    judul: 'Isi formulir & unggah berkas',
    isi: 'Pilih jenis surat, isi keperluan, lampirkan foto KTP atau KK bila diminta.',
  },
  {
    judul: 'Surat terbit dengan QR',
    isi: 'Setelah disetujui, unduh PDF-nya. QR pada lembar itu bisa diperiksa siapa pun.',
  },
];

export function Beranda() {
  const cepat = SECTIONS.filter((s) => LAYANAN_CEPAT.includes(s.id));

  const { data } = useQuery({
    queryKey: ['beranda'],
    queryFn: async () => (await api.get<{ ok: true; data: DataBeranda }>('/beranda')).data.data,
  });

  const namaDesa = data?.profil?.namaDesa ?? 'Bintang Ninggi I';
  const semat = data?.profil?.videoProfilUrl ? urlSemat(data.profil.videoProfilUrl) : null;

  const statistik = [
    { label: 'Penduduk', nilai: data ? angka(data.statistik.totalPenduduk) : '—' },
    { label: 'Kartu Keluarga', nilai: data ? angka(data.statistik.totalKk) : '—' },
    { label: 'UMKM terdaftar', nilai: data ? angka(data.statistik.totalUmkm) : '—' },
    { label: 'RT', nilai: data ? angka(data.statistik.totalRt) : '—' },
    {
      label: 'Luas wilayah',
      nilai: data?.statistik.luasWilayahKm ? `${data.statistik.luasWilayahKm} km²` : '—',
    },
  ];

  const utama = data?.berita[0];
  const lainnya = data?.berita.slice(1) ?? [];

  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-desa-800 text-white">
        {/* Latar dekoratif: gradien lembut, bukan gambar — tidak ada berkas
            tambahan yang harus diunduh di sinyal desa yang tipis. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(60rem 30rem at 15% -10%, #22724f 0%, transparent 60%), radial-gradient(45rem 25rem at 95% 110%, #348f64 0%, transparent 55%)',
          }}
        />

        <div className="kontainer relative grid gap-10 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-20">
          <div>
            <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-desa-100 ring-1 ring-white/20">
              Laman resmi pemerintah desa
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">Desa {namaDesa}</h1>
            {data?.profil && (
              <p className="mt-2 text-sm text-desa-200">
                Kecamatan {data.profil.kecamatan}, Kabupaten {data.profil.kabupaten}
              </p>
            )}
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-desa-100">
              Urus surat tanpa datang ke kantor, pantau penggunaan anggaran, dan sampaikan
              laporan langsung dari rumah.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/layanan"
                className="tombol-utama bg-white px-5 py-2.5 text-desa-800 shadow-lg shadow-desa-900/20 hover:bg-desa-50"
              >
                Ajukan Surat
              </Link>
              <Link
                to="/pengaduan/buat"
                className="tombol-sekunder border-white/40 bg-white/5 px-5 py-2.5 text-white backdrop-blur hover:bg-white/15"
              >
                Sampaikan Pengaduan
              </Link>
              <Link
                to="/verifikasi"
                className="inline-flex items-center px-2 py-2.5 text-sm font-medium text-desa-100 underline-offset-4 hover:underline"
              >
                Verifikasi surat →
              </Link>
            </div>
          </div>

          <div className="aspect-video overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl shadow-desa-900/30">
            {semat ? (
              <iframe
                src={semat}
                title="Video Profil Desa"
                className="h-full w-full"
                allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="grid h-full place-items-center px-6 text-center text-sm text-desa-100">
                Video profil desa belum diisi.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Statistik: menumpang di perbatasan hero agar terbaca sebagai
             ringkasan hero, bukan bagian terpisah. ── */}
      <section className="kontainer relative z-10 -mt-10">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-sm sm:grid-cols-3 lg:grid-cols-5">
          {statistik.map((s, i) => (
            <div
              key={s.label}
              // Lima kartu pada kisi dua/tiga kolom menyisakan satu sel kosong
              // di ujung; yang terakhir dilebarkan agar barisnya rata.
              className={`bg-white px-4 py-5 text-center ${
                i === statistik.length - 1 ? 'col-span-2 lg:col-span-1' : ''
              }`}
            >
              <p className="text-2xl font-bold text-desa-700">{s.nilai}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cara mengurus surat ── */}
      <section className="kontainer pt-14">
        <JudulBagian
          judul="Mengurus Surat, Tiga Langkah"
          ringkas="Tanpa antre, tanpa datang ke kantor desa."
        />
        <ol className="grid gap-4 sm:grid-cols-3">
          {LANGKAH.map((l, i) => (
            <li key={l.judul} className="kartu">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-desa-50 text-sm font-bold text-desa-700">
                {i + 1}
              </span>
              <h3 className="mt-3 font-semibold text-slate-900">{l.judul}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{l.isi}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Layanan cepat ── */}
      <section className="kontainer pt-14">
        <JudulBagian
          judul="Layanan Cepat"
          ringkas="Pintu masuk ke layanan yang paling sering dipakai warga."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cepat.map((s) => (
            <Link
              key={s.id}
              to={s.route}
              className="kartu group transition hover:-translate-y-0.5 hover:border-desa-300 hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900 group-hover:text-desa-700">
                {s.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{s.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Berita ── */}
      <section className="kontainer pt-14">
        <JudulBagian judul="Berita Desa" ke="/berita" />
        {utama ? (
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            {/* Berita teratas diberi ruang gambar: sampulnya sudah tersimpan,
                dan tanpa itu daftar berita desa terbaca seperti arsip. */}
            <Link
              to={`/berita/${utama.slug}`}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Tanpa sampul, blok gambar tidak digantikan kotak kosong
                  setinggi 16:9 — ruang menganga itu justru membuat kartunya
                  terlihat rusak. Cukup pita tipis sebagai penanda. */}
              {utama.sampulUrl ? (
                <img
                  src={utama.sampulUrl}
                  alt=""
                  className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="h-1.5 w-full bg-desa-600" />
              )}
              <div className="p-5">
                <p className="text-xs text-slate-400">{tanggal(utama.terbitPada)}</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-desa-700">
                  {utama.judul}
                </h3>
                {utama.ringkasan && (
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-slate-600">
                    {utama.ringkasan}
                  </p>
                )}
              </div>
            </Link>

            <div className="space-y-4">
              {lainnya.map((b) => (
                <Link
                  key={b.slug}
                  to={`/berita/${b.slug}`}
                  className="group flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md"
                >
                  {b.sampulUrl && (
                    <img
                      src={b.sampulUrl}
                      alt=""
                      className="h-20 w-24 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400">{tanggal(b.terbitPada)}</p>
                    <p className="mt-0.5 line-clamp-3 text-sm font-medium text-slate-800 group-hover:text-desa-700">
                      {b.judul}
                    </p>
                  </div>
                </Link>
              ))}
              {lainnya.length === 0 && (
                <p className="text-sm text-slate-400">Belum ada berita lain.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="kartu text-center text-sm text-slate-400">Belum ada berita.</div>
        )}
      </section>

      {/* ── Pengumuman & agenda ── */}
      <section className="kontainer grid items-start gap-5 pt-14 lg:grid-cols-2">
        <div className="kartu">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Pengumuman</h3>
            <Link to="/pengumuman" className="text-xs font-medium text-desa-700 hover:underline">
              semua
            </Link>
          </div>
          {data?.pengumuman.length ? (
            <ul className="space-y-3">
              {data.pengumuman.map((p) => (
                <li key={p.id} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-sm font-medium text-slate-800">
                    {p.penting && (
                      <span className="mr-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                        Penting
                      </span>
                    )}
                    {p.judul}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{tanggal(p.mulai)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Belum ada pengumuman.</p>
          )}
        </div>

        <div className="kartu">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Agenda Kegiatan</h3>
            <Link to="/agenda" className="text-xs font-medium text-desa-700 hover:underline">
              semua
            </Link>
          </div>
          {data?.agenda.length ? (
            <ul className="space-y-3">
              {data.agenda.map((a) => {
                const d = new Date(a.mulai);
                return (
                  <li key={a.id} className="flex gap-3">
                    {/* Tanggal dijadikan blok agar deretan agenda bisa dipindai
                        dari kolom kirinya saja. */}
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-desa-50 leading-none">
                      <span className="text-base font-bold text-desa-800">{d.getDate()}</span>
                      <span className="text-[10px] uppercase text-desa-700">
                        {d.toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800">{a.judul}</p>
                      <p className="text-xs text-slate-400">
                        {LABEL_KATEGORI_AGENDA[a.kategori]}
                        {a.lokasi && ` · ${a.lokasi}`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Belum ada agenda.</p>
          )}
        </div>
      </section>

      {/* ── Sambutan ── */}
      {data?.profil?.sambutanKades && (
        <section className="kontainer pt-14">
          <div className="kartu border-l-4 border-l-desa-600">
            <h2 className="text-lg font-bold text-slate-900">Sambutan Kepala Desa</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {data.profil.sambutanKades}
            </p>
          </div>
        </section>
      )}

      {/* ── Jam pelayanan & nomor darurat ── */}
      <section className="kontainer grid items-start gap-5 py-14 sm:grid-cols-2">
        <div className="kartu">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Jam Pelayanan</h3>
          {data?.profil?.jamPelayanan && Object.keys(data.profil.jamPelayanan).length > 0 ? (
            <ul className="space-y-1.5 text-sm text-slate-600">
              {Object.entries(data.profil.jamPelayanan).map(([hari, jam]) => (
                <li key={hari} className="flex justify-between gap-2 border-b border-slate-100 pb-1.5 last:border-0">
                  <span className="capitalize">{hari.replace(/_/g, ' – ')}</span>
                  <span className="font-medium text-slate-800">{jam}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Belum diisi.</p>
          )}
        </div>

        <div className="kartu">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">Nomor Darurat</h3>
          {data?.profil?.nomorDarurat &&
          Object.entries(data.profil.nomorDarurat).some(([, n]) => n && n !== '-') ? (
            <ul className="space-y-1.5 text-sm text-slate-600">
              {Object.entries(data.profil.nomorDarurat)
                .filter(([, no]) => no && no !== '-')
                .map(([nama, no]) => (
                  <li key={nama} className="flex justify-between gap-2 border-b border-slate-100 pb-1.5 last:border-0">
                    <span className="capitalize">{nama.replace(/_/g, ' ')}</span>
                    <a href={`tel:${no}`} className="font-medium text-desa-700 hover:underline">
                      {no}
                    </a>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Belum diisi.</p>
          )}
        </div>
      </section>
    </>
  );
}
