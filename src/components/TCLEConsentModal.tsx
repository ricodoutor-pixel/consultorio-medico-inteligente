import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Shield, FileText, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TCLEConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  doctorName?: string;
  patientName?: string;
  appointmentId?: string;
}

const TCLE_VERSION = "2026.1";

/**
 * TCLEConsentModal — versão auditável (Rodada 1 compliance)
 *
 * Regras:
 *  - Sem auto-accept: usuário DEVE marcar todos os checkboxes e clicar "Li e Aceito".
 *  - Grava o registro em `public.tcle_consents` (RLS protegida) antes de liberar acesso.
 *  - Exige login. Se não houver sessão ativa, mostra bloco de autenticação obrigatória.
 */
export const TCLEConsentModal = ({
  open,
  onAccept,
  onDecline,
  doctorName = "Médico(a)",
  patientName = "Paciente",
  appointmentId,
}: TCLEConsentModalProps) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [checks, setChecks] = useState({
    read: false,
    limitations: false,
    privacy: false,
    ai: false,
  });
  const [saving, setSaving] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const allChecked = Object.values(checks).every(Boolean);

  useEffect(() => {
    if (!open) {
      setChecks({ read: false, limitations: false, privacy: false, ai: false });
      setSaving(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session);
      setAuthChecked(true);
    });
  }, [open]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !saving) onDecline();
  };

  const handleAccept = async () => {
    if (!allChecked || saving) return;
    setSaving(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      toast({
        title: "Login necessário",
        description: "Faça login para registrar o consentimento (TCLE) na plataforma.",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("tcle_consents").insert({
      user_id: session.user.id,
      appointment_id: appointmentId ?? null,
      doctor_name: doctorName,
      version: TCLE_VERSION,
      checks,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 400) : null,
    });

    if (error) {
      console.error("[TCLE] Falha ao registrar consentimento", error);
      toast({
        title: "Não foi possível registrar o TCLE",
        description: error.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    toast({
      title: "TCLE registrado ✅",
      description: "Seu consentimento foi assinado eletronicamente e arquivado com segurança.",
    });
    setSaving(false);
    onAccept();
  };

  const headerContent = (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-9 sm:w-9">
        <FileText size={18} className="text-primary sm:h-4 sm:w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-bold leading-tight text-foreground sm:text-lg">
          Termo de Consentimento (TCLE)
        </h2>
        <p className="mt-1 text-xs leading-4 text-muted-foreground sm:text-sm">
          CFM 2.314/2022 · 2.454/2026 · LGPD · Versão {TCLE_VERSION}
        </p>
      </div>
      <Badge variant="outline" className="shrink-0 border-primary/30 px-2 py-1 text-[10px] text-primary sm:text-xs">
        <Shield size={12} className="mr-1" /> Válido
      </Badge>
    </div>
  );

  const authWarning = authChecked && !isAuthed && (
    <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold">Login obrigatório</p>
        <p className="opacity-90">
          O registro do TCLE só pode ser feito por pacientes autenticados. Faça login antes de prosseguir.
        </p>
      </div>
    </div>
  );

  const modalBody = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 py-4 sm:px-5 sm:py-4">
        {headerContent}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
        <div className="space-y-3 text-sm leading-6 text-muted-foreground sm:text-[15px]">
          {authWarning}
          <p className="text-sm font-semibold leading-6 text-foreground sm:text-base">
            Prezado(a) {patientName},
          </p>
          <p>
            Este TCLE informa sobre condições, benefícios e riscos da teleconsulta em cannabis
            medicinal, conforme <strong>Res. CFM 2.314/2022</strong>, <strong>2.454/2026</strong> e
            a <strong>LGPD (Lei 13.709/2018)</strong>.
          </p>

          <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-3.5">
            <p><strong className="text-foreground">1. TELECONSULTA</strong> — Atendimento por áudio/vídeo pelo(a) Dr(a). <strong>{doctorName}</strong>, mediante identificação civil.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-3.5">
            <p><strong className="text-foreground">2. LIMITAÇÕES</strong> — Não substitui atendimento de urgência/emergência. Exame físico é limitado. A IA é apoio — a decisão clínica é do médico.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-3.5">
            <p><strong className="text-foreground">3. PRIVACIDADE</strong> — Dados sensíveis criptografados (AES-256 + TLS 1.3). Videoconferência não é gravada por padrão.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-3.5">
            <p><strong className="text-foreground">4. USO DE IA</strong> — Sugestões diagnósticas/terapêuticas por IA (CFM 2.454/2026). Você pode revogar este consentimento a qualquer momento em <em>Meus Direitos LGPD</em>.</p>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 sm:p-3.5">
            <p><strong className="text-foreground">5. INTERMEDIAÇÃO TECNOLÓGICA</strong> — Declaro estar ciente de que a <strong className="text-foreground">Planta y Raiz Ltda</strong> é apenas um <strong className="text-foreground">meio tecnológico de conexão</strong> entre paciente, médico prescritor e farmácia/importadora licenciada. A plataforma <strong className="text-foreground">não faz parte da cadeia de suprimentos farmacêutica</strong>, não fabrica, não vende, não entrega e não detém posse de produtos. A responsabilidade pelo ato médico é do prescritor e a responsabilidade pelo produto (qualidade, entrega, eficácia) é da farmácia parceira.</p>
          </div>

        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-background px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-5 sm:pt-4">
        <div className="grid grid-cols-1 gap-2.5">
          {[
            { key: 'read' as const, label: 'Li e compreendi integralmente este TCLE.' },
            { key: 'limitations' as const, label: 'Estou ciente das limitações da teleconsulta.' },
            { key: 'privacy' as const, label: 'Autorizo o tratamento dos meus dados conforme a LGPD.' },
            { key: 'ai' as const, label: 'Autorizo o uso de IA como apoio clínico (CFM 2.454/2026).' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-start gap-3 rounded-lg px-1 py-1.5 cursor-pointer">
              <Checkbox
                checked={checks[key]}
                onCheckedChange={(value) => setChecks((prev) => ({ ...prev, [key]: !!value }))}
                className="mt-0.5 h-5 w-5 shrink-0"
                disabled={saving}
              />
              <span className="text-sm leading-5 text-muted-foreground sm:text-[15px]">{label}</span>
            </label>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            className="h-11 text-sm font-medium"
            onClick={onDecline}
            disabled={saving}
          >
            Recusar
          </Button>
          <Button
            className="h-11 text-sm font-bold"
            disabled={!allChecked || saving || !isAuthed}
            onClick={handleAccept}
          >
            {saving ? (
              <><Loader2 size={16} className="mr-2 animate-spin" /> Registrando…</>
            ) : (
              <><CheckCircle2 size={16} className="mr-2" /> Li e Aceito</>
            )}
          </Button>
        </div>

        <p className="mt-3 text-center text-xs leading-4 text-muted-foreground sm:text-sm">
          Assinatura eletrônica — Lei nº 14.063/2020 · Registro auditável
        </p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="flex h-[100dvh] max-h-[100dvh] flex-col gap-0 rounded-none border-0 p-0 [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Termo de Consentimento (TCLE)</SheetTitle>
          </SheetHeader>
          {modalBody}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex w-[94vw] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0"
        style={{ maxHeight: 'calc(100dvh - 2rem)' }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Termo de Consentimento (TCLE)</DialogTitle>
        </DialogHeader>
        {modalBody}
      </DialogContent>
    </Dialog>
  );
};
