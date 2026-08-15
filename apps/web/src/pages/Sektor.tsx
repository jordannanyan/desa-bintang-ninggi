import { useQuery } from '@tanstack/react-query';
import {
  FASILITAS_SEKTOR,
  LABEL_FASILITAS,
  LABEL_SEKTOR,
  formatRupiah,
  type JenisFasilitas,
  type Sektor,
} from '@desa/shared';
import { api } from '../lib/api';

interface Informasi {
  id: string;
  kategori: string;
  judul: string;
  isi: string;
  gambarUrl: string | null;
  lampiranUrl: string | null;
  terbit: boolean;
}

interface Fasilitas {
  id: string;
  jenis: JenisFasilitas;
  nama: string;
  alamat: string | null;
  kontak: string | null;
  jamOperasional: string | null;
  keterangan: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface Harga {
  komoditas: string;
  satuan: string;
  harga: number;
  tanggal: string;
  sumber: string | null;
  hargaSebelumnya: number | null;
}

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long' });

/**
 * Satu halaman melayani enam section: BumDes, Pertanian, Peternakan,
 * Perikanan, Pendidikan, dan Kesehatan. Bentuk isinya memang sama —
 * informasi tertulis, fasilitas, dan harga komoditas — hanya sektornya
 * yang berbeda.
 */
function HalamanSektor({
  sektor,
  judul,
  keterangan,
  tampilkanHarga = false,
}: {
  sektor: Sektor;
  judul: string;
  keterangan: string;
  tampilkanHarga?: boolean;
}) {
  const { data: informasi, isLoading } = useQuery({
    queryKey: ['informasi', sektor],
    queryFn: async () =>
      (await api.get('/informasi', { params: { sektor } })).data.data as Informasi[],
  });

  const jenisFasilitas = FASILITAS_SEKTOR[sektor];
  const { data: fasilitas } = useQuery({
    queryKey: ['fasilitas', sektor],
    enabled: Boolean(jenisFasilitas?.length),
    queryFn: async () =>
      (await api.get('/fasilitas', { params: { jenis: jenisFasilitas!.join(',') } })).data
        .data as Fasilitas[],
  });

  const { data: harga } = useQuery({
    queryKey: ['harga', sektor],
    enabled: tampilkanHarga,
    queryFn: async () =>
      (await api.get('/harga-komoditas', { params: { sektor } })).data.data as Harga[],
  });

  // Informasi dikelompokkan per kategori agar halamannya terbaca sebagai
  // beberapa bagian, bukan satu tumpukan panjang.
  const perKategori = new Map<string, Informasi[]>();
  for (const i of informasi ?? []) {
    perKategori.set(i.kategori, [...(perKategori.get(i.kategori) ?? []), i]);
  }

  const kosong =
    !isLoading && !informasi?.length && !fasilitas?.length && !harga?.length;

  return (
    <div className="kontainer max-w-4xl py-10">
      <h1 className="judul-halaman">{judul}</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">{keterangan}</p>

      {isLoading && <p className="mt-6 text-sm text-slate-500">Memuat…</p>}

      {kosong && (
        <div className="mt-6 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Belum ada informasi {LABEL_SEKTOR[sektor]}. Perangkat desa dapat mengisinya lewat
          Dashboard Perangkat → Informasi Sektoral.
        </div>
      )}

      {tampilkanHarga && harga && harga.length > 0 && (
        <section className="kartu mt-6">
          <h2 className="text-sm font-semibold text-slate-900">Harga Komoditas</h2>
          <p className="mb-4 mt-0.5 text-xs text-slate-500">
            Dicatat perangkat desa. Angka di kanan menunjukkan perubahan dari pencatatan
            sebelumnya.
          </p>
          <ul className="divide-y divide-slate-100">
            {harga.map((h) => {
              const selisih = h.hargaSebelumnya === null ? null : h.harga - h.hargaSebelumnya;
              return (
                <li key={h.komoditas} className="flex items-baseline justify-between gap-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{h.komoditas}</p>
                    <p className="text-xs text-slate-400">
                      per {h.satuan} · {tanggal(h.tanggal)}
                      {h.sumber && ` · ${h.sumber}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold tabular-nums text-slate-900">
                      {formatRupiah(h.harga)}
                    </p>
                    {selisih !== null && selisih !== 0 && (
                      /* Warna saja tidak cukup: tanda naik-turun ditulis
                         eksplisit agar terbaca juga oleh yang sulit
                         membedakan warna. */
                      <p
                        className={`text-xs tabular-nums ${
                          selisih > 0 ? 'text-red-600' : 'text-desa-700'
                        }`}
                      >
                        {selisih > 0 ? '▲ naik' : '▼ turun'} {formatRupiah(Math.abs(selisih))}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {fasilitas && fasilitas.length > 0 && (
        <section className="kartu mt-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Fasilitas</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {fasilitas.map((f) => (
              <li key={f.id} className="rounded-lg border border-slate-200 p-3">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {LABEL_FASILITAS[f.jenis]}
                </span>
                <p className="mt-1.5 font-medium text-slate-900">{f.nama}</p>
                {f.alamat && <p className="text-xs text-slate-500">{f.alamat}</p>}
                {f.jamOperasional && (
                  <p className="mt-1 text-xs text-slate-600">Jam: {f.jamOperasional}</p>
                )}
                {f.kontak && (
                  <a href={`tel:${f.kontak}`} className="mt-1 block text-xs text-desa-700">
                    {f.kontak}
                  </a>
                )}
                {f.keterangan && <p className="mt-1 text-sm text-slate-600">{f.keterangan}</p>}
                {f.latitude && f.longitude && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${f.latitude}&mlon=${f.longitude}#map=17/${f.latitude}/${f.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs text-desa-700 hover:underline"
                  >
                    Buka di peta
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {[...perKategori.entries()].map(([kategori, daftar]) => (
        <section key={kategori} className="kartu mt-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">{kategori}</h2>
          <div className="space-y-5">
            {daftar.map((i) => (
              <article key={i.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-slate-900">{i.judul}</h3>
                  {!i.terbit && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                      draf
                    </span>
                  )}
                </div>
                {i.gambarUrl && (
                  <img
                    src={i.gambarUrl}
                    alt=""
                    loading="lazy"
                    className="mt-2 max-h-72 rounded-lg object-cover"
                  />
                )}
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {i.isi}
                </p>
                {i.lampiranUrl && (
                  <a
                    href={i.lampiranUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sm text-desa-600 hover:underline"
                  >
                    Unduh lampiran
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export const BumDes = () => (
  <HalamanSektor
    sektor="BUMDES"
    judul="BumDes"
    keterangan="Badan Usaha Milik Desa: profil, unit usaha, produk, dan laporannya."
  />
);

export const Pertanian = () => (
  <HalamanSektor
    sektor="PERTANIAN"
    judul="Pertanian"
    keterangan="Harga komoditas, jadwal tanam, pupuk, bantuan, dan penyuluhan."
    tampilkanHarga
  />
);

export const Peternakan = () => (
  <HalamanSektor
    sektor="PETERNAKAN"
    judul="Peternakan"
    keterangan="Vaksin ternak, informasi penyakit, bantuan bibit, dan penyuluhan."
    tampilkanHarga
  />
);

export const Perikanan = () => (
  <HalamanSektor
    sektor="PERIKANAN"
    judul="Perikanan"
    keterangan="Bibit ikan, harga jual, bantuan, dan pelatihan budidaya."
    tampilkanHarga
  />
);

export const Pendidikan = () => (
  <HalamanSektor
    sektor="PENDIDIKAN"
    judul="Pendidikan"
    keterangan="Fasilitas pendidikan di desa beserta program beasiswa dan kursus."
  />
);

export const Kesehatan = () => (
  <HalamanSektor
    sektor="KESEHATAN"
    judul="Kesehatan"
    keterangan="Posyandu, Pustu, ambulans, dan program kesehatan ibu dan anak."
  />
);
