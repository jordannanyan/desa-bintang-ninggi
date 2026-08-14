import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface JenisSurat {
  kode: string;
  nama: string;
  fieldTambahan: string[] | null;
  lampiranWajib: string[] | null;
}

export function Layanan() {
  const { pengguna } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['jenis-surat'],
    queryFn: async () =>
      (await api.get<{ ok: true; data: JenisSurat[] }>('/layanan/surat/jenis')).data.data,
  });

  return (
    <div className="kontainer py-10">
      <h1 className="judul-halaman">Pelayanan Online</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        Ajukan surat dari rumah. Setelah disetujui, surat terbit dengan nomor resmi dan QR
        Code yang bisa dipindai siapa pun untuk memeriksa keasliannya.
      </p>

      {!pengguna && (
        <div className="mt-6 rounded-lg border-l-4 border-desa-500 bg-desa-50 p-4 text-sm text-desa-900">
          Anda perlu <Link to="/masuk" className="font-medium underline">masuk</Link> untuk
          mengajukan surat. Belum punya akun? Minta kode aktivasi ke kantor desa, lalu{' '}
          <Link to="/aktivasi" className="font-medium underline">aktivasi di sini</Link>.
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {pengguna && (
          <Link to="/warga/surat" className="tombol-sekunder text-sm">
            Riwayat pengajuan saya
          </Link>
        )}
        <Link to="/verifikasi" className="tombol-sekunder text-sm">
          Periksa keaslian surat
        </Link>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Jenis surat yang dilayani
      </h2>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}

      {data?.length === 0 && (
        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Belum ada jenis surat yang diaktifkan. Perangkat desa dapat mengaturnya lewat
          Dashboard Perangkat.
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((j) => (
          <li key={j.kode}>
            <Link
              to={pengguna ? `/layanan/ajukan/${j.kode}` : '/masuk'}
              state={pengguna ? undefined : { dari: `/layanan/ajukan/${j.kode}` }}
              className="kartu block h-full transition hover:border-desa-300 hover:shadow-md"
            >
              <h3 className="font-medium text-slate-900">{j.nama}</h3>
              {j.lampiranWajib?.length ? (
                <p className="mt-1 text-xs text-slate-500">
                  Lampiran: {j.lampiranWajib.join(', ')}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
