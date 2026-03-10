/**
 * Continuing Education Service
 * Manages professional development courses with CEC credits
 */

interface Course {
  id: string;
  title: string;
  description: string;
  category: 'pharmacology' | 'clinical' | 'legal' | 'research' | 'business';
  instructor: {
    name: string;
    credentials: string;
    bio: string;
  };
  duration: number; // minutes
  cecCredits: number;
  cecBodies: ('CFM' | 'COREN' | 'CFF')[];
  level: 'beginner' | 'intermediate' | 'advanced';
  language: 'pt-BR' | 'en-US' | 'es-ES';
  status: 'draft' | 'published' | 'archived';
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  price: number;
  modules: Module[];
  rating: number;
  enrollments: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  duration: number; // minutes
  content: string; // HTML content
  videoUrl?: string;
  resources: Resource[];
  quiz?: Quiz;
}

interface Resource {
  id: string;
  type: 'pdf' | 'video' | 'article' | 'case_study';
  title: string;
  url: string;
  downloadable: boolean;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  passingScore: number; // 0-100
  timeLimit?: number; // minutes
}

interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'essay';
  text: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
}

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  completedAt?: Date;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  progress: number; // 0-100
  moduleProgress: Map<string, number>;
  quizScores: Map<string, number>;
  certificateUrl?: string;
}

interface Certificate {
  id: string;
  enrollmentId: string;
  courseId: string;
  userId: string;
  issuedAt: Date;
  expiresAt?: Date;
  cecCredits: number;
  cecBodies: ('CFM' | 'COREN' | 'CFF')[];
  certificateNumber: string;
  verificationUrl: string;
}

export class ContinuingEducationService {
  private courses: Map<string, Course> = new Map();
  private enrollments: Map<string, Enrollment> = new Map();
  private certificates: Map<string, Certificate> = new Map();

  constructor() {
    this.initializeCourses();
  }

  /**
   * Initialize sample courses
   */
  private initializeCourses(): void {
    const courses: Course[] = [
      {
        id: 'course_001',
        title: 'Cannabis Medicinal: Farmacologia e Clínica',
        description: 'Curso abrangente sobre farmacologia de canabinoides e aplicações clínicas',
        category: 'pharmacology',
        instructor: {
          name: 'Dr. João Silva, MD, PhD',
          credentials: 'Especialista em Farmacologia Clínica',
          bio: 'Pesquisador com 15 anos de experiência em cannabis medicinal',
        },
        duration: 480, // 8 hours
        cecCredits: 8,
        cecBodies: ['CFM', 'COREN'],
        level: 'intermediate',
        language: 'pt-BR',
        status: 'published',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        maxParticipants: 500,
        price: 199.90,
        modules: [
          {
            id: 'mod_001',
            title: 'Introdução aos Canabinoides',
            description: 'Fundamentos de THC, CBD e outros canabinoides',
            duration: 60,
            content: '<h2>Introdução aos Canabinoides</h2><p>...</p>',
            resources: [
              {
                id: 'res_001',
                type: 'pdf',
                title: 'Guia de Canabinoides',
                url: 'https://example.com/cannabinoids.pdf',
                downloadable: true,
              },
            ],
            quiz: {
              id: 'quiz_001',
              title: 'Teste de Conhecimento',
              questions: [
                {
                  id: 'q_001',
                  type: 'multiple_choice',
                  text: 'Qual é o principal canabinóide psicoativo?',
                  options: ['THC', 'CBD', 'CBN', 'CBDA'],
                  correctAnswer: 0,
                  explanation: 'THC (Tetrahidrocanabinol) é o principal canabinóide psicoativo',
                },
              ],
              passingScore: 70,
            },
          },
        ],
        rating: 4.8,
        enrollments: 342,
      },
      {
        id: 'course_002',
        title: 'Aspectos Legais e Regulatórios da Cannabis Medicinal',
        description: 'Legislação brasileira, ANVISA, CFM e conformidade legal',
        category: 'legal',
        instructor: {
          name: 'Dra. Maria Santos, LLM',
          credentials: 'Advogada Especialista em Direito Médico',
          bio: 'Consultora jurídica com expertise em regulação de cannabis',
        },
        duration: 240, // 4 hours
        cecCredits: 4,
        cecBodies: ['CFM'],
        level: 'beginner',
        language: 'pt-BR',
        status: 'published',
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        price: 99.90,
        modules: [],
        rating: 4.6,
        enrollments: 215,
      },
      {
        id: 'course_003',
        title: 'Prescrição Digital e Conformidade ANVISA',
        description: 'Implementação de prescrições digitais com assinatura eletrônica',
        category: 'clinical',
        instructor: {
          name: 'Dr. Carlos Oliveira, MD',
          credentials: 'Especialista em Telemedicina',
          bio: 'Pioneiro em implementação de prescrição digital no Brasil',
        },
        duration: 300, // 5 hours
        cecCredits: 5,
        cecBodies: ['CFM', 'COREN'],
        level: 'intermediate',
        language: 'pt-BR',
        status: 'published',
        startDate: new Date(),
        endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        price: 149.90,
        modules: [],
        rating: 4.9,
        enrollments: 428,
      },
    ];

    for (const course of courses) {
      this.courses.set(course.id, course);
    }
  }

