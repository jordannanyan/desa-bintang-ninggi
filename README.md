# Website Desa Bintang Ninggi I

Monorepo React + Express + MySQL untuk laman resmi desa: pelayanan surat online,
transparansi keuangan, pengaduan masyarakat, dan data kependudukan.

## Struktur

```
desa-bintang-ninggi/
├─ apps/
│  ├─ api/                  Express + Prisma + MySQL
│  │  ├─ prisma/schema.prisma   Skema database (Fase 1–2)
│  │  ├─ prisma/seed.ts         Profil desa, template surat, admin pertama
│  │  └─ src/
│  │     ├─ config/env.ts       Validasi .env dengan Zod
│  │     ├─ lib/crypto.ts       Enkripsi NIK/KK + hash dokumen surat
│  │     ├─ middleware/         auth, validasi, penanganan error
│  │     ├─ modules/            Endpoint per domain
│  │     └─ routes/             Perakitan router + stub otomatis
│  └─ web/                  React + Vite + Tailwind + React Router
│     └─ src/
│        ├─ routes/index.tsx    Seluruh rute, dibangkitkan dari registry
│        ├─ layouts/            Layout publik & dashboard
│        ├─ pages/              Halaman yang sudah digarap
│        └─ components/         Komponen bersama
├─ packages/
│  └─ shared/               Registry section, katalog surat, skema Zod
├─ docs/
│  ├─ Storyboard-Desa-Bintang-Ninggi-I.pdf   Dokumen storyboard siap bagikan
│  ├─ STORYBOARD.md         Dibangkitkan — jangan diedit manual
│  ├─ alur-pengguna.md      Diagram alur tiap perjalanan pengguna
│  ├─ revisi-dokumen.md     Rekam keputusan dari dokumen tulisan tangan
│  ├─ screenshots/          PNG diagram alur + tangkapan layar aplikasi
│  └─ visual/storyboard.html  Sumber dokumen PDF (mermaid dirender lokal)
└─ scripts/
   ├─ generate-storyboard.ts   sections.ts -> STORYBOARD.md
   ├─ render-storyboard.mjs    storyboard.html -> PNG diagram + PDF
   └─ screenshot-web.mjs       aplikasi berjalan -> PNG halaman
```

## Satu sumber kebenaran

[`packages/shared/src/constants/sections.ts`](packages/shared/src/constants/sections.ts)
memuat seluruh 23 section beserta rute, sub-item, akses, dan fasenya. File itu menyetir:

- rute frontend di `apps/web/src/routes/index.tsx`
- menu navigasi & peta situs
- router stub API di `apps/api/src/routes/stub.ts`
- dokumen storyboard di `docs/STORYBOARD.md`

Menambah halaman cukup dilakukan di satu tempat; keempatnya ikut menyesuaikan.

## Menjalankan

```bash
# 1. Dependensi
npm install

# 2. Konfigurasi
cp .env.example apps/api/.env
# isi DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, DATA_ENCRYPTION_KEY, DATA_HASH_KEY

# 3. Database (MySQL harus sudah jalan, buat database kosong lebih dulu)
npm run db:migrate --workspace=@desa/api
npm run db:seed --workspace=@desa/api

# 4. Jalankan
npm run dev:api    # http://localhost:4000
npm run dev:web    # http://localhost:5173
```

Peta seluruh endpoint API bisa dilihat di `GET http://localhost:4000/api`.

## Storyboard

```bash
npm run storyboard              # sections.ts  -> docs/STORYBOARD.md
npm run dev:web                 # jalankan dulu, di terminal terpisah
npm run storyboard:screenshot   # aplikasi berjalan -> docs/screenshots/web-*.png
npm run storyboard:render       # diagram -> PNG, lalu seluruh dokumen -> PDF
```

`storyboard:render` dan `storyboard:screenshot` memakai Chrome/Edge yang sudah
terpasang di mesin (lewat `puppeteer-core`), jadi tidak ada Chromium yang perlu
diunduh. Urutannya penting: ambil screenshot lebih dulu, baru render PDF, karena
PDF menyertakan gambar-gambar itu.

Hasil akhir: **`docs/Storyboard-Desa-Bintang-Ninggi-I.pdf`** — 25 halaman berisi
ringkasan revisi dokumen, arsitektur, peta situs, hak akses, 6 alur pengguna,
tangkapan layar aplikasi, inventaris 78 layar, dan daftar hal yang masih perlu
dikonfirmasi ke pihak desa.

## Deploy ke VPS

Panduan lengkap: **[PANDUAN-DEPLOY.md](PANDUAN-DEPLOY.md)**

Ringkasnya — penyiapan pertama sekali saja:

```bash
git clone <repo> /var/www/desa-bintang-ninggi
cd /var/www/desa-bintang-ninggi
sudo bash deploy/setup-vps.sh      # hanya menanyakan domain yang Anda mau
```

Setiap kali ada perubahan kode:

```bash
bash deploy/deploy.sh              # git pull -> build -> restart
```

Mengganti alamat website kapan saja:

```bash
sudo bash deploy/ganti-domain.sh desabintangninggi1.id
sudo bash deploy/pasang-https.sh desabintangninggi1.id
```

## Fase pengerjaan

| Fase | Isi | Status |
|---|---|---|
| 1 | Beranda, Profil, Pemerintahan, Kependudukan, Pelayanan Surat, kedua dashboard | kerangka siap |
| 2 | Keuangan, Pembangunan, Pengaduan, PPID, Download Center | skema DB siap |
| 3 | UMKM, BumDes, Pertanian, Peternakan, Perikanan, Bantuan Sosial, Lowongan | belum |
| 4 | Pendidikan, Kesehatan, Kalender, Galeri, Peta, Kontak | belum |

## Catatan keamanan yang tidak boleh dilanggar

1. **NIK bukan password.** Login memakai NIK + PIN yang ditetapkan warga sendiri
   setelah aktivasi. Lihat [docs/alur-pengguna.md](docs/alur-pengguna.md) alur 1.
2. **NIK & nomor KK dienkripsi at rest** (AES-256-GCM), pencarian lewat kolom HMAC.
   Mengganti `DATA_ENCRYPTION_KEY` setelah ada data membuat seluruh NIK tidak terbaca.
3. **Setiap akses data penduduk masuk `audit_logs`** — kewajiban UU PDP No. 27/2022.
4. **Statistik publik selalu agregat.** Tidak ada endpoint publik yang menerima NIK
   sebagai input.
