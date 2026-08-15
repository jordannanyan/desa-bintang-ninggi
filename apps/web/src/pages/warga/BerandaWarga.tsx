import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatRupiah } from '@desa/shared';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { TINTA } from '../../components/viz/tokens';

interface RingkasanWarga {
  tertaut: boolean;
  nama: string | null;
  suratDiproses: number;
  suratSiapDiambil: number;
  pengaduanAktif: number;
  pesananAktif: number;
  tagihanBelum: number;
  tagihanNilai: number;
  bantuanAktif: number;
  sertifikat: number;
}

function salam() {
  const jam = new Date().getHours();
  if (jam < 11) return 'Selamat pagi';
  if (jam < 15) return 'Selamat siang';
  if (jam < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/**
 * Kartu kabar: menyampaikan satu keadaan yang sedang berjalan untuk warga ini.
 *
 * Nadanya ditentukan isi, bukan warna saja — setiap kartu selalu memuat
 * kalimat yang menjelaskan angkanya, sehingga tetap terbaca oleh siapa pun
 * yang tidak membedakan warna.
 */
function Kabar({
  judul,
  nilai,
  kalimat,
  ke,
  nada = 'netral',
}: {
  judul: string;
  nilai: string | number;
  kalimat: string;
  ke: string;
  nada?: 'netral' | 'perhatian' | 'baik';
}) {
  const garis =
    nada === 'perhatian'
      ? 'border-l-4 border-l-amber-400'
      : nada === 'baik'
        ? 'border-l-4 border-l-desa-500'
        : '';
  const warnaAngka =
    nada === 'perhatian' ? '#b45309' : nada === 'baik' ? '#1f7a4d' : TINTA.utama;

  return (
    <Link
      to={ke}
      className={`kartu group flex flex-col transition hover:-translate-y-0.5 hover:shadow-md ${garis}`}
    >
      <p className="text-xs" style={{ color: TINTA.sekunder }}>
        {judul}
      </p>
      <p className="mt-1 text-3xl font-bold leading-none" style={{ color: warnaAngka }}>
        {nilai}
      </p>
      <p className="mt-2 text-xs" style={{ color: TINTA.redup }}>
        {kalimat}
      </p>
      <span className="mt-2 text-xs font-medium text-desa-700 group-hover:underline">
        Buka →
      </span>
    </Link>
  );
}

export function BerandaWarga() {
  const { pengguna } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['ringkasan-warga'],
    queryFn: async () => (await api.get('/saya/ringkasan')).data.data as RingkasanWarga,
  });

  const nama = data?.nama ?? pengguna?.nama ?? '';

  const layanan = [
    {
      judul: 'Ajukan surat',
      ringkas: 'Domisili, keterangan usaha, tidak mampu, dan sebelas jenis lainnya.',
      ke: '/layanan',
    },
    {
      judul: 'Sampaikan pengaduan',
      ringkas: 'Jalan rusak, lampu mati, sampah — lengkap dengan foto dan lokasi.',
      ke: '/pengaduan/buat',
    },
    {
      judul: 'Belanja produk warga',
      ringkas: 'Produk UMKM desa, bayar lewat QRIS penjual.',
      ke: '/umkm',
    },
    {
      judul: 'Cek penggunaan anggaran',
      ringkas: 'Pendapatan dan belanja desa tahun berjalan.',
      ke: '/keuangan',
    },
  ];

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="kartu h-28 animate-pulse bg-slate-100" />
        ))}
      </div>
    );
  }

  const adaKabar =
    data.suratDiproses + data.suratSiapDiambil + data.tagihanBelum + data.pengaduanAktif > 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          {salam()}
          {nama ? `, ${nama.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {adaKabar
            ? 'Ada beberapa hal yang sedang berjalan untuk Anda.'
            : 'Tidak ada urusan yang sedang berjalan. Silakan pakai layanan di bawah.'}
        </p>
      </header>

      {!data.tertaut && (
        <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Akun Anda belum tertaut ke data penduduk, jadi tagihan, bantuan, dan sertifikat belum
          bisa ditampilkan. Hubungi kantor desa untuk menautkannya.
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Yang Sedang Berjalan</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kabar
            judul="Surat siap diambil"
            nilai={data.suratSiapDiambil}
            kalimat={
              data.suratSiapDiambil > 0
                ? 'Sudah bisa diunduh atau diambil di kantor desa.'
                : 'Belum ada surat yang terbit.'
            }
            ke="/warga/surat"
            nada={data.suratSiapDiambil > 0 ? 'baik' : 'netral'}
          />
          <Kabar
            judul="Surat sedang diproses"
            nilai={data.suratDiproses}
            kalimat={
              data.suratDiproses > 0
                ? 'Menunggu ditinjau perangkat desa.'
                : 'Tidak ada pengajuan berjalan.'
            }
            ke="/warga/surat"
          />
          <Kabar
            judul="Tagihan belum dibayar"
            nilai={data.tagihanBelum}
            kalimat={
              data.tagihanBelum > 0
                ? `Senilai ${formatRupiah(data.tagihanNilai)}.`
                : 'Tidak ada tagihan tertunggak.'
            }
            ke="/warga/tagihan"
            nada={data.tagihanBelum > 0 ? 'perhatian' : 'netral'}
          />
          <Kabar
            judul="Pengaduan aktif"
            nilai={data.pengaduanAktif}
            kalimat={
              data.pengaduanAktif > 0
                ? 'Sedang ditangani perangkat desa.'
                : 'Tidak ada laporan berjalan.'
            }
            ke="/warga/pengaduan"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Layanan</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {layanan.map((l) => (
            <Link
              key={l.ke}
              to={l.ke}
              className="kartu transition hover:border-desa-300 hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900">{l.judul}</h3>
              <p className="mt-1 text-sm text-slate-500">{l.ringkas}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Catatan Anda di Desa</h2>
        <div className="kartu">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {[
              ['Bantuan diterima', data.bantuanAktif, '/warga/bantuan'],
              ['Sertifikat pelatihan', data.sertifikat, '/warga/sertifikat'],
              ['Pesanan berjalan', data.pesananAktif, '/warga/pesanan'],
            ].map(([label, nilai, ke]) => (
              <div key={label as string}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd>
                  <Link
                    to={ke as string}
                    className="text-xl font-semibold tabular-nums text-slate-900 hover:text-desa-700"
                  >
                    {nilai}
                  </Link>
                </dd>
              </div>
            ))}
          </dl>
          <Link
            to="/warga/profil"
            className="mt-4 inline-block text-xs font-medium text-desa-700 hover:underline"
          >
            Lihat data pribadi Anda →
          </Link>
        </div>
      </section>
    </div>
  );
}
