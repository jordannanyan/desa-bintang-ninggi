/**
 * Mengisi profil desa dengan data yang bisa ditelusuri sumbernya.
 *
 *   npm run db:isi-profil --workspace=@desa/api
 *
 * Hanya mengisi kolom yang MASIH KOSONG atau masih berisi teks bawaan "TODO".
 * Isian yang sudah ditulis perangkat desa tidak pernah ditimpa, sehingga skrip
 * ini aman dijalankan berulang kali.
 *
 * ── Yang sengaja TIDAK diisi ──────────────────────────────────────────────
 *
 * Nama Kepala Desa, visi, misi, dan sambutan kepala desa dikosongkan, bukan
 * ditebak. Alasannya bukan karena datanya tidak ada di internet, melainkan
 * karena keempatnya adalah pernyataan resmi:
 *
 *   - Nama Kepala Desa tercetak sebagai PENANDATANGAN pada setiap surat yang
 *     diterbitkan sistem ini. Satu-satunya nama yang saya temukan berasal dari
 *     pemberitaan 2019; masa jabatan kepala desa enam tahun, jadi nama itu
 *     besar kemungkinan sudah tidak berlaku. Surat resmi yang ditandatangani
 *     atas nama orang yang bukan lagi kepala desa adalah masalah sungguhan.
 *
 *   - Visi dan misi desa ditetapkan lewat RPJMDes. Mengarangnya berarti
 *     menampilkan kebijakan resmi yang tidak pernah diputuskan siapa pun.
 *
 *   - Sambutan kepala desa adalah kata-kata seorang pejabat. Menuliskannya
 *     seolah-olah dari beliau bukan hal yang pantas dilakukan mesin.
 *
 * Keempatnya diisi perangkat desa lewat Dashboard Perangkat -> Profil Desa.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sumber:
 *   - Wikipedia bahasa Indonesia, "Bintang Ninggi I, Teweh Selatan, Barito Utara"
 *     https://id.wikipedia.org/wiki/Bintang_Ninggi_I,_Teweh_Selatan,_Barito_Utara
 *     (kode pos, kode Kemendagri, koordinat, luas wilayah, asal-usul desa)
 */
const DATA = {
  kodePos: '73814',
  luasWilayahKm: 89.58,

  // 1°2'39.23"S 114°50'47.22"E, dikonversi ke desimal.
  latitude: -1.044231,
  longitude: 114.84645,

  sejarah: `Menurut penuturan tetuha adat setempat, Desa Bintang Ninggi I sudah ada jauh sebelum kolonial Belanda memasuki pedalaman Kalimantan. Desa ini bermula dari sebuah permukiman kecil di tepi Sungai Pusik, anak Sungai Barito, yang dihuni dua bersaudara bernama Bintang sebagai kakak dan Ninggi sebagai adik. Keduanya memeluk kepercayaan Hindu Kaharingan. Dari nama kedua bersaudara itulah desa ini kemudian dikenal.

Secara administratif Desa Bintang Ninggi I berada di Kecamatan Teweh Selatan, Kabupaten Barito Utara, Provinsi Kalimantan Tengah, dengan kode wilayah Kemendagri 62.05.08.2003 dan luas wilayah sekitar 89,58 km persegi.

(Naskah awal ini disusun dari sumber terbuka dan masih perlu diperiksa serta dilengkapi perangkat desa.)`,
};

async function main() {
  const profil = await prisma.profilDesa.findUnique({ where: { id: 1 } });
  if (!profil) {
    console.error('Profil desa belum ada. Jalankan dulu: npm run db:seed --workspace=@desa/api');
    process.exit(1);
  }

  /** Kolom dianggap kosong bila null, string kosong, atau masih teks bawaan "TODO". */
  const masihKosong = (nilai: unknown) =>
    nilai === null ||
    nilai === undefined ||
    (typeof nilai === 'string' && (nilai.trim() === '' || nilai.trim().startsWith('TODO')));

  const perubahan: Record<string, unknown> = {};
  const dilewati: string[] = [];

  for (const [kolom, nilai] of Object.entries(DATA)) {
    if (masihKosong(profil[kolom as keyof typeof profil])) {
      perubahan[kolom] = nilai;
    } else {
      dilewati.push(kolom);
    }
  }

  // Teks bawaan "TODO" dibersihkan agar tidak terbaca warga di halaman depan.
  // Dikosongkan, bukan diisi karangan — tampilan kosong justru mengajak
  // perangkat desa mengisinya sendiri.
  for (const kolom of ['visi', 'sambutanKades'] as const) {
    if (typeof profil[kolom] === 'string' && profil[kolom]!.trim().startsWith('TODO')) {
      perubahan[kolom] = null;
    }
  }

  if (Object.keys(perubahan).length === 0) {
    console.log('Tidak ada yang perlu diubah — semua kolom sudah terisi.');
    return;
  }

  await prisma.profilDesa.update({ where: { id: 1 }, data: perubahan });

  console.log('Kolom yang diisi/dibersihkan:');
  for (const [k, v] of Object.entries(perubahan)) {
    const ringkas =
      v === null ? '(dikosongkan)' : String(v).replace(/\s+/g, ' ').slice(0, 60);
    console.log(`  ${k.padEnd(16)} ${ringkas}`);
  }

  if (dilewati.length) {
    console.log(`\nDilewati karena sudah terisi: ${dilewati.join(', ')}`);
  }

  console.log(`
Masih harus diisi perangkat desa lewat Dashboard -> Profil Desa:
  - Visi dan misi desa          (ditetapkan lewat RPJMDes)
  - Sambutan Kepala Desa
  - Alamat kantor desa          (tercetak di bawah kop surat)
  - Nomor WhatsApp dan email resmi

Dan lewat Dashboard -> Manajemen Penduduk, tambahkan Kepala Desa yang
SEDANG MENJABAT sebagai perangkat. Namanya yang akan tercetak sebagai
penandatangan pada setiap surat.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
