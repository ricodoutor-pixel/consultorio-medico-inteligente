/**
 * Health Insurance Integration Service
 * Integrates with major health insurance providers for automatic coverage
 */

interface InsuranceProvider {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  supportedProcedures: string[];
  coveragePercentage: number;
}

interface InsuranceCoverageRequest {
  patientId: string;
  procedureCode: string;
  professionalId: string;
  estimatedCost: number;
}

interface InsuranceCoverageResponse {
  isApproved: boolean;
  coverageAmount: number;
  patientResponsibility: number;
  authorizationCode: string;
  validUntil: Date;
}

export class HealthInsuranceIntegrationService {
  private providers: Map<string, InsuranceProvider> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize major Brazilian insurance providers
    const providers: InsuranceProvider[] = [
      {
        id: 'unimed',
        name: 'Unimed',
        apiUrl: process.env.UNIMED_API_URL || '',
        apiKey: process.env.UNIMED_API_KEY || '',
        supportedProcedures: ['TELEMEDICINE', 'CANNABIS_CONSULTATION', 'PRESCRIPTION'],
        coveragePercentage: 80,
      },
      {
        id: 'bradesco',
        name: 'Bradesco Saúde',
        apiUrl: process.env.BRADESCO_API_URL || '',
        apiKey: process.env.BRADESCO_API_KEY || '',
        supportedProcedures: ['TELEMEDICINE', 'CANNABIS_CONSULTATION'],
        coveragePercentage: 75,
      },
      {
        id: 'sulamerica',
        name: 'SulAmérica',
        apiUrl: process.env.SULAMERICA_API_URL || '',
        apiKey: process.env.SULAMERICA_API_KEY || '',
        supportedProcedures: ['TELEMEDICINE', 'CANNABIS_CONSULTATION', 'PRESCRIPTION'],
        coveragePercentage: 85,
      },
      {
        id: 'amil',
        name: 'Amil',
        apiUrl: process.env.AMIL_API_URL || '',
        apiKey: process.env.AMIL_API_KEY || '',
        supportedProcedures: ['TELEMEDICINE', 'CANNABIS_CONSULTATION'],
        coveragePercentage: 70,
      },
    ];

    providers.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
  }

  /**
   * Check insurance coverage for a procedure
   */
  async checkCoverage(request: InsuranceCoverageRequest): Promise<InsuranceCoverageResponse | null> {
    try {
      // Get patient insurance information from database
      const patientInsurance = await this.getPatientInsurance(request.patientId);
      
      if (!patientInsurance) {
        return null;
      }

      const provider = this.providers.get(patientInsurance.providerId);
      if (!provider) {
        return null;
      }

      // Check if procedure is supported
      if (!provider.supportedProcedures.includes(request.procedureCode)) {
        return null;
      }

      // Call insurance provider API
      const response = await this.callInsuranceAPI(provider, {
        patientId: patientInsurance.externalPatientId,
        procedureCode: request.procedureCode,
        estimatedCost: request.estimatedCost,
      });

      if (!response.approved) {
        return null;
      }

      const coverageAmount = request.estimatedCost * (provider.coveragePercentage / 100);
      const patientResponsibility = request.estimatedCost - coverageAmount;

      return {
        isApproved: true,
        coverageAmount,
        patientResponsibility,
        authorizationCode: response.authorizationCode,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };
    } catch (error) {
      console.error('Error checking insurance coverage:', error);
      return null;
    }
  }

  /**
   * Get patient insurance information
   */
  private async getPatientInsurance(patientId: string): Promise<any> {
    // This would query the database for patient insurance info
    // For now, returning mock data
    return {
      providerId: 'unimed',
      externalPatientId: `PATIENT_${patientId}`,
      policyNumber: '123456789',
      isActive: true,
    };
  }

  /**
   * Call insurance provider API
   */
  private async callInsuranceAPI(provider: InsuranceProvider, data: any): Promise<any> {
    try {
      const response = await fetch(`${provider.apiUrl}/coverage/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Insurance API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error calling ${provider.name} API:`, error);
      throw error;
    }
  }

  /**
   * Process insurance payment
   */
  async processInsurancePayment(
    consultationId: string,
    coverageResponse: InsuranceCoverageResponse,
    patientResponsibility: number
  ): Promise<boolean> {
    try {
      // Create insurance claim
      const claimId = await this.createInsuranceClaim(consultationId, coverageResponse);

      // Process patient payment (remaining balance)
      if (patientResponsibility > 0) {
        // This would integrate with Mercado Pago for patient payment
        console.log(`Patient responsibility: R$ ${patientResponsibility}`);
      }

      return true;
    } catch (error) {
      console.error('Error processing insurance payment:', error);
      return false;
    }
  }

  /**
   * Create insurance claim
   */
  private async createInsuranceClaim(consultationId: string, coverage: InsuranceCoverageResponse): Promise<string> {
    // This would create a claim in the insurance system
    const claimId = `CLAIM_${Date.now()}_${consultationId}`;
    
    // Store claim in database
    console.log(`Created insurance claim: ${claimId}`);
    
    return claimId;
  }

  /**
   * Get list of supported insurance providers
   */
  getSupportedProviders(): InsuranceProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Add custom insurance provider
   */
  addProvider(provider: InsuranceProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Get coverage statistics
   */
  async getCoverageStatistics(): Promise<{
    totalApprovals: number;
    totalDenials: number;
    averageCoveragePercentage: number;
    topProviders: string[];
  }> {
    // This would query the database for statistics
    return {
      totalApprovals: 1250,
      totalDenials: 45,
      averageCoveragePercentage: 78.5,
      topProviders: ['unimed', 'sulamerica', 'bradesco'],
    };
  }
}

export const healthInsuranceService = new HealthInsuranceIntegrationService();
