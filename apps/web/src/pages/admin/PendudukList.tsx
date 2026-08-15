import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api, pesanError, unduhBerkas } from '../../lib/api';
import { useAuth } from '../../lib/auth';

interface BarisPenduduk {
  id: string;
  nik: string;
  nama: string;
  jenisKelamin: 'LAKI_LAKI' | 'PEREMPUAN';
  usia: number;
  pekerjaan: string;
  hubunganKeluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  status: 'AKTIF' | 'MENINGGAL' | 'PINDAH';
}

const WARNA_STATUS: Record<BarisPenduduk['status'], string> = {
  AKTIF: 'bg-desa-50 text-desa-700',
  MENINGGAL: 'bg-slate-100 text-slate-600',
  PINDAH: 'bg-amber-50 text-amber-700',
};

export function PendudukList() {
  const { pengguna } = useAuth();
  const [q, setQ] = useState('');
  const [kataKunci, setKataKunci] = useState('');
  const [status, setStatus] = useState<'AKTIF' | 'MENINGGAL' | 'PINDAH' | 'SEMUA'>('AKTIF');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['penduduk', kataKunci, status, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await api.get('/kependudukan', {
        params: { q: kataKunci || undefined, status, page, perPage: 25 },
      });
      return res.data as {
        data: BarisPenduduk[];
        meta: { page: number; perPage: number; total: number };
      };
    },
  });

  const cari = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setKataKunci(q.trim());
  };

  const totalHalaman = data ? Math.max(1, Math.ceil(data.meta.total / data.meta.perPage)) : 1;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Manajemen Penduduk</h1>
          <p className="text-sm text-slate-500">
            {data ? `${data.meta.total.toLocaleString('id-ID')} data` : 'Memuat…'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to="/admin/penduduk/impor" className="tombol-sekunder text-xs">
            Impor CSV
          </Link>
          {pengguna?.peran === 'ADMIN' && (
            <button
              type="button"
              onClick={() =>
                unduhBerkas(
                  '/kependudukan/ekspor',
                  `penduduk-${new Date().toISOString().slice(0, 10)}.csv`,
                )
              }
              className="tombol-sekunder text-xs"
            >
              Ekspor CSV
            </button>
          )}
          <Link to="/admin/penduduk/baru" className="tombol-utama text-xs">
            Tambah Penduduk
          </Link>
        </div>
      </div>

      <form onSubmit={cari} className="mb-4 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama, atau ketik NIK lengkap 16 digit"
          className="min-w-64 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as typeof status);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="AKTIF">Aktif</option>
          <option value="MENINGGAL">Meninggal</option>
          <option value="PINDAH">Pindah</option>
          <option value="SEMUA">Semua</option>
        </select>
        <button type="submit" className="tombol-utama text-sm">
          Cari
        </button>
      </form>

      {isError && (
        <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
          {pesanError(error, 'Gagal memuat data penduduk.')}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[58rem] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Nama</th>
              <th className="px-4 py-2.5 font-medium">NIK</th>
              <th className="px-4 py-2.5 font-medium">L/P</th>
              <th className="px-4 py-2.5 font-medium">Usia</th>
              <th className="px-4 py-2.5 font-medium">Hubungan</th>
              <th className="px-4 py-2.5 font-medium">RT/RW</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  Memuat…
                </td>
              </tr>
            )}

            {data?.data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  {kataKunci ? 'Tidak ada yang cocok.' : 'Belum ada data penduduk.'}
                </td>
              </tr>
            )}

            {data?.data.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2.5">
                  <Link
                    to={`/admin/penduduk/${p.id}`}
                    className="font-medium text-desa-700 hover:underline"
                  >
                    {p.nama}
                  </Link>
                  <p className="text-xs text-slate-400">{p.pekerjaan}</p>
                </td>
                {/* NIK sengaja tersamar di daftar — membuka daftar tidak boleh
                    berarti memanen NIK utuh seluruh warga sekaligus. */}
                <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{p.nik}</td>
                <td className="px-4 py-2.5 text-slate-600">
                  {p.jenisKelamin === 'LAKI_LAKI' ? 'L' : 'P'}
                </td>
                <td className="px-4 py-2.5 tabular-nums text-slate-600">{p.usia}</td>
                <td className="px-4 py-2.5 text-slate-600">{p.hubunganKeluarga}</td>
                <td className="px-4 py-2.5 tabular-nums text-slate-600">
                  {p.rt}/{p.rw}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${WARNA_STATUS[p.status]}`}
                  >
                    {p.status.toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {/* Hanya untuk penduduk aktif: menerbitkan kode aktivasi bagi
                      orang yang sudah meninggal atau pindah tidak masuk akal. */}
                  {p.status === 'AKTIF' && (
                    <Link
                      to={`/admin/akun/${p.id}`}
                      className="whitespace-nowrap text-xs font-medium text-desa-700 hover:underline"
                    >
                      Buat akun
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.meta.total > data.meta.perPage && (
        <div className="mt-4 flex items-center justify-between text-sm">
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
    </div>
  );
}
