# Relatório de Auditoria — Robô Enfermeira Brisa (WhatsApp)
**Período Auditado:** Últimos 30 dias (Dados consolidados em 18/10/2026)  
**Fontes dos Dados:** Workflow n8n ativo (`LdAWxfIxg0s67H32`), logs do agendador PM2 (`brevo_whatsapp_inviter.log`), logs do motor de respostas (`evolution_brisa_responder.log`) e banco Supabase de produção (`shmbwdjuddvquszwkvuq`).

---

## 1. Métricas Quantitativas Consolidadas

| Métrica | Quantidade | Observações e Diagnóstico |
|---|---|---|
| **Total de Contatos Interagidos** | **179 contatos** | Contatos com histórico completo preservado no n8n static data. |
| **Total de Mensagens Recebidas (Inbound)** | **333 mensagens** | Médicos, secretárias de clínicas, veterinários e respostas automáticas. |
| **Total de Mensagens Enviadas pela Brisa** | **300 mensagens** | Respostas automáticas de acolhimento, roteamento e mensagens de pagamento. |
| **Convites em Massa Enviados (Amostra Log)** | **2.101 eventos** | Disparados via PM2 a cada 15 min exatos a partir da lista 6 do Brevo (102k médicos). |
| **Contatos que Enviaram Mídia / Documentos** | **7 profissionais** | Dra. Edna, Dr. Milton, Dra. Mariana, Dr. Frederico, etc. (Tratados como pagamento pelo n8n). |
| **Contatos que Solicitaram Atendente Humano** | **2 médicos** | Dr. Anderson Thomaz e Dr. Frederico (ambos ignorados pela IA, que insistiu na venda). |
| **Contatos com Respostas Duplicadas / Loops** | **6 contatos** | Casos graves de loop como Dr. Darwin (10 mensagens em 10 minutos após pedir exclusão). |
| **Público Inadequado Abordado** | **> 35 contatos** | Veterinários (M.V.), clínicas/empresas, secretárias, dentistas e psicólogos. |

---

## 2. Disparos Noturnos e Distribuição por Horário

O agendador `brevo-whatsapp-inviter` rodava em loop infinito com `CADENCE_MS = 15 * 60 * 1000` (15 minutos exatos), sem checagem de dia da semana ou fuso horário.

### Distribuição dos Convites por Faixa Horária (Log Inviter):

| Faixa Horária | Convites Registrados | Status |
|---|---|---|
| **Madrugada (00h às 05h)** | **649 convites (30,8%)** | 🔴 **CRÍTICO:** Médicos acordados de madrugada com mensagens no WhatsApp. |
| **Início da Manhã (06h às 08h)** | **200 convites (9,5%)** | ⚠️ Horário impróprio (antes das 09h). |
| **Horário Comercial (09h às 18h)** | **1.007 convites (47,9%)** | 🟢 Janela adequada para prospecção B2B. |
| **Noite (19h às 23h)** | **245 convites (11,6%)** | ⚠️ Horário de descanso médico. |

*Exemplo confirmado em 18/10/2026:* 10 convites disparados entre 00h07 e 02h22, um a cada 15 minutos, para contatos cadastrados no Brevo.

---

## 3. Falhas Estruturais Auditadas

### 3.1. Duplicação de Título e Nomes Mal Montados
- **Causa:** A função `cleanDoctorName()` removia apenas `^(dr|dra|médico|médica)`, não tratando `Dr(a).` ou `Dr.` com parênteses. Ao concatenar com o template `"Olá, Dr(a). ${cleanDoctorName(name)}"`, gerava:
  - `"Olá, Dr(a). Dr(a). Letícia Coelho"`
  - `"Olá, Dr(a). Dr(a). Verônica Christine de Paiva Silva"`
  - `"Olá, Dr(a). Dr(a). Aline Paiva Noble"`
  - `"Olá, Dr(a). Dr(a). Bibiana Lima Peres Ely"`
