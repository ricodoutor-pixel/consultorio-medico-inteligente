import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { 
  Users, CheckCircle2, XCircle, ShieldCheck, 
  Search, Phone, ExternalLink, RefreshCw, Stethoscope, 
  CreditCard, ShoppingBag, Gift, MessageCircle, MapPin, Calendar, 
  Activity, Clock, DollarSign, FileText, Check, Award
} from "lucide-react";
import { toast } from "sonner";
import { OnlineStatusIndicator } from "@/components/OnlineStatusIndicator";
import { CountryFlag } from "@/pages/CadastroProfissional";
import PatientKycDocViewer from "@/components/admin/PatientKycDocViewer";
import {
  PATIENT_KYC_LABELS,
  PATIENT_KYC_REQUIRED,
  type PatientKycKind,
  type PatientRecord,
  TEST_PATIENT_DATA,
} from "@/lib/patient-kyc-docs";

export const AdminAprovacoesPacientes = () => {
  const [patients, setPatients] = useState<PatientRecord[]>([TEST_PATIENT_DATA]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "apto" | "pending" | "online">("all");

  // Documento aberto no modal de visualização
  const [docView, setDocView] = useState<{
    userId: string;
    kind: PatientKycKind;
    storagePath?: string | null;
    fileUrl?: string | null;
    name?: string;
  } | null>(null);

  // Carrega pacientes do banco e mescla com o paciente de teste oficial (Edilson Bezerra da Silva)
  const fetchPatients = async () => {
    setLoading(true);
    try {
      // 1. Buscar perfis com user_type = 'patient' ou signup_role = 'paciente'
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .or("user_type.eq.patient,signup_role.eq.paciente")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("[AdminAprovacoesPacientes]", error);
      }

      // Recuperar overrides salvos no localStorage para persistência de status
      const savedOverrides: Record<string, boolean> = JSON.parse(
        localStorage.getItem("patient_approval_overrides") || "{}"
      );

      const dbPatients: PatientRecord[] = (profiles || []).map((p: any) => {
        const isApproved = savedOverrides[p.id] !== undefined ? savedOverrides[p.id] : true;
        return {
          id: p.id,
          user_id: p.id,
          full_name: p.full_name || "Paciente Cadastrado",
          cpf: p.cpf || "000.000.000-00",
          email: p.email || "paciente@email.com",
          phone: p.phone || "+55 11 99999-9999",
          date_of_birth: p.date_of_birth || "1990-01-01",
          city: p.city || "São Paulo",
          state: p.state || "SP",
          country: p.country || "BR",
          avatar_url: p.avatar_url || null,
          is_approved: isApproved,
          status: isApproved ? "apto" : "pendente",
          is_online: false,
          last_seen: p.updated_at || p.created_at || new Date().toISOString(),
          created_at: p.created_at || new Date().toISOString(),
          visit_count_day: 1,
          visit_count_week: 3,
          visit_count_month: 8,
          green_card_active: false,
          green_card_balance: 0,
          friends_referred_count: 0,
          brisa_interactions_count: 1,
          brisa_triage_completed: false,
          consultations: [],
          payments: [],
          shopping_orders: [],
          kyc_docs: [],
        };
      });

      // Inclui o paciente oficial de testes
      const testApproved =
        savedOverrides[TEST_PATIENT_DATA.id] !== undefined
          ? savedOverrides[TEST_PATIENT_DATA.id]
          : TEST_PATIENT_DATA.is_approved;

      const combined: PatientRecord[] = [
        { ...TEST_PATIENT_DATA, is_approved: testApproved, status: testApproved ? "apto" : "pendente" },
        ...dbPatients.filter((d) => d.id !== TEST_PATIENT_DATA.id),
      ];

      setPatients(combined);
    } catch (e: any) {
      toast.error("Falha ao sincronizar dados de pacientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Alterna o status de aptidão do paciente para agendamento
  const handleToggleAptitude = (patient: PatientRecord, nextState: boolean) => {
    const updated = patients.map((p) =>
      p.id === patient.id
        ? {
            ...p,
            is_approved: nextState,
            status: (nextState ? "apto" : "pendente") as "apto" | "pendente",
          }
        : p
    );
    setPatients(updated);

    try {
      const overrides: Record<string, boolean> = JSON.parse(
        localStorage.getItem("patient_approval_overrides") || "{}"
      );
      overrides[patient.id] = nextState;
      localStorage.setItem("patient_approval_overrides", JSON.stringify(overrides));
    } catch (e) {
      console.warn("Storage error", e);
    }

    if (nextState) {
      toast.success(`Paciente "${patient.full_name}" habilitado para agendamentos e teleconsultas! ✅`);
    } else {
      toast.warning(`Paciente "${patient.full_name}" colocado em análise pendente.`);
    }
  };

  const docOf = (p: PatientRecord, kind: PatientKycKind) =>
    (p.kyc_docs || []).find((k) => k.document_kind === kind) || null;

  const openDocModal = (p: PatientRecord, kind: PatientKycKind) => {
    const d = docOf(p, kind);
    setDocView({
      userId: p.user_id,
      kind,
      storagePath: d?.storage_path,
      fileUrl: d?.file_url,
      name: p.full_name,
    });
  };

  // Contadores
  const counts = useMemo(() => {
    return {
      total: patients.length,
      apto: patients.filter((p) => p.is_approved).length,
      pending: patients.filter((p) => !p.is_approved).length,
      online: patients.filter((p) => p.is_online).length,
    };
  }, [patients]);

  // Filtragem
  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch =
        p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cpf.includes(searchTerm) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm);

      if (!matchSearch) return false;

      if (statusFilter === "apto") return p.is_approved;
      if (statusFilter === "pending") return !p.is_approved;
      if (statusFilter === "online") return p.is_online;
      return true;
    });
  }, [patients, searchTerm, statusFilter]);

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 max-w-7xl">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs font-bold">
                JORNADA CLÍNICA 360° & TELEMEDICINA
              </Badge>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">Resoluções CFM 2.314/2022 & 2.454/2026</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-display font-black flex items-center gap-3">
              <Users className="text-primary w-8 h-8 md:w-10 md:h-10" />
              Controle & KYC de <span className="text-gradient-green">Pacientes e Consultas</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acompanhamento integral: solicitações de atendimento, médicos prescritores, pagamentos, Cartão Verde, compras e presença online.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchPatients}
              disabled={loading}
              className="rounded-xl border-border"
            >
              <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} /> Sincronizar
            </Button>
            <Button size="sm" className="bg-primary text-black font-bold rounded-xl" asChild>
              <a href="/consultas" target="_blank" rel="noopener noreferrer">
                <Stethoscope size={14} className="mr-1.5" /> Grade de Teleconsultas
              </a>
            </Button>
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Total Pacientes</p>
                <p className="text-2xl font-black text-foreground mt-1">{counts.total}</p>
              </div>
              <Users className="w-8 h-8 text-primary/40" />
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-400 font-bold uppercase">Aptos p/ Consulta</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{counts.apto}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-400 font-bold uppercase">Pendentes de Dados</p>
                <p className="text-2xl font-black text-amber-400 mt-1">{counts.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-500/40" />
            </CardContent>
          </Card>

          <Card className="border-emerald-500/40 bg-emerald-500/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online Agora
                </p>
                <p className="text-2xl font-black text-emerald-400 mt-1">{counts.online}</p>
              </div>
              <Activity className="w-8 h-8 text-emerald-400/50 animate-pulse" />
            </CardContent>
          </Card>
        </div>

        {/* FILTROS E BUSCA */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF, e-mail, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-muted/40 border-border rounded-xl text-sm"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1">
            {[
              { id: "all", label: "Todos os Pacientes" },
              { id: "apto", label: "✅ Aptos p/ Agendar" },
              { id: "pending", label: "⏳ Pendentes" },
              { id: "online", label: "🟢 Online Agora" },
            ].map((f) => (
              <Button
                key={f.id}
                variant={statusFilter === f.id ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(f.id as any)}
                className={`rounded-xl text-xs font-bold ${
                  statusFilter === f.id ? "bg-primary text-black" : "border-border text-muted-foreground"
                }`}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* LISTAGEM DOS PACIENTES */}
        <div className="space-y-6">
          {filtered.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/10">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-base font-bold text-foreground">Nenhum paciente encontrado</p>
              <p className="text-xs text-muted-foreground mt-1">Ajuste o termo de busca ou os filtros.</p>
            </div>
          ) : (
            filtered.map((patient) => (
              <Card
                key={patient.id}
                className={`border transition-all ${
                  patient.is_approved
                    ? "border-emerald-500/40 bg-card/90 shadow-lg shadow-emerald-950/10"
                    : "border-border bg-card/40"
                }`}
              >
                <CardContent className="p-6">
                  {/* Top Bar do Paciente com Indicador de Presença Online */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-5 border-b border-border/60">
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        {patient.avatar_url ? (
                          <img
                            src={patient.avatar_url}
                            alt={patient.full_name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/30 shadow-md bg-slate-900"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-black text-xl">
                            {patient.full_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        {/* 🟢/🔴 Bolinha de Presença Online em Tempo Real */}
                        <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full shadow-md">
                          <OnlineStatusIndicator online={patient.is_online} size="md" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg md:text-xl font-display font-black text-foreground">
                            {patient.full_name}
                          </h3>
                          {patient.id === TEST_PATIENT_DATA.id && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-bold">
                              CONTA MESTRE DE TESTES ⭐
                            </Badge>
                          )}
                          <OnlineStatusIndicator online={patient.is_online} size="sm" showLabel />
                          {patient.is_approved ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-bold">
                              APTO PARA CONSULTAS ✅
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-400 border-amber-500/40 text-[10px] font-bold">
                              PENDENTE DE VALIDAÇÃO ⏳
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          CPF: <strong className="font-mono text-foreground font-bold">{patient.cpf}</strong> · Nasc: <span className="text-slate-300">{patient.date_of_birth}</span> · E-mail: <strong className="text-foreground">{patient.email}</strong>
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1.5 text-slate-200">
                            <CountryFlag code={patient.country} className="w-4 h-3 rounded-xs" />
                            <MapPin size={12} className="text-primary" /> {patient.city} / {patient.state}
                          </span>
                          <span>·</span>
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <Activity size={12} /> Visitas: {patient.visit_count_day} hoje · {patient.visit_count_week} semana · {patient.visit_count_month} mês
                          </span>
                          <span>·</span>
                          <span className="text-sky-300">
                            Cadastrado há 25 dias
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Switch de Aptidão para Agendamento */}
                    <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-2xl border border-border w-full lg:w-auto justify-between">
                      <div className="text-left pr-2">
                        <p className="text-xs font-bold text-foreground">Apto p/ Consultas</p>
                        <p className="text-[10px] text-muted-foreground">Liberar agendamento médico</p>
                      </div>
                      <Switch
                        checked={patient.is_approved}
                        onCheckedChange={(checked) => handleToggleAptitude(patient, checked)}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </div>

                  {/* DOSSIÊ DOCUMENTAL KYC (1-CLIQUE VERDE / VERMELHO) */}
                  <div className="py-4 space-y-2 border-b border-border/40">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-primary" /> Dossiê Documental & TCLE do Paciente (1-Clique)
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        Clique para inspecionar o arquivo original
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {(Object.keys(PATIENT_KYC_LABELS) as PatientKycKind[]).map((kind) => {
                        const doc = docOf(patient, kind);
                        const hasDoc = Boolean(doc?.file_url || doc?.storage_path || patient.id === TEST_PATIENT_DATA.id);

                        return (
                          <button
                            key={kind}
                            type="button"
                            onClick={() => openDocModal(patient, kind)}
                            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all hover:scale-[1.03] ${
                              hasDoc
                                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
                                : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                            }`}
                          >
                            <div className="mb-1">
                              {hasDoc ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                            </div>
                            <span className="text-[10px] font-bold line-clamp-2 leading-tight">
                              {PATIENT_KYC_LABELS[kind]}
                            </span>
                            <span className="text-[9px] font-mono mt-0.5 opacity-80">
                              {hasDoc ? "ANEXADO (VER)" : "FALTANDO"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ABAS COM A JORNADA 360° DO PACIENTE */}
                  <div className="pt-4">
                    <Tabs defaultValue="consultas" className="w-full">
                      <TabsList className="bg-muted/40 border border-border p-1 rounded-xl w-full justify-start overflow-x-auto flex-nowrap">
                        <TabsTrigger value="consultas" className="text-xs font-bold gap-1.5">
                          <Stethoscope size={14} className="text-primary" /> Consultas Médicas ({patient.consultations.length})
                        </TabsTrigger>
                        <TabsTrigger value="financeiro" className="text-xs font-bold gap-1.5">
                          <CreditCard size={14} className="text-emerald-400" /> Histórico Financeiro ({patient.payments.length})
                        </TabsTrigger>
                        <TabsTrigger value="cartao_verde" className="text-xs font-bold gap-1.5">
                          <Award size={14} className="text-emerald-400" /> Cartão Verde
                        </TabsTrigger>
                        <TabsTrigger value="shopping" className="text-xs font-bold gap-1.5">
                          <ShoppingBag size={14} className="text-purple-400" /> Compras / Shopping ({patient.shopping_orders.length})
                        </TabsTrigger>
                        <TabsTrigger value="indicacao" className="text-xs font-bold gap-1.5">
                          <Gift size={14} className="text-amber-400" /> Indicações
                        </TabsTrigger>
                        <TabsTrigger value="brisa" className="text-xs font-bold gap-1.5">
                          <MessageCircle size={14} className="text-sky-400" /> Enf. Brisa
                        </TabsTrigger>
                      </TabsList>

                      {/* TAB 1: CONSULTAS MÉDICAS */}
                      <TabsContent value="consultas" className="pt-3">
                        {patient.consultations.length === 0 ? (
                          <div className="p-4 rounded-xl bg-muted/20 text-center text-xs text-muted-foreground">
                            Nenhuma consulta realizada até o momento.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {patient.consultations.map((c) => (
                              <div key={c.id} className="p-3 rounded-xl bg-muted/30 border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                <div className="flex items-center gap-3">
                                  {c.doctor_avatar ? (
                                    <img src={c.doctor_avatar} alt={c.doctor_name} className="w-10 h-10 rounded-full object-cover border border-primary/30" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">Dr</div>
                                  )}
                                  <div>
                                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                      {c.doctor_name} <span className="text-[10px] text-muted-foreground font-mono">({c.doctor_crm})</span>
                                    </p>
                                    <p className="text-[11px] text-primary">{c.doctor_specialty}</p>
                                    {c.notes && <p className="text-[10px] text-muted-foreground mt-0.5 italic">"{c.notes}"</p>}
                                  </div>
                                </div>

                                <div className="text-right flex items-center gap-3">
                                  <div>
                                    <p className="text-xs font-bold text-foreground">{c.date} às {c.time}</p>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px]">
                                      {c.type === "video" ? "Vídeo HD 🎥" : "Chat 💬"} · Concluída
                                    </Badge>
                                  </div>
                                  {c.prescription_issued && (
                                    <Badge className="bg-primary/20 text-primary text-[10px] font-bold">
                                      Receita Emitida 📋
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      {/* TAB 2: HISTÓRICO FINANCEIRO */}
                      <TabsContent value="financeiro" className="pt-3">
                        {patient.payments.length === 0 ? (
                          <div className="p-4 rounded-xl bg-muted/20 text-center text-xs text-muted-foreground">
                            Nenhum pagamento registrado.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {patient.payments.map((p) => (
                              <div key={p.id} className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-bold text-foreground">{p.description}</p>
                                  <p className="text-[10px] text-muted-foreground">{p.date} · Gateway: <strong className="text-slate-300">{p.gateway}</strong></p>
                                </div>
                                <div className="text-right">
                                  <p className="font-mono font-black text-emerald-400 text-sm">
                                    R$ {p.amount.toFixed(2)}
                                  </p>
                                  <Badge className="bg-emerald-500/20 text-emerald-400 text-[9px] uppercase">
                                    {p.method} · {p.status === "paid" ? "PAGO ✅" : p.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      {/* TAB 3: CARTÃO VERDE */}
                      <TabsContent value="cartao_verde" className="pt-3">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-500 text-black font-black text-xs">
                                CARTÃO VERDE PLANTA Y RAÍZ 🌿
                              </Badge>
                              <Badge className="bg-emerald-500/20 text-emerald-400 text-xs font-mono">
                                {patient.green_card_active ? "ATIVO ✅" : "INATIVO"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">
                              Nº: <strong className="text-foreground">{patient.green_card_number || "PR-CARD-2026-PENDENTE"}</strong>
                            </p>
                            <p className="text-[11px] text-slate-300">
                              Válido para compras com desconto, teleconsultas e dispensação farmacêutica internacional.
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-muted-foreground font-bold uppercase">Saldo em Conta</p>
                            <p className="text-2xl font-black text-gradient-green font-mono">
                              R$ {patient.green_card_balance.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </TabsContent>

                      {/* TAB 4: COMPRAS NO SHOPPING */}
                      <TabsContent value="shopping" className="pt-3">
                        {patient.shopping_orders.length === 0 ? (
                          <div className="p-4 rounded-xl bg-muted/20 text-center text-xs text-muted-foreground">
                            Nenhum pedido realizado no Shopping até o momento.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {patient.shopping_orders.map((ord) => (
                              <div key={ord.id} className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between text-xs">
                                <div>
                                  <p className="font-bold text-foreground">{ord.product_name} (x{ord.quantity})</p>
                                  <p className="text-[10px] text-muted-foreground">{ord.date} · Fornecedor: <strong className="text-primary">{ord.pharmacy_name}</strong></p>
                                  {ord.tracking_code && <p className="text-[9px] text-sky-400 font-mono">Rastreio: {ord.tracking_code}</p>}
                                </div>
                                <div className="text-right">
                                  <p className="font-mono font-black text-emerald-400 text-sm">
                                    R$ {ord.total.toFixed(2)}
                                  </p>
                                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[9px]">
                                    Entregue / Concluído
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      {/* TAB 5: INDICAÇÕES */}
                      <TabsContent value="indicacao" className="pt-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="p-3.5 rounded-xl bg-muted/20 border border-border">
                            <p className="text-xs text-muted-foreground font-bold uppercase">Origem da Indicação</p>
                            <p className="text-sm font-bold text-foreground mt-1">
                              {patient.referred_by_name || "Cadastro Direto (Orgânico)"}
                            </p>
                            {patient.referred_by_code && (
                              <p className="text-xs text-primary font-mono mt-0.5">Código: {patient.referred_by_code}</p>
                            )}
                          </div>

                          <div className="p-3.5 rounded-xl bg-muted/20 border border-border">
                            <p className="text-xs text-muted-foreground font-bold uppercase">Amigos Indicados pelo Paciente</p>
                            <p className="text-lg font-black text-emerald-400 mt-1">
                              {patient.friends_referred_count} amigos cadastrados
                            </p>
                            <p className="text-[10px] text-muted-foreground">Gera bônus e cashback no Cartão Verde.</p>
                          </div>
                        </div>
                      </TabsContent>

                      {/* TAB 6: ENFERMEIRA BRISA */}
                      <TabsContent value="brisa" className="pt-3">
                        <div className="p-3.5 rounded-xl bg-muted/20 border border-border flex items-center justify-between text-xs">
                          <div className="space-y-0.5">
                            <p className="font-bold text-foreground flex items-center gap-1.5">
                              <MessageCircle size={14} className="text-primary" /> Interações com Enfª Brisa (IA WhatsApp)
                            </p>
                            <p className="text-muted-foreground text-[11px]">
                              Total de dúvidas e mensagens: <strong className="text-foreground">{patient.brisa_interactions_count}</strong> · Último contato: <span className="text-slate-300">{patient.brisa_last_contact}</span>
                            </p>
                          </div>
                          <Badge className="bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                            {patient.brisa_triage_completed ? "Triagem Concluída ✅" : "Triagem Pendente"}
                          </Badge>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* AÇÕES EXTERNAS / CONTATO DIRETO */}
                  <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg border-border text-emerald-400" asChild>
                        <a
                          href={`https://wa.me/${patient.phone.replace(/\D/g, "")}?text=Olá%20${encodeURIComponent(
                            patient.full_name
                          )},%20sou%20da%20Planta%20y%20Raíz.%20Como%20podemos%20ajudar%20em%20sua%20saúde?`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Phone size={12} className="mr-1" /> WhatsApp Paciente
                        </a>
                      </Button>

                      <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg border-border" asChild>
                        <a href={`/prontuario?paciente=${patient.id}`} target="_blank" rel="noopener noreferrer">
                          <FileText size={12} className="mr-1 text-primary" /> Prontuário Eletrônico
                        </a>
                      </Button>
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      ID Paciente: <code className="text-foreground font-mono">{patient.user_id.slice(0, 8)}...</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* MODAL DE INSPEÇÃO VISUAL DE DOCUMENTOS DO PACIENTE */}
      {docView && (
        <PatientKycDocViewer
          open={Boolean(docView)}
          onClose={() => setDocView(null)}
          userId={docView.userId}
          kind={docView.kind}
          storagePath={docView.storagePath}
          fileUrl={docView.fileUrl}
          patientName={docView.name}
        />
      )}

      <Footer />
    </div>
  );
};

export default AdminAprovacoesPacientes;
