/**
 * Membangkitkan docs/STORYBOARD.md dari registry section.
 *
 * Storyboard dan kode berbagi satu sumber data (packages/shared/src/constants/sections.ts),
 * jadi dokumen ini tidak pernah basi terhadap rute yang benar-benar ada di aplikasi.
 *
 * Jalankan: npm run storyboard
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// Diimpor langsung dari file registry (bukan lewat index) agar skrip ini bisa
// dijalankan tanpa perlu `npm install` di workspace shared — sections.ts murni data.
import {
  DASHBOARD_PERANGKAT,
  DASHBOARD_WARGA,
  SECTIONS,
  SECTIONS_DIBATALKAN,
  type Section,
} from '../packages/shared/src/constants/sections.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = resolve(__dirname, '../docs/STORYBOARD.md');

const LABEL_FASE: Record<number, string> = {
  1: 'Fase 1 — Inti (pelayanan & data)',
  2: 'Fase 2 — Transparansi',
  3: 'Fase 3 — Ekonomi desa',
  4: 'Fase 4 — Pelengkap',
};

function idLayar(section: Section, sub?: string): string {
  const dasar = `S${String(section.no).padStart(2, '0')}`;
  return sub ? `${dasar}-${sub}` : dasar;
}

function kartuLayar(section: Section): string {
  const subHalaman = section.items.filter((i) => i.path);
  const blok = section.items.filter((i) => !i.path);

  const baris: string[] = [
    `### ${idLayar(section)} · ${section.title}`,
    '',
    `| | |`,
    `|---|---|`,
    `| **Rute** | \`${section.route}\` |`,
    `| **Akses** | ${section.access} |`,
    `| **Fase** | ${section.phase} |`,
    `| **Tujuan** | ${section.summary} |`,
    '',
  ];

  if (blok.length) {
    baris.push('**Blok pada halaman ini**', '');
    for (const item of blok) {
      baris.push(`- ${item.label}${item.note ? ` — _${item.note}_` : ''}`);
    }
    baris.push('');
  }

  if (subHalaman.length) {
    baris.push('**Layar turunan**', '', '| ID | Layar | Rute |', '|---|---|---|');
    subHalaman.forEach((item, i) => {
      const rute = `${section.route}${item.path}`.replace('//', '/');
      baris.push(`| ${idLayar(section, String(i + 1))} | ${item.label} | \`${rute}\` |`);
    });
    baris.push('');
  }

  if (section.note) baris.push(`> **Catatan:** ${section.note}`, '');

  return baris.join('\n');
}

function petaSitus(): string {
  const baris = ['```mermaid', 'graph LR', '  BERANDA["S01 Beranda"]'];

  for (const fase of [1, 2, 3, 4]) {
    const anggota = SECTIONS.filter((s) => s.phase === fase && s.route !== '/');
    if (!anggota.length) continue;
    baris.push(`  subgraph F${fase}["Fase ${fase}"]`);
    for (const s of anggota) baris.push(`    ${s.id.replace(/-/g, '_')}["${idLayar(s)} ${s.title}"]`);
    baris.push('  end');
  }

  for (const s of SECTIONS.filter((x) => x.route !== '/')) {
    baris.push(`  BERANDA --> ${s.id.replace(/-/g, '_')}`);
  }

  baris.push('  BERANDA --> MASUK["Masuk / Aktivasi"]');
  baris.push('  MASUK --> DW["Dashboard Warga"]');
  baris.push('  MASUK --> DP["Dashboard Perangkat"]');
  baris.push('```');
  return baris.join('\n');
}

function tabelInventaris(): string {
  const baris = [
    '| ID | Layar | Rute | Akses | Fase |',
    '|---|---|---|---|---|',
    ...SECTIONS.map(
      (s) => `| ${idLayar(s)} | ${s.title} | \`${s.route}\` | ${s.access} | ${s.phase} |`,
    ),
    `| D-P | ${DASHBOARD_PERANGKAT.title} | \`${DASHBOARD_PERANGKAT.route}\` | perangkat | ${DASHBOARD_PERANGKAT.phase} |`,
    `| D-W | ${DASHBOARD_WARGA.title} | \`${DASHBOARD_WARGA.route}\` | warga | ${DASHBOARD_WARGA.phase} |`,
  ];
  return baris.join('\n');
}

function kartuDashboard(dash: typeof DASHBOARD_PERANGKAT): string {
  return [
    `### ${dash.title}`,
    '',
    `| | |`,
    `|---|---|`,
    `| **Rute** | \`${dash.route}\` |`,
    `| **Akses** | ${dash.access} |`,
    `| **Tujuan** | ${dash.summary} |`,
    '',
    '| Menu | Rute |',
    '|---|---|',
    ...dash.items.map((i) => `| ${i.label} | \`${dash.route}${i.path ?? ''}\` |`),
    '',
  ].join('\n');
}

const jumlahLayar =
  SECTIONS.length +
  SECTIONS.reduce((n, s) => n + s.items.filter((i) => i.path).length, 0) +
  DASHBOARD_PERANGKAT.items.length +
  DASHBOARD_WARGA.items.length +
  2;

const isi = `<!-- DIBANGKITKAN OTOMATIS oleh scripts/generate-storyboard.ts — jangan diedit manual. -->
# Storyboard — Website Desa Bintang Ninggi I

Dibangkitkan dari \`packages/shared/src/constants/sections.ts\` pada ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}.

- **${SECTIONS.length} section publik**, ${jumlahLayar} layar termasuk turunan dan dashboard
- Alur pengguna langkah demi langkah: lihat [alur-pengguna.md](./alur-pengguna.md)

## 1. Peta Situs

${petaSitus()}

## 2. Inventaris Layar

${tabelInventaris()}

## 3. Rincian Layar per Fase

${[1, 2, 3, 4]
  .map((fase) => {
    const anggota = SECTIONS.filter((s) => s.phase === fase);
    if (!anggota.length) return '';
    return `## ${LABEL_FASE[fase]}\n\n${anggota.map(kartuLayar).join('\n')}`;
  })
  .filter(Boolean)
  .join('\n')}

## 4. Dashboard

${kartuDashboard(DASHBOARD_PERANGKAT)}
${kartuDashboard(DASHBOARD_WARGA)}

## 5. Section yang Dibatalkan

Dua section pada dokumen tulisan tangan dicoret dan **tidak dibuat**:

${SECTIONS_DIBATALKAN.map((s) => `- **No. ${s.docNo} ${s.title}** — ${s.alasan}`).join('\n')}
`;

mkdirSync(dirname(OUTPUT), { recursive: true });
writeFileSync(OUTPUT, isi, 'utf8');
console.log(`Storyboard ditulis ke ${OUTPUT} (${jumlahLayar} layar).`);
