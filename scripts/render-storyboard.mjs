/**
 * Merender docs/visual/storyboard.html menjadi:
 *   - docs/screenshots/*.png  — satu berkas per diagram alur
 *   - docs/Storyboard-Desa-Bintang-Ninggi-I.pdf
 *
 * Memakai Chrome/Edge yang sudah terpasang di mesin (lewat puppeteer-core),
 * jadi tidak perlu mengunduh Chromium terpisah.
 *
 * Jalankan: node scripts/render-storyboard.mjs
 */
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SUMBER = resolve(ROOT, 'docs/visual/storyboard.html');
const DIR_SS = resolve(ROOT, 'docs/screenshots');
const PDF = resolve(ROOT, 'docs/Storyboard-Desa-Bintang-Ninggi-I.pdf');

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
  console.error('Chrome/Edge tidak ditemukan. Pasang salah satunya lalu jalankan ulang.');
  process.exit(1);
}

mkdirSync(DIR_SS, { recursive: true });

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  args: ['--no-sandbox', '--allow-file-access-from-files', '--font-render-hinting=none'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(SUMBER).href, { waitUntil: 'networkidle0' });

// Mermaid merender secara asinkron — tunggu sampai setiap blok berubah jadi SVG.
await page.waitForFunction(
  () => {
    const blok = document.querySelectorAll('pre.mermaid');
    return blok.length > 0 && [...blok].every((b) => b.querySelector('svg'));
  },
  { timeout: 60_000 },
);
await new Promise((r) => setTimeout(r, 1200));

const diagram = await page.$$eval('.diagram', (els) => els.map((el) => el.id));
console.log(`Merender ${diagram.length} diagram...`);

for (const id of diagram) {
  const el = await page.$(`#${id}`);
  if (!el) continue;
  const tujuan = resolve(DIR_SS, `${id.replace(/^diagram-/, '')}.png`);
  await el.screenshot({ path: tujuan });
  console.log(`  PNG  ${tujuan}`);
}

await page.pdf({
  path: PDF,
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="width:100%;font-size:8pt;color:#9ca3af;padding:0 14mm;display:flex;justify-content:space-between">' +
    '<span>Storyboard — Website Desa Bintang Ninggi I</span>' +
    '<span class="pageNumber"></span>' +
    '</div>',
  margin: { top: '14mm', bottom: '16mm', left: '0mm', right: '0mm' },
});
console.log(`  PDF  ${PDF}`);

await browser.close();
console.log('Selesai.');
