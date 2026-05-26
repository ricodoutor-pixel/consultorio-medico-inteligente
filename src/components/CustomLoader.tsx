import { useEffect, useState } from "react";
import drVerdinho from "@/assets/dr-verdinho-floating.png";

/**
 * Splash / Loader screen — Dr. Verdinho, mascote oficial da Planta y Raiz Ltda.
 * Exibido ao iniciar o app em todos os dispositivos. Faz fade-out após hidratação.
 */
export function CustomLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1400);
    const remove = setTimeout(() => setVisible(false), 1800);
    return () => {
      clearTimeout(timer);
      clearTimeout(remove);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ backgroundColor: "#1B4332" }}
      aria-label="Carregando Planta y Raiz"
    >
      <div className="flex flex-col items-center gap-6 px-6 text-center">
        <img
          src={drVerdinho}
          alt="Dr. Verdinho — Mascote Oficial Planta y Raiz Ltda"
          className="w-44 h-44 sm:w-52 sm:h-52 object-contain drop-shadow-2xl animate-[float_2.5s_ease-in-out_infinite]"
          style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.4))" }}
          {...({ fetchpriority: "high" } as any)}
        />

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Planta <span className="text-emerald-300">y</span> Raiz{" "}
            <span className="text-emerald-100/80 font-bold text-2xl sm:text-3xl">Ltda</span>
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/95 tracking-wide font-medium">
            Sua Mega Clínica Digital
          </p>
          <p className="text-[11px] sm:text-xs text-emerald-200/70 tracking-wider uppercase mt-1">
            Telemedicina Cannabis Medicinal
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
