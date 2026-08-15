import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  JENIS_FASILITAS,
  JENIS_LOWONGAN,
  KATEGORI_SEKTOR,
  LABEL_FASILITAS,
  LABEL_LOWONGAN,
  LABEL_SEKTOR,
  SEKTOR,
  formatRupiah,
  type Sektor,
} from '@desa/shared';
import { api, pesanError } from '../../lib/api';
import { unggahBerkas } from '../../lib/unggah';

const gayaInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

function useGalat() {
  const [galat, setGalat] = useState<string | null>(null);
  const tangani = (e: unknown) =>
    setGalat(
      e instanceof Error && !('response' in e) ? e.message : pesanError(e, 'Gagal disimpan.'),
    );
  return { galat, setGalat, tangani };
}

function Galat({ pesan }: { pesan: string | null }) {
  if (!pesan) return null;
  return (
    <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
      {pesan}
    </div>
  );
}

// ─────────────────────────────────────────────
// INFORMASI SEKTORAL
// ─────────────────────────────────────────────

const INFO_KOSONG = {
  sektor: 'PERTANIAN' as Sektor,
  kategori: '',
  judul: '',
  isi: '',
  urutan: '0',
  terbit: true,
};

export function InformasiKelola() {
  const queryClient = useQueryClient();
  const { galat, setGalat, tangani } = useGalat();
  const [form, setForm] = useState({ ...INFO_KOSONG });
  const [ubah, setUbah] = useState<string | null>(null);
  const [gambar, setGambar] = useState<File | null>(null);
  const [saring, setSaring] = useState<Sektor | ''>('');

  const { data } = useQuery({
    queryKey: ['informasi-admin', saring],
    queryFn: async () =>
      (await api.get('/informasi', { params: { sektor: saring || undefined } })).data.data,
  });

  const segarkan = () => queryClient.invalidateQueries({ queryKey: ['informasi'] });

  const simpan = useMutation({
    mutationFn: async () => {
      const gambarId = gambar ? (await unggahBerkas([gambar], 'dokumen'))[0].id : undefined;
      const muatan = { ...form, urutan: Number(form.urutan || 0), gambarId };
      return ubah ? api.put(`/informasi/${ubah}`, muatan) : api.post('/informasi', muatan);
    },
    onSuccess: async () => {
      setForm({ ...INFO_KOSONG });
      setUbah(null);
      setGambar(null);
      setGalat(null);
      await segarkan();
      await queryClient.invalidateQueries({ queryKey: ['informasi-admin'] });
    },
    onError: tangani,
  });

  const hapus = useMutation({
    mutationFn: (id: string) => api.delete(`/informasi/${id}`),
    onSuccess: async () => {
      await segarkan();
      await queryClient.invalidateQueries({ queryKey: ['informasi-admin'] });
    },
  });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Informasi Sektoral</h1>
      <p className="mb-5 text-sm text-slate-500">
        Satu tempat untuk mengisi halaman BumDes, Pertanian, Peternakan, Perikanan,
        Pendidikan, dan Kesehatan. Yang membedakan hanya pilihan sektornya.
      </p>

      <Galat pesan={galat} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          simpan.mutate();
        }}
        className="kartu mb-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">
          {ubah ? 'Ubah Informasi' : 'Tambah Informasi'}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Sektor</label>
            <select
              value={form.sektor}
              onChange={(e) => setForm({ ...form, sektor: e.target.value as Sektor, kategori: '' })}
              className={gayaInput}
            >
              {SEKTOR.map((s) => (
                <option key={s} value={s}>
                  {LABEL_SEKTOR[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
            {/* Daftar saran, bukan pilihan tertutup: tiap desa punya istilah
                sendiri dan tidak perlu menunggu rilis baru. */}
            <input
              required
              list="saran-kategori"
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              className={gayaInput}
            />
            <datalist id="saran-kategori">
              {KATEGORI_SEKTOR[form.sektor].map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Judul</label>
            <input
              required
              minLength={5}
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Isi</label>
            <textarea
              required
              minLength={10}
              rows={6}
              value={form.isi}
              onChange={(e) => setForm({ ...form, isi: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Urutan tampil</label>
            <input
              type="number"
              min="0"
              value={form.urutan}
              onChange={(e) => setForm({ ...form, urutan: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Gambar</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setGambar(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-desa-600 file:px-3 file:py-1.5 file:text-xs file:text-white"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.terbit}
            onChange={(e) => setForm({ ...form, terbit: e.target.checked })}
            className="rounded"
          />
          Tampilkan ke publik
        </label>

        <div className="flex gap-2">
          <button type="submit" disabled={simpan.isPending} className="tombol-utama">
            {simpan.isPending ? 'Menyimpan…' : ubah ? 'Simpan Perubahan' : 'Tambah'}
          </button>
          {ubah && (
            <button
              type="button"
              onClick={() => {
                setUbah(null);
                setForm({ ...INFO_KOSONG });
              }}
              className="tombol-sekunder"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Daftar ({data?.length ?? 0})</h2>
        <select
          value={saring}
          onChange={(e) => setSaring(e.target.value as Sektor | '')}
          className="ml-auto rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
        >
          <option value="">Semua sektor</option>
          {SEKTOR.map((s) => (
            <option key={s} value={s}>
              {LABEL_SEKTOR[s]}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-2">
        {data?.map(
          (i: {
            id: string;
            sektor: Sektor;
            kategori: string;
            judul: string;
            isi: string;
            urutan: number;
            terbit: boolean;
          }) => (
            <li key={i.id} className="kartu flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-desa-50 px-2 py-0.5 text-xs text-desa-700">
                    {LABEL_SEKTOR[i.sektor]}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {i.kategori}
                  </span>
                  {!i.terbit && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      draf
                    </span>
                  )}
                </div>
                <p className="mt-1 font-medium text-slate-900">{i.judul}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUbah(i.id);
                    setForm({
                      sektor: i.sektor,
                      kategori: i.kategori,
                      judul: i.judul,
                      isi: i.isi,
                      urutan: String(i.urutan),
                      terbit: i.terbit,
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="tombol-sekunder text-xs"
                >
                  Ubah
                </button>
                <button
                  type="button"
                  onClick={() => confirm(`Hapus "${i.judul}"?`) && hapus.mutate(i.id)}
                  className="tombol-sekunder border-red-300 text-xs text-red-700"
                >
                  Hapus
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────
// FASILITAS DESA
// ─────────────────────────────────────────────

const FASILITAS_KOSONG = {
  jenis: 'POSYANDU' as (typeof JENIS_FASILITAS)[number],
  nama: '',
  alamat: '',
  latitude: '',
  longitude: '',
  kontak: '',
  jamOperasional: '',
  keterangan: '',
};

export function FasilitasKelola() {
  const queryClient = useQueryClient();
  const { galat, setGalat, tangani } = useGalat();
  const [form, setForm] = useState({ ...FASILITAS_KOSONG });

  const { data } = useQuery({
    queryKey: ['fasilitas'],
    queryFn: async () => (await api.get('/fasilitas')).data.data,
  });

  const simpan = useMutation({
    mutationFn: () => {
      const muatan = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v === '' ? undefined : v]),
      );
      return api.post('/fasilitas', muatan);
    },
    onSuccess: async () => {
      setForm({ ...FASILITAS_KOSONG });
      setGalat(null);
      await queryClient.invalidateQueries({ queryKey: ['fasilitas'] });
      await queryClient.invalidateQueries({ queryKey: ['peta'] });
    },
    onError: tangani,
  });

  const hapus = useMutation({
    mutationFn: (id: string) => api.delete(`/fasilitas/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fasilitas'] }),
  });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Fasilitas Desa</h1>
      <p className="mb-5 text-sm text-slate-500">
        PAUD, SD, Posyandu, Pustu, dan fasilitas lain. Yang punya koordinat otomatis muncul
        di Peta Desa Interaktif.
      </p>

      <Galat pesan={galat} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          simpan.mutate();
        }}
        className="kartu mb-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">Tambah Fasilitas</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <select
            value={form.jenis}
            onChange={(e) => setForm({ ...form, jenis: e.target.value as typeof form.jenis })}
            className={gayaInput}
          >
            {JENIS_FASILITAS.map((j) => (
              <option key={j} value={j}>
                {LABEL_FASILITAS[j]}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Nama fasilitas"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            className={gayaInput}
          />
          <input
            placeholder="Alamat"
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
            className={gayaInput}
          />
          <input
            placeholder="Kontak"
            value={form.kontak}
            onChange={(e) => setForm({ ...form, kontak: e.target.value })}
            className={gayaInput}
          />
          <input
            placeholder="Jam operasional"
            value={form.jamOperasional}
            onChange={(e) => setForm({ ...form, jamOperasional: e.target.value })}
            className={gayaInput}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Lintang"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              className={gayaInput}
            />
            <input
              placeholder="Bujur"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              className={gayaInput}
            />
          </div>
          <div className="sm:col-span-2">
            <textarea
              rows={2}
              placeholder="Keterangan"
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              className={gayaInput}
            />
          </div>
        </div>

        <button type="submit" disabled={simpan.isPending} className="tombol-utama">
          {simpan.isPending ? 'Menyimpan…' : 'Tambah Fasilitas'}
        </button>
      </form>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Daftar ({data?.length ?? 0})</h2>
      <ul className="space-y-2">
        {data?.map(
          (f: {
            id: string;
            jenis: keyof typeof LABEL_FASILITAS;
            nama: string;
            alamat: string | null;
            latitude: number | null;
          }) => (
            <li key={f.id} className="kartu flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {LABEL_FASILITAS[f.jenis]}
                </span>
                <p className="mt-1 font-medium text-slate-900">{f.nama}</p>
                <p className="text-xs text-slate-400">
                  {f.alamat ?? '—'}
                  {f.latitude ? ' · ada koordinat' : ' · tanpa koordinat, tidak muncul di peta'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => confirm(`Hapus "${f.nama}"?`) && hapus.mutate(f.id)}
                className="tombol-sekunder border-red-300 text-xs text-red-700"
              >
                Hapus
              </button>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────
// HARGA KOMODITAS
// ─────────────────────────────────────────────

export function HargaKelola() {
  const queryClient = useQueryClient();
  const { galat, setGalat, tangani } = useGalat();
  const [form, setForm] = useState({
    sektor: 'PERTANIAN' as Sektor,
    komoditas: '',
    satuan: 'kg',
    harga: '',
    tanggal: new Date().toISOString().slice(0, 10),
    sumber: '',
  });

  const { data } = useQuery({
    queryKey: ['harga-admin'],
    queryFn: async () => (await api.get('/harga-komoditas')).data.data,
  });

  const simpan = useMutation({
    mutationFn: () =>
      api.post('/harga-komoditas', {
        ...form,
        harga: Number(form.harga || 0),
        sumber: form.sumber || undefined,
      }),
    onSuccess: async () => {
      setForm({ ...form, komoditas: '', harga: '' });
      setGalat(null);
      await queryClient.invalidateQueries({ queryKey: ['harga'] });
      await queryClient.invalidateQueries({ queryKey: ['harga-admin'] });
    },
    onError: tangani,
  });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Harga Komoditas</h1>
      <p className="mb-5 text-sm text-slate-500">
        Dicatat per tanggal. Mencatat ulang komoditas yang sama di tanggal yang sama akan
        memperbaiki angkanya, bukan menambah baris kembar.
      </p>

      <Galat pesan={galat} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          simpan.mutate();
        }}
        className="kartu mb-6 space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <select
            value={form.sektor}
            onChange={(e) => setForm({ ...form, sektor: e.target.value as Sektor })}
            className={gayaInput}
          >
            {(['PERTANIAN', 'PETERNAKAN', 'PERIKANAN'] as const).map((s) => (
              <option key={s} value={s}>
                {LABEL_SEKTOR[s]}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Komoditas (mis. Gabah)"
            value={form.komoditas}
            onChange={(e) => setForm({ ...form, komoditas: e.target.value })}
            className={gayaInput}
          />
          <input
            required
            placeholder="Satuan (kg, ekor)"
            value={form.satuan}
            onChange={(e) => setForm({ ...form, satuan: e.target.value })}
            className={gayaInput}
          />
          <input
            required
            type="number"
            min="0"
            placeholder="Harga"
            value={form.harga}
            onChange={(e) => setForm({ ...form, harga: e.target.value })}
            className={gayaInput}
          />
          <input
            required
            type="date"
            value={form.tanggal}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            className={gayaInput}
          />
          <input
            placeholder="Sumber"
            value={form.sumber}
            onChange={(e) => setForm({ ...form, sumber: e.target.value })}
            className={gayaInput}
          />
        </div>

        <button type="submit" disabled={simpan.isPending} className="tombol-utama">
          {simpan.isPending ? 'Menyimpan…' : 'Catat Harga'}
        </button>
      </form>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Harga Terbaru</h2>
      <ul className="space-y-2">
        {data?.length === 0 && (
          <li className="kartu text-center text-sm text-slate-400">Belum ada catatan harga.</li>
        )}
        {data?.map(
          (h: {
            komoditas: string;
            sektor: Sektor;
            satuan: string;
            harga: number;
            tanggal: string;
            riwayat: Array<{ tanggal: string; harga: number }>;
          }) => (
            <li
              key={`${h.sektor}-${h.komoditas}`}
              className="kartu flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium text-slate-900">{h.komoditas}</p>
                <p className="text-xs text-slate-400">
                  {LABEL_SEKTOR[h.sektor]} · per {h.satuan} · {h.riwayat.length} catatan
                </p>
              </div>
              <p className="font-semibold tabular-nums text-slate-900">{formatRupiah(h.harga)}</p>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────
// LOWONGAN KERJA
// ─────────────────────────────────────────────

export function LowonganKelola() {
  const queryClient = useQueryClient();
  const { galat, setGalat, tangani } = useGalat();
  const [form, setForm] = useState({
    jenis: 'LOWONGAN' as (typeof JENIS_LOWONGAN)[number],
    judul: '',
    penyelenggara: '',
    deskripsi: '',
    persyaratan: '',
    lokasi: '',
    imbalan: '',
    kontak: '',
    batasLamar: '',
  });

  const { data } = useQuery({
    queryKey: ['lowongan'],
    queryFn: async () => (await api.get('/lowongan')).data.data,
  });

  const simpan = useMutation({
    mutationFn: () =>
      api.post(
        '/lowongan',
        Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? undefined : v])),
      ),
    onSuccess: async () => {
      setForm({ ...form, judul: '', deskripsi: '', persyaratan: '', batasLamar: '' });
      setGalat(null);
      await queryClient.invalidateQueries({ queryKey: ['lowongan'] });
    },
    onError: tangani,
  });

  const hapus = useMutation({
    mutationFn: (id: string) => api.delete(`/lowongan/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lowongan'] }),
  });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Lowongan Kerja</h1>
      <p className="mb-5 text-sm text-slate-500">
        Lowongan, magang, dan pelatihan kerja yang diumumkan desa.
      </p>

      <Galat pesan={galat} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          simpan.mutate();
        }}
        className="kartu mb-6 space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <select
            value={form.jenis}
            onChange={(e) => setForm({ ...form, jenis: e.target.value as typeof form.jenis })}
            className={gayaInput}
          >
            {JENIS_LOWONGAN.map((j) => (
              <option key={j} value={j}>
                {LABEL_LOWONGAN[j]}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Penyelenggara"
            value={form.penyelenggara}
            onChange={(e) => setForm({ ...form, penyelenggara: e.target.value })}
            className={gayaInput}
          />
          <div className="sm:col-span-2">
            <input
              required
              minLength={5}
              placeholder="Judul"
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              className={gayaInput}
            />
          </div>
          <div className="sm:col-span-2">
            <textarea
              required
              minLength={10}
              rows={3}
              placeholder="Deskripsi"
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              className={gayaInput}
            />
          </div>
          <div className="sm:col-span-2">
            <textarea
              rows={2}
              placeholder="Persyaratan"
              value={form.persyaratan}
              onChange={(e) => setForm({ ...form, persyaratan: e.target.value })}
              className={gayaInput}
            />
          </div>
          <input
            placeholder="Lokasi"
            value={form.lokasi}
            onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
            className={gayaInput}
          />
          <input
            placeholder="Imbalan / gaji"
            value={form.imbalan}
            onChange={(e) => setForm({ ...form, imbalan: e.target.value })}
            className={gayaInput}
          />
          <input
            placeholder="Kontak"
            value={form.kontak}
            onChange={(e) => setForm({ ...form, kontak: e.target.value })}
            className={gayaInput}
          />
          <div>
            <label className="mb-1 block text-xs text-slate-600">Batas lamar</label>
            <input
              type="date"
              value={form.batasLamar}
              onChange={(e) => setForm({ ...form, batasLamar: e.target.value })}
              className={gayaInput}
            />
          </div>
        </div>

        <button type="submit" disabled={simpan.isPending} className="tombol-utama">
          {simpan.isPending ? 'Menyimpan…' : 'Umumkan'}
        </button>
      </form>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Daftar ({data?.length ?? 0})</h2>
      <ul className="space-y-2">
        {data?.map(
          (l: {
            id: string;
            judul: string;
            penyelenggara: string;
            jenis: keyof typeof LABEL_LOWONGAN;
            kedaluwarsa: boolean;
          }) => (
            <li key={l.id} className="kartu flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {LABEL_LOWONGAN[l.jenis]}
                </span>
                <p className="mt-1 font-medium text-slate-900">{l.judul}</p>
                <p className="text-xs text-slate-400">
                  {l.penyelenggara}
                  {l.kedaluwarsa && ' · sudah lewat batas lamar'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => confirm(`Hapus "${l.judul}"?`) && hapus.mutate(l.id)}
                className="tombol-sekunder border-red-300 text-xs text-red-700"
              >
                Hapus
              </button>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────
// GALERI
// ─────────────────────────────────────────────

export function GaleriKelola() {
  const queryClient = useQueryClient();
  const { galat, setGalat, tangani } = useGalat();
  const [judul, setJudul] = useState('');
  const [jenis, setJenis] = useState<'FOTO' | 'VIDEO' | 'DRONE'>('FOTO');
  const [keterangan, setKeterangan] = useState('');
  const [urlEksternal, setUrlEksternal] = useState('');
  const [berkas, setBerkas] = useState<File | null>(null);

  const { data } = useQuery({
    queryKey: ['galeri', ''],
    queryFn: async () => (await api.get('/galeri')).data.data,
  });

  const simpan = useMutation({
    mutationFn: async () => {
      const berkasId = berkas ? (await unggahBerkas([berkas], 'galeri'))[0].id : undefined;
      return api.post('/galeri', {
        judul,
        jenis,
        berkasId,
        urlEksternal: urlEksternal || undefined,
        keterangan: keterangan || undefined,
      });
    },
    onSuccess: async () => {
      setJudul('');
      setKeterangan('');
      setUrlEksternal('');
      setBerkas(null);
      setGalat(null);
      await queryClient.invalidateQueries({ queryKey: ['galeri'] });
    },
    onError: tangani,
  });

  const hapus = useMutation({
    mutationFn: (id: string) => api.delete(`/galeri/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['galeri'] }),
  });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Galeri</h1>
      <p className="mb-5 text-sm text-slate-500">
        Foto, video, dan rekaman drone kegiatan desa.
      </p>

      <Galat pesan={galat} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          simpan.mutate();
        }}
        className="kartu mb-6 space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Judul"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            className={gayaInput}
          />
          <select
            value={jenis}
            onChange={(e) => setJenis(e.target.value as typeof jenis)}
            className={gayaInput}
          >
            <option value="FOTO">Foto</option>
            <option value="VIDEO">Video</option>
            <option value="DRONE">Drone</option>
          </select>
          <div className="sm:col-span-2">
            <textarea
              rows={2}
              placeholder="Keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className={gayaInput}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-600">Unggah berkas</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBerkas(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-desa-600 file:px-3 file:py-1.5 file:text-xs file:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">atau tautan video</label>
            <input
              placeholder="https://youtu.be/…"
              value={urlEksternal}
              onChange={(e) => setUrlEksternal(e.target.value)}
              className={gayaInput}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={simpan.isPending || (!berkas && !urlEksternal)}
          className="tombol-utama"
        >
          {simpan.isPending ? 'Mengunggah…' : 'Tambah ke Galeri'}
        </button>
      </form>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Isi Galeri ({data?.length ?? 0})</h2>
      <ul className="grid gap-3 sm:grid-cols-3">
        {data?.map((m: { id: string; judul: string; url: string | null; jenis: string }) => (
          <li key={m.id} className="kartu">
            {m.url && (
              <img src={m.url} alt="" className="aspect-video w-full rounded-lg object-cover" />
            )}
            <p className="mt-2 text-sm font-medium text-slate-900">{m.judul}</p>
            <button
              type="button"
              onClick={() => confirm(`Hapus "${m.judul}"?`) && hapus.mutate(m.id)}
              className="mt-2 text-xs font-medium text-red-700 hover:underline"
            >
              Hapus
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────
// BANTUAN SOSIAL
// ─────────────────────────────────────────────

export function BantuanKelola() {
  const queryClient = useQueryClient();
  const { galat, setGalat, tangani } = useGalat();
  const [form, setForm] = useState({
    kode: '',
    nama: '',
    deskripsi: '',
    tahun: String(new Date().getFullYear()),
  });

  const { data } = useQuery({
    queryKey: ['bantuan-sosial'],
    queryFn: async () => (await api.get('/bantuan-sosial')).data.data,
  });

  const simpan = useMutation({
    mutationFn: () =>
      api.post('/bantuan-sosial', {
        ...form,
        tahun: Number(form.tahun),
        deskripsi: form.deskripsi || undefined,
      }),
    onSuccess: async () => {
      setForm({ ...form, kode: '', nama: '', deskripsi: '' });
      setGalat(null);
      await queryClient.invalidateQueries({ queryKey: ['bantuan-sosial'] });
    },
    onError: tangani,
  });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Bantuan Sosial</h1>
      <p className="mb-5 text-sm text-slate-500">
        Program bantuan yang berjalan di desa. Warga melihat nama program dan jumlah
        penerimanya, tetapi tidak daftar namanya.
      </p>

      <Galat pesan={galat} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          simpan.mutate();
        }}
        className="kartu mb-6 space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <input
            required
            placeholder="Kode (PKH, BLT)"
            value={form.kode}
            onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })}
            className={gayaInput}
          />
          <div className="sm:col-span-2">
            <input
              required
              placeholder="Nama program"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className={gayaInput}
            />
          </div>
          <input
            required
            type="number"
            value={form.tahun}
            onChange={(e) => setForm({ ...form, tahun: e.target.value })}
            className={gayaInput}
          />
          <div className="sm:col-span-2">
            <input
              placeholder="Deskripsi"
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              className={gayaInput}
            />
          </div>
        </div>

        <button type="submit" disabled={simpan.isPending} className="tombol-utama">
          {simpan.isPending ? 'Menyimpan…' : 'Tambah Program'}
        </button>
      </form>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Program ({data?.length ?? 0})</h2>
      <ul className="space-y-2">
        {data?.map(
          (p: { id: string; kode: string; nama: string; tahun: number; jumlahPenerima: number }) => (
            <li key={p.id} className="kartu flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="rounded bg-desa-50 px-2 py-0.5 text-xs font-medium text-desa-700">
                  {p.kode}
                </span>
                <p className="mt-1 font-medium text-slate-900">{p.nama}</p>
                <p className="text-xs text-slate-400">Tahun {p.tahun}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-slate-900">{p.jumlahPenerima}</p>
                <p className="text-xs text-slate-400">penerima</p>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
