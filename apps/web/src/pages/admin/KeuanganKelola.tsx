import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BIDANG_BELANJA,
  JENIS_ANGGARAN,
  LABEL_JENIS_ANGGARAN,
  SUMBER_DANA,
  formatRupiah,
} from '@desa/shared';
import { api, pesanError } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const gayaInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

const ITEM_KOSONG = {
  jenis: 'BELANJA' as (typeof JENIS_ANGGARAN)[number],
  bidang: '',
  uraian: '',
  sumberDana: 'Dana Desa',
  pagu: '',
  realisasi: '0',
};

export function KeuanganKelola() {
  const { pengguna } = useAuth();
  const queryClient = useQueryClient();
  const [tahun, setTahun] = useState<number | null>(null);
  const [form, setForm] = useState({ ...ITEM_KOSONG });
  const [sedangUbah, setSedangUbah] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const { data: daftarTahun } = useQuery({
    queryKey: ['keuangan-tahun'],
    queryFn: async () =>
      (await api.get('/keuangan/tahun')).data.data as Array<{
        id: string;
        tahun: number;
        versi: string;
        dikunci: boolean;
      }>,
  });

  useEffect(() => {
    if (!tahun && daftarTahun?.length) setTahun(daftarTahun[0].tahun);
  }, [daftarTahun, tahun]);

  const anggaranTerpilih = daftarTahun?.find((t) => t.tahun === tahun);

  const { data } = useQuery({
    queryKey: ['keuangan', tahun],
    enabled: Boolean(tahun),
    queryFn: async () => (await api.get(`/keuangan/${tahun}`)).data.data,
  });

  const segarkan = async () => {
    await queryClient.invalidateQueries({ queryKey: ['keuangan'] });
    await queryClient.invalidateQueries({ queryKey: ['keuangan-tahun'] });
  };

  const buatAnggaran = useMutation({
    mutationFn: (t: number) => api.post('/keuangan', { tahun: t, versi: 'MURNI' }),
    onSuccess: segarkan,
    onError: (e) => setGalat(pesanError(e, 'Gagal membuat anggaran.')),
  });

  const simpanItem = useMutation({
    mutationFn: () => {
      const muatan = {
        ...form,
        pagu: Number(form.pagu || 0),
        realisasi: Number(form.realisasi || 0),
      };
      return sedangUbah
        ? api.put(`/keuangan/item/${sedangUbah}`, muatan)
        : api.post(`/keuangan/${anggaranTerpilih!.id}/item`, muatan);
    },
    onSuccess: async () => {
      setForm({ ...ITEM_KOSONG });
      setSedangUbah(null);
      setGalat(null);
      await segarkan();
    },
    onError: (e) => setGalat(pesanError(e, 'Rincian gagal disimpan.')),
  });

  const hapusItem = useMutation({
    mutationFn: (id: string) => api.delete(`/keuangan/item/${id}`),
    onSuccess: segarkan,
    onError: (e) => setGalat(pesanError(e, 'Gagal menghapus.')),
  });

  const ubahKunci = useMutation({
    mutationFn: (dikunci: boolean) =>
      api.patch(`/keuangan/${anggaranTerpilih!.id}/kunci`, { dikunci }),
    onSuccess: segarkan,
    onError: (e) => setGalat(pesanError(e, 'Gagal mengubah status kunci.')),
  });

  const tahunIni = new Date().getFullYear();

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Keuangan Desa</h1>
      <p className="mb-5 text-sm text-slate-500">
        Rincian APBDes yang dimasukkan di sini langsung tampil di halaman Transparansi
        Keuangan.
      </p>

      {galat && (
        <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
          {galat}
        </div>
      )}

      <section className="kartu mb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tahun anggaran</label>
            <select
              value={tahun ?? ''}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {daftarTahun?.length === 0 && <option value="">belum ada</option>}
              {daftarTahun?.map((t) => (
                <option key={t.id} value={t.tahun}>
                  {t.tahun} — {t.versi}
                  {t.dikunci ? ' (terkunci)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            {!daftarTahun?.some((t) => t.tahun === tahunIni) && (
              <button
                type="button"
                onClick={() => buatAnggaran.mutate(tahunIni)}
                className="tombol-sekunder text-xs"
              >
                Buat anggaran {tahunIni}
              </button>
            )}
            {/* Mengunci hanya boleh admin: sekali dikunci, angka yang sudah
                dipublikasikan sebagai laporan resmi tidak bisa berubah diam-diam. */}
            {anggaranTerpilih && pengguna?.peran === 'ADMIN' && (
              <button
                type="button"
                onClick={() => ubahKunci.mutate(!anggaranTerpilih.dikunci)}
                className="tombol-sekunder text-xs"
              >
                {anggaranTerpilih.dikunci ? 'Buka kunci' : 'Kunci anggaran'}
              </button>
            )}
          </div>
        </div>

        {anggaranTerpilih?.dikunci && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Anggaran ini terkunci dan tidak bisa diubah. Buka kuncinya lebih dulu bila memang
            perlu diperbaiki.
          </p>
        )}
      </section>

      {anggaranTerpilih && !anggaranTerpilih.dikunci && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            simpanItem.mutate();
          }}
          className="kartu mb-4 space-y-4"
        >
          <h2 className="text-sm font-semibold text-slate-900">
            {sedangUbah ? 'Ubah Rincian' : 'Tambah Rincian'}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Jenis</label>
              <select
                value={form.jenis}
                onChange={(e) => setForm({ ...form, jenis: e.target.value as typeof form.jenis })}
                className={gayaInput}
              >
                {JENIS_ANGGARAN.map((j) => (
                  <option key={j} value={j}>
                    {LABEL_JENIS_ANGGARAN[j]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Bidang</label>
              <input
                required
                list="daftar-bidang"
                value={form.bidang}
                onChange={(e) => setForm({ ...form, bidang: e.target.value })}
                className={gayaInput}
              />
              <datalist id="daftar-bidang">
                {BIDANG_BELANJA.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Uraian</label>
              <input
                required
                value={form.uraian}
                onChange={(e) => setForm({ ...form, uraian: e.target.value })}
                placeholder="Contoh: Pembangunan jalan rabat beton RT 002"
                className={gayaInput}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Sumber dana</label>
              <input
                required
                list="daftar-sumber"
                value={form.sumberDana}
                onChange={(e) => setForm({ ...form, sumberDana: e.target.value })}
                className={gayaInput}
              />
              <datalist id="daftar-sumber">
                {SUMBER_DANA.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Pagu (Rp)</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.pagu}
                  onChange={(e) => setForm({ ...form, pagu: e.target.value })}
                  className={gayaInput}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Realisasi (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.realisasi}
                  onChange={(e) => setForm({ ...form, realisasi: e.target.value })}
                  className={gayaInput}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={simpanItem.isPending} className="tombol-utama">
              {simpanItem.isPending ? 'Menyimpan…' : sedangUbah ? 'Simpan Perubahan' : 'Tambah'}
            </button>
            {sedangUbah && (
              <button
                type="button"
                onClick={() => {
                  setSedangUbah(null);
                  setForm({ ...ITEM_KOSONG });
                }}
                className="tombol-sekunder"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      )}

      {data && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Rincian {data.tahun} ({data.item.length} baris)
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Jenis</th>
                  <th className="px-4 py-2.5 font-medium">Uraian</th>
                  <th className="px-4 py-2.5 text-right font-medium">Pagu</th>
                  <th className="px-4 py-2.5 text-right font-medium">Realisasi</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {data.item.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      Belum ada rincian.
                    </td>
                  </tr>
                )}
                {data.item.map(
                  (i: {
                    id: string;
                    jenis: string;
                    bidang: string;
                    uraian: string;
                    sumberDana: string;
                    pagu: number;
                    realisasi: number;
                  }) => (
                    <tr key={i.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 text-slate-600">
                        {LABEL_JENIS_ANGGARAN[i.jenis as keyof typeof LABEL_JENIS_ANGGARAN]}
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-slate-800">{i.uraian}</span>
                        <span className="block text-xs text-slate-400">
                          {i.bidang} · {i.sumberDana}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-800">
                        {formatRupiah(i.pagu)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-800">
                        {formatRupiah(i.realisasi)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-right">
                        {!anggaranTerpilih?.dikunci && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSedangUbah(i.id);
                                setForm({
                                  jenis: i.jenis as typeof form.jenis,
                                  bidang: i.bidang,
                                  uraian: i.uraian,
                                  sumberDana: i.sumberDana,
                                  pagu: String(i.pagu),
                                  realisasi: String(i.realisasi),
                                });
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="text-xs font-medium text-desa-700 hover:underline"
                            >
                              Ubah
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus rincian "${i.uraian}"?`)) hapusItem.mutate(i.id);
                              }}
                              className="ml-3 text-xs font-medium text-red-700 hover:underline"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
