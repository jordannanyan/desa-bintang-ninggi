# Cara Membuat Ulang Panduan Penggunaan

Hasil akhirnya: `docs/Panduan-Penggunaan-Desa-Bintang-Ninggi-I.pdf`.

Jalankan ulang setiap kali ada perubahan tampilan yang membuat tangkapan layar
di dalam panduan tidak lagi sesuai dengan yang dilihat pengguna.

## Kalau hanya mengubah teks panduan

Sunting isi di `scripts/generate-panduan.mjs` — seluruh langkah dan catatan
ditulis sebagai data terstruktur di bagian `const BAB`, bukan sebagai HTML.
Lalu:

```bash
npm run panduan
```

Perintah itu membangkitkan HTML, merendernya jadi PDF, dan memeriksa halaman
kosong sekaligus.

## Kalau tampilan aplikasi berubah

Tangkapan layar harus diambil ulang. Butuh dua proses berjalan bersamaan:

```bash
# Terminal 1 — data karangan untuk mengisi tabel dan grafik
npm run panduan:data

# Terminal 2 — aplikasi web, mem-proxy /api ke port 4000
npm run dev:web
```

Setelah keduanya siap, di terminal ketiga:

```bash
npm run panduan:screenshot   # menulis ke docs/screenshots/panduan/
npm run panduan              # generate + render + cek
```

## Tentang data yang dipakai

`scripts/data-contoh.mjs` menyajikan data **karangan**: nama, NIK, angka
keuangan, dan isi tabel semuanya fiktif. Ini disengaja — panduan yang memuat
tangkapan layar berisi data warga sungguhan berarti menyebarkan data pribadi ke
berkas yang dibagikan bebas.

Konsekuensinya, panduan tidak boleh dibuat dengan menjalankan API produksi.
Kalau `npm run dev:web` diarahkan ke API sungguhan, tangkapan layarnya akan
memuat data asli dan tidak layak dibagikan.

## Pemeriksaan halaman kosong

`npm run panduan:cek` membongkar PDF-nya, mendekompresi isi tiap halaman, lalu
menghitung perintah teks dan gambarnya. Halaman yang hanya memuat kaki halaman
dilaporkan sebagai kosong; halaman yang isinya sangat sedikit dilaporkan sebagai
"tipis".

Halaman kosong pernah muncul belasan pada dokumen sebelumnya akibat aturan
pemisah halaman CSS, dan memeriksanya dengan mata satu per satu tidak masuk akal
untuk dokumen empat puluh halaman. Perintah ini keluar dengan kode bukan-nol
bila menemukan halaman kosong, jadi bisa dipakai sebagai penjaga.

Dua penyebab yang sudah pernah terjadi dan aturannya sekarang ada di CSS:

- Blok `break-inside: avoid` yang **lebih tinggi dari satu halaman** justru
  memicu halaman kosong di depannya. Karena itu `.fitur` sengaja dibiarkan
  boleh terbelah, dan hanya gambar serta kotak catatan yang dijaga utuh.
- Kotak pendek yang terbelah dua halaman meninggalkan dua baris sendirian.
  Karena itu `.peringatan-data` dan tiap butir langkah dijaga utuh.

## Berkas yang tidak masuk git

`docs/visual/panduan.html` berukuran sekitar 12 MB karena menyematkan seluruh
tangkapan layar sebagai data URI. Berkas itu sepenuhnya bisa dibangkitkan ulang
dari `docs/screenshots/panduan/`, jadi sengaja tidak disimpan di git.
