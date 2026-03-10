/**
 * Clinical Research Service
 * Manage clinical trials, patient recruitment, and results tracking
 */

interface ClinicalStudy {
  id: string;
  title: string;
  description: string;
  principalInvestigator: string;
  institution: string;
  status: 'draft' | 'approved' | 'recruiting' | 'active' | 'completed' | 'terminated';
  startDate: Date;
  endDate?: Date;
  targetParticipants: number;
  currentParticipants: number;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  primaryOutcome: string;
  secondaryOutcomes: string[];
  studyArm: string;
  duration: number; // in weeks
  conepApprovalNumber?: string;
  ethicsCommitteeApprovalDate?: Date;
  budget: number;
  fundingSource: string;
  cannabisStrains: string[];
  dosageRange: { min: number; max: number }; // in mg
  administrationRoute: 'oral' | 'sublingual' | 'topical' | 'inhalation';
  createdAt: Date;
  updatedAt: Date;
}

interface StudyParticipant {
  id: string;
  studyId: string;
  patientId: string;
  enrollmentDate: Date;
  status: 'screening' | 'enrolled' | 'active' | 'completed' | 'withdrawn' | 'lost_to_followup';
  baselineData: {
    age: number;
    gender: string;
    diagnosis: string;
    symptomSeverity: number; // 1-10
    comorbidities: string[];
    currentMedications: string[];
  };
  randomizationDate?: Date;
  armAssignment?: string;
  withdrawalReason?: string;
  withdrawalDate?: Date;
}

interface StudyVisit {
  id: string;
  studyId: string;
  participantId: string;
  visitNumber: number;
  visitDate: Date;
  visitType: 'screening' | 'baseline' | 'treatment' | 'followup' | 'final';
  assessments: {
    symptomScore: number;
    sideEffects: string[];
    adherence: number; // percentage
    labResults?: Record<string, string>;
    vitals?: {
      bloodPressure: string;
      heartRate: number;
      temperature: number;
    };
  };
  notes: string;
  completedDate: Date;
}

interface StudyResult {
  id: string;
  studyId: string;
  participantId: string;
  baselineScore: number;
  finalScore: number;
  improvement: number; // percentage
  sideEffectsReported: string[];
  adherenceRate: number;
  completionStatus: 'completed' | 'withdrawn' | 'lost_to_followup';
  analysisDate: Date;
}

export class ClinicalResearchService {
  private studies: Map<string, ClinicalStudy> = new Map();
  private participants: Map<string, StudyParticipant> = new Map();
  private visits: Map<string, StudyVisit> = new Map();
  private results: Map<string, StudyResult> = new Map();

  constructor() {
    this.initializeSampleStudies();
  }

  /**
   * Initialize sample clinical studies
   */
  private initializeSampleStudies(): void {
    const studies: ClinicalStudy[] = [
      {
        id: 'study_001',
        title: 'Efficacy of CBD in Anxiety Disorders - A Randomized Controlled Trial',
        description: 'A double-blind, placebo-controlled study evaluating the efficacy of CBD in treating generalized anxiety disorder',
        principalInvestigator: 'Dr. João Silva',
        institution: 'Universidade de São Paulo',
        status: 'recruiting',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2025-12-31'),
        targetParticipants: 200,
        currentParticipants: 87,
        inclusionCriteria: [
          'Age 18-65',
          'Diagnosed with GAD',
          'Stable medication for 4 weeks',
        ],
        exclusionCriteria: [
          'Pregnancy',
          'Severe liver disease',
          'Current substance abuse',
        ],
        primaryOutcome: 'Reduction in GAD-7 score by 50% or more',
        secondaryOutcomes: [
          'Improvement in sleep quality',
          'Reduction in side effects',
          'Quality of life improvement',
        ],
        studyArm: 'CBD vs Placebo',
        duration: 12,
        conepApprovalNumber: 'CONEP/2024-001',
        ethicsCommitteeApprovalDate: new Date('2023-12-01'),
        budget: 500000,
        fundingSource: 'Ministry of Health',
        cannabisStrains: ['Charlotte\'s Web', 'Harlequin', 'AC/DC'],
        dosageRange: { min: 300, max: 600 },
        administrationRoute: 'oral',
        createdAt: new Date('2023-11-01'),
        updatedAt: new Date('2024-02-25'),
      },
      {
        id: 'study_002',
        title: 'Cannabis-Based Medicine for Chronic Pain Management',
        description: 'A prospective cohort study evaluating cannabis-based medicine in patients with chronic pain',
        principalInvestigator: 'Dr. Maria Santos',
        institution: 'Hospital das Clínicas',
        status: 'active',
        startDate: new Date('2023-06-01'),
        endDate: new Date('2025-06-01'),
        targetParticipants: 150,
        currentParticipants: 142,
        inclusionCriteria: [
          'Age 30-75',
          'Chronic pain for >6 months',
          'Failed conventional treatment',
        ],
        exclusionCriteria: [
          'Active cancer',
          'Severe psychiatric disorder',
          'Recent surgery',
        ],
        primaryOutcome: 'Pain reduction of 30% or more on VAS scale',
        secondaryOutcomes: [
          'Functional improvement',
          'Reduction in opioid use',
          'Improvement in sleep',
        ],
        studyArm: 'THC:CBD 1:1 vs THC:CBD 1:20',
        duration: 24,
        conepApprovalNumber: 'CONEP/2023-045',
        ethicsCommitteeApprovalDate: new Date('2023-05-15'),
        budget: 750000,
        fundingSource: 'FAPESP',
        cannabisStrains: ['Pennywise', 'Remedy', 'Sour Tsunami'],
        dosageRange: { min: 100, max: 400 },
        administrationRoute: 'sublingual',
        createdAt: new Date('2023-04-01'),
        updatedAt: new Date('2024-02-25'),
      },
    ];

    for (const study of studies) {
      this.studies.set(study.id, study);
    }
  }

