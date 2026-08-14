import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LABEL_STATUS, type StatusPengajuan } from '@desa/shared';
import { api, pesanError, unduhBerkas } from '../../lib/api';

interface Detail {
  id: string;
  kodeLacak: string;
  jenis: string;
  keperluan: string;
  data: Record<string, unknown>;
  status: StatusPengajuan;
  catatan: string | null;
  nomorSurat: string | null;
  kodeVerifikasi: string | null;
  adaPdf: boolean;
  dibuatPada: string;
  pemohon: {
    nama: string;
    nik: string;
    tempatLahir: string;
    tanggalLahir: string;
    jenisKelamin: string;
    pekerjaan: string;
    alamat: string;
  } | null;
  lampiran: Array<{ id: string; nama: string; url: string }>;
  riwayat: Array<{ id: string; status: string; catatan: string | null; dibuatPada: string }>;
}

const labelDari = (k: string) =>
  k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function SuratDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [alasan, setAlasan] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [kabar, setKabar] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['pengajuan-surat', id],
    queryFn: async () => (await api.get(`/layanan/surat/${id}`)).data.data as Detail,
  });

  const segarkan = async () => {
    await queryClient.invalidateQueries({ queryKey: ['pengajuan-surat'] });
  };

  const jalankan = async (aksi: () => Promise<unknown>) => {
    setGalat(null);
    setKabar(null);
    setSibuk(true);
    try {
      await aksi();
      await segarkan();
    } catch (err) {
      setGalat(pesanError(err, 'Tindakan gagal.'));
    } finally {
      setSibuk(false);
    }
  };

  const setujui = () =>
    jalankan(() => api.patch(`/layanan/surat/${id}/tinjau`, { status: 'DISETUJUI' }));

  const tolak = () => {
    if (!alasan.trim()) {
      setGalat('Alasan penolakan wajib diisi agar warga tahu apa yang harus diperbaiki.');
      return;
    }
    return jalankan(() =>
      api.patch(`/layanan/surat/${id}/tinjau`, { status: 'DITOLAK', catatan: alasan.trim() }),
    );
  };

  const terbitkan = () =>
    jalankan(async () => {
      const res = await api.post(`/layanan/surat/${id}/terbitkan`);
      setKabar(
        res.data.data.peringatan ??
          `Surat terbit dengan nomor ${res.data.data.nomorSurat}. Cetak, tanda tangani, dan bubuhkan stempel.`,
      );
    });

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Memuat…</p>;
  }

  const isian = Object.entries(data.data ?? {}).filter(([, v]) => v !== '' && v != null);

  return (
    <div className="max-w-4xl">
      <Link to="/admin/surat" className="text-sm text-desa-600 hover:underline">
        ← Semua pengajuan
      </Link>

      <div className="mb-5 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{data.jenis}</h1>
          <p className="text-sm text-slate-500">
            {data.kodeLacak} ·{' '}
            {new Date(data.dibuatPada).toLocaleDateString('id-ID', { dateStyle: 'long' })}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {LABEL_STATUS[data.status]}
        </span>
      </div>

      {galat && (
        <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
          {galat}
        </div>
      )}
      {kabar && (
        <div className="mb-4 rounded-lg border-l-4 border-desa-500 bg-desa-50 px-3 py-2 text-sm text-desa-900">
          {kabar}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="kartu">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Pemohon</h2>
          {data.pemohon ? (
            <dl className="space-y-1.5 text-sm">
              {[
                ['Nama', data.pemohon.nama],
                // NIK disamarkan: untuk memutuskan setuju/tolak yang dibutuhkan
                // adalah nama dan kelengkapan berkas, bukan 16 digit NIK.
                ['NIK', data.pemohon.nik],
                [
                  'Tempat, tanggal lahir',
                  `${data.pemohon.tempatLahir}, ${new Date(
                    data.pemohon.tanggalLahir,
                  ).toLocaleDateString('id-ID', { dateStyle: 'long' })}`,
                ],
                ['Jenis kelamin', data.pemohon.jenisKelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'],
                ['Pekerjaan', data.pemohon.pekerjaan],
                ['Alamat', data.pemohon.alamat],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-3">
                  <dt className="w-36 shrink-0 text-slate-500">{l}</dt>
                  <dd className="text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-red-700">Data penduduk pemohon tidak ditemukan.</p>
          )}
        </section>

        <section className="kartu">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Isian Pengajuan</h2>
          <dl className="space-y-1.5 text-sm">
            <div className="flex gap-3">
              <dt className="w-36 shrink-0 text-slate-500">Keperluan</dt>
              <dd className="text-slate-800">{data.keperluan}</dd>
            </div>
            {isian.map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <dt className="w-36 shrink-0 text-slate-500">{labelDari(k)}</dt>
                <dd className="text-slate-800">{String(v)}</dd>
              </div>
            ))}
          </dl>

          {data.lampiran.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="mb-1 text-xs text-slate-500">Lampiran</p>
              <ul className="space-y-1 text-sm">
                {data.lampiran.map((l) => (
                  <li key={l.id}>
                    <a href={l.url} target="_blank" rel="noreferrer" className="text-desa-700 hover:underline">
                      {l.nama}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <section className="kartu mt-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Tindakan</h2>

        {data.status === 'DIPROSES' && (
          <div className="space-y-4">
            <button type="button" onClick={setujui} disabled={sibuk} className="tombol-utama">
              Setujui
            </button>

            <div className="border-t border-slate-100 pt-4">
              <label htmlFor="alasan" className="mb-1 block text-sm font-medium text-slate-700">
                Alasan penolakan
              </label>
              <textarea
                id="alasan"
                rows={2}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Contoh: fotokopi KK belum dilampirkan"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500"
              />
              <button
                type="button"
                onClick={tolak}
                disabled={sibuk}
                className="tombol-sekunder mt-2 border-red-300 text-red-700 hover:bg-red-50"
              >
                Tolak Pengajuan
              </button>
            </div>
          </div>
        )}

        {data.status === 'DISETUJUI' && (
          <div>
            <p className="mb-3 text-sm text-slate-600">
              Pengajuan sudah disetujui. Terbitkan surat untuk memberi nomor resmi, membuat
              PDF, dan menempelkan QR verifikasi.
            </p>
            <button type="button" onClick={terbitkan} disabled={sibuk} className="tombol-utama">
              {sibuk ? 'Menerbitkan…' : 'Terbitkan Surat'}
            </button>
          </div>
        )}

        {data.status === 'SIAP_DIAMBIL' && (
          <div className="space-y-3">
            <dl className="space-y-1.5 text-sm">
              <div className="flex gap-3">
                <dt className="w-36 shrink-0 text-slate-500">Nomor surat</dt>
                <dd className="font-medium text-slate-900">{data.nomorSurat}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-36 shrink-0 text-slate-500">Kode verifikasi</dt>
                <dd className="font-mono text-slate-900">{data.kodeVerifikasi}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => unduhBerkas(`/layanan/surat/${id}/pdf`, `${data.kodeLacak}.pdf`)}
              className="tombol-utama"
            >
              Unduh PDF untuk dicetak
            </button>
            <p className="text-xs text-slate-500">
              Cetak, tanda tangani basah, dan bubuhkan stempel. QR pada surat sudah menunjuk
              ke halaman verifikasi.
            </p>
          </div>
        )}

        {data.status === 'DITOLAK' && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            Ditolak dengan alasan: {data.catatan}
          </p>
        )}
      </section>

      <section className="kartu mt-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Riwayat</h2>
        <ol className="space-y-2 text-sm">
          {data.riwayat.map((r) => (
            <li key={r.id} className="flex gap-3">
              <span className="w-40 shrink-0 text-xs text-slate-400">
                {new Date(r.dibuatPada).toLocaleString('id-ID')}
              </span>
              <span className="text-slate-700">
                <b>{LABEL_STATUS[r.status as StatusPengajuan] ?? r.status}</b>
                {r.catatan && ` — ${r.catatan}`}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
