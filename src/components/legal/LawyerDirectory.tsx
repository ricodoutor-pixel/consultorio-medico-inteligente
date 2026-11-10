import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Scale, CalendarDays, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAccount } from "@/contexts/AccountContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { legalTime } from "@/lib/lawyer-registration";
import { toast } from "sonner";

export function LawyerDirectory() {
  const { user, isAdmin } = useAccount();
  const cache = useQueryClient();
  const [selected, setSelected] = useState<Tables<"lawyer_profiles"> | null>(null);
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const lawyers = useQuery({ queryKey: ["legal-directory"], queryFn: async () => {
    const { data, error } = await supabase.from("lawyer_profiles").select("*").eq("status", "approved").order("full_name");
    if (error) throw error; return data;
  }});
  const slots = useQuery({ queryKey: ["legal-slots", selected?.id], enabled: !!selected, queryFn: async () => {
    if (!selected) return [];
    const { data, error } = await supabase.from("lawyer_slots").select("*").eq("lawyer_id", selected.id).eq("status", "available").gt("starts_at", new Date().toISOString()).order("starts_at");
    if (error) throw error; return data;
  }});
  const quote = useQuery({ queryKey: ["legal-quote", selected?.id, user?.id], enabled: !!selected && !!user, queryFn: async () => {
    if (!selected) return null;
    const { data, error } = await supabase.rpc("get_lawyer_private_quote", { _lawyer_id: selected.id });
    if (error) throw error; return data?.[0] ?? null;
  }});
  const appointments = useQuery({ queryKey: ["legal-my-bookings", user?.id], enabled: !!user, queryFn: async () => {
    if (!user) return [];
    const { data, error } = await supabase.from("lawyer_appointments").select("*, lawyer_profiles(full_name), lawyer_slots(starts_at)").eq("client_id", user.id).order("created_at", { ascending: false });
    if (error) throw error; return data;
  }});
  const book = async (id: string) => {
    if (!user || !consent || busy) return;
    setBusy(true);
    const { error } = await supabase.rpc("book_lawyer_slot", { _slot_id: id });
    setBusy(false);
    if (error) { toast.error("Não foi possível reservar. Atualize a agenda e tente novamente."); await cache.invalidateQueries({ queryKey: ["legal-slots"] }); return; }
    toast.success("Consulta jurídica agendada. Nenhuma cobrança foi realizada.");
    setSelected(null); setConsent(false);
    await Promise.all([cache.invalidateQueries({ queryKey: ["legal-slots"] }), cache.invalidateQueries({ queryKey: ["legal-my-bookings"] })]);
  };
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Scale className="text-primary" /> Advogados</h2><p className="text-sm text-muted-foreground mt-2">Habeas corpus e assessoria jurídica sobre cultivo medicinal para uso próprio.</p></div>
      <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link to="/advogados/cadastro">Cadastro e agenda do advogado</Link></Button>{isAdmin && <Button asChild variant="outline"><Link to="/admin/advogados">Revisar cadastros</Link></Button>}</div>
    </div>
    <p className="text-sm text-muted-foreground border-l-2 border-primary pl-4">A contratação não autoriza o cultivo nem garante decisão judicial favorável. Cada caso depende de avaliação jurídica individual. Atendimento jurídico independente do atendimento médico.</p>
    {lawyers.isLoading ? <Loader2 className="animate-spin text-primary" aria-label="Carregando advogados" /> : lawyers.isError ? <div><p role="alert">Não foi possível consultar os advogados.</p><Button variant="outline" onClick={() => void lawyers.refetch()}>Tentar novamente</Button></div> : !lawyers.data?.length ? <p className="py-8 text-muted-foreground">Ainda não há advogados aprovados nesta categoria.</p> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{lawyers.data.map(lawyer => <Card key={lawyer.id}><CardContent className="p-5 space-y-3">
      <Scale className="h-10 w-10 text-primary" /><h3 className="font-bold text-lg break-words">{lawyer.full_name}</h3><p className="text-sm text-primary">OAB/{lawyer.oab_state} {lawyer.oab_number}</p><p className="text-sm text-muted-foreground">{lawyer.city}</p><p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{lawyer.bio}</p><Button variant="outline" className="w-full gap-2" onClick={() => { setSelected(lawyer); setConsent(false); }}><CalendarDays size={16} /> Consultar agenda</Button>
    </CardContent></Card>)}</div>}
    {!!appointments.data?.length && <section className="space-y-3"><h2 className="text-lg font-bold">Meus agendamentos jurídicos</h2>{appointments.data.map(a => <div key={a.id} className="border-b border-border py-3 flex flex-wrap gap-3 justify-between"><div><p className="font-semibold">{a.lawyer_profiles?.full_name}</p><p className="text-sm text-muted-foreground">{a.lawyer_slots?.starts_at ? legalTime(a.lawyer_slots.starts_at) : ""} · Brasília · {a.status === "scheduled" ? "Agendado" : a.status === "cancelled" ? "Cancelado" : "Concluído"}</p><p className="text-sm">Honorários acordados: {Number(a.fee).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>{a.status === "scheduled" && <Button variant="outline" onClick={async () => { const { error } = await supabase.rpc("close_lawyer_appointment", { _id: a.id, _status: "cancelled" }); if (error) toast.error("Não foi possível cancelar."); else { toast.success("Agendamento cancelado."); void cache.invalidateQueries({ queryKey: ["legal-my-bookings"] }); void cache.invalidateQueries({ queryKey: ["legal-slots"] }); } }}>Cancelar agendamento</Button>}</div>)}</section>}
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>{selected?.full_name}</DialogTitle><DialogDescription>Agenda jurídica · Horário de Brasília</DialogDescription></DialogHeader>
      {!user ? <Button asChild><Link to="/login?redirect=%2Fadvogados">Entrar para consultar honorários e agendar</Link></Button> : quote.isLoading ? <p>Consultando honorários…</p> : quote.isError ? <p role="alert">Não foi possível consultar os honorários.</p> : quote.data ? <div className="space-y-3"><p className="font-semibold">Consulta inicial: {Number(quote.data.consultation_fee).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><p className="text-sm text-muted-foreground">{quote.data.scope}</p><label className="flex gap-2 text-sm"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />Aceito os honorários e o escopo da consulta. Nenhum pagamento será realizado nesta reserva.</label></div> : <p className="text-sm text-muted-foreground">Honorários ainda não informados pelo advogado.</p>}
      {slots.isLoading ? <p>Carregando horários…</p> : slots.isError ? <p role="alert">Não foi possível consultar os horários.</p> : !slots.data?.length ? <p className="text-sm text-muted-foreground">Não há horários disponíveis no momento.</p> : <div className="grid gap-2">{slots.data.map(s => <Button key={s.id} variant="outline" disabled={!user || !quote.data || !consent || busy} onClick={() => void book(s.id)}>{legalTime(s.starts_at)}</Button>)}</div>}
    </DialogContent></Dialog>
  </div>;
}