import React from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const HolidayPlantaoBanner: React.FC = () => {
  const warningText = "🚭 PARE DE FUMAR: O CIGARRO É EXTREMAMENTE PREJUDICIAL À SAÚDE! · CUIDE DA SUA SAÚDE PULMONAR E CARDIOVASCULAR · PLANTA Y RAÍZ MEDICINA INTEGRATIVA";

  return (
    <div className="w-full bg-gradient-to-r from-red-950 via-neutral-900 to-amber-950 border-y border-red-500/50 py-2 relative z-30 shadow-lg overflow-hidden">
      <style>{`
        @keyframes pyrMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-pyr-marquee {
          display: inline-flex;
          white-space: nowrap;
          animation: pyrMarquee 28s linear infinite;
        }
        .animate-pyr-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="container mx-auto flex items-center justify-between gap-3 px-3">
        <div className="flex-1 overflow-hidden relative">
          <div className="animate-pyr-marquee text-xs md:text-sm font-black tracking-wide text-amber-200">
            <span className="inline-flex items-center gap-2 mx-6">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
              {warningText}
            </span>
            <span className="text-amber-400/60 font-bold mx-2">★★★</span>
            <span className="inline-flex items-center gap-2 mx-6">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
              {warningText}
            </span>
            <span className="text-amber-400/60 font-bold mx-2">★★★</span>
          </div>
        </div>

        <div className="shrink-0 z-10 pl-2">
          <Link
            to="/orientacao-tecnica"
            className="inline-flex items-center gap-1 font-bold text-white bg-red-600 hover:bg-red-500 px-3 py-1 rounded-full text-xs shadow-md hover:shadow-lg transition-all transform hover:scale-105"
          >
            Orientação Técnica <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HolidayPlantaoBanner;
