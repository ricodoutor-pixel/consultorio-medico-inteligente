import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Award, Users, Play, CheckCircle, Lock } from "lucide-react";

const courses = [
  {
    id: 1,
    title: "Introdução à Cannabis Medicinal",
    description: "Fundamentos científicos, história e aplicações terapêuticas da cannabis na medicina moderna.",
    lessons: 12,
    duration: "6h",
    students: 2340,
    level: "Iniciante",
    image: "🌿",
    topics: ["História", "Endocanabinoides", "Fitoquímica", "Legislação"],
  },
  {
    id: 2,
    title: "Farmacologia da Cannabis",
    description: "Mecanismos de ação dos canabinoides, farmacocinética e farmacodinâmica.",
    lessons: 15,
    duration: "8h",
    students: 1890,
    level: "Intermediário",
    image: "🧬",
    topics: ["THC", "CBD", "Terpenos", "Receptores CB1/CB2"],
  },
  {
    id: 3,
    title: "Indicações Clínicas",
    description: "Evidências científicas para uso em dor crônica, epilepsia, ansiedade e mais.",
    lessons: 18,
    duration: "10h",
    students: 2100,
    level: "Intermediário",
    image: "🏥",
    topics: ["Dor Crônica", "Epilepsia", "Ansiedade", "Oncologia"],
  },
  {
    id: 4,
    title: "Dosagem e Administração",
    description: "Protocolos de titulação, vias de administração e monitoramento de pacientes.",
    lessons: 10,
    duration: "5h",
    students: 1650,
    level: "Avançado",
    image: "💊",
    topics: ["Titulação", "Sublingual", "Inalação", "Tópico"],
  },
  {
    id: 5,
    title: "Efeitos Colaterais e Contraindicações",
    description: "Manejo de efeitos adversos, interações medicamentosas e populações especiais.",
    lessons: 8,
    duration: "4h",
    students: 1430,
    level: "Intermediário",
    image: "⚠️",
    topics: ["Efeitos Adversos", "Interações", "Gestantes", "Idosos"],
  },
  {
    id: 6,
    title: "Legislação Brasileira (ANVISA)",
    description: "RDC 660/2023, importação, prescrição e direitos dos pacientes.",
    lessons: 10,
    duration: "5h",
    students: 3200,
    level: "Iniciante",
    image: "⚖️",
    topics: ["RDC 660", "Importação", "Prescrição", "LGPD"],
  },
  {
    id: 7,
    title: "Casos Clínicos Reais",
    description: "Análise detalhada de casos clínicos reais com resultados documentados.",
    lessons: 20,
    duration: "12h",
    students: 1200,
    level: "Avançado",
    image: "📋",
    topics: ["Fibromialgia", "Parkinson", "TEPT", "Autismo"],
  },
  {
    id: 8,
    title: "Pesquisa Científica Atual",
    description: "Últimas descobertas, ensaios clínicos em andamento e futuro da pesquisa.",
    lessons: 14,
    duration: "7h",
    students: 980,
    level: "Avançado",
    image: "🔬",
    topics: ["Ensaios Clínicos", "Meta-análises", "Novas Moléculas", "IA em Pesquisa"],
  },
  {
    id: 9,
    title: "Integração com Terapias Convencionais",
    description: "Como combinar cannabis medicinal com tratamentos tradicionais de forma segura.",
    lessons: 12,
    duration: "6h",
    students: 1100,
    level: "Intermediário",
    image: "🤝",
    topics: ["Oncologia Integrativa", "Psiquiatria", "Reumatologia", "Neurologia"],
  },
  {
    id: 10,
    title: "Ética e Profissionalismo",
    description: "Conduta médica, consentimento informado e responsabilidade profissional.",
    lessons: 8,
    duration: "4h",
    students: 1550,
    level: "Iniciante",
    image: "🎓",
    topics: ["Bioética", "Consentimento", "CFM", "Sigilo Médico"],
  },
];

const levelColor: Record<string, string> = {
  Iniciante: "bg-green-500/20 text-green-400 border-green-500/30",
  Intermediário: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Avançado: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function Cursos() {
  const [selectedLevel, setSelectedLevel] = useState<string>("Todos");

  const filtered = selectedLevel === "Todos"
    ? courses
    : courses.filter((c) => c.level === selectedLevel);

  return (
    <>
      <SEO
        title="Cursos Gratuitos | Cannabis Medicinal | Planta & Raiz"
        description="10 cursos gratuitos sobre cannabis medicinal. Aprenda farmacologia, indicações clínicas, dosagem e legislação com certificado."
      />
      <Navbar />
      <main className="min-h-dvh bg-background pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <BookOpen size={14} className="mr-1" /> 100% Gratuito
            </Badge>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4">
              Cursos de <span className="text-primary">Cannabis Medicinal</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              10 cursos estruturados com certificado. Do básico ao avançado, aprenda com os melhores especialistas.
            </p>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><BookOpen size={16} /> 127 aulas</span>
              <span className="flex items-center gap-1"><Clock size={16} /> 67 horas</span>
              <span className="flex items-center gap-1"><Users size={16} /> 17.440 alunos</span>
              <span className="flex items-center gap-1"><Award size={16} /> Certificado</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex justify-center gap-2 mb-10 flex-wrap">
            {["Todos", "Iniciante", "Intermediário", "Avançado"].map((level) => (
              <Button
                key={level}
                size="sm"
                variant={selectedLevel === level ? "default" : "outline"}
                onClick={() => setSelectedLevel(level)}
                className="rounded-full"
              >
                {level}
              </Button>
            ))}
          </div>

          {/* Course Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => (
              <Card key={course.id} className="bg-card border-border hover:border-primary/40 transition-all group cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <span className="text-4xl">{course.image}</span>
                    <Badge variant="outline" className={levelColor[course.level]}>
                      {course.level}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold mt-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>

                  <div className="flex flex-wrap gap-1">
                    {course.topics.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px] px-2 py-0">
                        {t}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Play size={12} /> {course.lessons} aulas</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {course.students.toLocaleString()}</span>
                  </div>

                  <Progress value={0} className="h-1" />

                  <Button className="w-full font-bold" size="sm">
                    <Play size={14} className="mr-1" /> Começar Curso
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
