/**
 * Mengambil tangkapan layar halaman React yang benar-benar berjalan.
 *
 * Prasyarat: `npm run dev:web` sudah jalan di http://localhost:5173
 * Jalankan:  node scripts/screenshot-web.mjs
 */
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR_SS = resolve(__dirname, '../docs/screenshots');
const BASIS = process.env.WEB_URL ?? 'http://localhost:5173';

const HALAMAN = [
  { nama: 'web-beranda', rute: '/' },
  { nama: 'web-masuk', rute: '/masuk' },
  { nama: 'web-layanan', rute: '/layanan' },
  { nama: 'web-profil', rute: '/profil' },
  { nama: 'web-kependudukan', rute: '/kependudukan' },
  { nama: 'web-pengaduan', rute: '/pengaduan' },
  { nama: 'web-keuangan', rute: '/keuangan' },
  { nama: 'web-umkm', rute: '/umkm' },
  { nama: 'web-admin', rute: '/admin' },
  { nama: 'web-warga', rute: '/warga' },
];

/** Halaman yang juga diambil dalam ukuran ponsel — mayoritas warga membuka dari HP. */
const VERSI_HP = ['/'];

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

mkdirSync(DIR_SS, { recursive: true });

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  args: ['--no-sandbox', '--font-render-hinting=none'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

for (const { nama, rute } of HALAMAN) {
  await page.goto(`${BASIS}${rute}`, { waitUntil: 'networkidle0', timeout: 30_000 });
  await new Promise((r) => setTimeout(r, 400));
  const tujuan = resolve(DIR_SS, `${nama}.png`);
  await page.screenshot({ path: tujuan, fullPage: true });
  console.log(`  ${rute.padEnd(16)} -> ${nama}.png`);
}

// Ukuran ponsel
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
for (const rute of VERSI_HP) {
  await page.goto(`${BASIS}${rute}`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  const nama = rute === '/' ? 'web-beranda-hp' : `web${rute.replace(/\//g, '-')}-hp`;
  await page.screenshot({ path: resolve(DIR_SS, `${nama}.png`), fullPage: true });
  console.log(`  ${rute.padEnd(16)} -> ${nama}.png (HP)`);
}

await browser.close();
console.log('Selesai.');
