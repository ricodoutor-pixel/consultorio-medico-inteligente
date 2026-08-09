import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Terminal, RefreshCw, ChevronDown, ChevronRight, Search } from "lucide-react";

type StatusFilter = "all" | "success" | "error";

interface CmdRow {
  id: string;
  action: string;
  key: string | null;
  payload: any;
  source_ip: string | null;
  success: boolean;
  error: string | null;
  created_at: string;
}

export default function RemoteCommandLog() {
  const [rows, setRows] = useState<CmdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchAction, setSearchAction] = useState("");
  const [searchIp, setSearchIp] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("remote_command_log" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (searchAction.trim()) q = q.ilike("action", `%${searchAction.trim()}%`);
    if (searchIp.trim()) q = q.ilike("source_ip", `%${searchIp.trim()}%`);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    if (status === "all") return rows;
    return rows.filter((r) => (status === "success" ? r.success : !r.success));
  }, [rows, status]);

  const counts = useMemo(() => ({
    total: rows.length,
    success: rows.filter((r) => r.success).length,
    error: rows.filter((r) => !r.success).length,
  }), [rows]);

  return (
    <div className="min-h-dvh bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Terminal className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Remote Command Log</h1>
            <p className="text-sm text-muted-foreground">Auditoria de comandos das Edge Functions (Lovable Remote Commander)</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-bold">{counts.total}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">✅ Sucesso</div><div className="text-2xl font-bold text-emerald-500">{counts.success}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">❌ Erro</div><div className="text-2xl font-bold text-destructive">{counts.error}</div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["all", "success", "error"] as StatusFilter[]).map((s) => (
                <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
                  {s === "all" ? "Todos" : s === "success" ? "Sucesso" : "Erro"}
                </Button>
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-2">
              <Input placeholder="Ação (ex: deploy)" value={searchAction} onChange={(e) => setSearchAction(e.target.value)} />
              <Input placeholder="IP de origem" value={searchIp} onChange={(e) => setSearchIp(e.target.value)} />
              <Button onClick={load} disabled={loading}>
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Eventos ({filtered.length})</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quando</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Key</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const open = expanded[r.id];
                  return (
                    <>
                      <TableRow key={r.id} className="cursor-pointer" onClick={() => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }))}>
                        <TableCell>{open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</TableCell>
                        <TableCell>
                          <Badge className={r.success ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30" : "bg-destructive text-destructive-foreground"}>
                            {r.success ? "OK" : "ERR"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="font-mono text-xs">{r.action}</TableCell>
                        <TableCell className="font-mono text-xs">{r.source_ip || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{r.key || "—"}</TableCell>
                      </TableRow>
                      {open && (
                        <TableRow key={r.id + "-p"}>
                          <TableCell colSpan={6} className="bg-muted/30">
                            <div className="grid md:grid-cols-2 gap-3 p-2">
                              <div>
                                <div className="text-xs font-semibold mb-1 text-muted-foreground">payload</div>
                                <pre className="text-xs bg-background border rounded p-2 overflow-x-auto max-h-64">{JSON.stringify(r.payload, null, 2) || "—"}</pre>
                              </div>
                              <div>
                                <div className="text-xs font-semibold mb-1 text-muted-foreground">error</div>
                                <pre className="text-xs bg-background border rounded p-2 overflow-x-auto max-h-64 text-destructive">{r.error || "—"}</pre>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
                {!loading && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum comando registrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
