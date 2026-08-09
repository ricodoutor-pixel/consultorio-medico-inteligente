import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download, RefreshCw, ArrowLeft, Users, CheckCircle2, Phone, Calendar,
  TrendingUp, ExternalLink, MessageSquare,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

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

type EventRow = {
  funnel: string;
  event_name: string;
  created_at: string;
  lead_id: string | null;
  session_id: string | null;
};

const STATUS_OPTIONS = ["new", "contacted", "qualified", "converted", "lost"] as const;
const STATUS_LABELS: Record<string, string> = {
  new: "Novo", contacted: "Contatado", qualified: "Qualificado",
  converted: "Convertido", lost: "Perdido",
};
const STATUS_COLORS: Record<string, string> = {
  new: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  contacted: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  qualified: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  converted: "bg-primary/15 text-primary border-primary/30",
  lost: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const FUNNEL_STAGE_ORDER: Record<string, string[]> = {
  protocol_calculator: ["calculator_viewed", "step_answered", "calculator_completed", "whatsapp_clicked"],
  ebook_gate: ["ebook_viewed", "ebook_form_submitted", "ebook_pdf_downloaded"],
  lead_status: ["status_new", "status_contacted", "status_qualified", "status_converted", "status_lost"],
};

const CHART_COLORS = ["hsl(var(--primary))", "#7dd3fc", "#fbbf24", "#a78bfa", "#fb7185"];

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [days, setDays] = useState(30);
  const [minScore, setMinScore] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [metaKey, setMetaKey] = useState("");
  const [metaValue, setMetaValue] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Modal status change
  const [pendingChange, setPendingChange] = useState<{ lead: Lead; toStatus: string } | null>(null);
  const [pendingNote, setPendingNote] = useState("");
  const [sendWA, setSendWA] = useState(true);
  const [customMsg, setCustomMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const [{ data: leadRows }, { data: eventRows }] = await Promise.all([
      supabase.from("leads" as any).select("*").gte("created_at", since)
        .order("created_at", { ascending: false }).limit(1000),
      supabase.from("funnel_events" as any).select("funnel, event_name, created_at, lead_id, session_id")
        .gte("created_at", since).limit(10000),
    ]);
    setLeads(((leadRows as any) ?? []) as Lead[]);
    setEvents(((eventRows as any) ?? []) as EventRow[]);
    setLoading(false);
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [days]);

  const sources = useMemo(() => Array.from(new Set(leads.map((l) => l.source))).sort(), [leads]);
  const conditions = useMemo(
    () => Array.from(new Set(leads.map((l) => l.condition_interest).filter(Boolean) as string[])).sort(),
    [leads],
  );
  const metaKeys = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => Object.keys(l.metadata ?? {}).forEach((k) => { if (k !== "session_id") s.add(k); }));
    return Array.from(s).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    const min = minScore === "" ? null : Number(minScore);
    const max = maxScore === "" ? null : Number(maxScore);
    const mv = metaValue.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
      if (conditionFilter !== "all" && l.condition_interest !== conditionFilter) return false;
      if (min !== null && !Number.isNaN(min) && l.lead_score < min) return false;
      if (max !== null && !Number.isNaN(max) && l.lead_score > max) return false;
      if (metaKey && mv) {
        const v = (l.metadata ?? {})[metaKey];
        const str = v == null ? "" : (typeof v === "object" ? JSON.stringify(v) : String(v));
        if (!str.toLowerCase().includes(mv)) return false;
      }
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        const inMeta = Object.values(l.metadata ?? {}).some((v) => {
          const str = v == null ? "" : (typeof v === "object" ? JSON.stringify(v) : String(v));
          return str.toLowerCase().includes(t);
        });
        if (!l.name.toLowerCase().includes(t) && !l.whatsapp.includes(t) &&
            !(l.condition_interest ?? "").toLowerCase().includes(t) && !inMeta) return false;
      }
      return true;
    });
  }, [leads, statusFilter, sourceFilter, searchTerm, minScore, maxScore, conditionFilter, metaKey, metaValue]);

  const stats = useMemo(() => {
    const total = leads.length;
    const byStatus: Record<string, number> = {};
    leads.forEach((l) => { byStatus[l.status] = (byStatus[l.status] ?? 0) + 1; });
    const converted = byStatus["converted"] ?? 0;
    return { total, byStatus, conversionRate: total > 0 ? (converted / total) * 100 : 0 };
  }, [leads]);

  // Charts data
  const leadsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const k = d.toISOString().slice(0, 10);
      map.set(k, 0);
    }
    leads.forEach((l) => {
      const k = l.created_at.slice(0, 10);
      if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({
      date: date.slice(5), leads: count,
    }));
  }, [leads, days]);

  const leadsBySource = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => map.set(l.source, (map.get(l.source) ?? 0) + 1));
    return Array.from(map.entries()).map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count).slice(0, 8);
  }, [leads]);

  const statusPie = useMemo(
    () => Object.entries(stats.byStatus).map(([status, count]) => ({
      name: STATUS_LABELS[status] ?? status, value: count, status,
    })),
    [stats]
  );

  // Funnel stages with conversion rate
  const funnelStages = useMemo(() => {
    const result: { funnel: string; stages: { name: string; count: number; rate: number }[] }[] = [];
    Object.entries(FUNNEL_STAGE_ORDER).forEach(([funnel, stages]) => {
      const counts: Record<string, number> = {};
      events.filter((e) => e.funnel === funnel).forEach((e) => {
        counts[e.event_name] = (counts[e.event_name] ?? 0) + 1;
      });
      const firstCount = counts[stages[0]] ?? 0;
      const data = stages.map((s) => {
        const count = counts[s] ?? 0;
        return { name: s, count, rate: firstCount > 0 ? (count / firstCount) * 100 : 0 };
      });
      if (data.some((d) => d.count > 0)) result.push({ funnel, stages: data });
    });
    return result;
  }, [events]);

  function openStatusChange(lead: Lead, toStatus: string) {
    if (lead.status === toStatus) return;
    setPendingChange({ lead, toStatus });
    setPendingNote("");
    setCustomMsg("");
    setSendWA(toStatus !== "new");
    setActionResult(null);
  }

  async function confirmStatusChange() {
    if (!pendingChange) return;
    setSubmitting(true);
    setActionResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-lead-status-update", {
        body: {
          lead_id: pendingChange.lead.id,
          to_status: pendingChange.toStatus,
          note: pendingNote || null,
          send_whatsapp: sendWA,
          custom_message: customMsg || null,
        },
      });
      if (error) throw error;
      setLeads((prev) => prev.map((l) =>
        l.id === pendingChange.lead.id ? { ...l, status: pendingChange.toStatus } : l
      ));
      const waMsg = sendWA
        ? data?.whatsapp_sent ? " · WhatsApp enviado ✓" : ` · WhatsApp falhou: ${data?.whatsapp_error ?? "erro"}`
        : "";
      setActionResult(`Status atualizado${waMsg}`);
      setTimeout(() => { setPendingChange(null); loadAll(); }, 1200);
    } catch (e: any) {
      setActionResult(`Erro: ${e?.message ?? e}`);
    } finally {
      setSubmitting(false);
    }
  }

  function exportCSV() {
    const headers = ["id","data","nome","whatsapp","origem","status","score","condicao","metadata"];
    const rows = filtered.map((l) => [
      l.id, new Date(l.created_at).toISOString(),
      l.name.replace(/[",\n]/g, " "), l.whatsapp, l.source, l.status,
      String(l.lead_score), (l.condition_interest ?? "").replace(/[",\n]/g, " "),
      JSON.stringify(l.metadata ?? {}).replace(/"/g, "'"),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild className="rounded-xl">
              <Link to="/admin"><ArrowLeft size={14} className="mr-1" /> Admin</Link>
            </Button>
            <div>
              <h1 className="font-display font-black text-2xl md:text-3xl">CRM · Leads</h1>
              <p className="text-xs text-muted-foreground">Calculadora · Ebook · Origens externas</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadAll} className="rounded-xl">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
            <Button size="sm" onClick={exportCSV} className="rounded-xl bg-primary text-primary-foreground">
              <Download size={14} className="mr-1" /> CSV ({filtered.length})
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<Users size={16} />} label="Total" value={String(stats.total)} />
          <StatCard icon={<CheckCircle2 size={16} />} label="Convertidos" value={String(stats.byStatus["converted"] ?? 0)} />
          <StatCard icon={<TrendingUp size={16} />} label="Taxa conversão" value={`${stats.conversionRate.toFixed(1)}%`} />
          <StatCard icon={<Calendar size={16} />} label="Janela" value={`${days} dias`} />
        </div>

        {/* Filtros */}
        <Card className="border-border bg-card/40">
          <CardContent className="p-4 space-y-3">
            <div className="grid md:grid-cols-[1fr_180px_180px_140px] gap-3">
              <input type="text" placeholder="Buscar nome, WhatsApp, condição, metadata..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm">
                <option value="all">Todos os status</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
                className="h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm">
                <option value="all">Todas origens</option>
                {sources.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))}
                className="h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm">
                <option value={7}>7 dias</option>
                <option value={30}>30 dias</option>
                <option value={90}>90 dias</option>
                <option value={365}>1 ano</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-[10px] font-black uppercase tracking-wider text-primary hover:underline"
            >
              {showAdvanced ? "− Ocultar filtros avançados" : "+ Filtros avançados (score · condição · metadata)"}
            </button>

            {showAdvanced && (
              <div className="grid md:grid-cols-[120px_120px_1fr_1fr_1fr] gap-3 pt-2 border-t border-border">
                <input type="number" placeholder="Score min" min={0} max={100}
                  value={minScore} onChange={(e) => setMinScore(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm tabular-nums" />
                <input type="number" placeholder="Score max" min={0} max={100}
                  value={maxScore} onChange={(e) => setMaxScore(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm tabular-nums" />
                <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm">
                  <option value="all">Todas condições</option>
                  {conditions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={metaKey} onChange={(e) => setMetaKey(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm">
                  <option value="">Campo da metadata...</option>
                  {metaKeys.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <input type="text" placeholder="Valor do campo (contém)"
                  value={metaValue} onChange={(e) => setMetaValue(e.target.value)}
                  disabled={!metaKey}
                  className="h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm disabled:opacity-40" />
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>
                {filtered.length} de {leads.length} leads
                {(minScore || maxScore || conditionFilter !== "all" || metaKey || statusFilter !== "all" || sourceFilter !== "all" || searchTerm) && " (filtrado)"}
              </span>
              {(minScore || maxScore || conditionFilter !== "all" || metaKey || metaValue || searchTerm || statusFilter !== "all" || sourceFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm(""); setStatusFilter("all"); setSourceFilter("all");
                    setMinScore(""); setMaxScore(""); setConditionFilter("all");
                    setMetaKey(""); setMetaValue("");
                  }}
                  className="text-primary hover:underline font-black uppercase tracking-wider"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Charts grid */}
        <div className="grid lg:grid-cols-3 gap-3">
          {/* Leads por dia */}
          <Card className="border-border bg-card/40 lg:col-span-2">
            <CardContent className="p-4">
              <h2 className="font-black text-xs uppercase tracking-wider text-primary mb-3">Leads por dia</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={leadsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                    <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Status pie */}
          <Card className="border-border bg-card/40">
            <CardContent className="p-4">
              <h2 className="font-black text-xs uppercase tracking-wider text-primary mb-3">Distribuição por status</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                      {statusPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Leads por origem */}
          <Card className="border-border bg-card/40 lg:col-span-3">
            <CardContent className="p-4">
              <h2 className="font-black text-xs uppercase tracking-wider text-primary mb-3">Leads por origem</h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadsBySource}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="source" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funnels with conversion rates */}
        {funnelStages.length > 0 && (
          <Card className="border-primary/20 bg-card/60 backdrop-blur-md">
            <CardContent className="p-5">
              <h2 className="font-black text-sm uppercase tracking-wider text-primary mb-4">
                Funis de conversão (taxa por etapa)
              </h2>
              <div className="grid lg:grid-cols-2 gap-4">
                {funnelStages.map((f) => (
                  <div key={f.funnel} className="p-4 rounded-xl bg-background/60 border border-border">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">
                      {f.funnel.replace(/_/g, " ")}
                    </p>
                    <div className="space-y-2">
                      {f.stages.map((s, i) => (
                        <div key={s.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-bold">{s.name}</span>
                            <span className="text-primary tabular-nums">
                              {s.count} · {s.rate.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-background overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${Math.min(s.rate, 100)}%`, opacity: 1 - i * 0.12 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela */}
        <Card className="border-border bg-card/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/60 border-b border-border">
                <tr className="text-left">
                  {["Data","Nome","WhatsApp","Origem","Score","Status","Ação",""].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground text-xs">Carregando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground text-xs">Nenhum lead encontrado.</td></tr>
                ) : filtered.map((l) => (
                  <tr key={l.id} className="border-b border-border/40 hover:bg-background/40">
                    <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-4 py-3 font-bold">{l.name}</td>
                    <td className="px-4 py-3">
                      <a href={`https://wa.me/${l.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Phone size={12} /> {l.whatsapp}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.source}</td>
                    <td className="px-4 py-3 font-black text-primary tabular-nums">{l.lead_score}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${STATUS_COLORS[l.status] ?? ""}`}>
                        {STATUS_LABELS[l.status] ?? l.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select value={l.status} onChange={(e) => openStatusChange(l, e.target.value)}
                        className="h-8 px-2 rounded-lg bg-background border border-border text-xs">
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Link to={`/admin/leads/${l.id}`}><ExternalLink size={14} /></Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Status change modal */}
      {pendingChange && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={() => !submitting && setPendingChange(null)}>
          <div className="bg-card border border-primary/20 rounded-2xl p-6 max-w-md w-full space-y-4"
               onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="font-black text-lg">Mudar status</h3>
              <p className="text-xs text-muted-foreground">
                {pendingChange.lead.name} ·{" "}
                <span className="text-muted-foreground">{STATUS_LABELS[pendingChange.lead.status]}</span>
                {" → "}
                <span className="text-primary">{STATUS_LABELS[pendingChange.toStatus]}</span>
              </p>
            </div>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Nota interna (opcional)</span>
              <textarea value={pendingNote} onChange={(e) => setPendingNote(e.target.value)} rows={2} maxLength={500}
                className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-xs focus:border-primary focus:outline-none" />
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sendWA} onChange={(e) => setSendWA(e.target.checked)} className="accent-primary" />
              <MessageSquare size={14} className="text-primary" />
              <span className="text-sm font-bold">Enviar WhatsApp automaticamente</span>
            </label>

            {sendWA && (
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Mensagem personalizada (deixe vazio para usar o template)
                </span>
                <textarea value={customMsg} onChange={(e) => setCustomMsg(e.target.value)} rows={3} maxLength={1000}
                  placeholder={`Olá ${pendingChange.lead.name}! ...`}
                  className="w-full mt-1 p-2 rounded-lg bg-background border border-border text-xs focus:border-primary focus:outline-none" />
              </label>
            )}

            {actionResult && (
              <div className="text-xs p-2 rounded-lg bg-primary/10 border border-primary/30">{actionResult}</div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setPendingChange(null)} disabled={submitting}>
                Cancelar
              </Button>
              <Button size="sm" onClick={confirmStatusChange} disabled={submitting}
                className="bg-primary text-primary-foreground">
                {submitting ? "Salvando..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="border-border bg-card/40">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-xl font-black tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
