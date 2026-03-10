/**
 * Professional Marketplace Service
 * Manage professional profiles, ratings, and availability
 */

interface ProfessionalProfile {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  imageUrl: string;
  rating: number;
  totalReviews: number;
  hourlyRate: number;
  responseTime: number; // in minutes
  isOnline: boolean;
  availability: Map<string, string[]>; // day -> [time slots]
  languages: string[];
  certifications: string[];
  yearsOfExperience: number;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  joinDate: Date;
}

interface ProfessionalReview {
  id: string;
  professionalId: string;
  patientId: string;
  rating: number;
  comment: string;
  consultationId: string;
  createdAt: Date;
}

interface ProfessionalAvailability {
  professionalId: string;
  date: Date;
  timeSlots: Array<{
    startTime: string;
    endTime: string;
    available: boolean;
  }>;
}

export class ProfessionalMarketplaceService {
  private professionals: Map<string, ProfessionalProfile> = new Map();
  private reviews: Map<string, ProfessionalReview[]> = new Map();
  private availability: Map<string, ProfessionalAvailability> = new Map();

  constructor() {
    this.initializeSampleProfessionals();
  }

  /**
   * Initialize sample professionals
   */
  private initializeSampleProfessionals(): void {
    const professionals: ProfessionalProfile[] = [
      {
        id: 'prof_mp_001',
        name: 'Dr. Silva',
        specialty: 'Cannabis Medicine',
        bio: 'Especialista em medicina canábica com 15 anos de experiência',
        imageUrl: '/images/prof-silva.jpg',
        rating: 4.9,
        totalReviews: 245,
        hourlyRate: 150,
        responseTime: 5,
        isOnline: true,
        availability: new Map([
          ['Monday', ['09:00-10:00', '14:00-15:00', '16:00-17:00']],
          ['Tuesday', ['09:00-10:00', '14:00-15:00']],
          ['Wednesday', ['10:00-11:00', '15:00-16:00']],
        ]),
        languages: ['Portuguese', 'English', 'Spanish'],
        certifications: ['CFM', 'Cannabis Medicine', 'Pain Management'],
        yearsOfExperience: 15,
        verificationStatus: 'verified',
        joinDate: new Date('2020-01-15'),
      },
      {
        id: 'prof_mp_002',
        name: 'Dra. Santos',
        specialty: 'Anxiety & Sleep',
        bio: 'Psiquiatra especializada em ansiedade e distúrbios do sono',
        imageUrl: '/images/prof-santos.jpg',
        rating: 4.8,
        totalReviews: 189,
        hourlyRate: 120,
        responseTime: 10,
        isOnline: true,
        availability: new Map([
          ['Monday', ['08:00-09:00', '13:00-14:00']],
          ['Wednesday', ['09:00-10:00', '14:00-15:00']],
          ['Friday', ['10:00-11:00', '15:00-16:00']],
        ]),
        languages: ['Portuguese', 'English'],
        certifications: ['CRM', 'Psychiatry', 'Sleep Medicine'],
        yearsOfExperience: 12,
        verificationStatus: 'verified',
        joinDate: new Date('2021-03-20'),
      },
      {
        id: 'prof_mp_003',
        name: 'Dr. Costa',
        specialty: 'Chronic Pain',
        bio: 'Especialista em manejo de dor crônica e reabilitação',
        imageUrl: '/images/prof-costa.jpg',
        rating: 4.7,
        totalReviews: 156,
        hourlyRate: 130,
        responseTime: 15,
        isOnline: false,
        availability: new Map([
          ['Tuesday', ['09:00-10:00', '14:00-15:00']],
          ['Thursday', ['10:00-11:00', '16:00-17:00']],
        ]),
        languages: ['Portuguese', 'English', 'French'],
        certifications: ['CRM', 'Pain Management', 'Rehabilitation'],
        yearsOfExperience: 18,
        verificationStatus: 'verified',
        joinDate: new Date('2019-06-10'),
      },
    ];

    for (const prof of professionals) {
      this.professionals.set(prof.id, prof);
      this.reviews.set(prof.id, []);
    }
  }

  /**
   * Search professionals
   */
  async searchProfessionals(filters: {
    specialty?: string;
    minRating?: number;
    maxPrice?: number;
    language?: string;
    isOnline?: boolean;
  }): Promise<ProfessionalProfile[]> {
    const results: ProfessionalProfile[] = [];

    const profsArray = Array.from(this.professionals.values());
    for (const prof of profsArray) {
      if (filters.specialty && prof.specialty !== filters.specialty) continue;
      if (filters.minRating && prof.rating < filters.minRating) continue;
      if (filters.maxPrice && prof.hourlyRate > filters.maxPrice) continue;
      if (filters.language && !prof.languages.includes(filters.language)) continue;
      if (filters.isOnline !== undefined && prof.isOnline !== filters.isOnline) continue;

      results.push(prof);
    }

    return results.sort((a, b) => b.rating - a.rating);
  }

