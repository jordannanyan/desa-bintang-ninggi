# Rekam Keputusan dari Dokumen Tulisan Tangan

Sumber: *Laman Website Desa Bintang Ninggi I* (5 halaman, pindaian CamScanner).
Dokumen ini merekam apa saja yang berubah dari daftar asli, supaya keputusannya
tidak hilang dan tidak perlu ditanyakan dua kali.

## Section yang dibatalkan

| No. asli | Section | Tanda |
|---|---|---|
| 11 | Pariwisata Desa | Dicoret X besar menyilang seluruh blok |
| 22 | Aspirasi Warga | Dicoret X besar menyilang seluruh blok |

Akibatnya penomoran bergeser: **25 section menjadi 23**.

## Sub-item yang dihapus

| Section | Sub-item | Tanda |
|---|---|---|
| 2. Profil Desa | Lambang dan maknanya | Dicoret garis lurus |
| 12. Pendidikan | SMP | Dicoret |
| 12. Pendidikan | SMA | Dicoret |
| 13. Kesehatan | Donor darah | Dicoret |

## Sub-item yang diganti

| Section | Semula | Menjadi |
|---|---|---|
| 13. Kesehatan | Puskesmas | **Pustu** (tulisan tangan di samping) |

## Keputusan turunan yang diambil saat scaffolding

Hal-hal berikut **tidak tertulis** di dokumen, tapi harus diputuskan agar struktur
tetap konsisten. Semuanya bisa dibatalkan bila pihak desa berpendapat lain.

1. **"Dokumen PPID" dipindah dari section 3 ke section PPID.**
   Pada dokumen, item ini diberi tanda kecil di ujungnya. Karena PPID sudah punya
   section sendiri (no. 24 asli), menaruh dokumennya di dua tempat hanya membuat
   duplikat. Semua dokumen kini dikelola satu tabel `dokumen` dengan kolom `jenis`.

2. **Item "Aspirasi" di Dashboard Warga ikut dihapus.**
   Item ini adalah pintu masuk ke section 22 yang dibatalkan. Membiarkannya berarti
   menyediakan menu yang mengarah ke halaman yang tidak ada.

3. **"Cek status penerima dengan NIK" (section 17) ditaruh di balik login.**
   Dokumen menulis "Status penerima dapat dicek menggunakan NIK". Bila dibuat sebagai
   endpoint publik, siapa pun bisa mencoba NIK satu per satu untuk memetakan warga
   penerima bantuan — data yang sensitif secara sosial. Fungsinya tetap ada, hanya
   dipindah ke `/warga/bantuan` setelah warga login.

4. **"Kalender event" (dari section 11 yang batal) tidak dihidupkan kembali.**
   Fungsi kalender sudah tercakup section 19 Kalender Desa.

## Keputusan pihak desa (sudah dijawab)

### 1. Pembayaran QRIS — manual, per UMKM

Tiap UMKM memasang QRIS miliknya sendiri. Pembeli transfer, lalu mengunggah bukti
bayar; UMKM yang memverifikasi.

Konsekuensi teknis: **tidak ada payment gateway sama sekali**. Tidak perlu Midtrans,
Xendit, akun merchant, atau biaya per transaksi, dan desa tidak pernah memegang uang
warga — hal terakhir ini juga menghilangkan pertanyaan siapa yang bertanggung jawab
bila ada dana tersangkut.

Risikonya berpindah ke verifikasi manual. Yang menanganinya di skema:

- `bukti_bayar` menyimpan berkas bukti, nominal, dan tanggal transfer
- `riwayat_pesanan` merekam tiap perubahan status beserta pelakunya
- `TRANSISI_PESANAN` di paket shared mengunci perpindahan status agar tidak melompat
- Alasan penolakan wajib diisi penjual, sama seperti penolakan surat
- Pesanan hangus otomatis setelah 24 jam bila bukti tidak kunjung diunggah

### 2. Tanda tangan — QR verifikasi mandiri

Dipakai QR buatan sendiri, bukan PSrE tersertifikasi.

Cara kerjanya: saat surat disetujui, sistem merender PDF, menghitung SHA-256 isinya,
menyimpan `hashDokumen` + `kodeVerifikasi`, lalu menempel QR yang mengarah ke
`/verifikasi/{kode}`. Siapa pun yang memegang lembar surat bisa memindainya dan melihat
nomor surat, jenis, tanggal terbit, dan penandatangannya.

