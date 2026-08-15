import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LABEL_JENIS_ANGGARAN, formatRupiah, formatRupiahRingkas } from '@desa/shared';
import { api } from '../lib/api';
import { HUE_TUNGGAL, KATEGORI, TINTA } from '../components/viz/tokens';

interface Total {
  pagu: number;
  realisasi: number;
}

interface Kelompok {
  label: string;
  pagu: number;
  realisasi: number;
}

interface DataKeuangan {
  tahun: number;
  versi: string;
  dikunci: boolean;
  pendapatan: Total;
  belanja: Total;
  pembiayaan: Total;
  perBidangBelanja: Kelompok[];
  perSumberDana: Kelompok[];
  item: Array<{
    id: string;
    jenis: string;
    bidang: string;
    uraian: string;
    sumberDana: string;
    pagu: number;
    realisasi: number;
  }>;
}

const persen = (bagian: number, dari: number) => (dari > 0 ? (bagian / dari) * 100 : 0);

/**
 * Batang pagu dengan realisasi bertumpuk di dalamnya.
 *
 * Dua angka yang dibandingkan di sini punya hubungan bagian-terhadap-keseluruhan
 * (realisasi selalu bagian dari pagu), jadi keduanya digambar pada satu batang,
 * bukan dua batang berdampingan yang menyesatkan seolah setara.
 */
function BatangSerapan({ data, total }: { data: Kelompok[]; total: number }) {
  const maksimum = Math.max(...data.map((d) => d.pagu), 1);

  return (
    <ul className="space-y-3">
      {data.map((d) => {
        const lebarPagu = (d.pagu / maksimum) * 100;
        const serapan = persen(d.realisasi, d.pagu);

        return (
          <li key={d.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-xs" style={{ color: TINTA.sekunder }}>
                {d.label}
              </span>
              <span className="shrink-0 text-xs tabular-nums" style={{ color: TINTA.utama }}>
                {formatRupiahRingkas(d.pagu)}
                <span style={{ color: TINTA.redup }}> · {serapan.toFixed(0)}% terserap</span>
              </span>
            </div>

            <div
              className="relative h-5 w-full overflow-hidden rounded-sm"
              style={{ background: TINTA.jalur }}
            >
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${Math.max(lebarPagu, 1)}%`,
                  background: '#dcf0e3',
                  borderRadius: '0 4px 4px 0',
                }}
              />
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${Math.max((d.realisasi / maksimum) * 100, d.realisasi > 0 ? 1 : 0)}%`,
                  background: HUE_TUNGGAL,
                  borderRadius: '0 4px 4px 0',
                }}
              />
            </div>
          </li>
        );
      })}

      <li className="border-t border-slate-100 pt-2 text-xs" style={{ color: TINTA.redup }}>
        Total {formatRupiah(total)}
      </li>
    </ul>
  );
}

