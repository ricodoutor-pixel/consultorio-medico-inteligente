# Relatório de Estado de Produção — Planta y Raiz

Destinatário: agente Claude
Data: 10/09/2026 (UTC)
Banco oficial único: projeto Lovable Cloud `shmbwdjuddvquszwkvuq`
Legado isolado (NÃO usar, não escrever): `tkxxoghzhvhjzdoomgss`
Domínios: https://www.plantayraiz.com.br (produção) · https://consultorio-medico-inteligente.lovable.app

---

## 1. Números reais no banco (consulta direta, não estimativa)

| Item | Valor |
|---|---|
| Médicos cadastrados (`doctors`) | 23 |
| Médicos com `kyc_status='verified'` | 18 |
| Documentos KYC (`doctor_kyc_documents`) | 37 |
| Cards públicos (`doctors_public`) | 22 |
| Farmácias/lojistas (`vendors`) | 1 (Planta y Raiz Ltda — farmácia modelo) |
| Produtos de vitrine (`vendor_products`) | 1 |
| Perfis totais (`profiles`) | 36 |
| Slots de agenda (`doctor_availability`) | 1.156 |
| Artigos científicos para RAG (`scientific_articles`) | 5.348 |

Observação importante: NÃO são 71 médicos nem 13 documentos, e NÃO existem 40 mil artigos. Qualquer relatório com esses números está desatualizado ou lendo o banco legado.

---

## 2. PRONTO PARA PRODUÇÃO

### Identidade, dados e governança
- Fonte de dados unificada: um único banco. Todo cadastro novo entra por Auth → `profiles` → `doctors`/`vendors`/paciente → documentos privados.
- Nenhum profissional se autoaprova: KYC entra sempre como pendente e exige ação de admin.
- Catálogo limpo: cadastros fictícios/de teste removidos; permanece apenas 1 perfil demonstrativo por categoria não médica.
- RBAC via `user_roles` + `has_role()` (não há policy baseada em `app_metadata`).
- Auditoria de IA existente em `ai_events` (não criar tabela nova duplicada).
- LGPD: consentimento unificado (cookies + termos legais em um único aceite), `user_consents`, `tcle_consents`, mascaramento de PII, deleção de dados.
- Compliance: plataforma de intermediação tecnológica (rodapé, Termos de Uso, TCLE e fluxos alinhados), selo ANVISA/RDC 660.

### Médicos e KYC
- Página de aprovações médicas e de pacientes lendo dados reais, ordenação por completude de documentos.
- Ordem fixa da vitrine: Dr. Edilson, Dra. Suelen, Dr. Daniel; depois por número de anexos.
- Prints de conselho acessíveis em um clique na tela de KYC.
- Avatares oficiais padronizados (512×512, bucket `avatars/doctors`); original enviado pelo médico preservado no KYC.
- Casos especiais tratados: Dr. Daniel com dois registros válidos (RO e MT); Dra. Olivia identificada por Col Med Cba (atende Cochabamba, Bolívia, sem menção a conselho brasileiro).

### Consultas, agendamento e roteamento
- Roteamento server-side `route_consultation_doctor`: pontua completude (KYC, assinatura digital, Pix, verificação, conta de recebimento, telefone, agenda). Hoje o Dr. Daniel lidera (21 vs 14 do segundo) e recebe as consultas independentemente da escolha visual, migrando automaticamente quando outro médico completar o cadastro.
- Agenda do Dr. Daniel provisionada (slots de 30 min) e status online/disponível.
- Consultório virtual por Jitsi, com links dedicados: médico `/consultorio?appointment={id}`, paciente `/orientacao-video?appointment={id}`.
- Notificações automáticas de consulta/agendamento: e-mail + WhatsApp (WAHA como canal principal, Evolution como fallback) + notificação interna, para médico e paciente.

