import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { STATUS_PENGADUAN } from '@desa/shared';
import { api, pesanError } from '../../lib/api';
import { LABEL_KATEGORI, LABEL_STATUS_ADU, WARNA_STATUS_ADU } from '../Pengaduan';

interface Baris {
  id: string;
  kodeLacak: string;
  kategori: string;
  judul: string;
  status: string;
  pelapor: string;
  jumlahFoto: number;
  dibuatPada: string;
}

export function PengaduanList() {
  const [status, setStatus] = useState('BARU');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['pengaduan-admin', status, page],
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await api.get('/pengaduan', {
          params: { status: status || undefined, page, perPage: 20 },
        })
      ).data as { data: Baris[]; meta: { page: number; perPage: number; total: number } },
  });

  const berapaHari = (iso: string) =>
    Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900">Pengaduan Masyarakat</h1>
        <p className="text-sm text-slate-500">
          {data ? `${data.meta.total} laporan` : 'Memuat…'}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Kode</th>
              <th className="px-4 py-2.5 font-medium">Laporan</th>
              <th className="px-4 py-2.5 font-medium">Kategori</th>
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
                  Tidak ada laporan pada status ini.
                </td>
              </tr>
            )}
            {data?.data.map((p) => {
              const hari = berapaHari(p.dibuatPada);
              return (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{p.kodeLacak}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-slate-800">{p.judul}</span>
                    {p.jumlahFoto > 0 && (
                      <span className="block text-xs text-slate-400">{p.jumlahFoto} foto</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {LABEL_KATEGORI[p.kategori] ?? p.kategori}
                  </td>
                  {/* Laporan yang menganggur lebih dari tiga hari ditandai:
                      pengaduan yang didiamkan lebih merusak kepercayaan
                      daripada pengaduan yang ditolak dengan alasan jelas. */}
                  <td className="px-4 py-2.5">
                    <span
                      className={`tabular-nums ${
                        ['BARU', 'DIVERIFIKASI'].includes(p.status) && hari >= 3
                          ? 'font-semibold text-red-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {hari === 0 ? 'hari ini' : `${hari} hari`}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        WARNA_STATUS_ADU[p.status] ?? 'bg-slate-100'
                      }`}
                    >
                      {LABEL_STATUS_ADU[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      to={`/admin/pengaduan/${p.id}`}
                      className="text-xs font-medium text-desa-700 hover:underline"
                    >
                      Tangani
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PengaduanDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [isi, setIsi] = useState('');
  const [statusBaru, setStatusBaru] = useState('DITANGANI');
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['pengaduan-admin', id],
    queryFn: async () => (await api.get(`/pengaduan/${id}`)).data.data,
  });

  const tanggapi = async (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(null);
    setSibuk(true);
    try {
      await api.post(`/pengaduan/${id}/tanggapi`, { status: statusBaru, isi });
      setIsi('');
      await queryClient.invalidateQueries({ queryKey: ['pengaduan-admin'] });
    } catch (err) {
      setGalat(pesanError(err, 'Tanggapan gagal disimpan.'));
    } finally {
      setSibuk(false);
    }
  };

  if (isLoading || !data) return <p className="text-sm text-slate-500">Memuat…</p>;

  const gayaInput =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

  return (
    <div className="max-w-3xl">
      <Link to="/admin/pengaduan" className="text-sm text-desa-600 hover:underline">
        ← Semua pengaduan
      </Link>

      <div className="mb-5 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{data.judul}</h1>
          <p className="text-sm text-slate-500">
            {data.kodeLacak} · {LABEL_KATEGORI[data.kategori] ?? data.kategori} ·{' '}
            {new Date(data.dibuatPada).toLocaleDateString('id-ID', { dateStyle: 'long' })}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            WARNA_STATUS_ADU[data.status] ?? 'bg-slate-100'
          }`}
        >
          {LABEL_STATUS_ADU[data.status] ?? data.status}
        </span>
      </div>

      <section className="kartu mb-4">
        <p className="whitespace-pre-line text-sm text-slate-700">{data.deskripsi}</p>

        <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
          <div className="flex gap-3">
            <dt className="w-28 shrink-0 text-slate-500">Pelapor</dt>
            <dd className="text-slate-800">
              {data.pelapor}
              {data.anonimDiPublik && (
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                  anonim di publik
                </span>
              )}
            </dd>
          </div>
          {data.lokasiTeks && (
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-slate-500">Lokasi</dt>
              <dd className="text-slate-800">{data.lokasiTeks}</dd>
            </div>
          )}
          {data.latitude && (
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-slate-500">Titik GPS</dt>
              <dd>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${data.latitude}&mlon=${data.longitude}#map=18/${data.latitude}/${data.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-desa-700 hover:underline"
                >
                  {Number(data.latitude).toFixed(5)}, {Number(data.longitude).toFixed(5)} — buka peta
                </a>
              </dd>
            </div>
          )}
        </dl>

        {data.foto?.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {data.foto.map((f: { id: string; url: string }) => (
              <a key={f.id} href={f.url} target="_blank" rel="noreferrer">
                <img
                  src={f.url}
                  alt="Foto laporan"
                  loading="lazy"
                  className="aspect-square w-full rounded-lg object-cover"
                />
              </a>
            ))}
          </div>
        )}
      </section>

      {data.status !== 'SELESAI' && (
        <form onSubmit={tanggapi} className="kartu mb-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Beri Tanggapan</h2>

          {galat && (
            <div className="rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
              {galat}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status baru</label>
            <select
              value={statusBaru}
              onChange={(e) => setStatusBaru(e.target.value)}
              className={gayaInput}
            >
              {STATUS_PENGADUAN.filter((s) => s !== 'BARU').map((s) => (
                <option key={s} value={s}>
                  {LABEL_STATUS_ADU[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tanggapan untuk pelapor
            </label>
            <textarea
              required
              minLength={5}
              rows={3}
              value={isi}
              onChange={(e) => setIsi(e.target.value)}
              placeholder="Jelaskan apa yang akan atau sudah dilakukan."
              className={gayaInput}
            />
            <p className="mt-1 text-xs text-slate-400">
              Tanggapan ini terbaca pelapor dan siapa pun yang membuka kode laporannya.
            </p>
          </div>

          <button type="submit" disabled={sibuk} className="tombol-utama">
            {sibuk ? 'Menyimpan…' : 'Simpan Tanggapan'}
          </button>
        </form>
      )}

      <section className="kartu">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Riwayat Tindak Lanjut</h2>
        {data.tanggapan?.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada tanggapan.</p>
        ) : (
          <ol className="space-y-3">
            {data.tanggapan?.map((t: { id: string; isi: string; status: string; dibuatPada: string }) => (
              <li key={t.id} className="border-l-2 border-desa-200 pl-3">
                <p className="text-xs text-slate-400">
                  {new Date(t.dibuatPada).toLocaleString('id-ID')} ·{' '}
                  {LABEL_STATUS_ADU[t.status] ?? t.status}
                </p>
                <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700">{t.isi}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
