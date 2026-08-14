/**
 * Nilai baku data kependudukan Indonesia.
 *
 * Mengikuti daftar yang dipakai Dukcapil pada Kartu Keluarga dan KTP-el.
 * Dipakai form entri perangkat desa, validasi impor, dan pengelompokan
 * statistik — sehingga "Belum/Tidak Bekerja" tidak pernah tercatat sebagai
 * "belum bekerja", "Tidak Bekerja", atau variasi lain yang memecah statistik.
 */

export const AGAMA = [
  'Islam',
  'Kristen',
  'Katolik',
  'Hindu',
  'Buddha',
  'Konghucu',
  'Kepercayaan Terhadap Tuhan YME',
] as const;

export const PENDIDIKAN = [
  'Tidak/Belum Sekolah',
  'Belum Tamat SD/Sederajat',
  'Tamat SD/Sederajat',
  'SLTP/Sederajat',
  'SLTA/Sederajat',
  'Diploma I/II',
  'Akademi/Diploma III/S. Muda',
  'Diploma IV/Strata I',
  'Strata II',
  'Strata III',
] as const;

export const STATUS_PERKAWINAN = [
  'Belum Kawin',
  'Kawin',
  'Cerai Hidup',
  'Cerai Mati',
] as const;

export const HUBUNGAN_KELUARGA = [
  'Kepala Keluarga',
  'Suami',
  'Istri',
  'Anak',
  'Menantu',
  'Cucu',
  'Orang Tua',
  'Mertua',
  'Famili Lain',
  'Pembantu',
  'Lainnya',
] as const;

export const GOLONGAN_DARAH = ['A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Tidak Tahu'] as const;

export const KEWARGANEGARAAN = ['WNI', 'WNA'] as const;

/**
 * Daftar pekerjaan Dukcapil aslinya memuat lebih dari 90 entri. Yang dimuat di
 * sini adalah yang relevan untuk desa; sisanya masuk lewat "Lainnya" dan bisa
 * ditambah admin dari dashboard karena kolomnya bertipe teks, bukan enum.
 */
export const PEKERJAAN = [
  'Belum/Tidak Bekerja',
  'Mengurus Rumah Tangga',
  'Pelajar/Mahasiswa',
  'Pensiunan',
  'Pegawai Negeri Sipil',
  'Tentara Nasional Indonesia',
  'Kepolisian RI',
  'Perdagangan',
  'Petani/Pekebun',
  'Peternak',
  'Nelayan/Perikanan',
  'Industri',
  'Konstruksi',
  'Transportasi',
  'Karyawan Swasta',
  'Karyawan BUMN',
  'Karyawan Honorer',
  'Buruh Harian Lepas',
  'Buruh Tani/Perkebunan',
  'Pembantu Rumah Tangga',
  'Tukang Kayu',
  'Tukang Batu',
  'Mekanik',
  'Wiraswasta',
  'Guru',
  'Bidan',
  'Perawat',
  'Sopir',
  'Pedagang',
  'Perangkat Desa',
  'Kepala Desa',
  'Lainnya',
] as const;

export const JENIS_DISABILITAS = [
  'Fisik',
  'Netra/Buta',
  'Rungu/Wicara',
  'Mental/Jiwa',
  'Fisik dan Mental',
  'Lainnya',
] as const;

export type Agama = (typeof AGAMA)[number];
export type Pendidikan = (typeof PENDIDIKAN)[number];
export type Pekerjaan = (typeof PEKERJAAN)[number];
export type HubunganKeluarga = (typeof HUBUNGAN_KELUARGA)[number];

/** Judul kolom berkas impor/ekspor CSV data penduduk. */
export const KOLOM_IMPOR_PENDUDUK = [
  'nik',
  'no_kk',
  'nama',
  'jenis_kelamin',
  'tempat_lahir',
  'tanggal_lahir',
  'agama',
  'pendidikan',
  'pekerjaan',
  'status_perkawinan',
  'hubungan_keluarga',
  'kewarganegaraan',
  'nama_ayah',
  'nama_ibu',
  'golongan_darah',
  'alamat',
  'rt',
  'rw',
  'dusun',
] as const;
