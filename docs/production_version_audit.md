# Relatório de Auditoria Forense — Produção vs. Código-Fonte
**Projeto**: Planta y Raiz (`consultorio-medico-inteligente`)  
**Data**: 05 de Setembro de 2026  
**Auditor**: Agente de Engenharia de Software Antigravity  
**Supabase de Produção Oficial**: `tkxxoghzhvhjzdoomgss.supabase.co`

---

## 1. Sumário Executivo

A auditoria forense identificou e neutralizou a divergência que fazia a interface de administração em produção (`https://plantayraiz.com.br`) exibir cerca de 70 médicos com dados fictícios (incluindo CPFs pré-fixados, endereços IP arbitrários e hashes estáticos), enquanto a base de dados real do Supabase continha estritamente os profissionais autenticamente cadastrados.

---

## 2. Evidências Coletadas nos Bundles em Produção

A inspeção dos assets estáticos servidos no domínio público revelou:

1. **Configuração de Supabase Incorreta no Bundle Anterior**:
   - O arquivo `assets/index-DAciYwnE.js` apontava para a instância legada de testes/staging:
     `https://shmbwdjuddvquszwkvuq.supabase.co`
   - Em contraste, as variáveis de ambiente e o banco ativo homologado são:
     `https://tkxxoghzhvhjzdoomgss.supabase.co`

2. **Strings Fictícias Compiladas no Frontend**:
   - `assets/AdminAprovacoes-NY8oY5P-.js`:
     Continha a string literal de CPF fictício `"054.764.445-90"` e IP `"187.12.84.190"`.
   - `assets/DoctorContractViewerModal-NkaIjFCP.js`:
     Continha fallback de IP `"187.12.84.190"` e hash mockado gerado estaticamente.

3. **Fallback Híbrido no Código-Fonte Local (`src/hooks/useDoctors.ts`)**:
   - Em caso de falha de requisição ou ausência de dados, o hook invocava:
     `mockProfessionals.map(mapMockToDoctorRow)`
   - Esse catálogo mock continha dezenas de médicos estáticos que preenchiam a tabela de aprovações com CPFs gerados em formato verídico (`307.403.190-14`), conferindo aparência de registros reais.

---

## 3. Causa-Raiz (Root Cause)

A divergência decorreu de dois fatores combinados:
1. **Pipeline de Deploy Desconectado**:
   O build servido pelo Cloudflare Pages / Hostinger correspondia a uma compilação de staging antiga (apontando para o projeto Lovable `shmbwdjuddvquszwkvuq`) e não havia sido reconstruído a partir da branch principal apontando para o Supabase de produção (`tkxxoghzhvhjzdoomgss`).
2. **Mecanismo de Resiliência Indevido no Frontend**:
   A presença de coleções estáticas (`data/professionals.ts`) utilizadas como fallback automático no hook de dados administrativos mascara falhas de conectividade e contamina a auditoria com dados simulados.

---

## 4. Ações Corretivas Executadas

1. **Expurgo de Fallbacks Fictícios no Código-Fonte**:
   - `src/hooks/useDoctors.ts`: Removido todo e qualquer fallback para `mockProfessionals`. Em caso de erro de rede ou banco vazio, o hook retorna estritamente a lista vazia (`[]`) e registra o erro no log.
   - `src/pages/admin/AdminAprovacoes.tsx`: Removida correspondência de nomes e CPFs com `testProfessionals`.
   - `src/components/admin/DoctorKycPipeline.tsx`: Removido array `DEFAULT_DOCTORS` com CPFs fictícios.
   - `src/components/admin/DoctorContractViewerModal.tsx`: Substituídos dados fictícios por indicadores claros de ausência de dado ("CPF não informado", "IP não capturado", "Hash não disponível").
2. **Integração do Contrato no Banco de Dados**:
   - Migrado do `localStorage` para a tabela `doctor_contracts` e colunas auditadas em `doctors`.
3. **Trava Mandatória de Homologação**:
   - Implementadas regras frontend e backend via trigger (`validate_doctor_approval_prerequisites`) exigindo CRM válido, CPF de 11 dígitos, documento KYC verificado e contrato CFM assinado antes da liberação de qualquer perfil.

---

## 5. Recomendações para o Deploy de Produção

1. Executar um build limpo (`npm run build`).
2. Configurar as variáveis de ambiente no Cloudflare Pages:
   - `VITE_SUPABASE_URL=https://tkxxoghzhvhjzdoomgss.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=[chave pública de produção]`
3. Limpar o cache de borda (Cloudflare Purge Everywhere) após o novo upload.
