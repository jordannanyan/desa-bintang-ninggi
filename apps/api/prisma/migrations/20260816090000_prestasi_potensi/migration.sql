-- Prestasi & potensi desa untuk halaman Profil Desa.
-- Keduanya daftar bebas-panjang yang tidak pernah dicari atau di-JOIN, jadi
-- disimpan sebagai JSON alih-alih dua tabel yang hanya menambah kerumitan.
ALTER TABLE `profil_desa` ADD COLUMN `prestasi` JSON NULL;
ALTER TABLE `profil_desa` ADD COLUMN `potensi` JSON NULL;
