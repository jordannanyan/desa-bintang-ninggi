# Panduan Deploy ke VPS

VPS: `103.150.101.67` · Apache · MySQL · Node.js 20

Susunannya: Apache menyajikan hasil build React sebagai berkas statis, dan meneruskan
`/api` serta `/uploads` ke Express di port 4000. Karena keduanya lewat satu domain,
tidak ada masalah CORS maupun cookie lintas situs.

```
Pengunjung ──▶ Apache :80 ──┬──▶ apps/web/dist        (React, berkas statis)
                            ├──▶ :4000/api            (Express)
                            └──▶ :4000/uploads        (berkas unggahan)
                                      │
                                      └──▶ MySQL
```

---

## Sekali saja: penyiapan pertama

### 1. Kirim kode ke repositori

Dari komputer Anda:

```bash
cd c:\Apps\desa-bintang-ninggi
git remote add origin <URL-repositori-Anda>
git push -u origin main
```

### 2. Masuk ke VPS dan ambil kodenya

```bash
ssh root@103.150.101.67

mkdir -p /var/www && cd /var/www
git clone <URL-repositori-Anda> desa-bintang-ninggi
cd desa-bintang-ninggi
```

### 3. Jalankan penyiapan

```bash
sudo bash deploy/setup-vps.sh
```

Skrip akan menanyakan **satu hal saja**: domain yang ingin Anda pakai.
Kosongkan bila untuk sementara ingin memakai alamat IP `103.150.101.67`.

Selebihnya berjalan sendiri:

| Langkah | Yang dikerjakan |
|---|---|
| Paket | Node.js 20, Apache, MySQL, git |
| Modul Apache | `proxy`, `proxy_http`, `rewrite`, `headers`, `deflate` |
| Database | Membuat `desa_bintang_ninggi` + pengguna dengan sandi acak |
| `.env` | Menyusun seluruh kunci rahasia dengan `openssl rand` |
| Virtual host | Mengisi domain Anda ke template, memasang, mematikan situs bawaan |
| systemd | Memasang layanan `desa-api` yang otomatis nyala saat boot |
| Build | Memasang dependensi, migrasi, build, menyalakan layanan |

Di akhir, layar menampilkan alamat website dan password admin awal.
Password itu juga tersimpan di `.password-admin-awal.txt` — **ganti setelah login
pertama, lalu hapus berkasnya.**

### 4. Isi data awal

```bash
npm run db:seed --workspace=@desa/api
```

---

## Setiap ada perubahan kode

Satu perintah, itu saja:

```bash
cd /var/www/desa-bintang-ninggi
bash deploy/deploy.sh
```

Yang dijalankannya berurutan: `git pull` → `npm ci` → migrasi database → build
shared, API, dan frontend → nyalakan ulang `desa-api` → muat ulang Apache.

Skrip berhenti dan memberi tahu bila API gagal menyala, jadi Anda tidak akan
mengira deploy berhasil padahal tidak.

---

## Mengganti alamat website

Alamat website tidak dikunci di kode. Saat domain sudah siap:

```bash
sudo bash deploy/ganti-domain.sh desabintangninggi1.id
```

Tiga tempat berubah bersamaan — inilah alasan disediakan skrip alih-alih diedit
manual, karena kalau satu tertinggal gejalanya membingungkan:

| Yang berubah | Kalau tertinggal |
|---|---|
| `ServerName` di virtual host Apache | Apache tidak mengenali domain baru |
| `WEB_ORIGIN` di `.env` | Login ditolak karena asal permintaan tidak dikenal |
| `PUBLIC_BASE_URL` di `.env` | QR pada surat baru menunjuk alamat lama |

> QR pada surat yang **sudah** terbit tetap menunjuk alamat lama. Bila domain lama
> masih mengarah ke VPS ini, biarkan saja agar surat lama tetap bisa diverifikasi.

---

## Memasang HTTPS

Setelah domain diarahkan ke `103.150.101.67` (record A) dan sudah menyebar:

```bash
sudo bash deploy/pasang-https.sh desabintangninggi1.id
```

Sertifikat Let's Encrypt gratis, diperpanjang otomatis. Cookie sesi langsung
memakai flag `Secure` tanpa perlu mengubah kode apa pun.

HTTPS tidak bisa dipasang untuk alamat IP telanjang — perlu nama domain.

---

## Perintah yang sering dipakai

```bash
# Kondisi layanan
sudo systemctl status desa-api

# Log API, mengikuti secara langsung
sudo journalctl -u desa-api -f

# Log Apache
sudo tail -f /var/log/apache2/desa-error.log

# Nyalakan ulang API saja
sudo systemctl restart desa-api

# Periksa konfigurasi Apache sebelum reload
sudo apache2ctl configtest
```

---

## Kalau ada masalah

**Website tampil kosong / 404 di semua halaman selain beranda**
Modul rewrite belum aktif: `sudo a2enmod rewrite && sudo systemctl restart apache2`

**Halaman muncul tapi data tidak masuk (error 502 di `/api`)**
API tidak jalan. Periksa `sudo journalctl -u desa-api -n 50`. Penyebab tersering:
`.env` belum lengkap, atau MySQL belum menyala.

**403 Forbidden**
Apache tidak bisa menelusuri folder aplikasi:
`sudo chmod o+x /var/www/desa-bintang-ninggi /var/www/desa-bintang-ninggi/apps /var/www/desa-bintang-ninggi/apps/web`

**Login selalu gagal padahal PIN benar**
`WEB_ORIGIN` di `.env` belum sesuai alamat yang dibuka di browser.

---

## Yang tidak boleh dilakukan

**Jangan mengganti `DATA_ENCRYPTION_KEY` atau `DATA_HASH_KEY` setelah ada data
penduduk.** Kedua kunci itu yang mengenkripsi NIK dan nomor KK. Menggantinya membuat
seluruh NIK tersimpan tidak bisa dibaca lagi, dan tidak ada cara memulihkannya.

Cadangkan `apps/api/.env` ke tempat yang aman — kehilangan berkas itu setara dengan
kehilangan seluruh data kependudukan.

```bash
# Cadangan database
mysqldump -u desa -p desa_bintang_ninggi > cadangan-$(date +%F).sql
```
