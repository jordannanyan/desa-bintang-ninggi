import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { aktivasiWargaSchema, type AktivasiWargaInput } from '@desa/shared';
import { api, pesanError } from '../lib/api';

/**
 * Warga menukar kode aktivasi dari kantor desa menjadi PIN miliknya sendiri.
 *
 * PIN ditetapkan warga di halaman ini dan tidak pernah melewati tangan
 * perangkat desa — mereka hanya menerbitkan kode sekali pakai.
 */
export function Aktivasi() {
  const navigate = useNavigate();
  const [galat, setGalat] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AktivasiWargaInput>({ resolver: zodResolver(aktivasiWargaSchema) });

  const onSubmit = async (data: AktivasiWargaInput) => {
    setGalat(null);
    try {
      const res = await api.post('/auth/aktivasi', data);
      navigate('/masuk', {
        state: { kabar: `Akun ${res.data.data.nama} berhasil diaktifkan. Silakan masuk.` },
      });
    } catch (err) {
      setGalat(pesanError(err, 'Aktivasi gagal. Coba lagi.'));
    }
  };

  const gayaInput =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tracking-widest focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

  return (
    <div className="kontainer grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-sm">
        <h1 className="judul-halaman mb-1">Aktivasi Akun</h1>
        <p className="mb-6 text-sm text-slate-500">
          Minta kode aktivasi ke kantor desa, lalu tetapkan PIN Anda sendiri di sini.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="kartu space-y-4" noValidate>
          {galat && (
            <div
              role="alert"
              className="rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {galat}
            </div>
          )}

          <div>
            <label htmlFor="nik" className="mb-1 block text-sm font-medium text-slate-700">
              NIK
            </label>
            <input
              id="nik"
              inputMode="numeric"
              maxLength={16}
              autoComplete="username"
              placeholder="16 digit NIK"
              {...register('nik')}
              className={gayaInput}
            />
            {errors.nik && <p className="mt-1 text-xs text-red-600">{errors.nik.message}</p>}
          </div>

          <div>
            <label
              htmlFor="kodeAktivasi"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Kode aktivasi
            </label>
            <input
              id="kodeAktivasi"
              autoCapitalize="characters"
              placeholder="dari kantor desa"
              {...register('kodeAktivasi')}
              className={`${gayaInput} uppercase`}
            />
            {errors.kodeAktivasi && (
              <p className="mt-1 text-xs text-red-600">{errors.kodeAktivasi.message}</p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label htmlFor="pin" className="mb-1 block text-sm font-medium text-slate-700">
              Buat PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoComplete="new-password"
              placeholder="6 digit angka"
              {...register('pin')}
              className={gayaInput}
            />
            {errors.pin && <p className="mt-1 text-xs text-red-600">{errors.pin.message}</p>}
            <p className="mt-1 text-xs text-slate-400">
              PIN ini hanya Anda yang tahu. Perangkat desa tidak bisa melihatnya.
            </p>
          </div>

          <div>
            <label
              htmlFor="konfirmasiPin"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Ulangi PIN
            </label>
            <input
              id="konfirmasiPin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoComplete="new-password"
              {...register('konfirmasiPin')}
              className={gayaInput}
            />
            {errors.konfirmasiPin && (
              <p className="mt-1 text-xs text-red-600">{errors.konfirmasiPin.message}</p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="tombol-utama w-full">
            {isSubmitting ? 'Memproses…' : 'Aktifkan Akun'}
          </button>

          <p className="text-center text-xs text-slate-500">
            Sudah punya akun?{' '}
            <Link to="/masuk" className="font-medium text-desa-600 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </form>

        <div className="mt-4 rounded-lg bg-slate-100 p-4 text-xs text-slate-600">
          <b>Belum punya kode?</b> Datang ke kantor desa dengan membawa KTP. Perangkat desa
          akan menerbitkan kode aktivasi yang berlaku 7 hari.
        </div>
      </div>
    </div>
  );
}
