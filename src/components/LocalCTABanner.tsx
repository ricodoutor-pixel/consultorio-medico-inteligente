import { useEffect, useState } from "react";

/**
 * LocalCTABanner — SEO-only.
 * Renderiza brevemente (3s) menção local "São Paulo / Av. Paulista" para crawlers,
 * mas NÃO é visível para usuários (sr-only após mount). Some automaticamente.
 * Atendemos todo o Brasil — não há preferência geográfica real.
 */
export function LocalCTABanner() {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setMounted(false), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  // sr-only: invisível ao usuário, lido por crawlers/SEO
  return (
    <div className="sr-only" aria-hidden="false">
      Planta y Raiz — Telemedicina Cannabis Medicinal com atendimento em todo o Brasil.
      Sede administrativa em São Paulo, Av. Paulista. Agendamento 100% online.
    </div>
  );
}
