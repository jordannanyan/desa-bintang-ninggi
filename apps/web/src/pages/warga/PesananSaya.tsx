import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LABEL_STATUS_PESANAN,
  PESAN_STATUS_PESANAN,
  formatRupiah,
  type StatusPesanan,
} from '@desa/shared';
import { api, pesanError } from '../../lib/api';
import { unggahBerkas } from '../../lib/unggah';

export const WARNA_PESANAN: Record<string, string> = {
  MENUNGGU_PEMBAYARAN: 'bg-amber-50 text-amber-800',
  MENUNGGU_VERIFIKASI: 'bg-sky-50 text-sky-800',
  DIBAYAR: 'bg-desa-50 text-desa-800',
  DIPROSES_PENJUAL: 'bg-sky-50 text-sky-800',
  SELESAI: 'bg-desa-50 text-desa-800',
  DITOLAK: 'bg-red-50 text-red-800',
  DIBATALKAN: 'bg-slate-100 text-slate-600',
};

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long' });

export function PesananSaya() {
  const { data, isLoading } = useQuery({
    queryKey: ['pesanan-saya'],
    queryFn: async () => (await api.get('/umkm/pesanan/saya')).data.data,
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pesanan Saya</h1>
          <p className="text-sm text-slate-500">Pembelian Anda di UMKM desa.</p>
        </div>
        <Link to="/umkm" className="tombol-utama text-xs">
          Belanja
        </Link>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}

      {data?.length === 0 && (
        <div className="kartu text-center text-sm text-slate-500">
          Belum ada pesanan.{' '}
          <Link to="/umkm" className="text-desa-600 hover:underline">
            Lihat produk UMKM desa
          </Link>
          .
        </div>
      )}

      <ul className="space-y-3">
        {data?.map(
          (p: {
            id: string;
            kodePesanan: string;
            total: number;
            status: StatusPesanan;
            umkm: { nama: string };
            dibuatPada: string;
          }) => (
            <li key={p.id} className="kartu">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/warga/pesanan/${p.id}`}
                    className="font-medium text-desa-700 hover:underline"
                  >
                    {p.umkm.nama}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {p.kodePesanan} · {tanggal(p.dibuatPada)}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{formatRupiah(p.total)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    WARNA_PESANAN[p.status] ?? 'bg-slate-100'
                  }`}
                >
                  {LABEL_STATUS_PESANAN[p.status]}
                </span>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

export function PesananDetail() {
  const { id } = useParams();
  const lokasi = useLocation();
  const queryClient = useQueryClient();
  const [berkas, setBerkas] = useState<File | null>(null);
  const [nominal, setNominal] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);
  const baru = (lokasi.state as { baru?: boolean } | null)?.baru;

  const { data, isLoading } = useQuery({
    queryKey: ['pesanan', id],
    queryFn: async () => (await api.get(`/umkm/pesanan/${id}`)).data.data,
  });

  const kirimBukti = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!berkas) return;
    setGalat(null);
    setSibuk(true);
    try {
      const [b] = await unggahBerkas([berkas], 'umkm');
      await api.post(`/umkm/pesanan/${id}/bukti`, {
        berkasId: b.id,
        nominal: nominal ? Number(nominal) : undefined,
        tanggalTransfer: new Date().toISOString(),
      });
      setBerkas(null);
      setNominal('');
      await queryClient.invalidateQueries({ queryKey: ['pesanan'] });
    } catch (err) {
      setGalat(
        err instanceof Error && !('response' in err)
          ? err.message
          : pesanError(err, 'Bukti gagal diunggah.'),
      );
    } finally {
      setSibuk(false);
    }
  };

  if (isLoading || !data) return <p className="text-sm text-slate-500">Memuat…</p>;

  const perluBayar = ['MENUNGGU_PEMBAYARAN', 'DITOLAK'].includes(data.status);

  return (
    <div className="max-w-2xl">
      <Link to="/warga/pesanan" className="text-sm text-desa-600 hover:underline">
        ← Semua pesanan
      </Link>

      {baru && (
        <div className="mt-3 rounded-lg border-l-4 border-desa-500 bg-desa-50 p-4 text-sm text-desa-900">
          <b>Pesanan dibuat.</b> Langkah berikutnya: bayar ke penjual, lalu unggah bukti
          bayarnya di bawah.
        </div>
      )}

      <div className="mb-4 mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{data.penjual.nama}</h1>
          <p className="text-sm text-slate-500">
            {data.kodePesanan} · {tanggal(data.dibuatPada)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            WARNA_PESANAN[data.status] ?? 'bg-slate-100'
          }`}
        >
          {LABEL_STATUS_PESANAN[data.status as StatusPesanan]}
        </span>
      </div>

      <p className="mb-4 rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
        {PESAN_STATUS_PESANAN[data.status as StatusPesanan]}
      </p>

      {data.alasanTolak && (
        <p className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">
          <b>Alasan penjual menolak:</b> {data.alasanTolak}
        </p>
      )}

      <section className="kartu mb-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Rincian</h2>
        <ul className="space-y-1 text-sm">
          {data.item.map((i: { id: string; namaProduk: string; jumlah: number; subtotal: number }) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span className="text-slate-700">
                {i.namaProduk} × {i.jumlah}
              </span>
              <span className="tabular-nums text-slate-900">{formatRupiah(i.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{formatRupiah(data.total)}</span>
        </div>
      </section>

      {perluBayar && (
        <section className="kartu mb-4">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Cara Membayar</h2>
          <p className="mb-4 text-xs text-slate-500">
            Bayar langsung ke penjual. Uangnya tidak melewati pemerintah desa.
          </p>

          {data.penjual.qrisUrl ? (
            <div className="text-center">
              <img
                src={data.penjual.qrisUrl}
                alt={`QRIS ${data.penjual.nama}`}
                className="mx-auto max-w-64 rounded-lg border border-slate-200"
              />
              <p className="mt-2 text-xs text-slate-500">
                Pindai dengan aplikasi bank atau e-wallet Anda
              </p>
            </div>
          ) : (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Penjual belum memasang QRIS.
            </p>
          )}

          {data.penjual.nomorRekening && (
            <dl className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
              <p className="text-xs text-slate-500">Atau transfer bank:</p>
              {[
                ['Bank', data.penjual.namaBank],
                ['Nomor rekening', data.penjual.nomorRekening],
                ['Atas nama', data.penjual.atasNama],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-3">
                  <dt className="w-32 shrink-0 text-slate-500">{l}</dt>
                  <dd className="font-medium text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          <form onSubmit={kirimBukti} className="mt-5 space-y-3 border-t border-slate-100 pt-4">
            <h3 className="text-sm font-medium text-slate-800">Unggah bukti bayar</h3>

            {galat && (
              <div className="rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
                {galat}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setBerkas(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-desa-600 file:px-4 file:py-2 file:text-sm file:text-white"
            />
            <div>
              <label className="mb-1 block text-xs text-slate-600">Nominal yang ditransfer</label>
              <input
                type="number"
                min="0"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                placeholder={String(data.total)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button type="submit" disabled={!berkas || sibuk} className="tombol-utama">
              {sibuk ? 'Mengunggah…' : 'Kirim Bukti Bayar'}
            </button>
          </form>
        </section>
      )}

      {data.bukti?.length > 0 && (
        <section className="kartu mb-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Bukti yang Sudah Dikirim</h2>
          <ul className="grid grid-cols-3 gap-2">
            {data.bukti.map((b: { id: string; url: string; diterima: boolean | null }) => (
              <li key={b.id}>
                <a href={b.url} target="_blank" rel="noreferrer">
                  <img src={b.url} alt="Bukti bayar" className="aspect-square w-full rounded-lg object-cover" />
                </a>
                <p className="mt-1 text-center text-xs text-slate-500">
                  {b.diterima === null ? 'menunggu' : b.diterima ? 'diterima' : 'ditolak'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="kartu">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Riwayat</h2>
        <ol className="space-y-2 text-sm">
          {data.riwayat?.map(
            (r: { id: string; status: StatusPesanan; catatan: string | null; dibuatPada: string }) => (
              <li key={r.id} className="flex gap-3">
                <span className="w-40 shrink-0 text-xs text-slate-400">
                  {new Date(r.dibuatPada).toLocaleString('id-ID')}
                </span>
                <span className="text-slate-700">
                  <b>{LABEL_STATUS_PESANAN[r.status]}</b>
                  {r.catatan && ` — ${r.catatan}`}
                </span>
              </li>
            ),
          )}
        </ol>
      </section>
    </div>
  );
}
