import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

interface SiteLayoutProps {
  children: ReactNode;
  /** Renderiza sem Navbar (raro — ex. fluxos full-screen) */
  hideNavbar?: boolean;
  /** Renderiza sem Footer (ex. dashboards) */
  hideFooter?: boolean;
  /** Classe extra para o <main> */
  mainClassName?: string;
  /** Adiciona padding-top padrão do conteúdo abaixo da navbar fixa */
  withTopPadding?: boolean;
}

/**
 * Layout padrão do site Planta y Raiz.
 * Garante Navbar (Verdinho + menu) + Footer consistentes em TODAS as páginas.
 *
 * Uso:
 *   <SiteLayout>
 *     <section>...</section>
 *   </SiteLayout>
 */
export function SiteLayout({
  children,
  hideNavbar = false,
  hideFooter = false,
  mainClassName,
  withTopPadding = false,
}: SiteLayoutProps) {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {!hideNavbar && <Navbar />}
      <main className={cn("flex-1", withTopPadding && "pt-20 md:pt-24", mainClassName)}>
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default SiteLayout;
