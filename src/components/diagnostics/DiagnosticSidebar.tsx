import React, { useState, Suspense, lazy } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Stethoscope, Activity, Eye, HeartPulse, ScanSearch, Accessibility,
  ArrowLeft, Wind, Sparkles, FileText, Loader2, Brain, Footprints,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MonitorCardiaco = lazy(() => import('@/components/MonitorCardiaco'));
const ExameFundoOlho = lazy(() => import('./ExameFundoOlho').then(m => ({ default: m.ExameFundoOlho })));
const OximetriaOptica = lazy(() => import('./OximetriaOptica').then(m => ({ default: m.OximetriaOptica })));
const DermatoscopiaDigital = lazy(() => import('./DermatoscopiaDigital').then(m => ({ default: m.DermatoscopiaDigital })));
const AvaliacaoMobilidade = lazy(() => import('./AvaliacaoMobilidade').then(m => ({ default: m.AvaliacaoMobilidade })));
const EstetoscopioDigital = lazy(() => import('./EstetoscopioDigital').then(m => ({ default: m.EstetoscopioDigital })));
const AuscultaPulmonar = lazy(() => import('./AuscultaPulmonar').then(m => ({ default: m.AuscultaPulmonar })));
const TremorometriaDigital = lazy(() => import('./TremorometriaDigital').then(m => ({ default: m.TremorometriaDigital })));
const ColorimetriaUrinaria = lazy(() => import('./ColorimetriaUrinaria').then(m => ({ default: m.ColorimetriaUrinaria })));
const AcuidadeVisual = lazy(() => import('./AcuidadeVisual').then(m => ({ default: m.AcuidadeVisual })));
const AtividadeFisicaGPS = lazy(() => import('./AtividadeFisicaGPS').then(m => ({ default: m.AtividadeFisicaGPS })));

type DiagnosticTool =
  | 'menu' | 'report' | 'cardiaco' | 'fundo_olho' | 'oximetria' | 'dermatoscopia'
  | 'mobilidade' | 'estetoscopio' | 'pulmonar' | 'tremor' | 'urine' | 'acuity' | 'gps';

interface DiagnosticSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleteDiagnostic?: (result: any) => void;
  /** Paciente do outro lado do atendimento (integração médico ↔ paciente) */
  patientId?: string;
  patientName?: string;
  /** Perfil de quem está usando o painel */
  isDoctor?: boolean;
  /** Envia o relatório da IA para o chat do atendimento */
  onSendReport?: (report: string) => void;
}

const menuItems: { id: DiagnosticTool; title: string; description: string; icon: React.ReactNode }[] = [
  { id: 'cardiaco', title: 'Monitor Cardíaco', description: 'BPM e HRV via câmera do smartphone', icon: <Activity className="w-6 h-6 text-rose-500" /> },
  { id: 'fundo_olho', title: 'Fundo de Olho (Fundoscopia)', description: 'Análise de retina guiada por IA — 31 patologias', icon: <Eye className="w-6 h-6 text-emerald-500" /> },
  { id: 'oximetria', title: 'Oximetria Óptica (SpO2)', description: 'Saturação de oxigênio via câmera', icon: <HeartPulse className="w-6 h-6 text-blue-500" /> },
  { id: 'dermatoscopia', title: 'Dermatoscopia Digital', description: 'Análise de lesões de pele com IA (ABCDE)', icon: <ScanSearch className="w-6 h-6 text-amber-500" /> },
  { id: 'mobilidade', title: 'Mobilidade Articular', description: 'Amplitude de movimento (ROM)', icon: <Accessibility className="w-6 h-6 text-violet-500" /> },
  { id: 'estetoscopio', title: 'Estetoscópio Digital IA', description: 'Ausculta cardíaca via microfone', icon: <Stethoscope className="w-6 h-6 text-emerald-600" /> },
  { id: 'pulmonar', title: 'Ausculta Pulmonar IA', description: 'Sons respiratórios via microfone', icon: <Wind className="w-6 h-6 text-cyan-500" /> },
  { id: 'tremor', title: 'Tremorometria IA', description: 'Tremores neuromotores via acelerômetro', icon: <Activity className="w-6 h-6 text-orange-500" /> },
  { id: 'urine', title: 'Urinálise IA', description: 'Leitura colorimétrica de tiras reagentes', icon: <ScanSearch className="w-6 h-6 text-yellow-500" /> },
  { id: 'acuity', title: 'Acuidade Visual', description: 'Teste de visão (tabela Snellen)', icon: <Eye className="w-6 h-6 text-indigo-500" /> },
  { id: 'gps', title: 'Atividade Física GPS', description: 'Rastreamento cardíaco outdoor', icon: <Footprints className="w-6 h-6 text-lime-500" /> },
];

const Fallback = () => (
  <div className="flex items-center justify-center h-[400px]">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
  </div>
);

