import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, pesanError } from '../lib/api';

interface JenisSurat {
  kode: string;
  nama: string;
  fieldTambahan: string[] | null;
  lampiranWajib: string[] | null;
}

/** field_tambahan disimpan dalam snake_case; diubah jadi label yang enak dibaca. */
const labelDari = (kunci: string) =>
  kunci
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bNik\b/, 'NIK');

/** Menebak jenis input dari nama field, supaya form terasa wajar tanpa konfigurasi tambahan. */
function tipeInput(kunci: string): { type: string; inputMode?: 'numeric' } {
  if (/tanggal|tgl/.test(kunci)) return { type: 'date' };
  if (/^(nik|no_|nomor)/.test(kunci)) return { type: 'text', inputMode: 'numeric' };
  if (/penghasilan|jumlah|perkiraan/.test(kunci)) return { type: 'number' };
  return { type: 'text' };
}

const perluTextarea = (kunci: string) =>
  /kronologi|isi_permohonan|daftar_|alasan/.test(kunci);

export function AjukanSurat() {
  const { kode } = useParams();
  const navigate = useNavigate();
  const [keperluan, setKeperluan] = useState('');
  const [nilai, setNilai] = useState<Record<string, string>>({});
  const [galat, setGalat] = useState<string | null>(null);
  const [mengirim, setMengirim] = useState(false);

  const { data: jenis, isLoading } = useQuery({
    queryKey: ['jenis-surat'],
    queryFn: async () =>
      (await api.get<{ ok: true; data: JenisSurat[] }>('/layanan/surat/jenis')).data.data,
    select: (semua) => semua.find((j) => j.kode === kode),
  });

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(null);
    setMengirim(true);

    try {
      const res = await api.post('/layanan/surat', {
        jenisSurat: kode,
        keperluan,
        data: nilai,
        lampiranIds: [],
      });
      navigate(`/warga/surat?baru=${res.data.data.kodeLacak}`);
    } catch (err) {
      setGalat(pesanError(err, 'Pengajuan gagal dikirim.'));
    } finally {
      setMengirim(false);
    }
  };

  const gayaInput =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-desa-500 focus:outline-none focus:ring-1 focus:ring-desa-500';

  if (isLoading) {
    return <div className="kontainer py-16 text-center text-sm text-slate-500">Memuat…</div>;
  }

  if (!jenis) {
    return (
      <div className="kontainer py-16">
        <h1 className="judul-halaman mb-2">Jenis surat tidak ditemukan</h1>
        <Link to="/layanan" className="text-sm text-desa-600 hover:underline">
          Kembali ke daftar layanan
        </Link>
      </div>
    );
  }

  return (
    <div className="kontainer max-w-2xl py-10">
      <Link to="/layanan" className="text-sm text-desa-600 hover:underline">
        ← Semua layanan
      </Link>

      <h1 className="judul-halaman mt-2">{jenis.nama}</h1>
      <p className="mt-1 text-sm text-slate-600">
        Data pribadi Anda (nama, NIK, alamat) diambil otomatis dari data penduduk desa —
        tidak perlu diketik ulang.
      </p>

      <form onSubmit={kirim} className="mt-6 space-y-5">
        {galat && (
          <div
            role="alert"
            className="rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {galat}
          </div>
        )}

        <div className="kartu space-y-4">
          <div>
            <label htmlFor="keperluan" className="mb-1 block text-sm font-medium text-slate-700">
              Keperluan <span className="text-red-500">*</span>
            </label>
            <textarea
              id="keperluan"
              required
              minLength={5}
              rows={2}
              value={keperluan}
              onChange={(e) => setKeperluan(e.target.value)}
              placeholder="Contoh: syarat melamar pekerjaan"
              className={gayaInput}
            />
          </div>

          {/* "keperluan" disaring keluar: ia sudah menjadi kolom tersendiri di
              atas. Beberapa template lama mencantumkannya lagi di fieldTambahan,
              dan tanpa saringan ini warga melihat dua kotak Keperluan sekaligus
              — dua-duanya pun memakai id HTML yang sama. Disaring di sini, bukan
              hanya diperbaiki di data, karena template sudah tersimpan di
              database server dan tidak ikut berubah saat kode diperbarui. */}
          {jenis.fieldTambahan?.filter((f) => f !== 'keperluan').map((f) => (
            <div key={f}>
              <label htmlFor={f} className="mb-1 block text-sm font-medium text-slate-700">
                {labelDari(f)}
              </label>
              {perluTextarea(f) ? (
                <textarea
                  id={f}
                  rows={3}
                  value={nilai[f] ?? ''}
                  onChange={(e) => setNilai((v) => ({ ...v, [f]: e.target.value }))}
                  className={gayaInput}
                />
              ) : (
                <input
                  id={f}
                  {...tipeInput(f)}
                  value={nilai[f] ?? ''}
                  onChange={(e) => setNilai((v) => ({ ...v, [f]: e.target.value }))}
                  className={gayaInput}
                />
              )}
            </div>
          ))}
        </div>

        {jenis.lampiranWajib?.length ? (
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
            <b>Siapkan lampiran:</b> {jenis.lampiranWajib.join(', ')}.
            <span className="mt-1 block text-xs">
              Unggahan berkas belum tersedia pada versi ini — bawa lampirannya saat mengambil
              surat di kantor desa.
            </span>
          </div>
        ) : null}

        <button type="submit" disabled={mengirim} className="tombol-utama">
          {mengirim ? 'Mengirim…' : 'Kirim Pengajuan'}
        </button>
      </form>
    </div>
  );
}
