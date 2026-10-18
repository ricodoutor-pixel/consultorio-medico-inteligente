# Relatório de Resgate de Documentos e Cadastros Médicos (KYC)

> **Data de execução:** 18 de Outubro de 2026  
> **Responsável:** Agente de Engenharia Clínica & Integração WhatsApp  
> **Destinatário:** Dr. Edilson Bezerra — Diretor Técnico e Fundador  
> **Status:** 100% dos documentos resgatados e ingeridos no Supabase Storage e na tabela `doctor_kyc_documents`.  
> **Acesso Administrativo:** Disponíveis para aprovação e conferência em [`/admin/aprovacoes-medicas`](https://plantayraiz.com.br/admin/aprovacoes-medicas).

---

## 1. Resumo Executivo

Foram recuperados **100% dos arquivos e mídias** enviados por médicos via WhatsApp nos últimos 60 dias diretamente do banco da Evolution API (`evolution_api.Message`), classificados conforme as diretrizes do CFM e da LGPD, e persistidos em armazenamento seguro e privado no bucket `doctor-kyc-documents` do Supabase ativo (`shmbwdjuddvquszwkvuq`).

Além dos documentos, todos os pré-cadastros de médicos que enfrentaram dificuldades no site ou que enviaram mensagens no WhatsApp foram consolidados na tabela `doctors` com status `pending` e `is_approved_by_admin = false`, permitindo a conferência e aprovação com um clique no painel do Dr. Edilson.

---

## 2. Médicos com Documentos Resgatados e Status no KYC

| Médico | Telefone (4 dígitos finais) | O que foi recuperado | O que ainda falta | Data de Recebimento | Status no Painel KYC |
|---|---|---|---|---|---|
| **Dra. Edna Marlisia Bezerra Costa** | `...3793` | • CNH Digital Oficial (PDF)<br>• Cédula Profissional (Frente - JPG)<br>• Cédula Profissional (Verso - JPG)<br>• Comprovante de Endereço (JPG) | *Cadastro completo* — Nenhum documento pendente | 17/10/2026 | **Pendente de Revisão** (Ficha criada) |
| **Dr. Milton Dimas Tadeu Urban** | `...9947` | • Certificado Digital VIDaaS (PDF com assinatura ICP-Brasil)<br>• Comprovante de Endereço da Clínica (PDF)<br>• Identidade / Cédula Profissional (PDF)<br>• Cédula Frente e Verso (JPG)<br>• Comprovante CPF (JPG) | *Cadastro completo* — Nenhum documento pendente | 07/10 e 08/10/2026 | **Pendente de Revisão** (Ficha completa) |
| **Dra. Verônica Christine de Paiva Silva** | `...2302` | • Cédula Profissional Frente (JPG)<br>• Cédula Profissional Verso (JPG)<br>• Comprovante de Endereço (JPG)<br>• Foto de Perfil Oficial em Jaleco (JPG)<br>• Validação Prescrição Digital CFM via link oficial | *Cadastro completo* — Nenhum documento pendente | 16/10/2026 | **Pendente de Revisão** (Ficha completa) |
| **Dra. Mariana Alves Rezende** | `...0923` | • CNH Digital Oficial (PDF)<br>• Cédula Profissional Frente (JPG)<br>• Cédula Profissional Verso (JPG)<br>• Comprovante de Endereço (JPG)<br>• Certidão CFM (PNG) | *Cadastro completo* — Nenhum documento pendente | 08/10/2026 | **Pendente de Revisão** (Ficha completa) |
| **Dr. Sadi Roberto Menta** | `...9146` | • Identidade Oficial Médica (JPG)<br>• Receita Digital com Assinatura Eletrônica (PDF) | Comprovante de endereço residencial/clínica | 07/10/2026 | **Pendente de Revisão** (Ficha criada) |
| **Dr. José Geraldo Barbugli Abbade Filho** | `...0176` | • Receita Digital Assinada ICP-Brasil (PDF)<br>• Documento Adicional / Transferir (PDF)<br>• Cédula Frente e Verso (JPG)<br>• Identidade e CPF (PDF) | *Cadastro completo* — Nenhum documento pendente | 07/10/2026 | **Pendente de Revisão** (Ficha criada) |
| **Dr. Frederico Menezes** | `...9585` | • Ficha cadastral pré-preenchida em `doctors`<br>• Perfil criado e vinculado | Envio de cópia da Cédula e Comprovante de Endereço | 17/10/2026 | **Pendente de Documentação** (Ficha criada) |
| **Dr. Gustavo Pereira** | `...7389` | • Ficha cadastral pré-preenchida em `doctors`<br>• Perfil criado e vinculado | Envio de cópia da Cédula e Comprovante de Endereço | 17/10/2026 | **Pendente de Documentação** (Ficha criada) |

---

## 3. Segurança e Privacidade (LGPD & CFM)

- **Armazenamento Privado:** Todos os documentos (cédulas, CNHs, comprovantes de residência) foram gravados no bucket `doctor-kyc-documents` do Supabase, com permissão de leitura restrita a administradores autenticados via RLS (`has_role('admin')`).
- **Nenhum Dado Sensível Exposto:** Os números de CPF, RG e registros completos foram omitidos deste relatório para total conformidade com a LGPD.
- **Link Direto de Aprovação:** A equipe técnica e o Dr. Edilson podem visualizar e deferir cada médico acessando a rota restrita:
  👉 [`https://plantayraiz.com.br/admin/aprovacoes-medicas`](https://plantayraiz.com.br/admin/aprovacoes-medicas)
