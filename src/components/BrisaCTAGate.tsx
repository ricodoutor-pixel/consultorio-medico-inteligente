import { useCallback, useEffect, useState, ReactNode } from "react";
import { LeadCaptureModal } from "@/components/LeadCaptureModal";
import { supabase } from "@/integrations/supabase/client";

interface BrisaCTAGateProps {
  /** Destino final após captura (ou skip). Pode ser https://wa.me/... ou rota interna. */
  href: string;
  /** Texto/elementos do botão original (mantém o estilo do CTA existente). */
  children: ReactNode;
  /** Classes do CTA (mesmo `className` do botão original). */
  className?: string;
  /** Mensagem do modal exibida ao visitante não cadastrado. */
  modalMessage?: string;
  /** Categoria do lead — paciente | medico | lojista | ebook. Default: paciente. */
  categoria?: "paciente" | "medico" | "lojista" | "ebook";
  /** Tags adicionais para o lead (ex: ["CTA_Index_Hero"]). */
  tags?: string[];
  /** Abrir em nova aba (padrão true para wa.me, false para rotas internas). */
  newTab?: boolean;
  /** Identificador opcional para analytics. */
  source?: string;
}

/**
 * Gate de retenção de leads para CTAs da Enf. Brisa.
 *
 * Regras:
 *  • Usuário logado OU já capturado (localStorage `pr_lead_phone`) → segue direto para `href`.
 *  • Não cadastrado → abre LeadCaptureModal. O modal tem X para PULAR (libera acesso mesmo assim).
 *  • Submit → salva lead + dispara WhatsApp/Email automático com convite R$30 + segue para `href`.
 *  • Skip (X) → fecha modal e segue para `href` sem capturar.
 */
export function BrisaCTAGate({
  href,
  children,
  className,
  modalMessage = "Antes de falar com a Enf. Brisa, deixe seu contato — assim conseguimos te enviar sua orientação técnica direto no WhatsApp por apenas R$30.",
  categoria = "paciente",
  tags = [],
  newTab,
  source,
}: BrisaCTAGateProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setIsAuthed(!!data.user);
    });
    return () => { mounted = false; };
  }, []);

  const shouldOpenInNewTab = newTab ?? href.startsWith("http");

  const goToTarget = useCallback(() => {
    if (shouldOpenInNewTab) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = href;
    }
  }, [href, shouldOpenInNewTab]);

  const alreadyCaptured = typeof window !== "undefined" && !!localStorage.getItem("pr_lead_phone");

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthed || alreadyCaptured) {
      goToTarget();
      return;
    }
    setModalOpen(true);
  }, [isAuthed, alreadyCaptured, goToTarget]);

  return (
    <>
      <a href={href} onClick={handleClick} className={className} target={shouldOpenInNewTab ? "_blank" : undefined} rel={shouldOpenInNewTab ? "noopener noreferrer" : undefined}>
        {children}
      </a>
      <LeadCaptureModal
        isOpen={modalOpen}
        origem="chat"
        categoria={categoria}
        tags={source ? [source, ...tags] : tags}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
        onSkip={() => { setModalOpen(false); goToTarget(); }}
        onSuccess={() => { setModalOpen(false); goToTarget(); }}
      />
    </>
  );
}

export default BrisaCTAGate;
