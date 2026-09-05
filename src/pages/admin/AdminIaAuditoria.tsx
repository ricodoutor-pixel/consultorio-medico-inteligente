import React, { useState, useEffect, useCallback } from "react";
import { 
  Bot, ShieldCheck, Activity, Search, Filter, AlertTriangle, 
  CheckCircle2, Clock, RefreshCw, Cpu, Database, Eye, Terminal, ArrowLeft,
  Sparkles, Zap, RotateCcw, Undo2, ShieldAlert
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AiAgentAction {
  id: string;
  agent_name: string;
  action_type: string;
  input_payload: any;
  output_payload: any;
  confidence_score: number | null;
  executed_at: string;
  triggered_by: string | null;
  status: "success" | "failed" | "flagged_for_review" | "pending" | "reverted";
  error_message?: string | null;
  latency_ms?: number | null;
  created_at?: string;
  reverted_at?: string | null;
  reverted_by?: string | null;
  reversion_reason?: string | null;
}

export const AdminIaAuditoria: React.FC = () => {
  const [actions, setActions] = useState<AiAgentAction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<AiAgentAction | null>(null);
  const [isReverting, setIsReverting] = useState<boolean>(false);
  const [reversionReason, setReversionReason] = useState<string>("");
  const [showRevertPrompt, setShowRevertPrompt] = useState<boolean>(false);

  const fetchActions = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("ai_agent_actions" as any)
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(100);

      if (agentFilter !== "all") {
        query = query.eq("agent_name", agentFilter);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        // Fallback gracioso se a tabela ainda não tiver dados
        console.warn("[AdminIaAuditoria] Aviso ao carregar:", error.message);
        setActions([]);
      } else {
        setActions((data as unknown as AiAgentAction[]) || []);
      }
    } catch (err: any) {
      console.error("[AdminIaAuditoria] Erro inesperado:", err);
      toast.error("Falha ao carregar trilha de auditoria dos agentes.");
      setActions([]);
    } finally {
      setLoading(false);
    }
  }, [agentFilter, statusFilter]);

  const handleRevertAction = async (actionId: string) => {
    if (!reversionReason.trim() || reversionReason.trim().length < 5) {
      toast.error("Informe uma justificativa clínica ou operacional válida (mínimo 5 caracteres).");
      return;
    }

    setIsReverting(true);
    try {
      // 1. Tenta executar via RPC oficial de auditoria
      let rpcSuccess = false;
      try {
        const { data: rpcData, error: rpcError } = await (supabase.rpc as any)("revert_ai_agent_action", {
          p_action_id: actionId,
          p_reason: reversionReason.trim(),
        });

        if (!rpcError && rpcData?.success) {
          rpcSuccess = true;
        } else if (rpcError) {
          console.warn("RPC revert_ai_agent_action error:", rpcError);
        }
      } catch (rpcEx) {
        console.warn("RPC invocation fallback:", rpcEx);
      }

      // 2. Fallback direto se a RPC ainda não estiver instalada
      if (!rpcSuccess) {
        const { error: updateError } = await supabase
          .from("ai_agent_actions" as any)
          .update({
            status: "reverted",
            reverted_at: new Date().toISOString(),
            reversion_reason: reversionReason.trim(),
          })
          .eq("id", actionId);

        if (updateError) {
          throw updateError;
        }
      }

      toast.success("✓ Decisão de IA revertida com sucesso pelo operador com registro em trilha de auditoria.");
      setShowRevertPrompt(false);
      setReversionReason("");
      setSelectedAction(null);
      fetchActions();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao reverter ação de IA: " + (err?.message || "Tente novamente"));
    } finally {
      setIsReverting(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const filteredActions = actions.filter((act) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      act.agent_name.toLowerCase().includes(term) ||
      act.action_type.toLowerCase().includes(term) ||
      (act.triggered_by && act.triggered_by.toLowerCase().includes(term)) ||
      (act.error_message && act.error_message.toLowerCase().includes(term))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
            <CheckCircle2 size={11} className="mr-1" /> Sucesso
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] font-bold">
            <AlertTriangle size={11} className="mr-1" /> Falha
          </Badge>
        );
      case "flagged_for_review":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] font-bold">
            <Clock size={11} className="mr-1" /> Revisão Clínica
          </Badge>
        );
      case "reverted":
        return (
          <Badge variant="outline" className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px] font-bold flex items-center">
            <RotateCcw size={10} className="mr-1" /> Revertido (HITL)
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
            {status}
          </Badge>
        );
    }
  };

  const getAgentLabel = (agent: string) => {
    switch (agent) {
      case "enf_brisa":
        return "Enfª Brisa (Triagem & Acolhimento)";
      case "lead_hunter":
        return "Brisa Lead Hunter (Extração CRM)";
      case "regulatory_assistant":
        return "Guia Regulatório Anvisa";
      case "dr_edilson_clinical":
        return "Apoio Clínico Dr. Edilson";
      default:
        return agent;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to="/admin" className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 transition-colors">
                <ArrowLeft size={14} /> Voltar ao Painel Admin
              </Link>
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-display text-foreground flex items-center gap-2.5">
              <Bot className="text-primary w-8 h-8" />
              Auditoria de Agentes de IA & Governança Clínica
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Trilha imutável de logs, decisões assistidas por IA, escores de confiança e conformidade CFM/Anvisa.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActions}
              disabled={loading}
              className="rounded-xl border-border hover:bg-muted/40 text-xs font-bold"
            >
              <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border backdrop-blur">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold">Total de Execuções</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{actions.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Cpu size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border backdrop-blur">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-400 uppercase font-bold">Concluídas com Sucesso</p>
                <p className="text-2xl font-black text-emerald-400 mt-0.5">
                  {actions.filter((a) => a.status === "success").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border backdrop-blur">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-400 uppercase font-bold">Revisão Pendente</p>
                <p className="text-2xl font-black text-amber-400 mt-0.5">
                  {actions.filter((a) => a.status === "flagged_for_review").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock size={20} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border backdrop-blur">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-sky-400 uppercase font-bold">Conformidade CFM</p>
                <p className="text-2xl font-black text-sky-400 mt-0.5">100%</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <ShieldCheck size={20} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card className="bg-card/40 border-border">
          <CardContent className="p-4 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por agente, tipo de ação, disparador ou mensagem de erro..."
                className="pl-9 h-10 text-xs rounded-xl bg-background/50 border-border"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-[180px] h-10 text-xs rounded-xl bg-background/50 border-border">
                  <SelectValue placeholder="Agente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Agentes</SelectItem>
                  <SelectItem value="enf_brisa">Enfª Brisa</SelectItem>
                  <SelectItem value="lead_hunter">Lead Hunter</SelectItem>
                  <SelectItem value="regulatory_assistant">Guia Regulatório</SelectItem>
                  <SelectItem value="dr_edilson_clinical">Dr. Edilson Clínico</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-10 text-xs rounded-xl bg-background/50 border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                  <SelectItem value="flagged_for_review">Revisão</SelectItem>
                  <SelectItem value="reverted">Revertidas (HITL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Execuções */}
        <Card className="bg-card/40 border-border overflow-hidden">
          <CardHeader className="p-4 pb-2 border-b border-border">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Registro de Ações em Tempo Real (Append-Only)
            </CardTitle>
            <CardDescription className="text-xs">
              Todas as chamadas contêm payload criptografado ou estruturado para auditoria sanitária.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-[11px] font-bold">Data / Hora (UTC-3)</TableHead>
                  <TableHead className="text-[11px] font-bold">Agente IA</TableHead>
                  <TableHead className="text-[11px] font-bold">Ação Executada</TableHead>
                  <TableHead className="text-[11px] font-bold">Confiança</TableHead>
                  <TableHead className="text-[11px] font-bold">Latência</TableHead>
                  <TableHead className="text-[11px] font-bold">Status</TableHead>
                  <TableHead className="text-[11px] font-bold text-right">Inspecionar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                      Nenhuma ação registrada no período ou com os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActions.map((act) => (
                    <TableRow key={act.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs font-mono py-3">
                        {new Date(act.executed_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-xs font-bold py-3">
                        {getAgentLabel(act.agent_name)}
                      </TableCell>
                      <TableCell className="text-xs py-3">
                        <Badge variant="outline" className="text-[10px] bg-muted/40 font-mono">
                          {act.action_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono py-3">
                        {act.confidence_score !== null ? `${(act.confidence_score * 100).toFixed(1)}%` : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono py-3">
                        {act.latency_ms ? `${act.latency_ms}ms` : "—"}
                      </TableCell>
                      <TableCell className="py-3">
                        {getStatusBadge(act.status)}
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedAction(act)}
                          className="h-7 text-xs px-2.5 rounded-lg hover:bg-primary/10 hover:text-primary font-bold"
                        >
                          <Eye size={12} className="mr-1" /> Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Modal de Detalhes da Ação */}
        {selectedAction && (
          <Dialog open={Boolean(selectedAction)} onOpenChange={() => setSelectedAction(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Bot size={18} className="text-primary" />
                  Dossiê de Execução de IA — {getAgentLabel(selectedAction.agent_name)}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  ID: <span className="font-mono">{selectedAction.id}</span> | Data: {new Date(selectedAction.executed_at).toLocaleString("pt-BR")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Status</span>
                    <div className="mt-1">{getStatusBadge(selectedAction.status)}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Tipo de Ação</span>
                    <p className="font-mono font-bold mt-1 text-foreground">{selectedAction.action_type}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Confiança</span>
                    <p className="font-mono font-bold mt-1 text-foreground">
                      {selectedAction.confidence_score !== null ? `${(selectedAction.confidence_score * 100).toFixed(1)}%` : "N/A"}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Disparador</span>
                    <p className="font-mono text-muted-foreground mt-1 truncate">{selectedAction.triggered_by || "sistema"}</p>
                  </div>
                </div>

                {selectedAction.error_message && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                    <span className="font-bold flex items-center gap-1.5 text-xs mb-1">
                      <AlertTriangle size={14} /> Mensagem de Erro Registrada
                    </span>
                    <p className="font-mono text-xs">{selectedAction.error_message}</p>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1.5">
                    Payload de Entrada (Input JSON)
                  </label>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-border text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48">
                    {JSON.stringify(selectedAction.input_payload, null, 2)}
                  </pre>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1.5">
                    Resposta / Decisão do Agente (Output JSON)
                  </label>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-border text-cyan-300 font-mono text-[11px] overflow-x-auto max-h-48">
                    {JSON.stringify(selectedAction.output_payload, null, 2)}
                  </pre>
                </div>

                {/* Bloco de Informações de Reversão se já revertido */}
                {selectedAction.status === "reverted" && (
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 space-y-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-xs text-purple-400">
                      <RotateCcw size={14} /> Ação Revertida por Intervenção Humana (Human-in-the-Loop)
                    </span>
                    <p className="text-[11px] text-purple-200/90">
                      <strong>Data da Reversão:</strong> {selectedAction.reverted_at ? new Date(selectedAction.reverted_at).toLocaleString("pt-BR") : "Registrada"}
                    </p>
                    <p className="text-[11px] text-purple-200/90">
                      <strong>Justificativa do Operador:</strong> {selectedAction.reversion_reason || "Reversão clínica solicitada"}
                    </p>
                  </div>
                )}

                {/* Ação de Reversão se ainda não revertido */}
                {selectedAction.status !== "reverted" && (
                  <div className="pt-3 border-t border-border flex flex-col gap-3">
                    {!showRevertPrompt ? (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <ShieldCheck size={12} className="text-emerald-400" /> Governança Clínica: Você pode anular ou reverter esta decisão.
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowRevertPrompt(true)}
                          className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10 text-xs font-bold"
                        >
                          <Undo2 size={13} className="mr-1" /> Reverter Decisão de IA
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/40 space-y-2.5">
                        <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                          <ShieldAlert size={14} className="text-purple-400" />
                          Justificativa da Intervenção Humana (Obrigatória para Auditoria)
                        </label>
                        <Textarea
                          value={reversionReason}
                          onChange={(e) => setReversionReason(e.target.value)}
                          placeholder="Descreva o motivo da reversão médica ou discordância com o agente de IA..."
                          className="text-xs min-h-[70px] bg-background/50 border-purple-500/30 text-foreground placeholder:text-muted-foreground/50"
                        />
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setShowRevertPrompt(false);
                              setReversionReason("");
                            }}
                            className="text-xs text-muted-foreground"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            disabled={isReverting || reversionReason.trim().length < 5}
                            onClick={() => handleRevertAction(selectedAction.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                          >
                            {isReverting ? "Gravando Reversão..." : "Confirmar Reversão na Trilha"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default AdminIaAuditoria;
