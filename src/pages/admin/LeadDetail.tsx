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
  const [resendingId, setResendingId] = useState<string | null>(null);

  async function resendWhatsApp(historyId: string) {
    setResendingId(historyId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-lead-resend-whatsapp", {
        body: { history_id: historyId },
      });
      if (error) throw error;
      await load();
      if (!data?.sent) alert(`Falha no reenvio: ${data?.error ?? "erro desconhecido"}`);
    } catch (e: any) {
      alert(`Erro: ${e?.message ?? e}`);
    } finally {
      setResendingId(null);
    }
  }

  function exportCSV() {
    if (!lead) return;
    const lines: string[] = [];
    lines.push("# LEAD");
    lines.push("id,nome,whatsapp,origem,status,score,condicao,criado_em");
    lines.push([
      lead.id, lead.name.replace(/[",\n]/g, " "), lead.whatsapp, lead.source,
      lead.status, String(lead.lead_score),
      (lead.condition_interest ?? "").replace(/[",\n]/g, " "),
      lead.created_at,
    ].map((c) => `"${c}"`).join(","));

    lines.push("");
    lines.push("# METADATA");
    Object.entries(lead.metadata ?? {}).forEach(([k, v]) => {
      const val = (typeof v === "object" ? JSON.stringify(v) : String(v)).replace(/"/g, "'");
      lines.push(`"${k}","${val}"`);
    });

    lines.push("");
    lines.push("# HISTORICO STATUS");
    lines.push("data,de,para,nota,whatsapp_enviado,mensagem,erro");
    history.forEach((h) => {
      lines.push([
        h.created_at, h.from_status ?? "", h.to_status,
        (h.note ?? "").replace(/[",\n]/g, " "),
        h.whatsapp_sent ? "sim" : "nao",
        (h.whatsapp_message ?? "").replace(/[",\n]/g, " "),
        (h.whatsapp_error ?? "").replace(/[",\n]/g, " "),
      ].map((c) => `"${c}"`).join(","));
    });

    lines.push("");
    lines.push("# EVENTOS FUNIL");
    lines.push("data,funnel,evento,metadata");
    events.forEach((e) => {
      lines.push([
        e.created_at, e.funnel, e.event_name,
        JSON.stringify(e.metadata ?? {}).replace(/"/g, "'"),
      ].map((c) => `"${c}"`).join(","));
    });

    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lead-${lead.name.replace(/\W+/g, "_")}-${lead.id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    if (!lead) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const M = 40;
    let y = M;

    const line = (text: string, opts: { size?: number; bold?: boolean; color?: [number,number,number] } = {}) => {
      const size = opts.size ?? 10;
      doc.setFontSize(size);
      doc.setFont("helvetica", opts.bold ? "bold" : "normal");
      if (opts.color) doc.setTextColor(...opts.color); else doc.setTextColor(20, 20, 20);
      const wrapped = doc.splitTextToSize(text, W - M * 2);
      wrapped.forEach((l: string) => {
        if (y > 780) { doc.addPage(); y = M; }
        doc.text(l, M, y);
        y += size + 4;
      });
    };
    const hr = () => { if (y > 770) { doc.addPage(); y = M; } doc.setDrawColor(200); doc.line(M, y, W - M, y); y += 10; };

    line("Planta y Raiz · CRM Lead", { size: 16, bold: true, color: [27, 67, 50] });
    line(`Exportado em ${new Date().toLocaleString("pt-BR")}`, { size: 9, color: [120,120,120] });
    hr();

    line(lead.name, { size: 14, bold: true });
    line(`WhatsApp: ${lead.whatsapp}   ·   Status: ${STATUS_LABELS[lead.status] ?? lead.status}   ·   Score: ${lead.lead_score}`);
    line(`Origem: ${lead.source}   ·   Criado: ${new Date(lead.created_at).toLocaleString("pt-BR")}`);
    if (lead.condition_interest) line(`Condição: ${lead.condition_interest}`);
    hr();

    const meta = Object.entries(lead.metadata ?? {}).filter(([k]) => k !== "session_id");
    if (meta.length > 0) {
      line("Dados do formulário", { size: 12, bold: true, color: [27, 67, 50] });
      meta.forEach(([k, v]) => line(`• ${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`));
      hr();
    }

    line(`Histórico de status (${history.length})`, { size: 12, bold: true, color: [27, 67, 50] });
    if (history.length === 0) line("Nenhuma mudança registrada.", { color: [120,120,120] });
    history.forEach((h) => {
      line(`${new Date(h.created_at).toLocaleString("pt-BR")} — ${h.from_status ?? "—"} → ${h.to_status}`, { bold: true });
      if (h.note) line(`  Nota: ${h.note}`);
      if (h.whatsapp_message) {
        line(`  WhatsApp ${h.whatsapp_sent ? "✓ enviado" : "✗ falhou"}: ${h.whatsapp_message}`);
        if (h.whatsapp_error) line(`  Erro: ${h.whatsapp_error}`, { color: [200,40,40] });
      }
      y += 4;
    });
    hr();

    line(`Eventos do funil (${events.length})`, { size: 12, bold: true, color: [27, 67, 50] });
    if (events.length === 0) line("Nenhum evento registrado.", { color: [120,120,120] });
    events.forEach((e) => {
      line(`${new Date(e.created_at).toLocaleString("pt-BR")} — [${e.funnel}] ${e.event_name}`);
    });

    doc.save(`lead-${lead.name.replace(/\W+/g, "_")}-${lead.id.slice(0, 8)}.pdf`);
  }


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
      <div className="min-h-dvh bg-background flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }
  if (!lead) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center text-muted-foreground">
        Lead não encontrado.
      </div>
    );
  }

  const formFields = Object.entries(lead.metadata ?? {}).filter(([k]) => k !== "session_id");

  return (
    <div className="min-h-dvh bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6 max-w-5xl">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" asChild className="rounded-xl">
            <Link to="/admin/leads"><ArrowLeft size={14} className="mr-1" /> Leads</Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-black text-2xl md:text-3xl truncate">{lead.name}</h1>
            <p className="text-xs text-muted-foreground">
              {lead.source} · Score {lead.lead_score} · Criado em{" "}
              {new Date(lead.created_at).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-xl">
              <Download size={14} className="mr-1" /> CSV
            </Button>
            <Button size="sm" onClick={exportPDF} className="rounded-xl bg-primary text-primary-foreground">
              <FileDown size={14} className="mr-1" /> PDF
            </Button>
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
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            WhatsApp {h.whatsapp_sent ? "enviado" : "falhou"}
                          </p>
                          <p className="text-xs break-words">{h.whatsapp_message}</p>
                          {h.whatsapp_error && (
                            <p className="text-[10px] text-rose-400 mt-1">{h.whatsapp_error}</p>
                          )}
                        </div>
                        {!h.whatsapp_sent && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={resendingId === h.id}
                            onClick={() => resendWhatsApp(h.id)}
                            className="h-7 px-2 text-[10px] font-black uppercase rounded-lg shrink-0"
                          >
                            <RefreshCw size={12} className={`mr-1 ${resendingId === h.id ? "animate-spin" : ""}`} />
                            {resendingId === h.id ? "Enviando" : "Reenviar"}
                          </Button>
                        )}
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