> **Batasnya perlu diketahui.** Ini sah dan efektif sebagai kontrol keaslian, tetapi
> secara hukum **bukan** tanda tangan elektronik tersertifikasi menurut PP 71/2019.
> Karena itu surat tetap ditandatangani basah dan distempel; QR berperan sebagai
> pengaman tambahan agar surat tidak bisa dipalsukan atau isinya diubah. Bila suatu
> saat desa mendaftar ke BSrE, kolom `ditandatanganiOleh`/`ditandatanganiPada` tinggal
> diisi dari sertifikat, tanpa mengubah struktur tabel.

Kolom `jumlahVerifikasi` mencatat berapa kali QR dipindai — berguna untuk mendeteksi
satu surat yang tiba-tiba beredar luas.

### 3. Data penduduk — format baku

Kolom `penduduk` disusun mengikuti Kartu Keluarga / Dukcapil: NIK, No. KK, nama,
tempat & tanggal lahir, jenis kelamin, agama, pendidikan terakhir, jenis pekerjaan,
status perkawinan, status hubungan dalam keluarga, kewarganegaraan, nama ayah, nama
ibu, golongan darah, nomor akta lahir/kawin, dan alamat (alamat, RT, RW, dusun,
kode pos) yang menempel di Kartu Keluarga.

Daftar nilai bakunya ada di
[`packages/shared/src/constants/kependudukan.ts`](../packages/shared/src/constants/kependudukan.ts),
termasuk urutan kolom CSV untuk impor/ekspor. Tujuannya satu: mencegah
"Belum/Tidak Bekerja", "belum bekerja", dan "Tidak Bekerja" tercatat sebagai tiga
kategori berbeda yang memecah statistik.

`pekerjaan` sengaja dibiarkan bertipe teks dengan daftar saran, bukan enum ketat —
daftar Dukcapil panjang dan sesekali berubah, dan perangkat desa harus bisa memasukkan
yang belum terdaftar tanpa menunggu rilis baru.

### 4. Nomor surat & isi surat — bisa diubah kemudian

Tidak ada yang dikunci di dalam kode:

| Yang bisa diubah dari dashboard | Tersimpan di |
|---|---|
| Format nomor surat global | tabel `pengaturan`, kunci `format_nomor_surat` |
| Format khusus per jenis surat | `template_surat.formatNomor` (kosong = ikut global) |
| Isi/redaksi surat | `template_surat.isiTemplate` |
| Field yang harus diisi pemohon | `template_surat.fieldTambahan` — form dibangun dari sini |
| Lampiran wajib | `template_surat.lampiranWajib` |
| Nomor pada surat yang sudah terbit | `pengajuan_surat.nomorSurat`, boleh disunting |

Penomoran berjalan disimpan di `counter_surat` per tahun, agar dua perangkat yang
menyetujui surat bersamaan tidak menghasilkan nomor kembar. Nomor hasil generate tetap
boleh disunting bila harus diselaraskan dengan buku agenda surat manual.

Format awal `470/{{urut}}/BN-I/{{bulanRomawi}}/{{tahun}}` hanya nilai bawaan seed.

### 5. Data desa — tambah, ubah, hapus

Seluruh data desa dikelola penuh dari Dashboard Perangkat: profil desa, perangkat,
lembaga (BPD/LPM/PKK/Karang Taruna/BumDes), RT/RW, dokumen, berita, pengumuman,
agenda, galeri, keuangan, dan proyek pembangunan.

Ketentuan yang menyertainya: penghapusan data penduduk **tidak** menghapus baris,
melainkan mengisi `tanggalMeninggal` atau `tanggalPindah` — riwayat surat yang pernah
terbit atas nama orang itu harus tetap bisa ditelusuri. Setiap tambah/ubah/hapus data
penduduk masuk `audit_logs`.

## Yang masih perlu disiapkan pihak desa

Bukan lagi pertanyaan teknis, melainkan bahan:

- Sejarah desa, visi & misi, sambutan kepala desa
- Foto dan uraian tugas tiap perangkat
- Data penduduk awal (format CSV mengikuti `KOLOM_IMPOR_PENDUDUK`)
- Contoh setiap jenis surat yang berlaku sekarang, sebagai acuan redaksi template
- Nomor WA desa, email, dan akun media sosial resmi
