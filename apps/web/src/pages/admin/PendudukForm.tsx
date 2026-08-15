import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AGAMA,
  GOLONGAN_DARAH,
  HUBUNGAN_KELUARGA,
  PEKERJAAN,
  PENDIDIKAN,
} from '@desa/shared';
import { api, pesanError } from '../../lib/api';

/** Bentuk yang dipakai form — tanggal sebagai string agar cocok dengan <input type="date">. */
interface FormPenduduk {
  nik: string;
  nomorKk: string;
  nama: string;
  jenisKelamin: 'LAKI_LAKI' | 'PEREMPUAN';
  tempatLahir: string;
  tanggalLahir: string;
  agama: string;
  pendidikan: string;
  pekerjaan: string;
  statusKawin: 'BELUM_KAWIN' | 'KAWIN' | 'CERAI_HIDUP' | 'CERAI_MATI';
  hubunganKeluarga: string;
  kewarganegaraan: 'WNI' | 'WNA';
  namaAyah?: string;
  namaIbu?: string;
  golonganDarah?: string;
  noAktaLahir?: string;
  disabilitas?: string;
  pendatang: boolean;
  alamat: string;
  rt: string;
  rw: string;
  dusun?: string;
}

const gayaInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

function Bidang({
  label,
  wajib,
  galat,
  children,
}: {
  label: string;
  wajib?: boolean;
  galat?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {wajib && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {galat && <p className="mt-1 text-xs text-red-600">{galat}</p>}
    </div>
  );
}

export function PendudukForm() {
  const { id } = useParams();
  const mode = id && id !== 'baru' ? 'ubah' : 'tambah';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [galat, setGalat] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormPenduduk>({
    defaultValues: { kewarganegaraan: 'WNI', pendatang: false, jenisKelamin: 'LAKI_LAKI' },
  });

  const { data: awal } = useQuery({
    queryKey: ['penduduk', id],
    enabled: mode === 'ubah',
    queryFn: async () => (await api.get(`/kependudukan/${id}`)).data.data,
  });

  useEffect(() => {
    if (!awal) return;
    reset({
      nik: awal.nik,
      nomorKk: awal.kartuKeluarga.nomorKk,
      nama: awal.nama,
      jenisKelamin: awal.jenisKelamin,
      tempatLahir: awal.tempatLahir,
      tanggalLahir: String(awal.tanggalLahir).slice(0, 10),
      agama: awal.agama,
      pendidikan: awal.pendidikan,
      pekerjaan: awal.pekerjaan,
      statusKawin: awal.statusKawin,
      hubunganKeluarga: awal.hubunganKeluarga,
      kewarganegaraan: awal.kewarganegaraan,
      namaAyah: awal.namaAyah ?? '',
      namaIbu: awal.namaIbu ?? '',
      golonganDarah: awal.golonganDarah ?? '',
      noAktaLahir: awal.noAktaLahir ?? '',
      disabilitas: awal.disabilitas ?? '',
      pendatang: awal.pendatang,
      alamat: awal.kartuKeluarga.alamat,
      rt: awal.kartuKeluarga.rt.nomor,
      rw: awal.kartuKeluarga.rt.rw.nomor,
      dusun: awal.kartuKeluarga.dusun ?? '',
    });
  }, [awal, reset]);

  const onSubmit = async (nilai: FormPenduduk) => {
    setGalat(null);
    // Kolom opsional yang dikosongkan dikirim sebagai undefined, bukan string kosong —
    // string kosong akan gagal validasi enum di sisi server.
    const muatan = Object.fromEntries(
      Object.entries(nilai).map(([k, v]) => [k, v === '' ? undefined : v]),
    );

    try {
      if (mode === 'ubah') await api.put(`/kependudukan/${id}`, muatan);
      else await api.post('/kependudukan', muatan);

      await queryClient.invalidateQueries({ queryKey: ['penduduk'] });
      navigate('/admin/penduduk');
    } catch (err) {
      setGalat(pesanError(err, 'Data gagal disimpan.'));
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">
        {mode === 'ubah' ? 'Ubah Data Penduduk' : 'Tambah Penduduk'}
      </h1>
      <p className="mb-5 text-sm text-slate-500">
        Susunan kolom mengikuti format Kartu Keluarga.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {galat && (
          <div
            role="alert"
            className="rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {galat}
          </div>
        )}

        <section className="kartu space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Identitas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="NIK" wajib galat={errors.nik?.message}>
              <input
                inputMode="numeric"
                maxLength={16}
                className={gayaInput}
                {...register('nik', {
                  required: 'NIK wajib diisi',
                  pattern: { value: /^\d{16}$/, message: 'NIK harus 16 digit angka' },
                })}
              />
            </Bidang>

            <Bidang label="Nomor Kartu Keluarga" wajib galat={errors.nomorKk?.message}>
              <input
                inputMode="numeric"
                maxLength={16}
                className={gayaInput}
                {...register('nomorKk', {
                  required: 'Nomor KK wajib diisi',
                  pattern: { value: /^\d{16}$/, message: 'Nomor KK harus 16 digit angka' },
                })}
              />
            </Bidang>

            <Bidang label="Nama lengkap" wajib galat={errors.nama?.message}>
              <input className={gayaInput} {...register('nama', { required: 'Nama wajib diisi' })} />
            </Bidang>

            <Bidang label="Jenis kelamin" wajib>
              <select className={gayaInput} {...register('jenisKelamin')}>
                <option value="LAKI_LAKI">Laki-laki</option>
                <option value="PEREMPUAN">Perempuan</option>
              </select>
            </Bidang>

            <Bidang label="Tempat lahir" wajib galat={errors.tempatLahir?.message}>
              <input
                className={gayaInput}
                {...register('tempatLahir', { required: 'Tempat lahir wajib diisi' })}
              />
            </Bidang>

            <Bidang label="Tanggal lahir" wajib galat={errors.tanggalLahir?.message}>
              {/* min dan max membuat peramban ikut menolak tahun yang keliru,
                  sebelum permintaannya sempat dikirim ke server. */}
              <input
                type="date"
                min="1900-01-01"
                max={new Date().toISOString().slice(0, 10)}
                className={gayaInput}
                {...register('tanggalLahir', {
                  required: 'Tanggal lahir wajib diisi',
                  validate: (v) => {
                    const t = new Date(v).getFullYear();
                    if (t < 1900 || t > new Date().getFullYear()) {
                      return 'Tanggal lahir tidak masuk akal, periksa kembali tahunnya';
                    }
                    return true;
                  },
                })}
              />
            </Bidang>
          </div>
        </section>

        <section className="kartu space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Data sosial</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="Agama" wajib>
              <select className={gayaInput} {...register('agama', { required: true })}>
                <option value="">— pilih —</option>
                {AGAMA.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Bidang>

            <Bidang label="Pendidikan terakhir" wajib>
              <select className={gayaInput} {...register('pendidikan', { required: true })}>
                <option value="">— pilih —</option>
                {PENDIDIKAN.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </Bidang>

            {/* Daftar pekerjaan Dukcapil panjang dan sesekali berubah, jadi ini
                kolom teks bebas dengan daftar saran — bukan pilihan tertutup. */}
            <Bidang label="Pekerjaan" wajib galat={errors.pekerjaan?.message}>
              <input
                list="daftar-pekerjaan"
                className={gayaInput}
                {...register('pekerjaan', { required: 'Pekerjaan wajib diisi' })}
              />
              <datalist id="daftar-pekerjaan">
                {PEKERJAAN.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </Bidang>

            <Bidang label="Status perkawinan" wajib>
              <select className={gayaInput} {...register('statusKawin', { required: true })}>
                <option value="BELUM_KAWIN">Belum Kawin</option>
                <option value="KAWIN">Kawin</option>
                <option value="CERAI_HIDUP">Cerai Hidup</option>
                <option value="CERAI_MATI">Cerai Mati</option>
              </select>
            </Bidang>

            <Bidang label="Status hubungan dalam keluarga" wajib>
              <select className={gayaInput} {...register('hubunganKeluarga', { required: true })}>
                <option value="">— pilih —</option>
                {HUBUNGAN_KELUARGA.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </Bidang>

            <Bidang label="Kewarganegaraan" wajib>
              <select className={gayaInput} {...register('kewarganegaraan')}>
                <option value="WNI">WNI</option>
                <option value="WNA">WNA</option>
              </select>
            </Bidang>

            <Bidang label="Nama ayah">
              <input className={gayaInput} {...register('namaAyah')} />
            </Bidang>

            <Bidang label="Nama ibu">
              <input className={gayaInput} {...register('namaIbu')} />
            </Bidang>

            <Bidang label="Golongan darah">
              <select className={gayaInput} {...register('golonganDarah')}>
                <option value="">— tidak diisi —</option>
                {GOLONGAN_DARAH.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Bidang>

            <Bidang label="Nomor akta lahir">
              <input className={gayaInput} {...register('noAktaLahir')} />
            </Bidang>

            <Bidang label="Disabilitas">
              <input
                className={gayaInput}
                placeholder="Kosongkan bila tidak ada"
                {...register('disabilitas')}
              />
            </Bidang>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="rounded" {...register('pendatang')} />
                Penduduk pendatang
              </label>
            </div>
          </div>
        </section>

        <section className="kartu space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Alamat</h2>
          <p className="-mt-2 text-xs text-slate-500">
            Alamat menempel di Kartu Keluarga. Bila nomor KK sudah terdaftar, alamatnya
            mengikuti data yang ada.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Bidang label="Alamat" wajib galat={errors.alamat?.message}>
                <input
                  className={gayaInput}
                  {...register('alamat', { required: 'Alamat wajib diisi' })}
                />
              </Bidang>
            </div>

            <Bidang label="RT" wajib galat={errors.rt?.message}>
              <input
                placeholder="001"
                className={gayaInput}
                {...register('rt', { required: 'RT wajib diisi' })}
              />
            </Bidang>

            <Bidang label="RW" wajib galat={errors.rw?.message}>
              <input
                placeholder="001"
                className={gayaInput}
                {...register('rw', { required: 'RW wajib diisi' })}
              />
            </Bidang>

            <Bidang label="Dusun">
              <input className={gayaInput} {...register('dusun')} />
            </Bidang>
          </div>
        </section>

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="tombol-utama">
            {isSubmitting ? 'Menyimpan…' : 'Simpan'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/penduduk')}
            className="tombol-sekunder"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
