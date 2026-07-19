# Funções Supabase Edge — Estado Real de Produção

> **Gerado em 19/07/2026 por sincronização reversa (Supabase → GitHub).**
> Este documento reflete o que está **de fato implantado e ativo** no projeto Supabase `tkxxoghzhvhjzdoomgss`, não o inventário completo de arquivos presentes no repositório.

## ⚠️ Aviso importante

O diretório `supabase/functions/` deste repositório contém mais de 200 arquivos de função, mas **apenas 5 estão realmente implantadas (deployed) no projeto Supabase de produção** hoje. Os demais arquivos podem estar desatualizados, nunca implantados, ou substituídos por versões editadas diretamente no painel Supabase/Lovable sem retornar ao Git. Antes de assumir que qualquer arquivo em `supabase/functions/` reflete a produção, confirme via `list_edge_functions` no projeto real.

## As 5 funções oficiais em produção

| Função | Papel | Observação |
|---|---|---|
| **`whatsapp-brisa-bot`** | **Handler canônico do WhatsApp / WAHA.** Recebe o webhook de mensagens do WAHA (sessão `default`, Railway), gera resposta via Gemini (Lovable Gateway → Gemini 1.5 Pro direto como fallback) e envia via WAHA como canal primário, com Evolution API apenas como fallback secundário. | v45, atualizada com frequência — é o "coração" do atendimento da Enfermeira Brisa. |
| **`brisa-waha-connect`** | Gerencia a sessão WAHA: status da conexão, geração de QR code, start/stop/restart da sessão, registro do webhook no WAHA, e disparo de mensagens de teste (`?action=test&phone=...`). | Ponto central para operação/diagnóstico do canal WAHA. |
| **`brisa-bot`** | Variante alternativa de bot de atendimento, também WAHA-nativa com fallback Evolution. | Verificar com a equipe se está em uso paralelo ou é redundante ao `whatsapp-brisa-bot`. |
| **`brisa-health-check`** | Monitoramento: testa conectividade WAHA, Evolution, banco de dados e presença de secrets configurados. Retorna score de saúde GREEN/YELLOW/RED. | Usado para dashboards de status. |
| **`create-video-room`** | Cria salas de telemedicina via Jitsi para consultas, em conformidade com CFM 2.314/2022. | Não relacionado ao fluxo de WhatsApp. |

## Canal WAHA — como é a "fonte da verdade"

- URL do WAHA: `https://waha-production-4e9c.up.railway.app`
- Sessão: `default`
- O webhook do WAHA deve apontar para: `https://tkxxoghzhvhjzdoomgss.supabase.co/functions/v1/whatsapp-brisa-bot`
- Evolution API é tratada como **fallback legado** dentro do próprio `whatsapp-brisa-bot` e `brisa-bot` — não é mais o canal primário.

## Recomendação para manutenção futura

Antes de editar qualquer uma dessas 5 funções pelo GitHub e fazer push, **confirme que não houve edição direta no painel Supabase/Lovable** desde a última sincronização — não existe hoje um pipeline de CI/CD que sincronize automaticamente o repositório com o projeto Supabase (verificado em `.github/workflows/`, que só contém monitoramento e deploy de site estático, não deploy de funções). Uma sincronização reversa (Supabase → GitHub) como esta deve ser repetida periodicamente até que essa automação exista.
