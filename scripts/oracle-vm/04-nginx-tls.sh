#!/usr/bin/env bash
# Nginx reverse proxy + Let's Encrypt para api. e bot.plantayraiz.com.br
# Roda como root: sudo bash scripts/oracle-vm/04-nginx-tls.sh
# Pré-requisito: DNS A records já apontando para o IP desta VM
set -euo pipefail

EMAIL="contato@plantayraiz.com.br"

cat > /etc/nginx/sites-available/plantayraiz <<'NGINX'
# api.plantayraiz.com.br -> Node tRPC
server {
  listen 80;
  server_name api.plantayraiz.com.br;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 90;
  }
}

# bot.plantayraiz.com.br -> Evolution API
server {
  listen 80;
  server_name bot.plantayraiz.com.br;
  client_max_body_size 50M;
  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300;
  }
}
NGINX

ln -sf /etc/nginx/sites-available/plantayraiz /etc/nginx/sites-enabled/plantayraiz
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> Emitindo TLS (Let's Encrypt)"
certbot --nginx \
  -d api.plantayraiz.com.br \
  -d bot.plantayraiz.com.br \
  --non-interactive --agree-tos -m "$EMAIL" --redirect

systemctl reload nginx
echo "✅ HTTPS ativo. Renovação automática via systemd timer (certbot)."
