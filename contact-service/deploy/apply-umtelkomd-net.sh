#!/usr/bin/env bash
# Install the contact relay and harden the umtelkomd.net nginx site.
# Run as root on the server from the uploaded bundle directory:  bash apply-umtelkomd-net.sh
# Safe to re-run. Every file it replaces is backed up with suffix .bak-<timestamp>.
# If `nginx -t` fails, all nginx changes are restored and nginx is not reloaded.
set -euo pipefail
cd "$(dirname "$0")"
TS=$(date +%Y%m%d-%H%M%S)
SITE=/etc/nginx/sites-available/landing.conf
NGINX_MAIN=/etc/nginx/nginx.conf
ZONE=/etc/nginx/conf.d/contact-zone.conf
SNIP_HEADERS=/etc/nginx/snippets/umtelkomd-security-headers.conf
SNIP_CONTACT=/etc/nginx/snippets/umtelkomd-contact.conf

[ "$(id -u)" = 0 ] || { echo "run as root"; exit 1; }
for f in contact_service.py contact-service.service nginx-contact.conf index.html; do
  [ -f "$f" ] || { echo "missing $f in bundle"; exit 1; }
done
if ss -tlnH | awk '{print $4}' | grep -q ':8787$' && ! systemctl is-active -q contact-service; then
  echo "port 8787 is used by another program; aborting"; exit 1
fi

echo "== 1. page title fix (index.html)"
install -m 644 -o deploy -g deploy index.html /var/www/landing/index.html

echo "== 2. contact service"
id contact >/dev/null 2>&1 || useradd --system --no-create-home --shell /usr/sbin/nologin contact
install -d -m 755 /opt/contact-service
install -m 644 contact_service.py /opt/contact-service/contact_service.py
if [ ! -f /etc/contact-service.env ]; then
  umask 077
  cat > /etc/contact-service.env <<'ENV'
# Google Workspace SMTP relay: server IPs allowlisted, TLS required, no credentials.
SMTP_HOST=smtp-relay.gmail.com
MAIL_FROM=web@umtelkomd.com
MAIL_TO=administration@umtelkomd.com,ihorstmann@umtelkomd.com
ENV
fi
chown root:root /etc/contact-service.env; chmod 600 /etc/contact-service.env
install -m 644 contact-service.service /etc/systemd/system/contact-service.service
systemctl daemon-reload
systemctl enable contact-service >/dev/null 2>&1
systemctl restart contact-service
sleep 2
# Explicit checks (not set -e) so a failure always prints the reason. nginx is untouched until here.
fail_service() { echo "service self-check failed: $1"; journalctl -u contact-service -n 20 --no-pager; echo "nginx was NOT changed"; exit 1; }
systemctl is-active -q contact-service || fail_service "service not running"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:8787/api/contact -H 'Content-Type: application/json' -d '{}' || true)
[ "$code" = 400 ] || fail_service "HTTP $code"
echo "service self-check OK (bad request rejected with 400, nothing sent)"

echo "== 3. nginx (backups: *.bak-$TS)"
backup() { [ -e "$1" ] && cp -a "$1" "$1.bak-$TS" || true; }
restore() {
  echo "nginx -t failed: restoring previous files"
  for f in "$SITE" "$NGINX_MAIN"; do [ -e "$f.bak-$TS" ] && cp -a "$f.bak-$TS" "$f"; done
  for f in "$ZONE" "$SNIP_HEADERS" "$SNIP_CONTACT"; do
    if [ -e "$f.bak-$TS" ]; then cp -a "$f.bak-$TS" "$f"; else rm -f "$f"; fi
  done
  nginx -t && echo "previous nginx configuration intact (not reloaded)"
  exit 1
}
for f in "$SITE" "$NGINX_MAIN" "$ZONE" "$SNIP_HEADERS" "$SNIP_CONTACT"; do backup "$f"; done

sed -i 's/^\(\s*\)server_tokens build;/\1server_tokens off;/' "$NGINX_MAIN"
echo 'limit_req_zone $binary_remote_addr zone=contact:1m rate=10r/m;' > "$ZONE"
install -m 644 nginx-contact.conf "$SNIP_CONTACT"
cat > "$SNIP_HEADERS" <<'H'
# Security headers for umtelkomd.net. Included in every location that sets its own add_header,
# because nginx does not inherit add_header into such locations.
add_header Strict-Transport-Security "max-age=31536000" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
H

cat > "$SITE" <<'SITECONF'
server {
  server_name umtelkomd.net www.umtelkomd.net;

  root /var/www/landing;
  index index.html;
  include /etc/nginx/snippets/umtelkomd-security-headers.conf;

  # Static assets: short cache; file names are not content-hashed.
  location ~* \.(?:js|mjs|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$ {
    include /etc/nginx/snippets/umtelkomd-security-headers.conf;
    add_header Cache-Control "public, max-age=3600";
    try_files $uri =404;
  }

  # Contact form relay (contact-service on 127.0.0.1:8787)
  include /etc/nginx/snippets/umtelkomd-contact.conf;

  location / {
    try_files $uri $uri/ /index.html;
  }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/umtelkomd.net/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/umtelkomd.net/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
server {
    if ($host = www.umtelkomd.net) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = umtelkomd.net) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

  listen 80;
  server_name umtelkomd.net www.umtelkomd.net;
    return 404; # managed by Certbot
}
SITECONF

nginx -t || restore
systemctl reload nginx
echo "nginx reloaded"
echo "== done. Backups: $SITE.bak-$TS and $NGINX_MAIN.bak-$TS"
