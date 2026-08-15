import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  KATEGORI_UMKM,
  LABEL_KATEGORI_UMKM,
  LABEL_STATUS_PESANAN,
  formatRupiah,
  type StatusPesanan,
} from '@desa/shared';
import { api, pesanError } from '../../lib/api';
import { unggahBerkas } from '../../lib/unggah';
import { WARNA_PESANAN } from './PesananSaya';

const gayaInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

const TOKO_KOSONG = {
  nama: '',
  kategori: 'MAKANAN' as (typeof KATEGORI_UMKM)[number],
  deskripsi: '',
  alamat: '',
  whatsapp: '',
  namaBank: '',
  nomorRekening: '',
  atasNama: '',
};

const PRODUK_KOSONG = { nama: '', deskripsi: '', harga: '', satuan: 'pcs', stok: '0' };

export function TokoSaya() {
  const queryClient = useQueryClient();
  const [formToko, setFormToko] = useState({ ...TOKO_KOSONG });
  const [tokoDiubah, setTokoDiubah] = useState<string | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [qris, setQris] = useState<File | null>(null);

  const [produkUntuk, setProdukUntuk] = useState<string | null>(null);
  const [formProduk, setFormProduk] = useState({ ...PRODUK_KOSONG });
  const [fotoProduk, setFotoProduk] = useState<File | null>(null);

  const [alasanTolak, setAlasanTolak] = useState<Record<string, string>>({});
  const [galat, setGalat] = useState<string | null>(null);

  const { data: toko } = useQuery({
    queryKey: ['toko-saya'],
    queryFn: async () => (await api.get('/umkm/saya/toko')).data.data,
  });

  const { data: masuk } = useQuery({
    queryKey: ['pesanan-masuk'],
    queryFn: async () => (await api.get('/umkm/pesanan/masuk')).data.data,
  });

  const segarkan = async () => {
    await queryClient.invalidateQueries({ queryKey: ['toko-saya'] });
    await queryClient.invalidateQueries({ queryKey: ['pesanan-masuk'] });
    await queryClient.invalidateQueries({ queryKey: ['umkm'] });
  };

  const tanganiGalat = (e: unknown) =>
    setGalat(
      e instanceof Error && !('response' in e) ? e.message : pesanError(e, 'Gagal disimpan.'),
    );

  const simpanToko = useMutation({
    mutationFn: async () => {
      const logoId = logo ? (await unggahBerkas([logo], 'umkm'))[0].id : undefined;
      const qrisBerkasId = qris ? (await unggahBerkas([qris], 'umkm'))[0].id : undefined;
      const muatan = Object.fromEntries(
        Object.entries({ ...formToko, logoId, qrisBerkasId }).map(([k, v]) => [
          k,
          v === '' ? undefined : v,
        ]),
      );
      return tokoDiubah ? api.put(`/umkm/${tokoDiubah}`, muatan) : api.post('/umkm', muatan);
    },
    onSuccess: async () => {
      setFormToko({ ...TOKO_KOSONG });
      setTokoDiubah(null);
      setLogo(null);
      setQris(null);
      setGalat(null);
      await segarkan();
    },
    onError: tanganiGalat,
  });

  const simpanProduk = useMutation({
    mutationFn: async () => {
      const fotoId = fotoProduk ? (await unggahBerkas([fotoProduk], 'umkm'))[0].id : undefined;
      return api.post(`/umkm/${produkUntuk}/produk`, {
        ...formProduk,
        deskripsi: formProduk.deskripsi || undefined,
        harga: Number(formProduk.harga || 0),
        stok: Number(formProduk.stok || 0),
        fotoId,
      });
    },
    onSuccess: async () => {
      setFormProduk({ ...PRODUK_KOSONG });
      setFotoProduk(null);
      setGalat(null);
      await segarkan();
    },
    onError: tanganiGalat,
  });

  const verifikasi = useMutation({
    mutationFn: ({ id, diterima }: { id: string; diterima: boolean }) =>
      api.post(`/umkm/pesanan/${id}/verifikasi`, {
        diterima,
        alasanTolak: diterima ? undefined : alasanTolak[id],
      }),
    onSuccess: segarkan,
    onError: tanganiGalat,
  });

  const ubahStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusPesanan }) =>
      api.patch(`/umkm/pesanan/${id}/status`, { status }),
    onSuccess: segarkan,
    onError: tanganiGalat,
  });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">UMKM Saya</h1>
      <p className="mb-5 text-sm text-slate-500">
        Kelola toko, produk, dan pesanan yang masuk. Pembayaran langsung ke Anda —
        pemerintah desa tidak menerima maupun menahan uangnya.
      </p>

      {galat && (
        <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
          {galat}
        </div>
      )}

      {/* ── Pesanan masuk, ditaruh paling atas karena paling mendesak ── */}
      {masuk && masuk.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Pesanan Masuk ({masuk.length})
          </h2>
          <ul className="space-y-3">
            {masuk.map(
              (p: {
                id: string;
                kodePesanan: string;
                total: number;
                status: StatusPesanan;
                pembeli: string;
                item: Array<{ id: string; namaProduk: string; jumlah: number }>;
                bukti: Array<{ id: string; url: string; nominal: number | null }>;
              }) => (
                <li key={p.id} className="kartu">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{p.pembeli}</p>
                      <p className="text-xs text-slate-400">{p.kodePesanan}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {p.item.map((i) => `${i.namaProduk} ×${i.jumlah}`).join(', ')}
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

                  {p.status === 'MENUNGGU_VERIFIKASI' && (
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      {p.bukti.length > 0 && (
                        <div className="mb-3 flex gap-2">
                          {p.bukti.map((b) => (
                            <a key={b.id} href={b.url} target="_blank" rel="noreferrer">
                              <img
                                src={b.url}
                                alt="Bukti bayar"
                                className="h-24 w-24 rounded-lg object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="mb-2 text-xs text-slate-500">
                        Periksa nominal dan tanggalnya di rekening Anda sendiri sebelum
                        mengonfirmasi.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => verifikasi.mutate({ id: p.id, diterima: true })}
                          className="tombol-utama text-xs"
                        >
                          Pembayaran Diterima
                        </button>
                        <input
                          value={alasanTolak[p.id] ?? ''}
                          onChange={(e) =>
                            setAlasanTolak((a) => ({ ...a, [p.id]: e.target.value }))
                          }
                          placeholder="Alasan bila ditolak"
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => verifikasi.mutate({ id: p.id, diterima: false })}
                          disabled={!alasanTolak[p.id]}
                          className="tombol-sekunder border-red-300 text-xs text-red-700 disabled:opacity-40"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  )}

                  {p.status === 'DIBAYAR' && (
                    <button
                      type="button"
                      onClick={() => ubahStatus.mutate({ id: p.id, status: 'DIPROSES_PENJUAL' })}
                      className="tombol-utama mt-3 text-xs"
                    >
                      Mulai Siapkan Pesanan
                    </button>
                  )}
                  {p.status === 'DIPROSES_PENJUAL' && (
                    <button
                      type="button"
                      onClick={() => ubahStatus.mutate({ id: p.id, status: 'SELESAI' })}
                      className="tombol-utama mt-3 text-xs"
                    >
                      Tandai Selesai
                    </button>
                  )}
                </li>
              ),
            )}
          </ul>
        </section>
      )}

      {/* ── Toko ── */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Toko Saya</h2>

        {toko?.length === 0 && (
          <p className="mb-3 text-sm text-slate-500">
            Anda belum punya toko. Isi formulir di bawah untuk membukanya.
          </p>
        )}

        <ul className="mb-4 space-y-3">
          {toko?.map(
            (t: {
              id: string;
              nama: string;
              kategori: keyof typeof LABEL_KATEGORI_UMKM;
              terverifikasi: boolean;
              qrisUrl: string | null;
              _count: { produk: number; pesanan: number };
            }) => (
              <li key={t.id} className="kartu">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{t.nama}</p>
                    <p className="text-xs text-slate-400">
                      {LABEL_KATEGORI_UMKM[t.kategori]} · {t._count.produk} produk ·{' '}
                      {t._count.pesanan} pesanan
                      {t.terverifikasi ? ' · terverifikasi' : ' · belum diverifikasi desa'}
                    </p>
                    {!t.qrisUrl && (
                      <p className="mt-1 text-xs text-amber-700">
                        QRIS belum dipasang — pembeli tidak tahu harus bayar ke mana.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setProdukUntuk(produkUntuk === t.id ? null : t.id)}
                    className="tombol-sekunder text-xs"
                  >
                    Tambah produk
                  </button>
                </div>

                {produkUntuk === t.id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      simpanProduk.mutate();
                    }}
                    className="mt-4 space-y-3 border-t border-slate-100 pt-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        required
                        placeholder="Nama produk"
                        value={formProduk.nama}
                        onChange={(e) => setFormProduk({ ...formProduk, nama: e.target.value })}
                        className={gayaInput}
                      />
                      <input
                        required
                        type="number"
                        min="0"
                        placeholder="Harga"
                        value={formProduk.harga}
                        onChange={(e) => setFormProduk({ ...formProduk, harga: e.target.value })}
                        className={gayaInput}
                      />
                      <input
                        placeholder="Satuan (pcs, kg, ikat)"
                        value={formProduk.satuan}
                        onChange={(e) => setFormProduk({ ...formProduk, satuan: e.target.value })}
                        className={gayaInput}
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Stok (0 = tak dibatasi)"
                        value={formProduk.stok}
                        onChange={(e) => setFormProduk({ ...formProduk, stok: e.target.value })}
                        className={gayaInput}
                      />
                      <div className="sm:col-span-2">
                        <textarea
                          rows={2}
                          placeholder="Deskripsi"
                          value={formProduk.deskripsi}
                          onChange={(e) =>
                            setFormProduk({ ...formProduk, deskripsi: e.target.value })
                          }
                          className={gayaInput}
                        />
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFotoProduk(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-desa-600 file:px-3 file:py-1.5 file:text-xs file:text-white"
                    />
                    <button type="submit" disabled={simpanProduk.isPending} className="tombol-utama text-xs">
                      {simpanProduk.isPending ? 'Menyimpan…' : 'Simpan Produk'}
                    </button>
                  </form>
                )}
              </li>
            ),
          )}
        </ul>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            simpanToko.mutate();
          }}
          className="kartu space-y-4"
        >
          <h3 className="text-sm font-semibold text-slate-900">
            {tokoDiubah ? 'Ubah Toko' : 'Buka Toko Baru'}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              placeholder="Nama toko"
              value={formToko.nama}
              onChange={(e) => setFormToko({ ...formToko, nama: e.target.value })}
              className={gayaInput}
            />
            <select
              value={formToko.kategori}
              onChange={(e) =>
                setFormToko({ ...formToko, kategori: e.target.value as typeof formToko.kategori })
              }
              className={gayaInput}
            >
              {KATEGORI_UMKM.map((k) => (
                <option key={k} value={k}>
                  {LABEL_KATEGORI_UMKM[k]}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Nomor WhatsApp (08…)"
              value={formToko.whatsapp}
              onChange={(e) => setFormToko({ ...formToko, whatsapp: e.target.value })}
              className={gayaInput}
            />
            <input
              placeholder="Alamat usaha"
              value={formToko.alamat}
              onChange={(e) => setFormToko({ ...formToko, alamat: e.target.value })}
              className={gayaInput}
            />
            <div className="sm:col-span-2">
              <textarea
                rows={2}
                placeholder="Deskripsi usaha"
                value={formToko.deskripsi}
                onChange={(e) => setFormToko({ ...formToko, deskripsi: e.target.value })}
                className={gayaInput}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-1 text-sm font-medium text-slate-800">Cara pembeli membayar</p>
            <p className="mb-3 text-xs text-slate-500">
              Pasang gambar QRIS Anda. Tanpa ini pembeli tidak tahu harus membayar ke mana.
            </p>
            <label className="mb-1 block text-xs text-slate-600">Gambar QRIS</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setQris(e.target.files?.[0] ?? null)}
              className="mb-3 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-desa-600 file:px-3 file:py-1.5 file:text-xs file:text-white"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                placeholder="Nama bank"
                value={formToko.namaBank}
                onChange={(e) => setFormToko({ ...formToko, namaBank: e.target.value })}
                className={gayaInput}
              />
              <input
                placeholder="Nomor rekening"
                value={formToko.nomorRekening}
                onChange={(e) => setFormToko({ ...formToko, nomorRekening: e.target.value })}
                className={gayaInput}
              />
              <input
                placeholder="Atas nama"
                value={formToko.atasNama}
                onChange={(e) => setFormToko({ ...formToko, atasNama: e.target.value })}
                className={gayaInput}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-600">Logo toko</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-desa-600 file:px-3 file:py-1.5 file:text-xs file:text-white"
            />
          </div>

          <button type="submit" disabled={simpanToko.isPending} className="tombol-utama">
            {simpanToko.isPending ? 'Menyimpan…' : tokoDiubah ? 'Simpan Perubahan' : 'Buka Toko'}
          </button>
        </form>
      </section>
    </div>
  );
}
