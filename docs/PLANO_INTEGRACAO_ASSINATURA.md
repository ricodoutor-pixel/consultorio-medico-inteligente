# Plano de Integração: Assinatura Digital (ClickSign)
**Plataforma: Planta y Raiz - Mega Clínica Digital**

## 1. Por que ClickSign?
Após auditoria técnica, a **ClickSign** foi selecionada como a parceira ideal para a Planta y Raiz pelos seguintes motivos:
- **Conformidade ICP-Brasil**: Total validade jurídica para receitas médicas e atestados no Brasil.
- **Custo-Benefício**: Cobrança em Reais (BRL), evitando a volatilidade do dólar da DocuSign.
- **API Nativa Node.js**: Integração rápida com nosso backend atual.
- **LGPD Ready**: Totalmente adequada à Lei Geral de Proteção de Dados.

## 2. Fluxo de Operação (Automação Manus CEO)
O processo será 100% automatizado, sem intervenção manual:

1. **Finalização da Consulta**: O médico preenche a receita na plataforma.
2. **Geração do PDF**: O sistema gera o PDF da receita com os dados do paciente e médico.
3. **Chamada de API (Manus CEO)**: O backend envia o documento para a ClickSign via API.
4. **Assinatura do Médico**: O médico recebe um alerta (WhatsApp/E-mail) para assinar com 1 clique usando seu certificado digital ou biometria.
5. **Entrega ao Paciente**: Assim que assinado, o PDF com o selo de validade jurídica é liberado no painel do paciente e enviado via WhatsApp.

## 3. Arquitetura Técnica (Backend Node.js)
Implementaremos os seguintes endpoints no nosso servidor:
- `POST /api/signatures/create`: Envia o documento para a ClickSign.
- `GET /api/signatures/status/:id`: Monitora se o médico já assinou.
- `POST /api/webhooks/clicksign`: Recebe a confirmação da assinatura em tempo real.

## 4. Custos Estimados
- **Plano API Starter**: Aproximadamente R$ 150,00/mês (inclui um pacote de assinaturas).
- **Custo por Assinatura Extra**: Cerca de R$ 1,50 a R$ 3,00 por documento.
- *Nota: Assinantes dos nossos planos premium podem ter este custo absorvido pela plataforma.*

## 5. Próximos Passos
1. **Criação da Conta**: O Dr. Edilson Bezerra deve criar a conta na ClickSign e gerar a `API_KEY`.
2. **Ambiente de Sandbox**: Manus CEO realizará os testes de envio em ambiente de homologação.
3. **Go-Live**: Ativação do botão "Assinar Digitalmente" no painel médico.

---
*Este plano garante que a Planta y Raiz seja a clínica digital mais segura e juridicamente sólida do mercado.*
