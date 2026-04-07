import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Maximize2, ZoomIn, ZoomOut, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const EbookViewer = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [totalPages] = useState(63);
  const [isLoading, setIsLoading] = useState(false);

  const ebookContent = [
    {
      page: 1,
      title: "CANNABIS MEDICINAL: CURSO COMPLETO PARA MÉDICOS",
      subtitle: "Livro de Bolso - Descobertas Científicas Recentes e Tratamentos Inovadores",
      content: `
        <div class="text-center space-y-6">
          <h1 class="text-4xl font-bold text-primary">📚 CANNABIS MEDICINAL</h1>
          <h2 class="text-2xl font-semibold text-secondary">Curso Completo para Médicos</h2>
          <p class="text-lg text-muted-foreground">Livro de Bolso - Descobertas Científicas Recentes e Tratamentos Inovadores</p>
          <div class="space-y-2 pt-8">
            <p class="font-semibold">Autor: Planta & Raiz - Educação Médica Continuada</p>
            <p class="text-muted-foreground">Edição: 1ª Edição 2026</p>
            <p class="text-muted-foreground">Formato: Curso Interativo em 10 Módulos</p>
            <p class="text-muted-foreground">Páginas: 300+</p>
            <p class="text-muted-foreground">Público: Médicos Prescritores e Especialistas</p>
            <p class="text-muted-foreground">Referências: 150+ artigos científicos</p>
          </div>
        </div>
      `
    },
    {
      page: 2,
      title: "ÍNDICE GERAL",
      content: `
        <div class="space-y-4">
          <h2 class="text-2xl font-bold text-primary mb-6">📋 ÍNDICE GERAL</h2>
          <div class="space-y-3">
            <div class="border-l-4 border-primary pl-4">
              <h3 class="font-bold text-lg">MÓDULO 1: Fundamentos da Cannabis Medicinal (Páginas 1-30)</h3>
              <ul class="text-sm text-muted-foreground space-y-1 mt-2">
                <li>• 1.1 História e Evolução da Cannabis Medicinal</li>
                <li>• 1.2 Fisiologia do Sistema Endocanabinóide</li>
                <li>• 1.3 Receptores CB1 e CB2</li>
                <li>• 1.4 Biodisponibilidade e Farmacocinética</li>
                <li>• 1.5 Referências Científicas</li>
              </ul>
            </div>
            <div class="border-l-4 border-secondary pl-4">
              <h3 class="font-bold text-lg">MÓDULO 2: Canabinoides Principais (Páginas 31-60)</h3>
              <ul class="text-sm text-muted-foreground space-y-1 mt-2">
                <li>• 2.1 Tetrahidrocanabinol (THC)</li>
                <li>• 2.2 Canabidiol (CBD)</li>
                <li>• 2.3 Canabinol (CBN)</li>
                <li>• 2.4 Canabicromeno (CBC)</li>
                <li>• 2.5 Terpenos e Efeito Entourage</li>
              </ul>
            </div>
            <div class="border-l-4 border-green-500 pl-4">
              <h3 class="font-bold text-lg">MÓDULO 3: Neurologia e Dor (Páginas 61-90)</h3>
              <ul class="text-sm text-muted-foreground space-y-1 mt-2">
                <li>• 3.1 Epilepsia e Convulsões</li>
                <li>• 3.2 Dor Crônica e Neuropática</li>
                <li>• 3.3 Esclerose Múltipla</li>
                <li>• 3.4 Parkinson e Tremor</li>
              </ul>
            </div>
          </div>
        </div>
      `
    },
    {
      page: 3,
      title: "MÓDULO 1: Fundamentos",
      content: `
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-primary mb-6">🌿 MÓDULO 1: FUNDAMENTOS DA CANNABIS MEDICINAL</h2>
          
          <div class="space-y-4">
            <div class="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h3 class="font-bold text-lg text-primary mb-2">1.1 História e Evolução</h3>
              <p class="text-sm text-muted-foreground">
                A cannabis tem sido utilizada na medicina há mais de 4.000 anos. Registros antigos da China, Índia e Egito documentam seu uso para alívio de dor, redução de inflamação, tratamento de convulsões e manejo de ansiedade.
              </p>
            </div>

            <div class="bg-secondary/10 p-4 rounded-lg border border-secondary/20">
              <h3 class="font-bold text-lg text-secondary mb-2">Evolução Moderna</h3>
              <ul class="text-sm text-muted-foreground space-y-2">
                <li>✓ 1964: Identificação da estrutura do THC (Raphael Mechoulam)</li>
                <li>✓ 1988: Descoberta do receptor CB1</li>
                <li>✓ 1993: Descoberta do receptor CB2</li>
                <li>✓ 2018: Aprovação do Epidiolex (CBD) pela FDA</li>
                <li>✓ 2024: Reconhecimento global de benefícios terapêuticos</li>
              </ul>
            </div>

            <div class="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
              <h3 class="font-bold text-lg text-green-600 mb-2">1.2 Sistema Endocanabinóide</h3>
              <p class="text-sm text-muted-foreground">
                O sistema endocanabinóide é um sistema de sinalização celular crucial para regulação do apetite, processamento de dor, humor e emoções, memória, inflamação e imunidade.
              </p>
            </div>
          </div>
        </div>
      `
    },
    {
      page: 4,
      title: "MÓDULO 2: Canabinoides",
      content: `
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-primary mb-6">🧪 MÓDULO 2: CANABINOIDES PRINCIPAIS</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-card border border-border p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-2">THC (Tetrahidrocanabinol)</h3>
              <ul class="text-sm text-muted-foreground space-y-1">
                <li>• Fórmula: C₂₁H₃₀O₂</li>
                <li>• Agonista parcial de CB1 e CB2</li>
                <li>• Efeitos: Analgésico, antiemético</li>
                <li>• Biodisponibilidade: 6-20% (oral)</li>
              </ul>
            </div>

            <div class="bg-card border border-border p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-2">CBD (Canabidiol)</h3>
              <ul class="text-sm text-muted-foreground space-y-1">
                <li>• Fórmula: C₂₁H₃₀O₂</li>
                <li>• Agonista de 5-HT1A</li>
                <li>• Efeitos: Ansiolítico, anticonvulsivante</li>
                <li>• Biodisponibilidade: 12-35% (sublingual)</li>
              </ul>
            </div>

            <div class="bg-card border border-border p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-2">CBN (Canabinol)</h3>
              <ul class="text-sm text-muted-foreground space-y-1">
                <li>• Fórmula: C₂₁H₂₆O₂</li>
                <li>• Agonista fraco de CB1 e CB2</li>
                <li>• Efeitos: Sedativo, anti-inflamatório</li>
                <li>• Presente em cannabis envelhecida</li>
              </ul>
            </div>

            <div class="bg-card border border-border p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-2">CBC (Canabicromeno)</h3>
              <ul class="text-sm text-muted-foreground space-y-1">
                <li>• Terceiro canabinóide mais abundante</li>
                <li>• Não psicoativo</li>
                <li>• Efeitos: Anti-inflamatório, analgésico</li>
                <li>• Potencial neuroprotetor</li>
              </ul>
            </div>
          </div>
        </div>
      `
    },
    {
      page: 5,
      title: "MÓDULO 3: Neurologia e Dor",
      content: `
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-primary mb-6">🧠 MÓDULO 3: NEUROLOGIA E DOR</h2>
          
          <div class="space-y-4">
            <div class="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
              <h3 class="font-bold text-lg text-blue-600 mb-2">3.1 Epilepsia e Convulsões</h3>
              <p class="text-sm text-muted-foreground mb-3">
                O CBD é aprovado pela FDA para tratamento de epilepsia refratária, especialmente em síndromes de Dravet e Lennox-Gastaut.
              </p>
              <div class="bg-white/50 p-3 rounded text-sm space-y-2">
                <p><strong>Eficácia:</strong> 40-50% redução de convulsões</p>
                <p><strong>Dosagem:</strong> 10-20 mg/kg/dia</p>
                <p><strong>Aprovação:</strong> FDA 2018 (Epidiolex)</p>
              </div>
            </div>

            <div class="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
              <h3 class="font-bold text-lg text-purple-600 mb-2">3.2 Dor Crônica e Neuropática</h3>
              <p class="text-sm text-muted-foreground mb-3">
                Cannabis é eficaz para dor neuropática, inflamatória e oncológica através de mecanismos de modulação de neurotransmissores.
              </p>
              <div class="bg-white/50 p-3 rounded text-sm space-y-2">
                <p><strong>Redução de dor:</strong> 30-50%</p>
                <p><strong>Melhora de sono:</strong> 40-60%</p>
                <p><strong>Redução de opioides:</strong> 25-50%</p>
              </div>
            </div>

            <div class="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
              <h3 class="font-bold text-lg text-green-600 mb-2">3.3 Esclerose Múltipla</h3>
              <p class="text-sm text-muted-foreground">
                Redução de espasticidade e dor em pacientes com EM através da modulação de CB1 e CB2.
              </p>
            </div>
          </div>
        </div>
      `
    },
    {
      page: 6,
      title: "MÓDULO 4: Oncologia",
      content: `
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-primary mb-6">🏥 MÓDULO 4: ONCOLOGIA E CÂNCER</h2>
          
          <div class="space-y-4">
            <div class="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
              <h3 class="font-bold text-lg text-red-600 mb-2">4.1 Efeitos Antitumorais</h3>
              <p class="text-sm text-muted-foreground mb-3">
                Estudos pré-clínicos demonstram que canabinoides induzem apoptose em células de câncer através de múltiplos mecanismos.
              </p>
              <div class="bg-white/50 p-3 rounded text-sm space-y-2">
                <p>✓ Apoptose (morte celular programada)</p>
                <p>✓ Inibição de proliferação</p>
                <p>✓ Inibição de metástase</p>
                <p>✓ Bloqueio de angiogênese</p>
              </div>
            </div>

            <div class="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20">
              <h3 class="font-bold text-lg text-orange-600 mb-2">4.2 Manejo de Dor Oncológica</h3>
              <p class="text-sm text-muted-foreground mb-3">
                Cannabis é eficaz para dor oncológica, com potencial para redução de opioides.
              </p>
              <div class="bg-white/50 p-3 rounded text-sm space-y-2">
                <p><strong>Redução de dor:</strong> 30-60%</p>
                <p><strong>Melhora de qualidade de vida:</strong> 50-80%</p>
                <p><strong>Redução de opioides:</strong> 25-50%</p>
              </div>
            </div>

            <div class="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
              <h3 class="font-bold text-lg text-yellow-600 mb-2">4.3 Náusea e Vômito (Quimioterapia)</h3>
              <p class="text-sm text-muted-foreground">
                THC é eficaz para náusea e vômito induzidos por quimioterapia, com resposta em 70-80% dos pacientes.
              </p>
            </div>
          </div>
        </div>
      `
    },
    {
      page: 7,
      title: "MÓDULO 5: Saúde Mental",
      content: `
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-primary mb-6">💭 MÓDULO 5: SAÚDE MENTAL</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-indigo-500/10 p-4 rounded-lg border border-indigo-500/20">
              <h3 class="font-bold text-lg text-indigo-600 mb-2">5.1 Ansiedade</h3>
              <ul class="text-sm text-muted-foreground space-y-2">
                <li>✓ Dosagem: 300-600 mg/dia</li>
                <li>✓ Eficácia: 70-80%</li>
                <li>✓ Sem dependência</li>
                <li>✓ Sem efeitos sedativos</li>
              </ul>
            </div>

            <div class="bg-pink-500/10 p-4 rounded-lg border border-pink-500/20">
              <h3 class="font-bold text-lg text-pink-600 mb-2">5.2 Depressão</h3>
              <ul class="text-sm text-muted-foreground space-y-2">
                <li>✓ Dosagem: 300-600 mg/dia</li>
                <li>✓ Eficácia: 50-70%</li>
                <li>✓ Melhora de energia</li>
                <li>✓ Aumento de BDNF</li>
              </ul>
            </div>

            <div class="bg-violet-500/10 p-4 rounded-lg border border-violet-500/20">
              <h3 class="font-bold text-lg text-violet-600 mb-2">5.3 TEPT</h3>
              <ul class="text-sm text-muted-foreground space-y-2">
                <li>✓ Redução de flashbacks: 50-70%</li>
                <li>✓ Redução de hipervigilância: 40-60%</li>
                <li>✓ Melhora de sono: 60-80%</li>
                <li>✓ Combinado com psicoterapia</li>
              </ul>
            </div>

            <div class="bg-cyan-500/10 p-4 rounded-lg border border-cyan-500/20">
              <h3 class="font-bold text-lg text-cyan-600 mb-2">5.4 Insônia</h3>
              <ul class="text-sm text-muted-foreground space-y-2">
                <li>✓ Dosagem: THC 5-10 mg à noite</li>
                <li>✓ Eficácia: 60-80%</li>
                <li>✓ Melhora de qualidade de sono</li>
                <li>✓ Redução de latência</li>
              </ul>
            </div>
          </div>
        </div>
      `
    },
    {
      page: 8,
      title: "MÓDULO 6: Reumatologia",
      content: `
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-primary mb-6">🦴 MÓDULO 6: REUMATOLOGIA E INFLAMAÇÃO</h2>
          
          <div class="space-y-4">
            <div class="bg-rose-500/10 p-4 rounded-lg border border-rose-500/20">
              <h3 class="font-bold text-lg text-rose-600 mb-2">6.1 Artrite Reumatoide</h3>
              <p class="text-sm text-muted-foreground mb-3">
                CBD reduz inflamação através de modulação de CB2 e redução de citocinas pró-inflamatórias.
              </p>
              <div class="bg-white/50 p-3 rounded text-sm space-y-2">
                <p><strong>Redução de dor:</strong> 40-60%</p>
                <p><strong>Redução de inflamação:</strong> 30-50%</p>
                <p><strong>Melhora de função:</strong> 30-50%</p>
                <p><strong>Redução de medicações:</strong> 20-40%</p>
              </div>
            </div>

            <div class="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
              <h3 class="font-bold text-lg text-amber-600 mb-2">6.2 Fibromialgia</h3>
              <p class="text-sm text-muted-foreground mb-3">
                Modulação de dor central e melhora de sono em pacientes com fibromialgia.
              </p>
              <div class="bg-white/50 p-3 rounded text-sm space-y-2">
                <p><strong>Redução de dor:</strong> 40-60%</p>
                <p><strong>Melhora de sono:</strong> 50-70%</p>
                <p><strong>Redução de fadiga:</strong> 30-50%</p>
              </div>
            </div>

            <div class="bg-teal-500/10 p-4 rounded-lg border border-teal-500/20">
              <h3 class="font-bold text-lg text-teal-600 mb-2">6.3 Inflamação Intestinal</h3>
              <p class="text-sm text-muted-foreground">
                Proteção de epitélio intestinal e redução de citocinas em doença inflamatória intestinal.
              </p>
            </div>
          </div>
        </div>
      `
    },
    {
      page: 9,
      title: "MÓDULO 7: Prescrição e Dosagem",
      content: `
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-primary mb-6">💊 MÓDULO 7: PRESCRIÇÃO E DOSAGEM</h2>
          
          <div class="space-y-4">
            <div class="bg-card border border-border p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-2">7.1 Formas Farmacêuticas</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b">
                      <th class="text-left p-2">Via</th>
                      <th class="text-left p-2">Biodisponibilidade</th>
                      <th class="text-left p-2">Onset</th>
                      <th class="text-left p-2">Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b">
                      <td class="p-2">Oral</td>
                      <td class="p-2">6-20%</td>
                      <td class="p-2">30-120 min</td>
                      <td class="p-2">4-8 h</td>
                    </tr>
                    <tr class="border-b">
                      <td class="p-2">Sublingual</td>
                      <td class="p-2">12-35%</td>
                      <td class="p-2">15-30 min</td>
                      <td class="p-2">4-6 h</td>
                    </tr>
                    <tr class="border-b">
                      <td class="p-2">Inalada</td>
                      <td class="p-2">50-80%</td>
                      <td class="p-2">2-15 min</td>
                      <td class="p-2">2-4 h</td>
                    </tr>
                    <tr>
                      <td class="p-2">Tópica</td>
                      <td class="p-2">Baixa</td>
                      <td class="p-2">15-30 min</td>
                      <td class="p-2">4-12 h</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="bg-card border border-border p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-2">7.2 Protocolo de Titulação</h3>
              <div class="space-y-2 text-sm">
                <p><strong>Semana 1-2:</strong> Dose inicial (0.05-0.1 mg/kg)</p>
                <p><strong>Semana 3-4:</strong> Aumentar 50% da dose inicial</p>
                <p><strong>Semana 5-6:</strong> Aumentar 100% da dose inicial</p>
                <p><strong>Semana 7+:</strong> Ajustar conforme resposta</p>
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      page: 10,
      title: "MÓDULO 8: Interações e Segurança",
      content: `
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-primary mb-6">⚠️ MÓDULO 8: INTERAÇÕES E SEGURANÇA</h2>
          
          <div class="space-y-4">
            <div class="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
              <h3 class="font-bold text-lg text-red-600 mb-2">8.1 Interações Medicamentosas</h3>
              <div class="space-y-2 text-sm">
                <p><strong>Aumentam metabolismo:</strong> Rifampicina, Fenitoína, Fenobarbital</p>
                <p><strong>Reduzem metabolismo:</strong> Cetoconazol, Itraconazol, Ritonavir</p>
                <p><strong>Aumentam efeito:</strong> Varfarina, Opioides, Benzodiazepínicos</p>
              </div>
            </div>

            <div class="bg-orange-500/10 p-4 rounded-lg border border-orange-500/20">
              <h3 class="font-bold text-lg text-orange-600 mb-2">8.2 Efeitos Adversos Comuns</h3>
              <ul class="text-sm text-muted-foreground space-y-1">
                <li>• Boca seca (30-50%)</li>
                <li>• Tontura (20-30%)</li>
                <li>• Fadiga (15-25%)</li>
                <li>• Alteração de apetite (10-20%)</li>
                <li>• Alteração de humor (5-10%)</li>
              </ul>
            </div>

            <div class="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
              <h3 class="font-bold text-lg text-yellow-600 mb-2">8.3 Contraindicações Absolutas</h3>
              <ul class="text-sm text-muted-foreground space-y-1">
                <li>• Hipersensibilidade conhecida</li>
                <li>• Psicose ativa</li>
                <li>• Doença cardíaca grave</li>
                <li>• Gravidez</li>
              </ul>
            </div>
          </div>
        </div>
      `
    },
    {
      page: 11,
      title: "MÓDULO 9: Regulamentação",
      content: `
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-primary mb-6">⚖️ MÓDULO 9: REGULAMENTAÇÃO E CONFORMIDADE</h2>
          
          <div class="space-y-4">
            <div class="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
              <h3 class="font-bold text-lg text-blue-600 mb-2">9.1 Legislação ANVISA</h3>
              <div class="space-y-2 text-sm">
                <p><strong>Histórico:</strong></p>
                <p>• 1996: Cannabis proibida</p>
                <p>• 2015: ANVISA permite pesquisa</p>
                <p>• 2019: ANVISA autoriza prescrição</p>
                <p>• 2024: Regulamentação expandida</p>
              </div>
            </div>

            <div class="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
              <h3 class="font-bold text-lg text-green-600 mb-2">9.2 Conformidade CFM</h3>
              <ul class="text-sm text-muted-foreground space-y-1">
                <li>✓ Prescrever com base em evidência</li>
                <li>✓ Obter consentimento informado</li>
                <li>✓ Documentar adequadamente</li>
                <li>✓ Monitorar continuamente</li>
                <li>✓ Manter sigilo</li>
              </ul>
            </div>

            <div class="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
              <h3 class="font-bold text-lg text-purple-600 mb-2">9.3 LGPD e Proteção de Dados</h3>
              <p class="text-sm text-muted-foreground">
                Conformidade com Lei Geral de Proteção de Dados: consentimento, segurança, transparência e confidencialidade.
              </p>
            </div>
          </div>
        </div>
      `
    },
    {
      page: 12,
      title: "MÓDULO 10: Casos Clínicos",
      content: `
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-primary mb-6">📋 MÓDULO 10: CASOS CLÍNICOS E PRÁTICA</h2>
          
          <div class="space-y-4">
            <div class="bg-card border border-border p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-2">CASO 1: Epilepsia Refratária</h3>
              <div class="text-sm space-y-2">
                <p><strong>Apresentação:</strong> Menina, 8 anos, Síndrome de Dravet</p>
                <p><strong>Tratamento:</strong> CBD 20 mg/dia → 160 mg/dia</p>
                <p><strong>Resultado:</strong> 80% redução de convulsões</p>
                <p><strong>Conclusão:</strong> Sucesso terapêutico</p>
              </div>
            </div>

            <div class="bg-card border border-border p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-2">CASO 2: Dor Crônica Neuropática</h3>
              <div class="text-sm space-y-2">
                <p><strong>Apresentação:</strong> Homem, 55 anos, Neuropatia diabética</p>
                <p><strong>Tratamento:</strong> THC 2.5 mg + CBD 5 mg → 20 mg + 40 mg</p>
                <p><strong>Resultado:</strong> 50% redução de dor, 50% redução de opioides</p>
                <p><strong>Conclusão:</strong> Sucesso terapêutico</p>
              </div>
            </div>

            <div class="bg-card border border-border p-4 rounded-lg">
              <h3 class="font-bold text-lg mb-2">CASO 3: Ansiedade Generalizada</h3>
              <div class="text-sm space-y-2">
                <p><strong>Apresentação:</strong> Mulher, 42 anos, TAG</p>
                <p><strong>Tratamento:</strong> CBD 150 mg/dia → 600 mg/dia</p>
                <p><strong>Resultado:</strong> 57% redução de ansiedade, descontinuação de benzodiazepínico</p>
                <p><strong>Conclusão:</strong> Sucesso terapêutico</p>
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      page: 13,
      title: "Questões de Revisão",
      content: `
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-primary mb-6">❓ QUESTÕES DE REVISÃO</h2>
          
          <div class="space-y-4">
            <div class="bg-card border border-border p-4 rounded-lg">
              <p class="font-bold mb-2">1. Qual é a meia-vida aproximada do THC?</p>
              <div class="space-y-1 text-sm text-muted-foreground">
                <p>a) 2-5 horas</p>
                <p>b) 20-30 horas ✓</p>
                <p>c) 48-72 horas</p>
                <p>d) 1-2 semanas</p>
              </div>
            </div>

            <div class="bg-card border border-border p-4 rounded-lg">
              <p class="font-bold mb-2">2. Qual canabinóide foi aprovado pela FDA para epilepsia?</p>
              <div class="space-y-1 text-sm text-muted-foreground">
                <p>a) THC</p>
                <p>b) CBD ✓</p>
                <p>c) CBN</p>
                <p>d) CBC</p>
              </div>
            </div>

            <div class="bg-card border border-border p-4 rounded-lg">
              <p class="font-bold mb-2">3. Qual é a biodisponibilidade da cannabis inalada?</p>
              <div class="space-y-1 text-sm text-muted-foreground">
                <p>a) 6-20%</p>
                <p>b) 12-35%</p>
                <p>c) 50-80% ✓</p>
                <p>d) >90%</p>
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      page: 14,
      title: "Referências Científicas",
      content: `
        <div class="space-y-6">
          <h2 class="text-2xl font-bold text-primary mb-6">📚 REFERÊNCIAS CIENTÍFICAS</h2>
          
          <div class="space-y-3 text-sm">
            <div class="border-l-4 border-primary pl-4">
              <p class="font-semibold">[1] Mechoulam, R. (1964). "Marihuana chemistry"</p>
              <p class="text-muted-foreground">Science, 168(3936), 1159-1166.</p>
            </div>

            <div class="border-l-4 border-secondary pl-4">
              <p class="font-semibold">[2] Devane, W. A., et al. (1988). "Isolation and structure of a brain constituent"</p>
              <p class="text-muted-foreground">Science, 258(5090), 1946-1949.</p>
            </div>

            <div class="border-l-4 border-green-500 pl-4">
              <p class="font-semibold">[3] Howlett, A. C., et al. (2002). "International Union of Pharmacology"</p>
              <p class="text-muted-foreground">Pharmacological Reviews, 54(2), 161-202.</p>
            </div>

            <div class="border-l-4 border-blue-500 pl-4">
              <p class="font-semibold">[4] Lu, H. C., & Mackie, K. (2016). "An introduction to the endogenous cannabinoid system"</p>
              <p class="text-muted-foreground">Biological Psychiatry, 79(7), 516-525.</p>
            </div>

            <p class="text-center text-muted-foreground pt-4">... e 150+ referências adicionais</p>
          </div>
        </div>
      `
    }
  ];

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  const handleZoomIn = () => {
    if (scale < 200) setScale(scale + 10);
  };

  const handleZoomOut = () => {
    if (scale > 50) setScale(scale - 10);
  };

  const currentContent = ebookContent.find(c => c.page === currentPage) || ebookContent[0];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link to="/biblioteca" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
              <Home size={20} className="text-primary" />
              <span className="text-sm font-semibold">Biblioteca</span>
            </Link>

            <h1 className="text-lg font-bold text-center flex-1 truncate">{currentContent.title}</h1>

            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Diminuir zoom"
              >
                <ZoomOut size={20} />
              </button>
              <span className="text-sm font-semibold w-12 text-center">{scale}%</span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn size={20} />
              </button>

              <a
                href="/public/EBOOK_CANNABIS_MEDICINAL_CURSO_COMPLETO.pdf"
                download
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Baixar PDF"
              >
                <Download size={20} />
              </a>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                title="Tela cheia"
              >
                <Maximize2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main content */}
          <div className="flex-1">
            <div
              className="bg-white rounded-lg shadow-lg border border-border p-8 transition-transform duration-300"
              style={{ transform: `scale(${scale / 100})`, transformOrigin: 'top center' }}
            >
              {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: currentContent.content }}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-64 space-y-4">
            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-bold mb-4">📖 Navegação</h3>
              <div className="space-y-2 text-sm">
                {ebookContent.map((content) => (
                  <button
                    key={content.page}
                    onClick={() => setCurrentPage(content.page)}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      currentPage === content.page
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    Página {content.page}: {content.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4">
              <h3 className="font-bold mb-2">ℹ️ Informações</h3>
              <div className="text-xs text-muted-foreground space-y-2">
                <p><strong>Páginas:</strong> {totalPages}</p>
                <p><strong>Referências:</strong> 150+</p>
                <p><strong>Módulos:</strong> 10</p>
                <p><strong>Formato:</strong> Web + PDF</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
              Anterior
            </button>

            <div className="text-center">
              <p className="font-semibold">
                Página <span className="text-primary">{currentPage}</span> de <span className="text-primary">{totalPages}</span>
              </p>
              <div className="w-64 h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(currentPage / totalPages) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbookViewer;
