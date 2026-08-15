/**
 * Seed data awal: profil desa, template surat, dan akun admin pertama.
 * Jalankan: npm run db:seed --workspace=@desa/api
 */
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { JENIS_SURAT } from '@desa/shared';
import { TEMPLATE_AWAL } from './template-surat.js';

const prisma = new PrismaClient();

async function main() {
  await prisma.profilDesa.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      namaDesa: 'Bintang Ninggi I',
      kecamatan: 'Teweh Selatan',
      kabupaten: 'Barito Utara',
      provinsi: 'Kalimantan Tengah',
      // Kode pos menurut Wikipedia dan kodepos.id. Tebakan awal 73881 keliru.
      kodePos: '73814',
      // Sengaja dibiarkan kosong, bukan diisi teks "TODO". Nilai bawaan yang
      // berisi teks akan langsung tampil di halaman depan yang dibuka warga;
      // dibiarkan null, tampilannya justru mengajak perangkat desa mengisinya.
      jamPelayanan: {
        senin_kamis: '08.00 - 15.00 WIB',
        jumat: '08.00 - 11.00 WIB',
        sabtu_minggu: 'Tutup',
      },
      nomorDarurat: {
        kantor_desa: '-',
        bidan_desa: '-',
        babinsa: '-',
        bhabinkamtibmas: '-',
        damkar: '113',
        ambulans: '119',
      },
    },
  });

  // Pengaturan yang boleh diubah perangkat desa kapan saja lewat dashboard.
  // Nilai di sini hanya bawaan awal, bukan aturan yang dikunci di kode.
  const pengaturanAwal: Array<[string, unknown, string]> = [
    [
      'format_nomor_surat',
      '470/{{urut}}/BN-I/{{bulanRomawi}}/{{tahun}}',
      'Format nomor surat global. Placeholder: {{urut}}, {{tahun}}, {{bulan}}, {{bulanRomawi}}, {{kodeSurat}}',
    ],
    ['reset_nomor_tiap_tahun', true, 'Nomor urut surat kembali ke 1 setiap ganti tahun'],
    ['nomor_urut_per_jenis', false, 'false = satu rangkaian nomor untuk semua jenis surat'],
    ['batas_unggah_bukti_bayar_jam', 24, 'Pesanan UMKM hangus bila bukti bayar tidak diunggah dalam batas ini'],
    ['masa_berlaku_kode_aktivasi_hari', 7, 'Masa berlaku kode aktivasi akun warga'],
  ];

  for (const [kunci, nilai, keterangan] of pengaturanAwal) {
    await prisma.pengaturan.upsert({
      where: { kunci },
      update: {},
      create: { kunci, nilai: nilai as object, keterangan },
    });
  }

  for (const [i, jenis] of JENIS_SURAT.entries()) {
    await prisma.templateSurat.upsert({
      where: { kode: jenis.kode },
      update: { nama: jenis.nama },
      create: {
        kode: jenis.kode,
        nama: jenis.nama,
        isiTemplate: TEMPLATE_AWAL[jenis.kode] ?? TEMPLATE_AWAL.LAINNYA,
        // Dikosongkan agar mengikuti format global di tabel `pengaturan`.
        formatNomor: null,
        fieldTambahan: jenis.fieldTambahan,
        lampiranWajib: jenis.lampiran,
        urutan: i,
      },
    });
  }

  const passwordAwal = process.env.ADMIN_PASSWORD_AWAL ?? 'ubah-password-ini-8x';
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      peran: 'ADMIN',
      status: 'AKTIF',
      kredensialHash: await argon2.hash(passwordAwal),
    },
  });

  console.log('Seed selesai. Login admin: admin /', passwordAwal);
  console.log('Ganti password admin segera setelah login pertama.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
