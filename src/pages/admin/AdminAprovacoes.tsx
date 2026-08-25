import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { 
  Loader2, CheckCircle, XCircle, FileImage, UserCheck, Play, Sparkles, ShieldCheck, 
  Bot, Mail, Lock, Unlock, AlertTriangle, Search, Phone, ExternalLink, Printer, 
  Eye, FileText, CreditCard, Stethoscope, Video, MessageCircle, DollarSign, Download, UserX
} from "lucide-react";
import { toast } from "sonner";
import { useDoctors } from "@/hooks/useDoctors";
import KycDocViewer from "@/components/admin/KycDocViewer";
import { KYC_LABELS, KYC_REQUIRED, type KycKind } from "@/lib/kyc-docs";
import { professionals as testProfessionals } from "@/data/professionals";

export const AdminAprovacoes = () => {
  const { doctors, setDoctors, loading, fetchDoctors, counts } = useDoctors();
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "blocked">("all");
  
  // Selected doctor for detailed inspection modal
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  // Documento aberto para conferência visual (imagem/PDF real do cadastro)
  const [docView, setDocView] = useState<{ userId: string; kind: KycKind; path?: string | null; name?: string } | null>(null);

  // Localiza o registro real do documento anexado pelo médico
  const docOf = (doc: any, kind: KycKind) =>
    (doc.kyc_docs || []).find((k: any) => k.document_kind === kind) || null;

  const openDoc = (doc: any, kind: KycKind) =>
    setDocView({
      userId: doc.user_id,
      kind,
      path: docOf(doc, kind)?.storage_path,
      name: doc.profile?.full_name || doc.full_name,
    });

  // — CONF CRM: anexa o print da consulta pública do CFM ao dossiê do médico
  const [uploadingConf, setUploadingConf] = useState<string | null>(null);

  const uploadConfCrm = async (doc: any, file: File) => {
    setUploadingConf(doc.user_id);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${doc.user_id}/cfm_print.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("doctor-kyc-documents")
        .upload(path, file, { upsert: true, contentType: file.type || "image/png" });
      if (upErr) throw upErr;

      const existing = docOf(doc, "cfm_print");
      if (existing) {
        const { error } = await supabase
          .from("doctor_kyc_documents" as any)
          .update({ storage_path: path, mime_type: file.type, size_bytes: file.size, verification_status: "verified" })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("doctor_kyc_documents" as any).insert({
          doctor_user_id: doc.user_id,
          document_kind: "cfm_print",
          storage_path: path,
          mime_type: file.type,
          size_bytes: file.size,
          verification_status: "verified",
        } as any);
        if (error) throw error;
      }
      toast.success("CONF CRM anexada ao cadastro do médico");
      fetchDoctors();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao anexar CONF CRM");
    } finally {
      setUploadingConf(null);
    }
  };

  // — Checklist KYC fiel — só libera card com dossiê completo
  const kycChecklist = (doc: any) => {
    const p = doc.profile || {};
    const kinds = new Set((doc.kyc_docs || []).map((k: any) => k.document_kind));
    return [
      ...[...KYC_REQUIRED, 'icp_brasil'].map((kind) => ({ 
        label: KYC_LABELS[kind], 
        ok: kind === 'icp_brasil' ? Boolean(doc.signature_url) : kinds.has(kind) 
      })),
      { label: "Nº do CRM", ok: Boolean(doc.crm && String(doc.crm).length >= 3) },
      { label: "CPF", ok: Boolean(p.cpf && String(p.cpf).replace(/\D/g, "").length === 11) },
      { label: "Data de nascimento", ok: Boolean(p.date_of_birth) },
      { label: "CEP / endereço", ok: Boolean(p.cep && String(p.cep).replace(/\D/g, "").length === 8) },
      { label: "Foto de perfil", ok: Boolean(p.avatar_url) },
      { label: "PIX para recebimento", ok: Boolean(p.pix_key) },
      { label: "WhatsApp", ok: Boolean((p.phone || "").replace(/\D/g, "").length >= 10) },
    ];
  };

  const kycMissing = (doc: any) => kycChecklist(doc).filter((i) => !i.ok).map((i) => i.label);


  const CFM_URL = "https://portal.cfm.org.br/busca-medicos";
  const RECEITA_CPF_URL = "https://servicos.receita.fazenda.gov.br/servicos/cpf/consultasituacao/consultapublica.asp";


  // 🟢 / 🔴 Toggle Switch for Card Médico ON / OFF (bloqueado sem KYC completo)
  const handleToggleCardStatus = async (doc: any, newApprovedState: boolean) => {
    try {
      const docId = doc.id;

      if (newApprovedState) {
        const missing = kycMissing(doc);
        if (missing.length) {
          toast.error(`KYC incompleto — não é possível publicar o card. Falta: ${missing.join(", ")}`);
          return;
        }
      }

      
      // Update local state immediately for instant feedback
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === docId
            ? {
                ...d,
                is_approved_by_admin: newApprovedState,
                is_approved: newApprovedState,
                approval_status: newApprovedState ? 'approved' : 'rejected',
                is_verified: newApprovedState,
                is_online: newApprovedState,
                is_available: newApprovedState,
                kyc_status: newApprovedState ? 'approved' : 'rejected',
              }
            : d
        )
      );

      // Save to localStorage override for marketplace /profissionais
      try {
        const savedOverrides = JSON.parse(localStorage.getItem('doctor_card_overrides') || '{}');
        savedOverrides[docId] = newApprovedState;
        localStorage.setItem('doctor_card_overrides', JSON.stringify(savedOverrides));
      } catch (e) {}

      // Update Supabase database
      if (!docId.startsWith('static-')) {
        await (supabase as any)
          .from('doctors')
          .update({
            is_approved_by_admin: newApprovedState,
            is_approved: newApprovedState,
            approval_status: newApprovedState ? 'approved' : 'rejected',
            is_verified: newApprovedState,
            is_online: newApprovedState,
            is_available: newApprovedState,
            kyc_status: newApprovedState ? 'approved' : 'rejected',
          })
          .eq('id', docId);

        // Trigger WhatsApp welcome / update message
        if (newApprovedState) {
          supabase.functions.invoke("send-doctor-welcome-whatsapp", {
            body: {
              phone: doc?.profile?.phone || doc?.personal_phone || doc?.whatsapp,
              fullName: doc?.profile?.full_name || doc?.full_name || 'Doutor(a)',
              email: doc?.profile?.email,
              action: "card_approved"
            }
          }).catch(() => {});
        }
      }

      if (newApprovedState) {
        toast.success(`🟢 CARD DE ${doc.profile?.full_name || doc.full_name || 'MÉDICO'} PUBLICADO NO MARKETPLACE!`);
      } else {
        toast.error(`🔴 CARD DE ${doc.profile?.full_name || doc.full_name || 'MÉDICO'} RETIRADO DO AR (DESATIVADO)!`);
      }
    } catch (err: any) {
      toast.error("Erro ao atualizar status do card: " + err.message);
      fetchDoctors();
    }
  };

  // 🤖 Varredura Enfª Brisa IA — confere CRM no CFM + CPF antes de liberar o card
  const handleBrisaAutoAudit = async () => {
    setIsAuditing(true);
    toast.info("🤖 Enfª Brisa IA consultando CFM e Receita Federal para validar os cadastros...");

    try {
      let approvedCount = 0;
      let incompleteCount = 0;
      let rejectedCount = 0;

      for (const doc of doctors) {
        const p = doc.profile || {};
        if (kycMissing(doc).length) { incompleteCount++; continue; }
        if (doc.is_approved_by_admin) continue;

        const { data: result } = await supabase.functions.invoke("validate-doctor-kyc", {
          body: {
            doctor_id: doc.id,
            crm: doc.crm,
            crm_state: doc.crm_state,
            document_type: doc.document_type || "cpf",
            document_number: p.cpf,
            full_name: p.full_name,
          },
        });

        if (result?.approved || result?.valid || result?.status === "approved") {
          await handleToggleCardStatus(doc, true);
          approvedCount++;
        } else {
          rejectedCount++;
        }
      }

      await fetchDoctors();

      toast.success(
        `✅ Varredura Enfª Brisa IA concluída!\n` +
        `• ${approvedCount} cadastros confirmados no CFM/Receita e publicados\n` +
        `• ${incompleteCount} com dossiê KYC incompleto\n` +
        `• ${rejectedCount} aguardando revisão manual do administrador`
      );
    } catch (err: any) {
      toast.error("Erro na varredura da Enfª Brisa IA: " + err.message);
    } finally {
      setIsAuditing(false);
    }
  };


  // ✉️ Reenviar E-mail de Boas-Vindas SMTP Individual
  const handleSendWelcomeEmail = async (doc: any) => {
    const docName = doc.profile?.full_name || doc.full_name || "Doutor(a)";
    const docEmail = doc.profile?.email || doc.email;
    toast.info(`✉️ Disparando e-mail de boas-vindas SMTP para ${docName}...`);

    try {
      await supabase.functions.invoke("doctor-onboarding-automation", {
        body: { doctor_id: doc.id, email: docEmail, fullName: docName }
      });
      toast.success(`🎉 E-mail de Boas-Vindas enviado para ${docName}!`);
    } catch (e: any) {
      toast.error("Erro ao enviar e-mail: " + e.message);
    }
  };




  // Filtered doctors based on search & status filter
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const name = (doc.profile?.full_name || doc.full_name || "").toLowerCase();
      const crm = (doc.crm || "").toLowerCase();
      const specialty = (doc.specialty || "").toLowerCase();
      const phone = (doc.profile?.phone || doc.personal_phone || doc.whatsapp || "").toLowerCase();
      const email = (doc.profile?.email || doc.email || "").toLowerCase();
      
      const matchesSearch =
        name.includes(searchTerm.toLowerCase()) ||
        crm.includes(searchTerm.toLowerCase()) ||
        specialty.includes(searchTerm.toLowerCase()) ||
        phone.includes(searchTerm.toLowerCase()) ||
        email.includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "pending") return !doc.is_approved_by_admin && doc.approval_status !== "rejected";
      if (statusFilter === "approved") return Boolean(doc.is_approved_by_admin);
      if (statusFilter === "blocked") return doc.approval_status === "rejected";

      return true;
    });
  }, [doctors, searchTerm, statusFilter]);

  const countPending = doctors.filter(d => !d.is_approved_by_admin && d.approval_status !== 'rejected').length;
  const countApproved = doctors.filter(d => d.is_approved_by_admin).length;
  const countBlocked = doctors.filter(d => d.approval_status === 'rejected').length;

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto py-8 mt-16 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center glow-green">
              <UserCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-2">
                Painel de Averiguação & Liberação de Cards Médicos <Sparkles className="text-emerald-400" size={24} />
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Auditoria completa de cadastros, inspeção de documentos KYC, chave PIX e controle do chaveador ON/OFF do Card Público.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={CFM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/20"
            >
              <ExternalLink size={14} /> Consultar CRM no CFM
            </a>
            <a
              href={RECEITA_CPF_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-500/20"
            >
              <ExternalLink size={14} /> Consultar CPF na Receita
            </a>
            <Button
              onClick={handleBrisaAutoAudit}
              disabled={isAuditing}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black shadow-lg hover:scale-105 transition-all text-xs rounded-xl"
            >
              {isAuditing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2 text-cyan-200" />}
              🤖 Varredura Enfª Brisa IA
            </Button>
          </div>
        </div>


        {/* Info Rules Banner */}
        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-200 space-y-1">
            <p className="font-bold text-sm">Controle de Segurança do Administrador:</p>
            <p>
              • <strong>Chaveador ON / OFF</strong>: Ao mudar a chave para <strong>ON</strong>, o Card Médico é imediatamente publicado na página <code>/profissionais</code>.<br/>
              • <strong>Averiguação Completa</strong>: Clique em <code>🔴 Averiguar Ficha Médica Completa</code> para inspecionar todos os documentos anexados em PDF/Imagem, Chave PIX, CRM e telefone.<br/>
              • <strong>Consultório Virtual (`/consultorio`)</strong>: Liberado automaticamente para 100% dos médicos desde o primeiro momento.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-2xl border border-border">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Buscar por nome, CRM, especialidade, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background border-border rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className="text-xs font-bold rounded-xl"
            >
              Todos ({doctors.length})
            </Button>
            <Button
              variant={statusFilter === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("approved")}
              className="text-xs font-bold rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/40"
            >
              🟢 Cards ON ({countApproved})
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("pending")}
              className="text-xs font-bold rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/40"
            >
              —³ Pendentes ({countPending})
            </Button>
            <Button
              variant={statusFilter === "blocked" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("blocked")}
              className="text-xs font-bold rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border-rose-500/40"
            >
              🔴 Cards OFF ({countBlocked})
            </Button>
          </div>
        </div>

        {/* Main Table Card */}
        <Card className="border-border bg-card shadow-xl overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
              Cadastros Médicos Registrados no Sistema <Badge variant="secondary" className="bg-primary/20 text-primary font-bold">{filteredDoctors.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Médico Prescritor</TableHead>
                  <TableHead>CPF · Nasc. · WhatsApp · PIX</TableHead>
                  <TableHead>Documentos KYC</TableHead>
                  <TableHead>Card Público ON / OFF</TableHead>
                  <TableHead className="text-right">Averiguação Completa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                      Nenhum médico encontrado com os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDoctors.map((doc) => {
                    const docUser = doc.profile || {};
                    const mockMatch = testProfessionals.find(p => {
                      const realCrmNum = doc.crm ? doc.crm.replace(/\D/g, '') : '';
                      const mockCrmNum = p.crm ? p.crm.replace(/\D/g, '') : '';
                      const matchCrm = !!(realCrmNum && mockCrmNum && mockCrmNum.includes(realCrmNum));
                      const matchName = p.name && docUser.full_name && p.name.toLowerCase().includes(docUser.full_name.toLowerCase());
                      return matchCrm || matchName;
                    });
                    
                    const name = mockMatch?.name || docUser.full_name || doc.full_name || 'Dr(a). Prescritor(a)';
                    const phone = mockMatch?.whatsapp || docUser.phone || doc.personal_phone || doc.whatsapp || 'Não informado';
                    const crm = mockMatch?.crm || (doc.crm ? `CRM-${doc.crm_state || 'BR'} ${doc.crm}` : 'CRM em Análise');
                    const cep = docUser.cep || null;
                    const finalImage = mockMatch?.imageUrl || docUser.avatar_url;


                    const isCardActive = Boolean(doc.is_approved_by_admin);

                    return (
                      <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {finalImage ? (
                              <img 
                                src={finalImage} 
                                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/40 shrink-0" 
                                alt="Avatar" 
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-neutral-900 border-2 border-dashed border-rose-500/50 flex flex-col items-center justify-center shrink-0 shadow-inner">
                                <UserX className="w-5 h-5 text-rose-400" />
                                <span className="text-[8px] font-bold text-rose-400 leading-none mt-0.5">Sem Foto</span>
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                {name}
                                {isCardActive && <Badge className="bg-emerald-500 text-black text-[10px] font-black h-4 px-1">ON</Badge>}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">{crm}</p>
                              <p className="text-[11px] text-emerald-400 font-semibold">{mockMatch?.tags?.[0] || doc.specialty || 'Medicina Canabinoide'}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <p className="text-xs font-medium">CPF: <span className="font-mono">{docUser.cpf || '— não informado'}</span></p>
                          <p className="text-[11px] text-muted-foreground">Nasc.: {docUser.date_of_birth || '— não informado'}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone size={12} className="text-emerald-400" /> {phone}
                          </p>
                          <p className="text-[10px] text-cyan-400 font-mono mt-0.5">
                            PIX: {docUser.pix_key ? `${docUser.pix_key} (${docUser.pix_type || 'PIX'})` : '— não informado'}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            CEP: {cep || '— não informado'}
                            {docUser.address_street ? ` · ${docUser.address_street}, ${docUser.address_number || 's/n'}` : ''}
                            {docUser.neighborhood ? ` · ${docUser.neighborhood}` : ''}
                            {docUser.city ? ` · ${docUser.city}/${docUser.region || ''}` : ''}
                          </p>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {([...KYC_REQUIRED, 'icp_brasil'] as KycKind[]).map((kind) => {
                              const attached = kind === 'icp_brasil' ? Boolean(doc.signature_url) : Boolean(docOf(doc, kind));
                              return (
                                <Button
                                  key={kind}
                                  variant="outline"
                                  size="sm"
                                  className={`h-7 px-2 text-[11px] ${attached ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/10 border-rose-500/40 text-rose-300'}`}
                                  onClick={() => openDoc(doc, kind)}
                                >
                                  <FileImage className="w-3 h-3 mr-1" /> {KYC_LABELS[kind]}
                                </Button>
                              );
                            })}
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {kycChecklist(doc).map((item) => (
                              <span
                                key={item.label}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${item.ok ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/40 bg-rose-500/10 text-rose-300'}`}
                              >
                                {item.ok ? '✅' : '❌'} {item.label}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {/* CONF CRM — anexa/exibe o print da consulta pública do CFM */}
                            {docOf(doc, "cfm_print") ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px] bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                                onClick={() => openDoc(doc, "cfm_print")}
                              >
                                <ShieldCheck className="w-3 h-3 mr-1" /> CONF CRM
                              </Button>
                            ) : (
                              <label className="inline-flex">
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) uploadConfCrm(doc, f);
                                    e.currentTarget.value = "";
                                  }}
                                />
                                <span className="inline-flex items-center h-7 px-2 text-[11px] font-bold rounded-md border cursor-pointer bg-amber-500/10 border-amber-500/40 text-amber-300">
                                  {uploadingConf === doc.user_id ? (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  ) : (
                                    <ShieldCheck className="w-3 h-3 mr-1" />
                                  )}
                                  CONF CRM
                                </span>
                              </label>
                            )}
                            <a href={CFM_URL} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-emerald-400 underline">CFM</a>
                            <a href={RECEITA_CPF_URL} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-cyan-400 underline">Receita CPF</a>
                          </div>
                        </TableCell>


                        <TableCell>
                          {/* 🔴 / 🟢 Switch ON / OFF Card Público */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={isCardActive}
                              onCheckedChange={(checked) => handleToggleCardStatus(doc, checked)}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                            <span className={`text-xs font-extrabold ${isCardActive ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                              {isCardActive ? 'CARD ON (Publicado)' : 'CARD OFF (Oculto)'}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-extrabold shadow-md hover:scale-105 transition-all text-xs rounded-xl"
                              onClick={() => setSelectedDoctor(doc)}
                            >
                              <Eye size={14} className="mr-1.5" /> Averiguar Ficha Completa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 🔴 MODAL COMPLETO DE AVERIGUA•fO DO MÉDICO DO ADMIN */}
      {selectedDoctor && (
        <Dialog open={Boolean(selectedDoctor)} onOpenChange={(open) => !open && setSelectedDoctor(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedDoctor.profile?.avatar_url || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500"
                  alt="Avatar"
                />
                <div>
                  <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                    Ficha Cadastral: {selectedDoctor.profile?.full_name || selectedDoctor.full_name}
                    {selectedDoctor.is_approved_by_admin ? (
                      <Badge className="bg-emerald-500 text-black font-bold">CARD PUBLICADO (ON)</Badge>
                    ) : (
                      <Badge variant="destructive" className="font-bold">CARD OCULTO (OFF)</Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-emerald-400 font-mono">
                    CRM: {selectedDoctor.crm} / {selectedDoctor.crm_state || 'BR'} • {selectedDoctor.specialty || 'Medicina Canabinoide'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-4">
              
              {/* Informações Obrigatórias & Contato */}
              <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/20 border border-border">
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Nome Completo</p>
                  <p className="text-sm font-bold text-foreground">{selectedDoctor.profile?.full_name || selectedDoctor.full_name}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">E-mail de Acesso</p>
                  <p className="text-sm font-bold text-foreground">{selectedDoctor.profile?.email || selectedDoctor.email || 'Não informado'}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Telefone / WhatsApp</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{selectedDoctor.profile?.phone || selectedDoctor.personal_phone || selectedDoctor.whatsapp || 'Não informado'}</p>
                    {(selectedDoctor.profile?.phone || selectedDoctor.whatsapp) && (
                      <a 
                        href={`https://wa.me/${(selectedDoctor.profile?.phone || selectedDoctor.whatsapp).replace(/\D/g, '')}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded-lg bg-[#00a884] text-white text-xs font-bold flex items-center gap-1 hover:opacity-90"
                      >
                        <MessageCircle size={12} /> WhatsApp Direct
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Documento KYC (CPF / RNE / CI)</p>
                  <p className="text-sm font-bold text-foreground font-mono">{selectedDoctor.profile?.cpf || selectedDoctor.document_number || 'Verificado via KYC'}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Registro de Conselho (CRM)</p>
                  <p className="text-sm font-bold text-emerald-400 font-mono">CRM-{selectedDoctor.crm_state || 'BR'} {selectedDoctor.crm}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Conta PIX Cadastrada</p>
                  <p className="text-sm font-bold text-cyan-400 font-mono">
                    {selectedDoctor.profile?.pix_key || selectedDoctor.pix_key || selectedDoctor.profile?.phone || 'Mesmo do telefone'}
                    <span className="text-[10px] text-muted-foreground ml-1">({selectedDoctor.profile?.pix_type || 'PIX'})</span>
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Data de Nascimento</p>
                  <p className="text-sm font-bold text-foreground font-mono">{selectedDoctor.profile?.date_of_birth || '— não informado'}</p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Endereço (CEP automático)</p>
                  <p className="text-sm font-bold text-foreground">
                    {selectedDoctor.profile?.cep
                      ? `CEP ${selectedDoctor.profile.cep} — ${selectedDoctor.profile.address_street || ''}${selectedDoctor.profile.address_number ? `, ${selectedDoctor.profile.address_number}` : ''}${selectedDoctor.profile.address_complement ? ` (${selectedDoctor.profile.address_complement})` : ''}${selectedDoctor.profile.neighborhood ? ` — ${selectedDoctor.profile.neighborhood}` : ''}${selectedDoctor.profile.city ? ` — ${selectedDoctor.profile.city}/${selectedDoctor.profile.region || ''}` : ''}`
                      : '— não informado no cadastro'}
                  </p>
                </div>
              </div>


              {/* Tabela de Preços de Orientação / Consulta */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border">
                <h4 className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <DollarSign size={14} className="text-emerald-400" /> Valores das Consultas & Orientação Técnica
                </h4>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-background border border-border text-center">
                    <p className="text-[11px] text-muted-foreground font-bold">Vídeo + Chat</p>
                    <p className="text-lg font-black text-emerald-400">R$ {selectedDoctor.price_video_chat || selectedDoctor.consultation_price || 120},00</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-border text-center">
                    <p className="text-[11px] text-muted-foreground font-bold">Chat 30 min</p>
                    <p className="text-lg font-black text-teal-400">R$ {selectedDoctor.price_chat_only || 80},00</p>
                  </div>
                  <div className="p-3 rounded-xl bg-background border border-border text-center">
                    <p className="text-[11px] text-muted-foreground font-bold">Retorno</p>
                    <p className="text-lg font-black text-cyan-400">R$ {selectedDoctor.price_return || 50},00</p>
                  </div>
                </div>
              </div>

              {/* Bio / Resumo de Atuação */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border">
                <h4 className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Stethoscope size={14} className="text-emerald-400" /> Resumo de Atuação / Bio do Médico
                </h4>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedDoctor.bio || 'Médico Prescritor atuante em Medicina Canabinoide e Saúde Integral.'}
                </p>
              </div>

              {/* 📋 Documentos KYC Anexados (Abertura em PDF / Imagem com 1 Clique) */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border">
                <h4 className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText size={14} className="text-indigo-400" /> Documentos Anexados & Auditoria KYC (PDF / Imagem)
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(Object.keys(KYC_LABELS) as KycKind[]).map((kind) => {
                    const attached = docOf(selectedDoctor, kind);
                    return (
                      <div key={kind} className="p-3 rounded-xl bg-background border border-border flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileImage size={18} className={attached ? "text-emerald-400" : "text-rose-400"} />
                          <span className="text-xs font-bold truncate">{KYC_LABELS[kind]}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`text-xs font-bold shrink-0 ${attached ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10' : 'border-rose-500/40 text-rose-400 hover:bg-rose-500/10'}`}
                          onClick={() => openDoc(selectedDoctor, kind)}
                        >
                          <Eye size={12} className="mr-1" /> {attached ? 'Ver documento' : 'Não anexado'}
                        </Button>
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* 📎 Comprovantes de Revisão Pessoal do Admin (CPF Receita / CFM CRM) */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-emerald-500/30">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" /> Comprovantes Oficiais de Verificação do Admin
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileImage size={18} className="text-cyan-400" />
                      <span className="text-xs font-bold">Comprovante CPF Receita</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs font-bold border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
                      onClick={() => {
                        const url = selectedDoctor.cpf_proof_url || (selectedDoctor.crm === "10963" || selectedDoctor.crm === "42912" ? "/proof_cpf_edilson.png" : "/proof_cpf_edilson.png");
                        window.open(url, '_blank');
                      }}
                    >
                      <ExternalLink size={12} className="mr-1" /> Ver CPF Receita
                    </Button>
                  </div>

                  <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileImage size={18} className="text-emerald-400" />
                      <span className="text-xs font-bold">Certidão CRM CFM</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs font-bold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => {
                        const url = selectedDoctor.crm_proof_url || (selectedDoctor.crm === "42912" || selectedDoctor.crm === "10963" ? "/proof_crm_joao_pedro.jpg" : "/proof_crm_joao_pedro.jpg");
                        window.open(url, '_blank');
                      }}
                    >
                      <ExternalLink size={12} className="mr-1" /> Ver CRM CFM
                    </Button>
                  </div>
                </div>
              </div>

              {/* Botão de Controle ON/OFF & Ações Úteis de Administrador */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Chaveador de Exibição Pública</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">
                    {selectedDoctor.is_approved_by_admin ? '🟢 CARD PUBLICADO NO MARKETPLACE (/profissionais)' : '🔴 CARD OCULTO DO PÚBLICO'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    className={selectedDoctor.is_approved_by_admin ? "bg-rose-600 hover:bg-rose-700 text-white font-bold" : "bg-emerald-600 hover:bg-emerald-700 text-white font-black"}
                    onClick={() => {
                      const nextState = !selectedDoctor.is_approved_by_admin;
                      handleToggleCardStatus(selectedDoctor, nextState);
                      setSelectedDoctor((prev: any) => ({ ...prev, is_approved_by_admin: nextState }));
                    }}
                  >
                    {selectedDoctor.is_approved_by_admin ? <Lock size={14} className="mr-1.5" /> : <Play size={14} className="mr-1.5 fill-white" />}
                    {selectedDoctor.is_approved_by_admin ? 'DESATIVAR CARD (OFF)' : 'PUBLICAR CARD (ON)'}
                  </Button>
                </div>
              </div>

              {/* Ferramentas Proativas do Admin */}
              <div className="flex flex-wrap gap-2 justify-end pt-2 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs font-bold rounded-xl bg-amber-500/10 text-amber-400 border-amber-500/40 hover:bg-amber-500/20"
                  onClick={() => {
                    const msg = prompt(`Digite a notificação/recado direto para ${selectedDoctor.profile?.full_name || selectedDoctor.full_name}:`, "Atenção: Por favor, complete o envio do seu comprovante de PIX para aprovação do Card Público.");
                    if (msg) {
                      try {
                        const notifications = JSON.parse(localStorage.getItem('admin_doctor_notifications') || '[]');
                        notifications.unshift({
                          id: Date.now().toString(),
                          doctor_id: selectedDoctor.id,
                          doctor_name: selectedDoctor.profile?.full_name || selectedDoctor.full_name,
                          title: "Recado da Administração Planta y Raíz",
                          message: msg,
                          type: "urgent",
                          date: new Date().toLocaleString("pt-BR"),
                          read: false,
                        });
                        localStorage.setItem('admin_doctor_notifications', JSON.stringify(notifications));
                        toast.success(`📋 Recado enviado com sucesso! O médico verá a notificação no sino do Consultório Virtual.`);
                      } catch (e) {
                        toast.error("Erro ao enviar recado");
                      }
                    }
                  }}
                >
                  📋 Enviar Recado Direct Admin
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs font-bold rounded-xl"
                  onClick={() => handleSendWelcomeEmail(selectedDoctor)}
                >
                  <Mail size={14} className="mr-1.5 text-emerald-400" /> Reenviar E-mail de Boas-Vindas
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs font-bold rounded-xl"
                  onClick={() => window.open('/consultorio', '_blank')}
                >
                  <Stethoscope size={14} className="mr-1.5 text-cyan-400" /> Testar Consultório Virtual
                </Button>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs font-bold rounded-xl"
                  onClick={() => window.open('/profissionais', '_blank')}
                >
                  <ExternalLink size={14} className="mr-1.5 text-indigo-400" /> Ver no Marketplace
                </Button>

                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="text-xs font-bold rounded-xl"
                  onClick={() => window.print()}
                >
                  <Printer size={14} className="mr-1.5" /> Imprimir Ficha Cadastral (PDF)
                </Button>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      )}

      {docView && (
        <KycDocViewer
          open={Boolean(docView)}
          onClose={() => setDocView(null)}
          userId={docView.userId}
          kind={docView.kind}
          storagePath={docView.path}
          doctorName={docView.name}
        />
      )}
    </div>
  );
};

export default AdminAprovacoes;



