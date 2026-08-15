import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { KATEGORI_PENGADUAN, STATUS_PENGADUAN } from '@desa/shared';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export const LABEL_KATEGORI: Record<string, string> = {
  JALAN_RUSAK: 'Jalan rusak',
  LAMPU_MATI: 'Lampu mati',
  SAMPAH: 'Sampah',
  BANJIR: 'Banjir',
  PELAYANAN: 'Pelayanan',
  KONFLIK_SOSIAL: 'Konflik sosial',
  KEBAKARAN: 'Kebakaran',
  INFRASTRUKTUR: 'Infrastruktur',
};

export const LABEL_STATUS_ADU: Record<string, string> = {
  BARU: 'Baru',
  DIVERIFIKASI: 'Diverifikasi',
  DITANGANI: 'Sedang ditangani',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
};

export const WARNA_STATUS_ADU: Record<string, string> = {
  BARU: 'bg-slate-100 text-slate-700',
  DIVERIFIKASI: 'bg-sky-50 text-sky-800',
  DITANGANI: 'bg-amber-50 text-amber-800',
  SELESAI: 'bg-desa-50 text-desa-800',
  DITOLAK: 'bg-red-50 text-red-800',
};

interface BarisPengaduan {
  id: string;
  kodeLacak: string;
  kategori: string;
  judul: string;
  deskripsi: string;
  lokasiTeks: string | null;
  status: string;
  pelapor: string;
  jumlahFoto: number;
  jumlahTanggapan: number;
  dibuatPada: string;
}

export function Pengaduan() {
  const { pengguna } = useAuth();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['pengaduan', status, page],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await api.get('/pengaduan', {
          params: { status: status || undefined, page, perPage: 20 },
        })
      ).data as {
        data: BarisPengaduan[];
        meta: { page: number; perPage: number; total: number };
      },
  });

  const totalHalaman = data ? Math.max(1, Math.ceil(data.meta.total / data.meta.perPage)) : 1;

  return (
    <div className="kontainer py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="judul-halaman">Pengaduan Masyarakat</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Laporkan masalah di desa dan pantau tindak lanjutnya. Seluruh laporan tampil
            terbuka di sini agar warga tahu mana yang sudah ditangani.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/pengaduan/lacak" className="tombol-sekunder text-sm">
            Lacak laporan
          </Link>
          <Link
            to={pengguna ? '/pengaduan/buat' : '/masuk'}
            state={pengguna ? undefined : { dari: '/pengaduan/buat' }}
            className="tombol-utama text-sm"
          >
            Sampaikan Laporan
          </Link>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {['', ...STATUS_PENGADUAN].map((s) => (
          <button
            key={s || 'semua'}
            type="button"
            onClick={() => {
              setPage(1);
              setStatus(s);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              status === s
                ? 'bg-desa-600 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s ? LABEL_STATUS_ADU[s] : 'Semua'}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}

      {data?.data.length === 0 && (
        <div className="kartu text-center text-sm text-slate-500">
          {status ? 'Tidak ada laporan pada status ini.' : 'Belum ada laporan masuk.'}
        </div>
      )}

      <ul className="space-y-3">
        {data?.data.map((p) => (
          <li key={p.id} className="kartu">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {LABEL_KATEGORI[p.kategori] ?? p.kategori}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{p.kodeLacak}</span>
                </div>
                <h2 className="mt-1.5 font-medium text-slate-900">{p.judul}</h2>
                <p className="mt-1 text-sm text-slate-600">{p.deskripsi}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {p.pelapor} ·{' '}
                  {new Date(p.dibuatPada).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                  {p.lokasiTeks && ` · ${p.lokasiTeks}`}
                  {p.jumlahFoto > 0 && ` · ${p.jumlahFoto} foto`}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  WARNA_STATUS_ADU[p.status] ?? 'bg-slate-100'
                }`}
              >
                {LABEL_STATUS_ADU[p.status] ?? p.status}
              </span>
            </div>

            {p.jumlahTanggapan > 0 && (
              <Link
                to={`/pengaduan/lacak/${p.kodeLacak}`}
                className="mt-3 inline-block text-xs font-medium text-desa-600 hover:underline"
              >
                Lihat {p.jumlahTanggapan} tanggapan
              </Link>
            )}
          </li>
        ))}
      </ul>

      {data && data.meta.total > data.meta.perPage && (
        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Halaman {data.meta.page} dari {totalHalaman}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="tombol-sekunder text-xs disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalHalaman}
              className="tombol-sekunder text-xs disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}

      <p className="mt-8 text-xs text-slate-400">
        Nama pelapor ditampilkan sebagian, dan titik GPS tidak pernah dibuka ke publik.
      </p>
    </div>
  );
}
