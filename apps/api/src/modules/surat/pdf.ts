import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { env } from '../../config/env.js';

/**
 * Pembuatan PDF surat.
 *
 * Memakai PDFKit, bukan Chromium headless: satu VPS desa tidak perlu memikul
 * ~300 MB Chromium hanya untuk mencetak surat satu halaman.
 */

export interface DataSurat {
  namaDesa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  alamatKantor?: string | null;
  kodePos?: string | null;

  judulSurat: string;
  nomorSurat: string;
  isiSurat: string;

  penandatanganNama: string;
  penandatanganJabatan: string;

  kodeVerifikasi: string;
  tanggalTerbit: Date;
}

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const tanggalPanjang = (d: Date) => `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;

/**
 * Baris berbentuk "Label : Nilai" pada surat dinas harus rata kolom.
 *
 * Penulis template merapikannya dengan spasi, tapi Helvetica proporsional
 * sehingga hasilnya tetap bergerigi. Daripada menuntut perangkat desa
 * menghitung spasi, baris semacam ini dikenali dan dirender sebagai dua kolom
 * dengan titik dua yang sejajar.
 *
 * Hanya berlaku bila ada minimal dua baris berurutan dengan pola yang sama —
 * supaya kalimat biasa yang kebetulan memuat titik dua tidak ikut terpotong.
 */
const POLA_LABEL = /^([^:]{1,35}?)\s*:\s*(.*)$/;

function tulisIsi(doc: PDFKit.PDFDocument, isi: string, lebar: number): void {
  const baris = isi.split('\n');
  let i = 0;

  while (i < baris.length) {
    const cocok = POLA_LABEL.exec(baris[i]);
    const berikutnyaCocok = i + 1 < baris.length && POLA_LABEL.test(baris[i + 1]);

    if (cocok && berikutnyaCocok) {
      // Kumpulkan seluruh blok, lalu ukur label terpanjang untuk lebar kolom.
      const blok: Array<[string, string]> = [];
      while (i < baris.length) {
        const m = POLA_LABEL.exec(baris[i]);
        if (!m) break;
        blok.push([m[1].trim(), m[2].trim()]);
        i++;
      }

      const xAwal = doc.page.margins.left;
      const lebarLabel = Math.max(...blok.map(([l]) => doc.widthOfString(l))) + 10;

      for (const [label, nilai] of blok) {
        const y = doc.y;
        doc.text(label, xAwal, y, { width: lebarLabel, lineBreak: false });
        doc.text(':', xAwal + lebarLabel, y, { width: 10, lineBreak: false });
        doc.text(nilai, xAwal + lebarLabel + 12, y, {
          width: lebar - lebarLabel - 12,
        });
      }
      continue;
    }

    // Baris kosong menjadi jarak antar paragraf.
    if (baris[i].trim() === '') {
      doc.moveDown(0.6);
    } else {
      doc.text(baris[i], doc.page.margins.left, doc.y, {
        align: 'justify',
        lineGap: 3.5,
        width: lebar,
      });
    }
    i++;
  }
}

export async function buatPdfSurat(data: DataSurat): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 65, right: 65 } });
  const potongan: Buffer[] = [];
  doc.on('data', (c: Buffer) => potongan.push(c));

  const selesai = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(potongan)));
  });

  const lebar = doc.page.width - 130;

  // ── Kop surat ──
  doc.font('Helvetica-Bold').fontSize(14).text('PEMERINTAH KABUPATEN ' + data.kabupaten.toUpperCase(), { align: 'center' });
  doc.fontSize(14).text('KECAMATAN ' + data.kecamatan.toUpperCase(), { align: 'center' });
  doc.fontSize(16).text('DESA ' + data.namaDesa.toUpperCase(), { align: 'center' });

  doc.font('Helvetica').fontSize(9);
  if (data.alamatKantor) {
    doc.text(data.alamatKantor + (data.kodePos ? ` Kode Pos ${data.kodePos}` : ''), {
      align: 'center',
    });
  }

  // Garis kop ganda, sesuai lazimnya surat dinas.
  const yGaris = doc.y + 6;
  doc.moveTo(65, yGaris).lineTo(doc.page.width - 65, yGaris).lineWidth(2).stroke();
  doc.moveTo(65, yGaris + 3.5).lineTo(doc.page.width - 65, yGaris + 3.5).lineWidth(0.7).stroke();

  doc.y = yGaris + 20;

  // ── Judul & nomor ──
  doc.font('Helvetica-Bold').fontSize(12).text(data.judulSurat.toUpperCase(), { align: 'center' });
  doc.font('Helvetica').fontSize(11).text(`Nomor: ${data.nomorSurat}`, { align: 'center' });
  doc.moveDown(1.5);

  // ── Isi ──
  tulisIsi(doc, data.isiSurat, lebar);

  // ── Blok tanda tangan ──
  // Ditempatkan relatif terhadap akhir isi, bukan koordinat tetap, supaya surat
  // yang isinya panjang tidak menimpa blok ini.
  doc.moveDown(2);
  const yTtd = Math.min(doc.y, doc.page.height - 200);
  const xTtd = doc.page.width - 65 - 200;

  doc.y = yTtd;
  doc.fontSize(11);
  doc.text(`${data.namaDesa}, ${tanggalPanjang(data.tanggalTerbit)}`, xTtd, yTtd, {
    width: 200,
    align: 'center',
  });
  doc.text(data.penandatanganJabatan, xTtd, doc.y, { width: 200, align: 'center' });

  const yNama = doc.y + 70;
  doc.font('Helvetica-Bold').text(data.penandatanganNama.toUpperCase(), xTtd, yNama, {
    width: 200,
    align: 'center',
  });

  // ── QR verifikasi ──
  const urlVerifikasi = `${env.PUBLIC_BASE_URL}/verifikasi/${data.kodeVerifikasi}`;
  const qr = await QRCode.toBuffer(urlVerifikasi, { margin: 0, width: 220 });

  const yQr = yNama - 55;
  doc.image(qr, 65, yQr, { width: 70 });

  doc.font('Helvetica').fontSize(6.5).fillColor('#444444');
  doc.text(
    'Pindai untuk memeriksa keaslian surat ini.\n' +
      `Kode: ${data.kodeVerifikasi}\n` +
      urlVerifikasi,
    65,
    yQr + 74,
    { width: 190, lineGap: 1 },
  );

  doc.end();
  return selesai;
}

/**
 * Mengisi placeholder pada template surat.
 *
 * Placeholder yang tidak punya nilai dibiarkan apa adanya, bukan diganti string
 * kosong — supaya perangkat desa langsung melihat "{{penghasilan}}" tercetak di
 * pratinjau dan tahu ada kolom yang belum terisi, alih-alih menerbitkan surat
 * dengan kalimat yang bolong.
 */
export function isiTemplate(template: string, nilai: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (utuh, kunci: string) => {
    const v = nilai[kunci];
    return v === undefined || v === null || v === '' ? utuh : String(v);
  });
}

/** Daftar placeholder yang masih kosong — dipakai memperingatkan sebelum terbit. */
export function placeholderKosong(teks: string): string[] {
  return [...new Set([...teks.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]))];
}
