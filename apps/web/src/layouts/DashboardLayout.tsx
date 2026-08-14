import { Link, NavLink, Outlet } from 'react-router-dom';
import type { SectionItem } from '@desa/shared';

interface Props {
  judul: string;
  basis: string;
  menu: SectionItem[];
}

/** Kerangka dashboard, dipakai bersama oleh Perangkat Desa dan Warga. */
export function DashboardLayout({ judul, basis, menu }: Props) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <Link to="/" className="text-sm font-bold text-slate-900">
            {judul}
          </Link>
        </div>
        <nav className="space-y-1 p-3">
          {menu.map((item) => (
            <NavLink
              key={item.label}
              to={`${basis}${item.path ?? ''}`}
              end={!item.path}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-desa-50 font-medium text-desa-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <span className="text-sm font-semibold text-slate-700">{judul}</span>
          <button type="button" className="tombol-sekunder text-xs">
            Keluar
          </button>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
