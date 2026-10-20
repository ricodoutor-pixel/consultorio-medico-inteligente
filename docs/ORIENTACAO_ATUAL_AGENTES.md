# Orientação atual para todos os agentes — Planta y Raiz

Atualizado em 20/10/2026. Leia este documento e o `AGENTS.md` antes de executar tarefas.

## 1. Fonte oficial e limites

- O backend oficial é o Lovable Cloud vinculado a este projeto, identificado internamente em `supabase/config.toml` por `shmbwdjuddvquszwkvuq`.
- O ambiente `tkxxoghzhvhjzdoomgss` é legado e não é destino autorizado de cadastros, pagamentos, documentos, migrações ou consultas operacionais.
- A VPS Hostinger é o ambiente principal das automações Brisa/n8n. Isso **não** significa que o banco de cadastros deva ser migrado para outro projeto.
- O frontend oficial é publicado na Hostinger a partir do repositório. A publicação do frontend e a disponibilização das funções do Lovable Cloud são operações distintas.

## 2. Incidente de conexão relatado em 20/10/2026

O relatório externo enviado pelo Dr. Edilson informa uma troca do cliente e das variáveis de ambiente para o ambiente legado. O código disponível confirma um fallback legado no cliente gerado e o identificador oficial em `supabase/config.toml`; isso não confirma sozinho qual destino cada versão publicada utiliza.

Na verificação inicial desta conversa, o controle de estado do Lovable Cloud informou inicialização/alterações. Na conferência seguinte, informou **backend saudável, com banco e autenticação acessíveis**. Uma consulta somente leitura ao banco oficial às 15:24:39 UTC de 20/10/2026 retornou 38 registros em `doctors`, 147 em `doctor_kyc_documents`, 57 em `profiles` e 1 em `vendors`. Esses totais não equivalem a médicos aprovados, pacientes ou farmácias aprovadas: exigem filtros específicos.

**Divergência confirmada no navegador nesta conversa:** requisições da prévia em `localhost:8080` usam o banco oficial; requisições de `https://www.plantayraiz.com.br` usam o ambiente legado. A disponibilidade do oficial não corrige automaticamente a configuração da versão publicada. Não foi confirmada a autoria/data do commit alegado pelo relatório externo. Uma falha de DNS, isoladamente, não prova pausa, perda de dados ou autorização para trocar o banco.

**Não houve troca de conexão, restauração, exclusão nem publicação durante esta organização.**

Procedimento obrigatório:
1. Conferir o estado atual pelo controle do Lovable Cloud. Enquanto estiver iniciando ou alterando, aguardar e conferir novamente; não executar migrações ou escritas pesadas.
2. Quando estiver saudável, consultar somente o banco oficial e registrar data, fonte e filtros dos resultados.
3. Conferir o destino efetivamente usado pelo navegador publicado e pela prévia, sem expor credenciais.
4. Se houver divergência, apresentar o diagnóstico e obter confirmação do Dr. Edilson antes de qualquer mudança estrutural. No Lovable, não editar os arquivos gerados `client.ts`, `previewAuthStorage.ts`, `types.ts`, `.env` ou as configurações de projeto em `supabase/config.toml`.
5. Se o backend saudável continuar inacessível, tratar como incidente de infraestrutura; não apontar o site para um banco antigo como contorno.

## 3. Relatórios não são dados atuais nem backups completos

- Quantidades de médicos, documentos, pacientes e farmácias de setembro/outubro são retratos da data da consulta, não totais atuais.
- A comparação de **34 médicos / 131 documentos** do relatório externo não foi validada por uma consulta atual nesta conversa.
- Arquivos JSON de auditoria e históricos de mensagens não demonstram backup integral de autenticação, tabelas, arquivos privados, vínculos, funções e permissões. Não restaurar a plataforma a partir deles sem inventário e validação.
- Caminhos `C:\\Users\\...` pertencem ao computador do outro agente; não representam arquivos disponíveis no Lovable.
- Nenhum agente pode presumir acesso administrativo por seu nome constar numa lista. Usar apenas acessos realmente disponíveis e autorizados, sem pedir nem divulgar segredos no chat.

## 4. Vitrine pública não é cadastro administrativo

- Preservar os perfis-base da vitrine e enriquecê-los com os registros públicos do banco, conforme `AGENTS.md`.
- Não inserir perfis-base como novos cadastros administrativos e não contá-los como registros reais do banco.
- Para listar novos profissionais fora da vitrine, comparar registros atuais por identificador e CRM/UF; distinguir cadastro incompleto, pendente, aprovado, rejeitado e duplicado. Um nome encontrado no código não comprova cadastro.
- Aprovação de profissionais, KYC e farmácias continua manual. Não alterar cards, fotos, CRM, ordenação, preços ou disponibilidade nesta organização.
- Não apagar dados reais, anexos, contas ou registros de pagamento para reconciliar listas.

## 5. Ordem de leitura e evidências

1. `AGENTS.md`: regras de arquitetura e proteção da plataforma.
2. Este documento: orientação operacional atual e incidentes não resolvidos.
3. `docs/BANCO_UNIFICADO_PLANTA_Y_RAIZ.md`: governança dos cadastros e preservação de documentos.
4. `.lovable/memory/technical/deployment-pipeline.md`: processo de publicação.
5. `roadmap.md`: tarefas e bloqueios, não prova de execução.

Relatórios históricos não substituem essas regras. Toda conclusão deve distinguir **confirmado agora**, **relatado por terceiro** e **ainda não verificado**. Não afirmar que uma migração ou publicação ocorreu sem evidência; não transformar indisponibilidade em autorização de migração.

## 6. Próximo passo aguardando confirmação

O Lovable Cloud oficial está acessível. A versão publicada ainda consulta o legado; corrigir essa conexão exige confirmação explícita do Dr. Edilson e ajuste autorizado no ambiente de publicação. Não migrar nem mesclar dados do legado automaticamente. A organização documental não recupera nem migra o backend.