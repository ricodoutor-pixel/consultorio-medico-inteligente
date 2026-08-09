import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, Stethoscope, FileText, Sparkles, RefreshCw, Activity, Wifi, ShieldCheck, DollarSign, ListChecks, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const POLL_MS = 10_000;
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;
const SPARK_MAX = 30; // 30 amostras = 5 minutos

type SourceKey = "profiles" | "leads_contatos" | "pacientes_leads" | "orientacao_tecnica_orders" | "doctors";

type SourceMeta = {
  key: SourceKey;
  label: string;
  icon: typeof Users;
  nameCol: string;
  contactCol?: string;
};

const SOURCES: SourceMeta[] = [
  { key: "profiles", label: "Cadastros (Auth)", icon: Users, nameCol: "full_name" },
  { key: "leads_contatos", label: "Leads (Chat/WA/IG)", icon: UserPlus, nameCol: "nome", contactCol: "telefone" },
  { key: "pacientes_leads", label: "Leads Pacientes", icon: Sparkles, nameCol: "nome", contactCol: "whatsapp" },
  { key: "orientacao_tecnica_orders", label: "Orientações Técnicas", icon: FileText, nameCol: "patient_name", contactCol: "patient_whatsapp" },
  { key: "doctors", label: "Médicos", icon: Stethoscope, nameCol: "specialty", contactCol: "crm" },
];

interface LiveStats {
  doctors_total: number;
  doctors_verified: number;
  doctors_online: number;
  doctors_available: number;
  ot_pendentes: number;
  ot_pagas_hoje: number;
  receita_hoje: number;
  leads_hoje: number;
  ativos_5min: number;
}

const emptyLive: LiveStats = {
  doctors_total: 0, doctors_verified: 0, doctors_online: 0, doctors_available: 0,
  ot_pendentes: 0, ot_pagas_hoje: 0, receita_hoje: 0, leads_hoje: 0, ativos_5min: 0,
};

interface Counters { total: number; hoje: number; ultimos7: number; ultimos30: number }
interface RecentRow { id: string; name: string; contact?: string; created_at: string; source: string }

const emptyCounters: Counters = { total: 0, hoje: 0, ultimos7: 0, ultimos30: 0 };

// === Definição da auditoria — descreve cada métrica para o painel "Auditoria" ===
const AUDIT_DEFS: Array<{
  key: keyof LiveStats;
  label: string;
  table: string;
  filters: string[];
  formula: string;
}> = [
  { key: "doctors_total", label: "Médicos Cadastrados", table: "doctors", filters: ["(sem filtro)"], formula: "COUNT(*)" },
  { key: "doctors_verified", label: "Médicos Verificados", table: "doctors", filters: ["kyc_status = 'approved'"], formula: "COUNT(*) WHERE kyc_status='approved'" },
  { key: "doctors_online", label: "Médicos Online", table: "doctors", filters: ["is_online = true"], formula: "COUNT(*) WHERE is_online=true" },
  { key: "doctors_available", label: "Disponíveis Agora", table: "doctors", filters: ["is_online = true", "is_available = true"], formula: "COUNT(*) WHERE is_online=true AND is_available=true" },
  { key: "ativos_5min", label: "Ativos (5min)", table: "doctors", filters: ["last_seen_online >= now() - 5min"], formula: "COUNT(*) WHERE last_seen_online >= now()-5min" },
  { key: "ot_pendentes", label: "OT Pendentes", table: "orientacao_tecnica_orders", filters: ["payment_status = 'pending'"], formula: "COUNT(*) WHERE payment_status='pending'" },
  { key: "ot_pagas_hoje", label: "OT Pagas Hoje", table: "orientacao_tecnica_orders", filters: ["payment_status = 'paid'", "created_at >= início do dia"], formula: "COUNT(*) WHERE payment_status='paid' AND created_at>=00:00" },
  { key: "receita_hoje", label: "Receita Hoje", table: "orientacao_tecnica_orders", filters: ["payment_status = 'paid'", "created_at >= início do dia"], formula: "SUM(amount) WHERE payment_status='paid' AND created_at>=00:00" },
  { key: "leads_hoje", label: "Leads Hoje", table: "leads_contatos", filters: ["created_at >= início do dia"], formula: "COUNT(*) WHERE created_at>=00:00" },
];

