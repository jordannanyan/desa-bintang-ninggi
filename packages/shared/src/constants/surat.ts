/** Katalog jenis surat pada Pelayanan Online (section 4). */

export interface JenisSurat {
  kode: string;
  nama: string;
  /** Field tambahan di luar identitas pemohon yang harus diisi. */
  fieldTambahan: string[];
  /** Lampiran yang wajib diunggah pemohon. */
  lampiran: string[];
}

export const JENIS_SURAT: JenisSurat[] = [
  { kode: 'DOMISILI', nama: 'Surat Domisili', fieldTambahan: ['alamat_domisili', 'lama_tinggal', 'keperluan'], lampiran: ['KTP', 'KK'] },
  { kode: 'USAHA', nama: 'Surat Keterangan Usaha', fieldTambahan: ['nama_usaha', 'jenis_usaha', 'alamat_usaha', 'tahun_berdiri'], lampiran: ['KTP', 'KK', 'Foto usaha'] },
  { kode: 'TIDAK_MAMPU', nama: 'Surat Tidak Mampu', fieldTambahan: ['keperluan', 'penghasilan_perbulan'], lampiran: ['KTP', 'KK'] },
  { kode: 'KELAHIRAN', nama: 'Surat Kelahiran', fieldTambahan: ['nama_anak', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'nama_ayah', 'nama_ibu'], lampiran: ['KK', 'Surat keterangan bidan/RS'] },
  { kode: 'KEMATIAN', nama: 'Surat Kematian', fieldTambahan: ['nama_almarhum', 'nik_almarhum', 'tanggal_meninggal', 'sebab_meninggal', 'tempat_meninggal'], lampiran: ['KTP almarhum', 'KK'] },
  { kode: 'PINDAH', nama: 'Surat Pindah', fieldTambahan: ['alamat_tujuan', 'alasan_pindah', 'jumlah_pengikut'], lampiran: ['KTP', 'KK'] },
  { kode: 'PENGANTAR_NIKAH', nama: 'Surat Pengantar Nikah', fieldTambahan: ['nama_pasangan', 'nik_pasangan', 'status_perkawinan', 'rencana_tanggal'], lampiran: ['KTP', 'KK', 'Akta kelahiran'] },
  { kode: 'KEHILANGAN', nama: 'Surat Kehilangan', fieldTambahan: ['barang_hilang', 'lokasi_kehilangan', 'tanggal_kehilangan', 'kronologi'], lampiran: ['KTP'] },
  { kode: 'AHLI_WARIS', nama: 'Surat Ahli Waris', fieldTambahan: ['nama_pewaris', 'tanggal_wafat', 'daftar_ahli_waris'], lampiran: ['KK', 'Surat kematian pewaris'] },
  { kode: 'BELUM_MENIKAH', nama: 'Surat Keterangan Belum Menikah', fieldTambahan: ['keperluan'], lampiran: ['KTP', 'KK'] },
  { kode: 'PENGHASILAN', nama: 'Surat Keterangan Penghasilan', fieldTambahan: ['pekerjaan', 'penghasilan_perbulan', 'keperluan'], lampiran: ['KTP', 'KK'] },
  { kode: 'SKCK', nama: 'Surat Pengantar SKCK', fieldTambahan: ['keperluan'], lampiran: ['KTP', 'KK'] },
  { kode: 'IZIN_KERAMAIAN', nama: 'Surat Izin Keramaian', fieldTambahan: ['jenis_acara', 'tanggal_acara', 'lokasi_acara', 'perkiraan_jumlah_tamu', 'penanggung_jawab'], lampiran: ['KTP', 'Proposal acara'] },
  { kode: 'LAINNYA', nama: 'Surat lainnya', fieldTambahan: ['judul_surat', 'isi_permohonan'], lampiran: ['KTP'] },
];

export const STATUS_PENGAJUAN = ['DIPROSES', 'DISETUJUI', 'DITOLAK', 'SIAP_DIAMBIL'] as const;
export type StatusPengajuan = (typeof STATUS_PENGAJUAN)[number];

export const LABEL_STATUS: Record<StatusPengajuan, string> = {
  DIPROSES: 'Diproses',
  DISETUJUI: 'Disetujui',
  DITOLAK: 'Ditolak',
  SIAP_DIAMBIL: 'Siap diambil',
};
