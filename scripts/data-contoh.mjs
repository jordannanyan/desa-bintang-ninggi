/**
 * Server data contoh untuk menyusun Panduan Penggunaan.
 *
 * Panduan butuh tangkapan layar yang berisi, bukan halaman kosong bertuliskan
 * "Belum ada data" — pembaca tidak bisa mengenali tombol yang dimaksud kalau
 * tabelnya kosong. Server ini menjawab seluruh endpoint yang dibaca frontend
 * dengan data karangan, sehingga panduan bisa dibuat ulang kapan pun tanpa
 * perlu menyalin data warga sungguhan ke berkas dokumentasi.
 *
 * SELURUH ISINYA FIKTIF. Nama, NIK, dan angka di sini tidak merujuk pada orang
 * atau catatan mana pun. Server ini tidak pernah dipakai di produksi.
 *
 * Jalankan: node scripts/data-contoh.mjs      (mendengarkan di :4000)
 */
import { createServer } from 'node:http';

const PORT = Number(process.env.PORT ?? 4000);

const hariLalu = (n) => new Date(Date.now() - n * 86_400_000).toISOString();
const hariDepan = (n) => new Date(Date.now() + n * 86_400_000).toISOString();

const NAMA = [
  'Ahmad Sulaiman',
  'Siti Aminah',
  'Budi Santoso',
  'Ngatinem',
  'Hendra Wijaya',
  'Rusmiati',
  'Joko Prasetyo',
  'Lastri Handayani',
  'Marwan Hakim',
  'Yuliana Sari',
];

const penduduk = NAMA.map((nama, i) => ({
  id: `pd-${i + 1}`,
  nik: `6205${String(1000000000 + i * 137).slice(0, 12)}`,
  nama,
  jenisKelamin: i % 2 === 0 ? 'LAKI_LAKI' : 'PEREMPUAN',
  usia: 24 + ((i * 7) % 45),
  pekerjaan: ['Petani', 'Ibu Rumah Tangga', 'Wiraswasta', 'Buruh Harian Lepas', 'Pelajar'][i % 5],
  hubunganKeluarga: i % 3 === 0 ? 'Kepala Keluarga' : i % 3 === 1 ? 'Istri' : 'Anak',
  alamat: `Jl. Sungai Rahayu No. ${10 + i}`,
  rt: String(1 + (i % 3)).padStart(3, '0'),
  rw: String(1 + (i % 2)).padStart(3, '0'),
  status: 'AKTIF',
}));

const JENIS_SURAT = [
  ['DOMISILI', 'Surat Keterangan Domisili'],
  ['USAHA', 'Surat Keterangan Usaha'],
  ['TIDAK_MAMPU', 'Surat Keterangan Tidak Mampu'],
  ['KELAHIRAN', 'Surat Keterangan Kelahiran'],
  ['KEMATIAN', 'Surat Keterangan Kematian'],
  ['PINDAH', 'Surat Keterangan Pindah'],
  ['NIKAH', 'Surat Pengantar Nikah'],
  ['KEHILANGAN', 'Surat Keterangan Kehilangan'],
  ['AHLI_WARIS', 'Surat Keterangan Ahli Waris'],
  ['BELUM_MENIKAH', 'Surat Keterangan Belum Menikah'],
  ['PENGHASILAN', 'Surat Keterangan Penghasilan'],
  ['SKCK', 'Surat Pengantar SKCK'],
  ['KERAMAIAN', 'Surat Izin Keramaian'],
];

