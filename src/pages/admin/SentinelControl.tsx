import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Activity, AlertTriangle, FlaskConical, History, Play, Radio, Settings, Shield, ShieldAlert } from "lucide-react";
import SentinelLiveDashboard from "@/components/admin/SentinelLiveDashboard";

interface Profile {
  id: string; name: string; is_active: boolean;
  err_critical_max: number; err_total_max: number;
  queue_stuck_minutes: number; queue_stuck_max: number;
  conv_drop_ratio: number; conv_min_baseline: number;
  cron_overdue_max: number; mp_error_rate_max: number;
  notes?: string | null;
}

interface Rule {
  id: string; issue_code: string; description?: string | null;
  primary_channel: string; primary_target: string;
  secondary_channel?: string | null; secondary_target?: string | null;
  consecutive_threshold: number; cooldown_minutes: number;
  is_active: boolean; last_escalated_at?: string | null;
}

interface Run {
  id: string; ran_at: string; overall_status: "green" | "yellow" | "red";
  issues: any[]; corrections: any[]; escalations: any[];
  whatsapp_sent: boolean; duration_ms: number;
  is_simulation: boolean; triggered_by: string;
}

const statusColor = (s: string) =>
  s === "red" ? "bg-red-500/15 text-red-400 border-red-500/30"
  : s === "yellow" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
  : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";

