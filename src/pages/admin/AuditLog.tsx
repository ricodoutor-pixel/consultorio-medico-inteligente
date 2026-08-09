import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Shield, Search, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";

type Severity = "all" | "critical" | "audit" | "financial";

interface AuditRow {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  created_at: string;
}

const FINANCIAL_TABLES = ["payments", "transactions", "wallets", "vendor_transactions", "affiliate_wallets", "subscriptions", "consultation_credit_audit", "pagamentos_audit"];
const CRITICAL_TABLES = ["doctors", "prescriptions", "user_roles", "profiles_medical", "consultations"];

function classifySeverity(row: AuditRow): "critical" | "financial" | "audit" {
  const t = (row.table_name || "").toLowerCase();
  if (FINANCIAL_TABLES.some((x) => t.includes(x))) return "financial";
  if (CRITICAL_TABLES.some((x) => t.includes(x))) return "critical";
  if (row.action === "DELETE") return "critical";
  return "audit";
}

const severityColor: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  financial: "bg-yellow-500 text-yellow-950",
  audit: "bg-secondary text-secondary-foreground",
};

export default function AuditLog() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState<Severity>("all");
  const [searchUser, setSearchUser] = useState("");
  const [searchAction, setSearchAction] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (searchUser.trim()) q = q.eq("user_id", searchUser.trim());
    if (searchAction.trim()) q = q.ilike("action", `%${searchAction.trim()}%`);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (severity === "all") return rows;
    return rows.filter((r) => classifySeverity(r) === severity);
  }, [rows, severity]);

  const counts = useMemo(() => {
    const c = { critical: 0, financial: 0, audit: 0 };
    rows.forEach((r) => c[classifySeverity(r)]++);
    return c;
  }, [rows]);

  return (
    <div className="min-h-dvh bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Auditoria LGPD</h1>
            <p className="text-sm text-muted-foreground">Logs imutáveis de acesso e modificação · Retenção 7 anos</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-bold">{rows.length}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">🔴 Critical</div><div className="text-2xl font-bold text-destructive">{counts.critical}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">💰 Financial</div><div className="text-2xl font-bold text-yellow-500">{counts.financial}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">📝 Audit</div><div className="text-2xl font-bold">{counts.audit}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["all", "critical", "financial", "audit"] as Severity[]).map((s) => (
                <Button key={s} size="sm" variant={severity === s ? "default" : "outline"} onClick={() => setSeverity(s)}>
                  {s === "all" ? "Todos" : s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-2">
              <Input placeholder="ID de usuário (UUID)" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} />
              <Input placeholder="Tipo de evento (ex: update_prescription)" value={searchAction} onChange={(e) => setSearchAction(e.target.value)} />
              <Button onClick={load} disabled={loading}>
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eventos ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Severidade</TableHead>
                  <TableHead>Quando</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Tabela</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const sev = classifySeverity(r);
                  const isOpen = expanded[r.id];
                  return (
                    <>
                      <TableRow key={r.id} className="cursor-pointer" onClick={() => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }))}>
                        <TableCell>{isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</TableCell>
                        <TableCell><Badge className={severityColor[sev]}>{sev}</Badge></TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="font-mono text-xs">{r.action}</TableCell>
                        <TableCell className="font-mono text-xs">{r.table_name}</TableCell>
                        <TableCell className="font-mono text-xs">{r.user_id?.slice(0, 8)}…</TableCell>
                        <TableCell className="font-mono text-xs">{r.record_id?.slice(0, 8)}…</TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow key={r.id + "-payload"}>
                          <TableCell colSpan={7} className="bg-muted/30">
                            <div className="grid md:grid-cols-2 gap-3 p-2">
                              <div>
                                <div className="text-xs font-semibold mb-1 text-muted-foreground">old_data</div>
                                <pre className="text-xs bg-background border rounded p-2 overflow-x-auto max-h-64">{JSON.stringify(r.old_data, null, 2) || "—"}</pre>
                              </div>
                              <div>
                                <div className="text-xs font-semibold mb-1 text-muted-foreground">new_data</div>
                                <pre className="text-xs bg-background border rounded p-2 overflow-x-auto max-h-64">{JSON.stringify(r.new_data, null, 2) || "—"}</pre>
                              </div>
                              {r.ip_address && (
                                <div className="md:col-span-2 text-xs text-muted-foreground">IP: <span className="font-mono">{r.ip_address}</span></div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum evento encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
