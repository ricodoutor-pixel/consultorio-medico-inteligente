import React, { useState } from 'react';
import { Download, BookOpen, Users, Award, Zap, Shield, Star, ArrowRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const EbookDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    setIsDownloading(true);
    // Simular download
    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                  <BookOpen size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-primary">Educação Médica Continuada</span>
                </div>

                <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                  Cannabis Medicinal
                </h1>

                <h2 className="text-2xl lg:text-3xl font-semibold text-muted-foreground">
                  Curso Completo para Médicos Prescritores
                </h2>

                <p className="text-lg text-muted-foreground leading-relaxed">
                  Descubra as descobertas científicas mais recentes sobre cannabis medicinal. Um guia completo de 300+ páginas com 150+ referências científicas, casos clínicos e protocolos de prescrição.
                </p>
              </div>

              {/* Key Features */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">300+ Páginas</p>
                    <p className="text-sm text-muted-foreground">Conteúdo estruturado em 10 módulos temáticos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">150+ Referências Científicas</p>
                    <p className="text-sm text-muted-foreground">Artigos de 2024-2025 com evidência de alta qualidade</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Casos Clínicos Reais</p>
                    <p className="text-sm text-muted-foreground">10+ casos de sucesso com resultados mensuráveis</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">100+ Questões de Revisão</p>
                    <p className="text-sm text-muted-foreground">Avalie seu conhecimento com perguntas práticas</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a
                  href="/public/EBOOK_CANNABIS_MEDICINAL_CURSO_COMPLETO.pdf"
                  download="EBOOK_CANNABIS_MEDICINAL_CURSO_COMPLETO.pdf"
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105"
                >
                  <Download size={20} />
                  {isDownloading ? 'Baixando...' : 'Baixar E-book Grátis'}
                </a>

                <Link
                  to="/ebook-viewer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-card border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary/10 transition-all duration-300"
                >
                  <BookOpen size={20} />
                  Visualizar Online
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Shield size={16} className="text-green-500" />
                  <span>100% Seguro</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users size={16} className="text-blue-500" />
                  <span>5.000+ Médicos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star size={16} className="text-yellow-500" />
                  <span>4.9/5 Avaliação</span>
                </div>
              </div>
            </div>

            {/* Right Column - E-book Preview */}
            <div className="relative">
              <div className="relative w-full aspect-[9/12] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl border-2 border-primary/30 overflow-hidden shadow-2xl">
                {/* E-book Cover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-green-500 flex flex-col items-center justify-center p-8 text-white">
                  <div className="text-center space-y-6">
                    <BookOpen size={64} className="mx-auto opacity-90" />
                    <h3 className="text-3xl font-bold">Cannabis Medicinal</h3>
                    <p className="text-lg opacity-90">Curso Completo para Médicos</p>
                    <div className="space-y-2 text-sm opacity-80">
                      <p>300+ Páginas</p>
                      <p>150+ Referências</p>
                      <p>10 Módulos</p>
                    </div>
                    <div className="pt-8 border-t border-white/30">
                      <p className="text-sm opacity-75">Planta & Raiz - 2026</p>
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -bottom-4 -right-4 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg transform rotate-12">
                  <p className="font-bold text-sm">GRÁTIS</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-primary">63</p>
                  <p className="text-xs text-muted-foreground">Páginas</p>
                </div>
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-secondary">698</p>
                  <p className="text-xs text-muted-foreground">KB</p>
                </div>
                <div className="bg-card rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-bold text-green-500">100%</p>
                  <p className="text-xs text-muted-foreground">Seguro</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">10 Módulos Completos</h2>
            <p className="text-lg text-muted-foreground">Conteúdo estruturado para máxima compreensão</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { num: 1, title: 'Fundamentos', icon: '🌿' },
              { num: 2, title: 'Canabinoides', icon: '🧪' },
              { num: 3, title: 'Neurologia', icon: '🧠' },
              { num: 4, title: 'Oncologia', icon: '🏥' },
              { num: 5, title: 'Saúde Mental', icon: '💭' },
              { num: 6, title: 'Reumatologia', icon: '🦴' },
              { num: 7, title: 'Prescrição', icon: '💊' },
              { num: 8, title: 'Segurança', icon: '⚠️' },
              { num: 9, title: 'Regulamentação', icon: '⚖️' },
              { num: 10, title: 'Casos Clínicos', icon: '📋' },
            ].map((module) => (
              <div key={module.num} className="bg-card border border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <p className="text-4xl mb-2">{module.icon}</p>
                <p className="font-bold mb-1">Módulo {module.num}</p>
                <p className="text-sm text-muted-foreground">{module.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Highlights */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold">Conteúdo Científico</h3>
              <p className="text-muted-foreground">
                Baseado em 150+ artigos científicos de 2024-2025, com revisão por especialistas em cannabis medicinal.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Users size={24} className="text-secondary" />
              </div>
              <h3 className="text-xl font-bold">Casos Reais</h3>
              <p className="text-muted-foreground">
                10+ casos clínicos com resultados mensuráveis, dosagens, protocolos e acompanhamento.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Award size={24} className="text-green-500" />
              </div>
              <h3 className="text-xl font-bold">Educação Continuada</h3>
              <p className="text-muted-foreground">
                100+ questões de revisão, testes práticos e certificação de conclusão.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">O que Médicos Dizem</h2>
            <p className="text-lg text-muted-foreground">Feedback de profissionais que usam o e-book</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Dr. Carlos Silva',
                specialty: 'Neurologista',
                text: 'E-book excelente! Muito bem estruturado e com informações atualizadas. Recomendo para todos os colegas.',
                rating: 5
              },
              {
                name: 'Dra. Ana Santos',
                specialty: 'Oncologista',
                text: 'Finalmente um material em português sobre cannabis medicinal. Muito útil para minha prática clínica.',
                rating: 5
              },
              {
                name: 'Dr. Roberto Costa',
                specialty: 'Clínico Geral',
                text: 'Conteúdo prático e baseado em evidência. Os casos clínicos ajudaram muito na minha tomada de decisão.',
                rating: 5
              }
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-card border border-border rounded-lg p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.specialty}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Perguntas Frequentes</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'O e-book é realmente grátis?',
                a: 'Sim! O e-book é totalmente grátis para médicos prescritores e estudantes de medicina. Não há custos ocultos.'
              },
              {
                q: 'Qual é o formato do arquivo?',
                a: 'O e-book é fornecido em formato PDF (698 KB), compatível com todos os dispositivos.'
              },
              {
                q: 'Preciso de internet para ler?',
                a: 'Não. Após baixar o PDF, você pode ler offline em qualquer dispositivo.'
              },
              {
                q: 'O conteúdo é atualizado?',
                a: 'Sim! Atualizamos o e-book regularmente com as descobertas científicas mais recentes.'
              },
              {
                q: 'Posso compartilhar com colegas?',
                a: 'Sim! Você pode compartilhar o e-book com colegas médicos. Recomendamos que cada um baixe sua cópia.'
              }
            ].map((faq, idx) => (
              <details key={idx} className="bg-card border border-border rounded-lg p-6 cursor-pointer group">
                <summary className="flex items-center justify-between font-bold">
                  <span>{faq.q}</span>
                  <ArrowRight size={20} className="group-open:rotate-90 transition-transform" />
                </summary>
                <p className="text-muted-foreground mt-4">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para Aprender?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Baixe agora o e-book completo sobre Cannabis Medicinal e comece sua jornada de educação continuada.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/public/EBOOK_CANNABIS_MEDICINAL_CURSO_COMPLETO.pdf"
              download="EBOOK_CANNABIS_MEDICINAL_CURSO_COMPLETO.pdf"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105"
            >
              <Download size={20} />
              Baixar E-book Grátis
            </a>

            <Link
              to="/biblioteca"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-card border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary/10 transition-all duration-300"
            >
              <BookOpen size={20} />
              Voltar à Biblioteca
            </Link>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Sem spam, sem compartilhamento de dados. 100% seguro e privado.
          </p>
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">300+</p>
              <p className="text-sm text-muted-foreground">Páginas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-secondary">150+</p>
              <p className="text-sm text-muted-foreground">Referências</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-500">10</p>
              <p className="text-sm text-muted-foreground">Módulos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-blue-500">5K+</p>
              <p className="text-sm text-muted-foreground">Médicos</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EbookDownload;
