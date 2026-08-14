import type { Request } from 'express';
import Papa from 'papaparse';
import {
  KOLOM_IMPOR_PENDUDUK,
  pendudukSchema,
  type HasilImporPenduduk,
} from '@desa/shared';
import { prisma } from '../../lib/prisma.js';
import { dekripsi, hashPencarian } from '../../lib/crypto.js';
import { AKSI, catatAudit } from '../../lib/audit.js';
import { AppError } from '../../middleware/error.js';
import { tambahPenduduk, ubahPenduduk } from './penduduk.service.js';

/**
 * Impor data penduduk dari CSV.
 *
 * Sengaja TIDAK dibungkus satu transaksi besar. Berkas dari desa hampir selalu
 * punya beberapa baris bermasalah — kalau seluruh impor dibatalkan gara-gara
 * satu baris, perangkat desa harus mengulang dari awal berkali-kali. Yang
 * dilakukan: baris yang valid disimpan, baris yang gagal dilaporkan lengkap
 * dengan nomor barisnya supaya bisa diperbaiki lalu diimpor ulang.
 */

const NILAI_KOSONG = new Set(['', '-', 'null', 'NULL', 'n/a', 'N/A']);
const bersihkan = (v: unknown): string | undefined => {
  const s = String(v ?? '').trim();
  return NILAI_KOSONG.has(s) ? undefined : s;
};

/** Menerima 1990-05-17, 17/05/1990, dan 17-05-1990. */
function bacaTanggal(nilai: string | undefined): Date | undefined {
  if (!nilai) return undefined;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nilai);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));

  const lokal = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(nilai);
  if (lokal) return new Date(Number(lokal[3]), Number(lokal[2]) - 1, Number(lokal[1]));

  return undefined;
}

const PETA_KELAMIN: Record<string, 'LAKI_LAKI' | 'PEREMPUAN'> = {
  L: 'LAKI_LAKI',
  'LAKI-LAKI': 'LAKI_LAKI',
  'LAKI LAKI': 'LAKI_LAKI',
  PRIA: 'LAKI_LAKI',
  P: 'PEREMPUAN',
  PEREMPUAN: 'PEREMPUAN',
  WANITA: 'PEREMPUAN',
};

const PETA_KAWIN: Record<string, 'BELUM_KAWIN' | 'KAWIN' | 'CERAI_HIDUP' | 'CERAI_MATI'> = {
  'BELUM KAWIN': 'BELUM_KAWIN',
  KAWIN: 'KAWIN',
  'CERAI HIDUP': 'CERAI_HIDUP',
  'CERAI MATI': 'CERAI_MATI',
};

export async function imporPendudukCsv(
  req: Request,
  isiBerkas: string,
  opsi: { perbaruiYangAda: boolean },
): Promise<HasilImporPenduduk> {
  const parsed = Papa.parse<Record<string, string>>(isiBerkas, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
  });

  if (!parsed.data.length) {
    throw new AppError(400, 'CSV_KOSONG', 'Berkas CSV tidak berisi data');
  }

  const kolomAda = new Set(Object.keys(parsed.data[0] ?? {}));
  const wajib = ['nik', 'no_kk', 'nama', 'jenis_kelamin', 'tanggal_lahir', 'alamat', 'rt', 'rw'];
  const kurang = wajib.filter((k) => !kolomAda.has(k));
  if (kurang.length) {
    throw new AppError(
      400,
      'KOLOM_KURANG',
      `Kolom wajib belum ada: ${kurang.join(', ')}. Urutan kolom lengkap: ${KOLOM_IMPOR_PENDUDUK.join(', ')}`,
    );
  }

  const hasil: HasilImporPenduduk = {
    totalBaris: parsed.data.length,
    berhasil: 0,
    dilewati: 0,
    gagal: [],
  };

  for (const [i, baris] of parsed.data.entries()) {
    // +2 karena baris 1 adalah judul kolom, dan pengguna menghitung dari 1.
    const nomorBaris = i + 2;
    const nama = bersihkan(baris.nama);

    try {
      const kelaminMentah = (bersihkan(baris.jenis_kelamin) ?? '').toUpperCase();
      const kawinMentah = (bersihkan(baris.status_perkawinan) ?? 'BELUM KAWIN').toUpperCase();

      const kandidat = {
        nik: (bersihkan(baris.nik) ?? '').replace(/\D/g, ''),
        nomorKk: (bersihkan(baris.no_kk) ?? '').replace(/\D/g, ''),
        nama,
        jenisKelamin: PETA_KELAMIN[kelaminMentah],
        tempatLahir: bersihkan(baris.tempat_lahir) ?? '-',
        tanggalLahir: bacaTanggal(bersihkan(baris.tanggal_lahir)),
        agama: bersihkan(baris.agama) ?? 'Islam',
        pendidikan: bersihkan(baris.pendidikan) ?? 'Tidak/Belum Sekolah',
        pekerjaan: bersihkan(baris.pekerjaan) ?? 'Belum/Tidak Bekerja',
        statusKawin: PETA_KAWIN[kawinMentah],
        hubunganKeluarga: bersihkan(baris.hubungan_keluarga) ?? 'Anak',
        kewarganegaraan: (bersihkan(baris.kewarganegaraan) ?? 'WNI').toUpperCase(),
        namaAyah: bersihkan(baris.nama_ayah),
        namaIbu: bersihkan(baris.nama_ibu),
        golonganDarah: bersihkan(baris.golongan_darah),
        pendatang: false,
      };

      if (!kandidat.jenisKelamin) {
        throw new Error(`Jenis kelamin "${baris.jenis_kelamin}" tidak dikenali (isi L atau P)`);
      }
      if (!kandidat.statusKawin) {
        throw new Error(`Status perkawinan "${baris.status_perkawinan}" tidak dikenali`);
      }
      if (!kandidat.tanggalLahir) {
        throw new Error(
          `Tanggal lahir "${baris.tanggal_lahir}" tidak terbaca (pakai 1990-05-17 atau 17/05/1990)`,
        );
      }

      const hasilValidasi = pendudukSchema.safeParse(kandidat);
      if (!hasilValidasi.success) {
        const pertama = hasilValidasi.error.issues[0];
        throw new Error(`${pertama.path.join('.')}: ${pertama.message}`);
      }

      const alamat = {
        alamat: bersihkan(baris.alamat) ?? '-',
        rt: bersihkan(baris.rt) ?? '-',
        rw: bersihkan(baris.rw) ?? '-',
        dusun: bersihkan(baris.dusun),
      };

      const sudahAda = await prisma.penduduk.findUnique({
        where: { nikHash: hashPencarian(kandidat.nik) },
        select: { id: true },
      });

      if (sudahAda && !opsi.perbaruiYangAda) {
        hasil.dilewati++;
        continue;
      }

      if (sudahAda) {
        await ubahPenduduk(req, sudahAda.id, { ...hasilValidasi.data, ...alamat });
      } else {
        await tambahPenduduk(req, { ...hasilValidasi.data, ...alamat });
      }
      hasil.berhasil++;
    } catch (err) {
      hasil.gagal.push({
        baris: nomorBaris,
        nama,
        pesan: err instanceof Error ? err.message : 'Kesalahan tidak dikenal',
      });
    }
  }

  await catatAudit(req, 'IMPOR_PENDUDUK', 'Penduduk', undefined, {
    totalBaris: hasil.totalBaris,
    berhasil: hasil.berhasil,
    dilewati: hasil.dilewati,
    gagal: hasil.gagal.length,
  });

  return hasil;
}

