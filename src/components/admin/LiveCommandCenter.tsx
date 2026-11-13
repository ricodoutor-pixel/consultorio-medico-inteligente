import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setVisibleInterval } from "@/lib/visible-interval";
import { isPresenceHeartbeatFresh } from "@/lib/doctor-presence";
import {
  computeAlerts, formatAgo, monthlyRecurring, overallSeverity, startOfBrasiliaDay, sumMoney,
  type Alert, type LiveSnapshot, type Severity,
} from "@/lib/admin-live-metrics";
import {
  Activity, AlertTriangle, BadgeCheck, Bot, CheckCircle2, Clock, CreditCard, DollarSign, HeartPulse,
  MessageCircle, RefreshCw, ShieldAlert, Star, Stethoscope, TrendingUp, UserPlus, Users, Video, Wallet, XOctagon,
  type LucideIcon,
} from "lucide-react";

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const NUM = (n: number) => n.toLocaleString("pt-BR");
const DAY = 86_400_000;

type Val<T> = T | null; // null = fonte sem leitura (erro/permissão), nunca vira zero

interface Live {
  snap: LiveSnapshot;
  unread: string[];
  profilesTotal: Val<number>;
  profilesToday: Val<number>;
  doctorsApproved: Val<number>;
  doctorsSuspended: Val<number>;
  paidPlans: Record<string, number>;
  ratingAvg: Val<number>;
  ratingCount: Val<number>;
  aiToday: Val<number>;
  whatsIn24h: Val<number>;
  whatsOut24h: Val<number>;
  consult30dCount: Val<number>;
  ot30dCount: Val<number>;
  fetchedAt: number;
}

