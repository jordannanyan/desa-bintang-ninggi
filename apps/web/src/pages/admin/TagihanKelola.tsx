import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatRupiah } from '@desa/shared';
import { api, pesanError } from '../../lib/api';

const gayaInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

const JENIS = ['PBB', 'IURAN_DESA', 'SEWA_ASET', 'LAINNYA'] as const;
const LABEL_JENIS: Record<string, string> = {
  PBB: 'PBB',
  IURAN_DESA: 'Iuran desa',
  SEWA_ASET: 'Sewa aset',
  LAINNYA: 'Lainnya',
};
const LABEL_STATUS_TAGIHAN: Record<string, string> = {
  BELUM_BAYAR: 'Belum bayar',
  LUNAS: 'Lunas',
  DIBATALKAN: 'Dibatalkan',
};

interface BarisTagihan {
  id: string;
  penduduk: string;
  jenis: string;
  judul: string;
  tahun: number;
  periode: string | null;
  jumlah: number;
  jatuhTempo: string | null;
  status: string;
}

/** Pencari penduduk sederhana: mengetik nama lalu memilih dari hasil. */
function PilihPenduduk({
  nilai,
  onPilih,
}: {
  nilai: { id: string; nama: string } | null;
  onPilih: (p: { id: string; nama: string } | null) => void;
}) {
  const [kata, setKata] = useState('');

  const { data } = useQuery({
    queryKey: ['cari-penduduk', kata],
    // Tanpa kata kunci, daftar penduduk sedesa tidak perlu ditarik.
    enabled: kata.trim().length >= 3,
    queryFn: async () =>
      (await api.get('/kependudukan', { params: { q: kata, status: 'AKTIF', perPage: 8 } })).data
        .data as { id: string; nama: string; alamat?: string }[],
  });

  if (nilai)
    return (
      <div className="flex items-center gap-2 rounded-lg border border-desa-200 bg-desa-50 px-3 py-2 text-sm">
        <span className="font-medium text-desa-900">{nilai.nama}</span>
        <button
          type="button"
          onClick={() => onPilih(null)}
          className="ml-auto text-xs font-medium text-slate-600 hover:underline"
        >
          Ganti
        </button>
      </div>
    );

  return (
    <div className="relative">
      <input
        placeholder="Cari nama penduduk (min. 3 huruf)"
        value={kata}
        onChange={(e) => setKata(e.target.value)}
        className={gayaInput}
      />
      {data && data.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {data.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onPilih({ id: p.id, nama: p.nama });
                  setKata('');
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                {p.nama}
              </button>
            </li>
          ))}
        </ul>
      )}
      {kata.trim().length >= 3 && data?.length === 0 && (
        <p className="mt-1 text-xs text-slate-500">Tidak ada penduduk yang cocok.</p>
      )}
    </div>
  );
}

