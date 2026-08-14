import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface HasilVerifikasi {
  sah: boolean;
  pesan?: string;
  nomorSurat?: string;
  jenis?: string;
  atasNama?: string;
  tanggalTerbit?: string;
  ditandatanganiOleh?: string;
  hashDokumen?: string;
  jumlahVerifikasi?: number;
}

/**
 * Halaman yang dituju QR pada lembar surat. Publik, tanpa login.
 *
 * Yang ditampilkan sengaja seminimal mungkin: cukup untuk memastikan surat itu
 * asli, tanpa membocorkan data pribadi. Nama disamarkan sebagian karena tautan
 * ini bisa dibuka siapa pun yang memegang atau memotret suratnya.
 */
export function Verifikasi() {
  const { kode } = useParams();
  const navigate = useNavigate();
  const [ketikan, setKetikan] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['verifikasi', kode],
    enabled: Boolean(kode),
    queryFn: async () =>
      (await api.get<{ ok: true; data: HasilVerifikasi }>(`/layanan/surat/verifikasi/${kode}`))
        .data.data,
  });

  const tanggal = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long' })
      : '—';

  return (
    <div className="kontainer max-w-xl py-12">
      <h1 className="judul-halaman">Verifikasi Keaslian Surat</h1>
      <p className="mt-1 text-sm text-slate-600">
        Masukkan kode yang tertera di bawah QR Code pada lembar surat.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ketikan.trim()) navigate(`/verifikasi/${ketikan.trim().toUpperCase()}`);
        }}
        className="mt-5 flex gap-2"
      >
        <input
          value={ketikan}
          onChange={(e) => setKetikan(e.target.value)}
          placeholder="Contoh: AB3KM-9PQR7"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase tracking-widest focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500"
        />
        <button type="submit" className="tombol-utama">
          Periksa
        </button>
      </form>

      {isLoading && <p className="mt-6 text-sm text-slate-500">Memeriksa…</p>}

      {data && !data.sah && (
        <div className="mt-6 rounded-xl border-l-4 border-red-500 bg-red-50 p-5">
          <p className="font-semibold text-red-900">Surat tidak terdaftar</p>
          <p className="mt-1 text-sm text-red-800">{data.pesan}</p>
          <p className="mt-3 text-xs text-red-700">
            Periksa kembali ejaan kodenya. Bila sudah benar dan tetap tidak dikenali,
            surat tersebut tidak diterbitkan oleh sistem Desa Bintang Ninggi I.
          </p>
        </div>
      )}

      {data?.sah && (
        <div className="mt-6 rounded-xl border-l-4 border-desa-600 bg-desa-50 p-5">
          <p className="font-semibold text-desa-900">Surat terdaftar dan asli</p>

          <dl className="mt-4 space-y-2 text-sm">
            {[
              ['Nomor surat', data.nomorSurat],
              ['Jenis', data.jenis],
              ['Atas nama', data.atasNama],
              ['Tanggal terbit', tanggal(data.tanggalTerbit)],
              ['Ditandatangani', data.ditandatanganiOleh ?? '—'],
            ].map(([label, nilai]) => (
              <div key={label} className="flex gap-3">
                <dt className="w-32 shrink-0 text-desa-800">{label}</dt>
                <dd className="font-medium text-slate-900">{nilai}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 border-t border-desa-200 pt-3 text-xs text-desa-800">
            Sidik dokumen (SHA-256):{' '}
            <span className="break-all font-mono">{data.hashDokumen}</span>
          </p>
          <p className="mt-2 text-xs text-desa-700">
            Kode ini sudah diperiksa {data.jumlahVerifikasi}&times;.
          </p>
        </div>
      )}

      <div className="mt-8 rounded-lg bg-slate-100 p-4 text-xs text-slate-600">
        <b>Yang dijamin halaman ini:</b> surat dengan nomor tersebut benar diterbitkan
        sistem Desa Bintang Ninggi I dan isinya tidak diubah sejak terbit. Tanda tangan
        yang sah secara hukum tetap tanda tangan basah dan stempel pada lembar aslinya —
        QR ini pengaman tambahan, bukan tanda tangan elektronik tersertifikasi.
      </div>
    </div>
  );
}
