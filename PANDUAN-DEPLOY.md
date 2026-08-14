# Panduan Deploy ke VPS

- **Alamat website:** http://desa-bintang-ninggi.webdevpky.site
- **VPS:** `103.150.101.67` · Ubuntu · Apache 2.4.52

## Yang perlu diketahui lebih dulu: VPS ini dipakai bersama

Pemeriksaan pada 15 Agustus 2026 menunjukkan server ini **sudah menjalankan
situs lain**:

| Temuan | Artinya |
|---|---|
| Apache 2.4.52 sudah terpasang | Tidak perlu dan tidak boleh dipasang ulang |
| Ada situs "Agro Supply Chain Dashboard" sebagai vhost default | IP telanjang dan domain desa saat ini sama-sama menampilkannya |
| Port 443 menyajikan sertifikat `app.nbsvworldwide.com` | Ada situs ketiga dengan HTTPS-nya sendiri |
| `desa-bintang-ninggi.webdevpky.site` → `103.150.101.67` | DNS sudah benar, tinggal dipasang vhost-nya |

Karena itu skrip di folder `deploy/` ditulis agar **tidak menyentuh situs
tetangga**:

- tidak menonaktifkan vhost mana pun, termasuk `000-default`
- tidak memasang ulang Apache atau MySQL yang sudah berjalan
- tidak mengubah versi Node bila sudah 20 ke atas (dan bertanya dulu bila perlu diubah)
- memakai port API yang masih bebas (4000–4004)
- membuat pengguna MySQL `desa` yang **hanya** berhak atas database desa, bukan root
- seluruh aturan Apache berada di dalam `<VirtualHost>` milik domain desa

Begitu vhost desa terpasang, Apache mengarahkan `desa-bintang-ninggi.webdevpky.site`
ke website desa, sementara IP telanjang tetap menampilkan situs lama seperti sebelumnya.

## Susunan

```
Pengunjung ──▶ Apache :80 ──┬──▶ apps/web/dist      (React, berkas statis)
  (domain desa)             ├──▶ :400x/api          (Express, lokal saja)
                            └──▶ :400x/uploads      (berkas unggahan)
                                      │
                                      └──▶ MySQL (database desa saja)
```

---

## Langkah deploy

### 1. Kirim kode ke repositori

Dari komputer Anda:

```bash
cd c:\Apps\desa-bintang-ninggi
git remote add origin <URL-repositori-Anda>
git push -u origin main
```

### 2. Ambil kode di VPS

```bash
ssh root@103.150.101.67

mkdir -p /var/www && cd /var/www
git clone <URL-repositori-Anda> desa-bintang-ninggi
cd desa-bintang-ninggi
```

### 3. Periksa server lebih dulu — tidak mengubah apa pun

```bash
sudo bash deploy/cek-server.sh
```

Melaporkan versi Node, situs Apache yang aktif, modul yang kurang, database yang
sudah ada, port yang bebas, dan apakah domain sudah mengarah ke server ini.
**Baca hasilnya sebelum lanjut.** Kalau ada baris bertanda `MASALAH`, selesaikan dulu.

### 4. Jalankan penyiapan

```bash
sudo bash deploy/setup-vps.sh
```

Menanyakan satu hal saja: domain — cukup tekan Enter untuk memakai
`desa-bintang-ninggi.webdevpky.site`. Bila Node perlu dinaikkan versinya, skrip
berhenti dan meminta persetujuan Anda lebih dulu, karena itu berlaku untuk
seluruh server.

Selebihnya berjalan sendiri: modul Apache, database + pengguna khusus, seluruh
kunci rahasia dibangkitkan `openssl rand`, vhost, layanan systemd, build, migrasi,
seed, lalu jalan.

Di akhir layar menampilkan alamat website dan password admin awal. Password itu
juga tersimpan di `.password-admin-awal.txt` — **ganti setelah login pertama,
lalu hapus berkasnya.**

### 5. Pasang HTTPS

Domain sudah mengarah ke server, jadi ini bisa langsung dijalankan:

```bash
sudo bash deploy/pasang-https.sh desa-bintang-ninggi.webdevpky.site
```

Certbot menambahkan vhost SSL baru untuk domain desa saja; sertifikat situs lain
tidak disentuh. Setelah HTTPS aktif, cookie sesi otomatis memakai flag `Secure`
tanpa perlu mengubah kode apa pun.

