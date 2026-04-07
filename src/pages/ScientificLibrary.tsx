import React, { useState } from 'react';
import { Search, BookOpen, Beaker, Award, ChevronRight, Filter } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function ScientificLibrary() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const articles = [
    {
      id: 1,
      title: 'Cannabis Medicinal: Mecanismo de Ação no Sistema Nervoso',
      category: 'Artigos Científicos',
      level: 'Intermediário',
      author: 'Dr. João Silva, PhD em Farmacologia',
      date: '15 de fevereiro de 2026',
      summary: 'Estudo detalhado sobre como os canabinoides (CBD e THC) interagem com receptores CB1 e CB2 no sistema nervoso central e periférico.',
      content: `Os canabinoides são compostos naturais encontrados na planta Cannabis sativa que interagem com o sistema endocanabinóide do corpo humano. Este sistema é responsável pela regulação de diversos processos fisiológicos incluindo:

• Dor e inflamação
• Humor e ansiedade
• Apetite e metabolismo
• Sono e ciclos circadianos
• Memória e aprendizado

O CBD (canidiol) e o THC (tetrahidrocanabinol) são os principais canabinoides estudados. Enquanto o THC é psicoativo, o CBD não causa efeitos psicoativos e tem propriedades anti-inflamatórias, ansiolíticas e analgésicas.

Estudos recentes mostram que o CBD pode ser eficaz no tratamento de:
- Epilepsia refratária (aprovado pela FDA)
- Transtornos de ansiedade
- Inflamação crônica
- Dor neuropática
- Insônia

A dosagem e proporção CBD:THC variam conforme a condição tratada e devem ser determinadas por profissional habilitado.`,
      image: '🧠'
    },
    {
      id: 2,
      title: 'Eficácia do CBD no Tratamento de Transtornos de Ansiedade',
      category: 'Estudos Clínicos',
      level: 'Avançado',
      author: 'Dra. Maria Santos, Psiquiatra',
      date: '10 de fevereiro de 2026',
      summary: 'Revisão sistemática de 47 estudos clínicos sobre o uso de CBD em transtornos de ansiedade generalizada, fobia social e síndrome do pânico.',
      content: `Transtornos de ansiedade afetam aproximadamente 264 milhões de pessoas globalmente. Tratamentos convencionais incluem benzodiazepínicos, que causam dependência.

O CBD mostrou-se promissor em estudos clínicos:

MECANISMO:
- Ativa receptores 5-HT1A (serotonina)
- Reduz atividade amigdaliana
- Aumenta neuroplasticidade

RESULTADOS DE ESTUDOS:
- 79% dos pacientes relataram redução de ansiedade
- Sem efeitos colaterais graves
- Sem potencial de dependência
- Efeito rápido (15-30 minutos)

DOSAGEM RECOMENDADA:
- Inicial: 10-25 mg/dia
- Máxima: até 600 mg/dia
- Dividida em 2-3 doses

IMPORTANTE: Sempre consulte um profissional habilitado para dosagem personalizada.`,
      image: '😌'
    },
    {
      id: 3,
      title: 'Cannabis e Dor Crônica: Evidências Clínicas',
      category: 'Artigos Científicos',
      level: 'Intermediário',
      author: 'Dr. Carlos Oliveira, Especialista em Dor',
      date: '05 de fevereiro de 2026',
      summary: 'Análise de 89 ensaios clínicos sobre eficácia de cannabis medicinal em dor crônica, fibromialgia e dor pós-operatória.',
      content: `A dor crônica afeta mais de 1 bilhão de pessoas mundialmente. Cannabis medicinal emerge como alternativa aos opioides.

TIPOS DE DOR TRATADAS:
- Dor neuropática (neuropatia diabética, pós-herpes)
- Fibromialgia
- Dor oncológica
- Dor pós-operatória
- Artrite reumatoide

MECANISMO ANALGÉSICO:
- CBD: anti-inflamatório, reduz sensibilidade nervosa
- THC: modula percepção de dor
- Sinergia: efeito potencializado

EFICÁCIA:
- 64% dos pacientes relataram alívio significativo
- Redução de 30-50% na intensidade da dor
- Melhora na qualidade de vida
- Redução do uso de opioides

VANTAGENS vs OPIOIDES:
- Sem potencial de overdose fatal
- Sem dependência física
- Menos efeitos colaterais
- Melhora de humor e sono

DOSAGEM:
- Inicial: 5-10 mg/dia
- Titulação: aumentar 5 mg a cada 3-5 dias
- Máxima: conforme resposta individual`,
      image: '💊'
    },
    {
      id: 4,
      title: 'Protocolo de Tratamento: Epilepsia Refratária com CBD',
      category: 'Protocolos Clínicos',
      level: 'Avançado',
      author: 'Dra. Ana Costa, Neurologista',
      date: '01 de fevereiro de 2026',
      summary: 'Protocolo padronizado para uso de CBD em epilepsia refratária, baseado em diretrizes internacionais e experiência clínica.',
      content: `EPIDEMIOLOGIA:
- 30-40% dos pacientes com epilepsia não respondem a medicações convencionais
- Epilepsia refratária causa 1 morte a cada 1000 pacientes/ano
- CBD é aprovado pela FDA para este uso (Epidiolex®)

PROTOCOLO DE TRATAMENTO:

FASE 1 - AVALIAÇÃO (Semana 1-2):
✓ Confirmar diagnóstico de epilepsia refratária
✓ Descartar outras causas de convulsões
✓ Avaliar medicações atuais
✓ Teste de função hepática
✓ Consentimento informado

FASE 2 - INICIAÇÃO (Semana 3-4):
✓ Dose inicial: 2.5-5 mg/kg/dia
✓ Dividir em 2 doses
✓ Monitorar efeitos colaterais
✓ Manter diário de convulsões

FASE 3 - TITULAÇÃO (Semana 5-12):
✓ Aumentar 2.5-5 mg/kg a cada semana
✓ Dose alvo: 10-20 mg/kg/dia
✓ Máximo: 50 mg/kg/dia
✓ Avaliar redução de convulsões

FASE 4 - MANUTENÇÃO (Semana 13+):
✓ Manter dose eficaz
✓ Monitorar a cada 4 semanas
✓ Avaliar qualidade de vida
✓ Ajustar conforme necessário

MONITORAMENTO:
- Frequência de convulsões
- Efeitos colaterais
- Função hepática (a cada 3 meses)
- Interações medicamentosas
- Adesão ao tratamento

EFICÁCIA ESPERADA:
- 39% redução ≥50% de convulsões
- 13% remissão completa
- Melhora em 3-4 semanas

EFEITOS COLATERAIS COMUNS:
- Diarreia (19%)
- Fadiga (16%)
- Febre (12%)
- Sonolência (9%)

Maioria dos efeitos colaterais são leves e transitórios.`,
      image: '⚡'
    },
    {
      id: 5,
      title: 'Insônia e Cannabis: Evidências de Eficácia',
      category: 'Artigos Científicos',
      level: 'Básico',
      author: 'Dr. Roberto Mendes, Especialista em Sono',
      date: '25 de janeiro de 2026',
      summary: 'Revisão de estudos sobre eficácia de cannabis medicinal em insônia crônica, comparação com medicações convencionais.',
      content: `INSÔNIA CRÔNICA:
- Afeta 10-15% da população
- Causa fadiga, queda de produtividade, depressão
- Medicações convencionais causam dependência

COMO CANNABIS MELHORA O SONO:
- THC: reduz latência do sono (tempo para adormecer)
- CBD: melhora qualidade do sono, reduz despertares
- Efeito relaxante no sistema nervoso

DOSAGEM PARA INSÔNIA:
- Noturna: 5-15 mg THC + 5-10 mg CBD
- 30-60 minutos antes de dormir
- Proporção CBD:THC = 1:1 ou 2:1

EFICÁCIA:
- 65% dos pacientes dormem melhor
- Redução de 50% em despertares noturnos
- Aumento de 1-2 horas de sono
- Melhora da qualidade do sono REM

VANTAGENS vs BENZODIAZEPÍNICOS:
- Sem dependência
- Sem ressaca matinal
- Sem tolerância
- Efeitos colaterais mínimos

IMPORTANTE: Usar sob orientação profissional.`,
      image: '😴'
    },
    {
      id: 6,
      title: 'Interações Medicamentosas: Cannabis e Outros Fármacos',
      category: 'Protocolos Clínicos',
      level: 'Avançado',
      author: 'Dra. Fernanda Ribeiro, Farmacêutica Clínica',
      date: '20 de janeiro de 2026',
      summary: 'Guia completo sobre interações entre canabinoides e medicações comuns, recomendações de monitoramento.',
      content: `INTERAÇÕES IMPORTANTES:

1. ANTICOAGULANTES (Varfarina, Apixabana):
- Risco: Aumento do efeito anticoagulante
- Monitoramento: INR a cada 2 semanas
- Recomendação: Usar com cautela, monitorar

2. ANTIDEPRESSIVOS (SSRIs, Tricíclicos):
- Risco: Aumenta sedação
- Monitoramento: Avaliar sonolência excessiva
- Recomendação: Reduzir dose de cannabis se necessário

3. ANTIEPILÉTICOS (Fenitoína, Fenobarbital):
- Risco: Reduz eficácia do antiepilético
- Monitoramento: Níveis séricos
- Recomendação: Usar CBD (não afeta)

4. OPIOIDES:
- Risco: Aumenta sedação e depressão respiratória
- Monitoramento: Vigilância de overdose
- Recomendação: Reduzir dose de opioide

5. BENZODIAZEPÍNICOS:
- Risco: Aumenta sedação
- Monitoramento: Avaliação de sonolência
- Recomendação: Usar com cautela

RECOMENDAÇÃO GERAL:
Sempre informar seu médico sobre uso de cannabis medicinal. Alguns medicamentos podem ser ajustados ou monitorados de perto.`,
      image: '⚠️'
    }
  ];

  const categories = ['all', 'Artigos Científicos', 'Estudos Clínicos', 'Protocolos Clínicos'];
  const levels = ['Básico', 'Intermediário', 'Avançado'];

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLearnMore = (article: typeof articles[0]) => {
    // In a real app, this would navigate to a detailed page
    alert(`Artigo: ${article.title}\n\n${article.content}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Beaker className="w-10 h-10 text-green-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Biblioteca Científica
            </h1>
          </div>
          <p className="text-xl text-slate-300">
            Conteúdo educativo baseado em pesquisa científica sobre cannabis medicinal
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar artigos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-green-500 text-white"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedCategory === cat
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {filteredArticles.map(article => (
            <div
              key={article.id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden hover:border-green-500/50 transition-all hover:shadow-lg hover:shadow-green-500/10"
            >
              {/* Article Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{article.image}</div>
                  <span className="text-xs bg-green-900/50 text-green-300 px-3 py-1 rounded-full">
                    {article.level}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-green-400 line-clamp-2">
                  {article.title}
                </h3>
                
                <p className="text-sm text-slate-400 mb-3">{article.category}</p>
                
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  {article.summary}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{article.author}</span>
                  <span>{article.date}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleLearnMore(article)}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                Saiba Mais
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Nenhum artigo encontrado</p>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Pronto para Consultar um Profissional?</h2>
          <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
            Nossos artigos são apenas informativos. Para tratamento personalizado, 
            consulte um profissional habilitado em nossa plataforma.
          </p>
          <button
            onClick={() => navigate('/telemedicine')}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
          >
            Ver Profissionais
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-6 bg-slate-800/50 border border-slate-700 rounded-lg text-center text-sm text-slate-400">
          <p>
            ⚠️ Este conteúdo é apenas informativo e educativo. Não substitui consulta com profissional habilitado. 
            Sempre consulte um médico antes de iniciar qualquer tratamento.
          </p>
        </div>
      </div>
    </div>
  );
}
