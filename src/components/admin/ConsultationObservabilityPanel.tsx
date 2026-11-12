import type { Json } from "@/integrations/supabase/types";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Bell,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Settings,
  ShieldAlert,
  Star,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";
import {
  evaluateDoctorPresence,
  DEFAULT_QUEUE_ROUTING_CONFIG,
  type QueueRoutingConfig,
} from "@/lib/doctor-presence";
import { toast } from "sonner";

interface DoctorPresenceRow {
  id: string;
  user_id: string | null;
  crm: string | null;
  crm_state: string | null;
  specialty: string | null;
  plan_tier: string | null;
  is_online: boolean | null;
  is_available: boolean | null;
  last_seen_online: string | null;
  full_name?: string | null;
}

interface TimelineConsultation {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctorName: string;
  type: string;
  amount: number | null;
  payment_status: string | null;
  status: string | null;
  created_at: string;
  scheduled_at: string;
  notes: string | null;
  alerts: {
    event_key: string;
    channel: string;
    status: string;
    attempts: number;
    updated_at: string;
    last_error?: string | null;
  }[];
  offers: {
    id: string;
    doctor_id: string;
    doctorName: string;
    tier: string;
    attempt_order: number;
    status: string;
    offered_at: string;
    responded_at: string | null;
  }[];
  rating?: {
    score: number;
    created_at: string;
    feedback?: string | null;
  } | null;
  payoutReleased?: {
    net_amount: number;
    status: string;
    released_at: string | null;
  } | null;
  withdrawal?: {
    amount: number;
    status: string;
    created_at: string;
  } | null;
  anomalies: string[];
}

