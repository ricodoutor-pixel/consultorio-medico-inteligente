/**
 * Serviço de Integração Clicksign - Assinatura Digital de Contratos
 * 
 * Responsável por:
 * - Gerar contratos personalizados para Médicos e Lojistas
 * - Enviar para assinatura via Clicksign
 * - Rastrear status de assinatura
 * - Validar assinatura e ativar conta
 * - Armazenar contrato assinado no banco de dados
 */

import axios, { AxiosInstance } from 'axios';

interface ContractData {
  type: 'medico' | 'lojista';
  name: string;
  email: string;
  cpf?: string;
  cnpj?: string;
  crm?: string;
  specialty?: string;
  phone: string;
  company?: string;
  location?: string;
}

interface ClicksignDocument {
  document_id: string;
  document_url: string;
  signers: Array<{
    signer_id: string;
    email: string;
    name: string;
    status: 'pending' | 'signed' | 'rejected';
    signed_at?: string;
  }>;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  completed_at?: string;
}

interface ContractSignature {
  id: string;
  userId: string;
  contractType: 'medico' | 'lojista';
  documentId: string;
  status: 'pending' | 'signed' | 'rejected';
  signedAt?: Date;
  contractUrl: string;
  ipAddress: string;
  userAgent: string;
}

class ClicksignContractService {
  private apiKey: string;
  private apiUrl: string = 'https://app.clicksign.com/api/v1';
  private client: AxiosInstance;

  constructor() {
    this.apiKey = process.env.CLICKSIGN_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('CLICKSIGN_API_KEY não configurada');
    }

    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Gera contrato personalizado para Médico
   */
  async generateMedicoContract(data: ContractData): Promise<string> {
    if (data.type !== 'medico') {
      throw new Error('Tipo de contrato inválido');
    }

    const contractContent = this.buildMedicoContractContent(data);
    return contractContent;
  }

  /**
   * Gera contrato personalizado para Lojista
   */
  async generateLojstaContract(data: ContractData): Promise<string> {
    if (data.type !== 'lojista') {
      throw new Error('Tipo de contrato inválido');
    }

    const contractContent = this.buildLojstaContractContent(data);
    return contractContent;
  }

