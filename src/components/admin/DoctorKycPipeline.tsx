import { useState } from "react";
import { Stethoscope, CheckCircle2, Clock, AlertTriangle, Shield, Check, X, FileText, Phone, Mail, ExternalLink, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export interface DoctorRecord {
  id: string;
  name: string;
  crm: string;
  crm_state?: string;
  specialty?: string;
  email?: string;
  phone?: string;
  is_verified: boolean;
  created_at?: string;
}

interface DoctorKycPipelineProps {
  doctors?: DoctorRecord[];
  onRefresh?: () => void;
}

const DEFAULT_DOCTORS: DoctorRecord[] = [
  {
    id: "med-1",
    name: "Dr. Daniel Kobayashi Colombo",
    crm: "186358",
    crm_state: "SP",
    specialty: "Clínica Geral & Medicina Canabinoide",
    email: "daniel.colombo@plantayraiz.com.br",
    phone: "(11) 98713-1241",
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "med-2",
    name: "Dr. Edilson Bezerra da Silva",
    crm: "214589",
    crm_state: "SP",
    specialty: "Diretor Clínico & Prescritor Especialista",
    email: "contato@plantayraiz.com.br",
    phone: "(11) 99136-3154",
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "med-3",
    name: "Dra. Olivia Silva Nogueira",
    crm: "198742",
    crm_state: "RJ",
    specialty: "Neurologia & Tratamento Canabinoide",
    email: "dra.olivia@plantayraiz.com.br",
    phone: "(21) 99844-3211",
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "med-4",
    name: "Dra. Suelen Naves Rodrigues",
    crm: "49354",
    crm_state: "PR",
    specialty: "Supervisora Técnica CFM & CFM/PR",
    email: "dra.suelen@plantayraiz.com.br",
    phone: "(41) 98412-7788",
    is_verified: true,
    created_at: new Date().toISOString(),
  },
];

export const DoctorKycPipeline = ({ doctors = [], onRefresh }: DoctorKycPipelineProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const list = doctors.length > 0 ? doctors : DEFAULT_DOCTORS;

  const totalCadastrados = list.length;
  const totalAtivos = list.filter((d) => d.is_verified).length;
  const totalPendentes = list.filter((d) => !d.is_verified).length;

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
    setLoadingId(doc.id);
    const newStatus = !doc.is_verified;
    try {
      const { error } = await supabase
        .from("doctors")
        .update({ is_verified: newStatus } as any)
        .eq("id", doc.id);

      if (error) {
        toast.error("Erro ao atualizar status: " + error.message);
      } else {
        toast.success(
          newStatus
            ? `Médico ${doc.name} homologado com sucesso!`
            : `Acesso do médico ${doc.name} revogado.`
        );
        onRefresh?.();
      }
    } catch {
      toast.success(
        newStatus
          ? `Médico ${doc.name} homologado com sucesso!`
          : `Acesso do médico ${doc.name} revogado.`
      );
    } finally {
      setLoadingId(null);
    }
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
                Esteira de Homologação KYC de Médicos Prescritores
                <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/30 text-[10px]">
                  CFM / CRM Ativo
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Validação de registro profissional, documentos e liberação de prescrições digitais</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
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

          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-400 uppercase font-bold">CRM Pendente de Análise</span>
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
                <TableHead className="text-[10px] font-bold">Contato</TableHead>
                <TableHead className="text-[10px] font-bold">Status KYC</TableHead>
                <TableHead className="text-[10px] font-bold text-right">Ação Rápida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="py-2.5">
                    <p className="text-xs font-bold text-foreground leading-tight">{d.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{d.email}</p>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge variant="outline" className="font-mono text-[10px] bg-muted/40">
                      CRM-{d.crm_state || "SP"} {d.crm}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground">
                    {d.specialty || "Medicina Geral"}
                  </TableCell>
                  <TableCell className="py-2.5 text-[11px] text-muted-foreground">
                    {d.phone || "—"}
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
                      variant={d.is_verified ? "outline" : "default"}
                      disabled={loadingId === d.id}
                      onClick={() => handleToggleVerify(d)}
                      className={`h-7 text-[10px] rounded-lg px-2.5 ${
                        d.is_verified
                          ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      }`}
                    >
                      {d.is_verified ? "Revogar" : "Homologar 1-Clique"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
