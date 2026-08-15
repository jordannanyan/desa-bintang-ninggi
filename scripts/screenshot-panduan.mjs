/**
 * Mengambil tangkapan layar untuk docs/visual/panduan.html.
 *
 * Prasyarat, dua-duanya harus jalan:
 *   1. node scripts/data-contoh.mjs      (data karangan di :4000)
 *   2. npm run dev:web                   (Vite di :5173, mem-proxy /api ke :4000)
 *
 * Jalankan: node scripts/screenshot-panduan.mjs
 *
 * Tangkapan disimpan ke docs/screenshots/panduan/. Seluruh isinya memakai data
 * karangan dari data-contoh.mjs — tidak ada data warga sungguhan yang ikut
 * tersimpan di berkas dokumentasi.
 */
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, '../docs/screenshots/panduan');
const BASIS = process.env.WEB_URL ?? 'http://localhost:5173';

/**
 * `potong` membatasi tinggi tangkapan. Halaman panjang yang difoto utuh
 * menyusut jadi tak terbaca ketika dimasukkan ke lebar kolom PDF; memotong di
 * bagian yang relevan jauh lebih berguna bagi pembaca panduan.
 */
const HALAMAN = [
  // ── Pengunjung umum ──
  { nama: 'beranda', rute: '/', potong: 1500 },
  { nama: 'beranda-layanan', rute: '/', potong: 1100, geser: 900 },
  { nama: 'profil-desa', rute: '/profil', potong: 1400 },
  { nama: 'kependudukan', rute: '/kependudukan', potong: 1500 },
  { nama: 'keuangan', rute: '/keuangan', potong: 1400 },
  { nama: 'pembangunan', rute: '/pembangunan', potong: 1200 },
  { nama: 'pengaduan-publik', rute: '/pengaduan', potong: 1200 },
  { nama: 'pengaduan-buat', rute: '/pengaduan/buat', potong: 1400 },
  { nama: 'pengaduan-lacak', rute: '/pengaduan/lacak', potong: 700 },
  { nama: 'umkm', rute: '/umkm', potong: 1100 },
  { nama: 'dokumen-pemerintahan', rute: '/pemerintahan', potong: 1100 },
  { nama: 'ppid', rute: '/ppid', potong: 1000 },
  { nama: 'ppid-permohonan', rute: '/ppid/permohonan', potong: 1300 },
  { nama: 'verifikasi', rute: '/verifikasi', potong: 700 },

  // ── Warga ──
  { nama: 'masuk-warga', rute: '/masuk', potong: 800 },
  { nama: 'aktivasi', rute: '/aktivasi', potong: 900 },
  { nama: 'layanan-jenis', rute: '/layanan', potong: 1300 },
  { nama: 'ajukan-surat', rute: '/layanan/ajukan/USAHA', potong: 1400 },
  { nama: 'warga-beranda', rute: '/warga', potong: 1300 },
  { nama: 'warga-surat', rute: '/warga/surat', potong: 900 },
  { nama: 'warga-tagihan', rute: '/warga/tagihan', potong: 800 },
  { nama: 'warga-pengaduan', rute: '/warga/pengaduan', potong: 800 },
  { nama: 'warga-sertifikat', rute: '/warga/sertifikat', potong: 800 },
  { nama: 'warga-kegiatan', rute: '/warga/kegiatan', potong: 700 },
  { nama: 'warga-profil', rute: '/warga/profil', potong: 1200 },

  // ── Perangkat desa ──
  { nama: 'masuk-perangkat', rute: '/masuk-perangkat', potong: 800 },
  { nama: 'admin-beranda', rute: '/admin', potong: 1500 },
  { nama: 'admin-beranda-bawah', rute: '/admin', potong: 1200, geser: 1150 },
  { nama: 'admin-penduduk', rute: '/admin/penduduk', potong: 1100 },
  { nama: 'admin-penduduk-baru', rute: '/admin/penduduk/baru', potong: 1200 },
  { nama: 'admin-penduduk-impor', rute: '/admin/penduduk/impor', potong: 1000 },
  { nama: 'admin-surat', rute: '/admin/surat', potong: 1000 },
  { nama: 'admin-pengaduan', rute: '/admin/pengaduan', potong: 900 },
  { nama: 'admin-keuangan', rute: '/admin/keuangan', potong: 1100 },
  { nama: 'admin-tagihan', rute: '/admin/tagihan', potong: 1400 },
  { nama: 'admin-absensi', rute: '/admin/absensi', potong: 1300 },
  { nama: 'admin-aset', rute: '/admin/aset', potong: 1400 },
  { nama: 'admin-statistik', rute: '/admin/statistik', potong: 1500 },
  { nama: 'admin-berita', rute: '/admin/berita', potong: 1000 },
  { nama: 'admin-dokumen', rute: '/admin/dokumen', potong: 1100 },
  { nama: 'admin-profil-desa', rute: '/admin/profil-desa', potong: 1300 },

  // ── Ponsel ──
  { nama: 'hp-beranda', rute: '/', lebar: 420, potong: 1400 },
  { nama: 'hp-admin', rute: '/admin', lebar: 420, potong: 1400 },
];

const KANDIDAT_BROWSER = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const executablePath = KANDIDAT_BROWSER.find((p) => existsSync(p));
if (!executablePath) {
  console.error('Chrome/Edge tidak ditemukan.');
  process.exit(1);
}

mkdirSync(DIR, { recursive: true });

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  args: ['--no-sandbox', '--font-render-hinting=none'],
});

let gagal = 0;
for (const h of HALAMAN) {
  const lebar = h.lebar ?? 1360;
  const page = await browser.newPage();
  await page.setViewport({ width: lebar, height: h.potong ?? 900, deviceScaleFactor: 2 });

  try {
    await page.goto(BASIS + h.rute, { waitUntil: 'networkidle0', timeout: 30_000 });
    // Beri waktu animasi batang dan transisi kartu selesai — batang yang
    // tertangkap di tengah animasi terlihat seperti data yang salah.
    await new Promise((r) => setTimeout(r, 900));
    if (h.geser) await page.evaluate((y) => window.scrollTo(0, y), h.geser);
    await new Promise((r) => setTimeout(r, 300));

    await page.screenshot({
      path: resolve(DIR, `${h.nama}.png`),
      ...(h.potong
        ? { clip: { x: 0, y: h.geser ?? 0, width: lebar, height: h.potong }, captureBeyondViewport: true }
        : { fullPage: true }),
    });
    console.log(`  ${h.rute.padEnd(28)} -> ${h.nama}.png`);
  } catch (e) {
    gagal++;
    console.error(`  GAGAL ${h.rute}: ${e.message}`);
  }
  await page.close();
}

await browser.close();
console.log(gagal ? `Selesai dengan ${gagal} kegagalan.` : 'Selesai.');
