/**
 * Redaksi awal setiap jenis surat.
 *
 * Ini titik mulai, bukan aturan: seluruhnya bisa disunting perangkat desa lewat
 * dashboard tanpa deploy ulang. Redaksinya sengaja mengikuti susunan yang lazim
 * dipakai surat keterangan desa, supaya tinggal disesuaikan kebiasaan setempat.
 *
 * Baris berbentuk "Label : Nilai" otomatis dirapikan jadi dua kolom sejajar
 * saat dirender — tidak perlu menghitung spasi.
 */

const PEMBUKA = `Yang bertanda tangan di bawah ini Kepala Desa {{desa}}, Kecamatan {{kecamatan}}, Kabupaten {{kabupaten}}, dengan ini menerangkan bahwa:`;

const IDENTITAS = `Nama : {{nama}}
NIK : {{nik}}
Tempat/Tanggal Lahir : {{tempatTanggalLahir}}
Jenis Kelamin : {{jenisKelamin}}
Agama : {{agama}}
Pekerjaan : {{pekerjaan}}
Status Perkawinan : {{statusKawin}}
Kewarganegaraan : {{kewarganegaraan}}
Alamat : {{alamat}}`;

const PENUTUP = `Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.`;

const susun = (isi: string) => `${PEMBUKA}\n\n${IDENTITAS}\n\n${isi}\n\n${PENUTUP}`;

export const TEMPLATE_AWAL: Record<string, string> = {
  DOMISILI: susun(
    `Orang tersebut di atas adalah benar penduduk Desa {{desa}} dan berdomisili di alamat tersebut sejak {{lama_tinggal}}.

Surat keterangan ini dibuat untuk keperluan {{keperluan}}.`,
  ),

  USAHA: susun(
    `Orang tersebut di atas adalah benar penduduk Desa {{desa}} yang memiliki usaha dengan keterangan sebagai berikut:

Nama Usaha : {{nama_usaha}}
Jenis Usaha : {{jenis_usaha}}
Alamat Usaha : {{alamat_usaha}}
Berdiri Sejak : {{tahun_berdiri}}

Surat keterangan ini dibuat untuk keperluan {{keperluan}}.`,
  ),

  TIDAK_MAMPU: susun(
    `Orang tersebut di atas adalah benar penduduk Desa {{desa}} yang menurut sepengetahuan kami tergolong keluarga kurang mampu, dengan penghasilan rata-rata Rp {{penghasilan_perbulan}} per bulan.

Surat keterangan ini dibuat untuk keperluan {{keperluan}}.`,
  ),

  KELAHIRAN: susun(
    `Bahwa yang tersebut di atas adalah orang tua dari seorang anak dengan keterangan sebagai berikut:

Nama Anak : {{nama_anak}}
Tempat Lahir : {{tempat_lahir}}
Tanggal Lahir : {{tanggal_lahir}}
Jenis Kelamin : {{jenis_kelamin}}
Nama Ayah : {{nama_ayah}}
Nama Ibu : {{nama_ibu}}

Surat keterangan ini dibuat untuk keperluan {{keperluan}}.`,
  ),

  KEMATIAN: susun(
    `Bahwa telah meninggal dunia seorang penduduk Desa {{desa}} dengan keterangan sebagai berikut:

Nama Almarhum/ah : {{nama_almarhum}}
NIK : {{nik_almarhum}}
Tanggal Meninggal : {{tanggal_meninggal}}
Tempat Meninggal : {{tempat_meninggal}}
Sebab Meninggal : {{sebab_meninggal}}

Yang bersangkutan mempunyai hubungan keluarga dengan pemohon tersebut di atas.

Surat keterangan ini dibuat untuk keperluan {{keperluan}}.`,
  ),

  PINDAH: susun(
    `Orang tersebut di atas beserta {{jumlah_pengikut}} orang pengikut akan pindah tempat tinggal dengan keterangan sebagai berikut:

Alamat Tujuan : {{alamat_tujuan}}
Alasan Pindah : {{alasan_pindah}}

Surat keterangan ini dibuat untuk keperluan {{keperluan}}.`,
  ),

  PENGANTAR_NIKAH: susun(
    `Orang tersebut di atas bermaksud melangsungkan pernikahan dengan:

Nama Calon : {{nama_pasangan}}
NIK Calon : {{nik_pasangan}}
Status : {{status_perkawinan}}
Rencana Tanggal : {{rencana_tanggal}}

Sepanjang pengetahuan kami tidak terdapat halangan untuk melangsungkan pernikahan tersebut.

Surat pengantar ini dibuat untuk keperluan {{keperluan}}.`,
  ),

  KEHILANGAN: susun(
    `Orang tersebut di atas telah melaporkan kehilangan dengan keterangan sebagai berikut:

Barang yang Hilang : {{barang_hilang}}
Lokasi Kehilangan : {{lokasi_kehilangan}}
Tanggal Kehilangan : {{tanggal_kehilangan}}
Kronologi : {{kronologi}}

Surat keterangan ini dibuat untuk keperluan {{keperluan}}.`,
  ),

  AHLI_WARIS: susun(
    `Bahwa telah meninggal dunia {{nama_pewaris}} pada tanggal {{tanggal_wafat}}, dan meninggalkan ahli waris sebagai berikut:

{{daftar_ahli_waris}}

Surat keterangan ini dibuat untuk keperluan {{keperluan}}.`,
  ),

  BELUM_MENIKAH: susun(
    `Orang tersebut di atas sampai dengan surat keterangan ini dibuat benar-benar belum pernah menikah.

Surat keterangan ini dibuat untuk keperluan {{keperluan}}.`,
  ),

  PENGHASILAN: susun(
    `Orang tersebut di atas bekerja sebagai {{pekerjaan}} dengan penghasilan rata-rata Rp {{penghasilan_perbulan}} per bulan.

Surat keterangan ini dibuat untuk keperluan {{keperluan}}.`,
  ),

  SKCK: susun(
    `Orang tersebut di atas adalah benar penduduk Desa {{desa}} dan sepanjang pengetahuan kami berkelakuan baik serta tidak pernah tersangkut perkara pidana.

Surat pengantar ini dibuat untuk keperluan pengurusan SKCK guna {{keperluan}}.`,
  ),

  IZIN_KERAMAIAN: susun(
    `Orang tersebut di atas bermaksud menyelenggarakan kegiatan dengan keterangan sebagai berikut:

Jenis Acara : {{jenis_acara}}
Tanggal Acara : {{tanggal_acara}}
Lokasi Acara : {{lokasi_acara}}
Perkiraan Tamu : {{perkiraan_jumlah_tamu}} orang
Penanggung Jawab : {{penanggung_jawab}}

Pemerintah Desa tidak berkeberatan atas penyelenggaraan kegiatan tersebut sepanjang tidak mengganggu ketertiban umum.

Surat izin ini dibuat untuk keperluan {{keperluan}}.`,
  ),

  LAINNYA: susun(
    `{{isi_permohonan}}

Surat keterangan ini dibuat untuk keperluan {{keperluan}}.`,
  ),
};
