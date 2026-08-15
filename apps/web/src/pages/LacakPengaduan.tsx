import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { LABEL_KATEGORI, LABEL_STATUS_ADU, WARNA_STATUS_ADU } from './Pengaduan';

interface Lacak {
  kodeLacak: string;
  kategori: string;
  judul: string;
  deskripsi: string;
  lokasiTeks: string | null;
  status: string;
  dibuatPada: string;
  foto: string[];
  tanggapan: Array<{ isi: string; status: string; dibuatPada: string }>;
}

/** Pelacakan lewat kode, tanpa login — untuk yang melapor lalu menutup halaman. */
export function LacakPengaduan() {
  const { kode } = useParams();
  const navigate = useNavigate();
  const lokasi = useLocation();
  const [ketikan, setKetikan] = useState('');
  const baruSaja = (lokasi.state as { baru?: boolean } | null)?.baru;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['lacak-pengaduan', kode],
    enabled: Boolean(kode),
    queryFn: async () => (await api.get(`/pengaduan/lacak/${kode}`)).data.data as Lacak,
  });

  const tanggal = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long' });

  return (
    <div className="kontainer max-w-2xl py-10">
      <Link to="/pengaduan" className="text-sm text-desa-600 hover:underline">
        ← Semua pengaduan
      </Link>

      <h1 className="judul-halaman mt-2">Lacak Laporan</h1>
      <p className="mt-1 text-sm text-slate-600">
        Masukkan kode laporan untuk melihat perkembangannya.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ketikan.trim()) navigate(`/pengaduan/lacak/${ketikan.trim().toUpperCase()}`);
        }}
        className="mt-5 flex gap-2"
      >
        <input
          value={ketikan}
          onChange={(e) => setKetikan(e.target.value)}
          placeholder="Contoh: ADU-2026-A7K2M9"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase tracking-wider focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500"
        />
        <button type="submit" className="tombol-utama">
          Lacak
        </button>
      </form>

      {baruSaja && data && (
        <div className="mt-6 rounded-lg border-l-4 border-desa-500 bg-desa-50 p-4 text-sm text-desa-900">
          <b>Laporan Anda terkirim.</b> Simpan kode <b>{data.kodeLacak}</b> untuk memantau
          perkembangannya kapan saja, tanpa perlu masuk.
        </div>
      )}

      {isLoading && <p className="mt-6 text-sm text-slate-500">Memuat…</p>}

      {isError && (
        <div className="mt-6 rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-800">
          Kode laporan tidak dikenali. Periksa kembali ejaannya.
        </div>
      )}

      {data && (
        <article className="mt-6 space-y-4">
          <div className="kartu">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {LABEL_KATEGORI[data.kategori] ?? data.kategori}
                </span>
                <h2 className="mt-1.5 text-lg font-semibold text-slate-900">{data.judul}</h2>
                <p className="text-xs text-slate-400">
                  {data.kodeLacak} · dilaporkan {tanggal(data.dibuatPada)}
                  {data.lokasiTeks && ` · ${data.lokasiTeks}`}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  WARNA_STATUS_ADU[data.status] ?? 'bg-slate-100'
                }`}
              >
                {LABEL_STATUS_ADU[data.status] ?? data.status}
              </span>
            </div>

            <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{data.deskripsi}</p>

            {data.foto.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {data.foto.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer">
                    <img
                      src={url}
                      alt="Foto laporan"
                      loading="lazy"
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="kartu">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Tindak Lanjut</h3>
            {data.tanggapan.length === 0 ? (
              <p className="text-sm text-slate-500">
                Belum ada tanggapan dari perangkat desa.
              </p>
            ) : (
              <ol className="space-y-3">
                {data.tanggapan.map((t, i) => (
                  <li key={i} className="border-l-2 border-desa-200 pl-3">
                    <p className="text-xs text-slate-400">
                      {tanggal(t.dibuatPada)} · {LABEL_STATUS_ADU[t.status] ?? t.status}
                    </p>
                    <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700">{t.isi}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </article>
      )}
    </div>
  );
}
