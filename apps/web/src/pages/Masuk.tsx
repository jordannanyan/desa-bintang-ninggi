import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loginWargaSchema, type LoginWargaInput } from '@desa/shared';
import { useAuth } from '../lib/auth';
import { pesanError } from '../lib/api';

/**
 * Login warga: NIK + PIN.
 *
 * NIK saja tidak cukup — nomor itu diketahui banyak pihak. PIN ditetapkan
 * warga sendiri saat aktivasi akun (kode aktivasi diberikan perangkat desa).
 */
export function Masuk() {
  const { loginWarga } = useAuth();
  const navigate = useNavigate();
  const lokasi = useLocation();
  const [galat, setGalat] = useState<string | null>(null);
  // Dikirim halaman aktivasi setelah akun berhasil dibuat.
  const kabar = (lokasi.state as { kabar?: string } | null)?.kabar;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginWargaInput>({ resolver: zodResolver(loginWargaSchema) });

  const onSubmit = async (data: LoginWargaInput) => {
    setGalat(null);
    try {
      await loginWarga(data.nik, data.pin);
      const tujuan = (lokasi.state as { dari?: string } | null)?.dari ?? '/warga';
      navigate(tujuan, { replace: true });
    } catch (err) {
      setGalat(pesanError(err, 'Tidak dapat masuk. Coba lagi.'));
    }
  };

  const gayaInput =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tracking-widest focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

  return (
    <div className="kontainer grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-sm">
        <h1 className="judul-halaman mb-1">Masuk</h1>
        <p className="mb-6 text-sm text-slate-500">
          Gunakan NIK dan PIN yang Anda buat saat aktivasi akun.
        </p>

        {kabar && (
          <div className="mb-4 rounded-lg border-l-4 border-desa-500 bg-desa-50 px-3 py-2 text-sm text-desa-900">
            {kabar}
          </div>
        )}

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
            <label htmlFor="pin" className="mb-1 block text-sm font-medium text-slate-700">
              PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoComplete="current-password"
              placeholder="6 digit PIN"
              {...register('pin')}
              className={gayaInput}
            />
            {errors.pin && <p className="mt-1 text-xs text-red-600">{errors.pin.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="tombol-utama w-full">
            {isSubmitting ? 'Memproses…' : 'Masuk'}
          </button>

          <p className="text-center text-xs text-slate-500">
            Belum punya akun?{' '}
            <Link to="/aktivasi" className="font-medium text-desa-600 hover:underline">
              Aktivasi di sini
            </Link>
          </p>
          <p className="text-center text-xs text-slate-400">
            Perangkat desa?{' '}
            <Link to="/masuk-perangkat" className="hover:underline">
              Masuk lewat halaman khusus
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
