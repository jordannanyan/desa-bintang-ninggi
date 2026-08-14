import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { loginWargaSchema, type LoginWargaInput } from '@desa/shared';

/**
 * Login warga: NIK + PIN.
 *
 * NIK saja tidak cukup — nomor itu diketahui banyak pihak. PIN ditetapkan
 * warga sendiri saat aktivasi akun (kode aktivasi diberikan perangkat desa).
 */
export function Masuk() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginWargaInput>({ resolver: zodResolver(loginWargaSchema) });

  const onSubmit = async (_data: LoginWargaInput) => {
    // TODO: POST /api/auth/login lalu simpanToken(res.data.accessToken)
  };

  return (
    <div className="kontainer grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-sm">
        <h1 className="judul-halaman mb-1">Masuk</h1>
        <p className="mb-6 text-sm text-slate-500">
          Gunakan NIK dan PIN yang Anda buat saat aktivasi akun.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="kartu space-y-4">
          <div>
            <label htmlFor="nik" className="mb-1 block text-sm font-medium text-slate-700">
              NIK
            </label>
            <input
              id="nik"
              inputMode="numeric"
              maxLength={16}
              autoComplete="username"
              {...register('nik')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500"
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
              {...register('pin')}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500"
            />
            {errors.pin && <p className="mt-1 text-xs text-red-600">{errors.pin.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="tombol-utama w-full">
            Masuk
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