export function Keuangan() {
  const [tahun, setTahun] = useState<number | null>(null);
  const [rinci, setRinci] = useState(false);

  const { data: daftarTahun } = useQuery({
    queryKey: ['keuangan-tahun'],
    queryFn: async () =>
      (await api.get('/keuangan/tahun')).data.data as Array<{
        tahun: number;
        versi: string;
        dikunci: boolean;
      }>,
  });

  useEffect(() => {
    if (!tahun && daftarTahun?.length) setTahun(daftarTahun[0].tahun);
  }, [daftarTahun, tahun]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['keuangan', tahun],
    enabled: Boolean(tahun),
    queryFn: async () => (await api.get(`/keuangan/${tahun}`)).data.data as DataKeuangan,
  });

  if (!daftarTahun?.length) {
    return (
      <div className="kontainer py-10">
        <h1 className="judul-halaman">Transparansi Keuangan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Rincian dan serapan anggaran desa, terbuka untuk siapa saja.
        </p>
        <div className="mt-8 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Data APBDes belum diisi. Perangkat desa dapat memasukkannya lewat Dashboard
          Perangkat → Keuangan.
        </div>
      </div>
    );
  }

  const surplus = data ? data.pendapatan.pagu - data.belanja.pagu : 0;

  return (
    <div className="kontainer py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="judul-halaman">Transparansi Keuangan</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Rincian APBDes beserta serapannya. Batang muda menunjukkan pagu yang
            dianggarkan, batang tua menunjukkan yang sudah terealisasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="tahun" className="text-sm text-slate-600">
            Tahun
          </label>
          <select
            id="tahun"
            value={tahun ?? ''}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {[...new Set(daftarTahun.map((t) => t.tahun))].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}

      {isError && (
        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Anggaran tahun {tahun} belum diisi.
        </div>
      )}

      {data && (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Pendapatan', nilai: data.pendapatan, warna: KATEGORI[0] },
              { label: 'Belanja', nilai: data.belanja, warna: KATEGORI[1] },
            ].map((k) => (
              <div key={k.label} className="kartu">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: k.warna }}
                  />
                  <p className="text-xs" style={{ color: TINTA.sekunder }}>
                    {k.label}
                  </p>
                </div>
                <p className="mt-1 text-2xl font-semibold" style={{ color: TINTA.utama }}>
                  {formatRupiahRingkas(k.nilai.pagu)}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: TINTA.redup }}>
                  Terealisasi {formatRupiahRingkas(k.nilai.realisasi)} (
                  {persen(k.nilai.realisasi, k.nilai.pagu).toFixed(0)}%)
                </p>
              </div>
            ))}

            <div className="kartu">
              <p className="text-xs" style={{ color: TINTA.sekunder }}>
                {surplus >= 0 ? 'Surplus' : 'Defisit'}
              </p>
              <p className="mt-1 text-2xl font-semibold" style={{ color: TINTA.utama }}>
                {formatRupiahRingkas(Math.abs(surplus))}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: TINTA.redup }}>
                Pendapatan dikurangi belanja
              </p>
            </div>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-2">
            <section className="kartu">
              <h2 className="text-sm font-semibold text-slate-900">Belanja per Bidang</h2>
              <p className="mb-4 mt-0.5 text-xs text-slate-500">
                Pengelompokan menurut Permendagri 20/2018
              </p>
              {data.perBidangBelanja.length ? (
                <BatangSerapan data={data.perBidangBelanja} total={data.belanja.pagu} />
              ) : (
                <p className="text-sm text-slate-400">Belum ada rincian belanja.</p>
              )}
            </section>

            <section className="kartu">
              <h2 className="text-sm font-semibold text-slate-900">Pendapatan per Sumber</h2>
              <p className="mb-4 mt-0.5 text-xs text-slate-500">
                Dari mana anggaran desa berasal
              </p>
              {data.perSumberDana.length ? (
                <BatangSerapan data={data.perSumberDana} total={data.pendapatan.pagu} />
              ) : (
                <p className="text-sm text-slate-400">Belum ada rincian pendapatan.</p>
              )}
            </section>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setRinci((v) => !v)}
              className="tombol-sekunder text-sm"
              aria-expanded={rinci}
            >
              {rinci ? 'Sembunyikan rincian' : `Lihat rincian lengkap (${data.item.length} baris)`}
            </button>
          </div>

          {rinci && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[46rem] text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Jenis</th>
                    <th className="px-4 py-2.5 font-medium">Bidang</th>
                    <th className="px-4 py-2.5 font-medium">Uraian</th>
                    <th className="px-4 py-2.5 font-medium">Sumber</th>
                    <th className="px-4 py-2.5 text-right font-medium">Pagu</th>
                    <th className="px-4 py-2.5 text-right font-medium">Realisasi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.item.map((i) => (
                    <tr key={i.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2 text-slate-600">
                        {LABEL_JENIS_ANGGARAN[i.jenis as keyof typeof LABEL_JENIS_ANGGARAN] ??
                          i.jenis}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{i.bidang}</td>
                      <td className="px-4 py-2 text-slate-800">{i.uraian}</td>
                      <td className="px-4 py-2 text-slate-600">{i.sumberDana}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-800">
                        {formatRupiah(i.pagu)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-slate-800">
                        {formatRupiah(i.realisasi)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-8 text-xs text-slate-400">
            APBDes {data.tahun} versi {data.versi}
            {data.dikunci && ' · sudah dikunci sebagai laporan resmi'}
          </p>
        </>
      )}
    </div>
  );
}
