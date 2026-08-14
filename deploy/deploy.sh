#!/usr/bin/env bash
#
# Pembaruan aplikasi di VPS. Inilah satu-satunya perintah yang perlu
# dijalankan setiap kali ada perubahan kode:
#
#   cd /var/www/desa-bintang-ninggi && bash deploy/deploy.sh
#
# Urutannya: git pull -> pasang dependensi -> migrasi database ->
# build API dan frontend -> nyalakan ulang layanan.
#
# Opsi:
#   --lewati-pull    lewati git pull (dipakai setup-vps.sh saat pertama kali)
#   --dengan-seed    jalankan seed data awal setelah migrasi

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

LEWATI_PULL=0
DENGAN_SEED=0
for arg in "$@"; do
  case "$arg" in
    --lewati-pull) LEWATI_PULL=1 ;;
    --dengan-seed) DENGAN_SEED=1 ;;
    *) echo "Opsi tidak dikenal: $arg" >&2; exit 1 ;;
  esac
done

biru()  { printf '\033[1;34m%s\033[0m\n' "$*"; }
hijau() { printf '\033[1;32m%s\033[0m\n' "$*"; }

if [[ ! -f apps/api/.env ]]; then
  echo "apps/api/.env belum ada. Jalankan dulu: sudo bash deploy/setup-vps.sh" >&2
  exit 1
fi

# ── 1. Ambil kode terbaru ────────────────────────────────────
if [[ $LEWATI_PULL -eq 0 ]]; then
  biru "== Mengambil kode terbaru =="
  git pull --ff-only
fi

# ── 2. Dependensi ────────────────────────────────────────────
biru "== Memasang dependensi =="
# `npm ci` memakai package-lock.json apa adanya, sehingga versi di server
# persis sama dengan yang diuji di komputer. Lebih cepat dan lebih terduga
# daripada `npm install`.
npm ci

# ── 3. Database ──────────────────────────────────────────────
biru "== Menerapkan migrasi database =="
# `migrate deploy` hanya menerapkan migrasi yang sudah ada — tidak pernah
# membuat migrasi baru dan tidak pernah menghapus data. Aman di produksi.
npm run db:deploy --workspace=@desa/api

if [[ $DENGAN_SEED -eq 1 ]]; then
  biru "== Mengisi data awal =="
  npm run db:seed --workspace=@desa/api
fi

# ── 4. Build ─────────────────────────────────────────────────
biru "== Membangun aplikasi =="
npm run build --workspace=@desa/shared
npm run db:generate --workspace=@desa/api
npm run build --workspace=@desa/api
npm run build --workspace=@desa/web

# ── 5. Nyalakan ulang ────────────────────────────────────────
biru "== Menyalakan ulang layanan =="
if systemctl list-unit-files | grep -q '^desa-api.service'; then
  sudo systemctl restart desa-api
  sleep 2
  systemctl is-active --quiet desa-api \
    && hijau "API berjalan." \
    || { echo "API gagal jalan. Lihat: sudo journalctl -u desa-api -n 50" >&2; exit 1; }
fi

sudo systemctl reload apache2 2>/dev/null || true

echo
hijau "Deploy selesai — $(git rev-parse --short HEAD 2>/dev/null || echo 'tanpa git')"