const pengajuan = [
  ['DIPROSES', 'Surat Keterangan Usaha', 'Ahmad Sulaiman', 'Syarat pengajuan kredit usaha mikro', 4],
  ['DIPROSES', 'Surat Keterangan Domisili', 'Siti Aminah', 'Pendaftaran sekolah anak', 2],
  ['DIPROSES', 'Surat Keterangan Tidak Mampu', 'Ngatinem', 'Permohonan keringanan biaya rumah sakit', 1],
  ['SIAP_DIAMBIL', 'Surat Pengantar SKCK', 'Budi Santoso', 'Melamar pekerjaan', 9],
  ['SIAP_DIAMBIL', 'Surat Keterangan Ahli Waris', 'Hendra Wijaya', 'Pengurusan balik nama sertifikat', 14],
  ['DITOLAK', 'Surat Izin Keramaian', 'Joko Prasetyo', 'Hajatan pernikahan', 6],
].map(([status, jenis, pemohon, keperluan, hari], i) => ({
  id: `sr-${i + 1}`,
  kodeLacak: `BN1-2026-${String(114 + i).padStart(6, '0')}`,
  jenis,
  pemohon,
  keperluan,
  status,
  jumlahLampiran: (i % 3) + 1,
  nomorSurat: status === 'SIAP_DIAMBIL' ? `470/${String(20 + i).padStart(3, '0')}/BN-I/VIII/2026` : null,
  catatan: status === 'DITOLAK' ? 'Denah lokasi belum dilampirkan. Mohon unggah ulang.' : null,
  adaPdf: status === 'SIAP_DIAMBIL',
  dibuatPada: hariLalu(hari),
}));

const pengaduan = [
  ['BARU', 'JALAN_RUSAK', 'Jalan berlubang di depan SDN 2', 'Lubang selebar setengah meter, sudah dua kali ada pengendara jatuh.', 'RT 002 / RW 001', 1],
  ['DIVERIFIKASI', 'LAMPU_MATI', 'Lampu jalan mati di simpang balai desa', 'Sudah mati sejak dua minggu lalu, gelap total setelah magrib.', 'Simpang Balai Desa', 4],
  ['DITANGANI', 'SAMPAH', 'Tumpukan sampah di tepi sungai', 'Warga membuang sampah rumah tangga ke bantaran.', 'Bantaran Sungai Rahayu', 9],
  ['SELESAI', 'BANJIR', 'Saluran irigasi tersumbat', 'Air meluap ke pekarangan saat hujan deras.', 'RT 003 / RW 001', 21],
].map(([status, kategori, judul, deskripsi, lokasiTeks, hari], i) => ({
  id: `pg-${i + 1}`,
  kodeLacak: `ADU-2026-${String(31 + i).padStart(4, '0')}`,
  kategori,
  judul,
  deskripsi,
  lokasiTeks,
  status,
  pelapor: i === 0 ? 'Anonim' : NAMA[i + 2],
  jumlahFoto: (i % 2) + 1,
  jumlahTanggapan: status === 'BARU' ? 0 : i,
  dibuatPada: hariLalu(hari),
}));

const proyek = [
  ['Pengerasan Jalan Usaha Tani Tahap II', 'BERJALAN', 62, 285_000_000, 'Dana Desa'],
  ['Rehabilitasi Saluran Irigasi RT 003', 'BERJALAN', 35, 148_000_000, 'Dana Desa'],
  ['Pembangunan MCK Umum Dusun Hilir', 'SELESAI', 100, 96_500_000, 'Dana Bagi Hasil'],
  ['Pengadaan Lampu Jalan Tenaga Surya', 'PERENCANAAN', 0, 72_000_000, 'PADes'],
].map(([nama, status, persentase, nilai, sumberDana], i) => ({
  id: `pj-${i + 1}`,
  nama,
  deskripsi: null,
  lokasi: `RT 00${(i % 3) + 1} / RW 00${(i % 2) + 1}`,
  latitude: null,
  longitude: null,
  nilai,
  sumberDana,
  kontraktor: 'CV Karya Bersama',
  pengawas: 'Tim Pelaksana Kegiatan Desa',
  tanggalMulai: hariLalu(120 - i * 20),
  tanggalSelesai: status === 'SELESAI' ? hariLalu(20) : null,
  status,
  persentase,
  tahun: 2026,
  jumlahProgres: Math.ceil(persentase / 25),
}));

const dokumen = [
  ['PERDES', 'Peraturan Desa Nomor 3 Tahun 2026 tentang APBDes', '3/2026'],
  ['PERDES', 'Peraturan Desa Nomor 1 Tahun 2026 tentang RKPDes', '1/2026'],
  ['PERKADES', 'Peraturan Kepala Desa tentang Tata Tertib Pelayanan', '5/2026'],
  ['SK_KADES', 'SK Kepala Desa tentang Tim Pelaksana Kegiatan', '12/2026'],
  ['RPJMDES', 'RPJMDes 2025-2030', null],
  ['APBDES', 'APBDes Tahun Anggaran 2026', null],
  ['REALISASI_APBDES', 'Laporan Realisasi APBDes Semester I 2026', null],
  ['PPID_BERKALA', 'Daftar Informasi Publik Berkala 2026', null],
  ['FORMULIR', 'Formulir Permohonan Surat Keterangan', null],
].map(([jenis, judul, nomor], i) => ({
  id: `dk-${i + 1}`,
  jenis,
  judul,
  nomor,
  tahun: 2026,
  ringkasan: null,
  publik: true,
  jumlahUnduh: 12 + i * 7,
  adaBerkas: true,
  ukuranByte: 180_000 + i * 45_000,
}));

