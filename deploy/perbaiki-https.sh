#!/usr/bin/env bash
#
# Merapikan pemasangan HTTPS yang sudah berjalan.
#
#   sudo bash deploy/perbaiki-https.sh
#
# Dipakai bila certbot sudah menerbitkan sertifikat tapi:
#   - HTTP belum dialihkan ke HTTPS
#   - header HSTS belum dikirim
#   - WEB_ORIGIN / PUBLIC_BASE_URL di .env masih http://
#
# Aman dijalankan berulang kali; tidak menyentuh sertifikat maupun situs lain.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${APP_DIR}/apps/api/.env"
VHOST_HTTP="/etc/apache2/sites-available/desa.conf"

biru()   { printf '\033[1;34m%s\033[0m\n' "$*"; }
hijau()  { printf '\033[1;32m%s\033[0m\n' "$*"; }
kuning() { printf '\033[1;33m%s\033[0m\n' "$*"; }

[[ $EUID -eq 0 ]] || { echo "Jalankan dengan sudo." >&2; exit 1; }

DOMAIN=$(grep -m1 -i 'ServerName' "$VHOST_HTTP" | awk '{print $2}')
[[ -n "$DOMAIN" ]] || { echo "ServerName tidak ditemukan di ${VHOST_HTTP}" >&2; exit 1; }
biru "Domain: ${DOMAIN}"

if [[ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
  echo "Sertifikat untuk ${DOMAIN} belum ada." >&2
  echo "Jalankan dulu: sudo bash deploy/pasang-https.sh ${DOMAIN}" >&2
  exit 1
fi
hijau "Sertifikat ditemukan."
echo

# ---- 1. Pengalihan HTTP -> HTTPS ----------------------------
# certbot --redirect tidak selalu berhasil menyisipkan aturannya, terutama
# bila vhost sudah memuat aturan rewrite sendiri. Karena itu dipasang di sini
# secara eksplisit, dengan penanda supaya tidak terpasang dua kali.
biru "== Pengalihan HTTP ke HTTPS =="
if grep -q 'PENANDA_ALIH_HTTPS' "$VHOST_HTTP"; then
  hijau "Sudah terpasang."
else
  # Disisipkan tepat setelah baris DocumentRoot, di dalam <VirtualHost *:80>.
  awk -v domain="$DOMAIN" '
    { print }
    /^[[:space:]]*DocumentRoot/ && !sudah {
      print ""
      print "    # PENANDA_ALIH_HTTPS - dipasang deploy/perbaiki-https.sh"
      print "    <IfFile /etc/letsencrypt/live/" domain "/fullchain.pem>"
      print "        RewriteEngine On"
      print "        RewriteCond %{HTTPS} !=on"
      print "        RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [END,NE,R=permanent]"
      print "    </IfFile>"
      sudah = 1
    }
  ' "$VHOST_HTTP" > "${VHOST_HTTP}.baru" && mv "${VHOST_HTTP}.baru" "$VHOST_HTTP"
  hijau "Aturan pengalihan disisipkan."
fi
echo

# ---- 2. HSTS pada vhost HTTPS -------------------------------
# Vhost HTTPS dibuat certbot dengan menyalin vhost HTTP, jadi berkasnya
# terpisah dan tidak ikut berubah saat template diperbarui.
biru "== Header HSTS =="
for VHOST_SSL in /etc/apache2/sites-available/desa-le-ssl.conf \
                 /etc/apache2/sites-available/desa-ssl.conf; do
  [[ -f "$VHOST_SSL" ]] || continue

  if grep -q 'Strict-Transport-Security' "$VHOST_SSL"; then
    hijau "Sudah ada di $(basename "$VHOST_SSL")."
  else
    # 180 hari, tanpa includeSubDomains: janji HSTS sulit ditarik kembali,
    # jadi cakupannya dibatasi pada nama host ini saja.
    sed -i 's|^\([[:space:]]*\)ServerName|\1Header always set Strict-Transport-Security "max-age=15552000" env=HTTPS\n\1ServerName|' \
      "$VHOST_SSL"
    hijau "HSTS ditambahkan ke $(basename "$VHOST_SSL")."
  fi
done
echo

# ---- 3. Alamat di .env --------------------------------------
biru "== Alamat di .env =="
PERLU_RESTART=0
for KUNCI in WEB_ORIGIN PUBLIC_BASE_URL; do
  NILAI=$(grep -E "^${KUNCI}=" "$ENV_FILE" | cut -d= -f2-)
  if [[ "$NILAI" == https://* ]]; then
    hijau "${KUNCI} sudah https."
  else
    sed -i "s|^${KUNCI}=.*|${KUNCI}=https://${DOMAIN}|" "$ENV_FILE"
    kuning "${KUNCI} diubah menjadi https://${DOMAIN}"
    PERLU_RESTART=1
  fi
done
echo

# ---- 4. Terapkan --------------------------------------------
biru "== Menerapkan =="
if ! apache2ctl configtest; then
  echo "Konfigurasi Apache bermasalah. Tidak ada yang dimuat ulang." >&2
  exit 1
fi
systemctl reload apache2
hijau "Apache dimuat ulang."

if [[ $PERLU_RESTART -eq 1 ]]; then
  systemctl restart desa-api
  sleep 2
  systemctl is-active --quiet desa-api && hijau "API dinyalakan ulang." \
    || { echo "API gagal jalan. Lihat: sudo journalctl -u desa-api -n 50" >&2; exit 1; }
fi

echo
hijau "Selesai. Periksa:"
echo "  curl -sI http://${DOMAIN}/ | head -3      # harus 301 ke https"
echo "  curl -sI https://${DOMAIN}/ | grep -i strict"
