-- CreateTable
CREATE TABLE `absensi` (
    `id` VARCHAR(191) NOT NULL,
    `perangkatId` VARCHAR(191) NOT NULL,
    `tanggal` DATE NOT NULL,
    `status` ENUM('HADIR', 'IZIN', 'SAKIT', 'DINAS_LUAR', 'ALPA') NOT NULL DEFAULT 'HADIR',
    `jamMasuk` VARCHAR(5) NULL,
    `jamPulang` VARCHAR(5) NULL,
    `catatan` VARCHAR(255) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `absensi_tanggal_idx`(`tanggal`),
    UNIQUE INDEX `absensi_perangkatId_tanggal_key`(`perangkatId`, `tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aset` (
    `id` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `kategori` VARCHAR(80) NOT NULL,
    `kodeInventaris` VARCHAR(60) NULL,
    `tahunPerolehan` INTEGER NOT NULL,
    `nilai` DECIMAL(15, 2) NOT NULL,
    `jumlah` INTEGER NOT NULL DEFAULT 1,
    `satuan` VARCHAR(20) NOT NULL DEFAULT 'unit',
    `kondisi` ENUM('BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT') NOT NULL DEFAULT 'BAIK',
    `lokasi` VARCHAR(150) NULL,
    `sumberDana` VARCHAR(80) NULL,
    `keterangan` TEXT NULL,
    `fotoId` VARCHAR(191) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbaruiPada` DATETIME(3) NOT NULL,

    UNIQUE INDEX `aset_kodeInventaris_key`(`kodeInventaris`),
    INDEX `aset_kategori_kondisi_idx`(`kategori`, `kondisi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tagihan` (
    `id` VARCHAR(191) NOT NULL,
    `pendudukId` VARCHAR(191) NOT NULL,
    `jenis` ENUM('PBB', 'IURAN_DESA', 'SEWA_ASET', 'LAINNYA') NOT NULL,
    `judul` VARCHAR(200) NOT NULL,
    `tahun` INTEGER NOT NULL,
    `periode` VARCHAR(20) NULL,
    `jumlah` DECIMAL(15, 2) NOT NULL,
    `jatuhTempo` DATE NULL,
    `status` ENUM('BELUM_BAYAR', 'LUNAS', 'DIBATALKAN') NOT NULL DEFAULT 'BELUM_BAYAR',
    `dibayarPada` DATETIME(3) NULL,
    `catatan` VARCHAR(255) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tagihan_pendudukId_status_idx`(`pendudukId`, `status`),
    INDEX `tagihan_tahun_jenis_idx`(`tahun`, `jenis`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sertifikat` (
    `id` VARCHAR(191) NOT NULL,
    `pendudukId` VARCHAR(191) NOT NULL,
    `namaPelatihan` VARCHAR(200) NOT NULL,
    `penyelenggara` VARCHAR(150) NOT NULL,
    `tanggalMulai` DATE NOT NULL,
    `tanggalSelesai` DATE NULL,
    `nomorSertifikat` VARCHAR(80) NULL,
    `berkasId` VARCHAR(191) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sertifikat_pendudukId_idx`(`pendudukId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kegiatan_warga` (
    `id` VARCHAR(191) NOT NULL,
    `pendudukId` VARCHAR(191) NOT NULL,
    `agendaId` VARCHAR(191) NULL,
    `judul` VARCHAR(200) NOT NULL,
    `tanggal` DATE NOT NULL,
    `peran` VARCHAR(80) NULL,
    `keterangan` VARCHAR(255) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `kegiatan_warga_pendudukId_tanggal_idx`(`pendudukId`, `tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `absensi` ADD CONSTRAINT `absensi_perangkatId_fkey` FOREIGN KEY (`perangkatId`) REFERENCES `perangkat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `aset` ADD CONSTRAINT `aset_fotoId_fkey` FOREIGN KEY (`fotoId`) REFERENCES `berkas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tagihan` ADD CONSTRAINT `tagihan_pendudukId_fkey` FOREIGN KEY (`pendudukId`) REFERENCES `penduduk`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sertifikat` ADD CONSTRAINT `sertifikat_pendudukId_fkey` FOREIGN KEY (`pendudukId`) REFERENCES `penduduk`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sertifikat` ADD CONSTRAINT `sertifikat_berkasId_fkey` FOREIGN KEY (`berkasId`) REFERENCES `berkas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kegiatan_warga` ADD CONSTRAINT `kegiatan_warga_pendudukId_fkey` FOREIGN KEY (`pendudukId`) REFERENCES `penduduk`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kegiatan_warga` ADD CONSTRAINT `kegiatan_warga_agendaId_fkey` FOREIGN KEY (`agendaId`) REFERENCES `agenda`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

