import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, extname, join } from 'node:path';
import sharp from 'sharp';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/error.js';

/**
 * Penyimpanan berkas unggahan.
 *
 * Berkas ditulis ke disk dengan nama acak, bukan nama asli dari pengunggah.
 * Nama asli tetap disimpan di database untuk ditampilkan dan dipakai saat
 * diunduh, tapi tidak pernah menyentuh sistem berkas — nama seperti
 * "../../.env" atau "foto.php" tidak bisa berbuat apa-apa bila tak dipakai.
 */

const GAMBAR = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const DOKUMEN = ['application/pdf'];

export const MIME_DIIZINKAN = [...GAMBAR, ...DOKUMEN];

/** Lebar maksimum gambar setelah dikecilkan. */
const LEBAR_MAKS = 1600;

export interface BerkasTersimpan {
  id: string;
  nama: string;
  url: string;
  ukuranByte: number;
}

export async function simpanBerkas(
  file: Express.Multer.File,
  opsi: { kategori: string; olehUserId?: string },
): Promise<BerkasTersimpan> {
  if (!MIME_DIIZINKAN.includes(file.mimetype)) {
    throw new AppError(
      400,
      'TIPE_TIDAK_DIIZINKAN',
      'Hanya gambar (JPG, PNG, WEBP, HEIC) dan PDF yang bisa diunggah',
    );
  }

  const sekarang = new Date();
  const folder = join(
    opsi.kategori,
    `${sekarang.getFullYear()}-${String(sekarang.getMonth() + 1).padStart(2, '0')}`,
  );

  let isi = file.buffer;
  let mime = file.mimetype;
  let ekstensi = extname(file.originalname).toLowerCase() || '.bin';

  if (GAMBAR.includes(file.mimetype)) {
    // Foto dari ponsel biasanya 3–8 MB dan 4000px lebih. Dikecilkan supaya
    // hemat ruang server dan cepat dibuka warga yang sinyalnya terbatas.
    // Sekaligus membuang metadata EXIF, yang pada foto ponsel sering memuat
    // titik koordinat rumah pengunggah.
    isi = await sharp(file.buffer)
      .rotate() // hormati orientasi EXIF sebelum metadata dibuang
      .resize({ width: LEBAR_MAKS, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    mime = 'image/jpeg';
    ekstensi = '.jpg';
  }

  const namaBerkas = `${randomUUID()}${ekstensi}`;
  const relatif = join(folder, namaBerkas);
  const absolut = join(env.UPLOAD_DIR, relatif);

  await mkdir(dirname(absolut), { recursive: true });
  await writeFile(absolut, isi);

  const berkas = await prisma.berkas.create({
    data: {
      namaAsli: file.originalname.slice(0, 255),
      path: relatif.replace(/\\/g, '/'),
      mimeType: mime,
      ukuranByte: isi.length,
      diunggahOleh: opsi.olehUserId ?? null,
    },
  });

  return {
    id: berkas.id,
    nama: berkas.namaAsli,
    url: `/uploads/${berkas.path}`,
    ukuranByte: berkas.ukuranByte,
  };
}

/**
 * Membuang berkas yang terunggah tapi tidak pernah dipakai.
 *
 * Pengunggahan terjadi lebih dulu daripada penyimpanan formulir, jadi setiap
 * formulir yang ditinggalkan di tengah jalan meninggalkan berkas yatim. Tanpa
 * pembersihan, disk server pelan-pelan penuh oleh foto yang tak pernah terkirim.
 */
export async function bersihkanBerkasYatim(umurJam = 24): Promise<number> {
  const batas = new Date(Date.now() - umurJam * 3_600_000);

  const yatim = await prisma.berkas.findMany({
    where: {
      dibuatPada: { lt: batas },
      dokumen: { none: {} },
      lampiranSurat: { none: {} },
      fotoPengaduan: { none: {} },
      fotoProgres: { none: {} },
      mediaGaleri: { none: {} },
      logoUmkm: { none: {} },
      qrisUmkm: { none: {} },
      fotoProduk: { none: {} },
      buktiBayar: { none: {} },
    },
    select: { id: true, path: true },
  });

  for (const b of yatim) {
    try {
      await unlink(join(env.UPLOAD_DIR, b.path));
    } catch {
      // Berkas mungkin sudah hilang duluan; barisnya tetap dihapus.
    }
  }

  if (yatim.length) {
    await prisma.berkas.deleteMany({ where: { id: { in: yatim.map((b) => b.id) } } });
  }

  return yatim.length;
}
