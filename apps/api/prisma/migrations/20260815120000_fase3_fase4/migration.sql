-- CreateTable
CREATE TABLE `informasi_sektor` (
    `id` VARCHAR(191) NOT NULL,
    `sektor` ENUM('BUMDES', 'PERTANIAN', 'PETERNAKAN', 'PERIKANAN', 'PENDIDIKAN', 'KESEHATAN', 'KETENAGAKERJAAN') NOT NULL,
    `kategori` VARCHAR(80) NOT NULL,
    `judul` VARCHAR(200) NOT NULL,
    `isi` TEXT NOT NULL,
    `gambarId` VARCHAR(191) NULL,
    `lampiranId` VARCHAR(191) NULL,
    `urutan` INTEGER NOT NULL DEFAULT 0,
    `terbit` BOOLEAN NOT NULL DEFAULT true,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diperbaruiPada` DATETIME(3) NOT NULL,

    INDEX `informasi_sektor_sektor_terbit_idx`(`sektor`, `terbit`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fasilitas` (
    `id` VARCHAR(191) NOT NULL,
    `jenis` ENUM('PAUD', 'SD', 'POSYANDU', 'PUSTU', 'PUSKESMAS', 'PERPUSTAKAAN', 'KANTOR_DESA', 'BALAI_DESA', 'MASJID', 'GEREJA', 'PASAR', 'LAPANGAN', 'IRIGASI', 'LAINNYA') NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `alamat` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `kontak` VARCHAR(60) NULL,
    `jamOperasional` VARCHAR(120) NULL,
    `keterangan` TEXT NULL,
    `fotoId` VARCHAR(191) NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fasilitas_jenis_aktif_idx`(`jenis`, `aktif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `harga_komoditas` (
    `id` VARCHAR(191) NOT NULL,
    `sektor` ENUM('BUMDES', 'PERTANIAN', 'PETERNAKAN', 'PERIKANAN', 'PENDIDIKAN', 'KESEHATAN', 'KETENAGAKERJAAN') NOT NULL,
    `komoditas` VARCHAR(100) NOT NULL,
    `satuan` VARCHAR(30) NOT NULL,
    `harga` DECIMAL(15, 2) NOT NULL,
    `tanggal` DATE NOT NULL,
    `sumber` VARCHAR(120) NULL,
    `catatan` VARCHAR(255) NULL,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `harga_komoditas_sektor_tanggal_idx`(`sektor`, `tanggal`),
    UNIQUE INDEX `harga_komoditas_sektor_komoditas_tanggal_key`(`sektor`, `komoditas`, `tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lowongan` (
    `id` VARCHAR(191) NOT NULL,
    `jenis` ENUM('LOWONGAN', 'MAGANG', 'PELATIHAN', 'REKRUTMEN') NOT NULL DEFAULT 'LOWONGAN',
    `judul` VARCHAR(200) NOT NULL,
    `penyelenggara` VARCHAR(150) NOT NULL,
    `deskripsi` TEXT NOT NULL,
    `persyaratan` TEXT NULL,
    `lokasi` VARCHAR(150) NULL,
    `imbalan` VARCHAR(120) NULL,
    `kontak` VARCHAR(150) NULL,
    `batasLamar` DATE NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `dibuatPada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lowongan_jenis_aktif_idx`(`jenis`, `aktif`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `informasi_sektor` ADD CONSTRAINT `informasi_sektor_gambarId_fkey` FOREIGN KEY (`gambarId`) REFERENCES `berkas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `informasi_sektor` ADD CONSTRAINT `informasi_sektor_lampiranId_fkey` FOREIGN KEY (`lampiranId`) REFERENCES `berkas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fasilitas` ADD CONSTRAINT `fasilitas_fotoId_fkey` FOREIGN KEY (`fotoId`) REFERENCES `berkas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

node.exe : ┌─────────────────────────────────────────────────────────┐
At line:1 char:1
+ & "C:\Program Files\nodejs/node.exe" "C:\Program Files\nodejs/node_mo ...
+ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (┌──────────────...──────────────┐:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
│  Update available 5.22.0 -> 7.9.1                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
