import { api } from './api';

export interface BerkasTerunggah {
  id: string;
  nama: string;
  url: string;
  ukuranByte: number;
}

type Kategori = 'pengaduan' | 'lampiran-surat' | 'galeri' | 'dokumen' | 'proyek' | 'umkm';

/**
 * Mengunggah berkas ke server dan mengembalikan id-nya.
 *
 * Server yang mengecilkan gambar dan membuang metadata EXIF, jadi berkas
 * dikirim apa adanya. Foto dari ponsel bisa 8 MB; itulah sebabnya batas
 * ukurannya diperiksa lebih dulu di sini, agar warga tidak menunggu unggahan
 * panjang hanya untuk ditolak di ujung.
 */
export async function unggahBerkas(
  berkas: File[],
  kategori: Kategori,
  batasMb = 5,
): Promise<BerkasTerunggah[]> {
  const terlaluBesar = berkas.find((f) => f.size > batasMb * 1024 * 1024);
  if (terlaluBesar) {
    throw new Error(
      `"${terlaluBesar.name}" berukuran ${(terlaluBesar.size / 1024 / 1024).toFixed(1)} MB, melebihi batas ${batasMb} MB.`,
    );
  }

  const muatan = new FormData();
  for (const f of berkas) muatan.append('berkas', f);

  const res = await api.post(`/berkas/banyak?kategori=${kategori}`, muatan);
  return res.data.data as BerkasTerunggah[];
}
