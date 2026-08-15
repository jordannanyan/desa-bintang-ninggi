import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, pesanError } from '../../lib/api';

const gayaInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

interface FormProfil {
  namaDesa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  luasWilayahKm: string;
  alamatKantor: string;
  sejarah: string;
  visi: string;
  /** Satu poin misi per baris — jauh lebih ringan dipakai daripada daftar dinamis. */
  misiTeks: string;
  sambutanKades: string;
  /** Satu prestasi per baris: `Judul | Tahun | Keterangan`. */
  prestasiTeks: string;
  /** Satu potensi per baris: `Judul | Keterangan`. */
  potensiTeks: string;
  videoProfilUrl: string;
  waDesa: string;
  email: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
}

const KOSONG: FormProfil = {
  namaDesa: '',
  kecamatan: '',
  kabupaten: '',
  provinsi: '',
  kodePos: '',
  luasWilayahKm: '',
  alamatKantor: '',
  sejarah: '',
  visi: '',
  misiTeks: '',
  sambutanKades: '',
  prestasiTeks: '',
  potensiTeks: '',
  videoProfilUrl: '',
  waDesa: '',
  email: '',
  facebook: '',
  instagram: '',
  tiktok: '',
  youtube: '',
};

function Bidang({
  label,
  petunjuk,
  children,
}: {
  label: string;
  petunjuk?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {petunjuk && <p className="mt-1 text-xs text-slate-400">{petunjuk}</p>}
    </div>
  );
}