const umkm = [
  ['Keripik Singkong Bu Ratna', 'MAKANAN', 4.8, 24],
  ['Anyaman Rotan Bintang', 'KERAJINAN', 4.5, 11],
  ['Madu Hutan Rahayu', 'PERTANIAN', 4.9, 31],
  ['Ternak Ayam Kampung Pak Jono', 'PETERNAKAN', 4.2, 8],
].map(([nama, kategori, rataRating, jumlahUlasan], i) => ({
  id: `um-${i + 1}`,
  nama,
  kategori,
  deskripsi: 'Produk rumahan warga Desa Bintang Ninggi I.',
  alamat: `RT 00${(i % 3) + 1} / RW 001`,
  whatsapp: '08123456789',
  logoUrl: null,
  terverifikasi: i < 3,
  jumlahProduk: 3 + i,
  rataRating,
  jumlahUlasan,
}));

const tagihan = [
  ['PBB', 'PBB Tahun 2026', 'BELUM_BAYAR', 185_000, 'Ahmad Sulaiman'],
  ['PBB', 'PBB Tahun 2026', 'BELUM_BAYAR', 142_000, 'Siti Aminah'],
  ['IURAN_DESA', 'Iuran Keamanan Triwulan III', 'BELUM_BAYAR', 98_000, 'Budi Santoso'],
  ['PBB', 'PBB Tahun 2025', 'LUNAS', 178_000, 'Ahmad Sulaiman'],
  ['SEWA_ASET', 'Sewa Balai Desa 12 Juli 2026', 'LUNAS', 350_000, 'Hendra Wijaya'],
].map(([jenis, judul, status, jumlah, nama], i) => ({
  id: `tg-${i + 1}`,
  pendudukId: `pd-${i + 1}`,
  penduduk: nama,
  jenis,
  judul,
  tahun: judul.includes('2025') ? 2025 : 2026,
  periode: jenis === 'IURAN_DESA' ? 'Triwulan III' : null,
  jumlah,
  jatuhTempo: hariDepan(20 - i * 5),
  status,
  dibayarPada: status === 'LUNAS' ? hariLalu(30) : null,
  catatan: null,
}));

const perangkatDesa = [
  ['Sugianto', 'Kepala Desa', 'Memimpin penyelenggaraan pemerintahan desa.'],
  ['Rudi Hartono', 'Sekretaris Desa', 'Mengoordinasikan urusan ketatausahaan dan kearsipan.'],
  ['Warsini', 'Kaur Keuangan', 'Mengelola administrasi keuangan desa.'],
  ['Bambang Iriawan', 'Kaur Perencanaan', 'Menyusun RKPDes dan APBDes.'],
  ['Sri Wahyuni', 'Kasi Pelayanan', 'Melayani pengajuan surat dan administrasi warga.'],
  ['Darmawan', 'Kasi Pemerintahan', 'Menangani urusan kependudukan dan ketertiban.'],
].map(([nama, jabatan, uraianTugas], i) => ({
  id: `pr-${i + 1}`,
  nama,
  jabatan,
  uraianTugas,
  fotoUrl: null,
  urutan: i,
}));

const bulanTren = ['Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu'];

