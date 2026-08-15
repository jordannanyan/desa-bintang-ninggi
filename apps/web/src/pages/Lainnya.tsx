import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  JENIS_LOWONGAN,
  LABEL_KATEGORI_AGENDA,
  LABEL_LOWONGAN,
  formatRupiah,
} from '@desa/shared';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

const tanggal = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '—';

// ─────────────────────────────────────────────
// LOWONGAN KERJA
// ─────────────────────────────────────────────

export function Lowongan() {
  const [jenis, setJenis] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['lowongan', jenis],
    queryFn: async () =>
      (await api.get('/lowongan', { params: { jenis: jenis || undefined } })).data.data as Array<{
        id: string;
        jenis: keyof typeof LABEL_LOWONGAN;
        judul: string;
        penyelenggara: string;
        deskripsi: string;
        persyaratan: string | null;
        lokasi: string | null;
        imbalan: string | null;
        kontak: string | null;
        batasLamar: string | null;
        kedaluwarsa: boolean;
      }>,
  });

  return (
    <div className="kontainer max-w-3xl py-10">
      <h1 className="judul-halaman">Lowongan Kerja</h1>
      <p className="mt-1 text-sm text-slate-600">
        Lowongan, magang, dan pelatihan kerja yang masuk ke kantor desa.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {['', ...JENIS_LOWONGAN].map((j) => (
          <button
            key={j || 'semua'}
            type="button"
            onClick={() => setJenis(j)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              jenis === j
                ? 'bg-desa-600 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {j ? LABEL_LOWONGAN[j as keyof typeof LABEL_LOWONGAN] : 'Semua'}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-6 text-sm text-slate-500">Memuat…</p>}
      {data?.length === 0 && (
        <div className="mt-6 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Belum ada lowongan yang diumumkan.
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {data?.map((l) => (
          <li key={l.id} className={`kartu ${l.kedaluwarsa ? 'opacity-60' : ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {LABEL_LOWONGAN[l.jenis]}
                </span>
                <h2 className="mt-1.5 font-semibold text-slate-900">{l.judul}</h2>
                <p className="text-xs text-slate-500">
                  {l.penyelenggara}
                  {l.lokasi && ` · ${l.lokasi}`}
                  {l.imbalan && ` · ${l.imbalan}`}
                </p>
              </div>
              {/* Yang sudah lewat tetap ditampilkan dan ditandai, supaya warga
                  tahu lowongan itu pernah ada dan tidak terus menanyakannya. */}
              {l.kedaluwarsa && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  sudah lewat
                </span>
              )}
            </div>

            <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{l.deskripsi}</p>
            {l.persyaratan && (
              <>
                <p className="mt-3 text-xs font-medium text-slate-800">Persyaratan</p>
                <p className="whitespace-pre-line text-sm text-slate-700">{l.persyaratan}</p>
              </>
            )}
            <p className="mt-3 text-xs text-slate-400">
              Batas lamar: {tanggal(l.batasLamar)}
              {l.kontak && ` · Kontak: ${l.kontak}`}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────
// BANTUAN SOSIAL
// ─────────────────────────────────────────────

export function BantuanSosial() {
  const { pengguna } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['bantuan-sosial'],
    queryFn: async () =>
      (await api.get('/bantuan-sosial')).data.data as Array<{
        id: string;
        kode: string;
        nama: string;
        deskripsi: string | null;
        tahun: number;
        aktif: boolean;
        jumlahPenerima: number;
      }>,
  });

  return (
    <div className="kontainer max-w-3xl py-10">
      <h1 className="judul-halaman">Bantuan Sosial</h1>
      <p className="mt-1 text-sm text-slate-600">
        Program bantuan yang berjalan di Desa Bintang Ninggi I.
      </p>

      <div className="mt-5 rounded-lg bg-slate-100 p-4 text-sm text-slate-700">
        <b>Ingin tahu status bantuan Anda?</b>{' '}
        {pengguna ? (
          <Link to="/warga/bantuan" className="text-desa-700 underline">
            Buka halaman Status Bantuan
          </Link>
        ) : (
          <Link to="/masuk" state={{ dari: '/warga/bantuan' }} className="text-desa-700 underline">
            Masuk dengan NIK dan PIN Anda
          </Link>
        )}
        .
        {/* Dijelaskan alasannya, bukan sekadar dipaksa login. */}
        <span className="mt-1 block text-xs text-slate-500">
          Status penerima hanya bisa dilihat pemilik akunnya sendiri. Bila bisa dicek dengan
          mengetik NIK siapa pun, daftar penerima bantuan seluruh desa akan mudah disusun orang
          lain.
        </span>
      </div>

      {isLoading && <p className="mt-6 text-sm text-slate-500">Memuat…</p>}
      {data?.length === 0 && (
        <div className="mt-6 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Belum ada program bantuan yang didaftarkan.
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {data?.map((p) => (
          <li key={p.id} className="kartu">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-desa-50 px-2 py-0.5 text-xs font-medium text-desa-700">
                    {p.kode}
                  </span>
                  <span className="text-xs text-slate-400">{p.tahun}</span>
                  {!p.aktif && (
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      tidak aktif
                    </span>
                  )}
                </div>
                <h2 className="mt-1.5 font-medium text-slate-900">{p.nama}</h2>
                {p.deskripsi && <p className="mt-1 text-sm text-slate-600">{p.deskripsi}</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold text-slate-900">{p.jumlahPenerima}</p>
                <p className="text-xs text-slate-400">penerima</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StatusBantuan() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['bantuan-saya'],
    queryFn: async () => (await api.get('/bantuan-sosial/saya')).data.data,
  });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Status Bantuan Saya</h1>
      <p className="mb-5 text-sm text-slate-500">
        Diambil dari data akun Anda sendiri, bukan dari NIK yang diketik.
      </p>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}
      {isError && (
        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Akun Anda belum tertaut ke data penduduk. Hubungi kantor desa.
        </div>
      )}

      {data?.length === 0 && (
        <div className="kartu text-center text-sm text-slate-500">
          Anda belum terdaftar sebagai penerima bantuan apa pun.
        </div>
      )}

      <ul className="space-y-3">
        {data?.map(
          (b: {
            id: string;
            program: string;
            kode: string;
            periode: string;
            nominal: number | null;
            status: string;
            dicairkanPada: string | null;
          }) => (
            <li key={b.id} className="kartu flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{b.program}</p>
                <p className="text-xs text-slate-400">
                  {b.kode} · periode {b.periode}
                </p>
                {b.nominal && (
                  <p className="mt-1 font-semibold text-slate-800">{formatRupiah(b.nominal)}</p>
                )}
              </div>
              <div className="text-right">
                <span className="rounded-full bg-desa-50 px-3 py-1 text-xs font-medium text-desa-800">
                  {b.status.toLowerCase()}
                </span>
                {b.dicairkanPada && (
                  <p className="mt-1 text-xs text-slate-400">
                    cair {tanggal(b.dicairkanPada)}
                  </p>
                )}
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────
// KALENDER DESA
// ─────────────────────────────────────────────

export function KalenderDesa() {
  const [lampau, setLampau] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['agenda', lampau],
    queryFn: async () =>
      (await api.get('/agenda', { params: { lampau } })).data.data as Array<{
        id: string;
        judul: string;
        kategori: keyof typeof LABEL_KATEGORI_AGENDA;
        deskripsi: string | null;
        mulai: string;
        lokasi: string | null;
        penyelenggara: string | null;
      }>,
  });

  // Dikelompokkan per bulan supaya kalender terbaca sebagai rencana,
  // bukan daftar panjang tanpa jeda.
  const perBulan = new Map<string, typeof data>();
  for (const a of data ?? []) {
    const kunci = new Date(a.mulai).toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
    perBulan.set(kunci, [...(perBulan.get(kunci) ?? []), a] as typeof data);
  }

  return (
    <div className="kontainer max-w-3xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="judul-halaman">Kalender Desa</h1>
          <p className="mt-1 text-sm text-slate-600">
            Musyawarah desa, posyandu, gotong royong, dan kegiatan lainnya.
          </p>
        </div>
        <button type="button" onClick={() => setLampau((v) => !v)} className="tombol-sekunder text-xs">
          {lampau ? 'Lihat yang akan datang' : 'Lihat yang sudah lewat'}
        </button>
      </div>

      {isLoading && <p className="mt-6 text-sm text-slate-500">Memuat…</p>}
      {data?.length === 0 && (
        <div className="mt-6 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          {lampau ? 'Belum ada kegiatan yang tercatat.' : 'Belum ada kegiatan terjadwal.'}
        </div>
      )}

      {[...perBulan.entries()].map(([bulan, daftar]) => (
        <section key={bulan} className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {bulan}
          </h2>
          <ul className="space-y-3">
            {daftar?.map((a) => {
              const d = new Date(a.mulai);
              return (
                <li key={a.id} className="kartu flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-desa-50 text-desa-800">
                    <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                    <span className="text-xs">
                      {d.toLocaleDateString('id-ID', { weekday: 'short' })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-slate-900">{a.judul}</h3>
                    <p className="text-xs text-slate-500">
                      {d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      {a.lokasi && ` · ${a.lokasi}`}
                    </p>
                    <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {LABEL_KATEGORI_AGENDA[a.kategori]}
                    </span>
                    {a.deskripsi && <p className="mt-1.5 text-sm text-slate-600">{a.deskripsi}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// KONTAK
// ─────────────────────────────────────────────

export function Kontak() {
  const { data } = useQuery({
    queryKey: ['profil'],
    queryFn: async () => (await api.get('/profil')).data.data,
  });

  const sosial = [
    ['Facebook', data?.facebook],
    ['Instagram', data?.instagram],
    ['TikTok', data?.tiktok],
    ['YouTube', data?.youtube],
  ].filter(([, v]) => v);

  const wa = data?.waDesa?.replace(/^0/, '62').replace(/\D/g, '');

  return (
    <div className="kontainer max-w-2xl py-10">
      <h1 className="judul-halaman">Kontak</h1>
      <p className="mt-1 text-sm text-slate-600">
        Hubungi Pemerintah Desa Bintang Ninggi I.
      </p>

      <section className="kartu mt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Kantor Desa</h2>
        <dl className="space-y-2 text-sm">
          {[
            ['Alamat', data?.alamatKantor],
            ['Kode pos', data?.kodePos],
            ['Email', data?.email],
          ]
            .filter(([, v]) => v)
            .map(([l, v]) => (
              <div key={l as string} className="flex gap-3">
                <dt className="w-24 shrink-0 text-slate-500">{l}</dt>
                <dd className="text-slate-800">{v}</dd>
              </div>
            ))}
        </dl>

        {wa && (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noreferrer"
            className="tombol-utama mt-4 inline-block text-sm"
          >
            Hubungi lewat WhatsApp
          </a>
        )}

        {!data?.alamatKantor && !data?.waDesa && !data?.email && (
          <p className="text-sm text-slate-400">
            Data kontak belum diisi perangkat desa.
          </p>
        )}
      </section>

      {data?.jamPelayanan && (
        <section className="kartu mt-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Jam Pelayanan</h2>
          <ul className="space-y-1 text-sm">
            {Object.entries(data.jamPelayanan as Record<string, string>).map(([hari, jam]) => (
              <li key={hari} className="flex justify-between gap-2">
                <span className="capitalize text-slate-600">{hari.replace(/_/g, ' – ')}</span>
                <span className="text-slate-900">{jam}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data?.nomorDarurat && (
        <section className="kartu mt-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Nomor Darurat</h2>
          <ul className="space-y-1 text-sm">
            {Object.entries(data.nomorDarurat as Record<string, string>)
              .filter(([, no]) => no && no !== '-')
              .map(([nama, no]) => (
                <li key={nama} className="flex justify-between gap-2">
                  <span className="capitalize text-slate-600">{nama.replace(/_/g, ' ')}</span>
                  <a href={`tel:${no}`} className="font-medium text-desa-700 hover:underline">
                    {no}
                  </a>
                </li>
              ))}
          </ul>
        </section>
      )}

      {sosial.length > 0 && (
        <section className="kartu mt-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Media Sosial</h2>
          <ul className="flex flex-wrap gap-3 text-sm">
            {sosial.map(([nama, url]) => (
              <li key={nama as string}>
                <a
                  href={url as string}
                  target="_blank"
                  rel="noreferrer"
                  className="text-desa-700 hover:underline"
                >
                  {nama}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