export function ProfilDesaForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormProfil>({ ...KOSONG });
  const [galat, setGalat] = useState<string | null>(null);
  const [kabar, setKabar] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['profil'],
    queryFn: async () => (await api.get('/profil')).data.data,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      namaDesa: data.namaDesa ?? '',
      kecamatan: data.kecamatan ?? '',
      kabupaten: data.kabupaten ?? '',
      provinsi: data.provinsi ?? '',
      kodePos: data.kodePos ?? '',
      luasWilayahKm: data.luasWilayahKm ?? '',
      alamatKantor: data.alamatKantor ?? '',
      sejarah: data.sejarah ?? '',
      visi: data.visi ?? '',
      misiTeks: Array.isArray(data.misi) ? data.misi.join('\n') : '',
      sambutanKades: data.sambutanKades ?? '',
      prestasiTeks: Array.isArray(data.prestasi)
        ? data.prestasi
            .map((p: { judul: string; tahun: number; keterangan?: string }) =>
              [p.judul, p.tahun, p.keterangan].filter(Boolean).join(' | '),
            )
            .join('\n')
        : '',
      potensiTeks: Array.isArray(data.potensi)
        ? data.potensi
            .map((p: { judul: string; keterangan?: string }) =>
              [p.judul, p.keterangan].filter(Boolean).join(' | '),
            )
            .join('\n')
        : '',
      videoProfilUrl: data.videoProfilUrl ?? '',
      waDesa: data.waDesa ?? '',
      email: data.email ?? '',
      facebook: data.facebook ?? '',
      instagram: data.instagram ?? '',
      tiktok: data.tiktok ?? '',
      youtube: data.youtube ?? '',
    });
  }, [data]);

  const simpan = useMutation({
    mutationFn: () => {
      const { misiTeks, prestasiTeks, potensiTeks, luasWilayahKm, ...sisa } = form;
      const muatan: Record<string, unknown> = { ...sisa };

      // Kolom opsional yang dikosongkan dikirim undefined, bukan string kosong,
      // supaya tidak gagal validasi (mis. email).
      for (const [k, v] of Object.entries(muatan)) {
        if (v === '') muatan[k] = undefined;
      }

      muatan.misi = misiTeks
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean);
      if (luasWilayahKm) muatan.luasWilayahKm = Number(luasWilayahKm);

      const baris = (teks: string) =>
        teks
          .split('\n')
          .map((b) => b.trim())
          .filter(Boolean)
          .map((b) => b.split('|').map((k) => k.trim()));

      // Baris tanpa tahun yang sah dilewati, bukan dikirim dengan NaN yang
      // pasti ditolak validasi tanpa perangkat desa tahu baris mana penyebabnya.
      muatan.prestasi = baris(prestasiTeks)
        .filter(([judul, tahun]) => judul && /^\d{4}$/.test(tahun ?? ''))
        .map(([judul, tahun, keterangan]) => ({
          judul,
          tahun: Number(tahun),
          keterangan: keterangan || undefined,
        }));

      muatan.potensi = baris(potensiTeks)
        .filter(([judul]) => judul)
        .map(([judul, keterangan]) => ({ judul, keterangan: keterangan || undefined }));

      return api.put('/profil', muatan);
    },
    onSuccess: async () => {
      setGalat(null);
      setKabar('Profil desa tersimpan.');
      await queryClient.invalidateQueries({ queryKey: ['profil'] });
      await queryClient.invalidateQueries({ queryKey: ['beranda'] });
    },
    onError: (err) => {
      setKabar(null);
      setGalat(pesanError(err, 'Profil gagal disimpan.'));
    },
  });

  const ubah = (kunci: keyof FormProfil) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [kunci]: e.target.value }));

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Profil Desa</h1>
      <p className="mb-5 text-sm text-slate-500">
        Isi di sini muncul di halaman depan, halaman Profil Desa, dan kop surat yang
        diterbitkan sistem.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          simpan.mutate();
        }}
        className="space-y-4"
      >
        {galat && (
          <div className="rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
            {galat}
          </div>
        )}
        {kabar && (
          <div className="rounded-lg border-l-4 border-desa-500 bg-desa-50 px-3 py-2 text-sm text-desa-900">
            {kabar}
          </div>
        )}

        <section className="kartu space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Identitas Wilayah</h2>
          <p className="-mt-2 text-xs text-slate-500">
            Empat isian pertama tercetak di kop setiap surat yang diterbitkan.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="Nama desa">
              <input required value={form.namaDesa} onChange={ubah('namaDesa')} className={gayaInput} />
            </Bidang>
            <Bidang label="Kecamatan">
              <input required value={form.kecamatan} onChange={ubah('kecamatan')} className={gayaInput} />
            </Bidang>
            <Bidang label="Kabupaten">
              <input required value={form.kabupaten} onChange={ubah('kabupaten')} className={gayaInput} />
            </Bidang>
            <Bidang label="Provinsi">
              <input required value={form.provinsi} onChange={ubah('provinsi')} className={gayaInput} />
            </Bidang>
            <Bidang label="Kode pos">
              <input value={form.kodePos} onChange={ubah('kodePos')} className={gayaInput} />
            </Bidang>
            <Bidang label="Luas wilayah (km²)">
              <input
                type="number"
                step="0.01"
                value={form.luasWilayahKm}
                onChange={ubah('luasWilayahKm')}
                className={gayaInput}
              />
            </Bidang>
            <div className="sm:col-span-2">
              <Bidang label="Alamat kantor desa" petunjuk="Tercetak di bawah kop surat.">
                <input value={form.alamatKantor} onChange={ubah('alamatKantor')} className={gayaInput} />
              </Bidang>
            </div>
          </div>
        </section>

        <section className="kartu space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Profil & Visi Misi</h2>
          <Bidang label="Sejarah desa">
            <textarea rows={6} value={form.sejarah} onChange={ubah('sejarah')} className={gayaInput} />
          </Bidang>
          <Bidang label="Visi">
            <textarea rows={3} value={form.visi} onChange={ubah('visi')} className={gayaInput} />
          </Bidang>
          <Bidang label="Misi" petunjuk="Satu poin misi per baris.">
            <textarea rows={6} value={form.misiTeks} onChange={ubah('misiTeks')} className={gayaInput} />
          </Bidang>
          <Bidang label="Sambutan Kepala Desa">
            <textarea
              rows={6}
              value={form.sambutanKades}
              onChange={ubah('sambutanKades')}
              className={gayaInput}
            />
          </Bidang>
          <Bidang
            label="Prestasi desa"
            petunjuk="Satu prestasi per baris: Judul | Tahun | Keterangan. Baris tanpa tahun empat digit diabaikan."
          >
            <textarea
              rows={5}
              value={form.prestasiTeks}
              onChange={ubah('prestasiTeks')}
              placeholder="Juara I Lomba Desa Tingkat Kabupaten | 2024 | Kategori tata kelola"
              className={gayaInput}
            />
          </Bidang>
          <Bidang label="Potensi desa" petunjuk="Satu potensi per baris: Judul | Keterangan.">
            <textarea
              rows={5}
              value={form.potensiTeks}
              onChange={ubah('potensiTeks')}
              placeholder="Perkebunan karet | Luas 120 ha, dikelola 80 kepala keluarga"
              className={gayaInput}
            />
          </Bidang>
          <Bidang
            label="Video profil desa"
            petunjuk="Tempel tautan YouTube biasa — otomatis diubah jadi sematan."
          >
            <input
              value={form.videoProfilUrl}
              onChange={ubah('videoProfilUrl')}
              placeholder="https://youtu.be/..."
              className={gayaInput}
            />
          </Bidang>
        </section>

        <section className="kartu space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Kontak & Media Sosial</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="Nomor WhatsApp desa">
              <input value={form.waDesa} onChange={ubah('waDesa')} className={gayaInput} />
            </Bidang>
            <Bidang label="Email">
              <input type="email" value={form.email} onChange={ubah('email')} className={gayaInput} />
            </Bidang>
            <Bidang label="Facebook">
              <input value={form.facebook} onChange={ubah('facebook')} className={gayaInput} />
            </Bidang>
            <Bidang label="Instagram">
              <input value={form.instagram} onChange={ubah('instagram')} className={gayaInput} />
            </Bidang>
            <Bidang label="TikTok">
              <input value={form.tiktok} onChange={ubah('tiktok')} className={gayaInput} />
            </Bidang>
            <Bidang label="YouTube">
              <input value={form.youtube} onChange={ubah('youtube')} className={gayaInput} />
            </Bidang>
          </div>
        </section>

        <button type="submit" disabled={simpan.isPending} className="tombol-utama">
          {simpan.isPending ? 'Menyimpan…' : 'Simpan Profil Desa'}
        </button>
      </form>
    </div>
  );
}
