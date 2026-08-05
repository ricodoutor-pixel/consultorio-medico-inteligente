import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Stethoscope, Activity, Eye, HeartPulse, ScanSearch, Accessibility, ArrowLeft } from 'lucide-react';
import MonitorCardiaco from '@/components/MonitorCardiaco';
import { ExameFundoOlho } from './ExameFundoOlho';
import { OximetriaOptica } from './OximetriaOptica';
import { DermatoscopiaDigital } from './DermatoscopiaDigital';
import { AvaliacaoMobilidade } from './AvaliacaoMobilidade';
import { Button } from '@/components/ui/button';

type DiagnosticTool = 'menu' | 'cardiaco' | 'fundo_olho' | 'oximetria' | 'dermatoscopia' | 'mobilidade';

interface DiagnosticSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleteDiagnostic?: (result: any) => void;
}

export function DiagnosticSidebar({ open, onOpenChange, onCompleteDiagnostic }: DiagnosticSidebarProps) {
  const [activeTool, setActiveTool] = useState<DiagnosticTool>('menu');

  // When sidebar closes, reset to menu
  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setTimeout(() => setActiveTool('menu'), 300);
    }
  };

  const menuItems = [
    {
      id: 'cardiaco',
      title: 'Monitor Cardíaco',
      description: 'Mede BPM via câmera do smartphone',
      icon: <Activity className="w-6 h-6 text-rose-500" />
    },
    {
      id: 'fundo_olho',
      title: 'Fundo de Olho (Fundoscopia)',
      description: 'Análise de retina guiada por IA — 31 patologias',
      icon: <Eye className="w-6 h-6 text-emerald-500" />
    },
    {
      id: 'oximetria',
      title: 'Oximetria Óptica (SpO2)',
      description: 'Saturação de oxigênio via câmera',
      icon: <HeartPulse className="w-6 h-6 text-blue-500" />
    },
    {
      id: 'dermatoscopia',
      title: 'Dermatoscopia Digital',
      description: 'Análise de lesões de pele com IA',
      icon: <ScanSearch className="w-6 h-6 text-amber-500" />
    },
    {
      id: 'mobilidade',
      title: 'Mobilidade Articular',
      description: 'Avaliação de amplitude de movimento',
      icon: <Accessibility className="w-6 h-6 text-violet-500" />
    }
  ];

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
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <SheetTitle className="flex items-center justify-center gap-2 font-display">
            <Stethoscope className="w-5 h-5 text-primary" />
            Ferramentas de Diagnóstico
          </SheetTitle>
          <SheetDescription className="text-center text-xs">
            {activeTool === 'menu' ? 'Selecione um exame para realizar remotamente' : 'Realizando exame em tempo real'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTool === 'menu' && (
            <div className="space-y-3 mt-2">
              {menuItems.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setActiveTool(item.id as DiagnosticTool)}
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

          {activeTool === 'cardiaco' && (
            <div className="h-full min-h-[500px]">
              <MonitorCardiaco />
            </div>
          )}

          {activeTool === 'fundo_olho' && (
            <div className="h-full min-h-[500px]">
              <ExameFundoOlho onComplete={() => handleOpenChange(false)} />
            </div>
          )}

          {activeTool === 'oximetria' && (
            <div className="h-full min-h-[500px]">
              <OximetriaOptica onComplete={() => handleOpenChange(false)} />
            </div>
          )}

          {activeTool === 'dermatoscopia' && (
            <div className="h-full min-h-[500px]">
              <DermatoscopiaDigital onComplete={() => handleOpenChange(false)} />
            </div>
          )}

          {activeTool === 'mobilidade' && (
            <div className="h-full min-h-[500px]">
              <AvaliacaoMobilidade onComplete={() => handleOpenChange(false)} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
