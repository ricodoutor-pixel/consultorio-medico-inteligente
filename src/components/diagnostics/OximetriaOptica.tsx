import React, { useState } from 'react';
import { HeartPulse, Activity, FileText, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Save, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { SaMDBiofeedbackDisclaimer } from '@/components/compliance/SaMDBiofeedbackDisclaimer';

interface Props {
  onComplete?: () => void;
}

export function OximetriaOptica({ onComplete }: Props) {
  const [spo2Input, setSpo2Input] = useState<string>('98');
  const [bpmInput, setBpmInput] = useState<string>('72');
  const [isSaved, setIsSaved] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const spo2Num = Number(spo2Input);
  const bpmNum = Number(bpmInput);

  const getClassification = (val: number) => {
    if (val >= 95) {
      return {
        label: 'Normal (Saturação adequada)',
        description: 'Sua saturação de oxigênio está dentro dos parâmetros ideais esperados (95% a 100%).',
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        textColor: 'text-emerald-600',
        isDangerous: false,
      };
    }
    if (val >= 90) {
      return {
        label: 'Atenção (Hipoxemia leve)',
        description: 'Saturação limítrofe (90% a 94%). Mantenha repouso, repita a aferição e consulte um médico se persistir.',
        badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
        textColor: 'text-amber-600',
        isDangerous: true,
      };
    }
    return {
      label: 'Alerta Clínico (Hipoxemia grave)',
      description: 'Saturação abaixo de 90%. Recomenda-se avaliação médica presencial ou acionamento imediato do SAMU 192.',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
      textColor: 'text-rose-600',
      isDangerous: true,
    };
  };

  const classification = getClassification(spo2Num || 98);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spo2Num || spo2Num < 70 || spo2Num > 100) {
      toast.error('Informe um valor de SpO2 válido entre 70% e 100%.');
      return;
    }
    setIsSaved(true);
    toast.success('Oximetria registrada com sucesso no prontuário!');
    if (onComplete) onComplete();
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 relative overflow-hidden rounded-xl border border-border shadow-sm p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 text-primary">
          <HeartPulse className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">Oximetria & Saturação de Oxigênio (SpO2)</h2>
          <p className="text-xs text-slate-500">Registro Clínico Homologado · {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* AVISO REGULATÓRIO OBRIGATÓRIO (ZERO SIMULAÇÃO) */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-amber-900">Nota Regulatória & Transparência Clínica</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            Módulo de oximetria óptica em homologação clínica. Por favor, utilize um oxímetro de pulso homologado ou informe o valor manualmente.
          </p>
        </div>
      </div>

      {/* FORMULÁRIO DE ENTRADA MANUAL */}
      <form onSubmit={handleSave} className="space-y-4 bg-white p-5 rounded-xl border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="spo2-input" className="text-xs font-semibold text-slate-700">
              Saturação de Oxigênio (SpO2 em %) *
            </Label>
            <div className="relative">
              <Input
                id="spo2-input"
                type="number"
                min={70}
                max={100}
                step={1}
                required
                value={spo2Input}
                onChange={(e) => {
                  setSpo2Input(e.target.value);
                  setIsSaved(false);
                }}
                className="text-lg font-bold pr-8"
                placeholder="Ex: 98"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">%</span>
            </div>
            <p className="text-[11px] text-slate-500">Faixa de referência esperada: 95% a 100%.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bpm-input" className="text-xs font-semibold text-slate-700">
              Frequência de Pulso (BPM) <span className="text-slate-400 font-normal">(Opcional)</span>
            </Label>
            <div className="relative">
              <Input
                id="bpm-input"
                type="number"
                min={40}
                max={220}
                step={1}
                value={bpmInput}
                onChange={(e) => {
                  setBpmInput(e.target.value);
                  setIsSaved(false);
                }}
                className="text-lg font-bold pr-12"
                placeholder="Ex: 72"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">bpm</span>
            </div>
            <p className="text-[11px] text-slate-500">Faixa normal em repouso: 60 a 100 bpm.</p>
          </div>
        </div>

        {/* Card de Parecer Imediato */}
        {spo2Num >= 70 && spo2Num <= 100 && (
          <div className={`p-4 rounded-xl border ${classification.badgeColor} flex items-start gap-3 transition-colors`}>
            {classification.isDangerous ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-bold text-sm">{classification.label}</h4>
              <p className="text-xs mt-1 leading-relaxed">{classification.description}</p>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full h-12 rounded-xl text-sm font-semibold shadow-md">
          <Save className="w-4 h-4 mr-2" />
          {isSaved ? 'Atualizar no Prontuário' : 'Registrar no Prontuário / Anexar ao Chat'}
        </Button>
      </form>

      {/* Accordion Educativo */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors text-left"
        >
          <span className="font-semibold text-slate-800 text-xs md:text-sm">
            Entenda o que significa a saturação de oxigênio (SpO2)
          </span>
          {showExplanation ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden bg-white"
            >
              <div className="p-4 text-xs text-slate-600 space-y-3 border-t">
                <p>
                  A oximetria de pulso quantifica a fração de hemoglobina saturada de oxigênio no sangue periférico. Valores acima de 95% indicam troca gasosa pulmonar adequada em ar ambiente.
                </p>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="font-semibold text-primary mb-1 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> Conexão Endocanabinoide
                  </p>
                  <p>
                    O sistema endocanabinoide modula o tônus bronquial e a resposta inflamatória através de receptores CB1 e CB2. Fitocanabinoides como o CBD vêm sendo investigados por seus papéis antioxidantes e modulação de vias respiratórias.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SaMDBiofeedbackDisclaimer compact toolName="O registro manual de oximetria" />
    </div>
  );
}