  /**
   * Get all available courses
   */
  async getAllCourses(filters?: {
    category?: string;
    level?: string;
    cecBody?: string;
  }): Promise<Course[]> {
    const coursesArray = Array.from(this.courses.values()).filter(c => c.status === 'published');

    if (filters?.category) {
      return coursesArray.filter(c => c.category === filters.category);
    }

    if (filters?.level) {
      return coursesArray.filter(c => c.level === filters.level);
    }

    if (filters?.cecBody) {
      return coursesArray.filter(c => c.cecBodies.includes(filters.cecBody as any));
    }

    return coursesArray;
  }

  /**
   * Get course details
   */
  async getCourseDetails(courseId: string): Promise<Course | null> {
    return this.courses.get(courseId) || null;
  }

  /**
   * Enroll professional in course
   */
  async enrollInCourse(userId: string, courseId: string): Promise<Enrollment> {
    const course = this.courses.get(courseId);
    if (!course) {
      throw new Error('Curso não encontrado');
    }

    if (course.maxParticipants && course.enrollments >= course.maxParticipants) {
      throw new Error('Curso cheio - máximo de participantes atingido');
    }

    const enrollment: Enrollment = {
      id: `enroll_${Date.now()}`,
      userId,
      courseId,
      enrolledAt: new Date(),
      status: 'enrolled',
      progress: 0,
      moduleProgress: new Map(),
      quizScores: new Map(),
    };

    this.enrollments.set(enrollment.id, enrollment);
    course.enrollments++;

    console.log(`[EDUCATION] Inscrição criada: ${userId} em ${course.title}`);

    return enrollment;
  }

  /**
   * Update module progress
   */
  async updateModuleProgress(enrollmentId: string, moduleId: string, progress: number): Promise<Enrollment> {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) {
      throw new Error('Inscrição não encontrada');
    }

    enrollment.moduleProgress.set(moduleId, progress);

    // Calculate overall progress
    const moduleProgressArray = Array.from(enrollment.moduleProgress.values());
    enrollment.progress = moduleProgressArray.length > 0
      ? Math.round(moduleProgressArray.reduce((a, b) => a + b, 0) / moduleProgressArray.length)
      : 0;

    this.enrollments.set(enrollmentId, enrollment);
    console.log(`[EDUCATION] Progresso atualizado: ${enrollmentId} - ${enrollment.progress}%`);

