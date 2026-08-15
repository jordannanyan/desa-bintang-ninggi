/**
 * Memeriksa apakah sebuah PDF punya halaman kosong atau nyaris kosong.
 *
 * Dokumen sebelumnya pernah terbit dengan belasan halaman kosong akibat aturan
 * pemisah halaman CSS. Memeriksanya dengan mata satu per satu tidak masuk akal
 * untuk dokumen 40 halaman, jadi diukur saja: isi tiap halaman didekompresi,
 * lalu panjang perintah gambarnya dibandingkan. Halaman yang hanya memuat
 * kop/kaki halaman akan jauh lebih pendek daripada halaman berisi.
 *
 * Jalankan: node scripts/cek-halaman-kosong.mjs <berkas.pdf>
 */
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const berkas = process.argv[2];
if (!berkas) {
  console.error('Pemakaian: node scripts/cek-halaman-kosong.mjs <berkas.pdf>');
  process.exit(1);
}

const buf = readFileSync(berkas);
const raw = buf.toString('latin1');

/** Mengambil seluruh objek `N 0 obj ... endobj` beserta posisinya. */
const objek = new Map();
for (const m of raw.matchAll(/(\d+)\s+0\s+obj\b/g)) {
  const mulai = m.index + m[0].length;
  const akhir = raw.indexOf('endobj', mulai);
  if (akhir > 0) objek.set(Number(m[1]), { mulai, akhir, isi: raw.slice(mulai, akhir) });
}

/** Isi stream mentah sebuah objek, sudah didekompresi bila Flate. */
function streamObjek(no) {
  const o = objek.get(no);
  if (!o) return '';
  const s = raw.indexOf('stream', o.mulai);
  if (s < 0 || s > o.akhir) return '';
  let awal = s + 'stream'.length;
  if (raw[awal] === '\r') awal++;
  if (raw[awal] === '\n') awal++;
  const habis = raw.indexOf('endstream', awal);
  const mentah = buf.subarray(awal, habis);
  if (/\/Filter\s*\/FlateDecode/.test(o.isi)) {
    try {
      return inflateSync(mentah).toString('latin1');
    } catch {
      return '';
    }
  }
  return mentah.toString('latin1');
}

const halaman = [];
for (const [no, o] of objek) {
  if (!/\/Type\s*\/Page[^s]/.test(o.isi)) continue;
  const c = /\/Contents\s+(\d+)\s+0\s+R/.exec(o.isi);
  halaman.push({ no, contents: c ? Number(c[1]) : null });
}

if (halaman.length === 0) {
  console.error('Tidak menemukan objek halaman. PDF mungkin memakai object stream terkompresi.');
  process.exit(2);
}

const hasil = halaman.map((h, i) => {
  const isi = h.contents ? streamObjek(h.contents) : '';
  // Perintah penempatan teks dan penggambaran gambar. Halaman yang hanya berisi
  // kop/kaki tetap punya beberapa Tj — itulah sebabnya ambangnya bukan nol.
  const teks = (isi.match(/\bTJ\b|\bTj\b/g) ?? []).length;
  const gambar = (isi.match(/\/Image|\bDo\b/g) ?? []).length;
  return { urut: i + 1, teks, gambar, panjang: isi.length };
});

// Kaki halaman sendirian menyumbang sekitar 53 perintah teks pada berkas ini.
// Halaman yang tidak melewati angka itu dan tidak memuat gambar berarti benar-
// benar kosong. Halaman yang hanya berisi satu tangkapan layar (gambar = 1,
// teks = 53) BUKAN halaman kosong — itu memang gambar sehalaman penuh.
const AMBANG_TEKS = 60;
const kosong = hasil.filter((h) => h.gambar === 0 && h.teks <= AMBANG_TEKS);

console.log(`Berkas    : ${berkas}`);
console.log(`Halaman   : ${hasil.length}`);
console.log(`Bergambar : ${hasil.filter((h) => h.gambar > 0).length}`);

if (kosong.length === 0) {
  console.log('Kosong    : tidak ada.');
} else {
  console.log(`Kosong    : ${kosong.length} halaman -> ${kosong.map((k) => k.urut).join(', ')}`);
  process.exitCode = 1;
}

// Halaman yang isinya sangat sedikit tapi tidak kosong — biasanya sisa satu
// paragraf yang terdorong, penanda aturan pemisah halaman yang perlu dirapikan.
const tipis = hasil.filter((h) => h.gambar === 0 && h.teks > AMBANG_TEKS && h.teks <= 250);
if (tipis.length) {
  console.log(`Tipis     : ${tipis.length} halaman -> ${tipis.map((k) => `${k.urut}(${k.teks})`).join(', ')}`);
}
