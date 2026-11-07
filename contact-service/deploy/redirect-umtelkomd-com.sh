#!/usr/bin/env bash
# Redirect umtelkomd.com and www.umtelkomd.com to https://umtelkomd.net (301), with its own
# Let's Encrypt certificate. Run as root on the server. Safe to re-run.
# If `nginx -t` fails, the new site file is removed and nginx is not reloaded.
set -euo pipefail
SITE=/etc/nginx/sites-available/umtelkomd-com.conf
LINK=/etc/nginx/sites-enabled/umtelkomd-com.conf
ACME=/var/www/letsencrypt
CERT=/etc/letsencrypt/live/umtelkomd.com/fullchain.pem

[ "$(id -u)" = 0 ] || { echo "run as root"; exit 1; }
for h in umtelkomd.com www.umtelkomd.com; do
  ip=$(getent ahostsv4 "$h" | awk 'NR==1{print $1}')
  [ "$ip" = 72.60.123.94 ] || { echo "$h does not resolve to this server yet ($ip)"; exit 1; }
done

apply() {  # $1 = content of the site file
  local had_old=0
  [ -e "$SITE" ] && { cp -a "$SITE" "$SITE.bak-$$"; had_old=1; }
  printf '%s\n' "$1" > "$SITE"
  ln -sf "$SITE" "$LINK"
  if ! nginx -t; then
    echo "nginx -t failed: restoring"
    if [ $had_old = 1 ]; then mv "$SITE.bak-$$" "$SITE"; else rm -f "$SITE" "$LINK"; fi
    nginx -t && echo "previous configuration intact (not reloaded)"
    exit 1
  fi
  rm -f "$SITE.bak-$$"
  systemctl reload nginx
}

HTTP_BLOCK='server {
  listen 80;
  listen [::]:80;
  server_name umtelkomd.com www.umtelkomd.com;
  location /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
  location / { return 301 https://umtelkomd.net$request_uri; }
}'

echo "== 1. HTTP redirect + ACME challenge path"
install -d -m 755 "$ACME"
apply "$HTTP_BLOCK"

echo "== 2. certificate"
if [ ! -f "$CERT" ]; then
  certbot certonly --webroot -w "$ACME" -d umtelkomd.com -d www.umtelkomd.com \
    --cert-name umtelkomd.com --non-interactive --agree-tos --keep-until-expiring
fi

echo "== 3. HTTPS redirect"
apply "$HTTP_BLOCK
server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name umtelkomd.com www.umtelkomd.com;
  ssl_certificate /etc/letsencrypt/live/umtelkomd.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/umtelkomd.com/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
  add_header Strict-Transport-Security \"max-age=31536000\" always;
  return 301 https://umtelkomd.net\$request_uri;
}"
echo "== done"
