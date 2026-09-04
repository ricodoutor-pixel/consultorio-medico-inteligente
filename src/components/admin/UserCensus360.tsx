import { useEffect, useMemo, useState } from "react";
import { Users, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export interface CensusUser {
  id: string;
  name: string;
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
}

export const UserCensus360 = (_props: UserCensus360Props) => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [users, setUsers] = useState<CensusUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [profilesRes, doctorsRes, vendorsRes, rolesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, phone, cpf, user_type, signup_role, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("doctors")
          .select("id, user_id, crm, specialty, approval_status, is_verified, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("vendors")
          .select("id, company_name, cnpj, phone, status, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (!alive) return;

      const adminIds = new Set(
        (rolesRes.data || []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id)
      );
      const doctorsByUser = new Map<string, any>();
      (doctorsRes.data || []).forEach((d: any) => d.user_id && doctorsByUser.set(d.user_id, d));

      const profileUsers: CensusUser[] = (profilesRes.data || []).map((p: any) => {
        const doc = doctorsByUser.get(p.id);
        const role: CensusUser["role"] = adminIds.has(p.id)
          ? "admin"
          : doc
          ? "doctor"
          : p.user_type === "pharmacy" || p.user_type === "distributor" || p.signup_role === "lojista"
          ? "vendor"
          : "patient";

        const status = doc
          ? doc.is_verified
            ? "Homologado"
            : doc.approval_status || "Pendente"
          : p.full_name && p.phone
          ? "Cadastro completo"
          : "Cadastro incompleto";

        return {
          id: p.id,
          name: p.full_name || "Sem nome informado",
          role,
          phone: p.phone || undefined,
          document: doc?.crm ? `CRM ${doc.crm}` : p.cpf || undefined,
          status,
          created_at: p.created_at,
        };
      });

      const vendorUsers: CensusUser[] = (vendorsRes.data || []).map((v: any) => ({
        id: `vendor-${v.id}`,
        name: v.company_name || "Loja sem nome",
        role: "vendor" as const,
        phone: v.phone || undefined,
        document: v.cnpj || undefined,
        status: v.status || "—",
        created_at: v.created_at,
      }));

      setUsers([...profileUsers, ...vendorUsers]);
      setLoading(false);
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const counts = useMemo(
    () => ({
      patient: users.filter((u) => u.role === "patient").length,
      doctor: users.filter((u) => u.role === "doctor").length,
      vendor: users.filter((u) => u.role === "vendor").length,
      admin: users.filter((u) => u.role === "admin").length,
    }),
    [users]
  );

  const filtered = users.filter((u) => {
    if (activeTab !== "all" && u.role !== activeTab) return false;
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      u.name?.toLowerCase().includes(term) ||
      u.document?.toLowerCase().includes(term) ||
      u.phone?.toLowerCase().includes(term)
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[9px]">Admin</Badge>;
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
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <Users size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm md:text-base text-foreground flex items-center gap-2">
                Censo Geral de Contas & Usuários 360°
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                  {loading ? "Carregando..." : `${users.length} cadastros reais`}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Lista lida diretamente dos cadastros do banco de dados</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border flex-wrap">
            {[
              { key: "all", label: `Todos (${users.length})`, active: "bg-primary text-primary-foreground" },
              { key: "patient", label: `Pacientes (${counts.patient})`, active: "bg-emerald-600 text-white" },
              { key: "doctor", label: `Médicos (${counts.doctor})`, active: "bg-sky-600 text-white" },
              { key: "vendor", label: `Lojistas (${counts.vendor})`, active: "bg-amber-600 text-white" },
              { key: "admin", label: `Admin (${counts.admin})`, active: "bg-purple-600 text-white" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  activeTab === t.key ? t.active : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, CPF, CRM, telefone..."
              className="pl-9 h-8 text-xs rounded-xl bg-muted/30 border-border"
            />
          </div>
        </div>

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
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-xs text-muted-foreground">
                    {loading ? "Carregando cadastros..." : "Nenhum cadastro encontrado."}
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="py-2.5">
                    <p className="text-xs font-bold text-foreground leading-tight">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—"}
                    </p>
                  </TableCell>
                  <TableCell className="py-2.5">{getRoleBadge(u.role)}</TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground font-mono">{u.document || "—"}</TableCell>
                  <TableCell className="py-2.5 text-[11px] text-muted-foreground">{u.phone || "—"}</TableCell>
                  <TableCell className="py-2.5">
                    <span className="text-[11px] text-muted-foreground font-semibold">{u.status || "—"}</span>
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
