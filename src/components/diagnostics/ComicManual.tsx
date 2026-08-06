import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface Step {
  title: string;
  description: string;
  icon: string;
  colorClass: string;
}

interface ComicManualProps {
  title: string;
  icon: React.ElementType;
  steps: Step[];
  brisaMessage: string;
}

export const ComicManual: React.FC<ComicManualProps> = ({ title, icon: Icon, steps, brisaMessage }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="absolute top-4 right-4 z-50 gap-2 border-2 border-primary/50 text-primary font-bold hover:bg-primary/10 rounded-full h-9 px-3 text-xs md:text-sm">
          <BookOpen className="w-4 h-4" /> Como Funciona
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-4 border-black rounded-2xl z-[100]">
        <DialogHeader>
          <DialogTitle className="text-2xl md:text-3xl font-black uppercase text-center mb-4 text-emerald-600 font-comic">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 font-sans text-sm md:text-base text-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, index) => (
              <div key={index} className={`border-4 border-black rounded-lg p-4 ${step.colorClass} relative shadow-[4px_4px_0px_rgba(0,0,0,1)]`}>
                <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">
                  PASSO {index + 1}
                </div>
                <h3 className="font-black text-lg md:text-xl mb-2 mt-2 uppercase tracking-tight">{step.title}</h3>
                <p className="font-bold leading-tight">{step.description}</p>
                <div className="mt-4 flex justify-center">
                  <span className="text-6xl">{step.icon}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="bg-primary text-primary-foreground p-4 rounded-xl border-4 border-black font-black flex items-center gap-3">
            <Icon className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0" />
            <p className="leading-tight text-base md:text-lg">{brisaMessage}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
