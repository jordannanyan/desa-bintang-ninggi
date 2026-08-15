import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LABEL_STATUS, STATUS_PENGAJUAN, type StatusPengajuan } from '@desa/shared';
import { api, pesanError } from '../../lib/api';

interface BarisPengajuan {
  id: string;
  kodeLacak: string;
  jenis: string;
  pemohon: string;
  keperluan: string;
  status: StatusPengajuan;
  jumlahLampiran: number;
  nomorSurat: string | null;
  dibuatPada: string;
}

const WARNA: Record<StatusPengajuan, string> = {
  DIPROSES: 'bg-amber-50 text-amber-800',
  DISETUJUI: 'bg-sky-50 text-sky-800',
  DITOLAK: 'bg-red-50 text-red-800',
  SIAP_DIAMBIL: 'bg-desa-50 text-desa-800',
};

export function SuratList() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<StatusPengajuan | ''>('DIPROSES');
  const [page, setPage] = useState(1);
  const [galat, setGalat] = useState<string | null>(null);
  const [menolak, setMenolak] = useState<BarisPengajuan | null>(null);
  const [alasan, setAlasan] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['pengajuan-surat', status, page],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await api.get('/layanan/surat', {
          params: { status: status || undefined, page, perPage: 20 },
        })
      ).data as { data: BarisPengajuan[]; meta: { page: number; perPage: number; total: number } },
  });

  const totalHalaman = data ? Math.max(1, Math.ceil(data.meta.total / data.meta.perPage)) : 1;

  const berapaHari = (iso: string) =>
    Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

  // Persetujuan dilakukan di daftar ini, bukan di halaman terpisah: dua menu
  // yang membaca tabel yang sama hanya membuat perangkat desa menebak-nebak
  // yang mana yang sedang dilihatnya.
  const tinjau = useMutation({
    mutationFn: (v: { id: string; status: 'DISETUJUI' | 'DITOLAK'; catatan?: string }) =>
      api.patch(`/layanan/surat/${v.id}/tinjau`, { status: v.status, catatan: v.catatan }),
    onSuccess: async () => {
      setGalat(null);
      setMenolak(null);
      setAlasan('');
      await queryClient.invalidateQueries({ queryKey: ['pengajuan-surat'] });
      await queryClient.invalidateQueries({ queryKey: ['ringkasan-admin'] });
    },
    onError: (e) => setGalat(pesanError(e, 'Peninjauan gagal disimpan.')),
  });

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Manajemen Surat</h1>
        <p className="text-sm text-slate-500">
          {data ? `${data.meta.total} pengajuan` : 'Memuat…'}
        </p>
      </div>

      {galat && (
        <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
          {galat}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(['', ...STATUS_PENGAJUAN] as const).map((s) => (
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
            {s ? LABEL_STATUS[s] : 'Semua'}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Kode</th>
              <th className="px-4 py-2.5 font-medium">Pemohon</th>
              <th className="px-4 py-2.5 font-medium">Jenis</th>
              <th className="px-4 py-2.5 font-medium">Menunggu</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Memuat…
                </td>
              </tr>
            )}

            {data?.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Tidak ada pengajuan pada status ini.
                </td>
              </tr>
            )}

            {data?.data.map((p) => {
              const hari = berapaHari(p.dibuatPada);
              return (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{p.kodeLacak}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{p.pemohon}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {p.jenis}
                    <span className="block text-xs text-slate-400">{p.keperluan}</span>
                  </td>
                  {/* Lama menunggu ditonjolkan: itu yang membuat antrean terasa
                      mendesak, bukan sekadar tanggal masuk. */}
                  <td className="px-4 py-2.5">
                    <span
                      className={`tabular-nums ${
                        p.status === 'DIPROSES' && hari >= 3
                          ? 'font-semibold text-red-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {hari === 0 ? 'hari ini' : `${hari} hari`}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${WARNA[p.status]}`}
                    >
                      {LABEL_STATUS[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                      <Link
                        to={`/admin/surat/${p.id}`}
                        className="text-xs font-medium text-desa-700 hover:underline"
                      >
                        {p.status === 'DIPROSES' ? 'Tinjau berkas' : 'Lihat'}
                      </Link>
                      {p.status === 'DIPROSES' && (
                        <>
                          <button
                            type="button"
                            disabled={tinjau.isPending}
                            onClick={() => tinjau.mutate({ id: p.id, status: 'DISETUJUI' })}
                            className="rounded-md border border-desa-300 px-2 py-1 text-xs font-medium text-desa-700 hover:bg-desa-50 disabled:opacity-50"
                          >
                            Setujui
                          </button>
                          <button
                            type="button"
                            disabled={tinjau.isPending}
                            onClick={() => {
                              setMenolak(p);
                              setAlasan('');
                            }}
                            className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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

      {menolak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 className="mb-1 font-semibold text-slate-900">Tolak pengajuan</h2>
            <p className="mb-3 text-sm text-slate-500">
              {menolak.jenis} — {menolak.pemohon}
            </p>
            {/* Alasan wajib: warga membaca teks ini di halaman lacak, dan tanpa
                alasan ia tidak tahu apa yang harus diperbaiki. */}
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Alasan penolakan
            </label>
            <textarea
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Contoh: Fotokopi KTP belum terbaca, mohon unggah ulang."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMenolak(null)}
                className="tombol-sekunder text-sm"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={alasan.trim().length === 0 || tinjau.isPending}
                onClick={() =>
                  tinjau.mutate({ id: menolak.id, status: 'DITOLAK', catatan: alasan.trim() })
                }
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {tinjau.isPending ? 'Menyimpan…' : 'Tolak pengajuan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
