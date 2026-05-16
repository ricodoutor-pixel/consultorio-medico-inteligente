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
        {/* Dr. Verdinho — Identidade Oficial */}
        <img
          src={drVerdinho}
          alt="Dr. Verdinho — Mascote Oficial Planta y Raiz Ltda"
          className="w-40 h-40 sm:w-48 sm:h-48 object-contain drop-shadow-2xl animate-[float_2.5s_ease-in-out_infinite]"
          style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.4))" }}
          {...({ fetchpriority: "high" } as any)}
        />

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Planta <span className="text-emerald-300">y</span> Raiz
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/80 tracking-wide">
            Telemedicina Cannabis Medicinal
          </p>
        </div>

        {/* Spinner sutil abaixo do Dr. Verdinho */}
        <div className="relative h-6 w-6 mt-1">
          <div className="absolute inset-0 rounded-full border-2 border-white/15" />
          <div className="absolute inset-0 rounded-full border-2 border-t-emerald-300 animate-spin" />
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
