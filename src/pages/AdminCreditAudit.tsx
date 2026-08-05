import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AuditRow {
  id: string;
  consultation_id: string;
  professional_id: string;
  patient_id: string;
  stars: number;
  amount: number | null;
  status: "released" | "under_review" | "rejected";
  reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export default function AdminCreditAudit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "released" | "under_review">("all");

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("consultation_credit_audit" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const releaseManually = async (id: string) => {
    const { error } = await supabase
      .from("consultation_credit_audit" as any)
      .update({ status: "released", reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Crédito liberado manualmente");
      load();
    }
  };

  const reject = async (id: string) => {
    const { error } = await supabase
      .from("consultation_credit_audit" as any)
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Crédito rejeitado");
      load();
    }
  };

  const counts = {
    released: rows.filter((r) => r.status === "released").length,
    under_review: rows.filter((r) => r.status === "under_review").length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Auditoria de Créditos Médicos</h1>
        <p className="text-muted-foreground">Revisão Brisa — avaliações &lt;5★ ficam retidas para o Dra. Suelen (1241)</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Liberados</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-500">{counts.released}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Em Auditoria</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-yellow-500">{counts.under_review}</div></CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {(["all", "under_review", "released"] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f === "all" ? "Todos" : f === "under_review" ? "Em Auditoria" : "Liberados"}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={load}>Atualizar</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhum registro</div>
          ) : (
            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={r.status === "released" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                        {r.status}
                      </Badge>
                      <span className="text-sm font-medium">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</span>
                      {r.amount && <span className="text-sm text-muted-foreground">R$ {Number(r.amount).toFixed(2)}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">Consulta: {r.consultation_id}</div>
                    <div className="text-xs text-muted-foreground truncate">Médico: {r.professional_id}</div>
                    {r.reason && <div className="text-sm mt-1">{r.reason}</div>}
                    <div className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString("pt-BR")}</div>
                  </div>
                  {r.status === "under_review" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => releaseManually(r.id)}>Liberar</Button>
                      <Button size="sm" variant="destructive" onClick={() => reject(r.id)}>Rejeitar</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
