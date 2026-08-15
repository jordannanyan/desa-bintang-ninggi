/**
 * Token warna untuk visualisasi data.
 *
 * Nilai di sini bukan pilihan selera — sudah dijalankan lewat validator palet
 * (lightness band, chroma floor, pemisahan CVD, contrast) terhadap latar putih
 * kartu. Catatan hasilnya ada di tiap slot. Jangan mengganti hex tanpa
 * menjalankan ulang validatornya.
 */

/** Satu hue untuk grafik satu seri — panjang batang yang menyandi besaran, bukan warna. */
export const HUE_TUNGGAL = '#22724f'; // desa-600 · kontras 5.9:1 pada putih

/**
 * Slot kategorikal untuk perbandingan identitas, dipakai BERURUTAN — tidak
 * pernah diputar. Seri keempat tidak dibangkitkan warnanya; kalau butuh lebih,
 * pecah jadi beberapa grafik kecil.
 *
 * Hijau + oranye sempat dicoba dan GAGAL: pada penglihatan protan keduanya
 * hanya terpisah ΔE 3.2 — praktis warna yang sama bagi pembaca buta warna
 * merah-hijau, yang jumlahnya sekitar 8% laki-laki. Biru + oranye terpisah
 * ΔE 24.7 pada protan dan 33.6 pada penglihatan normal.
 *
 * Slot ketiga (magenta) diuji terhadap KEDUA slot lain, bukan hanya
 * tetangganya: ungu sempat dicoba dan gagal karena hanya terpisah ΔE 12.0 dari
 * biru pada penglihatan normal. Magenta terpisah ΔE 16.6 (deutan) dan 18.1
 * (normal) pada pasangan terburuknya.
 */
export const KATEGORI = ['#2a78d6', '#eb6834', '#c2185b'] as const;

/** Tinta teks — label dan angka TIDAK PERNAH memakai warna seri. */
export const TINTA = {
  utama: '#0f172a',
  sekunder: '#475569',
  redup: '#94a3b8',
  permukaan: '#ffffff',
  jalur: '#f1f5f9',
} as const;

export const formatAngka = (n: number) => n.toLocaleString('id-ID');
