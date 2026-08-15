import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LABEL_KATEGORI_UMKM, formatRupiah } from '@desa/shared';
import { api, pesanError } from '../lib/api';
import { useAuth } from '../lib/auth';

interface Produk {
  id: string;
  nama: string;
  deskripsi: string | null;
  harga: number;
  satuan: string;
  stok: number;
  fotoUrl: string | null;
}

export function UmkmToko() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pengguna } = useAuth();
  const [keranjang, setKeranjang] = useState<Record<string, number>>({});
  const [catatan, setCatatan] = useState('');
  const [alamatKirim, setAlamatKirim] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['umkm', id],
    queryFn: async () => (await api.get(`/umkm/${id}`)).data.data,
  });

  const ubahJumlah = (produkId: string, delta: number, stok: number) =>
    setKeranjang((k) => {
      const kini = (k[produkId] ?? 0) + delta;
      if (kini <= 0) {
        const { [produkId]: _, ...sisa } = k;
        return sisa;
      }
      // Stok 0 diperlakukan sebagai "tidak dibatasi", sesuai cara penjual
      // kecil biasanya mencatat: mereka jarang memperbarui angka stok.
      if (stok > 0 && kini > stok) return k;
      return { ...k, [produkId]: kini };
    });

  const isiKeranjang = (data?.produk ?? []).filter((p: Produk) => keranjang[p.id]);
  const total = isiKeranjang.reduce(
    (t: number, p: Produk) => t + p.harga * (keranjang[p.id] ?? 0),
    0,
  );

  const pesan = async () => {
    setGalat(null);
    setSibuk(true);
    try {
      const res = await api.post('/umkm/pesanan', {
        umkmId: id,
        item: isiKeranjang.map((p: Produk) => ({ produkId: p.id, jumlah: keranjang[p.id] })),
        catatan: catatan || undefined,
        alamatKirim: alamatKirim || undefined,
      });
      navigate(`/warga/pesanan/${res.data.data.id}`, { state: { baru: true } });
    } catch (err) {
      setGalat(pesanError(err, 'Pesanan gagal dibuat.'));
    } finally {
      setSibuk(false);
    }
  };

  if (isLoading) {
    return <div className="kontainer py-16 text-center text-sm text-slate-500">Memuat…</div>;
  }

  if (isError || !data) {
    return (
      <div className="kontainer py-16">
        <h1 className="judul-halaman mb-2">Toko tidak ditemukan</h1>
        <Link to="/umkm" className="text-sm text-desa-600 hover:underline">
          Kembali ke UMKM Desa
        </Link>
      </div>
    );
  }

  const waPenjual = `https://wa.me/${data.whatsapp.replace(/^0/, '62').replace(/\D/g, '')}`;

  return (
    <div className="kontainer max-w-4xl py-10">
      <Link to="/umkm" className="text-sm text-desa-600 hover:underline">
        ← Semua UMKM
      </Link>

      <header className="mt-3 flex flex-wrap gap-4">
        {data.logoUrl ? (
          <img src={data.logoUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-xl bg-desa-50 text-2xl font-bold text-desa-700">
            {data.nama.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="judul-halaman">{data.nama}</h1>
            {data.terverifikasi && (
              <span className="rounded bg-desa-50 px-2 py-0.5 text-xs font-medium text-desa-700">
                terverifikasi desa
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {LABEL_KATEGORI_UMKM[data.kategori as keyof typeof LABEL_KATEGORI_UMKM]}
            {data.alamat && ` · ${data.alamat}`}
          </p>
          {data.deskripsi && <p className="mt-2 text-sm text-slate-700">{data.deskripsi}</p>}
          <a
            href={waPenjual}
            target="_blank"
            rel="noreferrer"
            className="tombol-sekunder mt-3 inline-block text-xs"
          >
            Hubungi penjual lewat WhatsApp
          </a>
        </div>
      </header>

      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Produk
      </h2>

      {data.produk.length === 0 && (
        <p className="text-sm text-slate-500">Toko ini belum menampilkan produk.</p>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {data.produk.map((p: Produk) => (
          <li key={p.id} className="kartu flex gap-3">
            {p.fotoUrl ? (
              <img src={p.fotoUrl} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs text-slate-400">
                —
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-slate-900">{p.nama}</h3>
              {p.deskripsi && <p className="text-xs text-slate-500">{p.deskripsi}</p>}
              <p className="mt-1 font-semibold text-desa-700">
                {formatRupiah(p.harga)}
                <span className="text-xs font-normal text-slate-400"> / {p.satuan}</span>
              </p>
              {p.stok > 0 && <p className="text-xs text-slate-400">stok {p.stok}</p>}

              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => ubahJumlah(p.id, -1, p.stok)}
                  className="h-7 w-7 rounded-md border border-slate-300 text-slate-600"
                  aria-label={`Kurangi ${p.nama}`}
                >
                  −
                </button>
                <span className="w-6 text-center text-sm tabular-nums">
                  {keranjang[p.id] ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => ubahJumlah(p.id, 1, p.stok)}
                  className="h-7 w-7 rounded-md border border-slate-300 text-slate-600"
                  aria-label={`Tambah ${p.nama}`}
                >
                  +
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {isiKeranjang.length > 0 && (
        <section className="kartu mt-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Keranjang</h2>

          {galat && (
            <div className="mb-3 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
              {galat}
            </div>
          )}

          <ul className="space-y-1 text-sm">
            {isiKeranjang.map((p: Produk) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span className="text-slate-700">
                  {p.nama} × {keranjang[p.id]}
                </span>
                <span className="tabular-nums text-slate-900">
                  {formatRupiah(p.harga * keranjang[p.id])}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatRupiah(total)}</span>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Alamat pengiriman
              </label>
              <input
                value={alamatKirim}
                onChange={(e) => setAlamatKirim(e.target.value)}
                placeholder="Kosongkan bila diambil sendiri"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Catatan untuk penjual
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Dikatakan apa adanya sebelum pembeli menekan tombol: uangnya
              tidak lewat desa, dan penjual yang memeriksa buktinya. */}
          <p className="mt-3 rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
            Setelah memesan, Anda akan diberi QRIS milik penjual. Bayar langsung ke penjual,
            lalu unggah bukti bayarnya. Penjual yang memeriksa dan mengonfirmasi — pemerintah
            desa tidak menerima ataupun menahan uang Anda.
          </p>

          {pengguna ? (
            <button type="button" onClick={pesan} disabled={sibuk} className="tombol-utama mt-4">
              {sibuk ? 'Memproses…' : 'Buat Pesanan'}
            </button>
          ) : (
            <Link
              to="/masuk"
              state={{ dari: `/umkm/${id}` }}
              className="tombol-utama mt-4 inline-block"
            >
              Masuk dulu untuk memesan
            </Link>
          )}
        </section>
      )}

      {data.ulasan.length > 0 && (
        <section className="kartu mt-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Ulasan Pembeli</h2>
          <ul className="space-y-3">
            {data.ulasan.map(
              (u: { id: string; rating: number; komentar: string | null; penulis: string }) => (
                <li key={u.id} className="border-l-2 border-desa-200 pl-3">
                  <p className="text-xs text-slate-400">
                    {'★'.repeat(u.rating)}
                    {'☆'.repeat(5 - u.rating)} · {u.penulis}
                  </p>
                  {u.komentar && <p className="mt-0.5 text-sm text-slate-700">{u.komentar}</p>}
                </li>
              ),
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
