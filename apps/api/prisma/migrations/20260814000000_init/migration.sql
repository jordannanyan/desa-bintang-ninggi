-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `peran` ENUM('WARGA', 'PERANGKAT', 'ADMIN') NOT NULL,
    `status` ENUM('BELUM_AKTIF', 'AKTIF', 'DIBEKUKAN') NOT NULL DEFAULT 'BELUM_AKTIF',
    `username` VARCHAR(191) NULL,
    `kredensialHash` VARCHAR(191) NULL,
    `kodeAktivasi` VARCHAR(191) NULL,
    `kodeExpiredAt` DATETIME(3) NULL,
    `gagalLogin` INTEGER NOT NULL DEFAULT 0,
    `terkunciSampai` DATETIME(3) NULL,
    `loginTerakhir` DATETIME(3) NULL,
    `pendudukId` VARCHAR(191) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbaruiPada` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_pendudukId_key`(`pendudukId`),
    INDEX `users_peran_status_idx`(`peran`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiredAt` DATETIME(3) NOT NULL,
    `dicabutPada` DATETIME(3) NULL,
    `userAgent` VARCHAR(255) NULL,
    `ip` VARCHAR(45) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_tokenHash_key`(`tokenHash`),
    INDEX `refresh_tokens_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `aksi` VARCHAR(64) NOT NULL,
    `entitas` VARCHAR(64) NOT NULL,
    `entitasId` VARCHAR(64) NULL,
    `ip` VARCHAR(45) NULL,
    `detail` JSON NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entitas_entitasId_idx`(`entitas`, `entitasId`),
    INDEX `audit_logs_userId_dibuatPada_idx`(`userId`, `dibuatPada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rw` (
    `id` VARCHAR(191) NOT NULL,
    `nomor` VARCHAR(5) NOT NULL,
    `ketua` VARCHAR(120) NULL,

    UNIQUE INDEX `rw_nomor_key`(`nomor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rt` (
    `id` VARCHAR(191) NOT NULL,
    `nomor` VARCHAR(5) NOT NULL,
    `ketua` VARCHAR(120) NULL,
    `rwId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `rt_rwId_nomor_key`(`rwId`, `nomor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kartu_keluarga` (
    `id` VARCHAR(191) NOT NULL,
    `nomorKkEnc` VARCHAR(255) NOT NULL,
    `nomorKkHash` VARCHAR(64) NOT NULL,
    `alamat` VARCHAR(255) NOT NULL,
    `dusun` VARCHAR(80) NULL,
    `kodePos` VARCHAR(10) NULL,
    `rtId` VARCHAR(191) NOT NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbaruiPada` DATETIME(3) NOT NULL,

    UNIQUE INDEX `kartu_keluarga_nomorKkHash_key`(`nomorKkHash`),
    INDEX `kartu_keluarga_rtId_idx`(`rtId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penduduk` (
    `id` VARCHAR(191) NOT NULL,
    `nikEnc` VARCHAR(255) NOT NULL,
    `nikHash` VARCHAR(64) NOT NULL,
    `nama` VARCHAR(120) NOT NULL,
    `tempatLahir` VARCHAR(80) NOT NULL,
    `tanggalLahir` DATE NOT NULL,
    `jenisKelamin` ENUM('LAKI_LAKI', 'PEREMPUAN') NOT NULL,
    `agama` VARCHAR(30) NOT NULL,
    `pendidikan` VARCHAR(50) NOT NULL,
    `pekerjaan` VARCHAR(60) NOT NULL,
    `statusKawin` ENUM('BELUM_KAWIN', 'KAWIN', 'CERAI_HIDUP', 'CERAI_MATI') NOT NULL,
    `kewarganegaraan` VARCHAR(10) NOT NULL DEFAULT 'WNI',
    `hubunganKeluarga` VARCHAR(40) NOT NULL,
    `namaAyah` VARCHAR(120) NULL,
    `namaIbu` VARCHAR(120) NULL,
    `golonganDarah` VARCHAR(5) NULL,
    `noAktaLahir` VARCHAR(50) NULL,
    `noAktaKawin` VARCHAR(50) NULL,
    `noPaspor` VARCHAR(30) NULL,
    `disabilitas` VARCHAR(60) NULL,
    `pendatang` BOOLEAN NOT NULL DEFAULT false,
    `tanggalMeninggal` DATE NULL,
    `tanggalPindah` DATE NULL,
    `kartuKeluargaId` VARCHAR(191) NOT NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbaruiPada` DATETIME(3) NOT NULL,

    UNIQUE INDEX `penduduk_nikHash_key`(`nikHash`),
    INDEX `penduduk_kartuKeluargaId_idx`(`kartuKeluargaId`),
    INDEX `penduduk_nama_idx`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profil_desa` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `namaDesa` VARCHAR(120) NOT NULL,
    `kecamatan` VARCHAR(80) NOT NULL,
    `kabupaten` VARCHAR(80) NOT NULL,
    `provinsi` VARCHAR(80) NOT NULL,
    `kodePos` VARCHAR(10) NULL,
    `luasWilayahKm` DECIMAL(10, 2) NULL,
    `sejarah` TEXT NULL,
    `visi` TEXT NULL,
    `misi` JSON NULL,
    `sambutanKades` TEXT NULL,
    `videoProfilUrl` VARCHAR(255) NULL,
    `jamPelayanan` JSON NULL,
    `nomorDarurat` JSON NULL,
    `alamatKantor` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `waDesa` VARCHAR(30) NULL,
    `email` VARCHAR(120) NULL,
    `facebook` VARCHAR(255) NULL,
    `instagram` VARCHAR(255) NULL,
    `tiktok` VARCHAR(255) NULL,
    `youtube` VARCHAR(255) NULL,
    `diperbaruiPada` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perangkat` (
    `id` VARCHAR(191) NOT NULL,
    `pendudukId` VARCHAR(191) NOT NULL,
    `jabatan` VARCHAR(80) NOT NULL,
    `uraianTugas` TEXT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `fotoUrl` VARCHAR(255) NULL,
    `mulaiMenjabat` DATE NULL,
    `akhirMenjabat` DATE NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `perangkat_pendudukId_key`(`pendudukId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lembaga` (
    `id` VARCHAR(191) NOT NULL,
    `jenis` ENUM('BPD', 'LPM', 'PKK', 'KARANG_TARUNA', 'BUMDES') NOT NULL,
    `nama` VARCHAR(120) NOT NULL,
    `deskripsi` TEXT NULL,
    `fotoUrl` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anggota_lembaga` (
    `id` VARCHAR(191) NOT NULL,
    `lembagaId` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(120) NOT NULL,
    `jabatan` VARCHAR(80) NOT NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `fotoUrl` VARCHAR(255) NULL,

    INDEX `anggota_lembaga_lembagaId_idx`(`lembagaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dokumen` (
    `id` VARCHAR(191) NOT NULL,
    `jenis` ENUM('PERDES', 'PERKADES', 'SK_KADES', 'RPJMDES', 'RKPDES', 'APBDES', 'REALISASI_APBDES', 'PPID_BERKALA', 'PPID_SETIAP_SAAT', 'PPID_SERTA_MERTA', 'FORMULIR', 'PROPOSAL', 'LAPORAN') NOT NULL,
    `judul` VARCHAR(200) NOT NULL,
    `nomor` VARCHAR(80) NULL,
    `tahun` INTEGER NOT NULL,
    `ringkasan` TEXT NULL,
    `berkasId` VARCHAR(191) NULL,
    `publik` BOOLEAN NOT NULL DEFAULT true,
    `jumlahUnduh` INTEGER NOT NULL DEFAULT 0,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `dokumen_jenis_tahun_idx`(`jenis`, `tahun`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `berkas` (
    `id` VARCHAR(191) NOT NULL,
    `namaAsli` VARCHAR(255) NOT NULL,
    `path` VARCHAR(512) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `ukuranByte` INTEGER NOT NULL,
    `diunggahOleh` VARCHAR(64) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `berita` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `judul` VARCHAR(200) NOT NULL,
    `ringkasan` VARCHAR(500) NULL,
    `isi` LONGTEXT NOT NULL,
    `sampulUrl` VARCHAR(255) NULL,
    `penulis` VARCHAR(120) NOT NULL,
    `terbit` BOOLEAN NOT NULL DEFAULT false,
    `terbitPada` DATETIME(3) NULL,
    `dilihat` INTEGER NOT NULL DEFAULT 0,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbaruiPada` DATETIME(3) NOT NULL,

    UNIQUE INDEX `berita_slug_key`(`slug`),
    INDEX `berita_terbit_terbitPada_idx`(`terbit`, `terbitPada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengumuman` (
    `id` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(200) NOT NULL,
    `isi` TEXT NOT NULL,
    `penting` BOOLEAN NOT NULL DEFAULT false,
    `mulai` DATE NOT NULL,
    `selesai` DATE NULL,
    `berkasUrl` VARCHAR(255) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pengumuman_mulai_selesai_idx`(`mulai`, `selesai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agenda` (
    `id` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(200) NOT NULL,
    `kategori` ENUM('MUSYAWARAH_DESA', 'POSYANDU', 'GOTONG_ROYONG', 'FESTIVAL', 'HARI_BESAR', 'RAPAT_RT', 'LAINNYA') NOT NULL DEFAULT 'LAINNYA',
    `deskripsi` TEXT NULL,
    `mulai` DATETIME(3) NOT NULL,
    `selesai` DATETIME(3) NULL,
    `lokasi` VARCHAR(200) NULL,
    `penyelenggara` VARCHAR(120) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `agenda_mulai_idx`(`mulai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `galeri` (
    `id` VARCHAR(191) NOT NULL,
    `judul` VARCHAR(200) NOT NULL,
    `jenis` ENUM('FOTO', 'VIDEO', 'DRONE') NOT NULL,
    `berkasId` VARCHAR(191) NULL,
    `urlEksternal` VARCHAR(255) NULL,
    `keterangan` TEXT NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_surat` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(40) NOT NULL,
    `nama` VARCHAR(120) NOT NULL,
    `isiTemplate` LONGTEXT NOT NULL,
    `formatNomor` VARCHAR(120) NULL,
    `fieldTambahan` JSON NULL,
    `lampiranWajib` JSON NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `aktif` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `template_surat_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengaturan` (
    `kunci` VARCHAR(80) NOT NULL,
    `nilai` JSON NOT NULL,
    `keterangan` VARCHAR(255) NULL,
    `diubahOleh` VARCHAR(64) NULL,
    `diubahPada` DATETIME(3) NOT NULL,

    PRIMARY KEY (`kunci`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `counter_surat` (
    `id` VARCHAR(191) NOT NULL,
    `tahun` INTEGER NOT NULL,
    `kodeSurat` VARCHAR(40) NOT NULL DEFAULT '',
    `urutTerakhir` INTEGER NOT NULL DEFAULT 0,
    `diperbaruiPada` DATETIME(3) NOT NULL,

    UNIQUE INDEX `counter_surat_tahun_kodeSurat_key`(`tahun`, `kodeSurat`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengajuan_surat` (
    `id` VARCHAR(191) NOT NULL,
    `kodeLacak` VARCHAR(30) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `pemohonId` VARCHAR(191) NOT NULL,
    `keperluan` VARCHAR(500) NOT NULL,
    `data` JSON NOT NULL,
    `status` ENUM('DIPROSES', 'DISETUJUI', 'DITOLAK', 'SIAP_DIAMBIL') NOT NULL DEFAULT 'DIPROSES',
    `catatan` VARCHAR(500) NULL,
    `peninjauId` VARCHAR(191) NULL,
    `ditinjauPada` DATETIME(3) NULL,
    `nomorSurat` VARCHAR(80) NULL,
    `kodeVerifikasi` VARCHAR(24) NULL,
    `hashDokumen` VARCHAR(64) NULL,
    `pdfPath` VARCHAR(512) NULL,
    `ditandatanganiOleh` VARCHAR(120) NULL,
    `ditandatanganiPada` DATETIME(3) NULL,
    `jumlahVerifikasi` INTEGER NOT NULL DEFAULT 0,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbaruiPada` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pengajuan_surat_kodeLacak_key`(`kodeLacak`),
    UNIQUE INDEX `pengajuan_surat_nomorSurat_key`(`nomorSurat`),
    UNIQUE INDEX `pengajuan_surat_kodeVerifikasi_key`(`kodeVerifikasi`),
    INDEX `pengajuan_surat_pemohonId_status_idx`(`pemohonId`, `status`),
    INDEX `pengajuan_surat_status_dibuatPada_idx`(`status`, `dibuatPada`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lampiran_surat` (
    `id` VARCHAR(191) NOT NULL,
    `pengajuanId` VARCHAR(191) NOT NULL,
    `berkasId` VARCHAR(191) NOT NULL,
    `keterangan` VARCHAR(120) NULL,

    INDEX `lampiran_surat_pengajuanId_idx`(`pengajuanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riwayat_status_surat` (
    `id` VARCHAR(191) NOT NULL,
    `pengajuanId` VARCHAR(191) NOT NULL,
    `status` ENUM('DIPROSES', 'DISETUJUI', 'DITOLAK', 'SIAP_DIAMBIL') NOT NULL,
    `catatan` VARCHAR(500) NULL,
    `olehUserId` VARCHAR(64) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `riwayat_status_surat_pengajuanId_idx`(`pengajuanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `anggaran` (
    `id` VARCHAR(191) NOT NULL,
    `tahun` INTEGER NOT NULL,
    `versi` VARCHAR(30) NOT NULL DEFAULT 'MURNI',
    `dikunci` BOOLEAN NOT NULL DEFAULT false,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `anggaran_tahun_versi_key`(`tahun`, `versi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_anggaran` (
    `id` VARCHAR(191) NOT NULL,
    `anggaranId` VARCHAR(191) NOT NULL,
    `jenis` ENUM('PENDAPATAN', 'BELANJA', 'PEMBIAYAAN') NOT NULL,
    `bidang` VARCHAR(150) NOT NULL,
    `uraian` VARCHAR(255) NOT NULL,
    `sumberDana` VARCHAR(80) NOT NULL,
    `pagu` DECIMAL(15, 2) NOT NULL,
    `realisasi` DECIMAL(15, 2) NOT NULL DEFAULT 0,

    INDEX `item_anggaran_anggaranId_jenis_idx`(`anggaranId`, `jenis`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proyek` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `deskripsi` TEXT NULL,
    `lokasi` VARCHAR(200) NOT NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `nilai` DECIMAL(15, 2) NOT NULL,
    `sumberDana` VARCHAR(80) NOT NULL,
    `kontraktor` VARCHAR(150) NULL,
    `pengawas` VARCHAR(150) NULL,
    `tanggalMulai` DATE NOT NULL,
    `tanggalSelesai` DATE NULL,
    `status` ENUM('PERENCANAAN', 'BERJALAN', 'SELESAI', 'TERTUNDA') NOT NULL DEFAULT 'PERENCANAAN',
    `persentase` INTEGER NOT NULL DEFAULT 0,
    `tahun` INTEGER NOT NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbaruiPada` DATETIME(3) NOT NULL,

    INDEX `proyek_tahun_status_idx`(`tahun`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `progres_proyek` (
    `id` VARCHAR(191) NOT NULL,
    `proyekId` VARCHAR(191) NOT NULL,
    `tanggal` DATE NOT NULL,
    `persentase` INTEGER NOT NULL,
    `catatan` TEXT NULL,
    `fotoId` VARCHAR(191) NULL,

    INDEX `progres_proyek_proyekId_tanggal_idx`(`proyekId`, `tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengaduan` (
    `id` VARCHAR(191) NOT NULL,
    `kodeLacak` VARCHAR(30) NOT NULL,
    `pelaporId` VARCHAR(191) NULL,
    `anonim` BOOLEAN NOT NULL DEFAULT false,
    `kategori` ENUM('JALAN_RUSAK', 'LAMPU_MATI', 'SAMPAH', 'BANJIR', 'PELAYANAN', 'KONFLIK_SOSIAL', 'KEBAKARAN', 'INFRASTRUKTUR') NOT NULL,
    `judul` VARCHAR(150) NOT NULL,
    `deskripsi` TEXT NOT NULL,
    `lokasiTeks` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `status` ENUM('BARU', 'DIVERIFIKASI', 'DITANGANI', 'SELESAI', 'DITOLAK') NOT NULL DEFAULT 'BARU',
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbaruiPada` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pengaduan_kodeLacak_key`(`kodeLacak`),
    INDEX `pengaduan_status_dibuatPada_idx`(`status`, `dibuatPada`),
    INDEX `pengaduan_kategori_idx`(`kategori`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `foto_pengaduan` (
    `id` VARCHAR(191) NOT NULL,
    `pengaduanId` VARCHAR(191) NOT NULL,
    `berkasId` VARCHAR(191) NOT NULL,

    INDEX `foto_pengaduan_pengaduanId_idx`(`pengaduanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tanggapan_pengaduan` (
    `id` VARCHAR(191) NOT NULL,
    `pengaduanId` VARCHAR(191) NOT NULL,
    `isi` TEXT NOT NULL,
    `status` ENUM('BARU', 'DIVERIFIKASI', 'DITANGANI', 'SELESAI', 'DITOLAK') NOT NULL,
    `olehUserId` VARCHAR(64) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tanggapan_pengaduan_pengaduanId_idx`(`pengaduanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `program_bantuan` (
    `id` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(30) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `deskripsi` TEXT NULL,
    `tahun` INTEGER NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `program_bantuan_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penerima_bantuan` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `pendudukId` VARCHAR(191) NOT NULL,
    `periode` VARCHAR(20) NOT NULL,
    `nominal` DECIMAL(15, 2) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'TERDAFTAR',
    `dicairkanPada` DATETIME(3) NULL,

    INDEX `penerima_bantuan_pendudukId_idx`(`pendudukId`),
    UNIQUE INDEX `penerima_bantuan_programId_pendudukId_periode_key`(`programId`, `pendudukId`, `periode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `umkm` (
    `id` VARCHAR(191) NOT NULL,
    `pemilikId` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `kategori` ENUM('MAKANAN', 'KERAJINAN', 'PERTANIAN', 'PETERNAKAN', 'PERIKANAN', 'JASA') NOT NULL,
    `deskripsi` TEXT NULL,
    `alamat` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `whatsapp` VARCHAR(30) NOT NULL,
    `logoId` VARCHAR(191) NULL,
    `qrisBerkasId` VARCHAR(191) NULL,
    `namaBank` VARCHAR(60) NULL,
    `nomorRekening` VARCHAR(40) NULL,
    `atasNama` VARCHAR(120) NULL,
    `terverifikasi` BOOLEAN NOT NULL DEFAULT false,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbaruiPada` DATETIME(3) NOT NULL,

    INDEX `umkm_kategori_aktif_idx`(`kategori`, `aktif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `produk` (
    `id` VARCHAR(191) NOT NULL,
    `umkmId` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `deskripsi` TEXT NULL,
    `harga` DECIMAL(12, 2) NOT NULL,
    `satuan` VARCHAR(20) NOT NULL DEFAULT 'pcs',
    `stok` INTEGER NOT NULL DEFAULT 0,
    `fotoId` VARCHAR(191) NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbaruiPada` DATETIME(3) NOT NULL,

    INDEX `produk_umkmId_aktif_idx`(`umkmId`, `aktif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pesanan` (
    `id` VARCHAR(191) NOT NULL,
    `kodePesanan` VARCHAR(30) NOT NULL,
    `pembeliId` VARCHAR(191) NOT NULL,
    `umkmId` VARCHAR(191) NOT NULL,
    `total` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('MENUNGGU_PEMBAYARAN', 'MENUNGGU_VERIFIKASI', 'DIBAYAR', 'DIPROSES_PENJUAL', 'SELESAI', 'DITOLAK', 'DIBATALKAN') NOT NULL DEFAULT 'MENUNGGU_PEMBAYARAN',
    `catatan` VARCHAR(500) NULL,
    `alamatKirim` VARCHAR(255) NULL,
    `alasanTolak` VARCHAR(500) NULL,
    `kedaluwarsaPada` DATETIME(3) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbaruiPada` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pesanan_kodePesanan_key`(`kodePesanan`),
    INDEX `pesanan_pembeliId_status_idx`(`pembeliId`, `status`),
    INDEX `pesanan_umkmId_status_idx`(`umkmId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_pesanan` (
    `id` VARCHAR(191) NOT NULL,
    `pesananId` VARCHAR(191) NOT NULL,
    `produkId` VARCHAR(191) NOT NULL,
    `namaProduk` VARCHAR(150) NOT NULL,
    `hargaSatuan` DECIMAL(12, 2) NOT NULL,
    `jumlah` INTEGER NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,

    INDEX `item_pesanan_pesananId_idx`(`pesananId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bukti_bayar` (
    `id` VARCHAR(191) NOT NULL,
    `pesananId` VARCHAR(191) NOT NULL,
    `berkasId` VARCHAR(191) NOT NULL,
    `nominal` DECIMAL(12, 2) NULL,
    `tanggalTransfer` DATETIME(3) NULL,
    `catatan` VARCHAR(255) NULL,
    `diverifikasiOleh` VARCHAR(64) NULL,
    `diverifikasiPada` DATETIME(3) NULL,
    `diterima` BOOLEAN NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `bukti_bayar_pesananId_idx`(`pesananId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `riwayat_pesanan` (
    `id` VARCHAR(191) NOT NULL,
    `pesananId` VARCHAR(191) NOT NULL,
    `status` ENUM('MENUNGGU_PEMBAYARAN', 'MENUNGGU_VERIFIKASI', 'DIBAYAR', 'DIPROSES_PENJUAL', 'SELESAI', 'DITOLAK', 'DIBATALKAN') NOT NULL,
    `catatan` VARCHAR(500) NULL,
    `olehUserId` VARCHAR(64) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `riwayat_pesanan_pesananId_idx`(`pesananId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ulasan` (
    `id` VARCHAR(191) NOT NULL,
    `umkmId` VARCHAR(191) NOT NULL,
    `produkId` VARCHAR(191) NULL,
    `penulisId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `komentar` TEXT NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ulasan_umkmId_idx`(`umkmId`),
    UNIQUE INDEX `ulasan_produkId_penulisId_key`(`produkId`, `penulisId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_pendudukId_fkey` FOREIGN KEY (`pendudukId`) REFERENCES `penduduk`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rt` ADD CONSTRAINT `rt_rwId_fkey` FOREIGN KEY (`rwId`) REFERENCES `rw`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kartu_keluarga` ADD CONSTRAINT `kartu_keluarga_rtId_fkey` FOREIGN KEY (`rtId`) REFERENCES `rt`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penduduk` ADD CONSTRAINT `penduduk_kartuKeluargaId_fkey` FOREIGN KEY (`kartuKeluargaId`) REFERENCES `kartu_keluarga`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perangkat` ADD CONSTRAINT `perangkat_pendudukId_fkey` FOREIGN KEY (`pendudukId`) REFERENCES `penduduk`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `anggota_lembaga` ADD CONSTRAINT `anggota_lembaga_lembagaId_fkey` FOREIGN KEY (`lembagaId`) REFERENCES `lembaga`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dokumen` ADD CONSTRAINT `dokumen_berkasId_fkey` FOREIGN KEY (`berkasId`) REFERENCES `berkas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `galeri` ADD CONSTRAINT `galeri_berkasId_fkey` FOREIGN KEY (`berkasId`) REFERENCES `berkas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_surat` ADD CONSTRAINT `pengajuan_surat_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `template_surat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_surat` ADD CONSTRAINT `pengajuan_surat_pemohonId_fkey` FOREIGN KEY (`pemohonId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_surat` ADD CONSTRAINT `pengajuan_surat_peninjauId_fkey` FOREIGN KEY (`peninjauId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lampiran_surat` ADD CONSTRAINT `lampiran_surat_pengajuanId_fkey` FOREIGN KEY (`pengajuanId`) REFERENCES `pengajuan_surat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lampiran_surat` ADD CONSTRAINT `lampiran_surat_berkasId_fkey` FOREIGN KEY (`berkasId`) REFERENCES `berkas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_status_surat` ADD CONSTRAINT `riwayat_status_surat_pengajuanId_fkey` FOREIGN KEY (`pengajuanId`) REFERENCES `pengajuan_surat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_anggaran` ADD CONSTRAINT `item_anggaran_anggaranId_fkey` FOREIGN KEY (`anggaranId`) REFERENCES `anggaran`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progres_proyek` ADD CONSTRAINT `progres_proyek_proyekId_fkey` FOREIGN KEY (`proyekId`) REFERENCES `proyek`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `progres_proyek` ADD CONSTRAINT `progres_proyek_fotoId_fkey` FOREIGN KEY (`fotoId`) REFERENCES `berkas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengaduan` ADD CONSTRAINT `pengaduan_pelaporId_fkey` FOREIGN KEY (`pelaporId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `foto_pengaduan` ADD CONSTRAINT `foto_pengaduan_pengaduanId_fkey` FOREIGN KEY (`pengaduanId`) REFERENCES `pengaduan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `foto_pengaduan` ADD CONSTRAINT `foto_pengaduan_berkasId_fkey` FOREIGN KEY (`berkasId`) REFERENCES `berkas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tanggapan_pengaduan` ADD CONSTRAINT `tanggapan_pengaduan_pengaduanId_fkey` FOREIGN KEY (`pengaduanId`) REFERENCES `pengaduan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penerima_bantuan` ADD CONSTRAINT `penerima_bantuan_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `program_bantuan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penerima_bantuan` ADD CONSTRAINT `penerima_bantuan_pendudukId_fkey` FOREIGN KEY (`pendudukId`) REFERENCES `penduduk`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `umkm` ADD CONSTRAINT `umkm_pemilikId_fkey` FOREIGN KEY (`pemilikId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `umkm` ADD CONSTRAINT `umkm_logoId_fkey` FOREIGN KEY (`logoId`) REFERENCES `berkas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `umkm` ADD CONSTRAINT `umkm_qrisBerkasId_fkey` FOREIGN KEY (`qrisBerkasId`) REFERENCES `berkas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produk` ADD CONSTRAINT `produk_umkmId_fkey` FOREIGN KEY (`umkmId`) REFERENCES `umkm`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `produk` ADD CONSTRAINT `produk_fotoId_fkey` FOREIGN KEY (`fotoId`) REFERENCES `berkas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pesanan` ADD CONSTRAINT `pesanan_pembeliId_fkey` FOREIGN KEY (`pembeliId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pesanan` ADD CONSTRAINT `pesanan_umkmId_fkey` FOREIGN KEY (`umkmId`) REFERENCES `umkm`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_pesanan` ADD CONSTRAINT `item_pesanan_pesananId_fkey` FOREIGN KEY (`pesananId`) REFERENCES `pesanan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `item_pesanan` ADD CONSTRAINT `item_pesanan_produkId_fkey` FOREIGN KEY (`produkId`) REFERENCES `produk`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bukti_bayar` ADD CONSTRAINT `bukti_bayar_pesananId_fkey` FOREIGN KEY (`pesananId`) REFERENCES `pesanan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bukti_bayar` ADD CONSTRAINT `bukti_bayar_berkasId_fkey` FOREIGN KEY (`berkasId`) REFERENCES `berkas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `riwayat_pesanan` ADD CONSTRAINT `riwayat_pesanan_pesananId_fkey` FOREIGN KEY (`pesananId`) REFERENCES `pesanan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ulasan` ADD CONSTRAINT `ulasan_umkmId_fkey` FOREIGN KEY (`umkmId`) REFERENCES `umkm`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ulasan` ADD CONSTRAINT `ulasan_produkId_fkey` FOREIGN KEY (`produkId`) REFERENCES `produk`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ulasan` ADD CONSTRAINT `ulasan_penulisId_fkey` FOREIGN KEY (`penulisId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

