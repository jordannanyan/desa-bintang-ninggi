import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { JENIS_DOKUMEN, LABEL_JENIS_DOKUMEN, type JenisDokumen } from '@desa/shared';
import { api, pesanError } from '../../lib/api';
import { unggahBerkas } from '../../lib/unggah';

const gayaInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

const KOSONG = {
  jenis: 'PERDES' as JenisDokumen,
  judul: '',
  nomor: '',
  tahun: String(new Date().getFullYear()),
  ringkasan: '',
  publik: true,
};

/**
 * Satu halaman untuk seluruh dokumen desa.
 *
 * Pemerintahan Desa, PPID, dan Download Center membaca tabel yang sama;
 * memisahkan pengelolaannya jadi tiga halaman hanya akan memaksa perangkat
 * desa menebak berkas ini harus diunggah di mana.
 */
export function DokumenKelola() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...KOSONG });
  const [berkas, setBerkas] = useState<File | null>(null);
  const [sedangUbah, setSedangUbah] = useState<string | null>(null);
  const [saring, setSaring] = useState<string>('');
  const [galat, setGalat] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['dokumen-admin', saring],
    queryFn: async () =>
      (await api.get('/dokumen', { params: { jenis: saring || undefined } })).data.data as Array<{
        id: string;
        jenis: JenisDokumen;
        judul: string;
        nomor: string | null;
        tahun: number;
        ringkasan: string | null;
        publik: boolean;
        jumlahUnduh: number;
        adaBerkas: boolean;
      }>,
  });

  const segarkan = () => queryClient.invalidateQueries({ queryKey: ['dokumen'] });

  const simpan = useMutation({
    mutationFn: async () => {
      const berkasId = berkas ? (await unggahBerkas([berkas], 'dokumen'))[0].id : undefined;
      const muatan = {
        ...form,
        tahun: Number(form.tahun),
        nomor: form.nomor || undefined,
        ringkasan: form.ringkasan || undefined,
        ...(berkasId ? { berkasId } : {}),
      };
      return sedangUbah
        ? api.put(`/dokumen/${sedangUbah}`, muatan)
        : api.post('/dokumen', muatan);
    },
    onSuccess: async () => {
      setForm({ ...KOSONG });
      setBerkas(null);
      setSedangUbah(null);
      setGalat(null);
      await segarkan();
      await queryClient.invalidateQueries({ queryKey: ['dokumen-admin'] });
    },
    onError: (e) =>
      setGalat(
        e instanceof Error && !('response' in e)
          ? e.message
          : pesanError(e, 'Dokumen gagal disimpan.'),
      ),
  });

  const hapus = useMutation({
    mutationFn: (id: string) => api.delete(`/dokumen/${id}`),
    onSuccess: async () => {
      await segarkan();
      await queryClient.invalidateQueries({ queryKey: ['dokumen-admin'] });
    },
  });

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Dokumen & PPID</h1>
      <p className="mb-5 text-sm text-slate-500">
        Dokumen yang diunggah di sini muncul di halaman Pemerintahan Desa, PPID, atau
        Download Center sesuai jenisnya.
      </p>

      {galat && (
        <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
          {galat}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          simpan.mutate();
        }}
        className="kartu mb-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">
          {sedangUbah ? 'Ubah Dokumen' : 'Unggah Dokumen'}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Jenis</label>
            <select
              value={form.jenis}
              onChange={(e) => setForm({ ...form, jenis: e.target.value as JenisDokumen })}
              className={gayaInput}
            >
              {JENIS_DOKUMEN.map((j) => (
                <option key={j} value={j}>
                  {LABEL_JENIS_DOKUMEN[j]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tahun</label>
            <input
              required
              type="number"
              value={form.tahun}
              onChange={(e) => setForm({ ...form, tahun: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Judul</label>
            <input
              required
              minLength={5}
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              placeholder="Contoh: Peraturan Desa tentang APBDes Tahun 2026"
              className={gayaInput}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nomor dokumen
            </label>
            <input
              value={form.nomor}
              onChange={(e) => setForm({ ...form, nomor: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Berkas (PDF)</label>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setBerkas(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-desa-600 file:px-3 file:py-1.5 file:text-xs file:text-white"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Ringkasan</label>
            <textarea
              rows={2}
              value={form.ringkasan}
              onChange={(e) => setForm({ ...form, ringkasan: e.target.value })}
              className={gayaInput}
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.publik}
            onChange={(e) => setForm({ ...form, publik: e.target.checked })}
            className="mt-0.5 rounded"
          />
          <span>
            Tampilkan ke publik
            {/* Draf peraturan yang belum ditetapkan tidak boleh terbaca warga
                sebagai aturan yang berlaku. */}
            <span className="block text-xs text-slate-500">
              Hilangkan centang untuk draf yang belum ditetapkan — hanya perangkat desa yang
              bisa melihatnya.
            </span>
          </span>
        </label>

        <div className="flex gap-2">
          <button type="submit" disabled={simpan.isPending} className="tombol-utama">
            {simpan.isPending ? 'Menyimpan…' : sedangUbah ? 'Simpan Perubahan' : 'Unggah'}
          </button>
          {sedangUbah && (
            <button
              type="button"
              onClick={() => {
                setSedangUbah(null);
                setForm({ ...KOSONG });
                setBerkas(null);
              }}
              className="tombol-sekunder"
            >
              Batal
            </button>
          )}
        </div>
      </form>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Daftar Dokumen ({data?.length ?? 0})
        </h2>
        <select
          value={saring}
          onChange={(e) => setSaring(e.target.value)}
          className="ml-auto rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
        >
          <option value="">Semua jenis</option>
          {JENIS_DOKUMEN.map((j) => (
            <option key={j} value={j}>
              {LABEL_JENIS_DOKUMEN[j]}
            </option>
          ))}
        </select>
      </div>

      <ul className="space-y-2">
        {data?.length === 0 && (
          <li className="kartu text-center text-sm text-slate-400">Belum ada dokumen.</li>
        )}
        {data?.map((d) => (
          <li key={d.id} className="kartu flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {LABEL_JENIS_DOKUMEN[d.jenis]}
                </span>
                <span className="text-xs text-slate-400">{d.tahun}</span>
                {!d.publik && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    belum publik
                  </span>
                )}
                {!d.adaBerkas && (
                  <span className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">
                    tanpa berkas
                  </span>
                )}
              </div>
              <p className="mt-1 font-medium text-slate-900">{d.judul}</p>
              <p className="text-xs text-slate-400">
                {d.nomor && `${d.nomor} · `}
                {d.jumlahUnduh} kali diunduh
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSedangUbah(d.id);
                  setForm({
                    jenis: d.jenis,
                    judul: d.judul,
                    nomor: d.nomor ?? '',
                    tahun: String(d.tahun),
                    ringkasan: d.ringkasan ?? '',
                    publik: d.publik,
                  });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="tombol-sekunder text-xs"
              >
                Ubah
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Hapus dokumen "${d.judul}"?`)) hapus.mutate(d.id);
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
