import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { professionals } from "@/data/professionals";
import { isPublicProfessionalVisible } from "@/lib/public-professional-visibility";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { setVisibleInterval } from "@/lib/visible-interval";
import { withAccessTimeout } from "@/lib/auth-access-errors";

type DoctorAccess = { id: string; crm: string; crm_state: string; email: string | null; email_confirmed: boolean; auth_blocked: boolean; suspended_at: string | null; is_approved_by_admin: boolean; approval_status: string };
const registration = (crm?: string) => crm?.match(/\d[\d.]*/)?.[0].replace(/\D/g, "") ?? "";

export function AdminAccessSupport() {
  const [health, setHealth] = useState<{ ok: boolean; at: string } | null>(null);
  const [doctors, setDoctors] = useState<DoctorAccess[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const check = useCallback(async () => {
    try {
      const { data, error } = await withAccessTimeout(supabase.functions.invoke("health-check"));
      setHealth({ ok: !error && data?.ok === true, at: data?.checked_at ?? new Date().toISOString() });
    } catch { setHealth({ ok: false, at: new Date().toISOString() }); }
  }, []);
  useEffect(() => { void check(); return setVisibleInterval(() => void check(), 60000); }, [check]);
  const load = async () => {
    setOpen(true); setBusy("list"); setLoadError(false);
    try {
      const { data, error } = await supabase.functions.invoke("admin-access-support", { body: { action: "list" } });
      if (error || !Array.isArray(data?.doctors)) throw new Error("Unavailable");
      setDoctors(data.doctors);
    } catch { setDoctors(null); setLoadError(true); }
    finally { setBusy(null); }
  };
  const reset = async (doctor: DoctorAccess) => {
    if (!window.confirm("Enviar um novo link de redefinição para este médico?")) return;
    setBusy(doctor.id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-access-support", { body: { action: "reset", doctor_id: doctor.id } });
      if (error || data?.accepted !== true) throw new Error("Unavailable");
      toast({ title: "Solicitação aceita", description: "O serviço de e-mail aceitou a solicitação; confira o recebimento com o médico." });
    } catch { toast({ title: "Não foi possível enviar", description: "Tente novamente em alguns minutos.", variant: "destructive" }); }
    finally { setBusy(null); }
  };
  return <section className="mb-8 space-y-3">
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-sm font-semibold text-foreground">Banco de dados: {health ? health.ok ? "online" : "offline / sem resposta" : "verificando"}</p>
      {health && <span className="text-xs text-muted-foreground">Última verificação: {new Date(health.at).toLocaleString("pt-BR")}</span>}
      <Button size="icon" variant="outline" title="Verificar acesso" aria-label="Verificar acesso" onClick={() => void check()}><RefreshCw size={16} /></Button>
      <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => void load()}><KeyRound size={15} className="mr-2" />Acessos dos médicos</Button>
    </div>
    {open && <div className="overflow-x-auto">
      {loadError ? <p role="alert" className="text-sm text-destructive">Não foi possível consultar as contas. Tente novamente.</p> : doctors === null ? <p className="text-sm text-muted-foreground">Consultando contas…</p> : <Table>
        <TableHeader><TableRow><TableHead>Médico da vitrine</TableHead><TableHead>E-mail de login</TableHead><TableHead>Status</TableHead><TableHead>E-mail confirmado</TableHead><TableHead>Recuperação</TableHead></TableRow></TableHeader>
        <TableBody>{professionals.filter(isPublicProfessionalVisible).map((p) => {
          const d = doctors.find((d) => registration(d.crm) !== "" && registration(d.crm) === registration(p.crm) && (!p.crm?.match(/\/([A-Z]{2})/) || p.crm.match(/\/([A-Z]{2})/)?.[1] === d.crm_state));
          const state = !d ? "Sem conta vinculada" : d.suspended_at || d.auth_blocked || d.approval_status === "blocked" ? "Bloqueado" : d.is_approved_by_admin && d.approval_status === "approved" ? "Ativo" : "Pendente";
          return <TableRow key={p.id}><TableCell>{p.name}</TableCell><TableCell>{d?.email ?? "—"}</TableCell><TableCell>{state}</TableCell><TableCell>{d ? d.email_confirmed ? "Sim" : "Não" : "—"}</TableCell><TableCell><Button variant="outline" size="icon" title="Reenviar link de redefinição" aria-label={`Reenviar link para ${p.name}`} disabled={!d?.email || busy !== null} onClick={() => { if (d) void reset(d); }}><KeyRound size={16} /></Button></TableCell></TableRow>;
        })}</TableBody>
      </Table>}
    </div>}
  </section>;
}