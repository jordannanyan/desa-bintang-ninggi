import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatRupiah, formatRupiahRingkas } from '@desa/shared';
import { api, pesanError } from '../../lib/api';

const gayaInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

function Galat({ pesan }: { pesan: string | null }) {
  if (!pesan) return null;
  return (
    <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
      {pesan}
    </div>
  );
}

// ─────────────────────────────────────────────
// STATISTIK REAL-TIME
// ─────────────────────────────────────────────

export function StatistikDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['statistik-dashboard'],
    // Angka ini berubah sepanjang hari, jadi disegarkan berkala tanpa
    // perangkat desa perlu memuat ulang halaman.
    refetchInterval: 60_000,
    queryFn: async () => (await api.get('/statistik')).data.data,
  });

  if (isLoading) return <p className="text-sm text-slate-500">Memuat…</p>;

  const perluTindakan = [
    { label: 'Surat menunggu persetujuan', nilai: data.suratMenunggu, ke: '/admin/surat/persetujuan' },
    { label: 'Pengaduan belum ditangani', nilai: data.pengaduanBaru, ke: '/admin/pengaduan' },
    { label: 'Tagihan belum dibayar', nilai: data.tagihanBelum, ke: '/admin/tagihan' },
  ];

  const ringkasan = [
    { label: 'Penduduk aktif', nilai: data.penduduk },
    { label: 'Kartu Keluarga', nilai: data.kk },
    { label: 'Surat terbit tahun ini', nilai: data.suratTerbitTahunIni },
    { label: 'Pengaduan selesai', nilai: data.pengaduanSelesai },
    { label: 'UMKM aktif', nilai: data.umkm },
    { label: 'Proyek berjalan', nilai: data.proyekBerjalan },
    { label: 'Berita terbit', nilai: data.berita },
    { label: 'Dokumen tersimpan', nilai: data.dokumen },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Statistik Real-time</h1>
      <p className="mb-5 text-sm text-slate-500">
        Diperbarui otomatis setiap menit.
      </p>

      {/* Yang menuntut tindakan ditaruh paling atas dan bisa langsung diklik:
          angka yang hanya dipandangi tidak mengubah apa pun. */}
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Perlu Ditindaklanjuti</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {perluTindakan.map((s) => (
          <Link
            key={s.label}
            to={s.ke}
            className={`kartu transition hover:border-desa-300 hover:shadow-md ${
              s.nilai > 0 ? 'border-l-4 border-l-amber-400' : ''
            }`}
          >
            <p className="text-xs text-slate-500">{s.label}</p>
            <p
              className={`mt-1 text-3xl font-bold ${
                s.nilai > 0 ? 'text-amber-700' : 'text-slate-300'
              }`}
            >
              {s.nilai}
            </p>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Ringkasan Desa</h2>
      <div className="grid gap-4 sm:grid-cols-4">
        {ringkasan.map((s) => (
          <div key={s.label} className="kartu">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {s.nilai.toLocaleString('id-ID')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ABSENSI PERANGKAT
// ─────────────────────────────────────────────

const STATUS_HADIR = ['HADIR', 'IZIN', 'SAKIT', 'DINAS_LUAR', 'ALPA'] as const;
const LABEL_HADIR: Record<string, string> = {
  HADIR: 'Hadir',
  IZIN: 'Izin',
  SAKIT: 'Sakit',
  DINAS_LUAR: 'Dinas luar',
  ALPA: 'Alpa',
};

export function AbsensiKelola() {
  const queryClient = useQueryClient();
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({
    perangkatId: '',
    tanggal: new Date().toISOString().slice(0, 10),
    status: 'HADIR' as (typeof STATUS_HADIR)[number],
    jamMasuk: '',
    jamPulang: '',
  });
  const [galat, setGalat] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['absensi', bulan],
    queryFn: async () => (await api.get('/absensi', { params: { bulan } })).data.data,
  });

  const simpan = useMutation({
    mutationFn: () =>
      api.post('/absensi', {
        ...form,
        jamMasuk: form.jamMasuk || undefined,
        jamPulang: form.jamPulang || undefined,
      }),
    onSuccess: async () => {
      setGalat(null);
      await queryClient.invalidateQueries({ queryKey: ['absensi'] });
    },
    onError: (e) => setGalat(pesanError(e, 'Absensi gagal dicatat.')),
  });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Absensi Perangkat</h1>
      <p className="mb-5 text-sm text-slate-500">
        Satu catatan per orang per hari. Mencatat ulang di tanggal yang sama akan
        memperbaiki, bukan menambah baris kembar.
      </p>

      <Galat pesan={galat} />

      {data?.perangkat.length === 0 && (
        <div className="mb-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Belum ada perangkat desa yang terdaftar. Tambahkan lebih dulu lewat Profil Desa.
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          simpan.mutate();
        }}
        className="kartu mb-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">Catat Kehadiran</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            required
            value={form.perangkatId}
            onChange={(e) => setForm({ ...form, perangkatId: e.target.value })}
            className={gayaInput}
          >
            <option value="">— pilih perangkat —</option>
            {data?.perangkat.map((p: { id: string; nama: string; jabatan: string }) => (
              <option key={p.id} value={p.id}>
                {p.nama} — {p.jabatan}
              </option>
            ))}
          </select>
          <input
            required
            type="date"
            value={form.tanggal}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            className={gayaInput}
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
            className={gayaInput}
          >
            {STATUS_HADIR.map((s) => (
              <option key={s} value={s}>
                {LABEL_HADIR[s]}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={form.jamMasuk}
            onChange={(e) => setForm({ ...form, jamMasuk: e.target.value })}
            className={gayaInput}
          />
          <input
            type="time"
            value={form.jamPulang}
            onChange={(e) => setForm({ ...form, jamPulang: e.target.value })}
            className={gayaInput}
          />
        </div>
        <button type="submit" disabled={simpan.isPending} className="tombol-utama">
          {simpan.isPending ? 'Menyimpan…' : 'Catat'}
        </button>
      </form>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Rekap Bulanan</h2>
        <input
          type="month"
          value={bulan}
          onChange={(e) => setBulan(e.target.value)}
          className="ml-auto rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[36rem] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Perangkat</th>
              {['Hadir', 'Izin', 'Sakit', 'Dinas', 'Alpa'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-center font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.perangkat.map(
              (p: {
                id: string;
                nama: string;
                jabatan: string;
                hadir: number;
                izin: number;
                sakit: number;
                dinasLuar: number;
                alpa: number;
              }) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-slate-800">{p.nama}</span>
                    <span className="block text-xs text-slate-400">{p.jabatan}</span>
                  </td>
                  {[p.hadir, p.izin, p.sakit, p.dinasLuar, p.alpa].map((n, i) => (
                    <td
                      key={i}
                      className={`px-3 py-2.5 text-center tabular-nums ${
                        i === 4 && n > 0 ? 'font-semibold text-red-600' : 'text-slate-600'
                      }`}
                    >
                      {n || '—'}
                    </td>
                  ))}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// INVENTARIS ASET
// ─────────────────────────────────────────────

const KONDISI = ['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT'] as const;
const LABEL_KONDISI: Record<string, string> = {
  BAIK: 'Baik',
  RUSAK_RINGAN: 'Rusak ringan',
  RUSAK_BERAT: 'Rusak berat',
};

export function AsetKelola() {
  const queryClient = useQueryClient();
  const [galat, setGalat] = useState<string | null>(null);
  const [form, setForm] = useState({
    nama: '',
    kategori: '',
    kodeInventaris: '',
    tahunPerolehan: String(new Date().getFullYear()),
    nilai: '',
    jumlah: '1',
    satuan: 'unit',
    kondisi: 'BAIK' as (typeof KONDISI)[number],
    lokasi: '',
    sumberDana: '',
  });

  const { data } = useQuery({
    queryKey: ['aset'],
    queryFn: async () => (await api.get('/aset')).data,
  });

  const simpan = useMutation({
    mutationFn: () =>
      api.post(
        '/aset',
        Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? undefined : v])),
      ),
    onSuccess: async () => {
      setForm({ ...form, nama: '', kodeInventaris: '', nilai: '' });
      setGalat(null);
      await queryClient.invalidateQueries({ queryKey: ['aset'] });
    },
    onError: (e) => setGalat(pesanError(e, 'Aset gagal disimpan.')),
  });

  const hapus = useMutation({
    mutationFn: (id: string) => api.delete(`/aset/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aset'] }),
  });

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Inventaris Aset</h1>
      <p className="mb-5 text-sm text-slate-500">Barang milik desa beserta kondisinya.</p>

      {data?.meta && (
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <div className="kartu">
            <p className="text-xs text-slate-500">Total nilai</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {formatRupiahRingkas(data.meta.totalNilai)}
            </p>
          </div>
          <div className="kartu">
            <p className="text-xs text-slate-500">Jenis barang</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{data.meta.jumlahJenis}</p>
          </div>
          <div className="kartu">
            <p className="text-xs text-slate-500">Perlu perbaikan</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                data.meta.rusak > 0 ? 'text-amber-700' : 'text-slate-300'
              }`}
            >
              {data.meta.rusak}
            </p>
          </div>
        </div>
      )}

      <Galat pesan={galat} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          simpan.mutate();
        }}
        className="kartu mb-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">Tambah Aset</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            required
            placeholder="Nama barang"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            className={gayaInput}
          />
          <input
            required
            placeholder="Kategori"
            value={form.kategori}
            onChange={(e) => setForm({ ...form, kategori: e.target.value })}
            className={gayaInput}
          />
          <input
            placeholder="Kode inventaris"
            value={form.kodeInventaris}
            onChange={(e) => setForm({ ...form, kodeInventaris: e.target.value })}
            className={gayaInput}
          />
          <input
            required
            type="number"
            placeholder="Tahun perolehan"
            value={form.tahunPerolehan}
            onChange={(e) => setForm({ ...form, tahunPerolehan: e.target.value })}
            className={gayaInput}
          />
          <input
            required
            type="number"
            min="0"
            placeholder="Nilai satuan (Rp)"
            value={form.nilai}
            onChange={(e) => setForm({ ...form, nilai: e.target.value })}
            className={gayaInput}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="1"
              value={form.jumlah}
              onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
              className={gayaInput}
            />
            <input
              placeholder="satuan"
              value={form.satuan}
              onChange={(e) => setForm({ ...form, satuan: e.target.value })}
              className={gayaInput}
            />
          </div>
          <select
            value={form.kondisi}
            onChange={(e) => setForm({ ...form, kondisi: e.target.value as typeof form.kondisi })}
            className={gayaInput}
          >
            {KONDISI.map((k) => (
              <option key={k} value={k}>
                {LABEL_KONDISI[k]}
              </option>
            ))}
          </select>
          <input
            placeholder="Lokasi"
            value={form.lokasi}
            onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
            className={gayaInput}
          />
          <input
            placeholder="Sumber dana"
            value={form.sumberDana}
            onChange={(e) => setForm({ ...form, sumberDana: e.target.value })}
            className={gayaInput}
          />
        </div>
        <button type="submit" disabled={simpan.isPending} className="tombol-utama">
          {simpan.isPending ? 'Menyimpan…' : 'Tambah Aset'}
        </button>
      </form>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        Daftar Aset ({data?.data?.length ?? 0})
      </h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[42rem] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Barang</th>
              <th className="px-4 py-2.5 font-medium">Tahun</th>
              <th className="px-4 py-2.5 font-medium">Jumlah</th>
              <th className="px-4 py-2.5 text-right font-medium">Nilai</th>
              <th className="px-4 py-2.5 font-medium">Kondisi</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {data?.data?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Belum ada aset tercatat.
                </td>
              </tr>
            )}
            {data?.data?.map(
              (a: {
                id: string;
                nama: string;
                kategori: string;
                lokasi: string | null;
                tahunPerolehan: number;
                jumlah: number;
                satuan: string;
                nilai: number;
                kondisi: string;
              }) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-slate-800">{a.nama}</span>
                    <span className="block text-xs text-slate-400">
                      {a.kategori}
                      {a.lokasi && ` · ${a.lokasi}`}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">{a.tahunPerolehan}</td>
                  <td className="px-4 py-2.5 tabular-nums text-slate-600">
                    {a.jumlah} {a.satuan}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-800">
                    {formatRupiah(a.nilai * a.jumlah)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        a.kondisi === 'BAIK'
                          ? 'bg-desa-50 text-desa-800'
                          : a.kondisi === 'RUSAK_RINGAN'
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {LABEL_KONDISI[a.kondisi]}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => confirm(`Hapus "${a.nama}"?`) && hapus.mutate(a.id)}
                      className="text-xs font-medium text-red-700 hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
