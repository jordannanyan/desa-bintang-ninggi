import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, pesanError } from '../../lib/api';

interface Berita {
  id: string;
  slug: string;
  judul: string;
  ringkasan: string | null;
  penulis: string;
  terbit: boolean;
  terbitPada: string | null;
  dilihat: number;
}

const KOSONG = {
  judul: '',
  ringkasan: '',
  isi: '',
  sampulUrl: '',
  penulis: '',
  terbit: false,
};

const gayaInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

export function BeritaKelola() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...KOSONG });
  const [sedangUbah, setSedangUbah] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['berita'],
    queryFn: async () =>
      (await api.get('/berita', { params: { perPage: 50 } })).data as { data: Berita[] },
  });

  const segarkan = () => queryClient.invalidateQueries({ queryKey: ['berita'] });

  const simpan = useMutation({
    mutationFn: async () => {
      const muatan = {
        ...form,
        ringkasan: form.ringkasan || undefined,
        sampulUrl: form.sampulUrl || undefined,
      };
      if (sedangUbah) await api.put(`/berita/${sedangUbah}`, muatan);
      else await api.post('/berita', muatan);
    },
    onSuccess: async () => {
      setForm({ ...KOSONG });
      setSedangUbah(null);
      setGalat(null);
      await segarkan();
      await queryClient.invalidateQueries({ queryKey: ['beranda'] });
    },
    onError: (err) => setGalat(pesanError(err, 'Berita gagal disimpan.')),
  });

  const hapus = useMutation({
    mutationFn: (id: string) => api.delete(`/berita/${id}`),
    onSuccess: segarkan,
  });

  const muatUntukUbah = async (id: string) => {
    const b = data?.data.find((x) => x.id === id);
    if (!b) return;
    const lengkap = (await api.get(`/berita/${b.slug}`)).data.data;
    setForm({
      judul: lengkap.judul,
      ringkasan: lengkap.ringkasan ?? '',
      isi: lengkap.isi,
      sampulUrl: lengkap.sampulUrl ?? '',
      penulis: lengkap.penulis,
      terbit: lengkap.terbit,
    });
    setSedangUbah(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Kelola Berita</h1>
      <p className="mb-5 text-sm text-slate-500">
        Berita yang belum diterbitkan tersimpan sebagai draf dan tidak tampil di halaman
        publik.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          simpan.mutate();
        }}
        className="kartu mb-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">
          {sedangUbah ? 'Ubah Berita' : 'Tulis Berita Baru'}
        </h2>

        {galat && (
          <div className="rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
            {galat}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
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

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Penulis</label>
            <input
              required
              value={form.penulis}
              onChange={(e) => setForm({ ...form, penulis: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              URL gambar sampul
            </label>
            <input
              value={form.sampulUrl}
              onChange={(e) => setForm({ ...form, sampulUrl: e.target.value })}
              placeholder="Opsional"
              className={gayaInput}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Ringkasan
              <span className="ml-1 font-normal text-slate-400">
                — tampil di kartu berita dan halaman depan
              </span>
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={form.ringkasan}
              onChange={(e) => setForm({ ...form, ringkasan: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Isi berita</label>
            <textarea
              required
              minLength={20}
              rows={10}
              value={form.isi}
              onChange={(e) => setForm({ ...form, isi: e.target.value })}
              className={gayaInput}
            />
            <p className="mt-1 text-xs text-slate-400">
              Ditulis sebagai teks biasa. Baris kosong menjadi jarak antar paragraf.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.terbit}
            onChange={(e) => setForm({ ...form, terbit: e.target.checked })}
            className="rounded"
          />
          Terbitkan sekarang
        </label>

        <div className="flex gap-2">
          <button type="submit" disabled={simpan.isPending} className="tombol-utama">
            {simpan.isPending ? 'Menyimpan…' : sedangUbah ? 'Simpan Perubahan' : 'Simpan'}
          </button>
          {sedangUbah && (
            <button
              type="button"
              onClick={() => {
                setSedangUbah(null);
                setForm({ ...KOSONG });
              }}
              className="tombol-sekunder"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">
        Daftar Berita ({data?.data.length ?? 0})
      </h2>

      <ul className="space-y-2">
        {data?.data.map((b) => (
          <li key={b.id} className="kartu flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{b.judul}</p>
              <p className="text-xs text-slate-400">
                {b.penulis} ·{' '}
                {b.terbit
                  ? `terbit ${b.terbitPada ? new Date(b.terbitPada).toLocaleDateString('id-ID') : ''} · ${b.dilihat} dibaca`
                  : 'draf'}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => muatUntukUbah(b.id)}
                className="tombol-sekunder text-xs"
              >
                Ubah
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus berita "${b.judul}"? Tindakan ini tidak bisa dibatalkan.`)) {
                    hapus.mutate(b.id);
                  }
                }}
                className="tombol-sekunder border-red-300 text-xs text-red-700 hover:bg-red-50"
              >
                Hapus
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
