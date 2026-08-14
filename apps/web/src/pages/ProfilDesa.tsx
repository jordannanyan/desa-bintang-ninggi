import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Profil {
  namaDesa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string | null;
  luasWilayahKm: string | null;
  sejarah: string | null;
  visi: string | null;
  misi: string[] | null;
  alamatKantor: string | null;
}

interface Perangkat {
  id: string;
  nama: string;
  jabatan: string;
  uraianTugas: string | null;
  fotoUrl: string | null;
}

/** Bagian yang hanya ditampilkan bila isinya sudah diisi perangkat desa. */
function Bagian({ judul, children }: { judul: string; children: React.ReactNode }) {
  return (
    <section className="kartu">
      <h2 className="mb-3 text-lg font-bold text-slate-900">{judul}</h2>
      {children}
    </section>
  );
}

export function ProfilDesa() {
  const { data: profil, isLoading } = useQuery({
    queryKey: ['profil'],
    queryFn: async () => (await api.get('/profil')).data.data as Profil | null,
  });

  const { data: perangkat } = useQuery({
    queryKey: ['perangkat'],
    queryFn: async () => (await api.get('/profil/perangkat')).data.data as Perangkat[],
  });

  if (isLoading) {
    return <div className="kontainer py-16 text-center text-sm text-slate-500">Memuat…</div>;
  }

  return (
    <div className="kontainer max-w-4xl py-10">
      <h1 className="judul-halaman">Profil Desa</h1>
      {profil && (
        <p className="mt-1 text-sm text-slate-600">
          Desa {profil.namaDesa}, Kecamatan {profil.kecamatan}, Kabupaten {profil.kabupaten},{' '}
          {profil.provinsi}
        </p>
      )}

      <div className="mt-8 space-y-4">
        <Bagian judul="Identitas Wilayah">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ['Nama Desa', profil?.namaDesa],
              ['Kecamatan', profil?.kecamatan],
              ['Kabupaten', profil?.kabupaten],
              ['Provinsi', profil?.provinsi],
              ['Kode Pos', profil?.kodePos],
              [
                'Luas Wilayah',
                profil?.luasWilayahKm ? `${profil.luasWilayahKm} km²` : null,
              ],
              ['Alamat Kantor', profil?.alamatKantor],
            ]
              .filter(([, v]) => v)
              .map(([l, v]) => (
                <div key={l as string} className="flex gap-3">
                  <dt className="w-32 shrink-0 text-slate-500">{l}</dt>
                  <dd className="text-slate-800">{v}</dd>
                </div>
              ))}
          </dl>
        </Bagian>

        {profil?.sejarah && (
          <Bagian judul="Sejarah Desa">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {profil.sejarah}
            </p>
          </Bagian>
        )}

        {(profil?.visi || profil?.misi?.length) && (
          <Bagian judul="Visi & Misi">
            {profil.visi && (
              <>
                <h3 className="text-sm font-semibold text-slate-800">Visi</h3>
                <p className="mt-1 whitespace-pre-line text-sm italic text-slate-700">
                  {profil.visi}
                </p>
              </>
            )}
            {profil.misi?.length ? (
              <>
                <h3 className="mt-4 text-sm font-semibold text-slate-800">Misi</h3>
                <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-700">
                  {profil.misi.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ol>
              </>
            ) : null}
          </Bagian>
        )}

        <Bagian judul="Perangkat Desa">
          {perangkat?.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {perangkat.map((p) => (
                <li key={p.id} className="flex gap-3 rounded-lg border border-slate-200 p-3">
                  {p.fotoUrl ? (
                    <img
                      src={p.fotoUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-desa-50 text-lg font-semibold text-desa-700">
                      {p.nama.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{p.nama}</p>
                    <p className="text-sm text-desa-700">{p.jabatan}</p>
                    {p.uraianTugas && (
                      <p className="mt-1 text-xs text-slate-500">{p.uraianTugas}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">
              Data perangkat desa belum diisi.
            </p>
          )}
        </Bagian>

        {!profil?.sejarah && !profil?.visi && (
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
            Sejarah, visi, dan misi desa belum diisi. Perangkat desa dapat melengkapinya lewat
            Dashboard Perangkat → Profil Desa.
          </div>
        )}
      </div>
    </div>
  );
}
