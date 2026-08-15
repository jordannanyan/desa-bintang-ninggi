import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { KATEGORI_UMKM, LABEL_KATEGORI_UMKM, formatRupiah } from '@desa/shared';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface Toko {
  id: string;
  nama: string;
  kategori: keyof typeof LABEL_KATEGORI_UMKM;
  deskripsi: string | null;
  alamat: string | null;
  whatsapp: string;
  logoUrl: string | null;
  terverifikasi: boolean;
  jumlahProduk: number;
  rataRating: number | null;
  jumlahUlasan: number;
}

interface Produk {
  id: string;
  nama: string;
  harga: number;
  satuan: string;
  stok: number;
  fotoUrl: string | null;
  umkm: { id: string; nama: string; kategori: keyof typeof LABEL_KATEGORI_UMKM };
}

export function Umkm() {
  const { pengguna } = useAuth();
  const [kategori, setKategori] = useState('');
  const [cari, setCari] = useState('');
  const [tampilan, setTampilan] = useState<'produk' | 'toko'>('produk');

  const params = { kategori: kategori || undefined, q: cari || undefined };

  const { data: produk } = useQuery({
    queryKey: ['umkm-produk', kategori, cari],
    enabled: tampilan === 'produk',
    queryFn: async () => (await api.get('/umkm/produk', { params })).data.data as Produk[],
  });

  const { data: toko } = useQuery({
    queryKey: ['umkm-toko', kategori, cari],
    enabled: tampilan === 'toko',
    queryFn: async () => (await api.get('/umkm', { params })).data.data as Toko[],
  });

  const kosong =
    (tampilan === 'produk' && produk?.length === 0) || (tampilan === 'toko' && toko?.length === 0);

  return (
    <div className="kontainer py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="judul-halaman">UMKM Desa</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Produk warga Desa Bintang Ninggi I. Pembayaran langsung ke penjual lewat QRIS
            atau transfer — desa tidak memotong dan tidak menahan uang Anda.
          </p>
        </div>
        <Link
          to={pengguna ? '/warga/umkm' : '/masuk'}
          state={pengguna ? undefined : { dari: '/warga/umkm' }}
          className="tombol-utama text-sm"
        >
          Buka Toko Saya
        </Link>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
          {(['produk', 'toko'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTampilan(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                tampilan === t ? 'bg-desa-600 text-white' : 'text-slate-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setKategori('')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            kategori === ''
              ? 'bg-desa-600 text-white'
              : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semua
        </button>
        {KATEGORI_UMKM.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKategori(k)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              kategori === k
                ? 'bg-desa-600 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {LABEL_KATEGORI_UMKM[k]}
          </button>
        ))}

        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari…"
          className="ml-auto min-w-44 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500"
        />
      </div>

      {kosong && (
        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          {cari || kategori
            ? 'Tidak ada yang cocok dengan penyaringan ini.'
            : 'Belum ada UMKM yang terdaftar. Warga bisa membuka toko sendiri lewat tombol di atas.'}
        </div>
      )}

      {tampilan === 'produk' && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {produk?.map((p) => (
            <li key={p.id}>
              <Link
                to={`/umkm/${p.umkm.id}`}
                className="kartu block h-full transition hover:border-desa-300 hover:shadow-md"
              >
                {p.fotoUrl ? (
                  <img
                    src={p.fotoUrl}
                    alt=""
                    loading="lazy"
                    className="mb-3 aspect-square w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="mb-3 grid aspect-square w-full place-items-center rounded-lg bg-slate-100 text-xs text-slate-400">
                    tanpa foto
                  </div>
                )}
                <h2 className="font-medium leading-snug text-slate-900">{p.nama}</h2>
                <p className="mt-1 font-semibold text-desa-700">
                  {formatRupiah(p.harga)}
                  <span className="text-xs font-normal text-slate-400"> / {p.satuan}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">{p.umkm.nama}</p>
                {p.stok === 0 && (
                  <p className="mt-1 text-xs text-amber-700">stok habis</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {tampilan === 'toko' && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {toko?.map((t) => (
            <li key={t.id}>
              <Link
                to={`/umkm/${t.id}`}
                className="kartu flex h-full gap-3 transition hover:border-desa-300 hover:shadow-md"
              >
                {t.logoUrl ? (
                  <img src={t.logoUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-desa-50 text-lg font-semibold text-desa-700">
                    {t.nama.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="font-medium text-slate-900">{t.nama}</h2>
                    {t.terverifikasi && (
                      <span className="rounded bg-desa-50 px-1.5 py-0.5 text-xs text-desa-700">
                        terverifikasi
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {LABEL_KATEGORI_UMKM[t.kategori]} · {t.jumlahProduk} produk
                    {t.rataRating && ` · ★ ${t.rataRating} (${t.jumlahUlasan})`}
                  </p>
                  {t.deskripsi && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{t.deskripsi}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-xs text-slate-400">
        Tanda "terverifikasi" berarti perangkat desa sudah memastikan usaha itu benar ada.
      </p>
    </div>
  );
}