### Agentes de IA
- Personas separadas com o mesmo cérebro Gemini: Enf. Brisa (triagem curta) e Dr. Edilson Bezerra ON (orientação técnica).
- Sessão paga de orientação técnica com limite de 30 minutos (`ot_agent_sessions` + watchdog a cada 5 min encerrando sessões expiradas).
- RAG científico ligado ao bot (5.348 artigos).
- QR de conexão WhatsApp disponível em `/admin/brisa-whatsapp-qr`.
- Bloqueio de disparo em massa: contato externo acima de 20 destinatários exige aprovação manual.

### Pagamentos
- Mercado Pago é o único gateway ativo (Stripe desligado). Split: 7% plataforma / 93% médico em consultas; 5% plataforma / 95% lojista no Shopping.
- Checkout server-authoritative: preço e itens validados no servidor (`shopping-order-create`, `mp-checkout`), carrinho preservado em falha.
- Carteira do médico acumula saldo; saque só sob solicitação: `request_doctor_pix_payout` / `settle_doctor_pix_payout`, mínimo R$50, taxa 5%, débito atômico com estorno em falha; fila manual como fallback.
- Pix do Dr. Daniel cadastrado (tipo CPF). Saldo atual R$0,00.
- Preços oficiais: Orientação R$30 · Retorno R$90 · Chat R$100 · Vídeo R$150 · planos universais R$99.

### Farmácias / Shopping
- Cadastro de lojista pronto para o primeiro cadastro real: KYC com upload privado, `vendor_terms_consents` com aceite imutável (versão + hash SHA-256), estado inicial pendente/inativo, `mp_collector_id` obrigatório.
- Vitrine só exibe `is_active=true` + `is_kyc_approved=true`.
- Oferta destacada: 1 produto por farmácia no card e na vitrine, trocável a qualquer momento.
- Painéis: receitas recebidas com protocolo, guia de onboarding em 7 passos, aba financeira com conta de recebimento.
- Dispensação de receitas com hash SHA-512 e inbox `pharmacy_prescriptions_inbox`.

### Frontend / performance
- Boot estático imediato no `index.html`, removido no mount (correção de tela preta/lentidão, iOS incluído).
- Erros de extensões do navegador (MetaMask/Web3) filtrados para não derrubar a página.
- Safe-area iOS, CSP/Permissions-Policy, preconnect, compressão, imagens otimizadas.
- Build e typecheck passando (`tsgo --noEmit -p tsconfig.app.json`, `vite build`).

---

## 3. PENDÊNCIAS (não declarar 100% validado)

1. **Service-role do banco legado exposta** em scripts externos — precisa ser revogada/rotacionada.
2. **Teste end-to-end autenticado com pagamento aprovado real** (consulta e Shopping) ainda não executado.
3. **Saque Pix**: não houve saque autenticado com saldo real; falta confirmar suporte do Mercado Pago ao Pix-out nessa conta.
4. **Bolívia**: nenhum teste feito a partir de IP boliviano; CDN/firewall/IPv6/TLS não confirmados externamente.
5. **Linter de segurança**: ~59 avisos de funções `SECURITY DEFINER` sem auditoria completa.
6. **Repasses de farmácia** dependem de `mp_collector_id` de cada lojista real (hoje só existe a farmácia modelo).
7. **Prerender SEO** desativado (script existe, não roda no build).

---

## 4. Regras invioláveis para qualquer agente

- Nunca escrever no projeto legado `tkxxoghzhvhjzdoomgss`.
- Nunca apagar dados reais de médicos, documentos KYC, pedidos ou pagamentos.
- Nunca autoaprovar profissional, KYC ou farmácia.
- Nunca alterar a aparência visual da plataforma sem pedido explícito.
- Manter Jitsi como infraestrutura de vídeo.
- Toda tabela nova em `public`: GRANT + RLS + policies na mesma migração.
- `esbuild.keepNames:true` e o chunk único `react-vendor` são obrigatórios no build.
