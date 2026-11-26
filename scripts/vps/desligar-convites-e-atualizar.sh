#!/usr/bin/env bash
# VPS srv2036020 (179.236.244.168) — desliga robôs de convite frio / captação / quebrados, atualiza o código e reinicia o robô da Brisa.
# Uso: bash scripts/vps/desligar-convites-e-atualizar.sh   (em /opt/plantayraiz)
set -uo pipefail
cd /opt/plantayraiz || { echo "pasta /opt/plantayraiz não existe"; exit 1; }

echo "=== ANTES ==="
pm2 list

DESLIGADOS=(patient-traffic-booster growth-engine lead-harvesters-master instagram-direct-inviter apify-lead-sync
  anvisa-rdc660-rpa hostinger-email-dispatcher cannabis-young-doctors-hunter cadence-10min-inviter
  whatsapp-bot wpp-crm priority-15min-inviter meta-social-engine)

# Qualquer outro processo PM2 rodando script legado de 10 min/disparo proibido para (preservando os 2 autorizados: brevo-whatsapp-inviter e brevo-multi-pipeline).
EXTRA=$(pm2 jlist 2>/dev/null | node -e '
  const ALLOWED = new Set(["brevo-whatsapp-inviter", "brevo-multi-pipeline"]);
  let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{
    for(const p of JSON.parse(s)){const f=String(p.pm2_env?.pm_exec_path||"");const n=String(p.name||"");
      if(ALLOWED.has(n)) continue;
      if(/cadence|priority-15min|whatsapp-bot|wpp-crm|03_whatsapp-crm|04_autonomous-growth|disparo|campaign|campanha|harvest|hunter|send_|send-/i.test(f+" "+n)) console.log(p.name);}
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

echo "=== TIRANDO A CHAVE DO GITHUB DO ENDEREÇO DO REPOSITÓRIO ==="
# O repositório é público: baixar atualizações não precisa de chave nenhuma.
git remote set-url origin https://github.com/ricodoutor-pixel/consultorio-medico-inteligente.git
git config --unset-all credential.helper 2>/dev/null || true
git remote -v | sed -E 's#://[^@/]+@#://***@#'

echo "=== ATUALIZANDO CÓDIGO (preservando as alterações feitas direto no servidor) ==="
# Arquivos de estado (lista de opt-out, históricos) não são tocados: só os 2 arquivos alterados à mão.
LOCAIS="scripts/agent_evolution_brisa_live_responder.mjs scripts/sysadmin_watchdog_supervisor.mjs"
BK="/root/pyr-backup-$(date +%F-%H%M)"; mkdir -p "$BK"; chmod 700 "$BK"
git diff -- $LOCAIS > "$BK/alteracoes-locais.patch"
cp $LOCAIS "$BK/" 2>/dev/null || true
echo "backup das alterações locais: $BK"
git status --short | head -20
git stash push -m "local-$(date +%F-%H%M)" -- $LOCAIS >/dev/null 2>&1 || true
# A lista de e-mails que voltaram saiu do Git (dado pessoal): guarda antes do pull e devolve depois.
cp -p scripts/bounced_emails_blacklist.json "$BK/" 2>/dev/null || true
if ! git pull --ff-only origin main; then
  git stash pop >/dev/null 2>&1 || true
  echo "git pull não avançou (veja o git status acima). Nada foi trocado; robôs de convite continuam desligados."
  pm2 save; pm2 list; exit 2
fi
git log --oneline -1
[ -f scripts/bounced_emails_blacklist.json ] || cp -p "$BK/bounced_emails_blacklist.json" scripts/ 2>/dev/null || true
if git stash list | grep -q "local-"; then
  if git stash pop >/dev/null 2>&1; then
    echo "alterações locais reaplicadas sobre a versão nova"
  else
    git checkout HEAD -- $LOCAIS; git stash drop >/dev/null 2>&1 || true
    echo "alterações locais conflitam com a versão nova: ficou a versão do GitHub (backup em $BK)"
  fi
fi
# O vigia nunca pode voltar a religar robô desligado, mesmo com alteração local.
if node -e 'const d=require("./ecosystem.config.cjs").DESLIGADOS||[];const s=require("fs").readFileSync("scripts/sysadmin_watchdog_supervisor.mjs","utf8");const e=s.slice(s.indexOf("EXPECTED_SERVICES"),s.indexOf("];",s.indexOf("EXPECTED_SERVICES")));process.exit(d.some(n=>e.includes("\x27"+n+"\x27"))?1:0)'; then
  echo "vigia ok: não religa robô desligado"
else
  git checkout HEAD -- scripts/sysadmin_watchdog_supervisor.mjs
  echo "vigia local religaria robô desligado: voltou a versão do GitHub (backup em $BK)"
fi

echo "=== REINICIANDO ROBÔS EM USO ==="
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

echo "=== DEPOIS ==="
pm2 list
