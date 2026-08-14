import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KATEGORI_AGENDA, LABEL_KATEGORI_AGENDA } from '@desa/shared';
import { api, pesanError } from '../../lib/api';

const gayaInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

const KOSONG = {
  judul: '',
  kategori: 'LAINNYA' as (typeof KATEGORI_AGENDA)[number],
  deskripsi: '',
  mulai: '',
  selesai: '',
  lokasi: '',
  penyelenggara: '',
};

/**
 * Pengelolaan agenda dan pengumuman disatukan dalam satu halaman.
 *
 * Keduanya sering diisi bersamaan — pengumuman rapat hampir selalu disertai
 * agendanya — sehingga memisahkannya justru menambah perpindahan halaman.
 */
export function AgendaKelola() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...KOSONG });
  const [galat, setGalat] = useState<string | null>(null);
  const [lampau, setLampau] = useState(false);

  const { data } = useQuery({
    queryKey: ['agenda', lampau],
    queryFn: async () =>
      (await api.get('/agenda', { params: { lampau } })).data as {
        data: Array<{
          id: string;
          judul: string;
          kategori: (typeof KATEGORI_AGENDA)[number];
          mulai: string;
          lokasi: string | null;
        }>;
      },
  });

  const simpan = useMutation({
    mutationFn: () =>
      api.post('/agenda', {
        ...form,
        deskripsi: form.deskripsi || undefined,
        lokasi: form.lokasi || undefined,
        penyelenggara: form.penyelenggara || undefined,
        selesai: form.selesai || undefined,
      }),
    onSuccess: async () => {
      setForm({ ...KOSONG });
      setGalat(null);
      await queryClient.invalidateQueries({ queryKey: ['agenda'] });
      await queryClient.invalidateQueries({ queryKey: ['beranda'] });
    },
    onError: (err) => setGalat(pesanError(err, 'Agenda gagal disimpan.')),
  });

  const hapus = useMutation({
    mutationFn: (id: string) => api.delete(`/agenda/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agenda'] }),
  });

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Kelola Agenda</h1>
      <p className="mb-5 text-sm text-slate-500">
        Agenda yang akan datang tampil di halaman depan dan halaman Agenda Kegiatan.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          simpan.mutate();
        }}
        className="kartu mb-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-slate-900">Tambah Agenda</h2>

        {galat && (
          <div className="rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
            {galat}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Judul kegiatan</label>
            <input
              required
              minLength={5}
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
            <select
              value={form.kategori}
              onChange={(e) =>
                setForm({ ...form, kategori: e.target.value as typeof form.kategori })
              }
              className={gayaInput}
            >
              {KATEGORI_AGENDA.map((k) => (
                <option key={k} value={k}>
                  {LABEL_KATEGORI_AGENDA[k]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lokasi</label>
            <input
              value={form.lokasi}
              onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mulai</label>
            <input
              required
              type="datetime-local"
              value={form.mulai}
              onChange={(e) => setForm({ ...form, mulai: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Selesai <span className="font-normal text-slate-400">— opsional</span>
            </label>
            <input
              type="datetime-local"
              value={form.selesai}
              onChange={(e) => setForm({ ...form, selesai: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Penyelenggara</label>
            <input
              value={form.penyelenggara}
              onChange={(e) => setForm({ ...form, penyelenggara: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Deskripsi</label>
            <textarea
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              className={gayaInput}
            />
          </div>
        </div>

        <button type="submit" disabled={simpan.isPending} className="tombol-utama">
          {simpan.isPending ? 'Menyimpan…' : 'Simpan Agenda'}
        </button>
      </form>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          {lampau ? 'Agenda yang sudah lewat' : 'Agenda mendatang'}
        </h2>
        <button
          type="button"
          onClick={() => setLampau((v) => !v)}
          className="tombol-sekunder text-xs"
        >
          {lampau ? 'Lihat yang mendatang' : 'Lihat yang sudah lewat'}
        </button>
      </div>

      {data?.data.length === 0 && (
        <p className="text-sm text-slate-400">Tidak ada agenda pada rentang ini.</p>
      )}

      <ul className="space-y-2">
        {data?.data.map((a) => (
          <li key={a.id} className="kartu flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">{a.judul}</p>
              <p className="text-xs text-slate-400">
                {new Date(a.mulai).toLocaleString('id-ID', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
                {a.lokasi && ` · ${a.lokasi}`} · {LABEL_KATEGORI_AGENDA[a.kategori]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Hapus agenda "${a.judul}"?`)) hapus.mutate(a.id);
              }}
              className="tombol-sekunder border-red-300 text-xs text-red-700 hover:bg-red-50"
            >
              Hapus
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