const DATA = {
  // ── Sesi ──
  'auth/refresh': { accessToken: 'contoh' },
  'auth/saya': { id: 'u-1', peran: 'ADMIN', nama: 'Rudi Hartono', username: 'sekdes' },

  // ── Publik ──
  beranda: {
    profil: {
      namaDesa: 'Bintang Ninggi I',
      kecamatan: 'Teweh Selatan',
      kabupaten: 'Barito Utara',
      sambutanKades:
        'Assalamualaikum warahmatullahi wabarakatuh.\n\nSelamat datang di laman resmi Desa Bintang Ninggi I. Laman ini kami hadirkan agar pelayanan lebih dekat dengan warga dan penggunaan anggaran desa dapat dilihat siapa saja, kapan saja.',
      videoProfilUrl: null,
      jamPelayanan: {
        senin_kamis: '08.00 – 15.00',
        jumat: '08.00 – 11.00',
        sabtu_minggu: 'Libur',
      },
      nomorDarurat: {
        kantor_desa: '0812-3456-7890',
        pustu: '0813-1111-2222',
        bpbd: '112',
      },
    },
    statistik: { totalPenduduk: 2417, totalKk: 684, totalUmkm: 19, totalRt: 12, luasWilayahKm: '18.40' },
    berita: [
      {
        slug: 'panen-raya',
        judul: 'Panen Raya Padi di Blok Sungai Rahayu Melampaui Target',
        ringkasan:
          'Kelompok Tani Sumber Makmur mencatat hasil 6,2 ton per hektar, naik dari 5,1 ton pada musim sebelumnya.',
        sampulUrl: null,
        terbitPada: hariLalu(5),
      },
      { slug: 'posyandu', judul: 'Jadwal Posyandu Balita Agustus 2026', ringkasan: null, sampulUrl: null, terbitPada: hariLalu(10) },
      { slug: 'jalan-usaha-tani', judul: 'Pengerasan Jalan Usaha Tani Tahap Dua Dimulai', ringkasan: null, sampulUrl: null, terbitPada: hariLalu(18) },
    ],
    pengumuman: [
      { id: 'pm-1', judul: 'Pendaftaran Bantuan Langsung Tunai Dana Desa dibuka', penting: true, mulai: hariLalu(3) },
      { id: 'pm-2', judul: 'Pemadaman listrik terjadwal Sabtu pekan ini', penting: false, mulai: hariLalu(1) },
    ],
    agenda: [
      { id: 'ag-1', judul: 'Musyawarah Desa Perubahan APBDes', kategori: 'MUSYAWARAH', mulai: hariDepan(5), lokasi: 'Balai Desa' },
      { id: 'ag-2', judul: 'Gotong royong pembersihan saluran irigasi', kategori: 'GOTONG_ROYONG', mulai: hariDepan(9), lokasi: 'RW 02' },
    ],
  },

  profil: {
    namaDesa: 'Bintang Ninggi I',
    kecamatan: 'Teweh Selatan',
    kabupaten: 'Barito Utara',
    provinsi: 'Kalimantan Tengah',
    kodePos: '73881',
    luasWilayahKm: '18.40',
    alamatKantor: 'Jl. Sungai Rahayu No. 1, Bintang Ninggi I',
    sejarah:
      'Desa Bintang Ninggi I terbentuk dari pemekaran wilayah pada tahun 1982. Nama "Bintang Ninggi" berasal dari bahasa setempat yang berarti bintang yang tinggi, merujuk pada bukit di sisi utara desa yang dahulu menjadi penanda arah bagi warga yang berlayar di Sungai Barito.',
    visi: 'Terwujudnya Desa Bintang Ninggi I yang mandiri, sejahtera, dan transparan dalam pelayanan.',
    misi: [
      'Meningkatkan kualitas pelayanan administrasi kepada warga.',
      'Mengelola keuangan desa secara terbuka dan dapat dipertanggungjawabkan.',
      'Mendorong tumbuhnya usaha mikro warga desa.',
      'Memperbaiki sarana jalan, irigasi, dan penerangan umum.',
    ],
    sambutanKades:
      'Assalamualaikum warahmatullahi wabarakatuh.\n\nSelamat datang di laman resmi Desa Bintang Ninggi I.',
    prestasi: [
      { judul: 'Juara I Lomba Desa Tingkat Kabupaten', tahun: 2025, keterangan: 'Kategori tata kelola pemerintahan desa' },
      { judul: 'Desa Sadar Hukum', tahun: 2024, keterangan: null },
    ],
    potensi: [
      { judul: 'Perkebunan karet rakyat', keterangan: 'Luas 120 ha, dikelola 80 kepala keluarga' },
      { judul: 'Kerajinan anyaman rotan', keterangan: 'Sentra di RT 002, 14 perajin aktif' },
      { judul: 'Perikanan keramba Sungai Barito', keterangan: '26 unit keramba' },
    ],
  },
  'profil/perangkat': perangkatDesa,
  'profil/lembaga': [
    {
      id: 'lb-1',
      jenis: 'BPD',
      nama: 'Badan Permusyawaratan Desa Bintang Ninggi I',
      deskripsi: 'Lembaga yang menampung dan menyalurkan aspirasi warga serta mengawasi kinerja pemerintah desa.',
      anggota: [
        { id: 'ab-1', nama: 'Suparman', jabatan: 'Ketua', fotoUrl: null },
        { id: 'ab-2', nama: 'Nurhayati', jabatan: 'Wakil Ketua', fotoUrl: null },
        { id: 'ab-3', nama: 'Sutrisno', jabatan: 'Sekretaris', fotoUrl: null },
      ],
    },
    {
      id: 'lb-2',
      jenis: 'PKK',
      nama: 'Tim Penggerak PKK Desa Bintang Ninggi I',
      deskripsi: 'Menggerakkan kegiatan pemberdayaan kesejahteraan keluarga.',
      anggota: [{ id: 'ab-4', nama: 'Endang Susilowati', jabatan: 'Ketua', fotoUrl: null }],
    },
    {
      id: 'lb-3',
      jenis: 'KARANG_TARUNA',
      nama: 'Karang Taruna Tunas Muda',
      deskripsi: 'Wadah kegiatan kepemudaan desa.',
      anggota: [{ id: 'ab-5', nama: 'Rio Andika', jabatan: 'Ketua', fotoUrl: null }],
    },
  ],
  wilayah: [
    {
      id: 'rw-1',
      nomor: '001',
      ketua: 'Suparno',
      rtList: [
        { id: 'rt-1', nomor: '001', ketua: 'Mulyadi' },
        { id: 'rt-2', nomor: '002', ketua: 'Sarmin' },
        { id: 'rt-3', nomor: '003', ketua: 'Haryanto' },
      ],
    },
    {
      id: 'rw-2',
      nomor: '002',
      ketua: 'Slamet Riyadi',
      rtList: [
        { id: 'rt-4', nomor: '001', ketua: 'Sugeng' },
        { id: 'rt-5', nomor: '002', ketua: 'Painem' },
      ],
    },
  ],

  'kependudukan/statistik': {
    totalPenduduk: 2417,
    totalKk: 684,
    lakiLaki: 1246,
    perempuan: 1171,
    balita: 187,
    lansia: 197,
    pendatang: 63,
    disabilitas: 21,
    kelahiranTahunIni: 34,
    kematianTahunIni: 12,
    pindahTahunIni: 19,
    perKelompokUsia: [
      { label: '0-4 tahun', jumlah: 187 },
      { label: '5-14 tahun', jumlah: 421 },
      { label: '15-24 tahun', jumlah: 398 },
      { label: '25-44 tahun', jumlah: 812 },
      { label: '45-59 tahun', jumlah: 402 },
      { label: '60 tahun ke atas', jumlah: 197 },
    ],
    perAgama: [
      { label: 'Islam', jumlah: 1834 },
      { label: 'Kristen', jumlah: 421 },
      { label: 'Katolik', jumlah: 118 },
      { label: 'Hindu', jumlah: 44 },
    ],
    perPendidikan: [
      { label: 'SLTA/Sederajat', jumlah: 742 },
      { label: 'SLTP/Sederajat', jumlah: 531 },
      { label: 'Tamat SD/Sederajat', jumlah: 498 },
      { label: 'Tidak/Belum Sekolah', jumlah: 312 },
      { label: 'Akademi/Diploma III/S. Muda', jumlah: 121 },
      { label: 'Diploma IV/Strata I', jumlah: 98 },
    ],
    perPekerjaan: [
      { label: 'Petani/Pekebun', jumlah: 611 },
      { label: 'Pelajar/Mahasiswa', jumlah: 402 },
      { label: 'Mengurus Rumah Tangga', jumlah: 356 },
      { label: 'Buruh Harian Lepas', jumlah: 288 },
      { label: 'Wiraswasta', jumlah: 174 },
      { label: 'Karyawan Swasta', jumlah: 121 },
      { label: 'Nelayan/Perikanan', jumlah: 88 },
      { label: 'Pegawai Negeri Sipil', jumlah: 41 },
    ],
    perStatusKawin: [
      { label: 'Kawin', jumlah: 1204 },
      { label: 'Belum Kawin', jumlah: 981 },
      { label: 'Cerai Mati', jumlah: 168 },
      { label: 'Cerai Hidup', jumlah: 64 },
    ],
    perRt: [
      { label: 'RT 001 / RW 001', jumlah: 312 },
      { label: 'RT 002 / RW 001', jumlah: 287 },
      { label: 'RT 003 / RW 001', jumlah: 401 },
      { label: 'RT 001 / RW 002', jumlah: 356 },
      { label: 'RT 002 / RW 002', jumlah: 298 },
    ],
  },

  'keuangan/tahun': [
    { tahun: 2026, versi: 'MURNI', dikunci: false },
    { tahun: 2025, versi: 'PERUBAHAN', dikunci: true },
  ],

  'layanan/surat/jenis': JENIS_SURAT.map(([kode, nama], i) => ({
    kode,
    nama,
    fieldTambahan: i === 1 ? ['nama_usaha', 'jenis_usaha', 'alamat_usaha'] : null,
    lampiranWajib: i < 3 ? ['Fotokopi KTP', 'Fotokopi Kartu Keluarga'] : null,
  })),

  pengaduan: pengaduan,
  pembangunan: proyek,
  'pembangunan/ringkasan': {
    tahun: 2026,
    totalProyek: proyek.length,
    totalNilai: proyek.reduce((t, p) => t + p.nilai, 0),
    berjalan: 2,
    selesai: 1,
    perencanaan: 1,
  },
  dokumen,
  umkm,
  'umkm/produk': [],
  berita: [],
  pengumuman: [],
  agenda: [],
  galeri: [],

  // ── Warga ──
  saya: {
    nik: '6205011203890004',
    nomorKk: '6205010203890012',
    nama: 'Siti Aminah',
    tempatLahir: 'Muara Teweh',
    tanggalLahir: '1989-03-12T00:00:00.000Z',
    jenisKelamin: 'PEREMPUAN',
    agama: 'Islam',
    pendidikan: 'SLTA/Sederajat',
    pekerjaan: 'Mengurus Rumah Tangga',
    statusKawin: 'Kawin',
    kewarganegaraan: 'WNI',
    hubunganKeluarga: 'Istri',
    namaAyah: 'Sukarno',
    namaIbu: 'Painem',
    golonganDarah: 'B',
    alamat: 'Jl. Sungai Rahayu No. 14',
    rt: '002',
    rw: '001',
    dusun: 'Hilir',
  },
  'saya/ringkasan': {
    tertaut: true,
    nama: 'Siti Aminah',
    suratDiproses: 1,
    suratSiapDiambil: 2,
    pengaduanAktif: 1,
    pesananAktif: 0,
    tagihanBelum: 2,
    tagihanNilai: 240_000,
    bantuanAktif: 2,
    sertifikat: 3,
  },
  'sertifikat/saya': [
    { id: 'st-1', namaPelatihan: 'Pelatihan Pengolahan Hasil Pertanian', penyelenggara: 'Dinas Pertanian Kab. Barito Utara', tanggalMulai: hariLalu(200), tanggalSelesai: hariLalu(197), nomorSertifikat: '421/PPHP/2026', berkasUrl: null },
    { id: 'st-2', namaPelatihan: 'Pelatihan Administrasi Posyandu', penyelenggara: 'Puskesmas Teweh Selatan', tanggalMulai: hariLalu(320), tanggalSelesai: hariLalu(318), nomorSertifikat: null, berkasUrl: null },
    { id: 'st-3', namaPelatihan: 'Pelatihan Pemasaran Produk UMKM Daring', penyelenggara: 'Dinas Koperasi dan UKM', tanggalMulai: hariLalu(60), tanggalSelesai: hariLalu(58), nomorSertifikat: '512/UMKM/2026', berkasUrl: null },
  ],
  'kegiatan/saya': [
    { id: 'kg-1', judul: 'Musyawarah Desa Penyusunan RKPDes', tanggal: hariLalu(45), peran: 'Peserta', keterangan: null },
    { id: 'kg-2', judul: 'Gotong royong pembersihan saluran irigasi', tanggal: hariLalu(72), peran: 'Peserta', keterangan: null },
    { id: 'kg-3', judul: 'Posyandu Balita RW 001', tanggal: hariLalu(14), peran: 'Kader', keterangan: 'Penimbangan bulanan' },
  ],
  'bantuan-sosial/saya': [],
  'umkm/pesanan/saya': [],
  'umkm/pesanan/masuk': [],
  'umkm/saya/toko': null,

  // ── Perangkat desa ──
  statistik: {
    penduduk: 2417,
    kk: 684,
    lakiLaki: 1246,
    perempuan: 1171,
    suratMenunggu: 3,
    suratTerbitTahunIni: 143,
    pengaduanBaru: 2,
    pengaduanSelesai: 28,
    umkm: 19,
    proyekBerjalan: 2,
    tagihanBelum: 61,
    berita: 22,
    dokumen: 37,
    suratPerStatus: [
      { label: 'DIPROSES', jumlah: 3 },
      { label: 'DISETUJUI', jumlah: 12 },
      { label: 'DITOLAK', jumlah: 5 },
      { label: 'SIAP_DIAMBIL', jumlah: 143 },
    ],
    pengaduanPerKategori: [
      { label: 'JALAN_RUSAK', jumlah: 14 },
      { label: 'LAMPU_MATI', jumlah: 9 },
      { label: 'SAMPAH', jumlah: 6 },
      { label: 'BANJIR', jumlah: 3 },
      { label: 'PELAYANAN', jumlah: 2 },
    ],
    asetPerKondisi: [
      { label: 'BAIK', jumlah: 41 },
      { label: 'RUSAK_RINGAN', jumlah: 7 },
      { label: 'RUSAK_BERAT', jumlah: 2 },
    ],
    keuangan: {
      tahun: 2026,
      versi: 'MURNI',
      pendapatanPagu: 1_420_000_000,
      pendapatanRealisasi: 986_000_000,
      belanjaPagu: 1_380_000_000,
      belanjaRealisasi: 612_000_000,
    },
    tren: [
      { label: 'Mar', suratMasuk: 18, suratTerbit: 15, pengaduan: 4 },
      { label: 'Apr', suratMasuk: 24, suratTerbit: 22, pengaduan: 7 },
      { label: 'Mei', suratMasuk: 31, suratTerbit: 27, pengaduan: 3 },
      { label: 'Jun', suratMasuk: 19, suratTerbit: 21, pengaduan: 9 },
      { label: 'Jul', suratMasuk: 27, suratTerbit: 25, pengaduan: 5 },
      { label: 'Agu', suratMasuk: 12, suratTerbit: 8, pengaduan: 2 },
    ],
  },
  absensi: {
    bulan: new Date().toISOString().slice(0, 7),
    perangkat: perangkatDesa.map((p, i) => ({
      id: p.id,
      nama: p.nama,
      jabatan: p.jabatan,
      hadir: 18 - i,
      izin: i % 3,
      sakit: i % 2,
      dinasLuar: i === 0 ? 2 : 0,
      alpa: i === 5 ? 1 : 0,
    })),
    catatan: [],
  },
};

