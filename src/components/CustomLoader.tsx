import { useEffect, useState } from "react";

/**
 * Splash / Loader screen — shows the Planta y Raiz brand while the app hydrates.
 * Removes itself as soon as React mounts (fast fade-out) to avoid the
 * "tela escura" perception on the homepage.
 */
export function CustomLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Hide as soon as the first paint happens (next animation frame).
    const raf = requestAnimationFrame(() => {
      setFadeOut(true);
    });
    const remove = setTimeout(() => setVisible(false), 350);
    // 🛡️ Safety net: never block UI longer than 5s, even if React fails to hydrate.
    const safety = setTimeout(() => {
      setFadeOut(true);
      setVisible(false);
    }, 5000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(remove);
      clearTimeout(safety);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-300 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="Carregando Planta y Raiz"
      aria-hidden={fadeOut}
    >
      <div className="flex flex-col items-center gap-4">
        <span className="text-4xl font-display font-black tracking-tight text-foreground">
          🌿 <span className="text-primary">Planta</span>{" "}
          <span className="text-muted-foreground">y Raiz</span>
        </span>

        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
        </div>

        <p className="text-xs text-muted-foreground mt-2">Carregando sua experiência…</p>
      </div>
    </div>
  );
}
