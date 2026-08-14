import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface RingkasanBerita {
  id: string;
  slug: string;
  judul: string;
  ringkasan: string | null;
  sampulUrl: string | null;
  penulis: string;
  terbit: boolean;
  terbitPada: string | null;
  dilihat: number;
}

const tanggal = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '—';

export function BeritaList() {
  const { data, isLoading } = useQuery({
    queryKey: ['berita'],
    queryFn: async () =>
      (await api.get('/berita', { params: { perPage: 20 } })).data as {
        data: RingkasanBerita[];
      },
  });

  return (
    <div className="kontainer py-10">
      <h1 className="judul-halaman">Berita Desa</h1>
      <p className="mt-1 text-sm text-slate-600">Kabar terbaru dari Desa Bintang Ninggi I.</p>

      {isLoading && <p className="mt-8 text-sm text-slate-500">Memuat…</p>}

      {data?.data.length === 0 && (
        <p className="mt-8 text-sm text-slate-500">Belum ada berita yang diterbitkan.</p>
      )}

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.data.map((b) => (
          <li key={b.slug}>
            <Link
              to={`/berita/${b.slug}`}
              className="kartu block h-full transition hover:border-desa-300 hover:shadow-md"
            >
              {b.sampulUrl && (
                <img
                  src={b.sampulUrl}
                  alt=""
                  className="mb-3 aspect-video w-full rounded-lg object-cover"
                />
              )}
              {!b.terbit && (
                <span className="mb-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                  Draf
                </span>
              )}
              <h2 className="font-semibold text-slate-900">{b.judul}</h2>
              <p className="mt-1 text-xs text-slate-400">
                {tanggal(b.terbitPada)} · {b.penulis}
              </p>
              {b.ringkasan && (
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{b.ringkasan}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BeritaDetail() {
  const { slug } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['berita', slug],
    queryFn: async () => (await api.get(`/berita/${slug}`)).data.data,
  });

  if (isLoading) {
    return <div className="kontainer py-16 text-center text-sm text-slate-500">Memuat…</div>;
  }

  if (isError || !data) {
    return (
      <div className="kontainer py-16">
        <h1 className="judul-halaman mb-2">Berita tidak ditemukan</h1>
        <Link to="/berita" className="text-sm text-desa-600 hover:underline">
          Kembali ke daftar berita
        </Link>
      </div>
    );
  }

  return (
    <article className="kontainer max-w-3xl py-10">
      <Link to="/berita" className="text-sm text-desa-600 hover:underline">
        ← Semua berita
      </Link>

      <h1 className="judul-halaman mt-3">{data.judul}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {tanggal(data.terbitPada)} · {data.penulis} · {data.dilihat} kali dibaca
      </p>

      {data.sampulUrl && (
        <img
          src={data.sampulUrl}
          alt=""
          className="mt-6 aspect-video w-full rounded-xl object-cover"
        />
      )}

      {/* Isi berita ditulis perangkat desa sebagai teks biasa dan ditampilkan
          apa adanya. Sengaja bukan HTML: menyisipkan HTML dari form akan
          membuka celah XSS di halaman yang dibuka semua warga. */}
      <div className="mt-6 whitespace-pre-line text-base leading-relaxed text-slate-800">
        {data.isi}
      </div>
    </article>
  );
}
