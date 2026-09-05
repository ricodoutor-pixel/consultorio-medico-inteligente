import { useState } from "react";
import { Stethoscope, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Check, X, FileText, Phone, Mail, ExternalLink, Search, Shield, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useDoctors } from "@/hooks/useDoctors";
import DoctorContractViewerModal, { DoctorContractDetails } from "./DoctorContractViewerModal";

export interface DoctorRecord {
  id: string;
  name: string;
  crm: string;
  crm_state?: string;
  cpf?: string;
  specialty?: string;
  email?: string;
  phone?: string;
  is_verified: boolean;
  is_contract_signed?: boolean;
  contract_hash?: string;
  contract_signed_at?: string;
  contract_ip?: string;
  contract_version?: string;
  created_at?: string;
}

interface DoctorKycPipelineProps {
  doctors?: DoctorRecord[];
  onRefresh?: () => void;
}

export const DoctorKycPipeline = ({ doctors, onRefresh }: DoctorKycPipelineProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<DoctorContractDetails | null>(null);
  const navigate = useNavigate();
  const { doctors: dbDoctors, fetchDoctors } = useDoctors();

  const list: DoctorRecord[] = doctors && doctors.length > 0 
    ? doctors 
    : dbDoctors.map((d) => ({
        id: d.id,
        name: d.profile?.full_name || d.full_name || "Dr(a). Prescritor(a)",
        crm: d.crm || "Pendente",
        crm_state: d.crm_state || "SP",
        cpf: d.profile?.cpf || d.document_number || undefined,
        specialty: d.specialty || "Medicina Canabinoide",
        email: d.profile?.email || undefined,
        phone: d.profile?.phone || d.phone || undefined,
        is_verified: Boolean(d.is_verified || d.is_approved_by_admin),
        is_contract_signed: Boolean(d.is_contract_signed || d.contract_signed_at),
        contract_hash: d.contract_hash || undefined,
        contract_signed_at: d.contract_signed_at || undefined,
        contract_ip: d.contract_ip || undefined,
        contract_version: d.contract_version || "v1.0",
        created_at: d.created_at,
      }));

  const totalCadastrados = list.length;
  const totalAtivos = list.filter((d) => d.is_verified).length;
  const totalPendentes = list.filter((d) => !d.is_verified).length;
  const totalContratosAssinados = list.filter((d) => 
    Boolean(d.is_contract_signed || d.contract_signed_at)
  ).length;

  const filtered = list.filter((d) => {
    const term = searchTerm.toLowerCase();
    return (
      d.name?.toLowerCase().includes(term) ||
      d.crm?.toLowerCase().includes(term) ||
      d.email?.toLowerCase().includes(term) ||
      d.specialty?.toLowerCase().includes(term)
    );
  });

  const handleToggleVerify = async (doc: DoctorRecord) => {
    const newStatus = !doc.is_verified;

    // Trava de aprovação KYC: CRM, CPF e Contrato são mandatórios para homologar
    if (newStatus) {
      const missing: string[] = [];
      if (!doc.crm || doc.crm.trim().length < 3) {
        missing.push("CRM válido (mínimo 3 dígitos)");
      }
      const cleanCpf = (doc.cpf || "").replace(/\D/g, "");
      if (!cleanCpf || cleanCpf.length !== 11) {
        missing.push("CPF com 11 dígitos numéricos");
      }
      const isSigned = Boolean(doc.is_contract_signed || doc.contract_signed_at);
      if (!isSigned) {
        missing.push("Contrato CFM assinado digitalmente (SHA-512)");
      }

      if (missing.length > 0) {
        toast.error(`Homologação bloqueada! Pré-requisitos pendentes: ${missing.join("; ")}`);
        return;
      }
    }

    setLoadingId(doc.id);
    try {
      const { error } = await supabase
        .from("doctors")
        .update({ is_verified: newStatus, is_approved_by_admin: newStatus } as any)
        .eq("id", doc.id);

      if (error) {
        toast.error("Erro ao atualizar status: " + error.message);
      } else {
        toast.success(
          newStatus
            ? `Médico ${doc.name} homologado com sucesso!`
            : `Acesso do médico ${doc.name} revogado.`
        );
        if (onRefresh) {
          onRefresh();
        } else {
          fetchDoctors();
        }
      }
    } catch (err: any) {
      toast.error("Erro inesperado ao atualizar status: " + (err?.message || "Tente novamente."));
    } finally {
      setLoadingId(null);
    }
  };

  const handleViewContract = (doc: DoctorRecord) => {
    const isSigned = Boolean(doc.is_contract_signed || doc.contract_signed_at);

    setSelectedContract({
      doctor_id: doc.id,
      doctor_name: doc.name,
      doctor_crm: doc.crm,
      doctor_crm_uf: doc.crm_state || "SP",
      doctor_cpf: doc.cpf || undefined,
      is_signed: isSigned,
      signed_at: doc.contract_signed_at || undefined,
      signer_ip: doc.contract_ip || undefined,
      sha512_hash: doc.contract_hash || undefined,
      contract_version: doc.contract_version || "v1.0",
    });
  };

  return (
    <Card className="border-border bg-card/40 backdrop-blur">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Stethoscope size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm md:text-base text-foreground flex items-center gap-2">
                Esteira de Homologação KYC & Contratos Médicos
                <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/30 text-[10px]">
                  CFM nº 2.336/2023
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Auditoria de CRM/CFM, contratos digitais assinados com SHA-512 e liberação de agenda</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/admin/aprovacoes-medicas")}
              className="text-xs rounded-xl border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
            >
              <FileText size={12} className="mr-1.5" />
              Painel Completo KYC
            </Button>
          </div>
        </div>

        {/* Pipeline Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Cadastrados</span>
              <p className="text-2xl font-black text-foreground mt-0.5">{totalCadastrados}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Stethoscope size={16} />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-400 uppercase font-bold">Aprovados / Ativos</span>
              <p className="text-2xl font-black text-emerald-400 mt-0.5">{totalAtivos}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-300 uppercase font-bold">Contratos Assinados</span>
              <p className="text-2xl font-black text-emerald-300 mt-0.5">{totalContratosAssinados}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck size={16} />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-400 uppercase font-bold">CRM Pendente</span>
              <p className="text-2xl font-black text-amber-400 mt-0.5">{totalPendentes}</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock size={16} />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar médico por nome, CRM, UF, especialidade ou e-mail..."
            className="pl-9 h-9 text-xs rounded-xl bg-muted/30 border-border"
          />
        </div>

        {/* Doctors Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-[10px] font-bold">Médico / Especialista</TableHead>
                <TableHead className="text-[10px] font-bold">CRM / UF</TableHead>
                <TableHead className="text-[10px] font-bold">Especialidade</TableHead>
                <TableHead className="text-[10px] font-bold">Contrato CFM</TableHead>
                <TableHead className="text-[10px] font-bold">Status KYC</TableHead>
                <TableHead className="text-[10px] font-bold text-right">Ação / Dossiê</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => {
                const isContractSigned = Boolean(d.is_contract_signed || d.contract_signed_at);

                return (
                  <TableRow key={d.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-2.5">
                      <p className="text-xs font-bold text-foreground leading-tight">{d.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{d.email}</p>
                      <div className="mt-0.5">
                        {d.cpf ? (
                          <span className="text-[10px] font-mono text-muted-foreground">CPF: {d.cpf}</span>
                        ) : (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px] font-medium">
                            ⚠️ CPF pendente
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="outline" className="font-mono text-[10px] bg-muted/40">
                        CRM-{d.crm_state || "SP"} {d.crm}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-muted-foreground">
                      {d.specialty || "Medicina Geral"}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <button 
                        onClick={() => handleViewContract(d)}
                        className="inline-flex items-center gap-1 group text-left"
                      >
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold cursor-pointer transition-all ${
                            isContractSigned
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25"
                              : "bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25"
                          }`}
                        >
                          {isContractSigned ? <ShieldCheck size={11} className="mr-1" /> : <Clock size={11} className="mr-1" />}
                          {isContractSigned ? "✓ Contrato Assinado" : "⏳ Pendente"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-semibold ${
                          d.is_verified
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {d.is_verified ? "✓ Homologado" : "⏳ Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5 text-right space-x-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewContract(d)}
                        className="h-7 text-[10px] rounded-lg px-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold"
                      >
                        <FileText size={11} className="mr-1" /> Contrato SHA-512
                      </Button>
                      {(() => {
                        const cleanCpf = (d.cpf || "").replace(/\D/g, "");
                        const isEligibleToApprove = Boolean(d.crm && d.crm.trim().length >= 3 && cleanCpf.length === 11 && isContractSigned);
                        return (
                          <Button
                            size="sm"
                            variant={d.is_verified ? "outline" : "default"}
                            disabled={loadingId === d.id}
                            onClick={() => handleToggleVerify(d)}
                            title={!d.is_verified && !isEligibleToApprove ? "Requisitos pendentes: CRM válido, CPF 11 dígitos e Contrato CFM assinado" : undefined}
                            className={`h-7 text-[10px] rounded-lg px-2.5 ${
                              d.is_verified
                                ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                                : !isEligibleToApprove
                                ? "bg-amber-600/60 hover:bg-amber-600/80 text-white font-semibold"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                            }`}
                          >
                            {d.is_verified ? "Revogar" : "Homologar"}
                          </Button>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Modal de Auditoria e Visualização do Contrato */}
        {selectedContract && (
          <DoctorContractViewerModal
            open={Boolean(selectedContract)}
            onClose={() => setSelectedContract(null)}
            contract={selectedContract}
          />
        )}
      </CardContent>
    </Card>
  );
};
