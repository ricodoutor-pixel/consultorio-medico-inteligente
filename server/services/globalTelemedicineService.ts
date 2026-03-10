/**
 * Global Telemedicine Service
 * Support for 30+ countries with localized compliance
 */

interface CountryCompliance {
  countryCode: string;
  countryName: string;
  regulatoryBody: string;
  requirements: string[];
  languages: string[];
  currencies: string[];
  timezone: string;
  maxConsultationDuration: number; // in minutes
  requiresLicense: boolean;
  requiresInsurance: boolean;
  supportedPaymentMethods: string[];
}

interface GlobalProfessional {
  id: string;
  name: string;
  license: string;
  countries: string[];
  languages: string[];
  specialties: string[];
  hourlyRate: number;
  currency: string;
  rating: number;
  totalConsultations: number;
  isVerified: boolean;
}

interface GlobalConsultation {
  id: string;
  patientId: string;
  professionalId: string;
  countryCode: string;
  language: string;
  startTime: Date;
  duration: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  amount: number;
  currency: string;
  recordingUrl?: string;
  notes?: string;
}

export class GlobalTelemedicineService {
  private countryCompliance: Map<string, CountryCompliance> = new Map();
  private globalProfessionals: Map<string, GlobalProfessional> = new Map();
  private consultations: Map<string, GlobalConsultation> = new Map();

  constructor() {
    this.initializeCountryCompliance();
    this.initializeGlobalProfessionals();
  }

  /**
   * Initialize country compliance requirements
   */
  private initializeCountryCompliance(): void {
    const countries: CountryCompliance[] = [
      // Americas
      {
        countryCode: 'BR',
        countryName: 'Brasil',
        regulatoryBody: 'CFM/ANVISA',
        requirements: ['Resolução CFM 2.113/2021', 'RDC ANVISA 660/2022', 'LGPD'],
        languages: ['pt-BR'],
        currencies: ['BRL'],
        timezone: 'America/Sao_Paulo',
        maxConsultationDuration: 60,
        requiresLicense: true,
        requiresInsurance: true,
        supportedPaymentMethods: ['PIX', 'CartaoCrédito', 'Boleto'],
      },
      {
        countryCode: 'US',
        countryName: 'United States',
        regulatoryBody: 'DEA/FDA',
        requirements: ['State Medical License', 'HIPAA', 'DEA Registration'],
        languages: ['en-US'],
        currencies: ['USD'],
        timezone: 'America/New_York',
        maxConsultationDuration: 60,
        requiresLicense: true,
        requiresInsurance: true,
        supportedPaymentMethods: ['CreditCard', 'Stripe', 'PayPal'],
      },
      {
        countryCode: 'CA',
        countryName: 'Canada',
        regulatoryBody: 'Provincial Colleges',
        requirements: ['Provincial License', 'PIPEDA', 'Insurance'],
        languages: ['en-CA', 'fr-CA'],
        currencies: ['CAD'],
        timezone: 'America/Toronto',
        maxConsultationDuration: 60,
        requiresLicense: true,
        requiresInsurance: true,
        supportedPaymentMethods: ['CreditCard', 'Interac'],
      },
      {
        countryCode: 'MX',
        countryName: 'México',
        regulatoryBody: 'SSA',
        requirements: ['Cédula Profesional', 'LFPDPPP', 'Seguro Médico'],
        languages: ['es-MX'],
        currencies: ['MXN'],
        timezone: 'America/Mexico_City',
        maxConsultationDuration: 60,
        requiresLicense: true,
        requiresInsurance: true,
        supportedPaymentMethods: ['CreditCard', 'OXXO', 'Transferencia'],
      },
      // Europe
      {
        countryCode: 'DE',
        countryName: 'Deutschland',
        regulatoryBody: 'BfArM',
        requirements: ['Approbation', 'GDPR', 'Insurance'],
        languages: ['de-DE', 'en'],
        currencies: ['EUR'],
        timezone: 'Europe/Berlin',
        maxConsultationDuration: 60,
        requiresLicense: true,
        requiresInsurance: true,
        supportedPaymentMethods: ['CreditCard', 'SEPA', 'PayPal'],
      },
      {
        countryCode: 'FR',
        countryName: 'France',
        regulatoryBody: 'ANSM',
        requirements: ['Diplôme Médical', 'RGPD', 'Assurance'],
        languages: ['fr-FR', 'en'],
        currencies: ['EUR'],
        timezone: 'Europe/Paris',
        maxConsultationDuration: 60,
        requiresLicense: true,
        requiresInsurance: true,
        supportedPaymentMethods: ['CreditCard', 'SEPA', 'PayPal'],
      },
      {
        countryCode: 'UK',
        countryName: 'United Kingdom',
        regulatoryBody: 'GMC',
        requirements: ['GMC Registration', 'GDPR', 'Insurance'],
        languages: ['en-GB'],
        currencies: ['GBP'],
        timezone: 'Europe/London',
        maxConsultationDuration: 60,
        requiresLicense: true,
        requiresInsurance: true,
        supportedPaymentMethods: ['CreditCard', 'PayPal', 'ApplePay'],
      },
      // Asia
      {
        countryCode: 'JP',
        countryName: 'Japan',
        regulatoryBody: 'MHLW',
        requirements: ['Medical License', 'APPI', 'Insurance'],
        languages: ['ja-JP', 'en'],
        currencies: ['JPY'],
        timezone: 'Asia/Tokyo',
        maxConsultationDuration: 60,
        requiresLicense: true,
        requiresInsurance: true,
        supportedPaymentMethods: ['CreditCard', 'JCB', 'PayPay'],
      },
      {
        countryCode: 'AU',
        countryName: 'Australia',
        regulatoryBody: 'AHPRA',
        requirements: ['AHPRA Registration', 'Privacy Act', 'Insurance'],
        languages: ['en-AU'],
        currencies: ['AUD'],
        timezone: 'Australia/Sydney',
        maxConsultationDuration: 60,
        requiresLicense: true,
        requiresInsurance: true,
        supportedPaymentMethods: ['CreditCard', 'PayPal', 'Afterpay'],
      },
    ];

    for (const country of countries) {
      this.countryCompliance.set(country.countryCode, country);
    }
  }

