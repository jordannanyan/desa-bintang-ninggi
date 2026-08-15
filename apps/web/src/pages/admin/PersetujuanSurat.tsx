import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, pesanError } from '../../lib/api';

interface Antrian {
  id: string;
  kodeLacak: string;
  jenis: string;
  pemohon: string;
  keperluan: string;
  jumlahLampiran: number;
  dibuatPada: string;
}

const hariMenunggu = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

export function PersetujuanSurat() {
  const queryClient = useQueryClient();
  const [galat, setGalat] = useState<string | null>(null);
  const [menolak, setMenolak] = useState<Antrian | null>(null);
  const [alasan, setAlasan] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['antrian-persetujuan'],
    queryFn: async () =>
      (await api.get('/layanan/surat', { params: { status: 'DIPROSES', perPage: 100 } })).data as {
        data: Antrian[];
        meta: { total: number };
      },
  });

  const tinjau = useMutation({
    mutationFn: (v: { id: string; status: 'DISETUJUI' | 'DITOLAK'; catatan?: string }) =>
      api.patch(`/layanan/surat/${v.id}/tinjau`, { status: v.status, catatan: v.catatan }),
    onSuccess: async () => {
      setGalat(null);
      setMenolak(null);
      setAlasan('');
      await queryClient.invalidateQueries({ queryKey: ['antrian-persetujuan'] });
      await queryClient.invalidateQueries({ queryKey: ['pengajuan-surat'] });
      await queryClient.invalidateQueries({ queryKey: ['statistik-dashboard'] });
    },
    onError: (e) => setGalat(pesanError(e, 'Peninjauan gagal disimpan.')),
  });

  // Yang paling lama menunggu naik ke atas: antrian surat desa dikeluhkan
  // justru ketika satu berkas tertinggal di bawah tumpukan berhari-hari.
  const antrian = [...(data?.data ?? [])].sort(
    (a, b) => new Date(a.dibuatPada).getTime() - new Date(b.dibuatPada).getTime(),
  );

  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Persetujuan Surat</h1>
        <p className="text-sm text-slate-500">
          {isLoading
            ? 'Memuat…'
            : antrian.length === 0
              ? 'Tidak ada pengajuan yang menunggu.'
              : `${antrian.length} pengajuan menunggu — yang terlama di atas.`}
        </p>
      </div>

      {galat && (
        <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
          {galat}
        </div>
      )}

      {!isLoading && antrian.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-500">
            Semua pengajuan sudah ditinjau. Riwayat lengkapnya ada di{' '}
            <Link to="/admin/surat" className="font-medium text-desa-700 hover:underline">
              Manajemen Surat
            </Link>
            .
          </p>
        </div>
      )}

      <div className="space-y-3">
        {antrian.map((s) => {
          const umur = hariMenunggu(s.dibuatPada);
          const sedang = tinjau.isPending && tinjau.variables?.id === s.id;
          return (
            <div
              key={s.id}
              className={`kartu ${umur >= 3 ? 'border-l-4 border-l-amber-400' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{s.jenis}</p>
                  <p className="text-sm text-slate-600">
                    {s.pemohon} · <span className="font-mono text-xs">{s.kodeLacak}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{s.keperluan}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {s.jumlahLampiran} lampiran ·{' '}
                    <span className={umur >= 3 ? 'font-medium text-amber-700' : ''}>
                      menunggu {umur === 0 ? 'hari ini' : `${umur} hari`}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {/* Lampiran hanya bisa dibaca di halaman detail, jadi itulah
                      jalur utamanya. Tombol di bawah untuk pengajuan yang sudah
                      jelas dan tidak berlampiran. */}
                  <Link to={`/admin/surat/${s.id}`} className="tombol-utama">
                    Tinjau berkas
                  </Link>
                  <button
                    type="button"
                    disabled={sedang}
                    onClick={() => tinjau.mutate({ id: s.id, status: 'DISETUJUI' })}
                    className="rounded-lg border border-desa-600 px-3 py-2 text-sm font-medium text-desa-700 hover:bg-desa-50 disabled:opacity-50"
                  >
                    Setujui
                  </button>
                  <button
                    type="button"
                    disabled={sedang}
                    onClick={() => {
                      setMenolak(s);
                      setAlasan('');
                    }}
                    className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
