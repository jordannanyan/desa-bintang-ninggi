#!/usr/bin/env bash
#
# Pemeriksaan sebelum deploy. TIDAK MENGUBAH APA PUN.
#
#   sudo bash deploy/cek-server.sh
#
# VPS ini sudah dipakai situs lain, jadi jalankan ini lebih dulu dan baca
# hasilnya sebelum menjalankan setup-vps.sh.

set -uo pipefail

biru()   { printf '\033[1;34m%s\033[0m\n' "$*"; }
hijau()  { printf '\033[1;32m  OK    %s\033[0m\n' "$*"; }
kuning() { printf '\033[1;33m  PERIKSA %s\033[0m\n' "$*"; }
merah()  { printf '\033[1;31m  MASALAH %s\033[0m\n' "$*"; }

DOMAIN="${1:-desa-bintang-ninggi.webdevpky.site}"

echo
biru "=== Pemeriksaan server untuk ${DOMAIN} ==="
echo

# ── Sistem ──
biru "Sistem"
echo "  $(. /etc/os-release && echo "$PRETTY_NAME")"
echo "  Disk kosong: $(df -h / | awk 'NR==2 {print $4}')"
echo "  RAM        : $(free -h | awk 'NR==2 {print $7" tersedia dari "$2}')"
echo

# ── Node.js ──
biru "Node.js"
if command -v node >/dev/null; then
  VERSI=$(node -v)
  MAYOR=$(echo "$VERSI" | sed 's/^v//' | cut -d. -f1)
  if [[ "$MAYOR" -ge 20 ]]; then
    hijau "Node $VERSI sudah memenuhi (butuh >= 20). Tidak perlu dipasang ulang."
  else
    kuning "Node $VERSI TERLALU LAMA (butuh >= 20)."
    echo "        Menaikkan versi Node berlaku untuk SELURUH server."
    echo "        Pastikan aplikasi lain di VPS ini masih jalan di Node 20+."
  fi
else
  kuning "Node.js belum ada — akan dipasang versi 20."
fi
echo

# ── Apache ──
biru "Apache"
if command -v apache2ctl >/dev/null; then
  hijau "$(apache2ctl -v | head -1)"

  echo "  Situs yang aktif sekarang:"
  for s in /etc/apache2/sites-enabled/*.conf; do
    [[ -e "$s" ]] || continue
    # Pola dijangkarkan ke awal baris supaya komentar yang menyebut
    # "ServerName" tidak ikut terbaca sebagai nama domain.
    NAMA=$(grep -m1 -E '^[[:space:]]*ServerName[[:space:]]' "$s" 2>/dev/null | awk '{print $2}')
    echo "    - $(basename "$s")${NAMA:+  (${NAMA})}"
  done

  echo "  Modul yang dibutuhkan:"
  for m in proxy proxy_http rewrite headers deflate; do
    if apache2ctl -M 2>/dev/null | grep -q "${m}_module"; then
      echo "      aktif   $m"
    else
      echo "      MATI    $m  (akan dinyalakan — tidak mengganggu situs lain)"
    fi
  done

  if [[ -e /etc/apache2/sites-enabled/desa.conf ]]; then
    kuning "desa.conf SUDAH terpasang. setup-vps.sh akan menimpanya."
  fi
else
  kuning "Apache belum ada — akan dipasang."
fi
echo

# ── Database ──
biru "Database"
if systemctl is-active --quiet mysql 2>/dev/null; then
  hijau "MySQL berjalan — TIDAK akan dipasang ulang."
elif systemctl is-active --quiet mariadb 2>/dev/null; then
  hijau "MariaDB berjalan — TIDAK akan dipasang ulang."
else
  kuning "Belum ada MySQL/MariaDB yang berjalan — akan dipasang MySQL."
fi

if command -v mysql >/dev/null; then
  if mysql -e 'SELECT 1' >/dev/null 2>&1; then
    hijau "Bisa masuk sebagai root tanpa kata sandi (socket auth)."
    echo "  Database yang sudah ada:"
    mysql -N -e 'SHOW DATABASES' 2>/dev/null |
      grep -Ev '^(information_schema|performance_schema|mysql|sys)$' |
      sed 's/^/    - /'
  else
    merah "Tidak bisa masuk MySQL sebagai root tanpa kata sandi."
    echo "        setup-vps.sh akan meminta kata sandi root MySQL."
  fi
fi
echo

# ── Port API ──
biru "Port untuk API"
for p in 4000 4001 4002 4003; do
  if ss -ltn 2>/dev/null | grep -q ":${p} "; then
    echo "      TERPAKAI  ${p}"
  else
    hijau "Port ${p} bebas — bisa dipakai API desa."
    break
  fi
done
echo

# ── Domain ──
biru "Domain"
IP_SERVER=$(hostname -I | awk '{print $1}')
IP_DOMAIN=$(getent hosts "$DOMAIN" 2>/dev/null | awk '{print $1}' | head -1)
echo "  IP server ini : ${IP_SERVER}"
echo "  ${DOMAIN} -> ${IP_DOMAIN:-tidak terselesaikan}"
if [[ "$IP_DOMAIN" == "$IP_SERVER" ]]; then
  hijau "Domain sudah mengarah ke server ini."
else
  kuning "Domain belum/tidak mengarah ke server ini. HTTPS belum bisa dipasang."
fi
echo

biru "=== Selesai. Tidak ada yang diubah. ==="
echo
echo "Bila semua di atas wajar, lanjutkan:"
echo "  sudo bash deploy/setup-vps.sh"