export function ConsultationObservabilityPanel() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<DoctorPresenceRow[]>([]);
  const [inConsultationIds, setInConsultationIds] = useState<Set<string>>(new Set());
  const [analyticsVisitors30m, setAnalyticsVisitors30m] = useState<number>(0);
  const [presenceLogsCount30m, setPresenceLogsCount30m] = useState<number>(0);
  const [consultations, setConsultations] = useState<TimelineConsultation[]>([]);
  const [adminAlerts, setAdminAlerts] = useState<
    { id: string; type: string; severity: "critical" | "warning"; message: string; created_at: string }[]
  >([]);
  const [queueConfig, setQueueConfig] = useState<QueueRoutingConfig>(DEFAULT_QUEUE_ROUTING_CONFIG);
  const [savingConfig, setSavingConfig] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const nowMs = Date.now();
      const thirtyMinAgoIso = new Date(nowMs - 30 * 60 * 1000).toISOString();
      const fortyFiveMinAgoIso = new Date(nowMs - 45 * 60 * 1000).toISOString();

      const [
        doctorsRes,
        publicDocsRes,
        activeApptsRes,
        recentApptsRes,
        notifyLogsRes,
        offersRes,
        npsRes,
        creditAuditRes,
        withdrawalsRes,
        auditAnomaliesRes,
        visitors30mRes,
      ] = await Promise.all([
        supabase
          .from("doctors")
          .select("id, user_id, crm, crm_state, specialty, plan_tier, is_online, is_available, last_seen_online"),
        supabase.from("doctors_public").select("id, full_name"),
        supabase
          .from("appointments")
          .select("id, doctor_id, status, scheduled_at")
          .in("status", ["in_progress", "confirmed"])
          .gte("scheduled_at", fortyFiveMinAgoIso),
        supabase
          .from("appointments")
          .select("id, patient_id, doctor_id, type, amount, payment_status, status, created_at, scheduled_at, notes")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("payment_notify_log")
          .select("external_reference, channel, status, attempts, last_attempt_at, created_at, error")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("consultation_offers")
          .select("id, appointment_id, doctor_id, tier, attempt_order, status, offered_at, responded_at")
          .order("attempt_order", { ascending: true })
          .limit(150),
        supabase
          .from("nps_responses")
          .select("consultation_id, score, feedback, created_at")
          .order("created_at", { ascending: false })
          .limit(60),
        supabase
          .from("consultation_credit_audit")
          .select("consultation_id, professional_id, amount, status, payout_status, reviewed_at, created_at")
          .order("created_at", { ascending: false })
          .limit(60),
        supabase
          .from("withdrawal_requests")
          .select("user_id, amount, status, created_at")
          .order("created_at", { ascending: false })
          .limit(40),
        supabase
          .from("audit_log")
          .select("id, action, new_data, created_at")
          .in("action", [
            "payment_anomaly_blocked",
            "doctor_presence_enter",
            "doctor_presence_heartbeat",
            "doctor_presence_exit",
            "consultation_queue_config_updated",
          ])
          .order("created_at", { ascending: false })
          .limit(80),
        (supabase as any)
          .from("analytics_events")
          .select("id", { count: "exact", head: true })
          .gte("created_at", thirtyMinAgoIso),
      ]);

      const nameByDoctorId = new Map<string, string>();
      (publicDocsRes.data || []).forEach((d: any) => {
        if (d.id && d.full_name) nameByDoctorId.set(d.id, d.full_name);
      });

      const busyIds = new Set<string>();
      (activeApptsRes.data || []).forEach((a: any) => {
        if (a.doctor_id && a.status === "in_progress") {
          busyIds.add(a.doctor_id);
        }
      });
      setInConsultationIds(busyIds);

      const docsList: DoctorPresenceRow[] = (doctorsRes.data || []).map((d: any) => ({
        ...d,
        full_name: nameByDoctorId.get(d.id) || `Médico CRM ${d.crm || "—"}`,
      }));
      setDoctors(docsList);

      // Visitantes dos últimos 30 minutos no Analytics vs batimentos de presença
      const auditRows = auditAnomaliesRes.data || [];
      const recentPresenceEvents = auditRows.filter(
        (r: any) =>
          (r.action === "doctor_presence_enter" || r.action === "doctor_presence_heartbeat") &&
          r.created_at >= thirtyMinAgoIso,
      );
      setPresenceLogsCount30m(recentPresenceEvents.length);
      setAnalyticsVisitors30m(visitors30mRes.count ?? 0);

      // Carrega configuração editável da fila se existir
      const latestConfigRow = auditRows.find((r: any) => r.action === "consultation_queue_config_updated");
      if (latestConfigRow?.new_data && typeof latestConfigRow.new_data === "object") {
        setQueueConfig({
          ...DEFAULT_QUEUE_ROUTING_CONFIG,
          ...(latestConfigRow.new_data as unknown as Partial<QueueRoutingConfig>),
        });
      }

      // Monta linha do tempo de cada consulta e alertas do administrador
      const notifyLogs = notifyLogsRes.data || [];
      const offers = offersRes.data || [];
      const npsList = npsRes.data || [];
      const credits = creditAuditRes.data || [];
      const withdrawals = withdrawalsRes.data || [];

      const computedAlerts: {
        id: string;
        type: string;
        severity: "critical" | "warning";
        message: string;
        created_at: string;
      }[] = [];

      // 1) Alertas de pagamento duplicado / médico errado / valor divergente registrados pelo mp-checkout
      auditRows
        .filter((r: any) => r.action === "payment_anomaly_blocked")
        .forEach((r: any) => {
          const det = (r.new_data || {}) as Record<string, unknown>;
          computedAlerts.push({
            id: `anom-${r.id}`,
            type: String(det.anomaly_type || "anomalia_pagamento"),
            severity: "critical",
            message: `Bloqueio automático (${det.anomaly_type || "pagamento"}): consulta ${det.appointment_id || "—"} · esperado R$ ${det.expected_price ?? "—"} / recebido R$ ${det.received_price ?? "—"}`,
            created_at: r.created_at,
          });
        });

      const timelineRows: TimelineConsultation[] = (recentApptsRes.data || []).map((a: any) => {
        const apptAlerts = notifyLogs
          .filter((l: any) => String(l.external_reference || "").includes(a.id))
          .map((l: any) => ({ event_key: l.external_reference, channel: l.channel, status: l.status, attempts: l.attempts ?? 0, updated_at: l.last_attempt_at || l.created_at, last_error: l.error }));
        const apptOffers = offers
          .filter((o: any) => o.appointment_id === a.id)
          .map((o: any) => ({
            ...o,
            doctorName: nameByDoctorId.get(o.doctor_id) || o.doctor_id.slice(0, 8),
          }));
        const rating = npsList.find((n: any) => n.consultation_id === a.id) || null;
        const creditRow: any = credits.find((c: any) => c.consultation_id === a.id) || null;
        const payoutReleased = creditRow
          ? { net_amount: Number(creditRow.amount ?? 0), status: creditRow.payout_status || creditRow.status, released_at: creditRow.reviewed_at || creditRow.created_at }
          : null;
        const doctorUserId = (doctorsRes.data || []).find((d: any) => d.id === a.doctor_id)?.user_id;
        const withdrawal = (doctorUserId && withdrawals.find((w: any) => w.user_id === doctorUserId)) || null;

        const rowAnomalies: string[] = [];

        // Aviso falhou após tentativas
        const failedAlert = apptAlerts.find((al: any) => al.status === "failed" || (al.attempts >= 3 && al.status !== "sent"));
        if (failedAlert) {
          rowAnomalies.push(`Aviso (${failedAlert.channel}) falhou após ${failedAlert.attempts} tentativa(s)`);
          computedAlerts.push({
            id: `fail-alert-${a.id}-${failedAlert.channel}`,
            type: "aviso_falhou",
            severity: "critical",
            message: `Consulta #${a.id.slice(0, 8)}: aviso via ${failedAlert.channel} falhou após ${failedAlert.attempts} tentativa(s).`,
            created_at: failedAlert.updated_at,
          });
        }

        // Nenhum médico atendeu
        const notes = a.notes || "";
        if (notes.includes("[FILA_REAGENDADA") || notes.includes("[ENCAMINHADO_OT_GRATUITA:")) {
          rowAnomalies.push("Nenhum médico atendeu na janela de 5 min");
          computedAlerts.push({
            id: `no-doc-${a.id}`,
            type: "nenhum_medico_atendeu",
            severity: "warning",
            message: `Consulta #${a.id.slice(0, 8)}: nenhum médico atendeu nos ciclos de 5 min (${
              notes.includes("[ENCAMINHADO_OT_GRATUITA:")
                ? "encaminhada à Orientação Técnica gratuita"
                : "reagendada para +1h"
            }).`,
            created_at: a.created_at,
          });
        }

        // Consulta presa em um estado (> 15 min paga e ainda sem médico/triagem ou sem avanço)
        const ageMinutes = (nowMs - new Date(a.created_at).getTime()) / 60000;
        if (
          a.payment_status === "paid" &&
          a.status !== "completed" &&
          a.status !== "in_progress" &&
          ageMinutes > 15
        ) {
          rowAnomalies.push(`Consulta presa em '${a.status}' há ${Math.round(ageMinutes)} min`);
          computedAlerts.push({
            id: `stuck-${a.id}`,
            type: "consulta_presa",
            severity: "warning",
            message: `Consulta #${a.id.slice(0, 8)} paga há ${Math.round(ageMinutes)} min permanece em estado '${a.status}'.`,
            created_at: a.created_at,
          });
        }

        return {
          id: a.id,
          patient_id: a.patient_id,
          doctor_id: a.doctor_id,
          doctorName: nameByDoctorId.get(a.doctor_id) || "Médico",
          type: a.type,
          amount: a.amount,
          payment_status: a.payment_status,
          status: a.status,
          created_at: a.created_at,
          scheduled_at: a.scheduled_at,
          notes: a.notes,
          alerts: apptAlerts,
          offers: apptOffers,
          rating,
          payoutReleased,
          withdrawal,
          anomalies: rowAnomalies,
        };
      });

      setConsultations(timelineRows);
      setAdminAlerts(computedAlerts);
    } catch (e) {
      console.error("[ConsultationObservabilityPanel]", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    const t = setInterval(loadAll, 20000);
    return () => clearInterval(t);
  }, []);

  const presenceSummary = useMemo(() => {
    const nowMs = Date.now();
    const evaluated = doctors.map((d) => ({
      ...d,
      presence: evaluateDoctorPresence(
        {
          id: d.id,
          user_id: d.user_id,
          is_online: d.is_online,
          is_available: d.is_available,
          last_seen_online: d.last_seen_online,
          in_consultation: inConsultationIds.has(d.id),
        },
        nowMs,
      ),
    }));
    return {
      evaluated,
      online: evaluated.filter((d) => d.presence.state === "online"),
      emConsulta: evaluated.filter((d) => d.presence.state === "em_consulta"),
      offline: evaluated.filter((d) => d.presence.state === "offline"),
    };
  }, [doctors, inConsultationIds]);

  const saveEditableQueueConfig = async () => {
    setSavingConfig(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      await supabase.from("audit_log").insert({
        action: "consultation_queue_config_updated",
        table_name: "consultation_queue_routing",
        record_id: "global",
        user_id: userRes.user?.id || null,
        new_data: queueConfig as unknown as Json,
      });
      toast.success("Configuração da fila de médicos salva com sucesso!");
    } catch {
      toast.error("Não foi possível salvar a configuração da fila.");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="consultation-observability-panel">
      {/* 1. TELA PRESENÇA: PLATAFORMA × ANALYTICS (Item 7) */}
      <Card className="border-emerald-500/30 bg-card/90">
        <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4 flex-wrap">
          <div>
            <Badge className="mb-1.5 bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
              Item 7 · Fonte Única de Presença Real
            </Badge>
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400" /> Presença: Plataforma × Google Analytics (últimos 30 min)
            </CardTitle>
            <CardDescription className="text-xs">
              Só conta como <strong>online</strong> na vitrine e na fila o médico logado, com a página{" "}
              <strong>Consultório Médico</strong> aberta, botão <strong>ON ativado</strong> e batimento de presença nos
              últimos 2 minutos (~30s por pulso).
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadAll()} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Atualizar agora
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
              <span className="text-[11px] font-bold uppercase text-emerald-300">
                Médicos Online (Vitrine = Fila)
              </span>
              <p className="text-2xl font-black text-emerald-400 mt-1" data-testid="presence-online-count">
                {presenceSummary.online.length}
              </p>
              <p className="text-[11px] text-muted-foreground">Logados + Consultório aberto + ON + pulso ≤ 2 min</p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
              <span className="text-[11px] font-bold uppercase text-amber-300">Médicos em Consulta</span>
              <p className="text-2xl font-black text-amber-400 mt-1" data-testid="presence-busy-count">
                {presenceSummary.emConsulta.length}
              </p>
              <p className="text-[11px] text-muted-foreground">Aparecem como "Em consulta" e não recebem novos avisos</p>
            </div>

            <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5">
              <span className="text-[11px] font-bold uppercase text-sky-300">
                Usuários Ativos (Analytics 30 min)
              </span>
              <p className="text-2xl font-black text-sky-400 mt-1" data-testid="analytics-visitors-count">
                {analyticsVisitors30m}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Pulsos médicos nos últimos 30m: {presenceLogsCount30m}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3.5">
              <span className="text-[11px] font-bold uppercase text-muted-foreground">Explicação da Diferença</span>
              <p className="text-xs text-foreground font-semibold mt-1 leading-relaxed">
                Diferença: {Math.abs(analyticsVisitors30m - presenceSummary.online.length)} visitante(s)
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                O Google Analytics soma pacientes, visitantes anônimos e médicos sem o botão ON ativo. A vitrine usa
                exclusivamente o batimento autenticado do Consultório Médico como verdade.
              </p>
            </div>
          </div>

          {/* Lista detalhada de presença por médico */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="bg-muted/40 px-3 py-2 text-xs font-bold flex items-center justify-between">
              <span>Status em Tempo Real dos Médicos Cadastrados</span>
              <span className="text-muted-foreground">Timeout automático sem batimento: 2 minutos</span>
            </div>
            <div className="divide-y divide-border max-h-56 overflow-y-auto">
              {presenceSummary.evaluated.map((doc) => (
                <div key={doc.id} className="px-3 py-2 text-xs flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        doc.presence.state === "online"
                          ? "bg-emerald-500 animate-pulse"
                          : doc.presence.state === "em_consulta"
                            ? "bg-amber-500"
                            : "bg-slate-400"
                      }`}
                    />
                    <span className="font-bold text-foreground">{doc.full_name}</span>
                    {doc.plan_tier && (
                      <Badge variant="outline" className="text-[10px]">
                        {doc.plan_tier}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>
                      Último pulso:{" "}
                      {doc.last_seen_online
                        ? new Date(doc.last_seen_online).toLocaleTimeString("pt-BR")
                        : "Sem pulso recente"}
                    </span>
                    <Badge
                      variant={
                        doc.presence.state === "online"
                          ? "default"
                          : doc.presence.state === "em_consulta"
                            ? "secondary"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {doc.presence.state === "online"
                        ? "ONLINE (Vitrine)"
                        : doc.presence.state === "em_consulta"
                          ? "EM CONSULTA"
                          : "OFFLINE"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. CONFIGURAÇÃO EDITÁVEL DA FILA DE MÉDICOS (Item 6) */}
      <Card className="border-primary/30 bg-card/90">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" /> Regras Editáveis da Fila de Médicos e Transferência (Item 6)
          </CardTitle>
          <CardDescription className="text-xs">
            Ordem: 1º Médico escolhido (5 min) → 2º Médicos assinantes ({queueConfig.subscriberTiers.join(", ")}) →
            3º Médicos online no Consultório com ON ativo → Reagendamento automático (+1h) → Orientação Técnica gratuita
            com envio do relatório ao médico escolhido.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <span className="font-bold text-muted-foreground">Ordem entre assinantes:</span>
              <select
                value={queueConfig.subscriberOrder}
                onChange={(e) =>
                  setQueueConfig((c) => ({
                    ...c,
                    subscriberOrder: e.target.value as QueueRoutingConfig["subscriberOrder"],
                  }))
                }
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 font-bold text-foreground"
              >
                <option value="priority_then_rotation">Prioridade de assinantes + Rodízio</option>
                <option value="rotation">Rodízio equilibrado</option>
                <option value="rating">Maior avaliação (nota)</option>
              </select>
            </label>
            <span className="text-muted-foreground">
              Janela por médico: <strong>{queueConfig.offerWaitSeconds / 60} min</strong> · Espera de reagendamento:{" "}
              <strong>{queueConfig.rescheduleDelayMinutes} min</strong>
            </span>
          </div>
          <Button size="sm" onClick={() => void saveEditableQueueConfig()} disabled={savingConfig}>
            {savingConfig ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Salvar configuração da fila
          </Button>
        </CardContent>
      </Card>

      {/* 3. ALERTAS DO ADMINISTRADOR (Item 8) */}
      <Card className="border-rose-500/30 bg-card/90">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-black flex items-center gap-2 text-rose-400">
            <ShieldAlert className="h-5 w-5" /> Alertas de Anomalias da Operação ({adminAlerts.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Monitoramento automático de: pagamento duplicado, médico errado, valor divergente, aviso que falhou após
            tentativas, nenhum médico atendeu e consulta presa em um estado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminAlerts.length === 0 ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Nenhuma anomalia ativa no momento. Todos os fluxos estão
              operando normalmente.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {adminAlerts.map((al) => (
                <div
                  key={al.id}
                  className={`rounded-xl border p-3 text-xs flex items-start justify-between gap-3 ${
                    al.severity === "critical"
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-200"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black uppercase text-[10px] tracking-wider block">{al.type}</span>
                      <p className="font-semibold mt-0.5">{al.message}</p>
                    </div>
                  </div>
                  <span className="text-[10px] opacity-75 shrink-0">
                    {new Date(al.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. LINHA DO TEMPO COMPLETA POR CONSULTA (Item 8) */}
      <Card className="border-border bg-card/90">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Linha do Tempo de Consultas (Observabilidade Ponta a Ponta)
          </CardTitle>
          <CardDescription className="text-xs">
            Pagamento → Triagem (5 perguntas) → Avisos (WhatsApp/E-mail + tentativas) → Transferências na Fila → Aceite
            → Sala Ao Vivo (45m) → Avaliação → Repasse Liberado → Saque.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : consultations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhuma consulta registrada ainda.</p>
          ) : (
            consultations.map((c) => {
              const hasTriage = Boolean(c.notes && c.notes.includes("Triagem:"));
              const acceptedOffer = c.offers.find((o) => o.status === "accepted");
              return (
                <div
                  key={c.id}
                  data-testid={`timeline-consultation-${c.id}`}
                  className="rounded-xl border border-border p-4 space-y-3 bg-background/50"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        #{c.id.slice(0, 8)}
                      </Badge>
                      <span className="text-xs font-black text-foreground">
                        {c.doctorName} · {c.type}
                      </span>
                      {c.amount != null && (
                        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                          R$ {Number(c.amount).toFixed(2).replace(".", ",")}
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>

                  {/* Etapas da Linha do Tempo */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-[11px]">
                    {/* 1. Pagamento */}
                    <div
                      className={`rounded-lg border p-2 ${
                        c.payment_status === "paid"
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-border bg-muted/20"
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> 1. Pagamento
                      </span>
                      <p className="text-[10px] mt-0.5 text-muted-foreground">
                        {c.payment_status === "paid" ? "Reconhecido (Pago)" : c.payment_status || "Pendente"}
                      </p>
                    </div>

                    {/* 2. Triagem */}
                    <div
                      className={`rounded-lg border p-2 ${
                        hasTriage ? "border-emerald-500/40 bg-emerald-500/10" : "border-border bg-muted/20"
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1">
                        <FileText className="h-3 w-3" /> 2. Triagem (5p)
                      </span>
                      <p className="text-[10px] mt-0.5 text-muted-foreground">
                        {hasTriage ? "Concluída" : "Aguardando"}
                      </p>
                    </div>

                    {/* 3. Avisos (WhatsApp + E-mail) */}
                    <div
                      className={`rounded-lg border p-2 ${
                        c.alerts.length > 0 ? "border-emerald-500/40 bg-emerald-500/10" : "border-border bg-muted/20"
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1">
                        <Bell className="h-3 w-3" /> 3. Avisos
                      </span>
                      <p className="text-[10px] mt-0.5 text-muted-foreground">
                        {c.alerts.length > 0
                          ? c.alerts.map((a) => `${a.channel}:${a.status}(${a.attempts}x)`).join(", ")
                          : "Nenhum disparo"}
                      </p>
                    </div>

                    {/* 4. Fila / Transferências */}
                    <div
                      className={`rounded-lg border p-2 ${
                        c.offers.length > 0 ? "border-sky-500/40 bg-sky-500/10" : "border-border bg-muted/20"
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1">
                        <ArrowRightLeft className="h-3 w-3" /> 4. Transferências
                      </span>
                      <p className="text-[10px] mt-0.5 text-muted-foreground">
                        {c.offers.length > 0 ? `${c.offers.length} médico(s) acionado(s)` : "Sem fila"}
                      </p>
                    </div>

                    {/* 5. Aceite e Sala (45m) */}
                    <div
                      className={`rounded-lg border p-2 ${
                        acceptedOffer || c.status === "in_progress" || c.status === "completed"
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-border bg-muted/20"
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1">
                        <Stethoscope className="h-3 w-3" /> 5. Sala (45m)
                      </span>
                      <p className="text-[10px] mt-0.5 text-muted-foreground">
                        {c.status === "completed"
                          ? "Encerrada"
                          : c.status === "in_progress" || acceptedOffer
                            ? "Em andamento"
                            : "Aguardando aceite"}
                      </p>
                    </div>

                    {/* 6. Avaliação */}
                    <div
                      className={`rounded-lg border p-2 ${
                        c.rating ? "border-emerald-500/40 bg-emerald-500/10" : "border-border bg-muted/20"
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1">
                        <Star className="h-3 w-3" /> 6. Avaliação
                      </span>
                      <p className="text-[10px] mt-0.5 text-muted-foreground">
                        {c.rating ? `Nota ${c.rating.score}/10` : "Pendente"}
                      </p>
                    </div>

                    {/* 7. Repasse liberado */}
                    <div
                      className={`rounded-lg border p-2 ${
                        c.payoutReleased ? "border-emerald-500/40 bg-emerald-500/10" : "border-border bg-muted/20"
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> 7. Repasse
                      </span>
                      <p className="text-[10px] mt-0.5 text-muted-foreground">
                        {c.payoutReleased
                          ? `Liberado (R$ ${Number(c.payoutReleased.net_amount).toFixed(2)})`
                          : "Aguarda avaliação"}
                      </p>
                    </div>

                    {/* 8. Saque */}
                    <div
                      className={`rounded-lg border p-2 ${
                        c.withdrawal ? "border-amber-500/40 bg-amber-500/10" : "border-border bg-muted/20"
                      }`}
                    >
                      <span className="font-bold flex items-center gap-1">
                        <Wallet className="h-3 w-3" /> 8. Saque Pix
                      </span>
                      <p className="text-[10px] mt-0.5 text-muted-foreground">
                        {c.withdrawal ? `${c.withdrawal.status} (R$ ${Number(c.withdrawal.amount).toFixed(2)})` : "Disponível"}
                      </p>
                    </div>
                  </div>

                  {/* Cadeia de acionamento da fila (se houver) */}
                  {c.offers.length > 0 && (
                    <div className="text-[11px] bg-muted/30 rounded-lg p-2.5 space-y-1">
                      <span className="font-bold text-muted-foreground block">
                        Cadeia de acionamento da fila (5 min por médico):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {c.offers.map((o) => (
                          <Badge key={o.id} variant="outline" className="text-[10px]">
                            #{o.attempt_order} {o.doctorName} ({o.tier}) → {o.status}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
export default ConsultationObservabilityPanel;
