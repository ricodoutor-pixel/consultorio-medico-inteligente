import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MessageCircle, CheckCircle2, XCircle, Activity, FileText, RefreshCw, Download, FileDown } from "lucide-react";
import jsPDF from "jspdf";

type Lead = {
  id: string;
  name: string;
  whatsapp: string;
  source: string;
  status: string;
  lead_score: number;
  condition_interest: string | null;
  metadata: Record<string, any>;
  created_at: string;
};

type HistoryRow = {
  id: string;
  from_status: string | null;
  to_status: string;
  note: string | null;
  whatsapp_sent: boolean;
  whatsapp_message: string | null;
  whatsapp_error: string | null;
  created_at: string;
};

type FunnelRow = {
  id: string;
  funnel: string;
  event_name: string;
  metadata: Record<string, any>;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Novo", contacted: "Contatado", qualified: "Qualificado",
  converted: "Convertido", lost: "Perdido",
};

export default function AdminLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [events, setEvents] = useState<FunnelRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!id) return;
    setLoading(true);
    const { data: l } = await supabase.from("leads" as any).select("*").eq("id", id).maybeSingle();
    const leadRow = l as any as Lead | null;
    setLead(leadRow);

    const { data: h } = await supabase
      .from("lead_status_history" as any)
      .select("*").eq("lead_id", id).order("created_at", { ascending: false });
    setHistory(((h as any) ?? []) as HistoryRow[]);

    let evQuery = supabase.from("funnel_events" as any).select("*").order("created_at", { ascending: false }).limit(200);
    // Match events directly linked OR by sessionStorage session_id stored in metadata
    const { data: directEv } = await evQuery.eq("lead_id", id);
    let combined: FunnelRow[] = ((directEv as any) ?? []) as FunnelRow[];

    // Also fetch session-id matched events (when calculator/ebook events fired before lead row existed)
    const sessionFromMeta = leadRow?.metadata?.session_id as string | undefined;
    if (sessionFromMeta) {
      const { data: sessionEv } = await supabase
        .from("funnel_events" as any)
        .select("*")
        .eq("session_id", sessionFromMeta)
        .order("created_at", { ascending: false })
        .limit(200);
      const seen = new Set(combined.map((c) => c.id));
      ((sessionEv as any) ?? []).forEach((e: FunnelRow) => {
        if (!seen.has(e.id)) combined.push(e);
      });
    }

    combined.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    setEvents(combined);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }
  if (!lead) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Lead não encontrado.
      </div>
    );
  }

  const formFields = Object.entries(lead.metadata ?? {}).filter(([k]) => k !== "session_id");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="rounded-xl">
            <Link to="/admin/leads"><ArrowLeft size={14} className="mr-1" /> Leads</Link>
          </Button>
          <div className="min-w-0">
            <h1 className="font-display font-black text-2xl md:text-3xl truncate">{lead.name}</h1>
            <p className="text-xs text-muted-foreground">
              {lead.source} · Score {lead.lead_score} · Criado em{" "}
              {new Date(lead.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        {/* Resumo */}
        <Card className="border-primary/20 bg-card/60 backdrop-blur-md">
          <CardContent className="p-5 grid sm:grid-cols-2 gap-4">
            <InfoRow icon={<Phone size={14} />} label="WhatsApp" value={
              <a className="text-primary hover:underline" href={`https://wa.me/${lead.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer">
                {lead.whatsapp}
              </a>
            } />
            <InfoRow icon={<Activity size={14} />} label="Status atual" value={
              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase border border-primary/30 bg-primary/10 text-primary">
                {STATUS_LABELS[lead.status] ?? lead.status}
              </span>
            } />
            {lead.condition_interest && (
              <InfoRow icon={<FileText size={14} />} label="Condição" value={lead.condition_interest} />
            )}
          </CardContent>
        </Card>

        {/* Form data */}
        {formFields.length > 0 && (
          <Card className="border-border bg-card/40">
            <CardContent className="p-5">
              <h2 className="font-black text-sm uppercase tracking-wider text-primary mb-3">
                Dados enviados pelo formulário
              </h2>
              <div className="grid sm:grid-cols-2 gap-2 text-xs">
                {formFields.map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl bg-background/60 border border-border">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k}</p>
                    <p className="font-semibold break-words">{typeof v === "object" ? JSON.stringify(v) : String(v)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico de status */}
        <Card className="border-border bg-card/40">
          <CardContent className="p-5">
            <h2 className="font-black text-sm uppercase tracking-wider text-primary mb-3">
              Histórico de status ({history.length})
            </h2>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma mudança de status registrada.</p>
            ) : (
              <ol className="space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="p-3 rounded-xl bg-background/60 border border-border">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold">
                        {STATUS_LABELS[h.from_status ?? ""] ?? h.from_status ?? "—"}{" "}
                        <span className="text-muted-foreground mx-1">→</span>{" "}
                        <span className="text-primary">{STATUS_LABELS[h.to_status] ?? h.to_status}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {new Date(h.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    {h.note && <p className="text-xs text-muted-foreground mt-1">📝 {h.note}</p>}
                    {h.whatsapp_message && (
                      <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/20 flex gap-2 items-start">
                        {h.whatsapp_sent ? (
                          <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
                        ) : (
                          <XCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            WhatsApp {h.whatsapp_sent ? "enviado" : "falhou"}
                          </p>
                          <p className="text-xs break-words">{h.whatsapp_message}</p>
                          {h.whatsapp_error && (
                            <p className="text-[10px] text-rose-400 mt-1">{h.whatsapp_error}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Eventos do funil */}
        <Card className="border-border bg-card/40">
          <CardContent className="p-5">
            <h2 className="font-black text-sm uppercase tracking-wider text-primary mb-3">
              Eventos do funil ({events.length})
            </h2>
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum evento registrado.</p>
            ) : (
              <ol className="space-y-1.5">
                {events.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-background/60 border border-border">
                    <MessageCircle size={12} className="text-primary shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      {e.funnel}
                    </span>
                    <span className="text-xs font-bold flex-1 min-w-0 truncate">{e.event_name}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {new Date(e.created_at).toLocaleString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="text-sm font-semibold break-words">{value}</div>
      </div>
    </div>
  );
}
