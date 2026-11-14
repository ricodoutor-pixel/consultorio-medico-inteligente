# 🌿 PASSAPORTE TÉCNICO & ARQUITETURAL ANTIGRAVITY — PLANTA Y RAÍZ
**WeCann Planta y Raíz Mega Clínica Digital (plantayraiz.com.br)**  
**Diretor Técnico Médico & Fundador:** Dr. Edilson Bezerra da Silva  
**Versão:** 3.0 (Consolidada com o Manual Mestre de 2 Anos e Auditoria Evolution API)  
**Data:** 14 de Novembro de 2026  

---

## 🏛️ 1. PRINCÍPIOS PETREOS & DIRETRIZES INEGOCIÁVEIS (AGENTS.md)

1. **DNA da Plataforma & Vitrine Médica:**
   - Sob nenhuma hipótese alterar a identidade visual, paleta de cores, CRM, preços vigentes (Orientação Técnica R$ 30, Chat R$ 100, Vídeo R$ 150, Retorno R$ 90, Premium) ou os **38 especialistas verificados** de `src/data/professionals.ts`.
   - A vitrine médica pública enriquece os dados estáticos com o banco Supabase em tempo real, sem jamais derrubar os cartões dos médicos em caso de falha de rede.

2. **Segurança Financeira & Checkout 100% In-App:**
   - Todo pagamento é processado exclusivamente pelo gateway integrado (Mercado Pago).
   - O paciente **nunca sai do site** para pagar via Pix (QR Code e Copia e Cola renderizados na tela).
   - O recebedor oficial normalizado exibido é `"Planta y Raiz Ltda"` (nunca "Doutor Rico Ltda" nem pessoas físicas).
   - Bloqueio imediato com alerta administrativo para: pagamento duplicado, médico divergente ou valor fora da tabela canônica (`consultation-price.ts` / `payment-catalog.ts`).
   - Nenhum dinheiro real é movido e nenhum saque é pago em ambiente de testes sem ordem escrita do Dr. Edilson.

3. **Governança do Backend:**
   - O Lovable Cloud (`shmbwdjuddvquszwkvuq`) é a única fonte operacional autorizada de banco e autenticação.
   - O ambiente legado (`tkxxoghzhvhjzdoomgss`) está desativado para novas transações.

---

## 📱 2. A SKILL DE CONDUTA OPERACIONAL (EVOLUTION API / WHATSAPP / BRISA)

Consolidando a auditoria real das 2.276 conversas da Evolution API:

### 2.1 Tolerância Zero ao Spam
* **Trava Bi-Mensagem (2-Strike Rule):** Máximo de 2 mensagens consecutivas sem resposta do paciente. A 3ª mensagem NUNCA sai.
* **Rate Limiting:** Máximo de 1 mensagem/minuto por número; máx. 3 mensagens/dia para contatos frios.
* **Opt-Out Sagrado:** Ao receber qualquer variação de "pare", "não quero", "sair", o sistema envia 1 frase educada, seta `opt_out = true` no banco e remove o contato de todas as filas ativas permanentemente.
* **Idempotência:** A mesma mensagem (ou mesmo hash) jamais é enviada duas vezes no mesmo dia para o mesmo número.

### 2.2 Identidade, Persona e Verdade Clínica
* **O Agente Nunca Mente:** Apresenta-se como assistente virtual oficial da Planta y Raíz.
* **Áudios sem Transcrição:** Se não houver transcrição ativa, o agente informa com transparência: *"Recebi seu áudio, mas por aqui só consigo ler texto. Pode escrever em poucas palavras ou prefere falar com nossa equipe?"* (Proibido dizer "ouvi seu áudio com todo carinho").
* **Sanitização de Nomes:** Nomes são lidos exclusivamente do cadastro oficial. Jamais usar `pushName` do WhatsApp (evitando "Olá, Dr. Franciscopego263!" ou "Olá, Recepção!").
* **Erro Interno Fica em Casa:** Erros de modelo, timeout ou banco geram log interno silencioso com alerta ao time. A frase *"Estou com muitos atendimentos agora..."* está terminantemente proibida de ir ao cliente.

### 2.3 Blindagem Jurídica e RDC 660/2022
* A Planta y Raíz atua sob o CNAE 6209-1/00 (Intermediação digital em saúde). Não há venda de estoque nem comércio direto.
* Intermediação tecnológica entre paciente, médico prescritor habilitado e suporte à importação individual direta autorizada pela Anvisa.

---

## 🚀 3. BENCHMARKING BLISS & VISÃO DE 2 ANOS

* **Foco Clínico Estratégico:** Insônia (72% da população), Ansiedade (Brasil #1 da OMS), Dor Crônica, Autismo e Longevidade.
* **Canais Complementares:** Chat leve no app (atendendo conexões 3G precárias no interior do Brasil) + Vídeo para avaliações aprofundadas.
* **Demanda Opaca (Yield Management):** Orientação Técnica a R$ 30 como porta de entrada de alto volume, preenchendo horários ociosos do corpo clínico sem desvalorizar os profissionais.
* **Harmonia dos Especialistas:** Preservação e valorização dos 38 médicos já verificados na vitrine, gerando demanda sustentável antes de abrir novas vagas.
* **Cuidado Contínuo (O Segredo da Retenção 80%):** Acompanhamento ativo com a Enfª Brisa em 7, 15 e 30 dias (e 4h após chegada do produto importado) para adaptação posológica, monitoramento de sono e alívio da dor.

---

## 🗺️ 4. A JORNADA EM 4 ETAPAS DA PLANTA Y RAÍZ

1. **Etapa 1 — Anamnese Prévia Estruturada:** 20 a 28 perguntas de triagem clínica, estilo de vida e saúde mental. O médico abre o prontuário com o mapa completo já renderizado.
2. **Etapa 2 — Consulta Ágil & Humanizada:** Atendimento por chat ou vídeo (45 min), prescrição digital válida com assinatura ICP-Brasil.
3. **Etapa 3 — Desembaraço da Importação:** Acompanhamento da autorização Anvisa e rastreio porta a porta da remessa internacional.
4. **Etapa 4 — Cuidado Contínuo:** Suporte de enfermagem e monitoramento longitudinal com a Enfª Brisa.

---

## 💻 5. ESTADO ATUAL DO CÓDIGO (Commit 645e169)

* **Compilação e Verificação:**
  - `npx tsc -p tsconfig.app.json --noEmit` -> **0 erros**.
  - `npx vitest run src/lib/doctor-presence.test.ts src/lib/telemedicine-checkout.test.ts` -> **100% aprovado**.
  - `npm run build` -> **Produção compilada com sucesso**.
* **Vitrine & Inicialização:**
  - `src/hooks/useRealProfessionals.ts` estabilizado com import de `evaluateDoctorPresence`, cache `sessionStorage` e `Promise.allSettled`.
  - `src/App.tsx` otimizado: `DashboardDiretoria` em `lazyWithRecovery`, `QueryClient` afinado (`staleTime: 60s`), preloader em idle time para rotas críticas (`/profissionais`, `/consulta`, `/orientacao-tecnica`).
* **Telemedicina Padronizada:**
  - Modal Pix integrado na tela em `src/pages/Agendamento.tsx` e `src/pages/ConsultaMedica.tsx`.
  - Painel de observabilidade em `src/components/admin/ConsultationObservabilityPanel.tsx`.
  - Painel do médico e saque Pix com chave mascarada em `src/pages/Consultorio.tsx`.
