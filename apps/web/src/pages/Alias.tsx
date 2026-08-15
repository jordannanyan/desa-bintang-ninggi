import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

/**
 * Beberapa sub-item pada dokumen kebutuhan punya alamat sendiri, tetapi isinya
 * adalah bagian dari halaman lain — misalnya "Sejarah desa" yang merupakan satu
 * blok pada Profil Desa. Alamat itu tetap dipertahankan agar tautan lama dan
 * tautan yang dibagikan warga tidak mati, lalu dialihkan ke isi sebenarnya.
 */
export const KeHalaman = ({ tujuan }: { tujuan: string }) => (
  <Navigate to={tujuan} replace />
);

/** Alamat lama verifikasi QR: /layanan/verifikasi/:kode → /verifikasi/:kode. */
export function AlihVerifikasi() {
  const { kode } = useParams();
  return <Navigate to={kode ? `/verifikasi/${kode}` : '/verifikasi'} replace />;
}

/**
 * Keranjang sengaja tidak berdiri sendiri: tiap pesanan berakhir pada satu
 * UMKM yang memverifikasi pembayarannya sendiri, jadi belanja dari dua toko
 * dalam satu keranjang tidak bisa diselesaikan siapa pun.
 */
export function KeranjangInfo() {
  return (
    <div className="kontainer max-w-2xl py-12">
      <h1 className="judul-halaman">Keranjang Belanja</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Keranjang berada di dalam halaman masing-masing UMKM. Pembayaran memakai QRIS milik
        penjual dan bukti bayarnya diverifikasi oleh penjual itu sendiri, sehingga satu pesanan
        selalu berisi produk dari satu toko.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link to="/umkm" className="tombol-utama">
          Lihat daftar UMKM
        </Link>
        <Link to="/warga/pesanan" className="tombol-sekunder text-sm">
          Pesanan saya
        </Link>
      </div>
    </div>
  );
}

/**
 * Permohonan Informasi Publik (UU 14/2008). Diproses secara tatap muka atau
 * lewat kanal resmi desa — bukan formulir daring, karena pemohon wajib
 * menunjukkan identitas dan menerima tanda terima bernomor.
 */
export function PermohonanInformasi() {
  const { data: profil } = useQuery({
    queryKey: ['profil'],
    queryFn: async () =>
      (await api.get('/profil')).data.data as {
        namaDesa: string;
        alamatKantor: string | null;
        waDesa: string | null;
        email: string | null;
        jamPelayanan: Record<string, string> | null;
      } | null,
  });

  const langkah = [
    'Ajukan permohonan secara tertulis atau lisan kepada petugas PPID di kantor desa.',
    'Sertakan identitas diri (KTP) serta rincian informasi yang diminta dan tujuan penggunaannya.',
    'Petugas mencatat permohonan dan memberikan tanda terima bernomor.',
    'Permohonan dijawab paling lama 10 hari kerja, dan dapat diperpanjang 7 hari kerja dengan pemberitahuan tertulis.',
    'Bila permohonan ditolak, penolakan disertai alasan tertulis dan dapat diajukan keberatan.',
  ];

  return (
    <div className="kontainer max-w-3xl py-10">
      <h1 className="judul-halaman">Permohonan Informasi Publik</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
        Setiap warga berhak memperoleh informasi publik yang dikuasai pemerintah desa,
        sebagaimana diatur Undang-Undang Nomor 14 Tahun 2008 tentang Keterbukaan Informasi
        Publik.
      </p>

      <section className="kartu mt-6">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Alur Permohonan</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
          {langkah.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ol>
      </section>

      <section className="kartu mt-4">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Kanal Resmi</h2>
        <dl className="grid gap-2 text-sm">
          {[
            ['Alamat kantor', profil?.alamatKantor],
            ['WhatsApp desa', profil?.waDesa],
            ['Surel', profil?.email],
          ]
            .filter(([, v]) => v)
            .map(([l, v]) => (
              <div key={l as string} className="flex gap-3">
                <dt className="w-32 shrink-0 text-slate-500">{l}</dt>
                <dd className="text-slate-800">{v}</dd>
              </div>
            ))}
        </dl>
        {profil?.jamPelayanan && Object.keys(profil.jamPelayanan).length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold text-slate-800">Jam pelayanan</h3>
            <ul className="mt-1 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
              {Object.entries(profil.jamPelayanan).map(([hari, jam]) => (
                <li key={hari} className="flex gap-3">
                  <span className="w-24 shrink-0 capitalize text-slate-500">{hari}</span>
                  <span>{jam}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {!profil?.alamatKantor && !profil?.waDesa && !profil?.email && (
          <p className="text-sm text-slate-400">
            Kontak resmi desa belum diisi. Perangkat desa dapat melengkapinya lewat Dashboard
            Perangkat → Profil Desa.
          </p>
        )}
      </section>

      <section className="kartu mt-4">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Informasi yang Sudah Tersedia</h2>
        <p className="text-sm text-slate-600">
          Sebagian besar informasi publik desa sudah diumumkan dan bisa diunduh langsung tanpa
          perlu mengajukan permohonan.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/ppid" className="tombol-sekunder text-sm">
            Daftar informasi PPID
          </Link>
          <Link to="/pemerintahan" className="tombol-sekunder text-sm">
            Dokumen pemerintahan
          </Link>
          <Link to="/keuangan" className="tombol-sekunder text-sm">
            Transparansi keuangan
          </Link>
        </div>
      </section>
    </div>
  );
}