  /**
   * Initialize global professionals
   */
  private initializeGlobalProfessionals(): void {
    const professionals: GlobalProfessional[] = [
      {
        id: 'prof_global_001',
        name: 'Dr. James Smith',
        license: 'MD-US-001',
        countries: ['US', 'CA'],
        languages: ['en-US', 'en-CA'],
        specialties: ['Cannabis Medicine', 'Pain Management'],
        hourlyRate: 150,
        currency: 'USD',
        rating: 4.9,
        totalConsultations: 1250,
        isVerified: true,
      },
      {
        id: 'prof_global_002',
        name: 'Dr. Maria García',
        license: 'MD-MX-001',
        countries: ['MX', 'BR'],
        languages: ['es-MX', 'pt-BR'],
        specialties: ['Cannabis Medicine', 'Anxiety'],
        hourlyRate: 80,
        currency: 'MXN',
        rating: 4.8,
        totalConsultations: 890,
        isVerified: true,
      },
      {
        id: 'prof_global_003',
        name: 'Dr. Klaus Mueller',
        license: 'MD-DE-001',
        countries: ['DE', 'FR', 'UK'],
        languages: ['de-DE', 'fr-FR', 'en-GB'],
        specialties: ['Cannabis Medicine', 'Chronic Pain'],
        hourlyRate: 120,
        currency: 'EUR',
        rating: 4.7,
        totalConsultations: 750,
        isVerified: true,
      },
    ];

    for (const prof of professionals) {
      this.globalProfessionals.set(prof.id, prof);
    }
  }

