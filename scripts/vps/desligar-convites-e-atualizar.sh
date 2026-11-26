#!/usr/bin/env bash
# VPS srv1641464 — desliga robôs de convite frio / captação / quebrados, atualiza o código e reinicia o robô da Brisa.
# Uso: bash scripts/vps/desligar-convites-e-atualizar.sh   (em /opt/plantayraiz)
set -uo pipefail
cd /opt/plantayraiz || { echo "pasta /opt/plantayraiz não existe"; exit 1; }

echo "=== ANTES ==="
pm2 list

DESLIGADOS=(patient-traffic-booster growth-engine lead-harvesters-master instagram-direct-inviter apify-lead-sync
  anvisa-rdc660-rpa brevo-multi-pipeline hostinger-email-dispatcher cannabis-young-doctors-hunter cadence-10min-inviter
  brevo-whatsapp-inviter whatsapp-bot wpp-crm)

# Qualquer outro processo PM2 rodando um script de convite/disparo/loop de 10 min também para.
EXTRA=$(pm2 jlist 2>/dev/null | node -e '
  let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{
    for(const p of JSON.parse(s)){const f=String(p.pm2_env?.pm_exec_path||"");const n=String(p.name||"");
      if(/invit|convite|disparo|dispatch|campaign|campanha|harvest|hunter|send_|send-|cadence|whatsapp-bot|wpp-crm|03_whatsapp-crm|04_autonomous-growth/i.test(f+" "+n)) console.log(p.name);}
  }catch{}});')

for name in "${DESLIGADOS[@]}" $EXTRA; do
  if pm2 describe "$name" >/dev/null 2>&1; then
    pm2 delete "$name" && echo "desligado: $name"
  fi
done

echo "=== VERIFICANDO CRONTAB POR DISPARADORES FRIOS ==="
if crontab -l 2>/dev/null | grep -iE 'cadence|invit|convite|disparo|whatsapp-bot|03_whatsapp-crm|04_autonomous-growth|brevo'; then
  echo "⚠️ ATENÇÃO: Encontradas entradas de disparo frio no crontab acima! Remova com 'crontab -e'."
else
  echo "OK: Nenhum disparador frio encontrado no crontab do usuário atual."
fi

echo "=== DESATIVANDO WORKFLOWS N8N DE ALERTA FALSO DE PAGAMENTO E CONVITE FRIO ==="
N8N_DB="/var/lib/docker/volumes/n8n-a3wy_n8n_data/_data/database.sqlite"
if [ -f "$N8N_DB" ]; then
  CHANGED=$(python3 - <<'PY'
import sqlite3
db = "/var/lib/docker/volumes/n8n-a3wy_n8n_data/_data/database.sqlite"
conn = sqlite3.connect(db)
c = conn.cursor()
c.execute("""
  SELECT id, name FROM workflow_entity
  WHERE active = 1 AND (
    id = 'LdAWxfIxg0s67H32'
    OR lower(coalesce(nodes, '')) LIKE '%recebemos sua mensagem sobre o pagamento%'
    OR lower(coalesce(nodes, '')) LIKE '%pagamento informado%'
    OR lower(coalesce(nodes, '')) LIKE '%prescritores s%'
    OR lower(coalesce(nodes, '')) LIKE '%você foi selecionado%'
    OR lower(coalesce(nodes, '')) LIKE '%voce foi selecionado%'
  )
""")
rows = c.fetchall()
for wid, wname in rows:
    c.execute("UPDATE workflow_entity SET active = 0 WHERE id = ?", (wid,))
    print(f"n8n desativado: {wid} ({wname})")
conn.commit()
conn.close()
print(f"TOTAL_CHANGED={len(rows)}")
PY
  )
  echo "$CHANGED"
  if echo "$CHANGED" | grep -q "TOTAL_CHANGED=[1-9]"; then
    N8N_CID=$(docker ps -q --filter "name=n8n" | head -1)
    if [ -n "$N8N_CID" ]; then
      docker restart "$N8N_CID" && echo "n8n reiniciado após desativação dos workflows legados."
    fi
  fi
fi

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