    return enrollment;
  }

  /**
   * Submit quiz answers
   */
  async submitQuizAnswers(enrollmentId: string, moduleId: string, answers: Map<string, any>): Promise<{
    score: number;
    passed: boolean;
    feedback: string;
  }> {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) {
      throw new Error('Inscrição não encontrada');
    }

    const course = this.courses.get(enrollment.courseId);
    if (!course) {
      throw new Error('Curso não encontrado');
    }

    const module = course.modules.find(m => m.id === moduleId);
    if (!module || !module.quiz) {
      throw new Error('Quiz não encontrado');
    }

    // Calculate score
    let correctAnswers = 0;
    for (const question of module.quiz.questions) {
      const answer = answers.get(question.id);
      if (answer === question.correctAnswer) {
        correctAnswers++;
      }
    }

    const score = Math.round((correctAnswers / module.quiz.questions.length) * 100);
    const passed = score >= module.quiz.passingScore;

    enrollment.quizScores.set(moduleId, score);
    this.enrollments.set(enrollmentId, enrollment);

    console.log(`[EDUCATION] Quiz submetido: ${enrollmentId} - Score: ${score}`);

    return {
      score,
      passed,
      feedback: passed ? 'Parabéns! Você passou no quiz.' : 'Você não atingiu a pontuação mínima. Tente novamente.',
    };
  }

  /**
   * Complete course and generate certificate
   */
  async completeCourse(enrollmentId: string): Promise<Certificate> {
    const enrollment = this.enrollments.get(enrollmentId);
    if (!enrollment) {
      throw new Error('Inscrição não encontrada');
    }

    const course = this.courses.get(enrollment.courseId);
    if (!course) {
      throw new Error('Curso não encontrado');
    }

    // Check if all modules are completed
    if (enrollment.progress < 100) {
      throw new Error('Curso não foi completado - progresso insuficiente');
    }

    enrollment.status = 'completed';
    enrollment.completedAt = new Date();

    // Generate certificate
    const certificate: Certificate = {
      id: `cert_${Date.now()}`,
      enrollmentId,
      courseId: course.id,
      userId: enrollment.userId,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), // 3 years
      cecCredits: course.cecCredits,
      cecBodies: course.cecBodies,
      certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      verificationUrl: `https://plantaeraiz.com/verify/${Math.random().toString(36).substr(2, 9)}`,
    };

    this.certificates.set(certificate.id, certificate);
    enrollment.certificateUrl = certificate.verificationUrl;

    this.enrollments.set(enrollmentId, enrollment);

    console.log(`[EDUCATION] Certificado gerado: ${certificate.certificateNumber}`);

    return certificate;
  }

  /**
   * Get professional's enrollments
   */
  async getProfessionalEnrollments(userId: string): Promise<Enrollment[]> {
    const userEnrollments = Array.from(this.enrollments.values()).filter(e => e.userId === userId);
    return userEnrollments;
  }

  /**
   * Get professional's certificates
   */
  async getProfessionalCertificates(userId: string): Promise<Certificate[]> {
    const userCertificates = Array.from(this.certificates.values()).filter(c => c.userId === userId);
    return userCertificates;
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(certificateNumber: string): Promise<Certificate | null> {
    const certificatesArray = Array.from(this.certificates.values());
    return certificatesArray.find(c => c.certificateNumber === certificateNumber) || null;
  }

  /**
   * Get education statistics
   */
  async getEducationStatistics(): Promise<{
    totalCourses: number;
    totalEnrollments: number;
    totalCertificates: number;
    averageRating: number;
    cecCreditsIssued: number;
  }> {
    const coursesArray = Array.from(this.courses.values());
    const totalEnrollments = Array.from(this.enrollments.values()).filter(e => e.status === 'completed').length;
    const totalCertificates = this.certificates.size;
    const averageRating = coursesArray.length > 0
      ? coursesArray.reduce((sum, c) => sum + c.rating, 0) / coursesArray.length
      : 0;
    const cecCreditsIssued = Array.from(this.certificates.values()).reduce((sum, c) => sum + c.cecCredits, 0);

    return {
      totalCourses: coursesArray.length,
      totalEnrollments,
      totalCertificates,
      averageRating: Math.round(averageRating * 10) / 10,
      cecCreditsIssued,
    };
  }

  /**
   * Create new course
   */
  async createCourse(courseData: Partial<Course>): Promise<Course> {
    const course: Course = {
      id: `course_${Date.now()}`,
      title: courseData.title || '',
      description: courseData.description || '',
      category: courseData.category || 'clinical',
      instructor: courseData.instructor || { name: '', credentials: '', bio: '' },
      duration: courseData.duration || 0,
      cecCredits: courseData.cecCredits || 0,
      cecBodies: courseData.cecBodies || ['CFM'],
      level: courseData.level || 'beginner',
      language: courseData.language || 'pt-BR',
      status: 'draft',
      startDate: courseData.startDate || new Date(),
      endDate: courseData.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      modules: courseData.modules || [],
      price: courseData.price || 0,
      rating: 0,
      enrollments: 0,
    };

    this.courses.set(course.id, course);
    console.log(`[EDUCATION] Curso criado: ${course.title}`);

    return course;
  }
}

export const continuingEducationService = new ContinuingEducationService();
