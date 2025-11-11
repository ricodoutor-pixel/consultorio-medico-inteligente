import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Video, Calendar, Shield, Users, Stethoscope, Clock, TrendingUp, CheckCircle2 } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 animate-fade-in">
              <div className="inline-block bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium">
                🚀 Revolucione Sua Prática Médica
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                Telemedicina e Gestão{" "}
                <span className="text-primary">Completa</span> para Seu Consultório
              </h1>
              <p className="text-xl text-muted-foreground">
                Atenda seus pacientes online com segurança, organize sua agenda e prontuários digitais. Tudo em uma única plataforma profissional.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild className="text-lg">
                  <a href="https://wa.me/5511987131241" target="_blank" rel="noopener noreferrer">
                    Teste Grátis por 30 Dias
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-lg">
                  <a href="/solucao">Conhecer Solução</a>
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-secondary" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-secondary" />
                  <span>Cancelamento fácil</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
              <Card className="relative backdrop-blur-sm bg-card/50 border-2">
                <CardContent className="p-8">
                  <div className="aspect-video bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                    <Video size={64} className="text-primary-foreground" />
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Stethoscope className="text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Consultas Online</p>
                        <p className="text-sm text-muted-foreground">Via vídeo com qualidade HD</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                        <Calendar className="text-secondary" />
                      </div>
                      <div>
                        <p className="font-semibold">Agenda Inteligente</p>
                        <p className="text-sm text-muted-foreground">Gestão automatizada</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Tudo Que Você Precisa em Uma Plataforma
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simplifique sua rotina médica com ferramentas profissionais e intuitivas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Video,
                title: "Telemedicina Profissional",
                description: "Atendimento por vídeo com qualidade HD, gravação segura e conformidade com CFM",
                color: "primary"
              },
              {
                icon: Calendar,
                title: "Agenda Inteligente",
                description: "Sistema automatizado de agendamento com lembretes por WhatsApp e email",
                color: "secondary"
              },
              {
                icon: Shield,
                title: "Prontuário Digital Seguro",
                description: "100% conforme LGPD e CFM, com criptografia de ponta e backup automático",
                color: "primary"
              },
              {
                icon: Users,
                title: "Gestão de Pacientes",
                description: "Cadastro ilimitado, histórico completo e análise de dados dos pacientes",
                color: "secondary"
              },
              {
                icon: Clock,
                title: "Redução de No-Show",
                description: "Até 55% menos faltas com confirmações automáticas inteligentes",
                color: "primary"
              },
              {
                icon: TrendingUp,
                title: "Relatórios e Analytics",
                description: "Dashboard completo com insights sobre seu consultório",
                color: "secondary"
              }
            ].map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`text-${feature.color}`} size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            Pronto Para Transformar Seu Consultório?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de médicos que já modernizaram sua prática com o Doutor Park
          </p>
          <Button size="lg" variant="secondary" className="text-lg" asChild>
            <a href="https://wa.me/5511987131241" target="_blank" rel="noopener noreferrer">
              Começar Teste Grátis de 30 Dias
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
