import { Link, NavLink, Outlet } from 'react-router-dom';
import { SECTIONS } from '@desa/shared';
import { useAuth } from '../lib/auth';

/** Menu utama dibatasi agar tidak kepanjangan; sisanya masuk ke footer sitemap. */
const MENU_UTAMA = ['profil', 'pemerintahan', 'layanan', 'kependudukan', 'keuangan', 'pengaduan', 'umkm'];

export function PublicLayout() {
  const menu = SECTIONS.filter((s) => MENU_UTAMA.includes(s.id));
  const { pengguna } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="kontainer flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-desa-600 text-sm font-bold text-white">
              BN
            </span>
            <span className="text-sm font-bold leading-tight text-slate-900">
              Desa Bintang Ninggi I
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {menu.map((s) => (
              <NavLink
                key={s.id}
                to={s.route}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-desa-50 text-desa-700' : 'text-slate-600 hover:text-desa-700'
                  }`
                }
              >
                {s.title}
              </NavLink>
            ))}
          </nav>

          {pengguna ? (
            <Link
              to={pengguna.peran === 'WARGA' ? '/warga' : '/admin'}
              className="tombol-utama"
            >
              {pengguna.nama ?? 'Akun saya'}
            </Link>
          ) : (
            <Link to="/masuk" className="tombol-utama">
              Masuk
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="kontainer py-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Peta Situs
          </h2>
          <ul className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <Link to={s.route} className="text-slate-600 hover:text-desa-700">
                  {s.no}. {s.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xs text-slate-400">
            © {new Date().getFullYear()} Pemerintah Desa Bintang Ninggi I
          </p>
        </div>
      </footer>
    </div>
  );
}
