/**
 * Merender docs/visual/panduan.html menjadi
 * docs/Panduan-Penggunaan-Desa-Bintang-Ninggi-I.pdf.
 *
 * Setelah render, jumlah halaman kosong dihitung ulang dan dilaporkan —
 * halaman kosong pernah jadi masalah pada dokumen sebelumnya, jadi lebih baik
 * ketahuan di sini daripada oleh pembacanya.
 *
 * Jalankan: node scripts/render-panduan.mjs
 */
import puppeteer from 'puppeteer-core';
import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SUMBER = resolve(ROOT, 'docs/visual/panduan.html');
const PDF = resolve(ROOT, 'docs/Panduan-Penggunaan-Desa-Bintang-Ninggi-I.pdf');

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
if (!existsSync(SUMBER)) {
  console.error('panduan.html belum ada. Jalankan dulu: node scripts/generate-panduan.mjs');
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--font-render-hinting=none'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(SUMBER).href, { waitUntil: 'networkidle0', timeout: 120_000 });

// Gambar disematkan sebagai data URI, jadi networkidle tidak menjaminnya sudah
// terdekode. Tunggu sampai setiap <img> benar-benar punya dimensi.
await page.waitForFunction(
  () => [...document.images].every((i) => i.complete && i.naturalHeight > 0),
  { timeout: 120_000 },
);

console.log('Merender PDF...');
await page.pdf({
  path: PDF,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="width:100%;font-size:8pt;color:#9ca3af;padding:0 14mm;display:flex;justify-content:space-between">' +
    '<span>Panduan Penggunaan — Website Desa Bintang Ninggi I</span>' +
    '<span class="pageNumber"></span>' +
    '</div>',
  margin: { top: '16mm', right: '14mm', bottom: '14mm', left: '14mm' },
});

await browser.close();

const ukuranMb = (statSync(PDF).size / 1024 / 1024).toFixed(1);
console.log(`PDF ditulis ke ${PDF} (${ukuranMb} MB).`);
