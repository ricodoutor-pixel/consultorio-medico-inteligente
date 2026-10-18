#!/usr/bin/env bash
#
# purge-git-history.sh
# ---------------------------------------------------------------------------
# Expurga DEFINITIVAMENTE do histórico do Git todos os arquivos com dados
# pessoais (LGPD), a sessão autenticada do WhatsApp e os arquivos .env, que já
# foram removidos do tree atual mas CONTINUAM recuperáveis em commits antigos.
#
# ⚠️  OPERAÇÃO DESTRUTIVA E IRREVERSÍVEL — reescreve TODO o histórico e exige
#     `git push --force`. Leia o checklist antes de rodar.
#
# PRÉ-REQUISITOS / SEQUÊNCIA SEGURA:
#   1. PAUSE o sync do Lovable (Project → Settings → Git) ANTES de forçar o
#      push. Caso contrário o Lovable pode re-empurrar o histórico antigo de
#      volta (re-vazando os dados) ou o sync quebra.
#   2. Garanta que não há trabalho não commitado que você queira manter.
#   3. Rode este script (ele reescreve o histórico LOCAL).
#   4. Revise com:  git log --stat | head   e   git ls-files | grep -iE 'contatos|whatsapp_session|\.env\.'
#   5. Force o push:  git push --force --all origin  &&  git push --force --tags origin
#   6. Avise TODOS os colaboradores para RE-CLONAR (o histórico antigo deles
#      ainda contém os dados).
#
# REMEDIAÇÃO ADICIONAL (o filter-repo NÃO cobre):
#   • Trate a conta do WhatsApp como COMPROMETIDA e re-vincule (a sessão
#     autenticada esteve versionada).
#   • Rotacione qualquer segredo real que já tenha passado pelo histórico.
#   • O GitHub retém objetos órfãos/refs de PR e caches — acione o Suporte do
#     GitHub para purgar visualizações em cache e considere invalidar forks.
#
# USO:
#   bash scripts/purge-git-history.sh --confirmo-que-li-o-checklist
# ---------------------------------------------------------------------------
set -euo pipefail

if [[ "${1:-}" != "--confirmo-que-li-o-checklist" ]]; then
  echo "Recusado: rode com a flag --confirmo-que-li-o-checklist depois de ler o cabeçalho." >&2
  exit 1
fi

# 1) Garante o git-filter-repo (preferido sobre filter-branch)
if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "→ Instalando git-filter-repo via pip..."
  pip install --user git-filter-repo || pip3 install --user git-filter-repo
  export PATH="$HOME/.local/bin:$PATH"
fi

# 2) Backup do repositório atual (espelho) antes de reescrever
BK="../$(basename "$PWD")-backup-$(date +%Y%m%d%H%M%S).git"
echo "→ Backup espelho em: $BK"
git clone --mirror . "$BK"

# 3) Caminhos e padrões a expurgar de TODO o histórico
git filter-repo --force \
  --invert-paths \
  --path .env.production \
  --path .env.development \
  --path .env.local \
  --path dist.tar.gz \
  --path dispatch_log.json \
  --path dispatch_state.json \
  --path drsaude_fakes.json \
  --path email_sent_state.json \
  --path invites_sent_state.json \
  --path contacts_to_send.json \
  --path contatos_validos.json \
  --path contatos_invalidos.json \
  --path contatos-brisa.vcf \
  --path prescritores_abrace.csv \
  --path apepi_doctors.json \
  --path apepi_doctors_final.json \
  --path apepi_emails.json \
  --path scripts/prescritores_master_list.json \
  --path scripts/contatos-enf-brisa.vcf \
  --path scripts/email_campaign_progress.json \
  --path scripts/emails_concluidos.json \
  --path-glob 'campaign_log_*.json' \
  --path-glob 'mined_doctor_leads*.json' \
  --path-glob 'lista_500_medicos_qualificados.*' \
  --path-glob 'apepi_*.html' \
  --path-glob 'contatos_*' \
  --path-glob 'emails_*.json' \
  --path-glob '*.vcf' \
  --path-glob 'pharmacies_raw.json' \
  --path-glob 'scripts/whatsapp_session/*' \
  --path-glob '**/whatsapp_session/*'

echo
echo "✅ Histórico reescrito localmente."
echo "   Revise e depois: git push --force --all origin && git push --force --tags origin"
echo "   (o remote 'origin' foi removido pelo filter-repo; re-adicione se necessário:"
echo "    git remote add origin https://github.com/ricodoutor-pixel/consultorio-medico-inteligente )"
