import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Prestasi {
  judul: string;
  tahun: number;
  keterangan?: string;
}

interface Potensi {
  judul: string;
  keterangan?: string;
}

interface Profil {
  namaDesa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string | null;
  luasWilayahKm: string | number | null;
  alamatKantor: string | null;
  sejarah: string | null;
  visi: string | null;
  misi: string[] | null;
  sambutanKades: string | null;
  prestasi: Prestasi[] | null;
  potensi: Potensi[] | null;
}

interface Perangkat {
  id: string;
  nama: string;
  jabatan: string;
  uraianTugas: string | null;
  fotoUrl: string | null;
}

interface Anggota {
  id: string;
  nama: string;
  jabatan: string;
  fotoUrl: string | null;
}

interface Lembaga {
  id: string;
  jenis: 'BPD' | 'LPM' | 'PKK' | 'KARANG_TARUNA' | 'BUMDES';
  nama: string;
  deskripsi: string | null;
  anggota: Anggota[];
}

interface Rw {
  id: string;
  nomor: string;
  ketua: string | null;
  rtList: { id: string; nomor: string; ketua: string | null }[];
}

/**
 * Daftar isi halaman. `id` dipakai dua kali: sebagai anchor di halaman ini,
 * dan sebagai tujuan pengalihan dari sub-rute /profil/<id> — sehingga alamat
 * seperti /profil/bpd tetap berujung pada isi yang benar.
 */
export const BAGIAN_PROFIL = [
  { id: 'sejarah', judul: 'Sejarah Desa' },
  { id: 'visi-misi', judul: 'Visi & Misi' },
  { id: 'kepala-desa', judul: 'Kepala Desa' },
  { id: 'struktur', judul: 'Struktur Organisasi' },
  { id: 'perangkat', judul: 'Perangkat Desa' },
  { id: 'bpd', judul: 'BPD' },
  { id: 'lpm', judul: 'LPM' },
  { id: 'pkk', judul: 'PKK' },
  { id: 'karang-taruna', judul: 'Karang Taruna' },
  { id: 'bumdes', judul: 'BumDes' },
  { id: 'rt-rw', judul: 'RT / RW' },
  { id: 'prestasi', judul: 'Prestasi Desa' },
  { id: 'potensi', judul: 'Potensi Desa' },
] as const;

const JENIS_LEMBAGA: Record<string, Lembaga['jenis']> = {
  bpd: 'BPD',
  lpm: 'LPM',
  pkk: 'PKK',
  'karang-taruna': 'KARANG_TARUNA',
  bumdes: 'BUMDES',
};

function Bagian({
  id,
  judul,
  children,
}: {
  id?: string;
  judul: string;
  children: React.ReactNode;
}) {
  return (
    // scroll-mt menyisakan ruang untuk bilah navigasi yang menempel di atas;
    // tanpanya judul bagian tertutup persis ketika anchor dituju.
    <section id={id} className="kartu scroll-mt-20">
      <h2 className="mb-3 text-lg font-bold text-slate-900">{judul}</h2>
      {children}
    </section>
  );
}

function Kosong({ apa }: { apa: string }) {
  return (
    <p className="text-sm text-slate-400">
      {apa} belum diisi. Perangkat desa dapat melengkapinya lewat Dashboard Perangkat → Profil Desa.
    </p>
  );
}

