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
PAGES="index.html 404.html impressum.html datenschutz.html favicon.ico robots.txt sitemap.xml"
for f in nginx-landing.conf nginx-security-headers.conf dist/assets/site.css dist/assets/site.js dist/.well-known/security.txt $(printf "dist/%s " $PAGES); do
  [ -f "$f" ] || { echo "missing $f in bundle"; exit 1; }
done
id deploy >/dev/null 2>&1 || { echo "user deploy does not exist"; exit 1; }

rollback_hint() {
  echo "To roll back:"
  echo "  cp -a $SITE.bak-$TS $SITE && cp -a $HEADERS.bak-$TS $HEADERS && nginx -t && systemctl reload nginx"
  echo "  tar -xzf $BACKUP -C $(dirname "$WWW")"
}
# any unexpected failure after this point names the step and how to undo it
trap 'echo "FAILED at line $LINENO"; [ -f "$BACKUP" ] && rollback_hint' ERR

echo "== 1. backup -> $BACKUP, $SITE.bak-$TS, $HEADERS.bak-$TS"
tar -czf "$BACKUP" -C "$(dirname "$WWW")" "$(basename "$WWW")"
cp -a "$SITE" "$SITE.bak-$TS"; cp -a "$HEADERS" "$HEADERS.bak-$TS"

echo "== 2. site files (assets first, pages last, nothing deleted)"
cp -a dist/assets/. "$WWW/assets/"
mkdir -p "$WWW/.well-known"; cp -a dist/.well-known/. "$WWW/.well-known/"
for f in $PAGES; do [ "$f" = index.html ] || cp -a "dist/$f" "$WWW/"; done
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

echo "== 4. self-check"
check() { # url expected-status
  # the reload is asynchronous and old workers may answer first: retry for up to 10 s
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    code=$(curl -s -m 10 -o /dev/null -w '%{http_code}' --resolve umtelkomd.net:443:127.0.0.1 --resolve www.umtelkomd.net:443:127.0.0.1 "$1" || true)
    [ "$code" = "$2" ] && { echo "ok   $2 $1"; return 0; }
    sleep 1
  done
  echo "FAIL $code (expected $2) $1"; FAILED=1
}
FAILED=0
check https://umtelkomd.net/ 200
check https://umtelkomd.net/assets/site.css 200
check https://umtelkomd.net/robots.txt 200
check https://umtelkomd.net/.well-known/security.txt 200
check https://umtelkomd.net/does-not-exist 404
check https://umtelkomd.net/.index.html.bak-20261109 404
check https://www.umtelkomd.net/ 301
check https://umtelkomd.net/manifest.json 404
check https://umtelkomd.net/signatur/umtelkomd-knot-112.png 200
if [ "$FAILED" = 1 ]; then
  echo "self-check failed: restoring the previous nginx files (the new site files stay; they work with either configuration)"
  cp -a "$SITE.bak-$TS" "$SITE"; cp -a "$HEADERS.bak-$TS" "$HEADERS"
  nginx -t && systemctl reload nginx && echo "previous nginx configuration is live again"
  echo "site files backup, if needed: tar -xzf $BACKUP -C $(dirname "$WWW")"
  trap - ERR; exit 1
fi
echo "== done. Backups: $BACKUP, $SITE.bak-$TS, $HEADERS.bak-$TS"