export function TagihanKelola() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('BELUM_BAYAR');
  const [galat, setGalat] = useState<string | null>(null);
  const [warga, setWarga] = useState<{ id: string; nama: string } | null>(null);
  const [form, setForm] = useState({
    jenis: 'PBB' as (typeof JENIS)[number],
    judul: '',
    tahun: String(new Date().getFullYear()),
    periode: '',
    jumlah: '',
    jatuhTempo: '',
    catatan: '',
  });

  const { data } = useQuery({
    queryKey: ['tagihan', status],
    queryFn: async () =>
      (await api.get('/tagihan', { params: { status: status || undefined } })).data
        .data as BarisTagihan[],
  });

  const segarkan = async () => {
    await queryClient.invalidateQueries({ queryKey: ['tagihan'] });
    await queryClient.invalidateQueries({ queryKey: ['statistik-dashboard'] });
  };

  const simpan = useMutation({
    mutationFn: () =>
      api.post('/tagihan', {
        pendudukId: warga!.id,
        jenis: form.jenis,
        judul: form.judul,
        tahun: form.tahun,
        jumlah: form.jumlah,
        periode: form.periode || undefined,
        jatuhTempo: form.jatuhTempo || undefined,
        catatan: form.catatan || undefined,
      }),
    onSuccess: async () => {
      setGalat(null);
      setWarga(null);
      setForm({ ...form, judul: '', jumlah: '', jatuhTempo: '', catatan: '' });
      await segarkan();
    },
    onError: (e) => setGalat(pesanError(e, 'Tagihan gagal disimpan.')),
  });

  const ubahStatus = useMutation({
    mutationFn: (v: { id: string; status: string }) =>
      api.patch(`/tagihan/${v.id}/status`, { status: v.status }),
    onSuccess: segarkan,
    onError: (e) => setGalat(pesanError(e, 'Status gagal diubah.')),
  });

  const belumBayar = (data ?? []).filter((t) => t.status === 'BELUM_BAYAR');
  const totalBelum = belumBayar.reduce((s, t) => s + t.jumlah, 0);

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Tagihan &amp; Pajak Desa</h1>
      <p className="mb-5 text-sm text-slate-500">
        Tagihan yang dibuat di sini langsung tampil di dashboard warga yang bersangkutan.
      </p>

      {galat && (
        <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
          {galat}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!warga) {
            setGalat('Pilih penduduk yang ditagih lebih dulu.');
            return;
          }
          simpan.mutate();
        }}
        className="kartu mb-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">Terbitkan Tagihan</h2>
        <PilihPenduduk nilai={warga} onPilih={setWarga} />
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={form.jenis}
            onChange={(e) => setForm({ ...form, jenis: e.target.value as typeof form.jenis })}
            className={gayaInput}
          >
            {JENIS.map((j) => (
              <option key={j} value={j}>
                {LABEL_JENIS[j]}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Judul tagihan"
            value={form.judul}
            onChange={(e) => setForm({ ...form, judul: e.target.value })}
            className={`${gayaInput} sm:col-span-2`}
          />
          <input
            required
            type="number"
            placeholder="Tahun"
            value={form.tahun}
            onChange={(e) => setForm({ ...form, tahun: e.target.value })}
            className={gayaInput}
          />
          <input
            placeholder="Periode (mis. Triwulan I)"
            value={form.periode}
            onChange={(e) => setForm({ ...form, periode: e.target.value })}
            className={gayaInput}
          />
          <input
            required
            type="number"
            min="0"
            placeholder="Jumlah (Rp)"
            value={form.jumlah}
            onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
            className={gayaInput}
          />
          <div className="sm:col-span-3">
            <label className="mb-1 block text-xs text-slate-500">Jatuh tempo (opsional)</label>
            <input
              type="date"
              value={form.jatuhTempo}
              onChange={(e) => setForm({ ...form, jatuhTempo: e.target.value })}
              className={gayaInput}
            />
          </div>
        </div>
        <button type="submit" disabled={simpan.isPending} className="tombol-utama">
          {simpan.isPending ? 'Menyimpan…' : 'Terbitkan Tagihan'}
        </button>
      </form>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div className="kartu">
          <p className="text-xs text-slate-500">Tagihan belum dibayar</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{belumBayar.length}</p>
        </div>
        <div className="kartu">
          <p className="text-xs text-slate-500">Nilai belum tertagih</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatRupiah(totalBelum)}</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {[
          ['BELUM_BAYAR', 'Belum bayar'],
          ['LUNAS', 'Lunas'],
          ['DIBATALKAN', 'Dibatalkan'],
          ['', 'Semua'],
        ].map(([nilai, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setStatus(nilai)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              status === nilai
                ? 'bg-desa-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[42rem] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Warga</th>
              <th className="px-4 py-2.5 font-medium">Tagihan</th>
              <th className="px-4 py-2.5 text-right font-medium">Jumlah</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  Tidak ada tagihan pada filter ini.
                </td>
              </tr>
            )}
            {data?.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5 font-medium text-slate-800">{t.penduduk}</td>
                <td className="px-4 py-2.5">
                  <span className="text-slate-700">{t.judul}</span>
                  <span className="block text-xs text-slate-400">
                    {LABEL_JENIS[t.jenis]} · {t.tahun}
                    {t.periode && ` · ${t.periode}`}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-800">
                  {formatRupiah(t.jumlah)}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.status === 'LUNAS'
                        ? 'bg-desa-50 text-desa-800'
                        : t.status === 'BELUM_BAYAR'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {LABEL_STATUS_TAGIHAN[t.status]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {t.status === 'BELUM_BAYAR' && (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => ubahStatus.mutate({ id: t.id, status: 'LUNAS' })}
                        className="text-xs font-medium text-desa-700 hover:underline"
                      >
                        Tandai lunas
                      </button>
                      <button
                        type="button"
                        onClick={() => ubahStatus.mutate({ id: t.id, status: 'DIBATALKAN' })}
                        className="text-xs font-medium text-slate-500 hover:underline"
                      >
                        Batalkan
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