/**
 * Ekspor seluruh data penduduk ke CSV.
 *
 * Ini operasi paling sensitif di seluruh sistem — satu berkas berisi NIK
 * seluruh warga desa. Karena itu dibatasi peran ADMIN dan selalu tercatat
 * di audit log lengkap dengan jumlah barisnya.
 */
export async function eksporPendudukCsv(req: Request): Promise<string> {
  const semua = await prisma.penduduk.findMany({
    where: { tanggalMeninggal: null, tanggalPindah: null },
    orderBy: [{ kartuKeluargaId: 'asc' }, { nama: 'asc' }],
    include: { kartuKeluarga: { include: { rt: { include: { rw: true } } } } },
  });

  const baris = semua.map((p) => ({
    nik: dekripsi(p.nikEnc),
    no_kk: dekripsi(p.kartuKeluarga.nomorKkEnc),
    nama: p.nama,
    jenis_kelamin: p.jenisKelamin === 'LAKI_LAKI' ? 'L' : 'P',
    tempat_lahir: p.tempatLahir,
    tanggal_lahir: p.tanggalLahir.toISOString().slice(0, 10),
    agama: p.agama,
    pendidikan: p.pendidikan,
    pekerjaan: p.pekerjaan,
    status_perkawinan: p.statusKawin.replace(/_/g, ' '),
    hubungan_keluarga: p.hubunganKeluarga,
    kewarganegaraan: p.kewarganegaraan,
    nama_ayah: p.namaAyah ?? '',
    nama_ibu: p.namaIbu ?? '',
    golongan_darah: p.golonganDarah ?? '',
    alamat: p.kartuKeluarga.alamat,
    rt: p.kartuKeluarga.rt.nomor,
    rw: p.kartuKeluarga.rt.rw.nomor,
    dusun: p.kartuKeluarga.dusun ?? '',
  }));

  await catatAudit(req, AKSI.EKSPOR_PENDUDUK, 'Penduduk', undefined, { jumlah: baris.length });

  return Papa.unparse(baris, { columns: [...KOLOM_IMPOR_PENDUDUK] });
}

/** Berkas contoh berisi judul kolom dan satu baris teladan. */
export function contohCsv(): string {
  return Papa.unparse(
    [
      {
        nik: '6205010101900001',
        no_kk: '6205010101900002',
        nama: 'Budi Santoso',
        jenis_kelamin: 'L',
        tempat_lahir: 'Bintang Ninggi',
        tanggal_lahir: '1990-01-01',
        agama: 'Islam',
        pendidikan: 'SLTA/Sederajat',
        pekerjaan: 'Petani/Pekebun',
        status_perkawinan: 'Kawin',
        hubungan_keluarga: 'Kepala Keluarga',
        kewarganegaraan: 'WNI',
        nama_ayah: 'Slamet',
        nama_ibu: 'Siti',
        golongan_darah: 'O',
        alamat: 'Jl. Merdeka No. 1',
        rt: '001',
        rw: '001',
        dusun: 'Dusun I',
      },
    ],
    { columns: [...KOLOM_IMPOR_PENDUDUK] },
  );
}
