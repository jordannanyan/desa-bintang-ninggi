import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginPerangkatSchema, type LoginPerangkatInput } from '@desa/shared';
import { useAuth } from '../lib/auth';
import { pesanError } from '../lib/api';

/** Login perangkat desa dan admin — username + password, terpisah dari warga. */
export function MasukPerangkat() {
  const { loginPerangkat } = useAuth();
  const navigate = useNavigate();
  const [galat, setGalat] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginPerangkatInput>({ resolver: zodResolver(loginPerangkatSchema) });

  const onSubmit = async (data: LoginPerangkatInput) => {
    setGalat(null);
    try {
      await loginPerangkat(data.username, data.password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setGalat(pesanError(err, 'Tidak dapat masuk. Coba lagi.'));
    }
  };

  const gayaInput =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

  return (
    <div className="kontainer grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-sm">
        <h1 className="judul-halaman mb-1">Masuk Perangkat Desa</h1>
        <p className="mb-6 text-sm text-slate-500">
          Halaman ini khusus perangkat desa dan admin.
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
            <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
              Nama pengguna
            </label>
            <input
              id="username"
              autoComplete="username"
              {...register('username')}
              className={gayaInput}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Kata sandi
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className={gayaInput}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="tombol-utama w-full">
            {isSubmitting ? 'Memproses…' : 'Masuk'}
          </button>

          <p className="text-center text-xs text-slate-400">
            Warga desa?{' '}
            <Link to="/masuk" className="hover:underline">
              Masuk dengan NIK dan PIN
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
