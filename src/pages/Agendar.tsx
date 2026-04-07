import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronRight, CheckCircle } from 'lucide-react';

const PREINTERVIEW_QUESTIONS = [
  'Qual é seu principal sintoma ou motivo da consulta?',
  'Há quanto tempo você tem esse sintoma?',
  'Já usou cannabis medicinal antes?',
  'Está tomando algum medicamento atualmente?',
  'Tem alergias conhecidas?',
  'Qual é sua disponibilidade para consulta?',
  'Qual é seu orçamento para a consulta?',
];

export default function Agendar() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(7).fill(''));

  const handleAnswer = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (step < 7) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const isAnswered = answers[step]?.trim() !== '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27]">
      {/* HEADER */}
      <div className="bg-[#0A0E27]/80 backdrop-blur-sm border-b border-[#00FF00]/20 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-white mb-2">Agendar Consulta</h1>
          <p className="text-gray-400">Responda algumas perguntas para encontrar o melhor profissional</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* PROGRESS BAR */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Etapa {step + 1} de 7</span>
            <span className="text-[#00FF00] font-bold">{Math.round(((step + 1) / 7) * 100)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#00FF00] to-[#9D4EDD] h-2 rounded-full transition-all"
              style={{ width: `${((step + 1) / 7) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* QUESTIONS */}
        <Card className="bg-gradient-to-br from-[#9D4EDD]/10 to-[#00FF00]/5 border border-[#00FF00]/20 p-8 mb-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">{PREINTERVIEW_QUESTIONS[step]}</h2>
            <p className="text-gray-400 text-sm">Sua resposta nos ajudará a recomendar o melhor profissional</p>
          </div>

          {/* ANSWER INPUT */}
          <div className="mb-8">
            {step === 1 || step === 5 ? (
              // Duration/Time select
              <select
                value={answers[step]}
                onChange={(e) => handleAnswer(step, e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-[#00FF00]/30 rounded-lg text-white focus:outline-none focus:border-[#00FF00]"
              >
                <option value="">Selecione uma opção...</option>
                {step === 1 && (
                  <>
                    <option value="Menos de 1 semana">Menos de 1 semana</option>
                    <option value="1-2 semanas">1-2 semanas</option>
                    <option value="1-3 meses">1-3 meses</option>
                    <option value="Mais de 3 meses">Mais de 3 meses</option>
                  </>
                )}
                {step === 5 && (
                  <>
                    <option value="Hoje">Hoje</option>
                    <option value="Esta semana">Esta semana</option>
                    <option value="Próxima semana">Próxima semana</option>
                    <option value="Próximo mês">Próximo mês</option>
                  </>
                )}
              </select>
            ) : step === 2 || step === 3 || step === 4 ? (
              // Yes/No buttons
              <div className="flex gap-4">
                <Button
                  onClick={() => handleAnswer(step, 'Sim')}
                  className={`flex-1 py-3 font-bold rounded-lg transition-all ${
                    answers[step] === 'Sim'
                      ? 'bg-[#00FF00] text-[#0A0E27]'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-[#00FF00]/30'
                  }`}
                >
                  Sim
                </Button>
                <Button
                  onClick={() => handleAnswer(step, 'Não')}
                  className={`flex-1 py-3 font-bold rounded-lg transition-all ${
                    answers[step] === 'Não'
                      ? 'bg-[#9D4EDD] text-white'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-[#9D4EDD]/30'
                  }`}
                >
                  Não
                </Button>
              </div>
            ) : (
              // Text input
              <textarea
                value={answers[step]}
                onChange={(e) => handleAnswer(step, e.target.value)}
                placeholder="Digite sua resposta aqui..."
                className="w-full px-4 py-3 bg-white/10 border border-[#00FF00]/30 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00FF00] resize-none h-32"
              />
            )}
          </div>

          {/* NAVIGATION */}
          <div className="flex gap-4">
            <Button
              onClick={handlePrevious}
              disabled={step === 0}
              className="flex-1 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-[#9D4EDD]/30"
            >
              Anterior
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isAnswered}
              className="flex-1 bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00] disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center justify-center gap-2"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* SUMMARY */}
        {step === 6 && (
          <Card className="bg-white/5 border border-[#00FF00]/20 p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Resumo das Respostas</h3>
            <div className="space-y-4 mb-8">
              {PREINTERVIEW_QUESTIONS.map((q, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 mb-2">{q}</p>
                  <p className="text-white font-semibold">{answers[i]}</p>
                </div>
              ))}
            </div>

            <Button className="w-full bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00] font-bold py-4 text-lg flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Confirmar e Buscar Profissional
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
