import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  Filter,
  RefreshCw,
  ArrowLeft,
  Users,
  CheckCircle2,
  Phone,
  Calendar,
  TrendingUp,
} from "lucide-react";

/**
 * Admin · Leads
 * Lista, filtra, exporta CSV e atualiza status dos leads.
 * Mostra um mini-funil agregando funnel_events.
 */

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

type FunnelRow = { funnel: string; event_name: string; total: number };

const STATUS_OPTIONS = ["new", "contacted", "qualified", "converted", "lost"] as const;
const STATUS_LABELS: Record<string, string> = {
  new: "Novo",
  contacted: "Contatado",
  qualified: "Qualificado",
  converted: "Convertido",
  lost: "Perdido",
};
const STATUS_COLORS: Record<string, string> = {
  new: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  contacted: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  qualified: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  converted: "bg-primary/15 text-primary border-primary/30",
  lost: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

export default function AdminLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [days, setDays] = useState<number>(30);
  const [funnel, setFunnel] = useState<FunnelRow[]>([]);

  async function loadAll() {
    setLoading(true);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: leadRows }, { data: eventRows }] = await Promise.all([
      supabase
        .from("leads" as any)
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase
        .from("funnel_events" as any)
        .select("funnel, event_name")
        .gte("created_at", since)
        .limit(5000),
    ]);

    setLeads(((leadRows as any) ?? []) as Lead[]);

    // Agrupa funil em memória
    const agg = new Map<string, FunnelRow>();
    ((eventRows as any) ?? []).forEach((r: any) => {
      const key = `${r.funnel}::${r.event_name}`;
      const cur = agg.get(key) ?? { funnel: r.funnel, event_name: r.event_name, total: 0 };
      cur.total += 1;
      agg.set(key, cur);
    });
    setFunnel(Array.from(agg.values()).sort((a, b) => b.total - a.total));
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const sources = useMemo(() => {
    const s = new Set<string>();
    leads.forEach((l) => s.add(l.source));
    return Array.from(s).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (sourceFilter !== "all" && l.source !== sourceFilter) return false;
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        if (
          !l.name.toLowerCase().includes(t) &&
          !l.whatsapp.toLowerCase().includes(t) &&
          !(l.condition_interest ?? "").toLowerCase().includes(t)
        )
          return false;
      }
      return true;
    });
  }, [leads, statusFilter, sourceFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = leads.length;
    const byStatus: Record<string, number> = {};
    leads.forEach((l) => {
      byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
    });
    const converted = byStatus["converted"] ?? 0;
    const rate = total > 0 ? (converted / total) * 100 : 0;
    return { total, byStatus, conversionRate: rate };
  }, [leads]);

  async function updateStatus(id: string, status: string) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await supabase.from("leads" as any).update({ status } as any).eq("id", id);
  }

  function exportCSV() {
    const headers = [
      "id",
      "data",
      "nome",
      "whatsapp",
      "origem",
      "status",
      "score",
      "condicao",
      "metadata",
    ];
    const rows = filtered.map((l) => [
      l.id,
      new Date(l.created_at).toISOString(),
      l.name.replace(/[",\n]/g, " "),
      l.whatsapp,
      l.source,
      l.status,
      String(l.lead_score),
      (l.condition_interest ?? "").replace(/[",\n]/g, " "),
      JSON.stringify(l.metadata ?? {}).replace(/"/g, "'"),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${c}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-planta-y-raiz-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild className="rounded-xl">
              <Link to="/admin">
                <ArrowLeft size={14} className="mr-1" /> Admin
              </Link>
            </Button>
            <div>
              <h1 className="font-display font-black text-2xl md:text-3xl">CRM · Leads</h1>
              <p className="text-xs text-muted-foreground">
                Calculadora · Ebook · Origens externas
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadAll} className="rounded-xl">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
            <Button
              size="sm"
              onClick={exportCSV}
              className="rounded-xl bg-primary text-primary-foreground"
            >
              <Download size={14} className="mr-1" /> Exportar CSV ({filtered.length})
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={<Users size={16} />} label="Total" value={String(stats.total)} />
          <StatCard
            icon={<CheckCircle2 size={16} />}
            label="Convertidos"
            value={String(stats.byStatus["converted"] ?? 0)}
          />
          <StatCard
            icon={<TrendingUp size={16} />}
            label="Taxa conversão"
            value={`${stats.conversionRate.toFixed(1)}%`}
          />
          <StatCard
            icon={<Calendar size={16} />}
            label="Janela"
            value={`${days} dias`}
          />
        </div>

        {/* Funil */}
        <Card className="border-primary/20 bg-card/60 backdrop-blur-md">
          <CardContent className="p-5">
            <h2 className="font-black text-sm uppercase tracking-wider text-primary mb-3">
              Funil de conversão (últimos {days} dias)
            </h2>
            {funnel.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem eventos registrados ainda.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {funnel.map((row) => (
                  <div
                    key={`${row.funnel}-${row.event_name}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        {row.funnel === "protocol_calculator" ? "Calculadora" : "Ebook Gate"}
                      </p>
                      <p className="text-sm font-bold truncate">{row.event_name}</p>
                    </div>
                    <p className="text-lg font-black text-primary tabular-nums">{row.total}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filtros */}
        <Card className="border-border bg-card/40">
          <CardContent className="p-4 grid md:grid-cols-[1fr_180px_180px_140px] gap-3">
            <input
              type="text"
              placeholder="Buscar nome, WhatsApp ou condição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
            >
              <option value="all">Todos os status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
            >
              <option value="all">Todas origens</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-10 px-3 rounded-xl bg-background border border-border focus:border-primary focus:outline-none text-sm"
            >
              <option value={7}>7 dias</option>
              <option value={30}>30 dias</option>
              <option value={90}>90 dias</option>
              <option value={365}>1 ano</option>
            </select>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card className="border-border bg-card/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background/60 border-b border-border">
                <tr className="text-left">
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">WhatsApp</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Origem</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Condição</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground text-xs">Carregando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="p-6 text-center text-muted-foreground text-xs">Nenhum lead encontrado.</td></tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.id} className="border-b border-border/40 hover:bg-background/40">
                      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3 font-bold">{l.name}</td>
                      <td className="px-4 py-3">
                        <a href={`https://wa.me/${l.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                          <Phone size={12} /> {l.whatsapp}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{l.source}</td>
                      <td className="px-4 py-3 text-xs">{l.condition_interest ?? "—"}</td>
                      <td className="px-4 py-3 font-black text-primary tabular-nums">{l.lead_score}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${STATUS_COLORS[l.status] ?? ""}`}>
                          {STATUS_LABELS[l.status] ?? l.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={l.status}
                          onChange={(e) => updateStatus(l.id, e.target.value)}
                          className="h-8 px-2 rounded-lg bg-background border border-border text-xs"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
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
