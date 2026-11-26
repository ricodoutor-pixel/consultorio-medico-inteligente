#!/usr/bin/env bash
# VPS srv1641464 — desliga robôs de convite frio / captação / quebrados, atualiza o código e reinicia o robô da Brisa.
# Uso: bash scripts/vps/desligar-convites-e-atualizar.sh   (em /opt/plantayraiz)
set -uo pipefail
cd /opt/plantayraiz || { echo "pasta /opt/plantayraiz não existe"; exit 1; }

echo "=== ANTES ==="
pm2 list

DESLIGADOS=(patient-traffic-booster growth-engine lead-harvesters-master instagram-direct-inviter apify-lead-sync
  anvisa-rdc660-rpa brevo-multi-pipeline hostinger-email-dispatcher cannabis-young-doctors-hunter cadence-10min-inviter)

# Qualquer outro processo PM2 rodando um script de convite/disparo também para.
EXTRA=$(pm2 jlist 2>/dev/null | node -e '
  let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{
    for(const p of JSON.parse(s)){const f=String(p.pm2_env?.pm_exec_path||"");
      if(/invit|convite|disparo|dispatch|campaign|campanha|harvest|hunter|send_|send-|cadence/i.test(f)) console.log(p.name);}
  }catch{}});')

for name in "${DESLIGADOS[@]}" $EXTRA; do
  if pm2 describe "$name" >/dev/null 2>&1; then
    pm2 delete "$name" && echo "desligado: $name"
  fi
done

echo "=== ATUALIZANDO CÓDIGO ==="
# Sem reset/stash: arquivos locais de estado (lista de opt-out, históricos) ficam intactos.
git status --short | head -20
if ! git pull --ff-only origin main; then
  echo "git pull não avançou sozinho (alterações locais na VPS). Robôs de convite já estão desligados; código NÃO atualizado."
  pm2 save; pm2 list; exit 2
fi
git log --oneline -1

echo "=== REINICIANDO ROBÔS EM USO ==="
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

echo "=== DEPOIS ==="
pm2 list
