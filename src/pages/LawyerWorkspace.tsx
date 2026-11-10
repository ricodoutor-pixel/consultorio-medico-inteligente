import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/contexts/AccountContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BRAZIL_STATES, lawyerFeeSchema, lawyerRegistrationSchema, legalTime } from "@/lib/lawyer-registration";
import { toast } from "sonner";

export default function LawyerWorkspace() {
  const { user, loading } = useAccount();
  const cache = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(45);
  const profile = useQuery({ queryKey: ["lawyer-profile", user?.id], enabled: !!user, queryFn: async () => {
    if (!user) return null;
    const { data, error } = await supabase.from("lawyer_profiles").select("*").eq("user_id", user.id).maybeSingle();
    if (error) throw error; return data;
  }});
  const terms = useQuery({ queryKey: ["lawyer-own-terms", profile.data?.id], enabled: !!profile.data, queryFn: async () => {
    if (!profile.data) return null;
    const { data, error } = await supabase.from("lawyer_terms").select("*").eq("lawyer_id", profile.data.id).maybeSingle();
    if (error) throw error; return data;
  }});
  const agenda = useQuery({ queryKey: ["lawyer-own-slots", profile.data?.id], enabled: !!profile.data, queryFn: async () => {
    if (!profile.data) return [];
    const { data, error } = await supabase.from("lawyer_slots").select("*").eq("lawyer_id", profile.data.id).gt("ends_at", new Date().toISOString()).order("starts_at");
    if (error) throw error; return data;
  }});
  const bookings = useQuery({ queryKey: ["lawyer-own-bookings", profile.data?.id], enabled: !!profile.data, queryFn: async () => {
    if (!profile.data) return [];
    const { data, error } = await supabase.from("lawyer_appointments").select("*,lawyer_slots(starts_at)").eq("lawyer_id", profile.data.id).order("created_at", { ascending: false });
    if (error) throw error; return data;
  }});
  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!user || busy) return;
    const f = new FormData(event.currentTarget);
    const parsed = lawyerRegistrationSchema.safeParse(Object.fromEntries(f));
    if (!parsed.success) { toast.error("Confira nome, número e UF da OAB e os limites dos campos."); return; }
    setBusy(true);
    const result = profile.data
      ? await supabase.from("lawyer_profiles").update(parsed.data).eq("id", profile.data.id)
      : await supabase.from("lawyer_profiles").insert({ ...parsed.data, user_id: user.id });
    setBusy(false);
    if (result.error) { toast.error("Não foi possível salvar. Confira se esta OAB já possui cadastro."); return; }
    toast.success("Cadastro salvo para revisão manual da OAB.");
    await cache.invalidateQueries({ queryKey: ["lawyer-profile"] });
    void cache.invalidateQueries({ queryKey: ["legal-directory"] });
  };
  const saveTerms = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!profile.data || busy) return;
    const f = new FormData(event.currentTarget);
    const fee = lawyerFeeSchema.safeParse(f.get("fee"));
    const scope = String(f.get("scope") ?? "").trim();
    if (!fee.success || !scope || scope.length > 2000) { toast.error("Informe honorários positivos e o escopo da consulta."); return; }
    setBusy(true);
    const { error } = await supabase.from("lawyer_terms").upsert({ lawyer_id: profile.data.id, consultation_fee: fee.data, scope });
    setBusy(false);
    if (error) toast.error("Não foi possível salvar os honorários.");
    else { toast.success("Honorários privados salvos."); void cache.invalidateQueries({ queryKey: ["lawyer-own-terms"] }); void cache.invalidateQueries({ queryKey: ["legal-quote"] }); }
  };
  const addSlot = async (event: React.FormEvent) => {
    event.preventDefault(); if (!profile.data || busy) return;
    // Inputs are explicitly Brasília time, not the browser/device timezone.
    const start = new Date(`${date}T${time}:00-03:00`);
    if (!Number.isFinite(start.getTime()) || start.getTime() <= Date.now()) { toast.error("Escolha um horário futuro."); return; }
    setBusy(true);
    const { error } = await supabase.from("lawyer_slots").insert({ lawyer_id: profile.data.id, starts_at: start.toISOString(), ends_at: new Date(start.getTime() + duration * 60000).toISOString() });
    setBusy(false);
    if (error) toast.error("Não foi possível abrir esse horário. Verifique se já existe um horário sobreposto.");
    else { toast.success("Horário aberto na agenda jurídica."); void cache.invalidateQueries({ queryKey: ["lawyer-own-slots"] }); void cache.invalidateQueries({ queryKey: ["legal-slots"] }); }
  };
  return <div className="min-h-dvh bg-background"><Navbar /><section className="container mx-auto max-w-4xl px-4 pt-32 pb-16 space-y-8">
    <Link to="/advogados" className="text-primary text-sm">Voltar para Advogados</Link><h1 className="text-2xl font-bold flex items-center gap-2"><Scale className="text-primary" /> Cadastro e agenda jurídica</h1>
    {loading || profile.isLoading ? <p>Carregando cadastro…</p> : !user ? <div className="space-y-4"><p>Entre ou crie uma conta para cadastrar sua inscrição na OAB.</p><Button asChild><Link to="/login?redirect=%2Fadvogados%2Fcadastro">Entrar</Link></Button><Button variant="outline" asChild><Link to="/cadastro?redirect=%2Fadvogados%2Fcadastro">Criar conta</Link></Button></div> : profile.isError ? <div><p role="alert">Não foi possível consultar seu cadastro.</p><Button onClick={() => void profile.refetch()}>Tentar novamente</Button></div> : <>
      <p className="text-sm text-muted-foreground">{profile.data?.status === "approved" ? "Inscrição aprovada. Alterações nos dados públicos exigem nova revisão." : profile.data?.status === "rejected" ? "Cadastro não aprovado. Revise seus dados e envie novamente." : "O cadastro só será publicado após conferência manual da inscrição na OAB."}</p>
      <form onSubmit={saveProfile} key={profile.data?.id ?? "new"} className="space-y-4">
        <div><Label htmlFor="lawyer-name">Nome profissional</Label><Input id="lawyer-name" name="full_name" required minLength={3} maxLength={160} defaultValue={profile.data?.full_name} /></div>
        <div className="grid sm:grid-cols-2 gap-4"><div><Label htmlFor="lawyer-oab">Número da OAB</Label><Input id="lawyer-oab" name="oab_number" required inputMode="numeric" pattern="[0-9]{1,10}" defaultValue={profile.data?.oab_number} /></div><div><Label htmlFor="lawyer-state">UF da OAB</Label><select id="lawyer-state" name="oab_state" defaultValue={profile.data?.oab_state ?? ""} required className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="" disabled>Selecione</option>{BRAZIL_STATES.map(s => <option key={s} value={s}>{s}</option>)}</select></div></div>
        <div><Label htmlFor="lawyer-city">Cidade</Label><Input id="lawyer-city" name="city" maxLength={100} defaultValue={profile.data?.city} /></div>
        <div><Label htmlFor="lawyer-bio">Apresentação e experiência em habeas corpus medicinal</Label><Textarea id="lawyer-bio" name="bio" maxLength={2000} defaultValue={profile.data?.bio} /><p className="text-xs text-muted-foreground mt-2">Informe apenas experiência comprovável, sem promessas de resultado. Não inclua dados de clientes.</p></div>
        <Button type="submit" disabled={busy}>Enviar cadastro para revisão</Button>
      </form>
      {profile.data && <>
        <section className="border-t border-border pt-6 space-y-4"><h2 className="text-xl font-bold">Honorários da consulta inicial</h2><p className="text-sm text-muted-foreground">Definidos por você, observando a tabela da sua seccional da OAB. Não são exibidos na vitrine pública.</p>
          {terms.isLoading ? <p>Carregando honorários…</p> : terms.isError ? <p role="alert">Não foi possível consultar os honorários.</p> : <form onSubmit={saveTerms} key={terms.data?.consultation_fee ?? "terms"} className="space-y-4"><div><Label htmlFor="lawyer-fee">Honorários (R$)</Label><Input id="lawyer-fee" name="fee" type="number" min="0.01" step="0.01" required defaultValue={terms.data?.consultation_fee} /></div><div><Label htmlFor="lawyer-scope">O que a consulta inclui</Label><Textarea id="lawyer-scope" name="scope" required maxLength={2000} defaultValue={terms.data?.scope ?? "Consulta jurídica inicial. Não inclui processo judicial nem custas."} /></div><Button type="submit" disabled={busy}>Salvar honorários</Button></form>}
        </section>
        <section className="border-t border-border pt-6 space-y-4"><h2 className="text-xl font-bold">Minha agenda · Brasília</h2>
          {profile.data.status !== "approved" ? <p className="text-sm text-muted-foreground">A abertura de horários aguarda a aprovação do cadastro.</p> : <form onSubmit={addSlot} className="grid sm:grid-cols-3 gap-3"><div><Label htmlFor="legal-date">Data</Label><Input id="legal-date" type="date" value={date} onChange={e => setDate(e.target.value)} required /></div><div><Label htmlFor="legal-hour">Horário de Brasília</Label><Input id="legal-hour" type="time" value={time} onChange={e => setTime(e.target.value)} required /></div><div><Label htmlFor="legal-duration">Duração (minutos)</Label><Input id="legal-duration" type="number" min={15} max={180} step={15} value={duration} onChange={e => setDuration(Number(e.target.value))} required /></div><Button type="submit" disabled={busy || !terms.data}>Abrir horário</Button></form>}
          {agenda.isError ? <p role="alert">Não foi possível consultar a agenda.</p> : agenda.data?.map(s => <p key={s.id} className="text-sm border-b border-border py-2">{legalTime(s.starts_at)} · {s.status === "available" ? "Disponível" : "Reservado"}</p>)}
        </section>
        <section className="border-t border-border pt-6 space-y-4"><h2 className="text-xl font-bold">Consultas jurídicas</h2>{bookings.isError ? <p role="alert">Não foi possível consultar os agendamentos.</p> : !bookings.data?.length ? <p className="text-sm text-muted-foreground">Ainda não há agendamentos.</p> : bookings.data.map(a => <div key={a.id} className="border-b border-border py-3 space-y-2"><p>{a.lawyer_slots?.starts_at ? legalTime(a.lawyer_slots.starts_at) : ""} · {a.status === "scheduled" ? "Agendado" : a.status === "cancelled" ? "Cancelado" : "Concluído"}</p><p className="text-sm">Honorários: {Number(a.fee).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><p className="text-sm text-muted-foreground">{a.scope}</p>{a.status === "scheduled" && <div className="flex gap-2 flex-wrap">{(["completed", "cancelled"] as const).map(status => <Button key={status} variant="outline" disabled={busy} onClick={async () => { setBusy(true); const { error } = await supabase.rpc("close_lawyer_appointment", { _id: a.id, _status: status }); setBusy(false); if (error) toast.error("Não foi possível atualizar a consulta."); else { toast.success("Consulta atualizada."); void cache.invalidateQueries({ queryKey: ["lawyer-own-bookings"] }); void cache.invalidateQueries({ queryKey: ["lawyer-own-slots"] }); } }}>{status === "completed" ? "Concluir consulta" : "Cancelar agendamento"}</Button>)}</div>}</div>)}</section>
      </>}
    </>}
  </section><Footer /></div>;
}