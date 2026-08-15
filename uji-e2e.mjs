/**
 * Uji ujung ke ujung terhadap situs produksi, memakai Chrome sungguhan.
 *
 *   node uji-e2e.mjs <langkah> [argumen...]
 *
 * Sesi disimpan di berkas profil Chrome supaya langkah-langkah bisa
 * dijalankan terpisah tanpa login ulang tiap kali.
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const B = 'https://desa-bintang-ninggi.webdevpky.site';
const PROFIL = process.env.PROFIL_DIR;
const SS = process.env.SS_DIR;
mkdirSync(SS, { recursive: true });

export async function buka() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    userDataDir: PROFIL,
    args: ['--no-sandbox', '--window-size=1440,900'],
  });
  const page = (await browser.pages())[0] ?? (await browser.newPage());
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  page.on('pageerror', (e) => console.log('  [pageerror] ' + String(e).slice(0, 140)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('401')) {
      console.log('  [console] ' + m.text().slice(0, 140));
    }
  });

  return { browser, page };
}

export const potret = (page, nama) => page.screenshot({ path: `${SS}/${nama}.png`, fullPage: true });

export async function ketik(page, selector, nilai) {
  await page.waitForSelector(selector, { timeout: 15000 });
  await page.click(selector, { clickCount: 3 });
  await page.type(selector, nilai, { delay: 12 });
}

export async function klikTeks(page, teks, tag = 'button, a') {
  const el = await page.evaluateHandle(
    (t, sel) => [...document.querySelectorAll(sel)].find((e) => e.textContent?.trim().includes(t)),
    teks,
    tag,
  );
  const node = el.asElement();
  if (!node) throw new Error(`Tidak menemukan "${teks}"`);
  await node.click();
  return node;
}

export const teksHalaman = (page) => page.evaluate(() => document.body.innerText);
export { B };
