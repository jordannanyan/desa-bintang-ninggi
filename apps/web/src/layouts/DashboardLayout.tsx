import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { SectionItem } from '@desa/shared';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

interface Props {
  judul: string;
  basis: string;
  menu: SectionItem[];
}

/** Lencana angka di samping menu — hanya muncul bila ada yang menunggu. */
function Lencana({ jumlah }: { jumlah: number }) {
  if (!jumlah) return null;
  return (
    <span className="ml-auto shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-amber-800">
      {jumlah > 99 ? '99+' : jumlah}
    </span>
  );
}

/**
 * Angka antrean untuk lencana menu.
 *
 * Dibaca dari ringkasan yang sudah dipakai beranda dashboard, jadi tidak ada
 * permintaan tambahan: TanStack Query membagikan cache yang sama.
 */
function useLencana(basis: string) {
  const perangkat = basis === '/admin';

  const { data } = useQuery({
    queryKey: perangkat ? ['ringkasan-admin'] : ['ringkasan-warga'],
    refetchInterval: 60_000,
    queryFn: async () =>
      (await api.get(perangkat ? '/statistik' : '/saya/ringkasan')).data.data as Record<
        string,
        number
      >,
  });

  if (!data) return {};
  return perangkat
    ? {
        '/surat': data.suratMenunggu,
        '/pengaduan': data.pengaduanBaru,
        '/tagihan': data.tagihanBelum,
      }
    : {
        '/surat': data.suratSiapDiambil,
        '/pengaduan': data.pengaduanAktif,
        '/tagihan': data.tagihanBelum,
        '/pesanan': data.pesananAktif,
      };
}

function Menu({
  basis,
  menu,
  lencana,
  onPilih,
}: {
  basis: string;
  menu: SectionItem[];
  lencana: Record<string, number | undefined>;
  onPilih?: () => void;
}) {
  // Urutan kelompok mengikuti urutan kemunculan pertamanya di registry,
  // supaya menu dan storyboard tidak pernah berbeda urutan.
  const grup: { nama: string; item: SectionItem[] }[] = [];
  for (const item of menu) {
    const nama = item.grup ?? 'Lainnya';
    const ada = grup.find((g) => g.nama === nama);
    if (ada) ada.item.push(item);
    else grup.push({ nama, item: [item] });
  }

  return (
    <nav className="space-y-4 p-3">
      <NavLink
        to={basis}
        end
        onClick={onPilih}
        className={({ isActive }) =>
          `block rounded-md px-3 py-2 text-sm transition ${
            isActive ? 'bg-desa-50 font-medium text-desa-700' : 'text-slate-600 hover:bg-slate-50'
          }`
        }
      >
        Beranda
      </NavLink>

      {grup.map((g) => (
        <div key={g.nama}>
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {g.nama}
          </p>
          <div className="space-y-0.5">
            {g.item.map((item) => (
              <NavLink
                key={item.label}
                to={`${basis}${item.path ?? ''}`}
                end={!item.path}
                onClick={onPilih}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
                    isActive
                      ? 'bg-desa-50 font-medium text-desa-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <span className="truncate">{item.label}</span>
                <Lencana jumlah={lencana[item.path ?? ''] ?? 0} />
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

/** Kerangka dashboard, dipakai bersama oleh Perangkat Desa dan Warga. */
export function DashboardLayout({ judul, basis, menu }: Props) {
  const { pengguna, logout } = useAuth();
  const navigate = useNavigate();
  const lokasi = useLocation();
  const [laciTerbuka, setLaciTerbuka] = useState(false);
  const lencana = useLencana(basis);

  // Laci ditutup setiap kali halaman berganti: di ponsel ia menutupi seluruh
  // layar, dan membiarkannya terbuka berarti halaman baru tidak terlihat.
  useEffect(() => setLaciTerbuka(false), [lokasi.pathname]);

  const keluar = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const judulHalaman =
    menu.find((m) => m.path && lokasi.pathname === `${basis}${m.path}`)?.label ?? judul;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <Link to="/" className="text-sm font-bold text-slate-900 hover:text-desa-700">
            {judul}
          </Link>
        </div>
        <Menu basis={basis} menu={menu} lencana={lencana} />
      </aside>

      {/* Laci ponsel. Sebelumnya tidak ada sama sekali: menu hanya tampil pada
          lebar lg ke atas, sehingga dashboard praktis tidak bisa dipakai dari
          ponsel — padahal itulah perangkat yang paling sering dipakai warga. */}
      {laciTerbuka && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setLaciTerbuka(false)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <Link to="/" className="text-sm font-bold text-slate-900">
                {judul}
              </Link>
              <button
                type="button"
                onClick={() => setLaciTerbuka(false)}
                className="text-sm text-slate-500"
              >
                Tutup
              </button>
            </div>
            <Menu
              basis={basis}
              menu={menu}
              lencana={lencana}
              onPilih={() => setLaciTerbuka(false)}
            />
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setLaciTerbuka(true)}
              aria-label="Buka menu"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-300 text-slate-700 lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <span className="truncate text-sm font-semibold text-slate-700">{judulHalaman}</span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {pengguna && (
              <span className="hidden text-xs text-slate-500 sm:inline">
                {pengguna.nama} &middot; {pengguna.peran.toLowerCase()}
              </span>
            )}
            <button type="button" onClick={keluar} className="tombol-sekunder text-xs">
              Keluar
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
