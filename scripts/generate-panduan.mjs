/**
 * Menyusun docs/visual/panduan.html — Panduan Penggunaan untuk warga dan
 * perangkat desa.
 *
 * Isinya ditulis sebagai data terstruktur di bawah, bukan HTML mentah, supaya
 * satu fitur bisa ditambah atau diubah tanpa menyentuh tata letak. Tangkapan
 * layar diambil lebih dulu oleh scripts/screenshot-panduan.mjs.
 *
 * Jalankan: node scripts/generate-panduan.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIR_SS = resolve(ROOT, 'docs/screenshots/panduan');
const KELUARAN = resolve(ROOT, 'docs/visual/panduan.html');

/** Gambar disematkan sebagai data URI agar HTML-nya bisa dibuka di mana saja. */
function gambar(nama) {
  const berkas = resolve(DIR_SS, `${nama}.png`);
  if (!existsSync(berkas)) {
    console.warn(`  ! tangkapan hilang: ${nama}.png`);
    return null;
  }
  return `data:image/png;base64,${readFileSync(berkas).toString('base64')}`;
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ─────────────────────────────────────────────────────────────
// ISI PANDUAN
// ─────────────────────────────────────────────────────────────

const BAB = [
  {
    judul: 'Untuk Warga Desa',
    ringkas:
      'Semua yang bisa dikerjakan warga dari rumah: mengaktifkan akun, mengajukan surat, melaporkan masalah, dan memeriksa tagihan sendiri.',
    fitur: [
      {
        judul: 'Mengaktifkan Akun',
        kapan: 'Sekali saja, saat pertama kali memakai website ini.',
        langkah: [
          'Datang ke kantor desa dan minta <b>kode aktivasi</b> kepada petugas. Kode ini diberikan langsung kepada yang bersangkutan setelah identitasnya dicocokkan.',
          'Buka <b>desa-bintang-ninggi.webdevpky.site</b>, klik <b>Masuk</b>, lalu pilih <b>Aktivasi di sini</b>.',
          'Isi <b>NIK</b> 16 digit dan <b>kode aktivasi</b> dari kantor desa.',
          'Tentukan <b>PIN</b> 6 angka milik Anda sendiri, lalu ulangi sekali lagi untuk memastikan tidak salah ketik.',
          'Klik <b>Aktifkan</b>. Akun langsung bisa dipakai.',
        ],
        gambar: 'aktivasi',
        keterangan: 'Halaman Aktivasi Akun.',
        catatan:
          'Kode aktivasi hanya berlaku sekali dan punya masa berlaku. Kalau sudah kedaluwarsa, minta kode baru ke kantor desa. PIN adalah kunci akun Anda — jangan diberikan kepada siapa pun, termasuk kepada petugas desa.',
      },
      {
        judul: 'Masuk ke Akun',
        kapan: 'Setiap kali hendak mengajukan surat atau melihat data pribadi.',
        langkah: [
          'Klik tombol <b>Masuk</b> di pojok kanan atas.',
          'Isi <b>NIK</b> dan <b>PIN</b> yang Anda tentukan saat aktivasi.',
          'Klik <b>Masuk</b>. Anda akan diarahkan ke Dashboard Warga.',
        ],
        gambar: 'masuk-warga',
        keterangan: 'Halaman Masuk untuk warga.',
        catatan:
          'Salah PIN beberapa kali berturut-turut akan mengunci akun sementara. Ini disengaja, supaya orang lain tidak bisa menebak PIN Anda satu per satu. Tunggu beberapa saat, atau hubungi kantor desa.',
      },
      {
        judul: 'Beranda Dashboard Warga',
        kapan: 'Halaman pertama setelah masuk.',
        langkah: [
          'Baris <b>Yang Sedang Berjalan</b> menampilkan empat hal: surat yang siap diambil, surat yang sedang diproses, tagihan yang belum dibayar, dan pengaduan yang masih ditangani.',
          'Kartu bergaris kuning berarti ada yang perlu Anda urus. Kartu bergaris hijau berarti ada yang sudah selesai dan bisa diambil.',
          'Klik kartu mana pun untuk membuka rinciannya.',
          'Bagian <b>Layanan</b> di bawahnya adalah pintasan ke empat hal yang paling sering dipakai.',
        ],
        gambar: 'warga-beranda',
        keterangan: 'Beranda Dashboard Warga. Angka pada menu di kiri ikut menunjukkan jumlah yang menunggu.',
      },
      {
        judul: 'Mengajukan Surat',
        kapan: 'Kapan saja, tanpa perlu datang ke kantor desa.',
        langkah: [
          'Dari menu atas pilih <b>Pelayanan Online</b>. Daftar seluruh jenis surat akan tampil.',
          'Klik jenis surat yang Anda butuhkan — misalnya <b>Surat Keterangan Usaha</b>.',
          'Isi kolom <b>Keperluan</b> dengan alasan Anda memerlukan surat itu. Tulis apa adanya; petugas membaca kolom ini saat meninjau.',
          'Isi kolom tambahan bila ada. Setiap jenis surat punya kolom yang berbeda.',
          'Perhatikan kotak kuning <b>Siapkan lampiran</b> — di sana tertulis berkas apa saja yang harus Anda bawa.',
          'Klik <b>Kirim Pengajuan</b>. Anda akan menerima <b>kode lacak</b>, misalnya BN1-2026-000114.',
        ],
        gambar: 'layanan-jenis',
        keterangan: 'Daftar jenis surat pada halaman Pelayanan Online.',
        gambar2: 'ajukan-surat',
        keterangan2: 'Formulir pengajuan Surat Keterangan Usaha. Nama, NIK, dan alamat diambil otomatis dari data penduduk.',
        catatan:
          'Pada versi ini <b>unggahan berkas belum tersedia</b> di formulir pengajuan. Lampiran dibawa langsung saat mengambil surat di kantor desa, seperti tertulis pada kotak kuning di formulir.',
      },
      {
        judul: 'Memantau Status Surat',
        kapan: 'Setelah mengajukan, sampai suratnya terbit.',
        langkah: [
          'Buka <b>Dashboard Warga → Riwayat surat</b>.',
          'Perhatikan kolom <b>Status</b>. Ada empat kemungkinan: <b>Diproses</b> (menunggu ditinjau), <b>Disetujui</b> (disetujui, menunggu nomor surat), <b>Siap diambil</b> (sudah terbit), dan <b>Ditolak</b>.',
          'Bila ditolak, alasannya tertulis langsung di bawah judul surat. Perbaiki sesuai alasan itu, lalu ajukan ulang.',
          'Bila sudah <b>Siap diambil</b>, klik <b>Unduh PDF</b> untuk menyimpan suratnya.',
        ],
        gambar: 'warga-surat',
        keterangan: 'Riwayat pengajuan surat milik warga yang sedang masuk.',
      },
      {
        judul: 'Melaporkan Masalah Desa',
        kapan: 'Saat menemukan jalan rusak, lampu mati, sampah menumpuk, dan sejenisnya.',
        langkah: [
          'Dari menu atas pilih <b>Pengaduan Masyarakat</b>, lalu klik <b>Buat Laporan</b>.',
          'Pilih <b>kategori</b> yang paling mendekati masalahnya.',
          'Tulis <b>judul</b> singkat dan <b>uraian</b> yang jelas: apa yang terjadi, sejak kapan, dan seberapa mengganggu.',
          'Isi <b>lokasi</b>, atau tekan tombol ambil titik GPS bila Anda sedang berada di tempatnya.',
          'Unggah <b>foto</b> bila ada. Foto sangat membantu petugas menilai keadaan tanpa harus datang dulu.',
          'Centang <b>Tampilkan sebagai anonim</b> bila Anda tidak ingin nama Anda terlihat warga lain.',
          'Klik kirim. Simpan <b>kode lacak</b> yang muncul.',
        ],
        gambar: 'pengaduan-buat',
        keterangan: 'Formulir laporan pengaduan.',
        catatan:
          'Anonim di sini berarti anonim <b>bagi sesama warga</b>, bukan bagi kantor desa. Petugas tetap melihat siapa pelapornya — itu diperlukan agar laporan palsu bisa ditelusuri.',
      },
      {
        judul: 'Melacak Laporan',
        kapan: 'Setelah melapor, untuk melihat perkembangannya.',
        langkah: [
          'Bila Anda melapor dalam keadaan sudah masuk, buka <b>Dashboard Warga → Pengaduan</b>.',
          'Bila melapor tanpa masuk, buka <b>Pengaduan Masyarakat → Lacak Laporan</b> lalu masukkan <b>kode lacak</b>.',
          'Status berjalan dari <b>Baru → Diverifikasi → Sedang ditangani → Selesai</b>. Setiap tanggapan petugas tercatat beserta tanggalnya.',
        ],
        gambar: 'pengaduan-lacak',
        keterangan: 'Halaman pelacakan laporan dengan kode lacak.',
      },
      {
        judul: 'Memeriksa Tagihan dan Pajak',
        kapan: 'Menjelang jatuh tempo PBB atau iuran desa.',
        langkah: [
          'Buka <b>Dashboard Warga → Tagihan</b> untuk seluruh tagihan, atau <b>Pajak desa</b> khusus PBB.',
          'Tagihan berstatus <b>Belum bayar</b> muncul lebih dulu, lengkap dengan jumlah dan tanggal jatuh tempo.',
          'Pembayaran dilakukan di kantor desa. Setelah petugas menandai lunas, statusnya berubah dengan sendirinya di halaman ini.',
        ],
        gambar: 'warga-tagihan',
        keterangan: 'Daftar tagihan milik warga.',
      },
      {
        judul: 'Melihat Data Pribadi',
        kapan: 'Untuk memastikan catatan desa tentang Anda sudah benar.',
        langkah: [
          'Buka <b>Dashboard Warga → Data pribadi</b>.',
          'NIK dan nomor KK ditampilkan tersamar. Klik <b>Lihat</b> untuk menampilkannya utuh.',
          'Periksa nama, tanggal lahir, pekerjaan, dan alamat. Bila ada yang keliru, laporkan ke kantor desa — perubahan data kependudukan hanya boleh dilakukan petugas.',
        ],
        gambar: 'warga-profil',
        keterangan: 'Halaman Data Pribadi. NIK tersamar sampai tombol Lihat ditekan.',
      },
      {
        judul: 'Sertifikat Pelatihan dan Riwayat Kegiatan',
        kapan: 'Saat memerlukan bukti pernah mengikuti pelatihan desa.',
        langkah: [
          'Buka <b>Dashboard Warga → Sertifikat pelatihan</b> untuk daftar pelatihan yang pernah Anda ikuti beserta nomor sertifikatnya.',
          'Buka <b>Riwayat kegiatan</b> untuk mencatat keikutsertaan Anda pada musyawarah, gotong royong, dan kegiatan desa lainnya.',
          'Keduanya diisi oleh perangkat desa. Bila ada yang terlewat, sampaikan ke kantor desa.',
        ],
        gambar: 'warga-sertifikat',
        keterangan: 'Daftar sertifikat pelatihan milik warga.',
      },
    ],
  },

  {
    judul: 'Untuk Perangkat Desa',
    ringkas:
      'Ruang kerja harian: menyetujui surat, mengelola data penduduk, mencatat keuangan dan aset, serta memperbarui isi website.',
    fitur: [
      {
        judul: 'Masuk sebagai Perangkat Desa',
        kapan: 'Setiap awal jam kerja.',
        langkah: [
          'Buka alamat <b>/masuk-perangkat</b>, atau klik <b>Masuk</b> lalu pilih tautan perangkat desa di bagian bawah.',
          'Isi <b>nama pengguna</b> dan <b>kata sandi</b> yang diberikan admin.',
          'Klik <b>Masuk</b>. Anda diarahkan ke Beranda Dashboard Perangkat Desa.',
        ],
        gambar: 'masuk-perangkat',
        keterangan: 'Halaman masuk khusus perangkat desa.',
        catatan:
          'Halaman ini terpisah dari halaman masuk warga karena keduanya memakai kredensial yang berbeda — warga dengan NIK dan PIN, perangkat dengan nama pengguna dan kata sandi.',
      },
      {
        judul: 'Membaca Beranda Dashboard',
        kapan: 'Hal pertama yang dilihat setiap hari.',
        langkah: [
          '<b>Perlu Ditindaklanjuti</b> di baris atas: surat menunggu persetujuan, pengaduan belum ditangani, dan tagihan belum dibayar. Kartu bergaris kuning berarti angkanya lebih dari nol. Klik untuk langsung membuka daftarnya.',
          '<b>Enam Bulan Terakhir</b>: grafik surat masuk, surat terbit, dan pengaduan. Arahkan kursor ke satu bulan untuk melihat ketiga angkanya sekaligus.',
          '<b>Realisasi APBDes</b>: berapa persen pendapatan dan belanja tahun ini yang sudah terealisasi.',
          'Angka pada menu di kiri adalah jumlah yang menunggu di masing-masing bagian — Anda tidak perlu membuka satu per satu untuk tahu ada pekerjaan baru.',
          'Halaman ini menyegarkan dirinya sendiri setiap menit.',
        ],
        gambar: 'admin-beranda',
        keterangan: 'Bagian atas Beranda Dashboard Perangkat Desa.',
        gambar2: 'admin-beranda-bawah',
        keterangan2: 'Bagian bawah: komposisi pengajuan surat, pengaduan per kategori, dan ringkasan desa.',
      },
      {
        judul: 'Menyetujui atau Menolak Surat',
        kapan: 'Setiap kali ada pengajuan masuk. Sebaiknya setiap hari kerja.',
        langkah: [
          'Buka <b>Manajemen surat</b>. Saringan <b>Diproses</b> sudah aktif secara bawaan — itulah yang menunggu tindakan Anda.',
          'Kolom <b>Menunggu</b> menunjukkan sudah berapa lama pengajuan itu menganggur. Angka berwarna merah berarti lebih dari tiga hari.',
          'Klik <b>Tinjau berkas</b> untuk membuka rincian pengajuan dan lampirannya.',
          'Bila sudah benar, klik <b>Setujui</b> — bisa langsung dari baris daftar tanpa membuka rinciannya.',
          'Bila ada yang kurang, klik <b>Tolak</b>. Anda <b>wajib</b> menuliskan alasannya; teks itulah yang dibaca warga di halaman pelacakan.',
          'Setelah disetujui, buka rincian surat dan klik <b>Terbitkan</b> untuk memberi nomor surat resmi dan membuat PDF-nya.',
        ],
        gambar: 'admin-surat',
        keterangan: 'Manajemen Surat. Tombol Setujui dan Tolak ada di setiap baris berstatus Diproses.',
        catatan:
          'Alasan penolakan wajib diisi karena tanpa itu warga tidak tahu apa yang harus diperbaiki, lalu mengajukan ulang dengan kesalahan yang sama.',
      },
      {
        judul: 'Mengelola Data Penduduk',
        kapan: 'Saat ada kelahiran, kematian, kepindahan, atau perbaikan data.',
        langkah: [
          'Buka <b>Manajemen penduduk</b>. Gunakan kolom pencarian untuk mencari berdasarkan nama atau NIK.',
          'Klik <b>Tambah</b> untuk mendaftarkan penduduk baru. Isi seluruh kolom sesuai dokumen kependudukan yang dibawa warga.',
          'Klik nama penduduk untuk mengubah datanya.',
          'Untuk memasukkan banyak data sekaligus, gunakan <b>Impor CSV</b>. Unduh berkas contohnya lebih dulu agar susunan kolomnya tepat.',
          'Untuk memberi warga akses ke website, buka datanya lalu <b>terbitkan kode aktivasi</b>. Serahkan kode itu langsung kepada yang bersangkutan.',
        ],
        gambar: 'admin-penduduk',
        keterangan: 'Daftar penduduk. NIK ditampilkan tersamar pada daftar.',
        gambar2: 'admin-penduduk-impor',
        keterangan2: 'Halaman impor CSV beserta tautan unduh berkas contoh.',
        catatan:
          'Setiap kali data penduduk dibuka atau diubah, sistem mencatatnya di log audit lengkap dengan siapa dan kapan. Ini kewajiban UU Perlindungan Data Pribadi Nomor 27 Tahun 2022 — bukan pilihan.',
      },
      {
        judul: 'Menangani Pengaduan Warga',
        kapan: 'Setiap ada laporan baru masuk.',
        langkah: [
          'Buka <b>Pengaduan</b>. Laporan berstatus <b>Baru</b> tampil lebih dulu.',
          'Klik judul laporan untuk membuka rinciannya beserta foto dan titik lokasi.',
          'Ubah status menjadi <b>Diverifikasi</b> setelah Anda memastikan laporannya benar.',
          'Tulis <b>tanggapan</b> setiap kali ada perkembangan. Warga membaca tanggapan ini di halaman pelacakan.',
          'Ubah menjadi <b>Sedang ditangani</b> saat pekerjaan dimulai, dan <b>Selesai</b> setelah beres.',
        ],
        gambar: 'admin-pengaduan',
        keterangan: 'Daftar pengaduan yang masuk beserta statusnya.',
      },
      {
        judul: 'Mencatat Keuangan Desa',
        kapan: 'Saat menyusun APBDes dan setiap kali ada realisasi belanja.',
        langkah: [
          'Buka <b>Keuangan</b>. Pilih tahun anggaran, atau buat anggaran baru bila belum ada.',
          'Tambahkan item anggaran satu per satu: jenis (pendapatan/belanja/pembiayaan), bidang, uraian, sumber dana, dan pagu.',
          'Perbarui kolom <b>realisasi</b> setiap kali ada belanja yang sudah terjadi.',
          'Seluruh angka yang Anda masukkan tampil di halaman <b>Transparansi Keuangan</b> yang bisa dibaca warga tanpa masuk.',
          'Setelah tahun anggaran berakhir, <b>kunci</b> anggarannya agar tidak berubah lagi.',
        ],
        gambar: 'admin-keuangan',
        keterangan: 'Pengelolaan anggaran desa per tahun.',
      },
      {
        judul: 'Menerbitkan Tagihan dan Pajak',
        kapan: 'Awal tahun untuk PBB, atau saat ada iuran dan sewa aset.',
        langkah: [
          'Buka <b>Tagihan &amp; pajak</b>.',
          'Pada kotak <b>Terbitkan Tagihan</b>, ketik nama warga (minimal tiga huruf) lalu pilih dari daftar yang muncul.',
          'Pilih <b>jenis</b>: PBB, iuran desa, sewa aset, atau lainnya.',
          'Isi judul, tahun, jumlah, dan jatuh tempo bila ada.',
          'Klik <b>Terbitkan Tagihan</b>. Tagihan langsung tampil di Dashboard Warga yang bersangkutan.',
          'Setelah warga membayar di kantor desa, klik <b>Tandai lunas</b> pada baris tagihannya.',
        ],
        gambar: 'admin-tagihan',
        keterangan: 'Penerbitan tagihan dengan pencari nama penduduk.',
      },
      {
        judul: 'Mencatat Absensi Perangkat',
        kapan: 'Setiap hari kerja.',
        langkah: [
          'Buka <b>Absensi perangkat</b>.',
          'Pilih nama perangkat, tanggal, dan status kehadiran: hadir, izin, sakit, dinas luar, atau alpa.',
          'Isi jam masuk dan jam pulang bila diperlukan.',
          'Klik <b>Catat</b>. Rekap bulanan di bawahnya langsung ikut berubah.',
          'Gunakan pemilih bulan di kanan untuk melihat rekap bulan lain.',
        ],
        gambar: 'admin-absensi',
        keterangan: 'Pencatatan kehadiran dan rekap bulanan perangkat desa.',
        catatan:
          'Satu orang hanya punya satu catatan per hari. Mencatat ulang di tanggal yang sama akan <b>memperbaiki</b> catatan sebelumnya, bukan menambah baris kembar.',
      },
      {
        judul: 'Mendata Inventaris Aset',
        kapan: 'Setiap ada pengadaan barang baru atau perubahan kondisi barang.',
        langkah: [
          'Buka <b>Inventaris aset</b>.',
          'Isi nama barang, kategori, kode inventaris, tahun perolehan, nilai satuan, jumlah, dan lokasi penyimpanan.',
          'Pilih <b>kondisi</b>: baik, rusak ringan, atau rusak berat.',
          'Klik <b>Tambah Aset</b>.',
          'Tiga kotak di bagian atas menunjukkan total nilai aset, jumlah jenis barang, dan berapa yang perlu diperbaiki.',
        ],
        gambar: 'admin-aset',
        keterangan: 'Inventaris aset desa beserta ringkasan nilainya.',
      },
      {
        judul: 'Membaca Statistik Desa',
        kapan: 'Saat menyusun laporan atau bahan musyawarah desa.',
        langkah: [
          'Buka <b>Statistik real-time</b>.',
          'Grafik tersedia untuk pengajuan surat per status, pengaduan per kategori, komposisi penduduk, kondisi aset, serta sebaran penduduk menurut usia, pendidikan, pekerjaan, dan RT.',
          'Klik <b>Tampilkan tabel</b> di pojok kanan atas untuk mengubah seluruh grafik menjadi tabel angka — bentuk ini yang mudah disalin ke laporan.',
        ],
        gambar: 'admin-statistik',
        keterangan: 'Halaman statistik dengan tombol pengubah grafik/tabel.',
      },
      {
        judul: 'Memperbarui Isi Website',
        kapan: 'Setiap ada berita, pengumuman, agenda, atau dokumen baru.',
        langkah: [
          '<b>Berita</b>: tulis judul, ringkasan, dan isi. Centang <b>terbitkan</b> agar tampil di halaman muka.',
          '<b>Agenda</b>: isi judul, kategori, tanggal, dan lokasi. Agenda yang akan datang muncul di beranda.',
          '<b>Dokumen &amp; PPID</b>: unggah berkas PDF, pilih jenisnya (Perdes, APBDes, RPJMDes, dan sebagainya). Jenis inilah yang menentukan halaman publik mana yang menampilkannya.',
          '<b>Galeri</b>: unggah foto kegiatan desa.',
          '<b>Informasi sektoral, Fasilitas, Harga komoditas, Lowongan, Bantuan sosial</b>: masing-masing punya halaman pengelolaan dengan pola yang sama.',
        ],
        gambar: 'admin-berita',
        keterangan: 'Pengelolaan berita desa.',
        gambar2: 'admin-dokumen',
        keterangan2: 'Pengelolaan dokumen dan PPID.',
      },
      {
        judul: 'Mengisi Profil Desa',
        kapan: 'Sekali di awal, lalu diperbarui bila ada perubahan.',
        langkah: [
          'Buka <b>Profil desa</b>.',
          'Isi identitas wilayah, alamat kantor, jam pelayanan, dan nomor darurat.',
          'Isi <b>sejarah</b>, <b>visi</b>, <b>misi</b> (satu poin per baris), dan <b>sambutan Kepala Desa</b>.',
          'Isi <b>prestasi</b> dengan format <code>Judul | Tahun | Keterangan</code>, satu per baris.',
          'Isi <b>potensi</b> dengan format <code>Judul | Keterangan</code>, satu per baris.',
          'Di bagian bawah, daftarkan <b>perangkat desa</b> beserta jabatan dan uraian tugasnya.',
        ],
        gambar: 'admin-profil-desa',
        keterangan: 'Formulir profil desa.',
        catatan:
          '<b>Kepala Desa wajib didaftarkan</b> pada daftar perangkat. Tanpa itu, surat yang terbit mencetak titik-titik kosong di tempat nama penanda tangan.',
      },
    ],
  },

  {
    judul: 'Untuk Pengunjung Umum',
    ringkas:
      'Halaman yang bisa dibuka siapa saja tanpa masuk — termasuk oleh warga desa lain, wartawan, dan pengawas.',
    fitur: [
      {
        judul: 'Halaman Muka',
        kapan: 'Pintu masuk ke seluruh isi website.',
        langkah: [
          'Bagian atas memuat dua tombol utama: <b>Ajukan Surat</b> dan <b>Sampaikan Pengaduan</b>.',
          'Di bawahnya ada ringkasan angka desa: jumlah penduduk, kartu keluarga, UMKM, RT, dan luas wilayah.',
          'Bagian <b>Mengurus Surat, Tiga Langkah</b> menjelaskan alur pelayanan bagi yang baru pertama kali.',
          'Lebih ke bawah: berita terbaru, pengumuman, agenda kegiatan, jam pelayanan, dan nomor darurat.',
        ],
        gambar: 'beranda',
        keterangan: 'Halaman muka website desa.',
      },
      {
        judul: 'Profil Desa',
        kapan: 'Untuk mengenal desa dan susunan lembaganya.',
        langkah: [
          'Buka menu <b>Profil Desa</b>.',
          'Deretan tautan di bawah judul adalah daftar isi. Klik salah satunya untuk melompat ke bagian yang dituju.',
          'Isinya mencakup sejarah, visi dan misi, Kepala Desa, struktur organisasi, perangkat desa, BPD, LPM, PKK, Karang Taruna, BumDes, daftar RT/RW, prestasi, dan potensi desa.',
        ],
        gambar: 'profil-desa',
        keterangan: 'Halaman Profil Desa dengan daftar isi di bagian atas.',
      },
      {
        judul: 'Data Kependudukan',
        kapan: 'Untuk melihat gambaran penduduk desa dalam angka.',
        langkah: [
          'Buka menu <b>Data Kependudukan</b>.',
          'Tersedia sebaran menurut usia, jenis kelamin, agama, pendidikan, pekerjaan, status perkawinan, dan RT.',
          'Klik <b>Tampilkan tabel</b> untuk mengubah grafik menjadi angka yang bisa disalin.',
        ],
        gambar: 'kependudukan',
        keterangan: 'Statistik kependudukan yang terbuka untuk umum.',
        catatan:
          'Halaman ini <b>hanya memuat angka gabungan</b>. Tidak ada nama, NIK, atau alamat perorangan di sini — data individu hanya bisa dibuka perangkat desa yang sudah masuk, dan setiap aksesnya tercatat.',
      },
      {
        judul: 'Transparansi Keuangan',
        kapan: 'Untuk memeriksa penggunaan anggaran desa.',
        langkah: [
          'Buka menu <b>Transparansi Keuangan</b>.',
          'Pilih tahun anggaran yang ingin dilihat.',
          'Tersedia ringkasan pendapatan, belanja, dan pembiayaan, beserta pagu dan realisasinya.',
          'Rincian per bidang belanja dan per sumber dana ada di bawahnya.',
        ],
        gambar: 'keuangan',
        keterangan: 'Halaman Transparansi Keuangan.',
      },
      {
        judul: 'Pembangunan Desa',
        kapan: 'Untuk memantau proyek yang sedang berjalan.',
        langkah: [
          'Buka menu <b>Pembangunan Desa</b>.',
          'Setiap proyek menampilkan nilai, sumber dana, lokasi, dan persentase pekerjaan.',
          'Klik satu proyek untuk melihat foto progres dan riwayat pengerjaannya.',
        ],
        gambar: 'pembangunan',
        keterangan: 'Daftar proyek pembangunan desa.',
      },
      {
        judul: 'Dokumen Pemerintahan dan PPID',
        kapan: 'Untuk mengunduh Perdes, APBDes, RPJMDes, dan dokumen resmi lain.',
        langkah: [
          'Buka <b>Pemerintahan Desa</b> untuk regulasi dan dokumen perencanaan.',
          'Buka <b>PPID</b> untuk informasi publik yang diklasifikasikan menurut UU Nomor 14 Tahun 2008.',
          'Gunakan tombol saring jenis dokumen di bagian atas, atau kolom pencarian.',
          'Klik <b>Unduh</b> pada dokumen yang diinginkan.',
        ],
        gambar: 'dokumen-pemerintahan',
        keterangan: 'Daftar dokumen pemerintahan desa.',
      },
      {
        judul: 'Permohonan Informasi Publik',
        kapan: 'Bila informasi yang dicari belum tersedia di halaman PPID.',
        langkah: [
          'Buka <b>PPID → Permohonan informasi</b>.',
          'Baca alur permohonan sesuai UU Nomor 14 Tahun 2008: permohonan diajukan tertulis atau lisan ke petugas PPID, disertai identitas diri.',
          'Petugas memberikan tanda terima bernomor.',
          'Permohonan dijawab paling lama <b>10 hari kerja</b>, dapat diperpanjang 7 hari kerja dengan pemberitahuan tertulis.',
        ],
        gambar: 'ppid-permohonan',
        keterangan: 'Penjelasan alur permohonan informasi publik.',
        catatan:
          'Permohonan sengaja tidak dibuat sebagai formulir daring: pemohon wajib menunjukkan identitas dan menerima tanda terima bernomor, dan keduanya tidak bisa dijamin lewat formulir web.',
      },
      {
        judul: 'Memeriksa Keaslian Surat',
        kapan: 'Saat menerima surat desa dan ingin memastikan surat itu asli.',
        langkah: [
          'Pindai <b>QR Code</b> yang tercetak pada lembar surat, atau buka alamat <b>/verifikasi</b> dan ketik kode yang tertera di bawah QR.',
          'Bila surat asli, halaman menampilkan nomor surat, jenis, nama pemohon, dan tanggal terbit.',
          'Bila kode tidak dikenali atau isi berkas sudah diubah, halaman akan menyatakan surat tidak sah.',
        ],
        gambar: 'verifikasi',
        keterangan: 'Halaman verifikasi keaslian surat.',
        catatan:
          'QR ini adalah verifikasi mandiri milik desa, bukan tanda tangan elektronik tersertifikasi. Surat tetap ditandatangani basah oleh Kepala Desa. Yang dibuktikan QR adalah bahwa lembar yang dipegang benar terbit dari sistem ini dan isinya belum diubah.',
      },
      {
        judul: 'UMKM Desa',
        kapan: 'Untuk melihat dan membeli produk warga.',
        langkah: [
          'Buka menu <b>UMKM Desa</b>.',
          'Pilih toko atau telusuri produk berdasarkan kategori.',
          'Masuk lebih dulu bila hendak memesan, lalu tambahkan produk ke keranjang di halaman toko.',
          'Pembayaran memakai <b>QRIS milik penjual</b>. Unggah bukti bayar, lalu penjual yang memverifikasinya.',
        ],
        gambar: 'umkm',
        keterangan: 'Daftar UMKM desa.',
        catatan:
          'Desa tidak pernah memegang uang warga. Tidak ada payment gateway dan tidak ada biaya transaksi — setiap pesanan berakhir langsung pada satu penjual, karena itu keranjang belanja berada di dalam halaman masing-masing toko.',
      },
      {
        judul: 'Membuka dari Ponsel',
        kapan: 'Cara yang paling sering dipakai warga.',
        langkah: [
          'Seluruh halaman menyesuaikan diri dengan lebar layar ponsel.',
          'Tombol bergaris tiga di pojok kiri atas membuka menu.',
          'Dashboard warga maupun perangkat desa juga bisa dipakai penuh dari ponsel.',
        ],
        gambar: 'hp-beranda',
        keterangan: 'Halaman muka pada layar ponsel.',
        gambar2: 'hp-admin',
        keterangan2: 'Dashboard perangkat desa pada layar ponsel.',
        lebarGambar: '78mm',
      },
    ],
  },
];

const CATATAN_PENUTUP = [
  [
    'Yang belum tersedia pada versi ini',
    [
      'Unggahan lampiran pada formulir pengajuan surat. Lampiran dibawa langsung ke kantor desa.',
      'Cuaca di halaman muka.',
      'Notifikasi otomatis lewat WhatsApp atau surel saat status surat berubah.',
    ],
  ],
  [
    'Yang harus diisi perangkat desa sebelum website dipakai warga',
    [
      '<b>Kepala Desa</b> pada daftar perangkat — tanpa ini surat mencetak titik-titik di tempat tanda tangan.',
      'Sejarah, visi, misi, dan sambutan Kepala Desa pada Profil Desa.',
      'Jam pelayanan dan nomor darurat.',
      'Daftar RT dan RW beserta nama ketuanya.',
      'Anggaran tahun berjalan, agar halaman Transparansi Keuangan tidak kosong.',
    ],
  ],
  [
    'Yang tidak boleh dilanggar',
    [
      'NIK, nomor KK, dan data pribadi lain <b>tidak pernah</b> ditampilkan di halaman publik.',
      'Setiap pembukaan dan perubahan data penduduk tercatat di log audit beserta pelakunya (UU PDP Nomor 27 Tahun 2022).',
      'PIN warga tidak boleh diminta oleh petugas dengan alasan apa pun.',
      'Penolakan surat wajib disertai alasan tertulis.',
      'Anggaran yang sudah dikunci tidak boleh diubah.',
    ],
  ],
];

// ─────────────────────────────────────────────────────────────
// PERAKITAN HTML
// ─────────────────────────────────────────────────────────────

let nomorGambar = 0;

function blokGambar(nama, keterangan, lebar) {
  const src = gambar(nama);
  if (!src) return '';
  nomorGambar++;
  return `
<figure class="tangkapan-blok">
  <div class="tangkapan"${lebar ? ` style="max-width:${lebar};margin:0 auto"` : ''}>
    <img src="${src}" alt="${esc(keterangan)}" />
  </div>
  <figcaption>Gambar ${nomorGambar} — ${esc(keterangan)}</figcaption>
</figure>`;
}

function blokFitur(f, nomorBab, urut) {
  const langkah = f.langkah.map((l) => `<li>${l}</li>`).join('\n    ');
  const catatan = f.catatan ? `<div class="catatan"><b>Catatan.</b> ${f.catatan}</div>` : '';
  return `
<section class="fitur">
  <h3>${nomorBab}.${urut} ${esc(f.judul)}</h3>
  <p class="kapan"><b>Kapan dipakai.</b> ${esc(f.kapan)}</p>
  <ol class="langkah">
    ${langkah}
  </ol>
  ${catatan}
  ${blokGambar(f.gambar, f.keterangan, f.lebarGambar)}
  ${f.gambar2 ? blokGambar(f.gambar2, f.keterangan2, f.lebarGambar) : ''}
</section>`;
}

const daftarIsi = BAB.map(
  (b, i) => `
  <div class="ti-bab">${i + 1}. ${esc(b.judul)}</div>
  ${b.fitur.map((f, j) => `<div class="ti-item">${i + 1}.${j + 1} &nbsp; ${esc(f.judul)}</div>`).join('\n  ')}`,
).join('\n');

const isi = BAB.map(
  (b, i) => `
<h2 class="bab pecah">${i + 1}. ${esc(b.judul)}</h2>
<p class="ringkas-bab">${esc(b.ringkas)}</p>
${b.fitur.map((f, j) => blokFitur(f, i + 1, j + 1)).join('\n')}`,
).join('\n');

const penutup = CATATAN_PENUTUP.map(
  ([judul, poin]) => `
<h3>${esc(judul)}</h3>
<ul class="poin">
  ${poin.map((p) => `<li>${p}</li>`).join('\n  ')}
</ul>`,
).join('\n');

const tanggal = new Date().toLocaleDateString('id-ID', { dateStyle: 'long' });

const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Panduan Penggunaan — Website Desa Bintang Ninggi I</title>
<style>
  @page { size: A4; margin: 16mm 14mm; }

  :root {
    --hijau: #1c5b41;
    --hijau-muda: #f0f9f4;
    --garis: #d8e2dc;
    --teks: #1f2937;
    --redup: #6b7280;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: "Segoe UI", Inter, system-ui, sans-serif;
    color: var(--teks);
    font-size: 11pt;
    line-height: 1.55;
    background: #fff;
  }

  .halaman { max-width: 190mm; margin: 0 auto; padding: 0 4mm; }

  .sampul {
    background: linear-gradient(135deg, #1c5b41 0%, #348f64 100%);
    color: #fff;
    padding: 34mm 16mm;
    margin-bottom: 14mm;
    page-break-after: always;
  }
  .sampul .kop { font-size: 10pt; letter-spacing: .18em; text-transform: uppercase; opacity: .85; }
  .sampul h1 { font-size: 30pt; margin: 6mm 0 3mm; line-height: 1.15; font-weight: 800; }
  .sampul h2 { font-size: 14pt; font-weight: 500; opacity: .92; margin: 0 0 14mm; }
  .sampul .meta { border-top: 1px solid rgba(255,255,255,.35); padding-top: 6mm; font-size: 10pt; opacity: .9; }
  .sampul .meta div { margin-bottom: 2mm; }

  h2.bab {
    font-size: 17pt;
    color: var(--hijau);
    border-bottom: 3px solid var(--hijau);
    padding-bottom: 2mm;
    margin: 0 0 4mm;
    page-break-after: avoid;
  }
  h2.pecah { break-before: page; page-break-before: always; }
  h3 { font-size: 12.5pt; margin: 8mm 0 2mm; color: #14432f; page-break-after: avoid; }
  p { margin: 0 0 3mm; }

  .ringkas-bab { color: var(--redup); margin-bottom: 2mm; }

  /* Sengaja TIDAK memakai break-inside: avoid pada .fitur. Satu fitur bisa
     lebih tinggi dari satu halaman A4 (langkah + dua gambar), dan blok yang
     lebih tinggi dari halaman justru memicu halaman kosong di depannya. */
  .fitur { margin-bottom: 4mm; }

  .kapan {
    background: var(--hijau-muda);
    border-left: 3px solid var(--hijau);
    padding: 2mm 3mm;
    margin: 0 0 3mm;
    font-size: 10pt;
  }

  ol.langkah { margin: 0 0 3mm; padding-left: 6mm; }
  ol.langkah li { margin-bottom: 1.6mm; }

  ul.poin { margin: 0 0 4mm; padding-left: 6mm; }
  ul.poin li { margin-bottom: 1.6mm; }

  .catatan {
    border: 1px solid #f0d9a8;
    background: #fdf8ec;
    border-radius: 6px;
    padding: 2.5mm 3mm;
    margin: 0 0 4mm;
    font-size: 10pt;
    break-inside: avoid;
  }

  /* Gambar dijaga utuh — terpotong di tengah halaman membuatnya tak berguna.
     Tingginya dibatasi di bawah tinggi area cetak (A4 dikurangi margin
     = ~265mm) agar tidak pernah melebihi satu halaman. */
  .tangkapan-blok { break-inside: avoid; page-break-inside: avoid; margin: 3mm 0 5mm; }

  .tangkapan {
    border: 1px solid var(--garis);
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }
  .tangkapan img { display: block; width: 100%; height: auto; max-height: 215mm; object-fit: contain; }

  figcaption {
    font-size: 9pt;
    color: var(--redup);
    margin-top: 1.5mm;
    text-align: center;
  }

  /* Tiga puluh tujuh baris daftar isi dalam satu kolom menghabiskan hampir
     seluruh halaman, sehingga kotak peringatan di bawahnya terdorong sendirian
     ke halaman berikutnya. Dua kolom membuat keduanya muat satu halaman. */
  .daftar-isi { column-count: 2; column-gap: 10mm; }
  .ti-bab {
    font-weight: 700;
    color: var(--hijau);
    margin: 4mm 0 1mm;
    break-inside: avoid;
    break-after: avoid;
  }
  .ti-bab:first-child { margin-top: 0; }
  .ti-item { padding-left: 5mm; font-size: 10pt; color: #374151; break-inside: avoid; }

  code {
    background: #f1f5f9;
    padding: 0.3mm 1mm;
    border-radius: 3px;
    font-size: 9.5pt;
  }

  /* Kotak ini pendek tapi sempat terbelah dua halaman, menyisakan dua baris
     sendirian di halaman berikutnya sementara sisanya kosong. Dijaga utuh. */
  .peringatan-data {
    border: 1px solid #f0d9a8;
    background: #fdf8ec;
    border-radius: 8px;
    padding: 4mm;
    margin: 6mm 0;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Judul langkah tidak boleh tertinggal sendirian di kaki halaman. */
  .kapan { break-after: avoid; page-break-after: avoid; }
  ol.langkah li, ul.poin li { break-inside: avoid; page-break-inside: avoid; }
</style>
</head>
<body>

<div class="sampul">
  <div class="kop">Pemerintah Desa Bintang Ninggi I</div>
  <h1>Panduan<br />Penggunaan Website</h1>
  <h2>Alur dan langkah seluruh fitur, untuk warga dan perangkat desa</h2>
  <div class="meta">
    <div><b>Alamat</b> &nbsp; desa-bintang-ninggi.webdevpky.site</div>
    <div><b>Disusun</b> &nbsp; ${tanggal}</div>
    <div><b>Jumlah gambar</b> &nbsp; ${'{{JUMLAH_GAMBAR}}'} tangkapan layar</div>
  </div>
</div>

<div class="halaman">

<h2 class="bab">Daftar Isi</h2>
<div class="daftar-isi">
${daftarIsi}
  <div class="ti-bab">${BAB.length + 1}. Catatan Penutup</div>
</div>

<div class="peringatan-data">
  <b>Tentang tangkapan layar dalam panduan ini.</b> Seluruh nama, NIK, angka, dan
  isi tabel pada gambar adalah <b>data contoh yang dikarang</b> untuk keperluan
  dokumentasi. Tidak ada data warga sungguhan yang disalin ke dalam berkas ini.
  Tampilan yang Anda lihat di layar akan berisi data desa yang sebenarnya.
</div>

${isi}

<h2 class="bab pecah">${BAB.length + 1}. Catatan Penutup</h2>
${penutup}

</div>
</body>
</html>`;

writeFileSync(KELUARAN, html.replace('{{JUMLAH_GAMBAR}}', String(nomorGambar)), 'utf8');
console.log(`Panduan ditulis ke ${KELUARAN} (${nomorGambar} gambar).`);
