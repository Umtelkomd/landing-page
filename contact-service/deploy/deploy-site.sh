#!/usr/bin/env bash
# Publish the built site and install the nginx site file for umtelkomd.net.
# Run as root on the server from the uploaded bundle:  bash deploy-site.sh
# Bundle: this script, nginx-landing.conf, nginx-security-headers.conf and dist/ (from scripts/build_site.py).
# Touches only /var/www/landing and the two umtelkomd.net nginx files. Other sites are not changed.
# Nothing in /var/www/landing is deleted. If `nginx -t` fails, both nginx files are restored and nginx is not reloaded.
set -euo pipefail
cd "$(dirname "$0")"
TS=$(date +%Y%m%d-%H%M%S)
WWW=/var/www/landing
SITE=/etc/nginx/sites-available/landing.conf
HEADERS=/etc/nginx/snippets/umtelkomd-security-headers.conf
BACKUP=/root/landing-backup-$TS.tgz

[ "$(id -u)" = 0 ] || { echo "run as root"; exit 1; }
for f in nginx-landing.conf nginx-security-headers.conf dist/index.html dist/404.html dist/assets/site.css dist/assets/site.js; do
  [ -f "$f" ] || { echo "missing $f in bundle"; exit 1; }
done

echo "== 1. backup -> $BACKUP, $SITE.bak-$TS, $HEADERS.bak-$TS"
tar -czf "$BACKUP" -C "$(dirname "$WWW")" "$(basename "$WWW")"
cp -a "$SITE" "$SITE.bak-$TS"; cp -a "$HEADERS" "$HEADERS.bak-$TS"

echo "== 2. site files (assets first, pages last, nothing deleted)"
cp -a dist/assets/. "$WWW/assets/"
mkdir -p "$WWW/.well-known"; cp -a dist/.well-known/. "$WWW/.well-known/"
cp -a dist/favicon.ico dist/robots.txt dist/sitemap.xml dist/404.html dist/impressum.html dist/datenschutz.html "$WWW/"
cp -a dist/index.html "$WWW/index.html"
chown -R deploy:deploy "$WWW"

echo "== 3. nginx"
install -m 644 nginx-security-headers.conf "$HEADERS"
install -m 644 nginx-landing.conf "$SITE"
if ! nginx -t; then
  echo "nginx -t failed: restoring previous nginx files (site files stay; they work with the previous configuration)"
  cp -a "$SITE.bak-$TS" "$SITE"; cp -a "$HEADERS.bak-$TS" "$HEADERS"
  nginx -t && echo "previous nginx configuration intact (not reloaded)"
  exit 1
fi
systemctl reload nginx
sleep 3  # reload is asynchronous: old workers may answer the first requests

echo "== 4. self-check"
check() { # url expected-status
  code=$(curl -s -o /dev/null -w '%{http_code}' --resolve umtelkomd.net:443:127.0.0.1 --resolve www.umtelkomd.net:443:127.0.0.1 "$1" || true)
  [ "$code" = "$2" ] && echo "ok   $2 $1" || { echo "FAIL $code (expected $2) $1"; FAILED=1; }
}
FAILED=0
check https://umtelkomd.net/ 200
check https://umtelkomd.net/assets/site.css 200
check https://umtelkomd.net/robots.txt 200
check https://umtelkomd.net/.well-known/security.txt 200
check https://umtelkomd.net/does-not-exist 404
check https://umtelkomd.net/.index.html.bak-20261109 404
check https://www.umtelkomd.net/ 301
check https://umtelkomd.net/signatur/umtelkomd-knot-112.png 200
if [ "$FAILED" = 1 ]; then
  echo "self-check failed. To roll back:"
  echo "  cp -a $SITE.bak-$TS $SITE && cp -a $HEADERS.bak-$TS $HEADERS && nginx -t && systemctl reload nginx"
  echo "  tar -xzf $BACKUP -C $(dirname "$WWW")"
  exit 1
fi
echo "== done. Backups: $BACKUP, $SITE.bak-$TS, $HEADERS.bak-$TS"
