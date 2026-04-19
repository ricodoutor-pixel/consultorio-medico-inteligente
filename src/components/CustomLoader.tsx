import { useEffect, useState } from "react";

/**
 * Splash / Loader screen — shows the Planta y Raiz brand while the app hydrates.
 * Fades out automatically after the app is ready.
 */
export function CustomLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 800);
    const remove = setTimeout(() => setVisible(false), 1200);
    return () => {
      clearTimeout(timer);
      clearTimeout(remove);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-400 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="Carregando Planta y Raiz"
    >
      {/* Logo / Brand */}
      <div className="flex flex-col items-center gap-4">
        <span className="text-4xl font-display font-black tracking-tight text-foreground">
          🌿 <span className="text-primary">Planta</span>{" "}
          <span className="text-muted-foreground">y Raiz</span>
        </span>

        {/* Spinner */}
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
        </div>

        <p className="text-xs text-muted-foreground mt-2">Carregando sua experiência…</p>
      </div>
    </div>
  );
}
