import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatRupiah } from '@desa/shared';
import { api } from '../../lib/api';
import { LABEL_KATEGORI, LABEL_STATUS_ADU, WARNA_STATUS_ADU } from '../Pengaduan';

const tanggal = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '—';

function Kosong({ pesan }: { pesan: string }) {
  return <div className="kartu text-center text-sm text-slate-500">{pesan}</div>;
}

// ─────────────────────────────────────────────
// DATA PRIBADI
// ─────────────────────────────────────────────

export function DataPribadi() {
  const [nikTampil, setNikTampil] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['data-saya'],
    queryFn: async () => (await api.get('/saya')).data.data,
  });

  if (isLoading) return <p className="text-sm text-slate-500">Memuat…</p>;

  if (isError || !data) {
    return (
      <div className="max-w-2xl">
        <h1 className="mb-3 text-xl font-bold text-slate-900">Data Pribadi</h1>
        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Akun Anda belum tertaut ke data penduduk. Hubungi kantor desa.
        </div>
      </div>
    );
  }

  const samar = (nik: string) => `${nik.slice(0, 4)}${'•'.repeat(8)}${nik.slice(-4)}`;

  const baris: Array<[string, string]> = [
    ['Nama lengkap', data.nama],
    ['Tempat, tanggal lahir', `${data.tempatLahir}, ${tanggal(data.tanggalLahir)}`],
    ['Jenis kelamin', data.jenisKelamin === 'LAKI_LAKI' ? 'Laki-laki' : 'Perempuan'],
    ['Agama', data.agama],
    ['Pendidikan terakhir', data.pendidikan],
    ['Pekerjaan', data.pekerjaan],
    ['Status perkawinan', String(data.statusKawin).replace(/_/g, ' ').toLowerCase()],
    ['Kewarganegaraan', data.kewarganegaraan],
    ['Status dalam keluarga', data.hubunganKeluarga],
    ['Nama ayah', data.namaAyah ?? '—'],
    ['Nama ibu', data.namaIbu ?? '—'],
    ['Golongan darah', data.golonganDarah ?? '—'],
    ['Alamat', `${data.alamat}, RT ${data.rt}/RW ${data.rw}${data.dusun ? `, ${data.dusun}` : ''}`],
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Data Pribadi</h1>
      <p className="mb-5 text-sm text-slate-500">
        Data kependudukan yang tercatat atas nama Anda di Desa Bintang Ninggi I.
      </p>

      <section className="kartu">
        <dl className="space-y-2 text-sm">
          {/* NIK disembunyikan sampai diminta. Halaman ini sering dibuka di
              tempat umum, dan tidak ada gunanya 16 digit itu terpampang
              sepanjang waktu di layar. */}
          <div className="flex gap-3">
            <dt className="w-44 shrink-0 text-slate-500">NIK</dt>
            <dd className="font-mono text-slate-900">
              {nikTampil ? data.nik : samar(data.nik)}
              <button
                type="button"
                onClick={() => setNikTampil((v) => !v)}
                className="ml-3 font-sans text-xs font-medium text-desa-700 hover:underline"
              >
                {nikTampil ? 'sembunyikan' : 'tampilkan'}
              </button>
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-44 shrink-0 text-slate-500">Nomor Kartu Keluarga</dt>
            <dd className="font-mono text-slate-900">
              {nikTampil ? data.nomorKk : samar(data.nomorKk)}
            </dd>
          </div>

          {baris.map(([l, v]) => (
            <div key={l} className="flex gap-3">
              <dt className="w-44 shrink-0 text-slate-500">{l}</dt>
              <dd className="capitalize text-slate-900">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-4 rounded-lg bg-slate-100 p-4 text-xs text-slate-600">
        Ada data yang keliru? Perubahan data kependudukan hanya bisa dilakukan perangkat
        desa. Bawa dokumen pendukungnya ke kantor desa.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAGIHAN & PAJAK DESA
// ─────────────────────────────────────────────

const LABEL_JENIS_TAGIHAN: Record<string, string> = {
  PBB: 'Pajak Bumi dan Bangunan',
  IURAN_DESA: 'Iuran Desa',
  SEWA_ASET: 'Sewa Aset Desa',
  LAINNYA: 'Lainnya',
};

/** Satu komponen untuk menu "Pajak desa" dan "Tagihan" — perkaranya sama. */
function DaftarTagihan({ judul, hanyaPajak }: { judul: string; hanyaPajak: boolean }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['tagihan-saya'],
    queryFn: async () => (await api.get('/tagihan/saya')).data,
  });

  const daftar = (data?.data ?? []).filter((t: { jenis: string }) =>
    hanyaPajak ? t.jenis === 'PBB' : t.jenis !== 'PBB',
  );

  if (isLoading) return <p className="text-sm text-slate-500">Memuat…</p>;

  if (isError) {
    return (
      <div className="max-w-2xl">
        <h1 className="mb-3 text-xl font-bold text-slate-900">{judul}</h1>
        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Akun Anda belum tertaut ke data penduduk. Hubungi kantor desa.
        </div>
      </div>
    );
  }

  const belumBayar = daftar
    .filter((t: { status: string }) => t.status === 'BELUM_BAYAR')
    .reduce((s: number, t: { jumlah: number }) => s + t.jumlah, 0);

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">{judul}</h1>
      <p className="mb-5 text-sm text-slate-500">
        {hanyaPajak
          ? 'Pajak Bumi dan Bangunan yang tercatat atas nama Anda.'
          : 'Iuran, sewa aset desa, dan tagihan lainnya.'}
      </p>

      {belumBayar > 0 && (
        <div className="kartu mb-4">
          <p className="text-xs text-slate-500">Belum dibayar</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {formatRupiah(belumBayar)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Pembayaran dilakukan langsung di kantor desa.
          </p>
        </div>
      )}

      {daftar.length === 0 && <Kosong pesan="Tidak ada tagihan atas nama Anda." />}

      <ul className="space-y-3">
        {daftar.map(
          (t: {
            id: string;
            jenis: string;
            judul: string;
            tahun: number;
            periode: string | null;
            jumlah: number;
            jatuhTempo: string | null;
            status: string;
            dibayarPada: string | null;
          }) => {
            const lewat =
              t.status === 'BELUM_BAYAR' && t.jatuhTempo && new Date(t.jatuhTempo) < new Date();
            return (
              <li key={t.id} className="kartu flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {LABEL_JENIS_TAGIHAN[t.jenis] ?? t.jenis}
                  </span>
                  <p className="mt-1 font-medium text-slate-900">{t.judul}</p>
                  <p className="text-xs text-slate-400">
                    Tahun {t.tahun}
                    {t.periode && ` · ${t.periode}`}
                    {t.jatuhTempo && ` · jatuh tempo ${tanggal(t.jatuhTempo)}`}
                  </p>
                  {lewat && (
                    <p className="mt-1 text-xs font-medium text-red-600">Sudah lewat jatuh tempo</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums text-slate-900">
                    {formatRupiah(t.jumlah)}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.status === 'LUNAS'
                        ? 'bg-desa-50 text-desa-800'
                        : t.status === 'DIBATALKAN'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {t.status === 'BELUM_BAYAR' ? 'belum bayar' : t.status.toLowerCase()}
                  </span>
                  {t.dibayarPada && (
                    <p className="mt-1 text-xs text-slate-400">{tanggal(t.dibayarPada)}</p>
                  )}
                </div>
              </li>
            );
          },
        )}
      </ul>
    </div>
  );
}

export const PajakDesa = () => <DaftarTagihan judul="Pajak Desa" hanyaPajak />;
export const TagihanSaya = () => <DaftarTagihan judul="Tagihan" hanyaPajak={false} />;

// ─────────────────────────────────────────────
// PENGADUAN SAYA
// ─────────────────────────────────────────────

export function PengaduanSaya() {
  const { data, isLoading } = useQuery({
    queryKey: ['pengaduan-saya'],
    queryFn: async () => (await api.get('/pengaduan/saya')).data.data,
  });

  return (
    <div className="max-w-2xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pengaduan Saya</h1>
          <p className="text-sm text-slate-500">Laporan yang Anda sampaikan dan tindak lanjutnya.</p>
        </div>
        <Link to="/pengaduan/buat" className="tombol-utama text-xs">
          Laporan Baru
        </Link>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Memuat…</p>}
      {data?.length === 0 && (
        <Kosong pesan="Anda belum pernah menyampaikan laporan." />
      )}

      <ul className="space-y-3">
        {data?.map(
          (p: {
            id: string;
            kodeLacak: string;
            kategori: string;
            judul: string;
            status: string;
            anonim: boolean;
            dibuatPada: string;
            tanggapanTerakhir: string | null;
          }) => (
            <li key={p.id} className="kartu">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {LABEL_KATEGORI[p.kategori] ?? p.kategori}
                    </span>
                    {p.anonim && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        anonim di publik
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-medium text-slate-900">{p.judul}</p>
                  <p className="text-xs text-slate-400">
                    {p.kodeLacak} · {tanggal(p.dibuatPada)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    WARNA_STATUS_ADU[p.status] ?? 'bg-slate-100'
                  }`}
                >
                  {LABEL_STATUS_ADU[p.status] ?? p.status}
                </span>
              </div>

              {p.tanggapanTerakhir && (
                <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  <b>Tanggapan terakhir:</b> {p.tanggapanTerakhir}
                </p>
              )}

              <Link
                to={`/pengaduan/lacak/${p.kodeLacak}`}
                className="mt-3 inline-block text-xs font-medium text-desa-700 hover:underline"
              >
                Lihat perkembangan lengkap
              </Link>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────
// SERTIFIKAT & RIWAYAT KEGIATAN
// ─────────────────────────────────────────────

export function SertifikatSaya() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['sertifikat-saya'],
    queryFn: async () => (await api.get('/sertifikat/saya')).data.data,
  });

  if (isLoading) return <p className="text-sm text-slate-500">Memuat…</p>;
  if (isError) {
    return (
      <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
        Akun Anda belum tertaut ke data penduduk. Hubungi kantor desa.
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Sertifikat Pelatihan</h1>
      <p className="mb-5 text-sm text-slate-500">
        Pelatihan yang Anda ikuti dan tercatat di desa.
      </p>

      {data?.length === 0 && (
        <Kosong pesan="Belum ada sertifikat pelatihan atas nama Anda." />
      )}

      <ul className="space-y-3">
        {data?.map(
          (s: {
            id: string;
            namaPelatihan: string;
            penyelenggara: string;
            tanggalMulai: string;
            tanggalSelesai: string | null;
            nomorSertifikat: string | null;
            berkasUrl: string | null;
          }) => (
            <li key={s.id} className="kartu flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{s.namaPelatihan}</p>
                <p className="text-xs text-slate-400">
                  {s.penyelenggara} · {tanggal(s.tanggalMulai)}
                  {s.tanggalSelesai && ` – ${tanggal(s.tanggalSelesai)}`}
                </p>
                {s.nomorSertifikat && (
                  <p className="mt-1 text-xs text-slate-500">No. {s.nomorSertifikat}</p>
                )}
              </div>
              {s.berkasUrl && (
                <a
                  href={s.berkasUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="tombol-sekunder text-xs"
                >
                  Lihat sertifikat
                </a>
              )}
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

export function RiwayatKegiatan() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['kegiatan-saya'],
    queryFn: async () => (await api.get('/kegiatan/saya')).data.data,
  });

  if (isLoading) return <p className="text-sm text-slate-500">Memuat…</p>;
  if (isError) {
    return (
      <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
        Akun Anda belum tertaut ke data penduduk. Hubungi kantor desa.
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-xl font-bold text-slate-900">Riwayat Kegiatan</h1>
      <p className="mb-5 text-sm text-slate-500">
        Kegiatan desa yang pernah Anda ikuti, dicatat perangkat desa.
      </p>

      {data?.length === 0 && <Kosong pesan="Belum ada kegiatan yang tercatat." />}

      <ol className="space-y-3">
        {data?.map(
          (k: {
            id: string;
            judul: string;
            tanggal: string;
            peran: string | null;
            keterangan: string | null;
          }) => (
            <li key={k.id} className="kartu">
              <p className="font-medium text-slate-900">{k.judul}</p>
              <p className="text-xs text-slate-400">
                {tanggal(k.tanggal)}
                {k.peran && ` · sebagai ${k.peran}`}
              </p>
              {k.keterangan && <p className="mt-1 text-sm text-slate-600">{k.keterangan}</p>}
            </li>
          ),
        )}
      </ol>
    </div>
  );
}
