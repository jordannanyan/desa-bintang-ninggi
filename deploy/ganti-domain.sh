#!/usr/bin/env bash
#
# Mengganti alamat website tanpa menyentuh data.
#
#   sudo bash deploy/ganti-domain.sh desabintangninggi1.id
#
# Dipakai saat pindah dari alamat IP ke domain, atau saat berganti domain.
# Tiga tempat yang harus berubah bersamaan — kalau salah satu tertinggal,
# QR verifikasi surat akan menunjuk ke alamat lama dan login bisa ditolak
# karena asal permintaan tidak dikenali:
#   1. ServerName di virtual host Apache
#   2. WEB_ORIGIN di .env      (asal yang diizinkan saat login)
#   3. PUBLIC_BASE_URL di .env (alamat yang ditulis ke dalam QR surat)

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${APP_DIR}/apps/api/.env"
VHOST="/etc/apache2/sites-available/desa.conf"

if [[ $EUID -ne 0 ]]; then
  echo "Jalankan dengan sudo: sudo bash deploy/ganti-domain.sh <domain>" >&2
  exit 1
fi

DOMAIN="${1:-}"
if [[ -z "$DOMAIN" ]]; then
  read -rp "Domain baru (contoh: desabintangninggi1.id): " DOMAIN
fi
[[ -z "$DOMAIN" ]] && { echo "Domain tidak boleh kosong." >&2; exit 1; }

# Buang skema dan garis miring bila pengguna terlanjur menempel URL lengkap.
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN#https://}"
DOMAIN="${DOMAIN%%/*}"

SKEMA="http"
[[ "${2:-}" == "--https" ]] && SKEMA="https"

echo "Mengganti alamat menjadi ${SKEMA}://${DOMAIN}"

# 1. Virtual host — port API diambil dari .env agar tidak berubah tanpa sengaja.
API_PORT=$(grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2 | tr -d '[:space:]')
API_PORT="${API_PORT:-4000}"

sed -e "s|{{DOMAIN}}|${DOMAIN}|g" \
    -e "s|{{APP_DIR}}|${APP_DIR}|g" \
    -e "s|{{API_PORT}}|${API_PORT}|g" \
    "${APP_DIR}/deploy/apache/desa.conf.template" > "$VHOST"

# 2 & 3. Berkas .env
sed -i \
  -e "s|^WEB_ORIGIN=.*|WEB_ORIGIN=${SKEMA}://${DOMAIN}|" \
  -e "s|^PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL=${SKEMA}://${DOMAIN}|" \
  "$ENV_FILE"

apache2ctl configtest
systemctl reload apache2
systemctl restart desa-api

echo
echo "Selesai. Website sekarang di ${SKEMA}://${DOMAIN}"
echo
echo "Catatan: QR pada surat yang SUDAH terbit tetap menunjuk alamat lama."
echo "Bila domain lama masih mengarah ke VPS ini, biarkan saja agar surat"
echo "lama tetap bisa diverifikasi."
