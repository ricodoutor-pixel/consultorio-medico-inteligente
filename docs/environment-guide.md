# Guia de ambiente e configuração

## Objetivo
Este projeto deve manter um fluxo previsível entre desenvolvimento local, staging e produção, sem expor segredos no repositório.

## Regras
- Nunca commitar arquivos `.env` reais.
- Manter `.env.example` como template oficial.
- Variáveis públicas podem usar o prefixo `VITE_` apenas quando forem realmente seguras para o frontend.
- Segredos como `JWT_SECRET`, tokens de pagamento e chaves de backend devem permanecer apenas no ambiente de execução.

## Padrão recomendado
- Desenvolvimento local: usar `.env.local` ou `.env.development.local`.
- Produção: usar variáveis de ambiente do host/deploy.
- Sempre validar a configuração antes do deploy.
