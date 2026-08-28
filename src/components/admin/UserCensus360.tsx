import { useState } from "react";
import { Users, Stethoscope, Store, Shield, Search, UserCheck, Phone, Mail, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface CensusUser {
  id: string;
  name: string;
  email: string;
  role: "patient" | "doctor" | "vendor" | "admin";
  phone?: string;
  document?: string;
  status?: string;
  created_at?: string;
}

interface UserCensus360Props {
  totalPacientes?: number;
  totalMedicos?: number;
  totalLojistas?: number;
  users?: CensusUser[];
}

const DEFAULT_USERS: CensusUser[] = [
  { id: "u-1", name: "Edilson Bezerra da Silva", email: "contato@plantayraiz.com.br", role: "admin", phone: "(11) 99136-3154", document: "30.740.319/0001-14", status: "Ativo · SuperAdmin", created_at: "2026-08-01" },
  { id: "u-2", name: "Dr. Daniel Kobayashi Colombo", email: "daniel.colombo@plantayraiz.com.br", role: "doctor", phone: "(11) 98713-1241", document: "CRM-SP 186358", status: "Homologado", created_at: "2026-08-05" },
  { id: "u-3", name: "Dra. Suelen Naves Rodrigues", email: "dra.suelen@plantayraiz.com.br", role: "doctor", phone: "(41) 98412-7788", document: "CRM-PR 49354", status: "Supervisora Técnica", created_at: "2026-08-10" },
  { id: "u-4", name: "Farmácia Oficial Planta y Raíz Dispensary", email: "farmacia@plantayraiz.com.br", role: "vendor", phone: "(11) 99136-3154", document: "CNPJ 30.740.319/0001-14", status: "Loja Oficial ANVISA", created_at: "2026-08-12" },
  { id: "u-5", name: "Carlos Eduardo Mendes (Paciente)", email: "carlos.mendes@email.com", role: "patient", phone: "(11) 97722-1144", document: "CPF ***.482.918-**", status: "Em Tratamento", created_at: "2026-08-20" },
  { id: "u-6", name: "Mariana Albuquerque (Paciente)", email: "mariana.albuquerque@email.com", role: "patient", phone: "(21) 98833-2255", document: "CPF ***.319.742-**", status: "Receita Ativa", created_at: "2026-08-22" },
];

export const UserCensus360 = ({
  totalPacientes = 128,
  totalMedicos = 32,
  totalLojistas = 6,
  users = DEFAULT_USERS,
}: UserCensus360Props) => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const list = users.length > 0 ? users : DEFAULT_USERS;

  const filtered = list.filter((u) => {
    if (activeTab !== "all" && u.role !== activeTab) return false;
    const term = searchTerm.toLowerCase();
    return (
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.document?.toLowerCase().includes(term) ||
      u.phone?.toLowerCase().includes(term)
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[9px]">Admin Mestre</Badge>;
      case "doctor":
        return <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/30 text-[9px]">Médico Prescritor</Badge>;
      case "vendor":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px]">Farmácia / Lojista</Badge>;
      default:
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px]">Paciente</Badge>;
    }
  };

  return (
    <Card className="border-border bg-card/40 backdrop-blur">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Users size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm md:text-base text-foreground flex items-center gap-2">
                Censo Geral de Contas & Usuários 360°
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                  {totalPacientes + totalMedicos + totalLojistas} Cadastros
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Distribuição consolidada de todos os perfis registrados no ecossistema</p>
            </div>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos ({list.length})
            </button>
            <button
              onClick={() => setActiveTab("patient")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "patient" ? "bg-emerald-600 text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pacientes ({totalPacientes})
            </button>
            <button
              onClick={() => setActiveTab("doctor")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "doctor" ? "bg-sky-600 text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Médicos ({totalMedicos})
            </button>
            <button
              onClick={() => setActiveTab("vendor")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "vendor" ? "bg-amber-600 text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Lojistas ({totalLojistas})
            </button>
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, CPF, CRM, e-mail..."
              className="pl-9 h-8 text-xs rounded-xl bg-muted/30 border-border"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-[10px] font-bold">Usuário / Razão Social</TableHead>
                <TableHead className="text-[10px] font-bold">Categoria</TableHead>
                <TableHead className="text-[10px] font-bold">Documento</TableHead>
                <TableHead className="text-[10px] font-bold">Contato</TableHead>
                <TableHead className="text-[10px] font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="py-2.5">
                    <p className="text-xs font-bold text-foreground leading-tight">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">{u.email}</p>
                  </TableCell>
                  <TableCell className="py-2.5">{getRoleBadge(u.role)}</TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground font-mono">{u.document || "—"}</TableCell>
                  <TableCell className="py-2.5 text-[11px] text-muted-foreground">{u.phone || "—"}</TableCell>
                  <TableCell className="py-2.5">
                    <span className="text-[11px] text-emerald-400 font-semibold">{u.status || "Ativo"}</span>
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
