import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, Stethoscope, FileText, Sparkles, RefreshCw, Activity, Wifi, ShieldCheck, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const POLL_MS = 10_000;
// Janela considerada "ativo agora" (5min sem heartbeat = offline)
const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

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

interface Counters {
  total: number;
  hoje: number;
  ultimos7: number;
  ultimos30: number;
}

interface RecentRow {
  id: string;
  name: string;
  contact?: string;
  created_at: string;
  source: string;
}

const emptyCounters: Counters = { total: 0, hoje: 0, ultimos7: 0, ultimos30: 0 };

export default function CadastrosRealtime() {
  const [counters, setCounters] = useState<Record<SourceKey, Counters>>(
    Object.fromEntries(SOURCES.map((s) => [s.key, emptyCounters])) as Record<SourceKey, Counters>
  );
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [live, setLive] = useState<LiveStats>(emptyLive);

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

          const c: Counters = {
            total: total.count ?? 0,
            hoje: hoje.count ?? 0,
            ultimos7: u7.count ?? 0,
            ultimos30: u30.count ?? 0,
          };

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
      results.forEach((r) => {
        nextCounters[r.key] = r.counters;
        merged.push(...r.rows);
      });
      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setCounters(nextCounters);
      setRecent(merged.slice(0, 30));

      // === Métricas AO VIVO (paralelas, head-only) ===
      const [
        docTotal, docVerified, docOnline, docAvailable,
        otPend, otPagasHoje, leadsHoje, ativos5,
        otReceitaHoje,
      ] = await Promise.all([
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }).eq("kyc_status", "approved"),
        supabase.from("doctors").select("*", { count: "exact", head: true }).eq("is_online", true),
        supabase.from("doctors").select("*", { count: "exact", head: true }).eq("is_online", true).eq("is_available", true),
        supabase.from("orientacao_tecnica_orders").select("*", { count: "exact", head: true }).eq("payment_status", "pending"),
        supabase.from("orientacao_tecnica_orders").select("*", { count: "exact", head: true }).eq("payment_status", "paid").gte("created_at", startOfDay),
        supabase.from("leads_contatos").select("*", { count: "exact", head: true }).gte("created_at", startOfDay),
        supabase.from("doctors").select("*", { count: "exact", head: true }).gte("last_seen_online", activeSince),
        supabase.from("orientacao_tecnica_orders").select("amount").eq("payment_status", "paid").gte("created_at", startOfDay),
      ]);

      const receita = (otReceitaHoje.data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);

      setLive({
        doctors_total: docTotal.count ?? 0,
        doctors_verified: docVerified.count ?? 0,
        doctors_online: docOnline.count ?? 0,
        doctors_available: docAvailable.count ?? 0,
        ot_pendentes: otPend.count ?? 0,
        ot_pagas_hoje: otPagasHoje.count ?? 0,
        receita_hoje: receita,
        leads_hoje: leadsHoje.count ?? 0,
        ativos_5min: ativos5.count ?? 0,
      });

      setUpdatedAt(new Date());
    } catch (e: any) {
      setError(e?.message ?? "Falha ao consultar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(id);
  }, [fetchAll]);

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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-foreground">
              Cadastros em Tempo Real
            </h1>
            <p className="text-sm text-muted-foreground">
              Atualiza a cada 10s • {updatedAt ? `última: ${updatedAt.toLocaleTimeString("pt-BR")}` : "carregando…"}
            </p>
          </div>
          <Button onClick={fetchAll} disabled={loading} variant="outline" size="sm" className="rounded-xl">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar agora
          </Button>
        </header>

        {error && (
          <Card className="border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </Card>
        )}

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
                  <div>
                    <div className="text-xl font-black text-foreground">{c.total}</div>
                    <div className="text-[10px] uppercase text-muted-foreground">total</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-emerald-400">{c.hoje}</div>
                    <div className="text-[10px] uppercase text-muted-foreground">hoje</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-amber-400">{c.ultimos7}</div>
                    <div className="text-[10px] uppercase text-muted-foreground">7d</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-sky-400">{c.ultimos30}</div>
                    <div className="text-[10px] uppercase text-muted-foreground">30d</div>
                  </div>
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
              <div className="p-6 text-center text-sm text-muted-foreground">
                Nenhum cadastro encontrado ainda.
              </div>
            )}
            {recent.map((r) => (
              <div key={`${r.source}-${r.id}`} className="p-3 flex items-center justify-between gap-3 hover:bg-accent/30">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-foreground truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {maskPhone(r.contact)} •{" "}
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                  {r.source}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