---

## Setiap ada perubahan kode

Satu perintah:

```bash
cd /var/www/desa-bintang-ninggi
bash deploy/deploy.sh
```

Urutannya: `git pull` → `npm ci` → migrasi database → build shared, API, dan
frontend → nyalakan ulang `desa-api` → muat ulang Apache. Skrip berhenti dan
memberi tahu bila API gagal menyala, jadi Anda tidak akan mengira deploy berhasil
padahal tidak.

---

## Mengganti alamat website

```bash
sudo bash deploy/ganti-domain.sh domain-baru.id
```

Tiga tempat berubah bersamaan — inilah alasan disediakan skrip alih-alih diedit
manual, karena kalau satu tertinggal gejalanya membingungkan:

| Yang berubah | Kalau tertinggal |
|---|---|
| `ServerName` di vhost Apache | Apache tidak mengenali domain baru |
| `WEB_ORIGIN` di `.env` | Login ditolak karena asal permintaan tidak dikenal |
| `PUBLIC_BASE_URL` di `.env` | QR pada surat baru menunjuk alamat lama |

> QR pada surat yang **sudah** terbit tetap menunjuk alamat lama. Bila domain lama
> masih mengarah ke VPS ini, biarkan saja agar surat lama tetap bisa diverifikasi.

---

## Setelah website hidup

Urutan pengisian yang masuk akal:

1. **Login admin** → `/masuk-perangkat`, ganti password
2. **Profil Desa** → nama, kecamatan, kabupaten, provinsi, alamat kantor.
   Empat yang pertama tercetak di kop setiap surat, jadi isi ini lebih dulu.
3. **Data penduduk** → impor CSV, atau entri satu per satu
4. **Perangkat desa** → khususnya Kepala Desa, karena namanya yang tercetak
   sebagai penandatangan surat
5. **Template surat** → sesuaikan redaksinya dengan yang berlaku di desa
6. **Coba satu surat** dari awal sampai terbit, lalu pindai QR-nya

---

## Perintah yang sering dipakai

```bash
# Kondisi layanan
sudo systemctl status desa-api

# Log API, mengikuti secara langsung
sudo journalctl -u desa-api -f

# Log Apache khusus situs desa
sudo tail -f /var/log/apache2/desa-error.log

# Nyalakan ulang API saja
sudo systemctl restart desa-api

# Periksa konfigurasi Apache sebelum reload
sudo apache2ctl configtest
```

---

## Kalau ada masalah

**Domain masih menampilkan situs lain**
Vhost desa belum aktif atau ServerName-nya keliru:
`sudo a2ensite desa.conf && sudo systemctl reload apache2`

**404 di semua halaman selain beranda**
Modul rewrite belum aktif: `sudo a2enmod rewrite && sudo systemctl restart apache2`

**Halaman muncul tapi data tidak masuk (502 di `/api`)**
API tidak jalan. Periksa `sudo journalctl -u desa-api -n 50`. Penyebab tersering:
`.env` belum lengkap, MySQL belum menyala, atau port API bentrok dengan aplikasi lain.

**403 Forbidden**
Apache tidak bisa menelusuri folder aplikasi:
`sudo chmod o+x /var/www/desa-bintang-ninggi /var/www/desa-bintang-ninggi/apps /var/www/desa-bintang-ninggi/apps/web`

**Login selalu gagal padahal PIN benar**
`WEB_ORIGIN` di `.env` belum sesuai alamat yang dibuka di browser. Setelah HTTPS
dipasang, nilainya harus `https://`, bukan `http://`.

---

## Yang tidak boleh dilakukan

**Jangan mengganti `DATA_ENCRYPTION_KEY` atau `DATA_HASH_KEY` setelah ada data
penduduk.** Kedua kunci itu yang mengenkripsi NIK dan nomor KK. Menggantinya
membuat seluruh NIK tersimpan tidak bisa dibaca lagi, dan tidak ada cara
memulihkannya.

**Jangan menjalankan `a2dissite` pada vhost yang bukan `desa.conf`.** Situs lain
di server ini milik proyek berbeda.

Cadangkan `apps/api/.env` ke tempat aman — kehilangan berkas itu setara dengan
kehilangan seluruh data kependudukan.

```bash
# Cadangan database
mysqldump -u desa -p desa_bintang_ninggi > cadangan-$(date +%F).sql
```
