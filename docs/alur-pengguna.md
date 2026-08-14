# Alur Pengguna

Bagian storyboard yang tidak bisa dibangkitkan otomatis: urutan langkah yang dilalui
pengguna, siapa yang bertindak, dan di mana keputusan diambil. Lima alur di bawah ini
adalah tulang punggung Fase 1–2.

---

## Alur 1 — Aktivasi akun warga

Alur ini ada karena **NIK bukan rahasia**. Login cukup-NIK berarti siapa pun yang tahu
NIK tetangganya bisa membuka data pribadi orang itu. Karena itu akun harus diaktifkan
lebih dulu lewat perangkat desa.

```mermaid
sequenceDiagram
    actor W as Warga
    actor P as Perangkat Desa
    participant S as Sistem

    P->>S: Daftarkan warga (pilih dari data penduduk)
    S-->>P: Terbit kode aktivasi (berlaku 7 hari)
    P-->>W: Serahkan kode (cetak / WhatsApp)
    W->>S: Buka /aktivasi — isi NIK + kode + PIN baru
    S->>S: Cocokkan NIK & kode, simpan hash PIN (argon2id)
    S-->>W: Akun aktif, arahkan ke /masuk
```

**Kegagalan yang harus ditangani:** kode kedaluwarsa, kode sudah dipakai, NIK tidak
terdaftar (jangan bocorkan mana yang salah — pesan seragam "NIK atau kode tidak cocok"),
percobaan berulang (kunci 15 menit setelah 5 kali gagal).

---

## Alur 2 — Pengajuan surat sampai terbit

Alur terpenting di seluruh sistem. Perhatikan bahwa surat **tidak langsung jadi PDF**
saat diajukan — PDF baru dibuat setelah disetujui, supaya tidak ada berkas berkop desa
yang beredar tanpa persetujuan.

```mermaid
sequenceDiagram
    actor W as Warga
    participant S as Sistem
    actor P as Perangkat Desa
    actor K as Kepala Desa

    W->>S: Pilih jenis surat di /layanan
    S-->>W: Form dinamis sesuai `fieldTambahan` jenis surat
    W->>S: Isi data + unggah lampiran (KTP/KK)
    S-->>W: Kode lacak, status DIPROSES

    P->>S: Buka daftar pengajuan di /admin/surat
    alt Berkas lengkap
        P->>S: Setujui
        S->>S: Terbitkan nomor surat, render PDF, hitung hash, tempel QR
        S-->>W: Status DISETUJUI + tautan unduh PDF
        K->>S: Tanda tangan (basah / TTE)
        P->>S: Tandai SIAP_DIAMBIL
    else Berkas kurang
        P->>S: Tolak + alasan (wajib diisi)
        S-->>W: Status DITOLAK + alasan
    end
```

**Verifikasi keaslian:** QR pada surat mengarah ke `/verifikasi/{kodeLacak}`. Halaman itu
publik dan hanya menampilkan: nomor surat, jenis, tanggal terbit, dan status keaslian —
**tanpa data pribadi pemohon**, karena tautannya bisa dibuka siapa saja yang memegang surat.

---

## Alur 3 — Pengaduan masyarakat

```mermaid
flowchart TD
    A[Warga buka /pengaduan/buat] --> B{Sudah login?}
    B -->|Belum| C[Arahkan ke /masuk]
    B -->|Sudah| D[Pilih kategori: jalan rusak, sampah, ...]
    D --> E[Isi judul + deskripsi]
    E --> F[Unggah foto maks. 5]
    F --> G{Izinkan lokasi?}
    G -->|Ya| H[Ambil koordinat GPS]
    G -->|Tidak| I[Isi lokasi manual]
    H --> J[Kirim - status BARU]
    I --> J
    J --> K[Perangkat verifikasi]
    K --> L{Valid?}
    L -->|Ya| M[DITANGANI - tulis tanggapan]
    L -->|Tidak| N[DITOLAK + alasan]
    M --> O[SELESAI - lampirkan foto hasil]
    O --> P[Warga terima notifikasi]
```

**Keputusan desain:** laporan boleh anonim di tampilan publik (`anonim: true`), tapi
identitas pelapor tetap tersimpan dan terlihat oleh perangkat desa. Tanpa itu, kolom
pengaduan akan dipenuhi laporan palsu.

---

## Alur 4 — Warga mengecek status bantuan sosial

```mermaid
sequenceDiagram
    actor W as Warga
    participant S as Sistem

    W->>S: Login (NIK + PIN)
    W->>S: Buka /warga/bantuan
    S->>S: Ambil penerima berdasarkan pendudukId sesi, BUKAN dari input NIK
    S-->>W: Daftar program + status + periode pencairan
```

**Penting:** jangan sediakan endpoint publik "cek bantuan dengan NIK". Endpoint semacam
itu bisa dipakai menyisir NIK satu per satu untuk memetakan siapa saja warga miskin di
desa. Status hanya dibuka untuk pemilik akun.

---

## Alur 5 — Perangkat desa memperbarui data penduduk

```mermaid
flowchart LR
    A[Login perangkat] --> B[/admin/penduduk/]
    B --> C[Cari via nikHash atau nama]
    C --> D[Buka detail]
    D --> E[Ubah data]
    E --> F[Simpan]
    F --> G[(audit_logs)]
    G --> H[Statistik agregat ikut berubah]
```

Setiap pembukaan dan perubahan data penduduk **wajib** tercatat di `audit_logs`
(siapa, kapan, dari IP mana, entitas apa). Ini kewajiban UU PDP No. 27/2022, dan
sekaligus pelindung perangkat desa bila suatu saat ada tuduhan penyalahgunaan data.

---

## Aturan lintas alur

| Aturan | Alasan |
|---|---|
| NIK & nomor KK dienkripsi at rest (AES-256-GCM), dicari lewat kolom HMAC | Bocornya dump database tidak langsung berarti bocornya identitas warga |
| Statistik publik selalu agregat | Halaman Data Kependudukan tidak boleh bisa dipakai menelusuri individu |
| Access token 15 menit + refresh token | Sesi panjang di perangkat bersama (warnet, HP pinjaman) berisiko |
| Rate limit ketat di `/api/auth` | Mencegah percobaan NIK/PIN massal |
| Alasan penolakan wajib diisi | Warga berhak tahu apa yang harus diperbaiki |
