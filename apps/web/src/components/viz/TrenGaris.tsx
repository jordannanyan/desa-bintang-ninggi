import { useState } from 'react';
import { KATEGORI, TINTA, formatAngka } from './tokens';

export interface SeriTren {
  label: string;
  nilai: number[];
}

interface Props {
  judul: string;
  keterangan?: string;
  /** Label sumbu-X, satu per titik. */
  sumbu: string[];
  seri: SeriTren[];
}

const TINGGI = 150;
const PAD_ATAS = 12;
const PAD_BAWAH = 24;

/**
 * Tren beberapa seri sepanjang waktu.
 *
 * Satu sumbu nilai untuk semua seri — tidak pernah dua skala pada satu grafik,
 * karena dua sumbu membuat perpotongan garis tampak bermakna padahal hanya
 * akibat penskalaan.
 *
 * Crosshair mengikuti kursor dan menampilkan seluruh seri pada bulan itu
 * sekaligus: yang ingin dibandingkan perangkat desa adalah "bulan ini berapa",
 * bukan satu titik terpisah.
 */
export function TrenGaris({ judul, keterangan, sumbu, seri }: Props) {
  const [aktif, setAktif] = useState<number | null>(null);

  const n = sumbu.length;
  const maksimum = Math.max(...seri.flatMap((s) => s.nilai), 1);

  // Koordinat dalam ruang 0–100 pada sumbu X supaya SVG ikut melebar
  // mengikuti kartu; sumbu Y memakai piksel agar tebal garis tidak ikut
  // teregang saat lebar berubah.
  const x = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => PAD_ATAS + (1 - v / maksimum) * (TINGGI - PAD_ATAS - PAD_BAWAH);

  const kosong = seri.every((s) => s.nilai.every((v) => v === 0));

  return (
    <section className="kartu">
      <h3 className="text-sm font-semibold" style={{ color: TINTA.utama }}>
        {judul}
      </h3>
      {keterangan && (
        <p className="mt-0.5 text-xs" style={{ color: TINTA.redup }}>
          {keterangan}
        </p>
      )}

      {/* Legenda selalu ada untuk ≥ 2 seri: identitas tidak boleh hanya
          mengandalkan warna. */}
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {seri.map((s, i) => (
          <li key={s.label} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden
              className="h-0.5 w-4 shrink-0 rounded-full"
              style={{ background: KATEGORI[i % KATEGORI.length] }}
            />
            <span style={{ color: TINTA.sekunder }}>{s.label}</span>
            {aktif !== null && (
              <span className="tabular-nums font-medium" style={{ color: TINTA.utama }}>
                {formatAngka(s.nilai[aktif] ?? 0)}
              </span>
            )}
          </li>
        ))}
      </ul>

      {kosong ? (
        <p className="mt-6 text-sm" style={{ color: TINTA.redup }}>
          Belum ada data pada enam bulan terakhir.
        </p>
      ) : (
        <div
          className="relative mt-3"
          onMouseLeave={() => setAktif(null)}
          onBlur={() => setAktif(null)}
        >
          <svg
            viewBox={`0 0 100 ${TINGGI}`}
            preserveAspectRatio="none"
            className="h-[150px] w-full overflow-visible"
            role="img"
            aria-label={judul}
          >
            {/* Garis dasar saja — kisi penuh menambah tinta yang bukan data. */}
            <line x1="0" x2="100" y1={y(0)} y2={y(0)} stroke={TINTA.jalur} strokeWidth="1" />

            {aktif !== null && (
              <line
                x1={x(aktif)}
                x2={x(aktif)}
                y1={PAD_ATAS - 6}
                y2={y(0)}
                stroke={TINTA.redup}
                strokeWidth="0.4"
              />
            )}

            {seri.map((s, si) => (
              <polyline
                key={s.label}
                points={s.nilai.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
                fill="none"
                stroke={KATEGORI[si % KATEGORI.length]}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {/* Bidang tangkap: selebar satu kolom, jauh lebih besar daripada
                titiknya sendiri agar mudah dikenai di layar sentuh. */}
            {sumbu.map((_, i) => (
              <rect
                key={i}
                x={n <= 1 ? 0 : x(i) - 50 / (n - 1)}
                y={0}
                width={n <= 1 ? 100 : 100 / (n - 1)}
                height={TINGGI}
                fill="transparent"
                onMouseEnter={() => setAktif(i)}
                onFocus={() => setAktif(i)}
                tabIndex={0}
              />
            ))}
          </svg>

          {/* Titik data digambar sebagai elemen HTML, bukan <circle> di dalam
              SVG. SVG-nya diregangkan mengikuti lebar kartu
              (preserveAspectRatio="none") — dan peregangan itu memipihkan
              lingkaran menjadi lonjong. Elemen HTML tidak ikut teregang. */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {seri.map((s, si) =>
              s.nilai.map((v, i) => {
                const d = aktif === i ? 9 : 7;
                return (
                  <span
                    key={`${s.label}-${i}`}
                    className="absolute rounded-full transition-all duration-150"
                    style={{
                      left: `${x(i)}%`,
                      top: y(v),
                      width: d,
                      height: d,
                      marginLeft: -d / 2,
                      marginTop: -d / 2,
                      background: KATEGORI[si % KATEGORI.length],
                      // Cincin permukaan memisahkan titik yang bertumpuk tanpa
                      // menambah warna baru.
                      boxShadow: `0 0 0 2px ${TINTA.permukaan}`,
                    }}
                  />
                );
              }),
            )}
          </div>

          <div className="mt-1 flex justify-between">
            {sumbu.map((s, i) => (
              <span
                key={s + i}
                className="text-[11px]"
                style={{ color: aktif === i ? TINTA.utama : TINTA.redup }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * Batang kemajuan untuk satu besaran terhadap targetnya (mis. realisasi
 * terhadap pagu). Satu hue: yang menyandi besaran adalah panjangnya.
 */
export function BatangKemajuan({
  label,
  nilai,
  target,
  format = formatAngka,
  warna,
}: {
  label: string;
  nilai: number;
  target: number;
  format?: (n: number) => string;
  warna?: string;
}) {
  const persen = target > 0 ? Math.min((nilai / target) * 100, 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs" style={{ color: TINTA.sekunder }}>
          {label}
        </span>
        <span className="text-xs tabular-nums" style={{ color: TINTA.redup }}>
          {persen.toFixed(1)}%
        </span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-sm" style={{ background: TINTA.jalur }}>
        <div
          className="h-full transition-[width] duration-500"
          style={{
            width: `${Math.max(persen, nilai > 0 ? 1.5 : 0)}%`,
            background: warna ?? KATEGORI[0],
            borderRadius: '0 4px 4px 0',
          }}
        />
      </div>
      <p className="mt-1 text-xs tabular-nums" style={{ color: TINTA.sekunder }}>
        {format(nilai)} <span style={{ color: TINTA.redup }}>dari {format(target)}</span>
      </p>
    </div>
  );
}