  /**
   * Create new clinical study
   */
  async createStudy(studyData: Partial<ClinicalStudy>): Promise<ClinicalStudy> {
    const study: ClinicalStudy = {
      id: `study_${Date.now()}`,
      title: studyData.title || '',
      description: studyData.description || '',
      principalInvestigator: studyData.principalInvestigator || '',
      institution: studyData.institution || '',
      status: 'draft',
      startDate: studyData.startDate || new Date(),
      targetParticipants: studyData.targetParticipants || 100,
      currentParticipants: 0,
      inclusionCriteria: studyData.inclusionCriteria || [],
      exclusionCriteria: studyData.exclusionCriteria || [],
      primaryOutcome: studyData.primaryOutcome || '',
      secondaryOutcomes: studyData.secondaryOutcomes || [],
      studyArm: studyData.studyArm || '',
      duration: studyData.duration || 12,
      budget: studyData.budget || 0,
      fundingSource: studyData.fundingSource || '',
      cannabisStrains: studyData.cannabisStrains || [],
      dosageRange: studyData.dosageRange || { min: 0, max: 0 },
      administrationRoute: studyData.administrationRoute || 'oral',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.studies.set(study.id, study);
    console.log(`[CLINICAL RESEARCH] Estudo criado: ${study.id}`);

    return study;
  }

  /**
   * Enroll patient in study
   */
  async enrollPatient(
    studyId: string,
    patientId: string,
    baselineData: StudyParticipant['baselineData']
  ): Promise<StudyParticipant> {
    const study = this.studies.get(studyId);
    if (!study) {
      throw new Error('Estudo não encontrado');
    }

    if (study.currentParticipants >= study.targetParticipants) {
      throw new Error('Estudo já atingiu número máximo de participantes');
    }

    const participant: StudyParticipant = {
      id: `part_${Date.now()}`,
      studyId,
      patientId,
      enrollmentDate: new Date(),
      status: 'screening',
      baselineData,
    };

    this.participants.set(participant.id, participant);
    study.currentParticipants++;

    console.log(`[CLINICAL RESEARCH] Paciente inscrito: ${participant.id} no estudo ${studyId}`);

    return participant;
  }

  /**
   * Record study visit
   */
  async recordVisit(
    studyId: string,
    participantId: string,
    visitData: Partial<StudyVisit>
  ): Promise<StudyVisit> {
    const participant = this.participants.get(participantId);
    if (!participant) {
      throw new Error('Participante não encontrado');
    }

    const visit: StudyVisit = {
      id: `visit_${Date.now()}`,
      studyId,
      participantId,
      visitNumber: visitData.visitNumber || 1,
      visitDate: visitData.visitDate || new Date(),
      visitType: visitData.visitType || 'followup',
      assessments: visitData.assessments || {
        symptomScore: 0,
        sideEffects: [],
        adherence: 0,
      },
      notes: visitData.notes || '',
      completedDate: new Date(),
    };

    this.visits.set(visit.id, visit);
    console.log(`[CLINICAL RESEARCH] Visita registrada: ${visit.id}`);

    return visit;
  }

  /**
   * Analyze study results
   */
  async analyzeResults(studyId: string): Promise<{
    totalParticipants: number;
    completedParticipants: number;
    withdrawnParticipants: number;
    averageImprovement: number;
    sideEffectsProfile: Record<string, number>;
    adherenceRate: number;
  }> {
    const studyResults: StudyResult[] = [];
    const participantsArray = Array.from(this.participants.values());
    
    for (const participant of participantsArray) {
      if (participant.studyId !== studyId) continue;

      const visitsArray = Array.from(this.visits.values());
      const participantVisits = visitsArray.filter(v => v.participantId === participant.id);

      if (participantVisits.length > 0) {
        const baselineVisit = participantVisits.find(v => v.visitType === 'baseline');
        const finalVisit = participantVisits[participantVisits.length - 1];

        if (baselineVisit && finalVisit) {
          const baselineScore = baselineVisit.assessments.symptomScore;
          const finalScore = finalVisit.assessments.symptomScore;
          const improvement = ((baselineScore - finalScore) / baselineScore) * 100;

          const result: StudyResult = {
            id: `result_${Date.now()}`,
            studyId,
            participantId: participant.id,
            baselineScore,
            finalScore,
            improvement: Math.max(0, improvement),
            sideEffectsReported: finalVisit.assessments.sideEffects,
            adherenceRate: finalVisit.assessments.adherence,
            completionStatus: participant.status === 'completed' ? 'completed' : 'withdrawn',
            analysisDate: new Date(),
          };

          studyResults.push(result);
        }
      }
    }

    // Calculate aggregate statistics
    const completedCount = studyResults.filter(r => r.completionStatus === 'completed').length;
    const totalImprovement = studyResults.reduce((sum, r) => sum + r.improvement, 0);
    const avgImprovement = studyResults.length > 0 ? totalImprovement / studyResults.length : 0;

    const sideEffectsMap = new Map<string, number>();
    for (const result of studyResults) {
      for (const sideEffect of result.sideEffectsReported) {
        sideEffectsMap.set(sideEffect, (sideEffectsMap.get(sideEffect) || 0) + 1);
      }
    }

    const avgAdherence = studyResults.length > 0
      ? studyResults.reduce((sum, r) => sum + r.adherenceRate, 0) / studyResults.length
      : 0;

    const sideEffectsProfile: Record<string, number> = {};
    const sideEffectsArray = Array.from(sideEffectsMap.entries());
    for (const [effect, count] of sideEffectsArray) {
      sideEffectsProfile[effect] = (count / studyResults.length) * 100;
    }

    console.log(`[CLINICAL RESEARCH] Análise concluída para estudo ${studyId}`);

    return {
      totalParticipants: studyResults.length,
      completedParticipants: completedCount,
      withdrawnParticipants: studyResults.length - completedCount,
      averageImprovement: Math.round(avgImprovement * 10) / 10,
      sideEffectsProfile,
      adherenceRate: Math.round(avgAdherence * 10) / 10,
    };
  }

  /**
   * Get study details
   */
  async getStudyDetails(studyId: string): Promise<ClinicalStudy | null> {
    const study = this.studies.get(studyId);
    return study || null;
  }

  /**
   * Get all studies
   */
  async getAllStudies(status?: string): Promise<ClinicalStudy[]> {
    const studiesArray = Array.from(this.studies.values());
    if (status) {
      return studiesArray.filter(s => s.status === status);
    }
    return studiesArray;
  }

  /**
   * Get participant data
   */
  async getParticipantData(participantId: string): Promise<{
    participant: StudyParticipant | null;
    visits: StudyVisit[];
  }> {
    const participant = this.participants.get(participantId) || null;
    const visitsArray = Array.from(this.visits.values());
    const participantVisits = visitsArray.filter(v => v.participantId === participantId);

    return {
      participant,
      visits: participantVisits,
    };
  }

  /**
   * Export study data for analysis
   */
  async exportStudyData(studyId: string): Promise<{
    study: ClinicalStudy | null;
    participants: StudyParticipant[];
    visits: StudyVisit[];
    results: StudyResult[];
  }> {
    const study = this.studies.get(studyId) || null;
    const participantsArray = Array.from(this.participants.values());
    const visitsArray = Array.from(this.visits.values());
    const resultsArray = Array.from(this.results.values());

    const studyParticipants = participantsArray.filter(p => p.studyId === studyId);
    const studyVisits = visitsArray.filter(v => v.studyId === studyId);
    const studyResults = resultsArray.filter(r => r.studyId === studyId);

    console.log(`[CLINICAL RESEARCH] Dados exportados para estudo ${studyId}`);

    return {
      study,
      participants: studyParticipants,
      visits: studyVisits,
      results: studyResults,
    };
  }

  /**
   * Get research statistics
   */
  async getResearchStatistics(): Promise<{
    totalStudies: number;
    activeStudies: number;
    totalParticipants: number;
    completedStudies: number;
    averageParticipantImprovement: number;
  }> {
    const studiesArray = Array.from(this.studies.values());
    const activeStudies = studiesArray.filter(s => s.status === 'active' || s.status === 'recruiting').length;
    const completedStudies = studiesArray.filter(s => s.status === 'completed').length;
    const totalParticipants = studiesArray.reduce((sum, s) => sum + s.currentParticipants, 0);

    // Calculate average improvement across all studies
    const resultsArray = Array.from(this.results.values());
    const avgImprovement = resultsArray.length > 0
      ? resultsArray.reduce((sum, r) => sum + r.improvement, 0) / resultsArray.length
      : 0;

    return {
      totalStudies: studiesArray.length,
      activeStudies,
      totalParticipants,
      completedStudies,
      averageParticipantImprovement: Math.round(avgImprovement * 10) / 10,
    };
  }
}

export const clinicalResearchService = new ClinicalResearchService();
