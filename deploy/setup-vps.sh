#!/usr/bin/env bash
#
# Penyiapan awal VPS — cukup dijalankan SEKALI.
# Untuk pembaruan berikutnya pakai deploy/deploy.sh
#
#   sudo bash deploy/setup-vps.sh
#
# Yang dikerjakan:
#   1. Memasang Node.js 20, Apache, dan MySQL bila belum ada
#   2. Menyalakan modul Apache yang dibutuhkan
#   3. Membuat database + pengguna MySQL
#   4. Menyusun apps/api/.env berikut kunci rahasia yang dibangkitkan acak
#   5. Memasang virtual host Apache dengan domain pilihan Anda
#   6. Memasang layanan systemd untuk API
#
# Diuji pada Ubuntu 22.04 / 24.04 dan Debian 12.

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_USER="${SUDO_USER:-$(whoami)}"

biru()  { printf '\033[1;34m%s\033[0m\n' "$*"; }
hijau() { printf '\033[1;32m%s\033[0m\n' "$*"; }
kuning(){ printf '\033[1;33m%s\033[0m\n' "$*"; }

if [[ $EUID -ne 0 ]]; then
  echo "Jalankan dengan sudo: sudo bash deploy/setup-vps.sh" >&2
  exit 1
fi

# ── 1. Domain ────────────────────────────────────────────────
biru "== Alamat website =="
echo "Isi domain yang akan dipakai, misalnya: desabintangninggi1.id"
echo "Kosongkan untuk memakai alamat IP VPS ini."
read -rp "Domain: " DOMAIN
DOMAIN="${DOMAIN:-$(hostname -I | awk '{print $1}')}"
hijau "Website akan dilayani di: http://${DOMAIN}"

# ── 2. Paket ─────────────────────────────────────────────────
biru "== Memasang paket yang dibutuhkan =="
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq

if ! command -v node >/dev/null || [[ "$(node -v | cut -c2-3)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
apt-get install -y apache2 mysql-server git build-essential

biru "== Menyalakan modul Apache =="
# proxy & proxy_http meneruskan /api ke Express; rewrite untuk React Router;
# headers untuk aturan cache dan keamanan.
a2enmod proxy proxy_http rewrite headers deflate >/dev/null

# ── 3. Database ──────────────────────────────────────────────
biru "== Menyiapkan database MySQL =="
DB_NAME="desa_bintang_ninggi"
DB_USER="desa"
DB_PASS="$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)"

mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
hijau "Database ${DB_NAME} siap."

# ── 4. Berkas .env ───────────────────────────────────────────
biru "== Menyusun apps/api/.env =="
ENV_FILE="${APP_DIR}/apps/api/.env"

if [[ -f "$ENV_FILE" ]]; then
  kuning "apps/api/.env sudah ada — dibiarkan apa adanya."
  kuning "Hapus berkas itu lebih dulu bila ingin disusun ulang."
else
  ADMIN_PASS="$(openssl rand -base64 18 | tr -d '/+=' | head -c 16)"
  cat > "$ENV_FILE" <<ENV
NODE_ENV=production
PORT=4000

DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}"

JWT_SECRET=$(openssl rand -hex 48)
JWT_REFRESH_SECRET=$(openssl rand -hex 48)
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=30

# JANGAN mengganti dua kunci ini setelah ada data penduduk —
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
  hijau ".env dibuat. Password admin awal: ${ADMIN_PASS}"
  echo "${ADMIN_PASS}" > "${APP_DIR}/.password-admin-awal.txt"
  chmod 600 "${APP_DIR}/.password-admin-awal.txt"
fi

mkdir -p "${APP_DIR}/apps/api/uploads"
chown -R "${RUN_USER}:${RUN_USER}" "${APP_DIR}/apps/api/uploads"

# ── 5. Virtual host Apache ───────────────────────────────────
biru "== Memasang virtual host Apache =="
sed -e "s|{{DOMAIN}}|${DOMAIN}|g" -e "s|{{APP_DIR}}|${APP_DIR}|g" \
  "${APP_DIR}/deploy/apache/desa.conf.template" \
  > /etc/apache2/sites-available/desa.conf

a2ensite desa.conf >/dev/null
a2dissite 000-default.conf >/dev/null 2>&1 || true

# Apache perlu bisa menelusuri folder aplikasi untuk menyajikan hasil build.
chmod o+x "${APP_DIR}" "${APP_DIR}/apps" "${APP_DIR}/apps/web" 2>/dev/null || true

# ── 6. Layanan systemd ───────────────────────────────────────
biru "== Memasang layanan systemd =="
sed -e "s|{{APP_DIR}}|${APP_DIR}|g" -e "s|{{RUN_USER}}|${RUN_USER}|g" \
  "${APP_DIR}/deploy/desa-api.service" \
  > /etc/systemd/system/desa-api.service
systemctl daemon-reload
systemctl enable desa-api >/dev/null

# ── 7. Build & jalankan ──────────────────────────────────────
biru "== Membangun aplikasi =="
sudo -u "${RUN_USER}" bash "${APP_DIR}/deploy/deploy.sh" --lewati-pull

echo
hijau "════════════════════════════════════════════════════"
hijau " Penyiapan selesai."
hijau "════════════════════════════════════════════════════"
echo "  Website  : http://${DOMAIN}"
echo "  Admin    : http://${DOMAIN}/masuk-perangkat"
echo "  Pengguna : admin"
echo "  Password : lihat ${APP_DIR}/.password-admin-awal.txt"
echo
kuning "Ganti password admin segera setelah login pertama,"
kuning "lalu hapus berkas .password-admin-awal.txt"
echo
echo "Pembaruan berikutnya cukup jalankan:"
echo "  cd ${APP_DIR} && bash deploy/deploy.sh"