/** Endpoint yang memakai amplop {data, meta}. */
const BERAMPLOP = {
  kependudukan: { data: penduduk, meta: { page: 1, perPage: 25, total: 2417 } },
  'layanan/surat': { data: pengajuan, meta: { page: 1, perPage: 20, total: pengajuan.length } },
  'layanan/surat/saya': {
    data: pengajuan.slice(0, 3),
    meta: { page: 1, perPage: 20, total: 3 },
  },
  'pengaduan/saya': { data: pengaduan.slice(0, 2), meta: { page: 1, perPage: 20, total: 2 } },
  tagihan: { data: tagihan },
  'tagihan/saya': {
    data: tagihan.slice(0, 2),
    meta: { belumBayar: 327_000 },
  },
  aset: {
    data: [
      ['Meja kerja kayu jati', 'Mebel', 12, 'unit', 1_250_000, 'BAIK', 'Kantor Desa'],
      ['Kursi lipat', 'Mebel', 60, 'unit', 145_000, 'BAIK', 'Balai Desa'],
      ['Laptop pelayanan', 'Elektronik', 2, 'unit', 7_400_000, 'BAIK', 'Ruang Pelayanan'],
      ['Printer multifungsi', 'Elektronik', 2, 'unit', 3_100_000, 'RUSAK_RINGAN', 'Ruang Pelayanan'],
      ['Mesin pompa air', 'Mesin', 1, 'unit', 2_800_000, 'RUSAK_BERAT', 'Gudang'],
      ['Tenda pleton', 'Perlengkapan', 3, 'set', 4_500_000, 'BAIK', 'Gudang'],
    ].map(([nama, kategori, jumlah, satuan, nilai, kondisi, lokasi], i) => ({
      id: `as-${i + 1}`,
      nama,
      kategori,
      kodeInventaris: `INV-2026-${String(i + 1).padStart(3, '0')}`,
      tahunPerolehan: 2022 + (i % 4),
      nilai,
      jumlah,
      satuan,
      kondisi,
      lokasi,
      sumberDana: 'Dana Desa',
      fotoUrl: null,
    })),
    meta: { totalNilai: 71_000_000, jumlahJenis: 6, rusak: 2 },
  },
};

