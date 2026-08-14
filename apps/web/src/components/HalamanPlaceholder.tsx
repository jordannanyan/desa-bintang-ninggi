import { Link } from 'react-router-dom';
import type { Section, SectionItem } from '@desa/shared';

interface Props {
  judul: string;
  ringkasan: string;
  fase: number;
  items: SectionItem[];
  route: string;
  catatan?: string;
}

/**
 * Halaman kerangka untuk section yang isinya belum digarap.
 *
 * Bukan sekadar "coming soon": halaman ini menampilkan seluruh sub-item yang
 * direncanakan beserta fasenya, sehingga bisa langsung dipakai sebagai bahan
 * storyboard dan diskusi dengan pihak desa sebelum satu baris fitur pun ditulis.
 */
export function HalamanPlaceholder({ judul, ringkasan, fase, items, route, catatan }: Props) {
  return (
    <div className="kontainer py-10">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="judul-halaman">{judul}</h1>
        <span className="rounded-full bg-desa-100 px-3 py-1 text-xs font-semibold text-desa-800">
          Fase {fase}
        </span>
      </div>

      <p className="mb-8 max-w-3xl text-slate-600">{ringkasan}</p>

      {catatan && (
        <div className="mb-8 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          {catatan}
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Isi halaman yang direncanakan
      </h2>

      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.label} className="kartu">
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium text-slate-800">{item.label}</span>
              {item.path && (
                <Link
                  to={`${route}${item.path}`.replace('//', '/')}
                  className="shrink-0 text-xs font-medium text-desa-600 hover:underline"
                >
                  buka
                </Link>
              )}
            </div>
            {item.note && <p className="mt-2 text-xs text-slate-500">{item.note}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const dariSection = (section: Section) => (
  <HalamanPlaceholder
    judul={section.title}
    ringkasan={section.summary}
    fase={section.phase}
    items={section.items}
    route={section.route}
    catatan={section.note}
  />
);
