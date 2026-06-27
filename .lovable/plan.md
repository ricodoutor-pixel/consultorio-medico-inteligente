# Plano de execução — Refatoração Cadastro Médico + Onboarding Brisa

Tarefa grande com múltiplas frentes. Vou executar em blocos paralelos sempre que possível.

## 1. Storage — Bucket `medical-documents` (privado)
- Criar bucket `medical-documents` (privado).
- Estrutura de pastas:
  ```
  medicos/{slug_nome}_{cpf_ou_ci}/
    ├── foto_perfil.jpg
    ├── crm_frente.jpg
    ├── crm_verso.jpg
    └── dados_cadastro.json
  ```
- RLS em `storage.objects`:
  - Médico (auth.uid()) lê/escreve só sua pasta.
  - Admin lê tudo.
  - Service role acesso total.

## 2. Cadastro Médico (`src/pages/CadastroProfissional.tsx`)
- **Adicionar Plano Free** (acesso gratuito à plataforma — vê todos os cadastros, sem cobrança).
- **Remover toggle "Orientação Técnica"** do médico (OT é exclusiva da plataforma, R$30/US$10 fixo).
- Manter campo único: **valor da consulta** (videochamada + receita inclusos).
- **3 uploads obrigatórios**: foto de perfil, CRM frente, CRM verso.
- Mostrar card de exemplo (jaleco branco, esteto, fundo branco) como referência visual antes do upload.
- Upload vai direto pro bucket `medical-documents` na pasta do médico.

## 3. Edge Function `doctor-welcome-brisa`
- Triggered após cadastro aprovado.
- Envia WhatsApp via Evolution API com mensagem da Enf. Brisa:
  > "Olá Dr(a). {nome}! Bem-vindo(a) à Mega Clínica Planta y Raiz 🌱
  > E-mail de acesso: {email}
  > Senha temporária: {senha}
  > Seu dashboard: {link_dashboard}
  > Link público do seu perfil para compartilhar: {link_perfil}"
- Hook chamado ao final do `handleSubmit` do cadastro.

## 4. Foto padrão Dra. Olivia (IA)
- Gerar nova foto profissional via imagegen (jaleco branco, estetoscópio, fundo branco) baseada no rosto da carteira SEDES.
- Substituir `avatar_url` no registro doctors da Olivia.

## 5. Página `/admin-raiz`
- Nova rota protegida, **sem botão Google**, login email+senha only.
- Validação: somente users com role `admin` passam.
- Redireciona ao dashboard admin existente.

## 6. Acesso admin para `ricodoutor@gmail.com`
- Verificar se user existe; se não, criar via service role com senha `95654045Pa#`.
- Inserir role `admin` em `user_roles`.

## 7. Mensagem teste Brisa → Dr. Edilson
- Chamar `whatsapp-brisa-send` para `+55 11 98713-1241`:
  > "Olá Dr. Edilson, estou online ✅ — Enf. Brisa"

## 8. Completar cadastro Dra. Olivia
- Atualizar registro doctors:
  - CRM Bolívia Cochabamba: `Z-4466260` (Matrícula Min. Salud) / `Q-Z-014` (Colégio Médico)
  - Especialidade: "Cirurgiã — Especialista em Medicina Integrativa e Modulação do Sistema Endocannabinoide (CBD/THC)"
  - País: Bolívia, Cidade: Cochabamba
  - Foto: nova versão padronizada
- Salvar imagens dos carnets no bucket `medical-documents/medicos/olivia-zimeri_4466260/`

## Detalhes técnicos
- Migration: bucket + RLS + ensure role admin para ricodoutor.
- Edge functions novas: `doctor-welcome-brisa`. Reaproveitar `_shared/evolution.ts`.
- Frontend: editar `CadastroProfissional.tsx`, criar `src/pages/AdminRaiz.tsx`, adicionar rota.
- Não alterar visual existente do site — apenas a página de cadastro (campos novos) e nova rota admin.

## Ordem de execução
1. Migration (bucket + RLS + admin role + plano free no schema doctors se necessário).
2. Em paralelo: editar `CadastroProfissional.tsx`, criar `AdminRaiz.tsx`, criar edge `doctor-welcome-brisa`, gerar foto Olivia via IA.
3. Deploy edges, atualizar Olivia no DB, enviar mensagem teste.
4. Verificar build e fluxo end-to-end.

Confirma para eu executar?