const server = createServer((req, res) => {
  const [jalurMentah, kueri] = req.url.replace(/^\/api\/?/, '').split('?');
  const jalur = jalurMentah.replace(/\/$/, '');
  const param = new URLSearchParams(kueri ?? '');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (jalur in BERAMPLOP) {
    const amplop = BERAMPLOP[jalur];
    // Saringan status ikut dihormati. Tanpa ini, tangkapan layar menampilkan
    // seluruh baris padahal tombol saringnya tampak sedang aktif — pembaca
    // panduan akan mengira saringannya tidak berfungsi.
    const status = param.get('status');
    const data =
      status && Array.isArray(amplop.data)
        ? amplop.data.filter((b) => b.status === status)
        : amplop.data;
    res.end(JSON.stringify({ ok: true, ...amplop, data }));
    return;
  }

  if (jalur in DATA) {
    res.end(JSON.stringify({ ok: true, data: DATA[jalur] }));
    return;
  }

  // Detail keuangan per tahun: /keuangan/2026
  const tahun = /^keuangan\/(\d{4})$/.exec(jalur);
  if (tahun) {
    const belanja = [
      ['Penyelenggaraan Pemerintahan Desa', 412_000_000, 268_000_000],
      ['Pelaksanaan Pembangunan Desa', 601_000_000, 241_000_000],
      ['Pembinaan Kemasyarakatan', 184_000_000, 62_000_000],
      ['Pemberdayaan Masyarakat', 133_000_000, 34_000_000],
      ['Penanggulangan Bencana dan Mendesak', 50_000_000, 7_000_000],
    ];
    res.end(
      JSON.stringify({
        ok: true,
        data: {
          tahun: Number(tahun[1]),
          versi: 'MURNI',
          dikunci: false,
          pendapatan: { pagu: 1_420_000_000, realisasi: 986_000_000 },
          belanja: { pagu: 1_380_000_000, realisasi: 612_000_000 },
          pembiayaan: { pagu: 40_000_000, realisasi: 40_000_000 },
          perBidangBelanja: belanja.map(([label, pagu, realisasi]) => ({ label, pagu, realisasi })),
          perSumberDana: [
            { label: 'Dana Desa', pagu: 980_000_000, realisasi: 452_000_000 },
            { label: 'Alokasi Dana Desa', pagu: 286_000_000, realisasi: 118_000_000 },
            { label: 'Dana Bagi Hasil Pajak', pagu: 74_000_000, realisasi: 32_000_000 },
            { label: 'Pendapatan Asli Desa', pagu: 40_000_000, realisasi: 10_000_000 },
          ],
          item: belanja.map(([bidang, pagu, realisasi], i) => ({
            id: `it-${i + 1}`,
            jenis: 'BELANJA',
            bidang,
            uraian: bidang,
            sumberDana: 'Dana Desa',
            pagu,
            realisasi,
          })),
        },
      }),
    );
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ ok: false, error: { kode: 'STUB_TIDAK_ADA', pesan: jalur } }));
});

server.listen(PORT, () => console.log(`Data contoh siap di http://localhost:${PORT}`));
