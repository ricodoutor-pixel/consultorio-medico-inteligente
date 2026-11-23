import { useEffect, useState } from "react";
import { Loader2, Mic } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Autorização do paciente para o Escriba de IA, pedida antes da sala de vídeo.
 * A decisão é opcional e não bloqueia o atendimento; o médico só grava a consulta com "Autorizo".
 * As tabelas desta etapa (migração 0056) ainda não estão nos tipos gerados, por isso o acesso sem tipo.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function ScribeConsentCard({ appointmentId }: { appointmentId: string }) {
  const [decision, setDecision] = useState<boolean | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void db
      .from("consultation_scribe_consents")
      .select("accepted")
      .eq("appointment_id", appointmentId)
      .maybeSingle()
      .then(({ data, error }: { data: { accepted: boolean } | null; error: unknown }) => {
        if (!cancelled) setDecision(error ? null : data ? data.accepted : null);
      });
    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  const decide = async (accepted: boolean) => {
    setSaving(true);
    const { error } = await db.rpc("set_consultation_scribe_consent", { _appointment_id: appointmentId, _accepted: accepted });
    setSaving(false);
    if (error) {
      toast.error("Não foi possível registrar sua resposta. Tente de novo.");
      return;
    }
    setDecision(accepted);
    setEditing(false);
    toast.success(accepted ? "Obrigado! Sua autorização foi registrada." : "Tudo bem. A consulta não será gravada.");
  };

  if (decision === undefined) return null;

  if (decision !== null && !editing) {
    return (
      <p data-testid="scribe-consent-decided" className="text-xs text-muted-foreground">
        {decision ? "✓ Você autorizou a transcrição da consulta por IA." : "Você preferiu não autorizar a gravação da consulta."}{" "}
        <button type="button" className="underline font-semibold" onClick={() => setEditing(true)}>
          Mudar
        </button>
      </p>
    );
  }

  return (
    <div data-testid="scribe-consent-card" className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 space-y-2 text-left">
      <p className="text-sm font-bold text-foreground inline-flex items-center gap-2">
        <Mic size={15} className="text-purple-600" /> Transcrição da consulta por IA
      </p>
      <p className="text-xs text-foreground/80">
        Para o médico dar mais atenção a você, a conversa pode ser transcrita por inteligência artificial e virar um
        resumo no seu prontuário. <strong>O áudio não é guardado</strong>; o texto fica no prontuário, visível só para o
        seu médico. É opcional: a consulta acontece normalmente se você não autorizar.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" disabled={saving} onClick={() => void decide(true)}>
          {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : null} Autorizo
        </Button>
        <Button size="sm" variant="outline" disabled={saving} onClick={() => void decide(false)}>
          Não autorizo
        </Button>
      </div>
    </div>
  );
}