- **Sobrenome Cortado:** Divisão por preposições gerando tratamentos truncados como `"Dr(a). André Da"` (nome real: André da Silveira Ribeiro Lins).
- **Pessoa Jurídica tratada como Médico:** Contato registrado como *"Dr. mais próximo de você"* virou `"Dr(a). Dr(a). Mais Próximo"`.

### 3.2. Mídias e Documentos KYC Tratados como Pagamento
- **Causa:** O workflow n8n ativo possuía a regra:
  ```javascript
  else if (hasMedia || /(paguei|pago|pagamento|comprovante|pix|transa[cç])/.test(low)) route = 'comprovante';
  ```
  Isso fazia com que **qualquer arquivo de mídia** (PDF de diploma, cédula do CRM, comprovante de endereço ou foto de CNH) caísse no nó `Mensagens Comprovante`, disparando o texto:
  > *"Recebemos sua mensagem sobre o pagamento 🌿 Nossa equipe está confirmando no sistema. Assim que for confirmado, o Dr. Edilson Bezerra ON (assistente de IA) inicia sua Orientação Técnica aqui mesmo."*
- **Vítimas confirmadas:** Dra. Edna Marlisia (mandou 4 PDFs de documentos e recebeu a mensagem de pagamento duas vezes), Dr. Milton Urban, Dra. Mariana Alves, Dr. Frederico Menezes.

### 3.3. Médico Tratado como Paciente (Inversão de Papéis)
- Médicos convidados tiravam dúvidas sobre prontuário, retorno de pacientes e honorários, e a Brisa respondia com ofertas de venda para paciente:
  - **Dr. Anderson Thomaz:** Perguntou: *"e o acompanhamento como é feito , ajuste de dose como oriento a paciente"*.  
    **Brisa respondeu:** *"Para o ajuste de dose e acompanhamento, o ideal é que o paciente agende a Orientação Técnica com o Dr. Edilson Bezerra. Por apenas 30 reais via Pix..."*  
    **Dr. Anderson reclamou 3 vezes:** *"Essa resposta é para o paciente"*, *"Essas respostas são para os pacientes, mas entendi"*, *"Por favor eu gostaria de falar com um atendente humano"*. A Brisa continuou mandando mensagens automáticas de paciente.
  - **Dra. Camyla:** Perguntou *"como seria?"* sobre o convite e recebeu *"estou aqui para segurar a sua mão..."*.
  - **Dra. Marianna Coimbra:** Fez perguntas técnicas sobre marcas autorizadas ANVISA e recebeu ofertas de consulta de R$ 150.

### 3.4. Atendimento a Veterinários e Profissionais de Outros Conselhos
- **Veterinários:** 
  - `"Meu Cão Raiz – M.V. Gutemberg Lima"` recebeu convite e depois resposta oferecendo cannabis para pets e link de shopping.
  - `Dra. Kira (554797778254)`: Médica Veterinária trocou 13 mensagens explicando que atende cães e gatos.
  - `Dr. Edson (556181279289)`: Informou ser médico veterinário e que não tinha interesse; continuou no fluxo.
- **Dentistas e Clínicas:** `Clínica Dr. Breno de Melo` (secretária Michelle) e `B&K Odontologia` receberam textos de venda para pacientes.
- **Psicólogos:** Contato `5521987559031` avisou: *"Boa tarde não sou médico mas sim psicólogo"*, e a IA ofereceu consulta médica.

### 3.5. Insistência Após Recusa e Ignorância de Pedido Humano
- **Dr. Darwin Ribeiro Agendamento:** Solicitou a remoção do número da lista. A cada resposta dele, o robô disparava uma nova mensagem automática de confirmação, gerando um loop de 10 mensagens em menos de 10 minutos.
- **Dr. Frederico Menezes:** Avisou *"Tive dificuldade no cadastro"*; a Brisa respondeu com catálogo genérico em vez de enviar o passo a passo ou transferir para um atendente humano.