  /**
   * Envia contrato para assinatura via Clicksign
   */
  async sendForSignature(
    contractData: ContractData,
    contractContent: string
  ): Promise<ClicksignDocument> {
    try {
      // Converter conteúdo Markdown para PDF
      const pdfBuffer = await this.convertMarkdownToPdf(contractContent);

      // Fazer upload do documento
      const uploadResponse = await this.uploadDocument(
        pdfBuffer,
        `Contrato_${contractData.type}_${contractData.email}.pdf`
      );

      const documentId = uploadResponse.document.key;

      // Criar signatário
      const signerResponse = await this.createSigner(
        documentId,
        contractData.name,
        contractData.email
      );

      // Enviar para assinatura
      const signResponse = await this.requestSignature(
        documentId,
        signerResponse.signer.key,
        contractData.email,
        contractData.name
      );

      return {
        document_id: documentId,
        document_url: signResponse.document.url,
        signers: [
          {
            signer_id: signerResponse.signer.key,
            email: contractData.email,
            name: contractData.name,
            status: 'pending',
          },
        ],
        status: 'pending',
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao enviar contrato para assinatura:', error);
      throw error;
    }
  }

  /**
   * Verifica status de assinatura
   */
  async checkSignatureStatus(documentId: string): Promise<ClicksignDocument> {
    try {
      const response = await this.client.get(`/documents/${documentId}`);
      
      return {
        document_id: documentId,
        document_url: response.data.document.url,
        signers: response.data.document.signers.map((signer: any) => ({
          signer_id: signer.key,
          email: signer.email,
          name: signer.name,
          status: signer.status,
          signed_at: signer.signed_at,
        })),
        status: response.data.document.status,
        created_at: response.data.document.created_at,
        completed_at: response.data.document.completed_at,
      };
    } catch (error) {
      console.error('Erro ao verificar status de assinatura:', error);
      throw error;
    }
  }

  /**
   * Webhook para receber notificação de assinatura completa
   */
  async handleSignatureWebhook(payload: any): Promise<boolean> {
    try {
      const { document, signer, event } = payload;

      if (event === 'document.completed') {
        console.log('✅ Contrato assinado:', {
          documentId: document.key,
          signerEmail: signer.email,
          signedAt: new Date().toISOString(),
        });

        // Atualizar status no banco de dados
        await this.updateContractStatus(
          document.key,
          'signed',
          new Date()
        );

        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  /**
   * Baixa contrato assinado
   */
  async downloadSignedContract(documentId: string): Promise<Buffer> {
    try {
      const response = await this.client.get(
        `/documents/${documentId}/download`,
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('Erro ao baixar contrato assinado:', error);
      throw error;
    }
  }

  /**
   * Valida assinatura e ativa conta
   */
  async validateAndActivateAccount(
    documentId: string,
    userId: string,
    contractType: 'medico' | 'lojista'
  ): Promise<boolean> {
    try {
      // Verificar status de assinatura
      const status = await this.checkSignatureStatus(documentId);

      if (status.status !== 'completed') {
        throw new Error('Contrato ainda não foi assinado');
      }

      // Ativar conta no banco de dados
      await this.activateUserAccount(userId, contractType, documentId);

      console.log(`✅ Conta ativada: ${userId} (${contractType})`);
      return true;
    } catch (error) {
      console.error('Erro ao validar e ativar conta:', error);
      throw error;
    }
  }

  /**
   * ===== MÉTODOS PRIVADOS =====
   */

  private buildMedicoContractContent(data: ContractData): string {
    return `
# CONTRATO DIGITAL DE PARCERIA - PROFISSIONAL MÉDICO

**Plataforma:** Planta & Raiz — Mega Clínica Digital
**Data:** ${new Date().toLocaleDateString('pt-BR')}

## PARTES CONTRATANTES

**MÉDICO:**
- Nome: ${data.name}
- CPF: ${data.cpf}
- CRM: ${data.crm}
- Especialidade: ${data.specialty}
- Email: ${data.email}
- Telefone: ${data.phone}

## OBJETO DO CONTRATO

O MÉDICO aceita atuar na plataforma Planta & Raiz sob gestão 100% via Inteligência Artificial.

## AGENTES IA

O MÉDICO aceita a gestão autônoma dos seguintes agentes:

1. **Enfermeira Brisa** - Triagem clínica e matching
2. **Manus CEO** - Gestão financeira e pagamentos
3. **Guardião ANVISA** - Auditoria de conformidade
4. **Verdinho** - Suporte e gestão logística

## PLANO: MÉDICO VIP (R$ 99/mês)

- Receita 100% das consultas
- Sem taxa de saque
- Selo de verificação
- Suporte VIP 24/7

## CONFORMIDADE

O MÉDICO aceita conformidade com:
- CFM (Conselho Federal de Medicina)
- ANVISA (RDC 660)
- LGPD (Lei Geral de Proteção de Dados)

## ASSINATURA

Ao assinar este contrato, o MÉDICO aceita todos os termos acima.

**Assinado digitalmente via Clicksign**
**Data:** ${new Date().toISOString()}
    `;
  }

  private buildLojstaContractContent(data: ContractData): string {
    return `
# CONTRATO DIGITAL DE PARCERIA - LOJISTA/FARMÁCIA

**Plataforma:** Planta & Raiz — Mega Clínica Digital
**Data:** ${new Date().toLocaleDateString('pt-BR')}

## PARTES CONTRATANTES

**LOJISTA:**
- Razão Social: ${data.company}
- CNPJ: ${data.cnpj}
- Responsável: ${data.name}
- Email: ${data.email}
- Telefone: ${data.phone}
- Localização: ${data.location}

## OBJETO DO CONTRATO

O LOJISTA aceita fornecer medicamentos na plataforma Planta & Raiz sob gestão 100% via Inteligência Artificial.

## AGENTES IA

O LOJISTA aceita a gestão autônoma dos seguintes agentes:

1. **Enfermeira Brisa** - Recomendação de medicamentos
2. **Manus CEO** - Gestão financeira e pagamentos
3. **Guardião ANVISA** - Auditoria de conformidade
4. **Verdinho** - Concierge e suporte

## PLANO: LOJISTA PRO (R$ 49/mês)

- Taxa zero em vendas
- Destaque nas recomendações
- Dashboard com analytics
- Suporte prioritário 24/7

## REGRAS DE LOJISTA

O LOJISTA aceita as seguintes regras:

1. **Máximo 10 produtos** ativos por vez
2. **Máximo 3 fotos** por produto
3. **Frete grátis** para todo Brasil
4. **Preços competitivos** (não mais de 20% acima da média)
5. **Conformidade ANVISA** obrigatória

## CONFORMIDADE

O LOJISTA aceita conformidade com:
- ANVISA (medicamentos autorizados)
- LGPD (proteção de dados)
- Legislação fiscal

## ASSINATURA

Ao assinar este contrato, o LOJISTA aceita todos os termos acima.

**Assinado digitalmente via Clicksign**
**Data:** ${new Date().toISOString()}
    `;
  }

  private async convertMarkdownToPdf(content: string): Promise<Buffer> {
    // Implementar conversão Markdown para PDF
    // Pode usar bibliotecas como: markdown-pdf, puppeteer, etc.
    console.log('Convertendo Markdown para PDF...');
    return Buffer.from(content);
  }

  private async uploadDocument(
    pdfBuffer: Buffer,
    filename: string
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([pdfBuffer]), filename);

      const response = await this.client.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao fazer upload do documento:', error);
      throw error;
    }
  }

  private async createSigner(
    documentId: string,
    name: string,
    email: string
  ): Promise<any> {
    try {
      const response = await this.client.post(`/documents/${documentId}/signers`, {
        name,
        email,
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao criar signatário:', error);
      throw error;
    }
  }

  private async requestSignature(
    documentId: string,
    signerId: string,
    email: string,
    name: string
  ): Promise<any> {
    try {
      const response = await this.client.post(
        `/documents/${documentId}/signature_requests`,
        {
          signer_key: signerId,
          message: `Olá ${name}, você foi convidado para assinar o contrato de parceria com Planta & Raiz. Por favor, clique no link abaixo para assinar digitalmente.`,
          redirect_url: 'https://plantayraiz.com.br/contract-signed',
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erro ao solicitar assinatura:', error);
      throw error;
    }
  }

  private async updateContractStatus(
    documentId: string,
    status: string,
    signedAt: Date
  ): Promise<void> {
    // Implementar atualização no banco de dados
    console.log(`Atualizando status do contrato: ${documentId} -> ${status}`);
  }

  private async activateUserAccount(
    userId: string,
    contractType: 'medico' | 'lojista',
    documentId: string
  ): Promise<void> {
    // Implementar ativação de conta no banco de dados
    console.log(`Ativando conta: ${userId} (${contractType})`);
  }
}

export const clicksignService = new ClicksignContractService();