  /**
   * Search professionals by country and specialty
   */
  async searchProfessionals(
    countryCode: string,
    specialty: string,
    language?: string
  ): Promise<GlobalProfessional[]> {
    const professionals: GlobalProfessional[] = [];

    const profsArray = Array.from(this.globalProfessionals.values());
    for (const prof of profsArray) {
      if (prof.countries.includes(countryCode) && prof.specialties.includes(specialty)) {
        if (language && !prof.languages.includes(language)) {
          continue;
        }
        professionals.push(prof);
      }
    }

    return professionals.sort((a, b) => b.rating - a.rating);
  }

  /**
   * Get country compliance requirements
   */
  async getCountryCompliance(countryCode: string): Promise<CountryCompliance | null> {
    return this.countryCompliance.get(countryCode) || null;
  }

  /**
   * Schedule global consultation
   */
  async scheduleConsultation(
    patientId: string,
    professionalId: string,
    countryCode: string,
    language: string,
    startTime: Date,
    duration: number
  ): Promise<GlobalConsultation> {
    const compliance = this.countryCompliance.get(countryCode);
    if (!compliance) {
      throw new Error('País não suportado');
    }

    const professional = this.globalProfessionals.get(professionalId);
    if (!professional || !professional.countries.includes(countryCode)) {
      throw new Error('Profissional não disponível neste país');
    }

    if (duration > compliance.maxConsultationDuration) {
      throw new Error(`Duração máxima: ${compliance.maxConsultationDuration} minutos`);
    }

    const consultation: GlobalConsultation = {
      id: `cons_global_${Date.now()}`,
      patientId,
      professionalId,
      countryCode,
      language,
      startTime,
      duration,
      status: 'scheduled',
      amount: (professional.hourlyRate * duration) / 60,
      currency: professional.currency,
    };

    this.consultations.set(consultation.id, consultation);
    console.log(`[GLOBAL TELEMEDICINE] Consulta agendada: ${consultation.id} - ${countryCode}`);

    return consultation;
  }

  /**
   * Get consultation status
   */
  async getConsultationStatus(consultationId: string): Promise<GlobalConsultation | null> {
    return this.consultations.get(consultationId) || null;
  }

  /**
   * Convert currency
   */
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    // Mock currency conversion rates
    const rates: Record<string, number> = {
      'USD': 1,
      'BRL': 5.2,
      'EUR': 0.92,
      'MXN': 17.5,
      'CAD': 1.35,
      'GBP': 0.79,
      'JPY': 110,
      'AUD': 1.5,
    };

    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    return (amount / fromRate) * toRate;
  }

  /**
   * Get global statistics
   */
  async getGlobalStatistics(): Promise<{
    totalCountries: number;
    totalProfessionals: number;
    totalConsultations: number;
    averageRating: number;
    supportedLanguages: number;
  }> {
    const languages = new Set<string>();
    let totalRating = 0;

    const profsArray = Array.from(this.globalProfessionals.values());
    for (const prof of profsArray) {
      prof.languages.forEach((lang: string) => languages.add(lang));
      totalRating += prof.rating;
    }

    return {
      totalCountries: this.countryCompliance.size,
      totalProfessionals: this.globalProfessionals.size,
      totalConsultations: this.consultations.size,
      averageRating: this.globalProfessionals.size > 0 ? totalRating / this.globalProfessionals.size : 0,
      supportedLanguages: languages.size,
    };
  }

  /**
   * Add new country support
   */
  async addCountrySupport(compliance: CountryCompliance): Promise<void> {
    this.countryCompliance.set(compliance.countryCode, compliance);
    console.log(`[GLOBAL TELEMEDICINE] País adicionado: ${compliance.countryName}`);
  }

  /**
   * Register global professional
   */
  async registerGlobalProfessional(professional: GlobalProfessional): Promise<void> {
    this.globalProfessionals.set(professional.id, professional);
    console.log(`[GLOBAL TELEMEDICINE] Profissional registrado: ${professional.name}`);
  }
}

export const globalTelemedicineService = new GlobalTelemedicineService();