---

## 4. Tabela de Casos Reais Auditados (17–18/10/2026)

| Contato | O que o contato enviou | O que a Brisa respondeu | Classificação da Falha |
|---|---|---|---|
| **Dra. Edna Marlisia** (+55 84 9972-7982) | Enviou 4 PDFs: Cédula CRM, RG/CPF, Comprovante de Residência e Termo assinado VIDaaS. | Respondeu 2x: *"Recebemos sua mensagem sobre o pagamento... o Dr. Edilson Bezerra ON inicia sua Orientação Técnica"*. | **Crítica (Falso Pagamento / Documento ignorado)** |
| **Dr. Milton Urban** (+55 19 99905-9665) | Enviou documentos de identidade, CRM e endereço da clínica. | Mensagem de paciente sobre consulta e prontuário sem registrar na tabela KYC. | **Grave (Documento ignorado)** |
| **Dra. Mariana Alves** (+55 34 3197-0176) | *"Segue os documentos faltantes"* + envio de anexo. | *"Já estou registrando tudo no seu prontuário para que o médico possa analisar..."* | **Grave (Médica tratada como paciente)** |
| **Dr. Anderson Thomaz** (+55 11 97960-8870) | Perguntou sobre ajuste de dose e prontuário; pediu atendente humano 2 vezes. | Ofereceu Orientação Técnica de R$ 30 e ignorou a transferência para humano. | **Crítica (Humano ignorado / Venda inadequada)** |
| **Dr. Darwin Ribeiro** (+55 12 3239-9929) | *"Solicito novamente que removam este número da lista"*. | Entrou em loop disparando 10 mensagens de réplica consecutivas. | **Grave (Opt-out não respeitado / Loop)** |
| **Meu Cão Raiz (Gutemberg)** (+55 83 8755-7463) | Resposta automática da clínica veterinária sobre cães e gatos. | *"Olá, Dr. Gutemberg! Que mensagem acolhedora... Orientação Técnica em Nuvem (R$ 30)..."* | **Grave (Veterinário convidado / Auto-reply em loop)** |
| **Clínica Dr. Breno de Melo** (+55 79 9944-5546) | Secretária Michelle: resposta automática da clínica. | Texto longo de venda de telemedicina para paciente com preços e links. | **Média (Secretária tratada como paciente)** |
| **Dr. Gustavo** (+55 34 9198-7389) | *"Qual o repasse?"*, *"Quero me cadastrar"*, *"Modelo padrão"*. | 16 mensagens trocadas; dúvidas esclarecidas, mas cadastro travou no envio de docs. | **Oportunidade (Médico interessado aguardando resgate)** |
| **Dr. Frederico Menezes** (+55 32 8459-9585) | *"Tive dificuldade no cadastro"*, enviou prints dos dados. | Respondeu como desconhecido e não concluiu a liberação. | **Grave (Dificuldade de cadastro ignorada)** |

---

## 5. Próximos Passos Imediatos

1. **Etapa 1B — Resgate de Documentos e Cadastros Perdidos:**
   - Ingerir no bucket privado `doctor-kyc-documents` os documentos da **Dra. Edna Marlisia**, **Dr. Milton Urban**, **Dra. Mariana Alves**, **Dr. Frederico Menezes** e **Dr. Gustavo**.
   - Atualizar a tabela `doctor_kyc_documents` com `source='whatsapp_resgate'` e status `pending`.
   - Gerar `docs/resgate-kyc.md` para liberação no painel de aprovações médicas.

2. **Etapa 2 — Correções do Robô:**
   - Desativar a rota de WhatsApp do workflow n8n (para eliminar 100% dos falsos positivos de pagamento e duplicidades).
   - Bloquear disparos noturnos (`BRISA_COLD_OUTREACH_ENABLED=false`).
   - Aplicar filtro rígido de títulos, nomes compostos, veterinários, secretárias e clínicas.
