import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LABEL_STATUS_PROYEK,
  STATUS_PROYEK,
  SUMBER_DANA,
  formatRupiah,
} from '@desa/shared';
import { api, pesanError } from '../../lib/api';
import { unggahBerkas } from '../../lib/unggah';

const gayaInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

const KOSONG = {
  nama: '',
  deskripsi: '',
  lokasi: '',
  nilai: '',
  sumberDana: 'Dana Desa',
  kontraktor: '',
  pengawas: '',
  tanggalMulai: '',
  tanggalSelesai: '',
  status: 'PERENCANAAN' as (typeof STATUS_PROYEK)[number],
  persentase: '0',
  tahun: String(new Date().getFullYear()),
  latitude: '',
  longitude: '',
};

export function PembangunanKelola() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...KOSONG });
  const [sedangUbah, setSedangUbah] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);

  // Formulir progres, dibuka per proyek.
  const [progresUntuk, setProgresUntuk] = useState<string | null>(null);
  const [progres, setProgres] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    persentase: '',
    catatan: '',
  });
  const [foto, setFoto] = useState<File | null>(null);

  const { data } = useQuery({
    queryKey: ['pembangunan', '', ''],
    queryFn: async () => (await api.get('/pembangunan')).data.data,
  });

  const segarkan = async () => {
    await queryClient.invalidateQueries({ queryKey: ['pembangunan'] });
    await queryClient.invalidateQueries({ queryKey: ['pembangunan-ringkasan'] });
  };

  const kosongkanOpsional = (nilai: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(nilai).map(([k, v]) => [k, v === '' ? undefined : v]));

  const simpan = useMutation({
    mutationFn: () => {
      const muatan = kosongkanOpsional({
        ...form,
        nilai: Number(form.nilai || 0),
        persentase: Number(form.persentase || 0),
        tahun: Number(form.tahun),
        latitude: form.latitude ? Number(form.latitude) : '',
        longitude: form.longitude ? Number(form.longitude) : '',
      });
      return sedangUbah
        ? api.put(`/pembangunan/${sedangUbah}`, muatan)
        : api.post('/pembangunan', muatan);
    },
    onSuccess: async () => {
      setForm({ ...KOSONG });
      setSedangUbah(null);
      setGalat(null);
      await segarkan();
    },
    onError: (e) => setGalat(pesanError(e, 'Proyek gagal disimpan.')),
  });

  const hapus = useMutation({
    mutationFn: (id: string) => api.delete(`/pembangunan/${id}`),
    onSuccess: segarkan,
  });

  const simpanProgres = useMutation({
    mutationFn: async () => {
      const fotoId = foto ? (await unggahBerkas([foto], 'proyek'))[0].id : undefined;
      return api.post(`/pembangunan/${progresUntuk}/progres`, {
        tanggal: progres.tanggal,
        persentase: Number(progres.persentase || 0),
        catatan: progres.catatan || undefined,
        fotoId,
      });
    },
    onSuccess: async () => {
      setProgresUntuk(null);
      setProgres({ tanggal: new Date().toISOString().slice(0, 10), persentase: '', catatan: '' });
      setFoto(null);
      setGalat(null);
      await segarkan();
    },
    onError: (e) =>
      setGalat(
        e instanceof Error && !('response' in e)
          ? e.message
          : pesanError(e, 'Progres gagal disimpan.'),
      ),
  });

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Pembangunan Desa</h1>
      <p className="mb-5 text-sm text-slate-500">
        Proyek yang dimasukkan di sini tampil terbuka beserta nilai, pelaksana, dan progresnya.
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
          {sedangUbah ? 'Ubah Proyek' : 'Tambah Proyek'}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Nama proyek</label>
            <input
              required
              minLength={5}
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lokasi</label>
            <input
              required
              value={form.lokasi}
              onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
              placeholder="RT 002 / RW 001"
              className={gayaInput}
            />
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

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nilai (Rp)</label>
            <input
              required
              type="number"
              min="0"
              value={form.nilai}
              onChange={(e) => setForm({ ...form, nilai: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Sumber dana</label>
            <input
              required
              list="sumber-proyek"
              value={form.sumberDana}
              onChange={(e) => setForm({ ...form, sumberDana: e.target.value })}
              className={gayaInput}
            />
            <datalist id="sumber-proyek">
              {SUMBER_DANA.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mulai</label>
            <input
              required
              type="date"
              value={form.tanggalMulai}
              onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Target selesai</label>
            <input
              type="date"
              value={form.tanggalSelesai}
              onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Pelaksana</label>
            <input
              value={form.kontraktor}
              onChange={(e) => setForm({ ...form, kontraktor: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Pengawas</label>
            <input
              value={form.pengawas}
              onChange={(e) => setForm({ ...form, pengawas: e.target.value })}
              className={gayaInput}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
              className={gayaInput}
            >
              {STATUS_PROYEK.map((s) => (
                <option key={s} value={s}>
                  {LABEL_STATUS_PROYEK[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Lintang</label>
              <input
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                placeholder="-1.04423"
                className={gayaInput}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Bujur</label>
              <input
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                placeholder="114.84645"
                className={gayaInput}
              />
            </div>
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

        <div className="flex gap-2">
          <button type="submit" disabled={simpan.isPending} className="tombol-utama">
            {simpan.isPending ? 'Menyimpan…' : sedangUbah ? 'Simpan Perubahan' : 'Tambah Proyek'}
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
        Daftar Proyek ({data?.length ?? 0})
      </h2>

      <ul className="space-y-3">
        {data?.map(
          (p: {
            id: string;
            nama: string;
            lokasi: string;
            tahun: number;
            nilai: number;
            status: string;
            persentase: number;
            sumberDana: string;
            kontraktor: string | null;
            pengawas: string | null;
            deskripsi: string | null;
            tanggalMulai: string;
            tanggalSelesai: string | null;
            latitude: number | null;
            longitude: number | null;
          }) => (
            <li key={p.id} className="kartu">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-slate-900">{p.nama}</h3>
                  <p className="text-xs text-slate-400">
                    {p.lokasi} · {p.tahun} · {formatRupiah(p.nilai)} ·{' '}
                    {LABEL_STATUS_PROYEK[p.status as keyof typeof LABEL_STATUS_PROYEK]} ·{' '}
                    {p.persentase}%
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setProgresUntuk(progresUntuk === p.id ? null : p.id)}
                    className="tombol-sekunder text-xs"
                  >
                    Catat progres
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSedangUbah(p.id);
                      setForm({
                        nama: p.nama,
                        deskripsi: p.deskripsi ?? '',
                        lokasi: p.lokasi,
                        nilai: String(p.nilai),
                        sumberDana: p.sumberDana,
                        kontraktor: p.kontraktor ?? '',
                        pengawas: p.pengawas ?? '',
                        tanggalMulai: String(p.tanggalMulai).slice(0, 10),
                        tanggalSelesai: p.tanggalSelesai
                          ? String(p.tanggalSelesai).slice(0, 10)
                          : '',
                        status: p.status as typeof form.status,
                        persentase: String(p.persentase),
                        tahun: String(p.tahun),
                        latitude: p.latitude ? String(p.latitude) : '',
                        longitude: p.longitude ? String(p.longitude) : '',
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
                      if (confirm(`Hapus proyek "${p.nama}"?`)) hapus.mutate(p.id);
                    }}
                    className="tombol-sekunder border-red-300 text-xs text-red-700 hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              {progresUntuk === p.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    simpanProgres.mutate();
                  }}
                  className="mt-4 space-y-3 border-t border-slate-100 pt-4"
                >
                  <p className="text-sm font-medium text-slate-800">Catat progres</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-slate-600">Tanggal</label>
                      <input
                        required
                        type="date"
                        value={progres.tanggal}
                        onChange={(e) => setProgres({ ...progres, tanggal: e.target.value })}
                        className={gayaInput}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-slate-600">Persentase</label>
                      <input
                        required
                        type="number"
                        min="0"
                        max="100"
                        value={progres.persentase}
                        onChange={(e) => setProgres({ ...progres, persentase: e.target.value })}
                        className={gayaInput}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Catatan</label>
                    <textarea
                      rows={2}
                      value={progres.catatan}
                      onChange={(e) => setProgres({ ...progres, catatan: e.target.value })}
                      className={gayaInput}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-600">Foto progres</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                      className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-desa-600 file:px-3 file:py-1.5 file:text-xs file:text-white"
                    />
                  </div>
                  {/* Persentase proyek ikut diperbarui dari catatan ini, supaya
                      angka di daftar tidak pernah berbeda dari catatan terakhir. */}
                  <p className="text-xs text-slate-400">
                    Persentase proyek otomatis mengikuti catatan ini. Bila mencapai 100%,
                    status berubah menjadi Selesai.
                  </p>
                  <button
                    type="submit"
                    disabled={simpanProgres.isPending}
                    className="tombol-utama text-xs"
                  >
                    {simpanProgres.isPending ? 'Menyimpan…' : 'Simpan Progres'}
                  </button>
                </form>
              )}
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
