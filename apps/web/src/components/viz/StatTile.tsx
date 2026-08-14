import { KATEGORI, TINTA, formatAngka } from './tokens';

interface StatProps {
  label: string;
  nilai: number;
  keterangan?: string;
}

/** Satu angka penting. Bukan grafik batang satu batang. */
export function StatTile({ label, nilai, keterangan }: StatProps) {
  return (
    <div className="kartu">
      <p className="text-xs" style={{ color: TINTA.sekunder }}>
        {label}
      </p>
      {/* Angka besar memakai figure proporsional bawaan, bukan tabular-nums —
          tabular membuat angka pendek terlihat renggang pada ukuran display. */}
      <p className="mt-1 text-2xl font-semibold" style={{ color: TINTA.utama }}>
        {formatAngka(nilai)}
      </p>
      {keterangan && (
        <p className="mt-0.5 text-xs" style={{ color: TINTA.redup }}>
          {keterangan}
        </p>
      )}
    </div>
  );
}

/** Angka utama yang dipimpin halaman ini. Tepat satu per tampilan. */
export function AngkaUtama({ label, nilai, keterangan }: StatProps) {
  return (
    // Kartu ini setinggi dua kartu di sebelahnya, jadi isinya dipusatkan
    // secara vertikal agar tidak menyisakan ruang kosong di bawah.
    <div className="kartu flex h-full flex-col justify-center">
      <p className="text-xs" style={{ color: TINTA.sekunder }}>
        {label}
      </p>
      <p className="mt-1 text-5xl font-bold leading-none" style={{ color: TINTA.utama }}>
        {formatAngka(nilai)}
      </p>
      {keterangan && (
        <p className="mt-2 text-xs" style={{ color: TINTA.redup }}>
          {keterangan}
        </p>
      )}
    </div>
  );
}

/**
 * Perbandingan dua bagian terhadap keseluruhan, dalam satu batang bertumpuk.
 *
 * Dua seri berarti legenda wajib ada — identitas tidak boleh hanya
 * mengandalkan warna. Kedua segmen dipisah celah 2px berwarna permukaan,
 * bukan garis tepi.
 */
export function BatangProporsi({
  judul,
  bagian,
}: {
  judul: string;
  bagian: Array<{ label: string; jumlah: number }>;
}) {
  const total = bagian.reduce((n, b) => n + b.jumlah, 0) || 1;

  return (
    <div className="kartu">
      <h3 className="text-sm font-semibold" style={{ color: TINTA.utama }}>
        {judul}
      </h3>

      <div className="mt-3 flex h-6 w-full overflow-hidden rounded-sm" style={{ gap: 2 }}>
        {bagian.map((b, i) => (
          <div
            key={b.label}
            style={{
              width: `${(b.jumlah / total) * 100}%`,
              background: KATEGORI[i % KATEGORI.length],
              borderRadius: i === 0 ? '4px 0 0 4px' : '0 4px 4px 0',
            }}
          />
        ))}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
        {bagian.map((b, i) => (
          <li key={b.label} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: KATEGORI[i % KATEGORI.length] }}
            />
            <span style={{ color: TINTA.sekunder }}>{b.label}</span>
            <span className="tabular-nums" style={{ color: TINTA.utama }}>
              {formatAngka(b.jumlah)}
            </span>
            <span className="tabular-nums" style={{ color: TINTA.redup }}>
              {((b.jumlah / total) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
