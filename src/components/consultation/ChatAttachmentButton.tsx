import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";

interface Props {
  name?: string | null;
  /** Gera o link temporário e abre o arquivo; devolve false se não foi possível. */
  onOpen: () => Promise<boolean>;
}

/** Anexo de uma mensagem do chat da consulta (abre por link temporário, só para participantes). */
export function ChatAttachmentButton({ name, onOpen }: Props) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        setBusy(true);
        setFailed(!(await onOpen()));
        setBusy(false);
      }}
      className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white/80 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-white"
    >
      {busy ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
      {failed ? "Não abriu — tente de novo" : `Abrir ${name || "anexo"}`}
    </button>
  );
}
