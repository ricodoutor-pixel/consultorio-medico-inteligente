import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Stethoscope } from "lucide-react";

export const HolidayPlantaoBanner: React.FC = () => {
  return (
    <div className="w-full bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 border-y border-emerald-500/30 px-3 py-2.5 shadow-md relative z-30">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm text-emerald-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold uppercase tracking-wide text-emerald-300 flex items-center gap-1">
            <Stethoscope className="w-3.5 h-3.5" /> Plantão de Feriado Ativo
          </span>
          <span className="hidden sm:inline text-emerald-200/80">•</span>
          <span className="hidden sm:inline text-emerald-100/90 font-medium">
            Consultórios físicos fechados hoje? Nossa equipe médica e orientação canabinoide atendem normalmente.
          </span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <Link
            to="/telemedicina?origem=banner_feriado"
            className="inline-flex items-center gap-1 font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded-full text-xs shadow-sm hover:shadow transition-all"
          >
            Iniciar Atendimento <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
