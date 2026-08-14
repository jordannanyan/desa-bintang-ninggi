import { useState } from 'react';
import { HUE_TUNGGAL, TINTA, formatAngka } from './tokens';

export interface BarisData {
  label: string;
  jumlah: number;
}

interface Props {
  judul: string;
  keterangan?: string;
  data: BarisData[];
  /** Tampilkan sebagai tabel, bukan grafik. */
  sebagaiTabel?: boolean;
  satuan?: string;
  /**
   * Setel true bila `data` hanya sebagian dari keseluruhan (mis. 15 teratas).
   * Baris total lalu menyebut cakupannya, supaya angkanya tidak terbaca
   * sebagai jumlah seluruh penduduk.
   */
  sebagian?: boolean;
}

/**
 * Batang horizontal untuk membandingkan besaran antar kategori.
 *
 * Satu seri, satu hue: yang menyandi besaran adalah panjang batang, bukan
 * warna. Karena hanya ada satu warna, tidak ada kotak legenda — judulnya
 * sudah menyebutkan apa yang digambarkan.
 *
 * Nilai ditulis di ujung batang (direct label) supaya tidak perlu garis
 * kisi maupun sumbu — keduanya menambah tinta yang bukan data.
 */
export function BarKategori({
  judul,
  keterangan,
  data,
  sebagaiTabel = false,
  satuan = 'orang',
  sebagian = false,
}: Props) {
  const [disorot, setDisorot] = useState<string | null>(null);

  const maksimum = Math.max(...data.map((d) => d.jumlah), 1);
  const total = data.reduce((n, d) => n + d.jumlah, 0);

  if (sebagaiTabel) {
    return (
      <section className="kartu">
        <h3 className="text-sm font-semibold text-slate-900">{judul}</h3>
        {keterangan && <p className="mt-0.5 text-xs text-slate-500">{keterangan}</p>}
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="py-1.5 font-medium">Kategori</th>
              <th className="py-1.5 text-right font-medium">Jumlah</th>
              <th className="py-1.5 text-right font-medium">Persen</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5 text-slate-700">{d.label}</td>
                <td className="py-1.5 text-right tabular-nums text-slate-900">
                  {formatAngka(d.jumlah)}
                </td>
                <td className="py-1.5 text-right tabular-nums text-slate-500">
                  {total ? ((d.jumlah / total) * 100).toFixed(1) : '0,0'}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  }

  return (
    <section className="kartu">
      <h3 className="text-sm font-semibold text-slate-900">{judul}</h3>
      {keterangan && <p className="mt-0.5 text-xs text-slate-500">{keterangan}</p>}

      <ul className="mt-4 space-y-2.5">
        {data.map((d) => {
          const persen = total ? (d.jumlah / total) * 100 : 0;
          const lebar = (d.jumlah / maksimum) * 100;

          return (
            <li
              key={d.label}
              className="grid grid-cols-[11rem_1fr] items-center gap-3"
              onMouseEnter={() => setDisorot(d.label)}
              onMouseLeave={() => setDisorot(null)}
              onFocus={() => setDisorot(d.label)}
              onBlur={() => setDisorot(null)}
              tabIndex={0}
            >
              <span
                className="truncate text-xs"
                style={{ color: TINTA.sekunder }}
                title={d.label}
              >
                {d.label}
              </span>

              <div className="flex items-center gap-2">
                {/* Jalur latar memberi acuan panjang tanpa perlu garis kisi. */}
                <div
                  className="relative h-5 flex-1 overflow-hidden rounded-sm"
                  style={{ background: TINTA.jalur }}
                >
                  <div
                    className="h-full transition-[width] duration-500"
                    style={{
                      width: `${Math.max(lebar, d.jumlah > 0 ? 1.5 : 0)}%`,
                      background: HUE_TUNGGAL,
                      // Persegi di garis dasar, membulat di ujung data.
                      borderRadius: '0 4px 4px 0',
                      opacity: disorot && disorot !== d.label ? 0.45 : 1,
                    }}
                  />
                </div>

                <span
                  className="w-20 shrink-0 text-right text-xs tabular-nums"
                  style={{ color: TINTA.utama }}
                >
                  {formatAngka(d.jumlah)}
                </span>
                {/* Persentase muncul saat baris disorot, supaya angka utama
                    tidak berdesakan dengan angka pendukung. */}
                <span
                  className="w-12 shrink-0 text-right text-xs tabular-nums"
                  style={{ color: TINTA.redup }}
                >
                  {disorot === d.label ? `${persen.toFixed(1)}%` : ''}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-xs" style={{ color: TINTA.redup }}>
        {sebagian
          ? `${formatAngka(total)} ${satuan} pada kategori di atas`
          : `Total ${formatAngka(total)} ${satuan}`}
      </p>
    </section>
  );
}
