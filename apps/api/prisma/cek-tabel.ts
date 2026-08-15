/**
 * Memeriksa tabel mana yang sudah ada di basis data.
 *
 *   npm run db:cek --workspace=@desa/api
 *
 * Memakai koneksi dari .env lewat Prisma, jadi kata sandi MySQL tidak perlu
 * diketik ulang maupun tampil di riwayat perintah.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Tabel yang dibawa migrasi Fase 3/4 — yang sempat gagal di tengah jalan. */
const DIPERIKSA = ['informasi_sektor', 'fasilitas', 'harga_komoditas', 'lowongan'];

async function main() {
  const baris = await prisma.$queryRawUnsafe<Array<{ nama: string }>>(
    `SELECT table_name AS nama
       FROM information_schema.tables
      WHERE table_schema = DATABASE()`,
  );
  const ada = new Set(baris.map((b) => b.nama));

  console.log(`Total tabel di basis data: ${ada.size}\n`);
  console.log('Tabel migrasi Fase 3/4:');

  let lengkap = true;
  for (const t of DIPERIKSA) {
    const punya = ada.has(t);
    if (!punya) lengkap = false;
    console.log(`  ${punya ? 'ADA   ' : 'HILANG'}  ${t}`);
  }

  const migrasi = await prisma.$queryRawUnsafe<
    Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>
  >(
    `SELECT migration_name, finished_at, rolled_back_at
       FROM _prisma_migrations
      ORDER BY started_at`,
  );

  console.log('\nCatatan migrasi:');
  for (const m of migrasi) {
    const status = m.rolled_back_at ? 'DIBATALKAN' : m.finished_at ? 'selesai' : 'GAGAL';
    console.log(`  ${status.padEnd(11)} ${m.migration_name}`);
  }

  console.log('');
  if (lengkap) {
    console.log('Keempat tabel sudah ada. Bila catatan migrasinya masih GAGAL,');
    console.log('tandai selesai dengan:');
    console.log('  npx prisma migrate resolve --applied 20260815120000_fase3_fase4');
  } else {
    console.log('Ada tabel yang belum terbentuk. JANGAN tandai sebagai selesai.');
    console.log('Kirim keluaran ini supaya jalur pemulihannya bisa ditentukan.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
