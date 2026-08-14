/**
 * Marketplace UMKM dengan pembayaran QRIS manual.
 *
 * Tidak ada payment gateway: tiap UMKM memasang QRIS miliknya sendiri, pembeli
 * transfer lalu mengunggah bukti, dan penjual yang memverifikasi. Desa tidak
 * pernah memegang uang warga.
 */

export const KATEGORI_UMKM = [
  'MAKANAN',
  'KERAJINAN',
  'PERTANIAN',
  'PETERNAKAN',
  'PERIKANAN',
  'JASA',
] as const;

export const LABEL_KATEGORI_UMKM: Record<(typeof KATEGORI_UMKM)[number], string> = {
  MAKANAN: 'Produk Makanan',
  KERAJINAN: 'Kerajinan',
  PERTANIAN: 'Pertanian',
  PETERNAKAN: 'Peternakan',
  PERIKANAN: 'Perikanan',
  JASA: 'Jasa',
};

export const STATUS_PESANAN = [
  'MENUNGGU_PEMBAYARAN',
  'MENUNGGU_VERIFIKASI',
  'DIBAYAR',
  'DIPROSES_PENJUAL',
  'SELESAI',
  'DITOLAK',
  'DIBATALKAN',
] as const;

export type StatusPesanan = (typeof STATUS_PESANAN)[number];

export const LABEL_STATUS_PESANAN: Record<StatusPesanan, string> = {
  MENUNGGU_PEMBAYARAN: 'Menunggu Pembayaran',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi Penjual',
  DIBAYAR: 'Pembayaran Diterima',
  DIPROSES_PENJUAL: 'Sedang Diproses',
  SELESAI: 'Selesai',
  DITOLAK: 'Bukti Bayar Ditolak',
  DIBATALKAN: 'Dibatalkan',
};

/** Penjelasan yang ditampilkan ke pembeli pada tiap status. */
export const PESAN_STATUS_PESANAN: Record<StatusPesanan, string> = {
  MENUNGGU_PEMBAYARAN: 'Silakan scan QRIS penjual, lalu unggah bukti pembayaran.',
  MENUNGGU_VERIFIKASI: 'Bukti sudah diterima. Penjual sedang memeriksa pembayaran Anda.',
  DIBAYAR: 'Pembayaran Anda sudah diverifikasi penjual.',
  DIPROSES_PENJUAL: 'Pesanan sedang disiapkan penjual.',
  SELESAI: 'Pesanan selesai. Terima kasih.',
  DITOLAK: 'Penjual tidak dapat memverifikasi bukti bayar Anda. Lihat alasannya di detail pesanan.',
  DIBATALKAN: 'Pesanan dibatalkan.',
};

/**
 * Perpindahan status yang diizinkan. Dipakai backend agar status tidak bisa
 * melompat sembarangan, dan frontend agar tombol yang tidak berlaku disembunyikan.
 */
export const TRANSISI_PESANAN: Record<StatusPesanan, StatusPesanan[]> = {
  MENUNGGU_PEMBAYARAN: ['MENUNGGU_VERIFIKASI', 'DIBATALKAN'],
  MENUNGGU_VERIFIKASI: ['DIBAYAR', 'DITOLAK'],
  DIBAYAR: ['DIPROSES_PENJUAL', 'DIBATALKAN'],
  DIPROSES_PENJUAL: ['SELESAI', 'DIBATALKAN'],
  DITOLAK: ['MENUNGGU_VERIFIKASI', 'DIBATALKAN'],
  SELESAI: [],
  DIBATALKAN: [],
};

/** Batas waktu unggah bukti bayar sebelum pesanan hangus otomatis. */
export const BATAS_UNGGAH_BUKTI_JAM = 24;
