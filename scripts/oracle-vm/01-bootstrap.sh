#!/usr/bin/env bash
# Planta y Raiz — Oracle VM Always Free Bootstrap
# Roda UMA vez na VM recém-criada (Ubuntu 22.04 ARM ou x86)
# Uso: curl -fsSL https://raw.githubusercontent.com/ricodoutor-pixel/consultorio-medico-inteligente/main/scripts/oracle-vm/01-bootstrap.sh | sudo bash
set -euo pipefail

echo "==> [1/8] Atualizando sistema"
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git ufw nginx certbot python3-certbot-nginx \
  build-essential ca-certificates gnupg lsb-release htop unzip

echo "==> [2/8] Swap 2GB (VM Always Free tem RAM limitada)"
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> [3/8] Node.js 22 LTS"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pm2 bun

echo "==> [4/8] Docker (para Evolution API)"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker

echo "==> [5/8] Firewall UFW (Oracle Security List ainda precisa abrir tb)"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> [6/8] iptables Oracle (Ubuntu da Oracle bloqueia tudo por padrão)"
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
netfilter-persistent save 2>/dev/null || iptables-save > /etc/iptables/rules.v4

echo "==> [7/8] Usuário deploy (sem sudo)"
id -u deploy &>/dev/null || useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

echo "==> [8/8] PM2 startup"
sudo -u deploy bash -c 'pm2 startup systemd -u deploy --hp /home/deploy' | tail -1 | bash || true

echo ""
echo "✅ BOOTSTRAP COMPLETO"
echo "Próximo passo: rodar 02-deploy-backend.sh como usuário 'deploy'"
node --version
docker --version
nginx -v
