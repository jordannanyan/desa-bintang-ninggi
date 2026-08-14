import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { StatistikKependudukan } from '@desa/shared';
import { api } from '../lib/api';
import { AngkaUtama, BatangProporsi, StatTile } from '../components/viz/StatTile';
import { BarKategori } from '../components/viz/BarKategori';

/**
 * Halaman publik Data Kependudukan.
 *
 * Seluruh angka di sini agregat. Tidak ada satu pun tampilan yang bisa
 * dipersempit ke individu, dan endpoint-nya tidak menerima parameter apa pun —
 * itu yang membuat halaman ini aman dibuka siapa saja.
 */
/** Enum database ditampilkan dengan ejaan yang lazim dibaca warga. */
const LABEL_KAWIN: Record<string, string> = {
  BELUM_KAWIN: 'Belum kawin',
  KAWIN: 'Kawin',
  CERAI_HIDUP: 'Cerai hidup',
  CERAI_MATI: 'Cerai mati',
};

export function Kependudukan() {
  const [sebagaiTabel, setSebagaiTabel] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['statistik-kependudukan'],
    queryFn: async () => {
      const res = await api.get<{ ok: true; data: StatistikKependudukan }>(
        '/kependudukan/statistik',
      );
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="kontainer py-16 text-center text-sm text-slate-500">
        Memuat data kependudukan…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="kontainer py-16">
        <h1 className="judul-halaman mb-2">Data Kependudukan</h1>
        <p className="text-slate-600">
          Data belum dapat ditampilkan. Silakan coba beberapa saat lagi.
        </p>
      </div>
    );
  }

  const kosong = data.totalPenduduk === 0;

  return (
    <div className="kontainer py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="judul-halaman">Data Kependudukan</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Ringkasan penduduk Desa Bintang Ninggi I. Seluruh angka bersifat agregat —
            tidak memuat data pribadi siapa pun.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSebagaiTabel((v) => !v)}
          className="tombol-sekunder text-xs"
          aria-pressed={sebagaiTabel}
        >
          {sebagaiTabel ? 'Tampilkan grafik' : 'Tampilkan tabel'}
        </button>
      </div>

      {kosong && (
        <div className="mb-8 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-amber-900">
          Data penduduk belum diisi. Perangkat desa dapat memasukkannya lewat Dashboard
          Perangkat, satu per satu atau sekaligus dari berkas CSV.
        </div>
      )}

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <AngkaUtama
          label="Jumlah penduduk"
          nilai={data.totalPenduduk}
          keterangan="Penduduk aktif, tidak termasuk yang meninggal atau pindah"
        />
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatTile label="Kartu Keluarga" nilai={data.totalKk} />
          <StatTile label="Balita" nilai={data.balita} keterangan="Usia 0–4 tahun" />
          <StatTile label="Lansia" nilai={data.lansia} keterangan="Usia 60 tahun ke atas" />
          <StatTile
            label="Penyandang disabilitas"
            nilai={data.disabilitas}
          />
        </div>
      </div>

      <div className="mb-4">
        <BatangProporsi
          judul="Perbandingan jenis kelamin"
          bagian={[
            { label: 'Laki-laki', jumlah: data.lakiLaki },
            { label: 'Perempuan', jumlah: data.perempuan },
          ]}
        />
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatTile label="Kelahiran tahun ini" nilai={data.kelahiranTahunIni} />
        <StatTile label="Kematian tahun ini" nilai={data.kematianTahunIni} />
        <StatTile label="Pindah tahun ini" nilai={data.pindahTahunIni} />
      </div>

      {/* items-start: kartu mengikuti tinggi isinya, tidak diregangkan
          menyamai tetangganya yang lebih panjang. */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <BarKategori
          judul="Kelompok usia"
          data={data.perKelompokUsia}
          sebagaiTabel={sebagaiTabel}
        />
        <BarKategori
          judul="Pendidikan terakhir"
          data={data.perPendidikan}
          sebagaiTabel={sebagaiTabel}
        />
        <BarKategori judul="Agama" data={data.perAgama} sebagaiTabel={sebagaiTabel} />
        <BarKategori
          judul="Status perkawinan"
          data={data.perStatusKawin.map((d) => ({
            ...d,
            label: LABEL_KAWIN[d.label] ?? d.label,
          }))}
          sebagaiTabel={sebagaiTabel}
        />
        <BarKategori
          judul="Pekerjaan"
          keterangan="15 jenis pekerjaan terbanyak"
          data={data.perPekerjaan}
          sebagaiTabel={sebagaiTabel}
          sebagian
        />
        <BarKategori
          judul="Sebaran per RT"
          data={data.perRt}
          sebagaiTabel={sebagaiTabel}
        />
      </div>

      <p className="mt-8 text-xs text-slate-400">
        Diperbarui otomatis setiap ada perubahan data di Dashboard Perangkat Desa.
      </p>
    </div>
  );
}