export default function SentinelControl() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: prof }, { data: r }, { data: h }] = await Promise.all([
      supabase.from("monitoring_profiles").select("*").eq("is_active", true).maybeSingle(),
      supabase.from("sentinel_escalation_rules").select("*").order("issue_code"),
      supabase.from("manus_sentinel_runs").select("*").order("ran_at", { ascending: false }).limit(50),
    ]);
    setProfile(prof as any);
    setRules((r as any) || []);
    setRuns((h as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const saveProfile = async () => {
    if (!profile) return;
    const { error } = await supabase.from("monitoring_profiles")
      .update({
        err_critical_max: profile.err_critical_max,
        err_total_max: profile.err_total_max,
        queue_stuck_minutes: profile.queue_stuck_minutes,
        queue_stuck_max: profile.queue_stuck_max,
        conv_drop_ratio: profile.conv_drop_ratio,
        conv_min_baseline: profile.conv_min_baseline,
        cron_overdue_max: profile.cron_overdue_max,
        mp_error_rate_max: profile.mp_error_rate_max,
        notes: profile.notes,
      }).eq("id", profile.id);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Limiares salvos");
  };

  const saveRule = async (rule: Rule) => {
    const { error } = await supabase.from("sentinel_escalation_rules").update({
      primary_channel: rule.primary_channel,
      primary_target: rule.primary_target,
      secondary_channel: rule.secondary_channel || null,
      secondary_target: rule.secondary_target || null,
      consecutive_threshold: rule.consecutive_threshold,
      cooldown_minutes: rule.cooldown_minutes,
      is_active: rule.is_active,
    }).eq("id", rule.id);
    if (error) toast.error("Erro: " + error.message);
    else toast.success(`${rule.issue_code} atualizado`);
  };

  const trigger = async (dryRun: boolean) => {
    if (dryRun) setSimulating(true); else setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("manus-sentinel", {
        body: { dry_run: dryRun, triggered_by: dryRun ? "simulation" : "manual" },
      });
      if (error) throw error;
      toast.success(`${dryRun ? "Simulação" : "Execução"} concluída: ${data?.overall?.toUpperCase()} — ${data?.issues?.length || 0} issues, ${data?.escalations?.length || 0} escalonamentos`);
      load();
    } catch (e: any) {
      toast.error(`Falha: ${e?.message || e}`);
    } finally {
      setSimulating(false); setRunning(false);
    }
  };

  if (loading) return <div className="p-8 text-muted-foreground">Carregando Sentinela...</div>;

  return (
    <div className="min-h-dvh bg-background p-4 md:p-8">
      <Helmet><title>Sentinela 24x7 — Controle | Planta y Raiz</title></Helmet>

      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-emerald-400" />
            <div>
              <h1 className="text-2xl font-bold">Sentinela 24x7</h1>
              <p className="text-sm text-muted-foreground">Configuração, simulação e auditoria do watchdog</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => trigger(true)} disabled={simulating} variant="outline" className="gap-2">
              <FlaskConical className="w-4 h-4" /> {simulating ? "Simulando..." : "Simular"}
            </Button>
            <Button onClick={() => trigger(false)} disabled={running} className="gap-2">
              <Play className="w-4 h-4" /> {running ? "Executando..." : "Executar agora"}
            </Button>
          </div>
        </header>

        <Tabs defaultValue="live">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="live" className="gap-2"><Radio className="w-4 h-4" />Ao Vivo</TabsTrigger>
            <TabsTrigger value="thresholds" className="gap-2"><Settings className="w-4 h-4" />Limiares</TabsTrigger>
            <TabsTrigger value="escalation" className="gap-2"><ShieldAlert className="w-4 h-4" />Escalonamento</TabsTrigger>
            <TabsTrigger value="audit" className="gap-2"><History className="w-4 h-4" />Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-4">
            <SentinelLiveDashboard />
          </TabsContent>

          {/* THRESHOLDS */}
          <TabsContent value="thresholds" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Perfil ativo: {profile?.name || "—"}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile && (
                  <>
                    {[
                      ["err_critical_max", "Erros críticos máx. (15min)"],
                      ["err_total_max", "Erros totais máx. (15min)"],
                      ["queue_stuck_minutes", "Fila travada (min sem update)"],
                      ["queue_stuck_max", "Fila travada — qtd máx."],
                      ["conv_drop_ratio", "Razão queda conversão (0–1)"],
                      ["conv_min_baseline", "Leads mínimos p/ avaliar queda"],
                      ["cron_overdue_max", "Cron jobs atrasados máx."],
                      ["mp_error_rate_max", "MP error_rate máx. (0–1)"],
                    ].map(([key, label]) => (
                      <div key={key as string} className="space-y-2">
                        <Label>{label as string}</Label>
                        <Input type="number" step="0.01"
                          value={(profile as any)[key as string]}
                          onChange={(e) => setProfile({ ...profile, [key as string]: Number(e.target.value) } as Profile)} />
                      </div>
                    ))}
                    <div className="md:col-span-2 space-y-2">
                      <Label>Notas</Label>
                      <Input value={profile.notes || ""} onChange={(e) => setProfile({ ...profile, notes: e.target.value })} />
                    </div>
                    <div className="md:col-span-2"><Button onClick={saveProfile}>Salvar limiares</Button></div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ESCALATION */}
          <TabsContent value="escalation" className="mt-4 space-y-4">
            {rules.map((rule, idx) => (
              <Card key={rule.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="outline">{rule.issue_code}</Badge>
                      <span className="text-sm text-muted-foreground font-normal">{rule.description}</span>
                    </CardTitle>
                    <Switch checked={rule.is_active}
                      onCheckedChange={(v) => {
                        const upd = [...rules]; upd[idx] = { ...rule, is_active: v }; setRules(upd);
                      }} />
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Canal primário (Dr. Edilson)</Label>
                    <div className="flex gap-2">
                      <select className="bg-background border rounded px-2"
                        value={rule.primary_channel}
                        onChange={(e) => { const u = [...rules]; u[idx] = { ...rule, primary_channel: e.target.value }; setRules(u); }}>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                      </select>
                      <Input value={rule.primary_target}
                        onChange={(e) => { const u = [...rules]; u[idx] = { ...rule, primary_target: e.target.value }; setRules(u); }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Canal secundário (escalonamento)</Label>
                    <div className="flex gap-2">
                      <select className="bg-background border rounded px-2"
                        value={rule.secondary_channel || ""}
                        onChange={(e) => { const u = [...rules]; u[idx] = { ...rule, secondary_channel: e.target.value || null }; setRules(u); }}>
                        <option value="">— nenhum —</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                      </select>
                      <Input placeholder="número ou email" value={rule.secondary_target || ""}
                        onChange={(e) => { const u = [...rules]; u[idx] = { ...rule, secondary_target: e.target.value }; setRules(u); }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Runs consecutivos p/ escalar</Label>
                    <Input type="number" value={rule.consecutive_threshold}
                      onChange={(e) => { const u = [...rules]; u[idx] = { ...rule, consecutive_threshold: Number(e.target.value) }; setRules(u); }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cooldown (min)</Label>
                    <Input type="number" value={rule.cooldown_minutes}
                      onChange={(e) => { const u = [...rules]; u[idx] = { ...rule, cooldown_minutes: Number(e.target.value) }; setRules(u); }} />
                  </div>
                  <div className="md:col-span-2 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Última escalada: {rule.last_escalated_at ? new Date(rule.last_escalated_at).toLocaleString("pt-BR") : "—"}
                    </span>
                    <Button size="sm" onClick={() => saveRule(rule)}>Salvar regra</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* AUDIT */}
          <TabsContent value="audit" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" /> Últimas 50 execuções
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quando</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Issues</TableHead>
                        <TableHead>Correções</TableHead>
                        <TableHead>Escalações</TableHead>
                        <TableHead>WA</TableHead>
                        <TableHead>ms</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runs.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs">{new Date(r.ran_at).toLocaleString("pt-BR")}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {r.is_simulation ? "🧪 sim" : r.triggered_by || "cron"}
                            </Badge>
                          </TableCell>
                          <TableCell><Badge variant="outline" className={statusColor(r.overall_status)}>{r.overall_status}</Badge></TableCell>
                          <TableCell>
                            {(r.issues || []).length === 0 ? <span className="text-muted-foreground">—</span> :
                              <div className="flex flex-wrap gap-1">{(r.issues || []).map((i: any, k) => (
                                <Badge key={k} variant="outline" className="text-[10px]" title={i.detail}>{i.code}</Badge>
                              ))}</div>}
                          </TableCell>
                          <TableCell>
                            {(r.corrections || []).length === 0 ? <span className="text-muted-foreground">—</span> :
                              <div className="space-y-0.5">{(r.corrections || []).map((c: any, k) => (
                                <div key={k} className="text-[10px]">{c.ok ? "✅" : "❌"} {c.action}</div>
                              ))}</div>}
                          </TableCell>
                          <TableCell>
                            {(r.escalations || []).length === 0 ? <span className="text-muted-foreground">—</span> :
                              <div className="space-y-0.5">{(r.escalations || []).map((e: any, k) => (
                                <div key={k} className="text-[10px]" title={e.reason}>
                                  N{e.level} {e.channel} {e.ok ? "✅" : "❌"}
                                </div>
                              ))}</div>}
                          </TableCell>
                          <TableCell>{r.whatsapp_sent ? "✅" : "—"}</TableCell>
                          <TableCell className="text-xs">{r.duration_ms}</TableCell>
                        </TableRow>
                      ))}
                      {runs.length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          <AlertTriangle className="w-6 h-6 mx-auto mb-2" /> Nenhuma execução registrada ainda.
                        </TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
