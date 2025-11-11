import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Calendar, Shield, FileText, MessageSquare, BarChart3, CheckCircle2 } from "lucide-react";

const Solucao = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              A Plataforma Completa de <span className="text-primary">Telemedicina</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Tudo que você precisa para atender seus pacientes online com excelência e segurança
            </p>
            <Button size="lg" asChild>
              <a href="https://wa.me/5511987131241" target="_blank" rel="noopener noreferrer">
                Agendar Demonstração
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="space-y-24">
            {/* Feature 1 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Video size={16} />
                  Telemedicina
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Consultas por Vídeo de Alta Qualidade
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Realize atendimentos online com qualidade profissional. Nossa plataforma oferece vídeo HD, gravação segura das consultas e total conformidade com as normas do CFM.
                </p>
                <ul className="space-y-3">
                  {[
                    "Vídeo chamada em HD sem necessidade de instalação",
                    "Gravação automática e segura das consultas",
                    "Compartilhamento de tela para visualização de exames",
                    "100% conforme resolução CFM 2.314/2022"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="text-secondary shrink-0 mt-1" size={20} />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                    <Video size={64} className="text-primary-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature 2 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <Card className="md:order-2">
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-secondary to-primary rounded-lg flex items-center justify-center">
                    <Calendar size={64} className="text-primary-foreground" />
                  </div>
                </CardContent>
              </Card>
              <div className="md:order-1">
                <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Calendar size={16} />
                  Agendamento
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Agenda Inteligente com IA
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Sistema de agendamento automatizado que reduz no-shows em até 55%. Confirmações por WhatsApp, lembretes automáticos e reagendamento facilitado.
                </p>
                <ul className="space-y-3">
                  {[
                    "Agendamento online 24/7 para seus pacientes",
                    "Confirmações automáticas via WhatsApp",
                    "Lembretes inteligentes personalizáveis",
                    "Gestão de múltiplas agendas em um só lugar"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="text-primary shrink-0 mt-1" size={20} />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Shield size={16} />
                  Segurança
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Prontuário Eletrônico 100% Seguro
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Armazene todos os dados dos seus pacientes com segurança máxima. Criptografia de ponta a ponta, backup automático e total conformidade com LGPD e CFM.
                </p>
                <ul className="space-y-3">
                  {[
                    "Criptografia de ponta a ponta",
                    "Backup automático em nuvem",
                    "100% conforme LGPD e CFM",
                    "Histórico completo do paciente",
                    "Anexo de exames e documentos"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="text-secondary shrink-0 mt-1" size={20} />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                    <Shield size={64} className="text-primary-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            Recursos Adicionais
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: "Receitas e Atestados Digitais",
                description: "Emita documentos com assinatura digital válida em todo território nacional"
              },
              {
                icon: MessageSquare,
                title: "Chat Integrado",
                description: "Comunicação direta e segura com seus pacientes fora das consultas"
              },
              {
                icon: BarChart3,
                title: "Relatórios Gerenciais",
                description: "Dashboard completo com métricas e insights sobre seu consultório"
              }
            ].map((feature, index) => (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="text-primary" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Experimente Grátis por 30 Dias
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Sem compromisso, sem cartão de crédito. Comece agora e veja a diferença.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href="https://wa.me/5511987131241" target="_blank" rel="noopener noreferrer">
              Iniciar Teste Gratuito
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Solucao;