// === Mini sparkline SVG (sem libs) ===
function Sparkline({ data, color = "#34d399", height = 28 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) {
    return <div className="text-[10px] text-muted-foreground">coletando…</div>;
  }
  const w = 80;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = data[data.length - 1];
  const lastX = (data.length - 1) * stepX;
  const lastY = height - ((last - min) / range) * (height - 4) - 2;
  return (
    <svg width={w} height={height} className="block">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
      <circle cx={lastX} cy={lastY} r="2" fill={color} />
    </svg>
  );
}

export default function CadastrosRealtime() {
  const [tab, setTab] = useState<"painel" | "auditoria">("painel");
  const [counters, setCounters] = useState<Record<SourceKey, Counters>>(
    Object.fromEntries(SOURCES.map((s) => [s.key, emptyCounters])) as Record<SourceKey, Counters>
  );
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveStats>(emptyLive);

  // Histórico para sparklines
  const [history, setHistory] = useState<{
    doctors_online: number[];
    ativos_5min: number[];
    receita_hoje: number[];
  }>({ doctors_online: [], ativos_5min: [], receita_hoje: [] });

  // Auditoria: amostras dos registros que compõem cada métrica
  const [auditSamples, setAuditSamples] = useState<Record<string, any[]>>({});
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [detail, setDetail] = useState<{ source: string; row: any } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = useCallback(async (source: string, id: string) => {
    setDetail({ source, row: { id, loading: true } });
    setDetailLoading(true);
    try {
      const { data, error } = await (supabase.from(source as any) as any).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      const row: any = data ?? {};
      const extra: any = {};
      if (source === "doctors" && row.user_id) {
        const { data: prof } = await (supabase.from("profiles") as any).select("full_name,phone,cpf,country,city,avatar_url").eq("id", row.user_id).maybeSingle();
        extra.profile = prof;
        const { data: docs } = await ((supabase as any).from("doctor_documents")).select("doc_type,file_path,created_at").eq("doctor_user_id", row.user_id);
        extra.documents = docs;
      }
      setDetail({ source, row: { ...row, ...extra } });
    } catch (e: any) {
      setDetail({ source, row: { error: e?.message || String(e) } });
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const activeSince = new Date(now.getTime() - ACTIVE_WINDOW_MS).toISOString();
      const d7 = new Date(now.getTime() - 7 * 86400_000).toISOString();
      const d30 = new Date(now.getTime() - 30 * 86400_000).toISOString();

      const results = await Promise.all(
        SOURCES.map(async (src) => {
          const [total, hoje, u7, u30, recentRows] = await Promise.all([
            supabase.from(src.key).select("*", { count: "exact", head: true }),
            supabase.from(src.key).select("*", { count: "exact", head: true }).gte("created_at", startOfDay),
            supabase.from(src.key).select("*", { count: "exact", head: true }).gte("created_at", d7),
            supabase.from(src.key).select("*", { count: "exact", head: true }).gte("created_at", d30),
            supabase
              .from(src.key)
              .select(`id, created_at, ${src.nameCol}${src.contactCol ? `, ${src.contactCol}` : ""}`)
              .order("created_at", { ascending: false })
              .limit(10),
          ]);
          const c: Counters = { total: total.count ?? 0, hoje: hoje.count ?? 0, ultimos7: u7.count ?? 0, ultimos30: u30.count ?? 0 };
          const rows: RecentRow[] = (recentRows.data ?? []).map((r: any) => ({
            id: String(r.id),
            name: r[src.nameCol] ?? "—",
            contact: src.contactCol ? r[src.contactCol] : undefined,
            created_at: r.created_at,
            source: src.label,
          }));
          return { key: src.key, counters: c, rows };
        })
      );

      const nextCounters = {} as Record<SourceKey, Counters>;
      const merged: RecentRow[] = [];
      results.forEach((r) => { nextCounters[r.key] = r.counters; merged.push(...r.rows); });
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setCounters(nextCounters);
      setRecent(merged.slice(0, 30));

      const sb = supabase as any;
      const [docTotal, docVerified, docOnline, docAvailable, otPend, otPagasHoje, leadsHoje, ativos5, otReceitaHoje] = await Promise.all([
        sb.from("doctors").select("*", { count: "exact", head: true }),
        sb.from("doctors").select("*", { count: "exact", head: true }).eq("kyc_status", "approved"),
        sb.from("doctors").select("*", { count: "exact", head: true }).eq("is_online", true),
        sb.from("doctors").select("*", { count: "exact", head: true }).eq("is_online", true).eq("is_available", true),
        sb.from("orientacao_tecnica_orders").select("*", { count: "exact", head: true }).eq("payment_status", "pending"),
        sb.from("orientacao_tecnica_orders").select("*", { count: "exact", head: true }).eq("payment_status", "paid").gte("created_at", startOfDay),
        sb.from("leads_contatos").select("*", { count: "exact", head: true }).gte("created_at", startOfDay),
        sb.from("doctors").select("*", { count: "exact", head: true }).gte("last_seen_online", activeSince),
        sb.from("orientacao_tecnica_orders").select("amount").eq("payment_status", "paid").gte("created_at", startOfDay),
      ]);
      const receita = (otReceitaHoje.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);

      const nextLive: LiveStats = {
        doctors_total: docTotal.count ?? 0,
        doctors_verified: docVerified.count ?? 0,
        doctors_online: docOnline.count ?? 0,
        doctors_available: docAvailable.count ?? 0,
        ot_pendentes: otPend.count ?? 0,
        ot_pagas_hoje: otPagasHoje.count ?? 0,
        receita_hoje: receita,
        leads_hoje: leadsHoje.count ?? 0,
        ativos_5min: ativos5.count ?? 0,
      };
      setLive(nextLive);

      setHistory((h) => ({
        doctors_online: [...h.doctors_online, nextLive.doctors_online].slice(-SPARK_MAX),
        ativos_5min: [...h.ativos_5min, nextLive.ativos_5min].slice(-SPARK_MAX),
        receita_hoje: [...h.receita_hoje, nextLive.receita_hoje].slice(-SPARK_MAX),
      }));

      setUpdatedAt(new Date());
    } catch (e: any) {
      setError(e?.message ?? "Falha ao consultar");
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega amostras de cada métrica para a aba de auditoria
  const fetchAuditSamples = useCallback(async () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const activeSince = new Date(now.getTime() - ACTIVE_WINDOW_MS).toISOString();
    const sb = supabase as any;
    const queries: Array<[string, Promise<any>]> = [
      ["doctors_total", sb.from("doctors").select("id, specialty, crm, created_at").order("created_at", { ascending: false }).limit(8)],
      ["doctors_verified", sb.from("doctors").select("id, specialty, crm, kyc_status").eq("kyc_status", "approved").limit(8)],
      ["doctors_online", sb.from("doctors").select("id, specialty, is_online, last_seen_online").eq("is_online", true).limit(8)],
      ["doctors_available", sb.from("doctors").select("id, specialty, is_online, is_available").eq("is_online", true).eq("is_available", true).limit(8)],
      ["ativos_5min", sb.from("doctors").select("id, specialty, last_seen_online").gte("last_seen_online", activeSince).limit(8)],
      ["ot_pendentes", sb.from("orientacao_tecnica_orders").select("id, patient_name, amount, payment_status, created_at").eq("payment_status", "pending").order("created_at", { ascending: false }).limit(8)],
      ["ot_pagas_hoje", sb.from("orientacao_tecnica_orders").select("id, patient_name, amount, payment_status, created_at").eq("payment_status", "paid").gte("created_at", startOfDay).order("created_at", { ascending: false }).limit(8)],
      ["receita_hoje", sb.from("orientacao_tecnica_orders").select("id, patient_name, amount, created_at").eq("payment_status", "paid").gte("created_at", startOfDay).order("created_at", { ascending: false }).limit(8)],
      ["leads_hoje", sb.from("leads_contatos").select("id, nome, telefone, origem, created_at").gte("created_at", startOfDay).order("created_at", { ascending: false }).limit(8)],
    ];
    const results = await Promise.all(queries.map(([_, p]) => p));
    const map: Record<string, any[]> = {};
    queries.forEach(([k], i) => { map[k] = results[i].data ?? []; });
    setAuditSamples(map);
  }, []);

  const runCleanup = useCallback(async (dryRun: boolean) => {
    if (!dryRun && !confirm("Confirma a exclusão definitiva de TODOS os seeds de teste (nomes 'teste/qa/e2e', telefones 999998888, e-mails @example.com, CRMs 123456/000000)?")) return;
    setCleanupBusy(true);
    setCleanupResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("cleanup-test-seeds", { body: { dry_run: dryRun } });
      if (error) throw error;
      setCleanupResult(data);
      if (!dryRun) {
        await fetchAll();
        await fetchAuditSamples();
      }
    } catch (e: any) {
      setCleanupResult({ error: e?.message ?? "Falha ao executar limpeza" });
    } finally {
      setCleanupBusy(false);
    }
  }, [fetchAll, fetchAuditSamples]);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(id);
  }, [fetchAll]);

  useEffect(() => {
    if (tab === "auditoria") fetchAuditSamples();
  }, [tab, fetchAuditSamples, updatedAt]);

  const totalGeral = Object.values(counters).reduce((s, c) => s + c.total, 0);
  const hojeGeral = Object.values(counters).reduce((s, c) => s + c.hoje, 0);
  const sete = Object.values(counters).reduce((s, c) => s + c.ultimos7, 0);
  const trinta = Object.values(counters).reduce((s, c) => s + c.ultimos30, 0);

  const maskPhone = (p?: string) => {
    if (!p) return "—";
    const d = p.replace(/\D/g, "");
    if (d.length < 8) return p;
    return d.slice(0, 4) + "•••" + d.slice(-2);
  };

  return (
    <div className="min-h-dvh bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-foreground">Cadastros em Tempo Real</h1>
            <p className="text-sm text-muted-foreground">
              Atualiza a cada 10s • {updatedAt ? `última: ${updatedAt.toLocaleTimeString("pt-BR")}` : "carregando…"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-border bg-card/60 p-1">
              <button
                onClick={() => setTab("painel")}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition ${tab === "painel" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >Painel</button>
              <button
                onClick={() => setTab("auditoria")}
                className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition ${tab === "auditoria" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >Auditoria</button>
            </div>
            <Button onClick={fetchAll} disabled={loading} variant="outline" size="sm" className="rounded-xl">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
            </Button>
          </div>
        </header>

        {error && (
          <Card className="border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">{error}</Card>
        )}

        {tab === "painel" && (
          <>
            {/* Resumo geral */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Geral", value: totalGeral, accent: "text-primary" },
                { label: "Hoje", value: hojeGeral, accent: "text-emerald-400" },
                { label: "Últimos 7 dias", value: sete, accent: "text-amber-400" },
                { label: "Últimos 30 dias", value: trinta, accent: "text-sky-400" },
              ].map((s) => (
                <Card key={s.label} className="p-4 bg-card/60 border-border">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <div className={`text-3xl md:text-4xl font-black mt-1 ${s.accent}`}>{s.value}</div>
                </Card>
              ))}
            </div>

            {/* Sparklines em destaque */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: "Médicos Online", value: live.doctors_online, series: history.doctors_online, color: "#34d399", icon: Wifi, format: (v: number) => String(v) },
                { label: "Ativos (5min)", value: live.ativos_5min, series: history.ativos_5min, color: "#60a5fa", icon: Activity, format: (v: number) => String(v) },
                { label: "Receita Hoje", value: live.receita_hoje, series: history.receita_hoje, color: "#fbbf24", icon: DollarSign, format: (v: number) => `R$ ${v.toFixed(2)}` },
              ].map((s) => {
                const I = s.icon;
                return (
                  <Card key={s.label} className="p-4 bg-card/60 border-border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          <I className="h-3 w-3" /> {s.label}
                        </div>
                        <div className="text-3xl font-black mt-1" style={{ color: s.color }}>{s.format(s.value)}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          série: {s.series.length}/{SPARK_MAX} amostras
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Sparkline data={s.series} color={s.color} height={40} />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* AO VIVO 360° */}
            <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-primary/5 border-emerald-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h2 className="font-bold text-foreground">Ao Vivo • Rastreamento 360°</h2>
                <Badge variant="secondary" className="ml-auto text-[10px]">atualiza 10s</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Médicos Online", value: live.doctors_online, icon: Wifi, accent: "text-emerald-400" },
                  { label: "Disponíveis Agora", value: live.doctors_available, icon: Activity, accent: "text-emerald-300" },
                  { label: "Médicos Verificados", value: live.doctors_verified, icon: ShieldCheck, accent: "text-sky-400" },
                  { label: "Médicos Cadastrados", value: live.doctors_total, icon: Stethoscope, accent: "text-primary" },
                  { label: "Ativos (5min)", value: live.ativos_5min, icon: Activity, accent: "text-emerald-400" },
                  { label: "Leads Hoje", value: live.leads_hoje, icon: UserPlus, accent: "text-amber-400" },
                  { label: "OT Pendentes", value: live.ot_pendentes, icon: FileText, accent: "text-amber-400" },
                  { label: "OT Pagas Hoje", value: live.ot_pagas_hoje, icon: FileText, accent: "text-emerald-400" },
                  { label: "Receita Hoje", value: `R$ ${live.receita_hoje.toFixed(2)}`, icon: DollarSign, accent: "text-emerald-400" },
                ].map((s) => {
                  const I = s.icon;
                  return (
                    <div key={s.label} className="p-3 rounded-lg bg-card/60 border border-border">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <I className="h-3 w-3" /> {s.label}
                      </div>
                      <div className={`text-2xl font-black mt-1 ${s.accent}`}>{s.value}</div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Detalhamento por fonte */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SOURCES.map((src) => {
                const Icon = src.icon;
                const c = counters[src.key];
                return (
                  <Card key={src.key} className="p-4 bg-card/60 border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <div className="font-bold text-foreground">{src.label}</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div><div className="text-xl font-black text-foreground">{c.total}</div><div className="text-[10px] uppercase text-muted-foreground">total</div></div>
                      <div><div className="text-xl font-black text-emerald-400">{c.hoje}</div><div className="text-[10px] uppercase text-muted-foreground">hoje</div></div>
                      <div><div className="text-xl font-black text-amber-400">{c.ultimos7}</div><div className="text-[10px] uppercase text-muted-foreground">7d</div></div>
                      <div><div className="text-xl font-black text-sky-400">{c.ultimos30}</div><div className="text-[10px] uppercase text-muted-foreground">30d</div></div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Lista de últimos cadastros */}
            <Card className="bg-card/60 border-border">
              <div className="p-4 border-b border-border">
                <h2 className="font-bold text-foreground">Últimos cadastros (todas as fontes)</h2>
              </div>
              <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                {recent.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">Nenhum cadastro encontrado ainda.</div>
                )}
                {recent.map((r) => (
                  <button
                    type="button"
                    key={`${r.source}-${r.id}`}
                    onClick={() => openDetail(r.source, r.id)}
                    className="w-full p-3 flex items-center justify-between gap-3 hover:bg-accent/30 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground truncate">{r.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {maskPhone(r.contact)} • {new Date(r.created_at).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] whitespace-nowrap">{r.source}</Badge>
                  </button>
                ))}
              </div>
            </Card>
          </>
        )}

        {tab === "auditoria" && (
          <>
            <Card className="p-4 bg-card/60 border-border">
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-foreground">Auditoria das métricas "Ao Vivo"</h2>
                <Badge variant="secondary" className="ml-auto text-[10px]">cron diário 04h UTC</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Cada métrica mostra a tabela consultada, filtros aplicados, fórmula e amostra dos registros que compõem o total.
                Limpeza automática de seeds de teste roda diariamente; você também pode rodar agora.
              </p>
              <div className="flex gap-2 mt-3">
                <Button onClick={() => runCleanup(true)} disabled={cleanupBusy} variant="outline" size="sm" className="rounded-xl">
                  <RefreshCw className={`mr-2 h-4 w-4 ${cleanupBusy ? "animate-spin" : ""}`} /> Simular (dry-run)
                </Button>
                <Button onClick={() => runCleanup(false)} disabled={cleanupBusy} variant="destructive" size="sm" className="rounded-xl">
                  <Trash2 className="mr-2 h-4 w-4" /> Limpar seeds de teste agora
                </Button>
              </div>
              {cleanupResult && (
                <pre className="mt-3 max-h-64 overflow-auto text-[10px] p-3 bg-black/40 rounded-lg border border-border text-emerald-300">
                  {JSON.stringify(cleanupResult, null, 2)}
                </pre>
              )}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AUDIT_DEFS.map((d) => {
                const value = live[d.key];
                const samples = auditSamples[d.key] ?? [];
                return (
                  <Card key={d.key} className="p-4 bg-card/60 border-border">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="font-bold text-foreground">{d.label}</div>
                      <div className="text-xl font-black text-primary">
                        {d.key === "receita_hoje" ? `R$ ${(value as number).toFixed(2)}` : value}
                      </div>
                    </div>
                    <div className="text-[11px] space-y-1 mb-2">
                      <div><span className="text-muted-foreground">tabela:</span> <code className="text-amber-300">{d.table}</code></div>
                      <div><span className="text-muted-foreground">filtros:</span> {d.filters.map((f, i) => (
                        <code key={i} className="text-sky-300 mr-1">{f}</code>
                      ))}</div>
                      <div><span className="text-muted-foreground">fórmula:</span> <code className="text-emerald-300">{d.formula}</code></div>
                    </div>
                    <div className="border-t border-border pt-2">
                      <div className="text-[10px] uppercase text-muted-foreground mb-1">amostra ({samples.length})</div>
                      {samples.length === 0 ? (
                        <div className="text-xs text-muted-foreground italic">nenhum registro</div>
                      ) : (
                        <div className="max-h-48 overflow-auto">
                          <table className="w-full text-[11px]">
                            <tbody>
                              {samples.map((row, i) => (
                                <tr key={i} className="border-b border-border/40">
                                  {Object.entries(row).slice(0, 4).map(([k, v]) => (
                                    <td key={k} className="py-1 pr-2 align-top">
                                      <span className="text-muted-foreground">{k}:</span>{" "}
                                      <span className="text-foreground">{String(v ?? "—").slice(0, 40)}</span>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes • <span className="text-primary">{detail?.source}</span>
            </DialogTitle>
          </DialogHeader>
          {detailLoading && <div className="text-sm text-muted-foreground">Carregando…</div>}
          {detail?.row?.error && <div className="text-sm text-destructive">{detail.row.error}</div>}
          {detail?.row && !detail.row.error && (
            <div className="space-y-3">
              {detail.row.profile?.avatar_url && (
                <img src={detail.row.profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover border border-border" />
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {Object.entries(detail.row)
                  .filter(([k]) => !["profile", "documents", "loading"].includes(k))
                  .map(([k, v]) => (
                    <div key={k} className="p-2 rounded bg-muted/30 border border-border">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
                      <div className="font-mono text-xs break-all text-foreground">
                        {v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </div>
                    </div>
                  ))}
              </div>
              {detail.row.profile && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/30">
                  <div className="font-bold text-sm mb-2 text-primary">Perfil vinculado</div>
                  <pre className="text-[11px] whitespace-pre-wrap break-all">{JSON.stringify(detail.row.profile, null, 2)}</pre>
                </div>
              )}
              {detail.row.documents && (
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/30">
                  <div className="font-bold text-sm mb-2 text-amber-400">Documentos KYC ({detail.row.documents.length})</div>
                  <pre className="text-[11px] whitespace-pre-wrap break-all">{JSON.stringify(detail.row.documents, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
