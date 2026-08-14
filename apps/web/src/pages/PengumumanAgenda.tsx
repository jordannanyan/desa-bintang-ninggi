import { useQuery } from '@tanstack/react-query';
import { LABEL_KATEGORI_AGENDA } from '@desa/shared';
import { api } from '../lib/api';

const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long' });
const waktu = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

export function Pengumuman() {
  const { data, isLoading } = useQuery({
    queryKey: ['pengumuman'],
    queryFn: async () =>
      (await api.get('/pengumuman')).data as {
        data: Array<{
          id: string;
          judul: string;
          isi: string;
          penting: boolean;
          mulai: string;
          selesai: string | null;
          berkasUrl: string | null;
        }>;
      },
  });

  return (
    <div className="kontainer max-w-3xl py-10">
      <h1 className="judul-halaman">Pengumuman</h1>
      <p className="mt-1 text-sm text-slate-600">
        Pengumuman resmi yang masih berlaku. Yang sudah lewat masa berlakunya tidak
        ditampilkan.
      </p>

      {isLoading && <p className="mt-8 text-sm text-slate-500">Memuat…</p>}

      {data?.data.length === 0 && (
        <p className="mt-8 text-sm text-slate-500">Tidak ada pengumuman yang berlaku saat ini.</p>
      )}

      <ul className="mt-8 space-y-4">
        {data?.data.map((p) => (
          <li
            key={p.id}
            className={`kartu ${p.penting ? 'border-l-4 border-l-amber-400' : ''}`}
          >
            {p.penting && (
              <span className="mb-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                Penting
              </span>
            )}
            <h2 className="font-semibold text-slate-900">{p.judul}</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Berlaku {tanggal(p.mulai)}
              {p.selesai && ` – ${tanggal(p.selesai)}`}
            </p>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{p.isi}</p>
            {p.berkasUrl && (
              <a
                href={p.berkasUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-desa-600 hover:underline"
              >
                Unduh lampiran
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Agenda() {
  const { data, isLoading } = useQuery({
    queryKey: ['agenda'],
    queryFn: async () =>
      (await api.get('/agenda')).data as {
        data: Array<{
          id: string;
          judul: string;
          kategori: keyof typeof LABEL_KATEGORI_AGENDA;
          deskripsi: string | null;
          mulai: string;
          selesai: string | null;
          lokasi: string | null;
          penyelenggara: string | null;
        }>;
      },
  });

  return (
    <div className="kontainer max-w-3xl py-10">
      <h1 className="judul-halaman">Agenda Kegiatan</h1>
      <p className="mt-1 text-sm text-slate-600">Kegiatan desa yang akan datang.</p>

      {isLoading && <p className="mt-8 text-sm text-slate-500">Memuat…</p>}

      {data?.data.length === 0 && (
        <p className="mt-8 text-sm text-slate-500">Belum ada agenda yang dijadwalkan.</p>
      )}

      <ul className="mt-8 space-y-3">
        {data?.data.map((a) => {
          const mulai = new Date(a.mulai);
          return (
            <li key={a.id} className="kartu flex gap-4">
              {/* Tanggal sebagai blok kalender: yang dicari pembaca agenda
                  adalah "kapan", jadi itu yang paling menonjol. */}
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-desa-50 text-desa-800">
                <span className="text-lg font-bold leading-none">{mulai.getDate()}</span>
                <span className="text-xs">
                  {mulai.toLocaleDateString('id-ID', { month: 'short' })}
                </span>
              </div>

              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900">{a.judul}</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {waktu(a.mulai)}
                  {a.selesai && ` – ${waktu(a.selesai)}`}
                  {a.lokasi && ` · ${a.lokasi}`}
                </p>
                <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {LABEL_KATEGORI_AGENDA[a.kategori]}
                </span>
                {a.deskripsi && (
                  <p className="mt-2 text-sm text-slate-600">{a.deskripsi}</p>
                )}
                {a.penyelenggara && (
                  <p className="mt-1 text-xs text-slate-400">
                    Penyelenggara: {a.penyelenggara}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