function KartuOrang({
  nama,
  jabatan,
  fotoUrl,
  catatan,
}: {
  nama: string;
  jabatan: string;
  fotoUrl?: string | null;
  catatan?: string | null;
}) {
  return (
    <li className="flex gap-3 rounded-lg border border-slate-200 p-3">
      {fotoUrl ? (
        <img src={fotoUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-desa-50 text-lg font-semibold text-desa-700">
          {nama.charAt(0)}
        </div>
      )}
      <div className="min-w-0">
        <p className="font-medium text-slate-900">{nama}</p>
        <p className="text-sm text-desa-700">{jabatan}</p>
        {catatan && <p className="mt-1 text-xs text-slate-500">{catatan}</p>}
      </div>
    </li>
  );
}

function BagianLembaga({ id, judul, data }: { id: string; judul: string; data?: Lembaga }) {
  return (
    <Bagian id={id} judul={judul}>
      {data ? (
        <>
          <p className="text-sm font-medium text-slate-800">{data.nama}</p>
          {data.deskripsi && (
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {data.deskripsi}
            </p>
          )}
          {data.anggota.length > 0 && (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {data.anggota.map((a) => (
                <KartuOrang key={a.id} nama={a.nama} jabatan={a.jabatan} fotoUrl={a.fotoUrl} />
              ))}
            </ul>
          )}
        </>
      ) : (
        <Kosong apa={`Data ${judul}`} />
      )}
    </Bagian>
  );
}

export function ProfilDesa() {
  const { hash } = useLocation();

  const { data: profil, isLoading } = useQuery({
    queryKey: ['profil'],
    queryFn: async () => (await api.get('/profil')).data.data as Profil | null,
  });

  const { data: perangkat } = useQuery({
    queryKey: ['perangkat'],
    queryFn: async () => (await api.get('/profil/perangkat')).data.data as Perangkat[],
  });

  const { data: lembaga } = useQuery({
    queryKey: ['lembaga'],
    queryFn: async () => (await api.get('/profil/lembaga')).data.data as Lembaga[],
  });

  const { data: wilayah } = useQuery({
    queryKey: ['wilayah'],
    queryFn: async () => (await api.get('/wilayah')).data.data as Rw[],
  });

  // Anchor baru bisa dituju setelah datanya termuat: saat React Router
  // berpindah, bagian tujuan sering belum ada di DOM.
  useEffect(() => {
    if (!hash || isLoading) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [hash, isLoading, perangkat, lembaga, wilayah]);

  if (isLoading) {
    return <div className="kontainer py-16 text-center text-sm text-slate-500">Memuat…</div>;
  }

  const cariLembaga = (kunci: string) => lembaga?.find((l) => l.jenis === JENIS_LEMBAGA[kunci]);
  const kades = perangkat?.find((p) => /kepala\s+desa/i.test(p.jabatan));

  return (
    <div className="kontainer max-w-4xl py-10">
      <h1 className="judul-halaman">Profil Desa</h1>
      {profil && (
        <p className="mt-1 text-sm text-slate-600">
          Desa {profil.namaDesa}, Kecamatan {profil.kecamatan}, Kabupaten {profil.kabupaten},{' '}
          {profil.provinsi}
        </p>
      )}

      {/* Daftar isi: halaman ini panjang, dan tiap bagiannya punya alamat
          sendiri yang bisa dibagikan. */}
      <nav className="mt-5 flex flex-wrap gap-1.5">
        {BAGIAN_PROFIL.map((b) => (
          <a
            key={b.id}
            href={`#${b.id}`}
            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-desa-50 hover:text-desa-800"
          >
            {b.judul}
          </a>
        ))}
      </nav>

      <div className="mt-6 space-y-4">
        <Bagian judul="Identitas Wilayah">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {[
              ['Nama Desa', profil?.namaDesa],
              ['Kecamatan', profil?.kecamatan],
              ['Kabupaten', profil?.kabupaten],
              ['Provinsi', profil?.provinsi],
              ['Kode Pos', profil?.kodePos],
              ['Luas Wilayah', profil?.luasWilayahKm ? `${profil.luasWilayahKm} km²` : null],
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

        <Bagian id="sejarah" judul="Sejarah Desa">
          {profil?.sejarah ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {profil.sejarah}
            </p>
          ) : (
            <Kosong apa="Sejarah desa" />
          )}
        </Bagian>

        <Bagian id="visi-misi" judul="Visi & Misi">
          {/* Penjagaan pada `profil` dulu, baru isinya. Bentuk sebelumnya
              (`profil?.visi || profil?.misi?.length`) bernilai angka 0 ketika
              visi kosong dan misi berupa array kosong — dan React mencetak
              angka 0 itu sebagai teks di tengah halaman. */}
          {profil && (profil.visi || profil.misi?.length) ? (
            <>
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
            </>
          ) : (
            <Kosong apa="Visi dan misi desa" />
          )}
        </Bagian>

        <Bagian id="kepala-desa" judul="Kepala Desa">
          {kades ? (
            <>
              <ul className="grid gap-3 sm:grid-cols-2">
                <KartuOrang
                  nama={kades.nama}
                  jabatan={kades.jabatan}
                  fotoUrl={kades.fotoUrl}
                  catatan={kades.uraianTugas}
                />
              </ul>
              {profil?.sambutanKades && (
                <div className="mt-4 border-l-4 border-desa-200 pl-4">
                  <h3 className="text-sm font-semibold text-slate-800">Sambutan</h3>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                    {profil.sambutanKades}
                  </p>
                </div>
              )}
            </>
          ) : (
            <Kosong apa="Data Kepala Desa" />
          )}
        </Bagian>

        <Bagian id="struktur" judul="Struktur Organisasi">
          {perangkat?.length ? (
            // Bagan disusun dari urutan jabatan yang sudah diatur perangkat
            // desa, bukan gambar terpisah yang harus diunggah ulang setiap
            // kali ada pergantian.
            <ol className="space-y-2">
              {perangkat.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-desa-50 text-xs font-semibold text-desa-700">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-900">{p.jabatan}</span>
                  <span className="ml-auto text-sm text-slate-500">{p.nama}</span>
                </li>
              ))}
            </ol>
          ) : (
            <Kosong apa="Struktur organisasi" />
          )}
        </Bagian>

        <Bagian id="perangkat" judul="Perangkat Desa">
          {perangkat?.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {perangkat.map((p) => (
                <KartuOrang
                  key={p.id}
                  nama={p.nama}
                  jabatan={p.jabatan}
                  fotoUrl={p.fotoUrl}
                  catatan={p.uraianTugas}
                />
              ))}
            </ul>
          ) : (
            <Kosong apa="Data perangkat desa" />
          )}
        </Bagian>

        <BagianLembaga id="bpd" judul="BPD" data={cariLembaga('bpd')} />
        <BagianLembaga id="lpm" judul="LPM" data={cariLembaga('lpm')} />
        <BagianLembaga id="pkk" judul="PKK" data={cariLembaga('pkk')} />
        <BagianLembaga
          id="karang-taruna"
          judul="Karang Taruna"
          data={cariLembaga('karang-taruna')}
        />
        <BagianLembaga id="bumdes" judul="BumDes" data={cariLembaga('bumdes')} />

        <Bagian id="rt-rw" judul="RT / RW">
          {wilayah?.length ? (
            <div className="space-y-3">
              {wilayah.map((rw) => (
                <div key={rw.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    RW {rw.nomor}
                    {rw.ketua && (
                      <span className="ml-2 font-normal text-slate-500">Ketua: {rw.ketua}</span>
                    )}
                  </p>
                  {rw.rtList.length > 0 && (
                    <ul className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                      {rw.rtList.map((rt) => (
                        <li key={rt.id} className="flex gap-2">
                          <span className="font-medium text-slate-700">RT {rt.nomor}</span>
                          <span className="text-slate-500">{rt.ketua ?? '—'}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Kosong apa="Data RT/RW" />
          )}
        </Bagian>

        <Bagian id="prestasi" judul="Prestasi Desa">
          {profil?.prestasi?.length ? (
            <ul className="space-y-2">
              {profil.prestasi.map((p, i) => (
                <li key={i} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-900">
                    {p.judul}{' '}
                    <span className="font-normal text-slate-500">({p.tahun})</span>
                  </p>
                  {p.keterangan && <p className="mt-1 text-sm text-slate-600">{p.keterangan}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <Kosong apa="Prestasi desa" />
          )}
        </Bagian>

        <Bagian id="potensi" judul="Potensi Desa">
          {profil?.potensi?.length ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {profil.potensi.map((p, i) => (
                <li key={i} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-900">{p.judul}</p>
                  {p.keterangan && <p className="mt-1 text-sm text-slate-600">{p.keterangan}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <Kosong apa="Potensi desa" />
          )}
        </Bagian>
      </div>
    </div>
  );
}