  /**
   * Get professional profile
   */
  async getProfessionalProfile(professionalId: string): Promise<ProfessionalProfile | null> {
    return this.professionals.get(professionalId) || null;
  }

  /**
   * Get professional reviews
   */
  async getProfessionalReviews(professionalId: string): Promise<ProfessionalReview[]> {
    return this.reviews.get(professionalId) || [];
  }

  /**
   * Add review
   */
  async addReview(
    professionalId: string,
    patientId: string,
    rating: number,
    comment: string,
    consultationId: string
  ): Promise<ProfessionalReview> {
    const prof = this.professionals.get(professionalId);
    if (!prof) {
      throw new Error('Profissional não encontrado');
    }

    const review: ProfessionalReview = {
      id: `rev_${Date.now()}`,
      professionalId,
      patientId,
      rating,
      comment,
      consultationId,
      createdAt: new Date(),
    };

    const reviews = this.reviews.get(professionalId) || [];
    reviews.push(review);
    this.reviews.set(professionalId, reviews);

    // Update professional rating
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    prof.rating = totalRating / reviews.length;
    prof.totalReviews = reviews.length;

    console.log(`[MARKETPLACE] Avaliação adicionada: ${professionalId} - ${rating}/5`);

    return review;
  }

  /**
   * Get professional availability
   */
  async getAvailability(professionalId: string, date: Date): Promise<ProfessionalAvailability | null> {
    const prof = this.professionals.get(professionalId);
    if (!prof) return null;

    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    const slots = prof.availability.get(dayName) || [];

    return {
      professionalId,
      date,
      timeSlots: slots.map(slot => {
        const [start, end] = slot.split('-');
        return {
          startTime: start,
          endTime: end,
          available: true,
        };
      }),
    };
  }

  /**
   * Register professional
   */
  async registerProfessional(profile: Partial<ProfessionalProfile>): Promise<ProfessionalProfile> {
    const professional: ProfessionalProfile = {
      id: `prof_mp_${Date.now()}`,
      name: profile.name || '',
      specialty: profile.specialty || '',
      bio: profile.bio || '',
      imageUrl: profile.imageUrl || '',
      rating: 0,
      totalReviews: 0,
      hourlyRate: profile.hourlyRate || 100,
      responseTime: profile.responseTime || 30,
      isOnline: false,
      availability: profile.availability || new Map(),
      languages: profile.languages || ['Portuguese'],
      certifications: profile.certifications || [],
      yearsOfExperience: profile.yearsOfExperience || 0,
      verificationStatus: 'pending',
      joinDate: new Date(),
    };

    this.professionals.set(professional.id, professional);
    this.reviews.set(professional.id, []);

    console.log(`[MARKETPLACE] Profissional registrado: ${professional.name}`);

    return professional;
  }

  /**
   * Verify professional
   */
  async verifyProfessional(professionalId: string, approved: boolean): Promise<boolean> {
    const prof = this.professionals.get(professionalId);
    if (!prof) return false;

    prof.verificationStatus = approved ? 'verified' : 'rejected';
    console.log(`[MARKETPLACE] Profissional ${approved ? 'aprovado' : 'rejeitado'}: ${professionalId}`);

    return true;
  }

  /**
   * Update professional status
   */
  async updateOnlineStatus(professionalId: string, isOnline: boolean): Promise<boolean> {
    const prof = this.professionals.get(professionalId);
    if (!prof) return false;

    prof.isOnline = isOnline;
    console.log(`[MARKETPLACE] Status atualizado: ${professionalId} - ${isOnline ? 'Online' : 'Offline'}`);

    return true;
  }

  /**
   * Get marketplace statistics
   */
  async getMarketplaceStatistics(): Promise<{
    totalProfessionals: number;
    verifiedProfessionals: number;
    averageRating: number;
    onlineProfessionals: number;
    totalReviews: number;
  }> {
    const profsArray = Array.from(this.professionals.values());
    const verifiedCount = profsArray.filter(p => p.verificationStatus === 'verified').length;
    const onlineCount = profsArray.filter(p => p.isOnline).length;
    const avgRating = profsArray.length > 0
      ? profsArray.reduce((sum, p) => sum + p.rating, 0) / profsArray.length
      : 0;

    let totalReviews = 0;
    const reviewsArray = Array.from(this.reviews.values());
    for (const reviews of reviewsArray) {
      totalReviews += reviews.length;
    }

    return {
      totalProfessionals: profsArray.length,
      verifiedProfessionals: verifiedCount,
      averageRating: Math.round(avgRating * 10) / 10,
      onlineProfessionals: onlineCount,
      totalReviews,
    };
  }

  /**
   * Get top professionals
   */
  async getTopProfessionals(limit: number = 10): Promise<ProfessionalProfile[]> {
    const profsArray = Array.from(this.professionals.values());
    return profsArray
      .filter(p => p.verificationStatus === 'verified')
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }
}

export const professionalMarketplaceService = new ProfessionalMarketplaceService();
