import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Peran } from '@desa/shared';
import { useAuth } from '../lib/auth';

interface Props {
  /** Peran yang boleh masuk. Kosong berarti cukup sudah login. */
  peran?: Peran[];
  /** Halaman login yang dituju bila belum masuk. */
  halamanMasuk?: string;
}

/**
 * Penjaga di sisi frontend. Ini semata demi kenyamanan — pengguna diarahkan
 * ke halaman login alih-alih melihat layar error. Penjagaan yang sebenarnya
 * tetap di backend (`wajibLogin` + `wajibPeran`), karena apa pun di browser
 * bisa diakali.
 */
export function RuteTerproteksi({ peran, halamanMasuk = '/masuk' }: Props) {
  const { pengguna, memuat } = useAuth();
  const lokasi = useLocation();

  if (memuat) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        Memuat…
      </div>
    );
  }

  if (!pengguna) {
    return <Navigate to={halamanMasuk} state={{ dari: lokasi.pathname }} replace />;
  }

  if (peran && !peran.includes(pengguna.peran)) {
    return (
      <div className="kontainer py-20 text-center">
        <h1 className="judul-halaman mb-2">Akses ditolak</h1>
        <p className="text-slate-600">
          Halaman ini hanya untuk {peran.join(' atau ').toLowerCase()}.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
