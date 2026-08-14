#!/usr/bin/env bash
#
# Memasang sertifikat HTTPS gratis dari Let's Encrypt.
#
#   sudo bash deploy/pasang-https.sh desabintangninggi1.id
#
# Syarat: domain sudah diarahkan ke IP VPS ini (record A) dan sudah
# menyebar. Let's Encrypt memverifikasi dengan mengakses domain itu,
# jadi tidak bisa dipakai untuk alamat IP telanjang.
#
# Setelah HTTPS aktif, cookie sesi otomatis memakai flag Secure karena
# NODE_ENV=production — tidak ada yang perlu diubah di kode.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ $EUID -ne 0 ]]; then
  echo "Jalankan dengan sudo: sudo bash deploy/pasang-https.sh <domain>" >&2
  exit 1
fi

DOMAIN="${1:-}"
[[ -z "$DOMAIN" ]] && read -rp "Domain: " DOMAIN
[[ -z "$DOMAIN" ]] && { echo "Domain tidak boleh kosong." >&2; exit 1; }

read -rp "Email untuk pemberitahuan masa berlaku sertifikat: " EMAIL

apt-get update -qq
apt-get install -y certbot python3-certbot-apache

# www.<domain> hanya diikutkan bila DNS-nya benar-benar ada. Meminta sertifikat
# untuk nama yang tidak terselesaikan membuat seluruh permintaan GAGAL, termasuk
# untuk domain utamanya. Pada subdomain seperti desa-bintang-ninggi.webdevpky.site,
# varian www hampir pasti tidak ada.
DOMAIN_ARGS=(-d "$DOMAIN")
if getent hosts "www.${DOMAIN}" >/dev/null 2>&1; then
  DOMAIN_ARGS+=(-d "www.${DOMAIN}")
  echo "www.${DOMAIN} juga terdaftar, ikut disertakan."
else
  echo "www.${DOMAIN} tidak ada di DNS — dilewati."
fi

# --apache menambahkan vhost SSL baru untuk domain ini saja. Sertifikat milik
# situs lain di server ini tidak disentuh.
certbot --apache "${DOMAIN_ARGS[@]}" \
  --agree-tos -m "$EMAIL" --redirect --non-interactive

# Alamat di .env ikut berubah ke https, termasuk yang ditulis ke QR surat.
sed -i \
  -e "s|^WEB_ORIGIN=.*|WEB_ORIGIN=https://${DOMAIN}|" \
  -e "s|^PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL=https://${DOMAIN}|" \
  "${APP_DIR}/apps/api/.env"

systemctl restart desa-api
systemctl reload apache2

echo
echo "HTTPS aktif di https://${DOMAIN}"
echo "Sertifikat diperpanjang otomatis oleh certbot (timer systemd)."
