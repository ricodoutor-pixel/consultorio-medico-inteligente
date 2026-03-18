import fetch from 'node-fetch';

/**
 * ClickSign Integration Service
 * Handles digital signatures for prescriptions and documents
 */

const CLICKSIGN_API_TOKEN = process.env.CLICKSIGN_API_TOKEN || "d37a2a07-c3a6-46ae-a2db-b780db02d127";
const CLICKSIGN_API_URL = process.env.CLICKSIGN_API_URL || "https://app.clicksign.com/api/v1";

interface ClickSignDocument {
  path: string;
  template_data?: Record<string, any>;
}

interface ClickSignSigner {
  email: string;
  auth_side: 'email' | 'sms' | 'whatsapp';
  name?: string;
  documentation?: string;
  birthday?: string;
}

export class ClickSignService {
  /**
   * Upload a document for signature
   */
  static async uploadDocument(documentPath: string, contentBase64: string): Promise<any> {
    try {
      console.log(`[CLICKSIGN] Uploading document: ${documentPath}`);
      
      const response = await fetch(`${CLICKSIGN_API_URL}/documents?access_token=${CLICKSIGN_API_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          document: {
            path: `/${documentPath}`,
            content_base64: contentBase64,
            deadline_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days deadline
            auto_close: true,
            locale: 'pt-BR',
            sequence_enabled: false
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`ClickSign Upload Error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      console.log(`[CLICKSIGN] ✓ Document uploaded: ${data.document.key}`);
      return data.document;
    } catch (error) {
      console.error("[CLICKSIGN] Upload error:", error);
      throw error;
    }
  }

  /**
   * Create a signer and link to document
   */
  static async addSignerToDocument(documentKey: string, signer: ClickSignSigner): Promise<any> {
    try {
      console.log(`[CLICKSIGN] Adding signer ${signer.email} to document ${documentKey}`);
      
      // 1. Create Signer
      const signerResponse = await fetch(`${CLICKSIGN_API_URL}/signers?access_token=${CLICKSIGN_API_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          signer: {
            email: signer.email,
            auth_side: signer.auth_side,
            name: signer.name,
            documentation: signer.documentation,
            birthday: signer.birthday,
            has_documentation: !!signer.documentation,
            selfie_enabled: false,
            handwritten_enabled: false
          }
        })
      });

      if (!signerResponse.ok) {
        const error = await signerResponse.json();
        throw new Error(`ClickSign Signer Creation Error: ${JSON.stringify(error)}`);
      }

      const signerData = await signerResponse.json();
      const signerKey = signerData.signer.key;

      // 2. Link Signer to Document
      const linkResponse = await fetch(`${CLICKSIGN_API_URL}/lists?access_token=${CLICKSIGN_API_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          list: {
            document_key: documentKey,
            signer_key: signerKey,
            sign_as: 'witness', // can be 'signer', 'witness', etc.
            message: 'Por favor, assine a receita médica da Planta y Raiz.'
          }
        })
      });

      if (!linkResponse.ok) {
        const error = await linkResponse.json();
        throw new Error(`ClickSign Linking Error: ${JSON.stringify(error)}`);
      }

      const linkData = await linkResponse.json();
      console.log(`[CLICKSIGN] ✓ Signer linked: ${linkData.list.key}`);
      return linkData.list;
    } catch (error) {
      console.error("[CLICKSIGN] Add signer error:", error);
      throw error;
    }
  }

  /**
   * Handle Webhook notifications from ClickSign
   */
  static async handleWebhook(payload: any): Promise<void> {
    const { event, document } = payload;
    console.log(`[CLICKSIGN-WEBHOOK] Event: ${event.name} for document ${document.key}`);

    switch (event.name) {
      case 'upload':
        console.log(`[CLICKSIGN] Document ${document.key} uploaded successfully.`);
        break;
      case 'sign':
        console.log(`[CLICKSIGN] Document ${document.key} was signed.`);
        // TODO: Update prescription status in database to 'SIGNED'
        break;
      case 'finish':
        console.log(`[CLICKSIGN] Document ${document.key} is fully signed and finished.`);
        // TODO: Trigger notification to patient with signed PDF link
        break;
      case 'cancel':
        console.log(`[CLICKSIGN] Document ${document.key} was cancelled.`);
        break;
      default:
        console.log(`[CLICKSIGN] Unhandled event: ${event.name}`);
    }
  }

  /**
   * Generate a prescription and send for signature
   */
  static async createPrescriptionSignature(
    doctorEmail: string, 
    doctorName: string,
    patientName: string,
    medications: string[],
    contentBase64: string
  ): Promise<any> {
    const filename = `receita_${patientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    
    // 1. Upload
    const doc = await this.uploadDocument(filename, contentBase64);
    
    // 2. Add Doctor as Signer
    const signer = await this.addSignerToDocument(doc.key, {
      email: doctorEmail,
      name: doctorName,
      auth_side: 'email'
    });

    return {
      document_key: doc.key,
      signer_key: signer.signer_key,
      request_signature_url: signer.url
    };
  }
}
