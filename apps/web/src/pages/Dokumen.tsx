import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DOKUMEN_PEMERINTAHAN,
  DOKUMEN_PPID,
  DOKUMEN_UNDUHAN,
  KETERANGAN_PPID,
  LABEL_JENIS_DOKUMEN,
  type JenisDokumen,
} from '@desa/shared';
import { api, unduhBerkas } from '../lib/api';

interface Dokumen {
  id: string;
  jenis: JenisDokumen;
  judul: string;
  nomor: string | null;
  tahun: number;
  ringkasan: string | null;
  publik: boolean;
  jumlahUnduh: number;
  adaBerkas: boolean;
  ukuranByte: number | null;
}

const ukuran = (byte: number | null) =>
  byte === null ? '' : byte > 1024 * 1024
    ? `${(byte / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(byte / 1024)} KB`;

/**
 * Satu komponen menyajikan tiga halaman: Pemerintahan Desa, PPID, dan
 * Download Center. Yang berbeda hanya kelompok jenis dokumennya, karena
 * ketiganya memang membaca tabel yang sama.
 */
function DaftarDokumen({
  judul,
  keterangan,
  jenis,
  tampilkanKeteranganJenis = false,
  saringAwal,
}: {
  judul: string;
  keterangan: string;
  jenis: JenisDokumen[];
  tampilkanKeteranganJenis?: boolean;
  /** Jenis yang langsung tersaring saat halaman dibuka lewat sub-rute. */
  saringAwal?: JenisDokumen;
}) {
  const [saring, setSaring] = useState<JenisDokumen | ''>(saringAwal ?? '');
  const [cari, setCari] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['dokumen', jenis.join(','), saring, cari],
    queryFn: async () =>
      (
        await api.get('/dokumen', {
          params: { jenis: (saring ? [saring] : jenis).join(','), q: cari || undefined },
        })
      ).data.data as Dokumen[],
  });

  const unduh = (d: Dokumen) =>
    unduhBerkas(`/dokumen/${d.id}/unduh`, `${d.judul.slice(0, 60)}.pdf`);

  return (
    <div className="kontainer py-10">
      <h1 className="judul-halaman">{judul}</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">{keterangan}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSaring('')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            saring === ''
              ? 'bg-desa-600 text-white'
              : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semua
        </button>
        {jenis.map((j) => (
          <button
            key={j}
            type="button"
            onClick={() => setSaring(j)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              saring === j
                ? 'bg-desa-600 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {LABEL_JENIS_DOKUMEN[j]}
          </button>
        ))}

        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="Cari judul…"
          className="ml-auto min-w-48 rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500"
        />
      </div>

      {tampilkanKeteranganJenis && saring && KETERANGAN_PPID[saring] && (
        <p className="mt-4 rounded-lg bg-slate-100 p-3 text-xs text-slate-600">
          {KETERANGAN_PPID[saring]}
        </p>
      )}

      {isLoading && <p className="mt-6 text-sm text-slate-500">Memuat…</p>}

      {data?.length === 0 && (
        <div className="mt-6 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          {cari || saring
            ? 'Tidak ada dokumen yang cocok.'
            : 'Belum ada dokumen yang diunggah.'}
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {data?.map((d) => (
          <li key={d.id} className="kartu flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {LABEL_JENIS_DOKUMEN[d.jenis]}
                </span>
                <span className="text-xs text-slate-400">{d.tahun}</span>
                {!d.publik && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    belum publik
                  </span>
                )}
              </div>
              <h2 className="mt-1.5 font-medium text-slate-900">{d.judul}</h2>
              {d.nomor && <p className="text-xs text-slate-500">Nomor: {d.nomor}</p>}
              {d.ringkasan && (
                <p className="mt-1 text-sm text-slate-600">{d.ringkasan}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {d.jumlahUnduh} kali diunduh
                {d.ukuranByte && ` · ${ukuran(d.ukuranByte)}`}
              </p>
            </div>

            {d.adaBerkas ? (
              <button type="button" onClick={() => unduh(d)} className="tombol-sekunder text-xs">
                Unduh
              </button>
            ) : (
              <span className="text-xs text-slate-400">berkas belum diunggah</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PemerintahanDesa({ saringAwal }: { saringAwal?: JenisDokumen } = {}) {
  return (
    <DaftarDokumen
      judul="Pemerintahan Desa"
      keterangan="Peraturan Desa, SK Kepala Desa, dokumen perencanaan, dan laporan APBDes."
      jenis={DOKUMEN_PEMERINTAHAN}
      saringAwal={saringAwal}
    />
  );
}

export function Ppid() {
  return (
    <DaftarDokumen
      judul="PPID"
      keterangan="Pejabat Pengelola Informasi dan Dokumentasi. Informasi publik desa diklasifikasikan sesuai UU 14/2008 tentang Keterbukaan Informasi Publik."
      jenis={DOKUMEN_PPID}
      tampilkanKeteranganJenis
    />
  );
}

export function DownloadCenter() {
  return (
    <DaftarDokumen
      judul="Download Center"
      keterangan="Formulir, proposal, dan laporan yang bisa diunduh warga."
      jenis={DOKUMEN_UNDUHAN}
    />
  );
}