export function DiagnosticSidebar({
  open, onOpenChange, onCompleteDiagnostic,
  patientId, patientName, isDoctor, onSendReport,
}: DiagnosticSidebarProps) {
  const [activeTool, setActiveTool] = useState<DiagnosticTool>('menu');
  const [loadingReport, setLoadingReport] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) setTimeout(() => setActiveTool('menu'), 300);
  };

  const handleComplete = (toolId: DiagnosticTool) => (result?: any) => {
    onCompleteDiagnostic?.({ tool: toolId, patientId, result });
    setActiveTool('menu');
  };

  const generateReport = async () => {
    setLoadingReport(true);
    setReport(null);
    try {
      const { data, error } = await supabase.functions.invoke('telemed-exam-report', {
        body: { patient_id: patientId, patient_name: patientName },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Falha ao gerar relatório');
      setReport(data.report as string);
    } catch (e: any) {
      toast.error(e.message ?? 'Não foi possível gerar o relatório');
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-slate-50 border-l border-border/40">
        <SheetHeader className="p-4 border-b bg-white relative">
          {activeTool !== 'menu' && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-2 h-8 w-8"
              onClick={() => setActiveTool('menu')}
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <SheetTitle className="flex items-center justify-center gap-2 font-display">
            <Stethoscope className="w-5 h-5 text-primary" />
            Ferramentas de Diagnóstico
          </SheetTitle>
          <SheetDescription className="text-center text-xs">
            {activeTool === 'menu'
              ? patientName
                ? `Exames remotos de ${patientName}`
                : 'Selecione um exame para realizar remotamente'
              : 'Realizando exame em tempo real'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTool === 'menu' && (
            <div className="space-y-3 mt-2">
              <button
                type="button"
                onClick={() => setActiveTool('report')}
                className="w-full text-left bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border border-emerald-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-200">
                  <Brain className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Relatório IA (Gemini)</h3>
                  <p className="text-xs text-slate-500">
                    Cruza todos os exames do paciente com o banco de patologias
                  </p>
                </div>
              </button>

              {menuItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => setActiveTool(item.id)}
                  className="bg-white p-4 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-primary/40 flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border group-hover:bg-primary/5 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{item.title}</h3>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTool === 'report' && (
            <div className="space-y-3">
              <div className="rounded-2xl border bg-white p-4">
                <p className="text-sm text-slate-600">
                  {patientName
                    ? <>Paciente: <strong>{patientName}</strong></>
                    : 'Nenhum paciente selecionado — o relatório usará seus próprios exames.'}
                </p>
                <Button className="w-full mt-3" onClick={generateReport} disabled={loadingReport}>
                  {loadingReport
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando exames…</>
                    : <><Sparkles className="w-4 h-4 mr-2" /> Gerar relatório clínico</>}
                </Button>
              </div>

              {report && (
                <div className="rounded-2xl border bg-white p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <FileText className="w-4 h-4 text-emerald-600" /> Relatório clínico
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-slate-700 leading-relaxed font-sans">
                    {report}
                  </pre>
                  {isDoctor && onSendReport && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => { onSendReport(report); handleOpenChange(false); }}
                    >
                      Anexar relatório ao atendimento
                    </Button>
                  )}
                  <p className="text-[10px] text-slate-400">
                    Triagem digital de apoio. A conduta final é sempre do médico responsável.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTool !== 'menu' && activeTool !== 'report' && (
            <div className="h-full min-h-[500px]">
              <Suspense fallback={<Fallback />}>
                {activeTool === 'cardiaco' && <MonitorCardiaco />}
                {activeTool === 'fundo_olho' && <ExameFundoOlho onComplete={handleComplete('fundo_olho')} />}
                {activeTool === 'oximetria' && <OximetriaOptica onComplete={handleComplete('oximetria')} />}
                {activeTool === 'dermatoscopia' && <DermatoscopiaDigital onComplete={handleComplete('dermatoscopia')} />}
                {activeTool === 'mobilidade' && <AvaliacaoMobilidade onComplete={handleComplete('mobilidade')} />}
                {activeTool === 'estetoscopio' && <EstetoscopioDigital onComplete={handleComplete('estetoscopio')} />}
                {activeTool === 'pulmonar' && <AuscultaPulmonar onComplete={handleComplete('pulmonar')} />}
                {activeTool === 'tremor' && <TremorometriaDigital onComplete={handleComplete('tremor')} />}
                {activeTool === 'urine' && <ColorimetriaUrinaria onComplete={handleComplete('urine')} />}
                {activeTool === 'acuity' && <AcuidadeVisual onComplete={handleComplete('acuity')} />}
                {activeTool === 'gps' && <AtividadeFisicaGPS onComplete={handleComplete('gps')} />}
              </Suspense>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
