import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LABEL_STATUS, type StatusPengajuan } from '@desa/shared';
import { api, unduhBerkas } from '../../lib/api';

interface BarisSurat {
  id: string;
  kodeLacak: string;
  jenis: string;
  keperluan: string;
  status: StatusPengajuan;
  catatan: string | null;
  nomorSurat: string | null;
  adaPdf: boolean;
  dibuatPada: string;
}

const WARNA: Record<StatusPengajuan, string> = {
  DIPROSES: 'bg-amber-50 text-amber-800',
  DISETUJUI: 'bg-sky-50 text-sky-800',
  DITOLAK: 'bg-red-50 text-red-800',
  SIAP_DIAMBIL: 'bg-desa-50 text-desa-800',
};

export function SuratSaya() {
  const [params] = useSearchParams();
  const baruSaja = params.get('baru');

  const { data, isLoading } = useQuery({
    queryKey: ['surat-saya'],
    queryFn: async () => (await api.get('/layanan/surat/saya')).data as { data: BarisSurat[] },
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Riwayat Surat</h1>
          <p className="text-sm text-slate-500">Pengajuan surat Anda dan statusnya.</p>
        </div>
        <Link to="/layanan" className="tombol-utama text-xs">
          Ajukan Surat Baru
        </Link>
      </div>

      {baruSaja && (
        <div className="mb-4 rounded-lg border-l-4 border-desa-500 bg-desa-50 p-4 text-sm text-desa-900">
          Pengajuan Anda terkirim dengan kode lacak <b>{baruSaja}</b>. Simpan kode ini untuk
          menanyakan perkembangannya di kantor desa.
        </div>
      )}

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}

      {data?.data.length === 0 && (
        <div className="kartu text-center text-sm text-slate-500">
          Belum ada pengajuan surat.{' '}
          <Link to="/layanan" className="text-desa-600 hover:underline">
            Ajukan sekarang
          </Link>
          .
        </div>
      )}

      <ul className="space-y-3">
        {data?.data.map((s) => (
          <li key={s.id} className="kartu">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-medium text-slate-900">{s.jenis}</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {s.kodeLacak} ·{' '}
                  {new Date(s.dibuatPada).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </p>
                <p className="mt-1 text-sm text-slate-600">{s.keperluan}</p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${WARNA[s.status]}`}
              >
                {LABEL_STATUS[s.status]}
              </span>
            </div>

            {/* Alasan penolakan ditampilkan menonjol — warga berhak tahu
                persis apa yang harus diperbaiki sebelum mengajukan lagi. */}
            {s.status === 'DITOLAK' && s.catatan && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                <b>Alasan ditolak:</b> {s.catatan}
              </p>
            )}

            {s.nomorSurat && (
              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-500">
                  Nomor surat: <b className="text-slate-800">{s.nomorSurat}</b>
                </span>
                {s.adaPdf && (
                  <button
                    type="button"
                    onClick={() =>
                      unduhBerkas(`/layanan/surat/saya/${s.id}/pdf`, `${s.kodeLacak}.pdf`)
                    }
                    className="tombol-sekunder text-xs"
                  >
                    Unduh PDF
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
