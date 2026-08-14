#!/usr/bin/env bash
#
# Penyiapan awal VPS - cukup dijalankan SEKALI.
# Untuk pembaruan berikutnya pakai deploy/deploy.sh
#
#   sudo bash deploy/cek-server.sh      <- jalankan ini dulu, lalu baca hasilnya
#   sudo bash deploy/setup-vps.sh
#
# PENTING: VPS ini dipakai bersama situs lain (mis. Agro Supply Chain
# Dashboard). Skrip ini ditulis agar TIDAK menyentuh situs tetangga:
#   - tidak menonaktifkan vhost mana pun, termasuk 000-default
#   - tidak memasang ulang Apache/MySQL yang sudah berjalan
#   - tidak menurunkan/menaikkan Node bila versinya sudah memadai
#   - memakai port API yang masih bebas
#   - seluruh aturan Apache berada di dalam <VirtualHost> milik domain desa
#
# Skrip ini aman dijalankan berulang kali.
#
# Diuji pada Ubuntu 22.04 / 24.04 dan Debian 12.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_USER="${SUDO_USER:-$(whoami)}"
DOMAIN_BAWAAN="desa-bintang-ninggi.webdevpky.site"

biru()   { printf '\033[1;34m%s\033[0m\n' "$*"; }
hijau()  { printf '\033[1;32m%s\033[0m\n' "$*"; }
kuning() { printf '\033[1;33m%s\033[0m\n' "$*"; }

if [[ $EUID -ne 0 ]]; then
  echo "Jalankan dengan sudo: sudo bash deploy/setup-vps.sh" >&2
  exit 1
fi

