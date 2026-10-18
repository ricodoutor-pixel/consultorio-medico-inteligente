import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Pause,
  Play,
  Send,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare,
  ShieldAlert,
  Clock,
  User,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function OrientacaoAoVivo() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [reportEditMd, setReportEditMd] = useState("");
  const [supervisorMsg, setSupervisorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const callAdmin = async (action: string, payload: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("ot-edilson-web", {
      body: { action: `admin_${action}`, ...payload },
    });
    if (error) throw error;
    return data;
  };

  const loadSessions = async () => {
    try {
      const res = await callAdmin("sessions");
      setSessions(res?.sessions || []);
      if (!selectedSession && res?.sessions?.length > 0) {
        setSelectedSession(res.sessions[0]);
      }
    } catch (e: any) {
      console.error("Erro ao carregar sessões", e);
      toast.error("Erro ao carregar sessões ativas.");
    }
  };

  const loadReports = async () => {
    try {
      const res = await callAdmin("reports");
      setReports(res?.reports || []);
    } catch (e: any) {
      console.error("Erro ao carregar relatórios", e);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const res = await callAdmin("messages", { session_id: sessionId });
      setMessages(res?.messages || []);
    } catch (e: any) {
      console.error("Erro ao carregar mensagens", e);
    }
  };

  useEffect(() => {
    loadSessions();
    loadReports();
    const interval = setInterval(() => {
      loadSessions();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSession?.id) {
      loadMessages(selectedSession.id);
      const interval = setInterval(() => {
        loadMessages(selectedSession.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedSession?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePause = async () => {
    if (!selectedSession) return;
    try {
      await callAdmin("pause", { session_id: selectedSession.id });
      toast.success("Sessão pausada. A IA foi suspensa e o paciente avisado.");
      loadSessions();
      loadMessages(selectedSession.id);
    } catch (e) {
      toast.error("Falha ao pausar sessão.");
    }
  };

  const handleResume = async () => {
    if (!selectedSession) return;
    try {
      await callAdmin("resume", { session_id: selectedSession.id });
      toast.success("Sessão retomada.");
      loadSessions();
      loadMessages(selectedSession.id);
    } catch (e) {
      toast.error("Falha ao retomar sessão.");
    }
  };

  const handleSendSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || !supervisorMsg.trim()) return;
    setSendingMsg(true);
    try {
      await callAdmin("send", {
        session_id: selectedSession.id,
        message: supervisorMsg.trim(),
      });
      setSupervisorMsg("");
      loadMessages(selectedSession.id);
      toast.success("Mensagem enviada diretamente ao paciente como Dr. Edilson.");
    } catch (e) {
      toast.error("Erro ao enviar mensagem.");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    try {
      await callAdmin("approve_report", {
        report_id: reportId,
        content_md: reportEditMd || undefined,
      });
      toast.success("Relatório aprovado e liberado para o paciente!");
      setSelectedReport(null);
      loadReports();
    } catch (e) {
      toast.error("Erro ao aprovar relatório.");
    }
  };

  const handleRejectReport = async (reportId: string) => {
    try {
      await callAdmin("reject_report", { report_id: reportId });
      toast.info("Relatório marcado como rejeitado.");
      setSelectedReport(null);
      loadReports();
    } catch (e) {
      toast.error("Erro ao rejeitar relatório.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Header do Painel */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl md:text-2xl font-black">
              Dr. Edilson Bezerra · Orientação Técnica Ao Vivo
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervisão clínica em tempo real das sessões da persona Dr. Edilson ON (CRM 10963 - Sta Cruz/BO).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { loadSessions(); loadReports(); }} className="gap-1.5 text-xs">
            <RefreshCw size={14} /> Atualizar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="text-xs">
            Voltar ao Admin
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare size={16} /> Sessões e Chat Ao Vivo ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText size={16} /> Pareceres e Relatórios ({reports.length})
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: SESSÕES E CHAT AO VIVO */}
          <TabsContent value="chat" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coluna 1: Lista de Sessões */}
            <Card className="bg-slate-900/80 border-slate-800 md:col-span-1 h-[650px] flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Sessões Recentes</span>
                  <Badge variant="outline" className="text-[10px]">{sessions.length} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 overflow-y-auto flex-1 space-y-2">
                {sessions.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">Nenhuma sessão registrada.</p>
                ) : (
                  sessions.map((s) => {
                    const isSelected = selectedSession?.id === s.id;
                    const isLive = s.status === "active";
                    const isPaused = s.status === "paused" || s.paused;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedSession(s)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-emerald-950/40 border-emerald-600/60"
                            : "bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-slate-200 truncate max-w-[150px]">
                            {s.external_reference || s.id.slice(0, 8)}
                          </span>
                          <Badge
                            className={`text-[9px] px-1.5 py-0 uppercase ${
                              isLive
                                ? "bg-emerald-500 text-emerald-950 font-black"
                                : isPaused
                                ? "bg-amber-500 text-amber-950 font-bold"
                                : s.status === "ready"
                                ? "bg-blue-500 text-blue-950 font-bold"
                                : "bg-slate-700 text-slate-300"
                            }`}
                          >
                            {s.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                          {s.triage?.queixa || "Sem queixa descrita"}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                          <span>{s.messages_count || 0} msgs</span>
                          <span>{new Date(s.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Coluna 2 e 3: Visualizador do Chat e Intervenção */}
            <Card className="bg-slate-900/80 border-slate-800 md:col-span-2 h-[650px] flex flex-col">
              {selectedSession ? (
                <>
                  <CardHeader className="py-3 px-4 border-b border-slate-800 flex flex-row items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          Sessão: {selectedSession.external_reference || selectedSession.id.slice(0, 12)}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {selectedSession.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Paciente: {selectedSession.triage?.nome || "Não informado"} · Queixa: {selectedSession.triage?.queixa || "—"}
                      </p>
                    </div>

                    {/* Botões de Pausa e Retomada */}
                    <div className="flex items-center gap-2">
                      {selectedSession.status === "active" ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handlePause}
                          className="gap-1.5 text-xs h-8 bg-amber-600 hover:bg-amber-700"
                        >
                          <Pause size={14} /> Pausar IA
                        </Button>
                      ) : selectedSession.status === "paused" ? (
                        <Button
                          size="sm"
                          onClick={handleResume}
                          className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          <Play size={14} /> Retomar IA
                        </Button>
                      ) : null}
                    </div>
                  </CardHeader>

                  {/* Histórico das Mensagens */}
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/60">
                    {messages.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-12">Nenhuma mensagem nesta sessão.</p>
                    ) : (
                      messages.map((m) => {
                        const isPatient = m.role === "patient";
                        const isAgent = m.role === "agent";
                        const isSupervisor = m.role === "supervisor";
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${
                              isPatient ? "items-start" : "items-end"
                            }`}
                          >
                            <span className="text-[10px] text-slate-500 mb-0.5 px-1 font-semibold">
                              {isPatient ? "Paciente" : isAgent ? "Dr. Edilson ON (IA)" : "Dr. Edilson (Humano / Supervisor)"} · {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                isPatient
                                  ? "bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700"
                                  : isAgent
                                  ? "bg-emerald-950/60 text-emerald-100 rounded-tr-sm border border-emerald-800/60"
                                  : "bg-blue-900/80 text-blue-100 rounded-tr-sm border border-blue-500 font-medium"
                              }`}
                            >
                              {m.content}
                              {m.attachment_name && (
                                <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[10px] flex items-center gap-1 opacity-80">
                                  📎 Anexo: {m.attachment_name}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </CardContent>

                  {/* Input de Intervenção Direta do Dr. Edilson */}
                  <form onSubmit={handleSendSupervisor} className="p-3 border-t border-slate-800 flex gap-2 bg-slate-900">
                    <Input
                      value={supervisorMsg}
                      onChange={(e) => setSupervisorMsg(e.target.value)}
                      placeholder="Intervir na conversa como Dr. Edilson Bezerra (humano)..."
                      className="text-xs bg-slate-950 border-slate-700 text-white"
                      disabled={sendingMsg}
                    />
                    <Button
                      type="submit"
                      disabled={sendingMsg || !supervisorMsg.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0"
                    >
                      <Send size={14} className="mr-1" /> Intervir
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                  Selecione uma sessão ao lado para acompanhar o atendimento.
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ABA 2: PARECERES E RELATÓRIOS PARA APROVAÇÃO */}
          <TabsContent value="reports" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/80 border-slate-800 md:col-span-1 h-[650px] flex flex-col">
              <CardHeader className="pb-3 border-b border-slate-800">
                <CardTitle className="text-sm font-bold">Relatórios Gerados</CardTitle>
              </CardHeader>
              <CardContent className="p-2 overflow-y-auto flex-1 space-y-2">
                {reports.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">Nenhum relatório emitido.</p>
                ) : (
                  reports.map((r) => {
                    const isSelected = selectedReport?.id === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => {
                          setSelectedReport(r);
                          setReportEditMd(r.content_md);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-emerald-950/40 border-emerald-600/60"
                            : "bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">
                            Relatório #{r.id.slice(0, 6)}
                          </span>
                          <Badge
                            className={`text-[9px] ${
                              r.status === "approved"
                                ? "bg-emerald-500 text-emerald-950 font-bold"
                                : "bg-amber-500 text-amber-950 font-bold"
                            }`}
                          >
                            {r.status === "approved" ? "Aprovado" : "Pendente"}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 font-mono">
                          {r.content_md.slice(0, 80)}...
                        </p>
                        <span className="text-[10px] text-slate-500 mt-2 block">
                          {new Date(r.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 md:col-span-2 h-[650px] flex flex-col">
              {selectedReport ? (
                <>
                  <CardHeader className="py-3 px-4 border-b border-slate-800 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold">
                        Revisão de Relatório · Dr. Edilson Bezerra
                      </CardTitle>
                      <p className="text-[11px] text-slate-400">
                        Status atual: <span className="font-bold text-amber-400">{selectedReport.status}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/orientacao-tecnica/relatorio/${selectedReport.id}`)}
                        className="text-xs gap-1"
                      >
                        Ver Página Pública <ArrowRight size={13} />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveReport(selectedReport.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1"
                      >
                        <CheckCircle2 size={14} /> Aprovar com Carimbo
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectReport(selectedReport.id)}
                        className="text-xs gap-1"
                      >
                        <XCircle size={14} /> Rejeitar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-4 flex flex-col">
                    <p className="text-xs text-slate-400 mb-2">
                      Edite o texto do relatório abaixo antes de aprovar, garantindo que não haja menção a receitas, medicamentos ou dosagens:
                    </p>
                    <Textarea
                      value={reportEditMd}
                      onChange={(e) => setReportEditMd(e.target.value)}
                      className="flex-1 font-mono text-xs bg-slate-950 border-slate-800 resize-none text-slate-100"
                    />
                  </CardContent>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                  Selecione um relatório ao lado para revisar e aprovar.
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