async function loadLive(): Promise<Live> {
  const nowMs = Date.now();
  const iso = (ms: number) => new Date(ms).toISOString();
  const d24 = iso(nowMs - DAY), d7 = iso(nowMs - 7 * DAY), d30 = iso(nowMs - 30 * DAY);
  const today = iso(startOfBrasiliaDay(nowMs));
  const unread: string[] = [];

  const q = {
    otPaid: supabase.from("orientacao_tecnica_orders").select("amount,amount_brl,platform_fee,paid_at").not("paid_at", "is", null).gte("paid_at", d30).limit(5000),
    ot24: supabase.from("orientacao_tecnica_orders").select("paid_at").gte("created_at", d24).limit(2000),
    brisa: supabase.from("brisa_orientacao_payments").select("amount,created_at").eq("status", "approved").gte("created_at", d30).limit(5000),
    consult: supabase.from("appointments").select("amount,created_at").eq("payment_status", "paid").gte("created_at", d30).limit(5000),
    live: supabase.from("appointments").select("status,created_at,updated_at").in("status", ["in_progress", "waiting"]).limit(500),
    queue: supabase.from("consultation_queue").select("created_at").eq("status", "waiting").order("created_at", { ascending: true }).limit(200),
    subs: supabase.from("medical_subscriptions").select("amount,plan_tier").eq("status", "active").limit(2000),
    doctors: supabase.from("doctors").select("is_online,last_seen_online,approval_status,is_approved_by_admin,suspended_at").limit(5000),
    inConsult: supabase.rpc("doctors_in_consultation"),
    guardian: supabase.from("consultation_guardian_events").select("severity").is("resolved_at", null).limit(500),
    notify: supabase.from("payment_notify_log").select("id", { count: "exact", head: true }).eq("status", "failed"),
    mismatch: supabase.from("audit_log").select("id", { count: "exact", head: true }).in("action", ["payment_blocked_amount_mismatch", "plan_blocked_amount_mismatch"]).gte("created_at", d7),
    errors: supabase.from("error_logs").select("severity").gte("created_at", d24).limit(2000),
    webhook: supabase.from("webhook_events").select("processed_at").order("processed_at", { ascending: false }).limit(1),
    waIn: supabase.from("whatsapp_messages").select("created_at").in("direction", ["in", "inbound"]).order("created_at", { ascending: false }).limit(1),
    waOut: supabase.from("whatsapp_messages").select("created_at").in("direction", ["out", "outbound"]).order("created_at", { ascending: false }).limit(1),
    waIn24: supabase.from("whatsapp_messages").select("id", { count: "exact", head: true }).in("direction", ["in", "inbound"]).gte("created_at", d24),
    waOut24: supabase.from("whatsapp_messages").select("id", { count: "exact", head: true }).in("direction", ["out", "outbound"]).gte("created_at", d24),
    profiles: supabase.from("profiles").select("id", { count: "exact", head: true }),
    profilesToday: supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", today),
    ratings: supabase.from("consultation_ratings").select("stars").gte("created_at", d30).limit(5000),
    ai: supabase.from("doctor_ai_usage").select("id", { count: "exact", head: true }).gte("created_at", today),
  };
  const keys = Object.keys(q) as (keyof typeof q)[];
  const settled = await Promise.allSettled(keys.map((k) => q[k] as unknown as Promise<{ data: unknown; error: unknown; count?: number | null }>));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- linhas heterogêneas de várias tabelas
  const res = {} as Record<keyof typeof q, { data: any; count: number | null } | null>;
  keys.forEach((k, i) => {
    const s = settled[i];
    if (s.status === "fulfilled" && !s.value.error) res[k] = { data: s.value.data, count: s.value.count ?? null };
    else { res[k] = null; unread.push(k); }
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- linhas heterogêneas de várias tabelas
  const rows = (k: keyof typeof q): any[] => (Array.isArray(res[k]?.data) ? res[k]!.data : []);
  const count = (k: keyof typeof q): Val<number> => (res[k] ? res[k]!.count ?? 0 : null);
  const first = (k: keyof typeof q, col: string): string | null => rows(k)[0]?.[col] ?? null;

  const doctors = rows("doctors");
  const live = rows("live");
  const waitingAppts = live.filter((a) => a.status === "waiting");
  const waitingQueue = rows("queue");
  const oldest = [...waitingAppts.map((a) => a.created_at), ...waitingQueue.map((a) => a.created_at)].sort()[0] ?? null;
  const subs = rows("subs");
  const paidPlans: Record<string, number> = {};
  for (const s of subs) paidPlans[String(s.plan_tier || "premium")] = (paidPlans[String(s.plan_tier || "premium")] ?? 0) + 1;
  const stars = rows("ratings").map((r) => Number(r.stars)).filter((n) => n > 0);
  const ot24 = rows("ot24");

  const snap: LiveSnapshot = {
    nowMs,
    otPaid: rows("otPaid").map((r) => ({ amount: Number(r.amount_brl ?? r.amount ?? 0), at: r.paid_at, platformFee: r.platform_fee })),
    brisaPaid: rows("brisa").map((r) => ({ amount: Number(r.amount ?? 0), at: r.created_at })),
    consultPaid: rows("consult").map((r) => ({ amount: Number(r.amount ?? 0), at: r.created_at })),
    activeSubscriptions: subs.map((s) => ({ amount: Number(s.amount ?? 0), planTier: String(s.plan_tier ?? "") })),
    otPending24h: ot24.filter((r) => !r.paid_at).length,
    otCreated24h: ot24.length,
    doctorsOnline: doctors.filter((d) => d.is_online && !d.suspended_at && isPresenceHeartbeatFresh(d.last_seen_online, nowMs)).length,
    doctorsInConsultation: rows("inConsult").length,
    consultationsLive: live.filter((a) => a.status === "in_progress").length,
    waitingRoom: waitingAppts.length + waitingQueue.length,
    oldestWaitingIso: oldest,
    guardianOpen: rows("guardian").map((g) => ({ severity: String(g.severity ?? "") })),
    notifyFailed: count("notify") ?? 0,
    amountMismatch7d: count("mismatch") ?? 0,
    errors24h: rows("errors").map((e) => ({ severity: String(e.severity ?? "") })),
    lastWebhookIso: first("webhook", "processed_at"),
    lastWhatsAppInIso: res.waIn ? first("waIn", "created_at") : new Date(nowMs).toISOString(), // sem leitura não dispara alerta falso
    lastWhatsAppOutIso: first("waOut", "created_at"),
    doctorsPendingApproval: doctors.filter((d) => !d.suspended_at && !d.is_approved_by_admin && d.approval_status !== "blocked").length,
  };

  return {
    snap, unread,
    profilesTotal: count("profiles"),
    profilesToday: count("profilesToday"),
    doctorsApproved: res.doctors ? doctors.filter((d) => d.is_approved_by_admin && !d.suspended_at).length : null,
    doctorsSuspended: res.doctors ? doctors.filter((d) => d.suspended_at).length : null,
    paidPlans,
    ratingAvg: res.ratings ? (stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0) : null,
    ratingCount: res.ratings ? stars.length : null,
    aiToday: count("ai"),
    whatsIn24h: count("waIn24"),
    whatsOut24h: count("waOut24"),
    consult30dCount: res.consult ? rows("consult").length : null,
    ot30dCount: res.otPaid || res.brisa ? rows("otPaid").length + rows("brisa").length : null,
    fetchedAt: nowMs,
  };
}

const SEV: Record<Severity, { label: string; icon: LucideIcon; pill: string; ring: string }> = {
  ok: { label: "Tudo operando", icon: CheckCircle2, pill: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40", ring: "border-emerald-500/30" },
  warning: { label: "Atenção", icon: AlertTriangle, pill: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40", ring: "border-amber-500/40" },
  critical: { label: "Crítico", icon: XOctagon, pill: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40", ring: "border-red-500/50" },
};

function Tile({ icon: Icon, label, value, sub, status, onClick }: {
  icon: LucideIcon; label: string; value: string; sub?: string; status?: Severity; onClick?: () => void;
}) {
  const st = status && status !== "ok" ? SEV[status] : null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`text-left rounded-2xl border bg-card/60 p-4 transition-all ${st ? st.ring : "border-border"} ${onClick ? "hover:border-primary/50 hover:bg-card cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-0">
          <Icon size={14} className="shrink-0 text-primary" /> <span className="truncate">{label}</span>
        </span>
        {st && <st.icon size={14} className={st.pill.split(" ").filter((c) => c.includes("text-")).join(" ")} />}
      </div>
      <p className="text-2xl font-black text-foreground tabular-nums leading-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1 leading-snug">{sub}</p>}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">{children}</div>
    </div>
  );
}

const PLAN_LABEL: Record<string, string> = { premium: "Premium", ouro: "Ouro", platina: "Platina", diamante: "Diamante", elite: "Elite", black: "Black" };

/** Central de Comando: todos os parâmetros operacionais reais, atualizados a cada 15 s e a cada mudança no banco. */
export function LiveCommandCenter({ refreshSignal = 0 }: { refreshSignal?: number }) {
  const navigate = useNavigate();
  const [live, setLive] = useState<Live | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setTick] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setLive(await loadLive()); } catch (e) { console.error("[LiveCommandCenter]", e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); return setVisibleInterval(() => void refresh(), 15_000); }, [refresh]);
  useEffect(() => { if (refreshSignal > 0) void refresh(); }, [refreshSignal, refresh]);
  useEffect(() => { const t = window.setInterval(() => setTick((x) => x + 1), 30_000); return () => window.clearInterval(t); }, []);

  const alerts: Alert[] = useMemo(() => (live ? computeAlerts(live.snap) : []), [live]);
  const money = useMemo(() => (live ? sumMoney(live.snap) : null), [live]);

  if (!live || !money) {
    return <div className="rounded-3xl border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">Carregando dados reais…</div>;
  }
  const s = live.snap;
  const now = Date.now();
  const sev = overallSeverity(alerts);
  const S = SEV[sev];
  const v = (n: Val<number>, f: (x: number) => string = NUM) => (n == null ? "—" : f(n));
  const mrr = monthlyRecurring(s.activeSubscriptions);
  const conv = s.otCreated24h > 0 ? Math.round(((s.otCreated24h - s.otPending24h) / s.otCreated24h) * 100) : null;
  const webhookMin = s.lastWebhookIso ? (now - new Date(s.lastWebhookIso).getTime()) / 60_000 : null;
  const plansText = Object.entries(live.paidPlans).map(([k, n]) => `${PLAN_LABEL[k] ?? k} ${n}`).join(" · ");
  const sem = (k: string) => live.unread.includes(k);

  return (
    <section className="space-y-6 mb-8">
      {/* Status geral */}
      <div className={`rounded-3xl border ${S.ring} bg-card/50 p-4 md:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-black ${S.pill}`}>
              <S.icon size={16} /> {S.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {alerts.length === 0 ? "Nenhum alerta ativo" : `${alerts.length} alerta(s)`} · atualizado {formatAgo(new Date(live.fetchedAt).toISOString(), now)} · automático a cada 15 s
            </span>
          </div>
          <button onClick={() => void refresh()} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted" disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Atualizar
          </button>
        </div>
        {alerts.length > 0 && (
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {alerts.map((a) => {
              const A = SEV[a.severity];
              return (
                <li key={a.key} className={`flex items-start gap-2 rounded-xl border p-3 ${A.pill}`}>
                  <A.icon size={16} className="mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-black">{A.label}: {a.title}</p>
                    <p className="text-xs opacity-90">{a.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {live.unread.length > 0 && (
          <p className="mt-3 text-[11px] text-muted-foreground">Sem leitura ({live.unread.length}): {live.unread.join(", ")} — esses blocos mostram "—" em vez de zero.</p>
        )}
      </div>

      <Section title="Dinheiro (somente pagamentos confirmados)">
        <Tile icon={DollarSign} label="Recebido hoje" value={BRL(money.today)} sub="Horário de Brasília" onClick={() => navigate("/admin/financeiro")} />
        <Tile icon={TrendingUp} label="Últimos 7 dias" value={BRL(money.d7)} onClick={() => navigate("/admin/financeiro")} />
        <Tile icon={Wallet} label="Últimos 30 dias" value={BRL(money.d30)} sub={`${v(live.ot30dCount)} orientações · ${v(live.consult30dCount)} consultas`} onClick={() => navigate("/admin/financeiro")} />
        <Tile icon={BadgeCheck} label="Fica com a plataforma" value={BRL(money.platform30)} sub="30 dias · Orientação + 7% das consultas" />
        <Tile icon={CreditCard} label="Assinaturas ativas" value={sem("subs") ? "—" : BRL(mrr)} sub={sem("subs") ? "sem leitura" : `${s.activeSubscriptions.length} médico(s) por mês${plansText ? ` · ${plansText}` : ""}`} />
        <Tile icon={Activity} label="Pix de Orientação 24h" value={sem("ot24") ? "—" : `${s.otCreated24h - s.otPending24h}/${s.otCreated24h}`} sub={conv == null ? "nenhum pedido em 24h" : `${conv}% pagos · ${s.otPending24h} pendente(s)`} status={alerts.some((a) => a.key === "checkout") ? "warning" : undefined} onClick={() => navigate("/admin/orientacoes")} />
      </Section>

      <Section title="Atendimento agora">
        <Tile icon={Stethoscope} label="Médicos online" value={sem("doctors") ? "—" : NUM(s.doctorsOnline)} sub="ON ligado com sinal nos últimos 2 min" status={s.waitingRoom > 0 && s.doctorsOnline === 0 ? "critical" : undefined} onClick={() => navigate("/admin/medicos-online")} />
        <Tile icon={Video} label="Em consulta" value={sem("inConsult") ? "—" : NUM(s.doctorsInConsultation)} sub={`${NUM(s.consultationsLive)} consulta(s) ao vivo`} />
        <Tile icon={Clock} label="Sala de espera" value={sem("live") && sem("queue") ? "—" : NUM(s.waitingRoom)} sub={s.oldestWaitingIso ? `mais antigo ${formatAgo(s.oldestWaitingIso, now)}` : "ninguém esperando"} status={alerts.some((a) => a.key === "long-wait") ? "warning" : undefined} />
        <Tile icon={ShieldAlert} label="Vigia de consultas" value={sem("guardian") ? "—" : NUM(s.guardianOpen.length)} sub="anomalias sem resolução" status={alerts.find((a) => a.key.startsWith("guardian"))?.severity} onClick={() => navigate("/admin/auditoria")} />
        <Tile icon={Star} label="Avaliação 30 dias" value={live.ratingAvg == null ? "—" : live.ratingCount ? `${live.ratingAvg.toFixed(1)} ★` : "sem notas"} sub={live.ratingCount == null ? "sem leitura" : `${NUM(live.ratingCount)} avaliação(ões)`} />
        <Tile icon={Bot} label="Uso de IA hoje" value={v(live.aiToday)} sub="Copiloto, Jurídico, Escriba e ferramentas" />
      </Section>

      <Section title="Pessoas">
        <Tile icon={Users} label="Cadastros" value={v(live.profilesTotal)} sub={live.profilesToday == null ? undefined : `${NUM(live.profilesToday)} novo(s) hoje`} onClick={() => navigate("/admin/cadastros")} />
        <Tile icon={HeartPulse} label="Médicos aprovados" value={v(live.doctorsApproved)} sub={live.doctorsSuspended ? `${NUM(live.doctorsSuspended)} suspenso(s)` : undefined} onClick={() => navigate("/admin/medicos")} />
        <Tile icon={UserPlus} label="Aguardando aprovação" value={sem("doctors") ? "—" : NUM(s.doctorsPendingApproval)} sub="cadastros de médicos" status={s.doctorsPendingApproval > 0 ? "warning" : undefined} onClick={() => navigate("/admin/aprovacoes-medicas")} />
        <Tile icon={MessageCircle} label="WhatsApp 24h" value={live.whatsIn24h == null ? "—" : `${NUM(live.whatsIn24h)} ↓ · ${NUM(live.whatsOut24h ?? 0)} ↑`} sub={`recebida ${formatAgo(sem("waIn") ? null : s.lastWhatsAppInIso, now)} · enviada ${formatAgo(s.lastWhatsAppOutIso, now)}`} status={alerts.some((a) => a.key === "whatsapp") ? "warning" : undefined} onClick={() => navigate("/admin/inbox")} />
        <Tile icon={CreditCard} label="Mercado Pago" value={sem("webhook") ? "—" : s.lastWebhookIso ? formatAgo(s.lastWebhookIso, now) : "nunca"} sub={webhookMin != null && webhookMin < 1440 ? "último aviso de pagamento recebido" : "sem aviso de pagamento nas últimas 24 h"} onClick={() => navigate("/admin/mp-webhooks")} />
        <Tile icon={AlertTriangle} label="Erros 24h" value={sem("errors") ? "—" : NUM(s.errors24h.length)} sub={`${NUM(s.notifyFailed)} aviso(s) de pagamento falho(s) · ${NUM(s.amountMismatch7d)} bloqueio(s) de valor`} status={alerts.find((a) => a.key === "errors" || a.key === "mismatch" || a.key === "notify")?.severity} onClick={() => navigate("/admin/monitoramento")} />
      </Section>
    </section>
  );
}
