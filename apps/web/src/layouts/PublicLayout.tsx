import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { SECTIONS } from '@desa/shared';
import { useAuth } from '../lib/auth';

/** Menu utama dibatasi agar tidak kepanjangan; sisanya masuk ke footer sitemap. */
const MENU_UTAMA = ['profil', 'pemerintahan', 'layanan', 'kependudukan', 'keuangan', 'pengaduan', 'umkm'];

export function PublicLayout() {
  const menu = SECTIONS.filter((s) => MENU_UTAMA.includes(s.id));
  const { pengguna } = useAuth();
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const lokasi = useLocation();

  // Menu ditutup setiap berpindah halaman. Tanpa ini, menu tetap terbuka
  // menutupi halaman baru setelah pengunjung menekan salah satu tautannya.
  useEffect(() => setMenuTerbuka(false), [lokasi.pathname]);

  const tautanAkun = pengguna ? (
    <Link to={pengguna.peran === 'WARGA' ? '/warga' : '/admin'} className="tombol-utama">
      {pengguna.nama ?? 'Akun saya'}
    </Link>
  ) : (
    <Link to="/masuk" className="tombol-utama">
      Masuk
    </Link>
  );

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

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">{tautanAkun}</div>

            {/* Mayoritas warga membuka situs ini dari ponsel, dan di lebar itu
                menu utama disembunyikan. Tanpa tombol ini mereka hanya bisa
                berpindah halaman lewat peta situs di kaki halaman. */}
            <button
              type="button"
              onClick={() => setMenuTerbuka((v) => !v)}
              aria-expanded={menuTerbuka}
              aria-controls="menu-ponsel"
              aria-label={menuTerbuka ? 'Tutup menu' : 'Buka menu'}
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-300 text-slate-700 lg:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                {menuTerbuka ? (
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M3 6h14M3 10h14M3 14h14"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuTerbuka && (
          <nav
            id="menu-ponsel"
            className="border-t border-slate-200 bg-white lg:hidden"
          >
            <div className="kontainer py-3">
              <ul className="space-y-1">
                {menu.map((s) => (
                  <li key={s.id}>
                    <NavLink
                      to={s.route}
                      className={({ isActive }) =>
                        `block rounded-md px-3 py-2.5 text-sm font-medium ${
                          isActive ? 'bg-desa-50 text-desa-700' : 'text-slate-700'
                        }`
                      }
                    >
                      {s.title}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <Link
                    to="/verifikasi"
                    className="block rounded-md px-3 py-2.5 text-sm font-medium text-slate-700"
                  >
                    Verifikasi Surat
                  </Link>
                </li>
              </ul>
              <div className="mt-3 border-t border-slate-100 pt-3 sm:hidden">{tautanAkun}</div>
            </div>
          </nav>
        )}
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
