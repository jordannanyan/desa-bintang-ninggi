import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LABEL_STATUS_PROYEK, STATUS_PROYEK, formatRupiah, formatRupiahRingkas } from '@desa/shared';
import { api } from '../lib/api';

interface Proyek {
  id: string;
  nama: string;
  deskripsi: string | null;
  lokasi: string;
  latitude: number | null;
  longitude: number | null;
  nilai: number;
  sumberDana: string;
  kontraktor: string | null;
  pengawas: string | null;
  tanggalMulai: string;
  tanggalSelesai: string | null;
  status: string;
  persentase: number;
  tahun: number;
  jumlahProgres: number;
}

const WARNA: Record<string, string> = {
  PERENCANAAN: 'bg-slate-100 text-slate-700',
  BERJALAN: 'bg-amber-50 text-amber-800',
  SELESAI: 'bg-desa-50 text-desa-800',
  TERTUNDA: 'bg-red-50 text-red-800',
};

const tanggal = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '—';

/** Batang progres. Angka persen ditulis di sebelahnya, bukan di dalam batang. */
function Progres({ persen }: { persen: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-desa-600 transition-[width] duration-500"
          style={{ width: `${Math.min(Math.max(persen, 0), 100)}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-slate-700">
        {persen}%
      </span>
    </div>
  );
}

export function Pembangunan() {
  const [status, setStatus] = useState('');
  const [tahun, setTahun] = useState<string>('');

  const { data: ringkasan } = useQuery({
    queryKey: ['pembangunan-ringkasan'],
    queryFn: async () =>
      (await api.get('/pembangunan/ringkasan')).data.data as {
        totalProyek: number;
        totalNilai: number;
        perStatus: Array<{ label: string; jumlah: number }>;
        perTahun: Array<{ tahun: number; jumlah: number; nilai: number }>;
      },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['pembangunan', status, tahun],
    queryFn: async () =>
      (
        await api.get('/pembangunan', {
          params: { status: status || undefined, tahun: tahun || undefined },
        })
      ).data.data as Proyek[],
  });

  return (
    <div className="kontainer py-10">
      <h1 className="judul-halaman">Pembangunan Desa</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">
        Seluruh proyek desa beserta nilai, sumber dana, pelaksana, dan progresnya.
      </p>

      {ringkasan && ringkasan.totalProyek > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="kartu">
            <p className="text-xs text-slate-500">Jumlah proyek</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {ringkasan.totalProyek}
            </p>
          </div>
          <div className="kartu">
            <p className="text-xs text-slate-500">Total nilai</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatRupiahRingkas(ringkasan.totalNilai)}
            </p>
          </div>
          <div className="kartu">
            <p className="text-xs text-slate-500">Selesai</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {ringkasan.perStatus.find((s) => s.label === 'SELESAI')?.jumlah ?? 0}
              <span className="text-base font-normal text-slate-400">
                {' '}
                dari {ringkasan.totalProyek}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {['', ...STATUS_PROYEK].map((s) => (
          <button
            key={s || 'semua'}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              status === s
                ? 'bg-desa-600 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s ? LABEL_STATUS_PROYEK[s as keyof typeof LABEL_STATUS_PROYEK] : 'Semua'}
          </button>
        ))}

        {ringkasan && ringkasan.perTahun.length > 1 && (
          <select
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
            className="ml-auto rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
          >
            <option value="">Semua tahun</option>
            {ringkasan.perTahun.map((t) => (
              <option key={t.tahun} value={t.tahun}>
                {t.tahun} ({t.jumlah})
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading && <p className="mt-6 text-sm text-slate-500">Memuat…</p>}

      {data?.length === 0 && (
        <div className="mt-6 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          {status || tahun
            ? 'Tidak ada proyek pada penyaringan ini.'
            : 'Data proyek belum diisi. Perangkat desa dapat memasukkannya lewat Dashboard Perangkat → Pembangunan.'}
        </div>
      )}

      <ul className="mt-6 grid items-start gap-4 lg:grid-cols-2">
        {data?.map((p) => (
          <li key={p.id} className="kartu">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900">{p.nama}</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {p.lokasi} · {p.tahun}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  WARNA[p.status] ?? 'bg-slate-100'
                }`}
              >
                {LABEL_STATUS_PROYEK[p.status as keyof typeof LABEL_STATUS_PROYEK] ?? p.status}
              </span>
            </div>

            <div className="mt-3">
              <Progres persen={p.persentase} />
            </div>

            <dl className="mt-3 grid gap-1.5 border-t border-slate-100 pt-3 text-xs sm:grid-cols-2">
              {[
                ['Nilai', formatRupiah(p.nilai)],
                ['Sumber dana', p.sumberDana],
                ['Mulai', tanggal(p.tanggalMulai)],
                ['Target selesai', tanggal(p.tanggalSelesai)],
                ['Pelaksana', p.kontraktor ?? '—'],
                ['Pengawas', p.pengawas ?? '—'],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-2">
                  <dt className="w-24 shrink-0 text-slate-500">{l}</dt>
                  <dd className="text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                to={`/pembangunan/${p.id}`}
                className="text-xs font-medium text-desa-700 hover:underline"
              >
                Lihat progres{p.jumlahProgres > 0 && ` (${p.jumlahProgres} catatan)`}
              </Link>
              {p.latitude && p.longitude && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=17/${p.latitude}/${p.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-desa-700 hover:underline"
                >
                  Buka di peta
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProyekDetail() {
  const { id } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pembangunan', id],
    queryFn: async () => (await api.get(`/pembangunan/${id}`)).data.data,
  });

  if (isLoading) {
    return <div className="kontainer py-16 text-center text-sm text-slate-500">Memuat…</div>;
  }

  if (isError || !data) {
    return (
      <div className="kontainer py-16">
        <h1 className="judul-halaman mb-2">Proyek tidak ditemukan</h1>
        <Link to="/pembangunan" className="text-sm text-desa-600 hover:underline">
          Kembali ke daftar proyek
        </Link>
      </div>
    );
  }

  return (
    <div className="kontainer max-w-3xl py-10">
      <Link to="/pembangunan" className="text-sm text-desa-600 hover:underline">
        ← Semua proyek
      </Link>

      <h1 className="judul-halaman mt-2">{data.nama}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {data.lokasi} · {data.tahun}
      </p>

      <div className="mt-6 kartu">
        <Progres persen={data.persentase} />
        {data.deskripsi && (
          <p className="mt-4 whitespace-pre-line text-sm text-slate-700">{data.deskripsi}</p>
        )}
        <dl className="mt-4 grid gap-1.5 border-t border-slate-100 pt-3 text-sm sm:grid-cols-2">
          {[
            ['Nilai proyek', formatRupiah(data.nilai)],
            ['Sumber dana', data.sumberDana],
            ['Mulai', tanggal(data.tanggalMulai)],
            ['Target selesai', tanggal(data.tanggalSelesai)],
            ['Pelaksana', data.kontraktor ?? '—'],
            ['Pengawas', data.pengawas ?? '—'],
          ].map(([l, v]) => (
            <div key={l} className="flex gap-2">
              <dt className="w-32 shrink-0 text-slate-500">{l}</dt>
              <dd className="text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="kartu mt-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Catatan Progres</h2>
        {data.progres?.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada catatan progres.</p>
        ) : (
          <ol className="space-y-4">
            {data.progres?.map(
              (g: {
                id: string;
                tanggal: string;
                persentase: number;
                catatan: string | null;
                fotoUrl: string | null;
              }) => (
                <li key={g.id} className="border-l-2 border-desa-200 pl-3">
                  <p className="text-xs text-slate-400">
                    {tanggal(g.tanggal)} · {g.persentase}%
                  </p>
                  {g.catatan && (
                    <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700">
                      {g.catatan}
                    </p>
                  )}
                  {g.fotoUrl && (
                    <a href={g.fotoUrl} target="_blank" rel="noreferrer">
                      <img
                        src={g.fotoUrl}
                        alt={`Progres ${tanggal(g.tanggal)}`}
                        loading="lazy"
                        className="mt-2 max-h-64 rounded-lg object-cover"
                      />
                    </a>
                  )}
                </li>
              ),
            )}
          </ol>
        )}
      </section>
    </div>
  );
}