# ---- 1. Domain ----------------------------------------------
biru "== Alamat website =="
read -rp "Domain [${DOMAIN_BAWAAN}]: " DOMAIN
DOMAIN="${DOMAIN:-$DOMAIN_BAWAAN}"
DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN%%/*}"
hijau "Website akan dilayani di: http://${DOMAIN}"
echo

# ---- 2. Paket, hanya yang benar-benar kurang ----------------
biru "== Memeriksa paket =="
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq

PERLU_APT=()

if command -v node >/dev/null && [[ "$(node -v | sed 's/^v//' | cut -d. -f1)" -ge 20 ]]; then
  hijau "Node $(node -v) sudah memadai - dibiarkan apa adanya."
else
  kuning "Node.js akan dipasang/dinaikkan ke versi 20."
  kuning "Perubahan versi Node berlaku untuk SELURUH server."
  read -rp "Aplikasi lain di VPS ini aman dengan Node 20? [y/N]: " LANJUT
  [[ "${LANJUT,,}" == "y" ]] || { echo "Dibatalkan."; exit 1; }
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  PERLU_APT+=(nodejs)
fi

command -v apache2ctl >/dev/null && hijau "Apache sudah ada." || PERLU_APT+=(apache2)
command -v git >/dev/null || PERLU_APT+=(git)
dpkg -s build-essential >/dev/null 2>&1 || PERLU_APT+=(build-essential)

# MySQL/MariaDB yang sudah berjalan JANGAN diutak-atik - bisa jadi
# tempat data aplikasi lain di server ini.
if systemctl is-active --quiet mysql || systemctl is-active --quiet mariadb; then
  hijau "MySQL/MariaDB sudah berjalan - tidak dipasang ulang."
else
  kuning "Belum ada database yang berjalan - MySQL akan dipasang."
  PERLU_APT+=(mysql-server)
fi

if [[ ${#PERLU_APT[@]} -gt 0 ]]; then
  biru "Memasang: ${PERLU_APT[*]}"
  apt-get install -y "${PERLU_APT[@]}"
fi
echo

# ---- 3. Modul Apache ----------------------------------------
# Menyalakan modul aman bagi situs lain: modul hanya menambah kemampuan,
# tidak mengubah perilaku vhost yang sudah ada.
biru "== Menyalakan modul Apache yang dibutuhkan =="
a2enmod proxy proxy_http rewrite headers deflate >/dev/null
hijau "proxy, proxy_http, rewrite, headers, deflate aktif."
echo

# ---- 4. Port API yang bebas ---------------------------------
biru "== Memilih port untuk API =="
API_PORT=""
for p in 4000 4001 4002 4003 4004; do
  if ! ss -ltn 2>/dev/null | grep -q ":${p} "; then API_PORT="$p"; break; fi
done
[[ -z "$API_PORT" ]] && { echo "Tidak ada port bebas di 4000-4004." >&2; exit 1; }
hijau "API akan berjalan di port ${API_PORT} (hanya diakses lokal lewat Apache)."
echo

# ---- 5. Database & .env -------------------------------------
# Keduanya digarap bersamaan dan urutannya penting: kata sandi database hanya
# tersimpan di .env. Kalau .env sudah ada lalu kata sandi pengguna MySQL
# diganti, keduanya jadi tidak cocok dan API menolak menyala dengan pesan
# "Access denied" yang menyesatkan. Karena itu bila .env ada, kredensialnya
# dipakai ulang dan kata sandi TIDAK diubah.
biru "== Menyiapkan database =="
DB_NAME="desa_bintang_ninggi"
DB_USER="desa"
ENV_FILE="${APP_DIR}/apps/api/.env"

jalankan_sql() {
  if mysql -e 'SELECT 1' >/dev/null 2>&1; then
    mysql
  else
    kuning "Perlu kata sandi root MySQL." >&2
    mysql -u root -p
  fi
}

if [[ -f "$ENV_FILE" ]]; then
  kuning "apps/api/.env sudah ada - kredensial lama dipakai ulang."
  API_PORT=$(grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2 | tr -d '[:space:]')
  kuning "Memakai PORT=${API_PORT} dari .env."

  # Database dipastikan ada, tapi kata sandi pengguna tidak disentuh.
  jalankan_sql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
else
  DB_PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"

  # Pengguna khusus dengan hak HANYA pada database desa. Tidak memakai root,
  # supaya kebocoran kredensial aplikasi ini tidak menyentuh database lain.
  jalankan_sql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

  ADMIN_PASS="$(openssl rand -base64 18 | tr -d '/+=' | head -c 16)"
  cat > "$ENV_FILE" <<ENV
NODE_ENV=production
PORT=${API_PORT}

DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}"

JWT_SECRET=$(openssl rand -hex 48)
JWT_REFRESH_SECRET=$(openssl rand -hex 48)
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30

# JANGAN mengganti dua kunci ini setelah ada data penduduk -
# seluruh NIK tersimpan tidak akan bisa dibaca lagi.
DATA_ENCRYPTION_KEY=$(openssl rand -hex 32)
DATA_HASH_KEY=$(openssl rand -hex 32)

WEB_ORIGIN=http://${DOMAIN}
PUBLIC_BASE_URL=http://${DOMAIN}

UPLOAD_DIR=${APP_DIR}/apps/api/uploads
MAX_UPLOAD_MB=5

ADMIN_PASSWORD_AWAL=${ADMIN_PASS}
ENV
  chown "${RUN_USER}:${RUN_USER}" "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  echo "${ADMIN_PASS}" > "${APP_DIR}/.password-admin-awal.txt"
  chmod 600 "${APP_DIR}/.password-admin-awal.txt"
  hijau ".env dibuat. Password admin awal: ${ADMIN_PASS}"
fi

hijau "Database ${DB_NAME} siap, pengguna '${DB_USER}' hanya berhak atasnya."

mkdir -p "${APP_DIR}/apps/api/uploads"
chown -R "${RUN_USER}:${RUN_USER}" "${APP_DIR}/apps/api/uploads"

# DocumentRoot harus sudah ada saat configtest dijalankan. Folder ini baru
# terisi setelah build, tapi keberadaannya saja sudah menghilangkan peringatan
# AH00112 dan membuat Apache mau memuat konfigurasinya.
mkdir -p "${APP_DIR}/apps/web/dist"
chown -R "${RUN_USER}:${RUN_USER}" "${APP_DIR}/apps/web/dist"
echo

# ---- 6. Virtual host ----------------------------------------
biru "== Memasang virtual host Apache =="
sed -e "s|{{DOMAIN}}|${DOMAIN}|g" \
    -e "s|{{APP_DIR}}|${APP_DIR}|g" \
    -e "s|{{API_PORT}}|${API_PORT}|g" \
    "${APP_DIR}/deploy/apache/desa.conf.template" \
    > /etc/apache2/sites-available/desa.conf

a2ensite desa.conf >/dev/null

# Situs lain SENGAJA tidak disentuh. Sebelum ada vhost ini, domain desa
# jatuh ke vhost default (situs tetangga); begitu ServerName cocok, Apache
# mengarahkannya ke sini tanpa mengubah apa pun milik situs itu.
kuning "Situs lain di server ini tidak diubah sama sekali."

# Apache perlu bisa menelusuri folder aplikasi untuk menyajikan hasil build.
chmod o+x "${APP_DIR}" "${APP_DIR}/apps" "${APP_DIR}/apps/web" 2>/dev/null || true

if ! apache2ctl configtest; then
  echo "Konfigurasi Apache bermasalah. desa.conf dinonaktifkan kembali." >&2
  a2dissite desa.conf >/dev/null
  exit 1
fi
echo

# ---- 7. Layanan systemd -------------------------------------
biru "== Memasang layanan systemd =="
sed -e "s|{{APP_DIR}}|${APP_DIR}|g" -e "s|{{RUN_USER}}|${RUN_USER}|g" \
  "${APP_DIR}/deploy/desa-api.service" \
  > /etc/systemd/system/desa-api.service
systemctl daemon-reload
systemctl enable desa-api >/dev/null
echo

# ---- 8. Build & jalankan ------------------------------------
# Build dijalankan sebagai pengguna biasa supaya node_modules dan hasil build
# dimiliki pengguna yang sama dengan yang menjalankan layanan.
biru "== Membangun aplikasi =="
chown -R "${RUN_USER}:${RUN_USER}" "${APP_DIR}" 2>/dev/null || true
sudo -u "${RUN_USER}" bash "${APP_DIR}/deploy/deploy.sh" \
  --lewati-pull --lewati-restart --dengan-seed

biru "== Menjalankan layanan =="
systemctl restart desa-api
sleep 3
if systemctl is-active --quiet desa-api; then
  hijau "API berjalan di port ${API_PORT}."
else
  echo "API gagal jalan. Lihat: sudo journalctl -u desa-api -n 50" >&2
  exit 1
fi

systemctl reload apache2

echo
hijau "===================================================="
hijau " Penyiapan selesai."
hijau "===================================================="
echo "  Website  : http://${DOMAIN}"
echo "  Admin    : http://${DOMAIN}/masuk-perangkat"
echo "  Pengguna : admin"
echo "  Password : lihat ${APP_DIR}/.password-admin-awal.txt"
echo "  API      : port ${API_PORT} (lokal saja)"
echo
kuning "Ganti password admin segera setelah login pertama,"
kuning "lalu hapus berkas .password-admin-awal.txt"
echo
echo "Pasang HTTPS (domain sudah mengarah ke server ini):"
echo "  sudo bash deploy/pasang-https.sh ${DOMAIN}"
echo
echo "Pembaruan berikutnya cukup:"
echo "  cd ${APP_DIR} && bash deploy/deploy.sh"
