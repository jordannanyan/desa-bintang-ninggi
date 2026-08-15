import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, pesanError } from '../../lib/api';

interface HasilKode {
  nama: string;
  nik: string;
  kodeAktivasi: string;
  berlakuSampai: string;
}

/**
 * Perangkat desa menerbitkan kode aktivasi untuk seorang warga.
 *
 * Yang keluar dari sini adalah kode sekali pakai, BUKAN PIN. PIN ditetapkan
 * warga sendiri di halaman /aktivasi, sehingga perangkat desa tidak pernah
 * mengetahui PIN siapa pun.
 */
export function AkunWarga() {
  const { id } = useParams();
  const [hasil, setHasil] = useState<HasilKode | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  const { data: penduduk, isLoading } = useQuery({
    queryKey: ['penduduk', id],
    queryFn: async () => (await api.get(`/kependudukan/${id}`)).data.data,
  });

  const terbitkan = async () => {
    if (!penduduk?.nik) return;
    setGalat(null);
    setSibuk(true);
    try {
      const res = await api.post('/auth/daftarkan-warga', { nik: penduduk.nik });
      setHasil(res.data.data);
    } catch (err) {
      setGalat(pesanError(err, 'Kode gagal diterbitkan.'));
    } finally {
      setSibuk(false);
    }
  };

  /**
   * NIK disamarkan di layar. Untuk menerbitkan kode, yang perlu dipastikan
   * perangkat desa adalah orangnya benar — dan itu cukup dari nama serta
   * alamat. NIK utuh tetap dipakai memanggil API, hanya tidak ditampilkan.
   */
  const nikSamar = (nik?: string) =>
    nik && nik.length === 16 ? `${nik.slice(0, 4)}${'x'.repeat(8)}${nik.slice(-4)}` : '—';

  if (isLoading) return <p className="text-sm text-slate-500">Memuat…</p>;

  if (!penduduk) {
    return (
      <div>
        <p className="text-sm text-slate-600">Data penduduk tidak ditemukan.</p>
        <Link to="/admin/penduduk" className="text-sm text-desa-600 hover:underline">
          Kembali
        </Link>
      </div>
    );
  }

  const pesanWa = hasil
    ? encodeURIComponent(
        `Assalamualaikum ${hasil.nama},\n\n` +
          `Akun layanan online Desa Bintang Ninggi I sudah didaftarkan atas nama Anda.\n\n` +
          `Kode aktivasi: ${hasil.kodeAktivasi}\n` +
          `Berlaku sampai: ${new Date(hasil.berlakuSampai).toLocaleDateString('id-ID', { dateStyle: 'long' })}\n\n` +
          `Buka ${window.location.origin}/aktivasi lalu masukkan NIK, kode di atas, dan buat PIN Anda sendiri.\n\n` +
          `Jangan berikan kode ini kepada siapa pun.`,
      )
    : '';

  return (
    <div className="max-w-2xl">
      <Link to="/admin/penduduk" className="text-sm text-desa-600 hover:underline">
        ← Manajemen penduduk
      </Link>

      <h1 className="mb-1 mt-2 text-xl font-bold text-slate-900">Akun Warga</h1>
      <p className="mb-5 text-sm text-slate-500">
        Terbitkan kode aktivasi agar warga bisa masuk dan mengajukan surat sendiri.
      </p>

      <section className="kartu mb-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Warga</h2>
        <dl className="space-y-1.5 text-sm">
          {[
            ['Nama', penduduk.nama],
            ['NIK', nikSamar(penduduk.nik)],
            [
              'Alamat',
              `${penduduk.kartuKeluarga.alamat}, RT ${penduduk.kartuKeluarga.rt.nomor}/RW ${penduduk.kartuKeluarga.rt.rw.nomor}`,
            ],
          ].map(([l, v]) => (
            <div key={l} className="flex gap-3">
              <dt className="w-24 shrink-0 text-slate-500">{l}</dt>
              <dd className="text-slate-800">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {galat && (
        <div className="mb-4 rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
          {galat}
        </div>
      )}

      {!hasil ? (
        <section className="kartu">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Terbitkan Kode Aktivasi</h2>
          <p className="mb-4 text-sm text-slate-600">
            Kode berlaku 7 hari dan hanya bisa dipakai sekali. Warga menetapkan PIN-nya
            sendiri — Anda tidak perlu, dan tidak bisa, mengetahui PIN warga.
          </p>
          <button type="button" onClick={terbitkan} disabled={sibuk} className="tombol-utama">
            {sibuk ? 'Menerbitkan…' : 'Terbitkan Kode'}
          </button>
        </section>
      ) : (
        <section className="kartu">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Kode Aktivasi</h2>

          <div className="rounded-xl border-2 border-dashed border-desa-300 bg-desa-50 p-6 text-center">
            <p className="text-xs text-desa-800">Kode untuk {hasil.nama}</p>
            <p className="my-2 font-mono text-3xl font-bold tracking-[0.2em] text-desa-900">
              {hasil.kodeAktivasi}
            </p>
            <p className="text-xs text-desa-700">
              Berlaku sampai{' '}
              {new Date(hasil.berlakuSampai).toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(hasil.kodeAktivasi)}
              className="tombol-sekunder text-xs"
            >
              Salin kode
            </button>
            <a
              href={`https://wa.me/?text=${pesanWa}`}
              target="_blank"
              rel="noreferrer"
              className="tombol-sekunder text-xs"
            >
              Kirim lewat WhatsApp
            </a>
            <button type="button" onClick={() => window.print()} className="tombol-sekunder text-xs">
              Cetak
            </button>
          </div>

          {/* Kode hanya ditampilkan sekali di layar ini. Setelah halaman ditutup,
              kode tidak bisa dilihat lagi — perangkat desa harus menerbitkan
              yang baru. Ini disengaja: kode yang bisa dilihat berulang kali
              sama saja dengan menyimpan kunci akun warga di dashboard. */}
          <div className="mt-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-3 text-xs text-amber-900">
            <b>Catat atau kirim sekarang.</b> Kode ini tidak ditampilkan lagi setelah halaman
            ditutup. Bila hilang, terbitkan kode baru — kode lama otomatis tidak berlaku.
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-600">
            <p className="font-medium text-slate-800">Sampaikan ke warga:</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5">
              <li>
                Buka <b>{window.location.origin}/aktivasi</b>
              </li>
              <li>Masukkan NIK dan kode di atas</li>
              <li>Buat PIN 6 digit, jangan diberitahukan ke siapa pun</li>
            </ol>
          </div>
        </section>
      )}
    </div>
  );
}
