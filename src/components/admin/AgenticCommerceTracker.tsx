import { useEffect, useState } from "react";
import { Bot, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface AgenticOrder {
  id: string;
  total_amount: number | null;
  status: string | null;
  payment_method?: string | null;
  regulatory_hash?: string | null;
  created_at?: string | null;
}

export const AgenticCommerceTracker = () => {
  const [orders, setOrders] = useState<AgenticOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase
        .from("agentic_orders")
        .select("id, total_amount, status, payment_method, regulatory_hash, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!alive) return;
      setOrders((data || []) as AgenticOrder[]);
      setLoading(false);
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const paid = orders.filter((o) => o.status === "paid");
  const gmv = paid.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const hashed = orders.filter((o) => !!o.regulatory_hash).length;
  const BRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <Card className="border-border bg-card/40 backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm md:text-base text-foreground flex items-center gap-2">
                Rastreador de Comércio Agêntico (UCP / MCP)
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px]">
                  Dados reais
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Pedidos gerados pela Enfª Brisa registrados no banco</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Pedidos Registrados</span>
            <p className="text-2xl font-black text-purple-400 mt-0.5">{orders.length}</p>
            <span className="text-[10px] text-purple-400/80 font-medium">Últimos 20</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Volume Pago (GMV)</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{BRL(gmv)}</p>
            <span className="text-[10px] text-emerald-400/80 font-medium">{paid.length} pedido(s) pago(s)</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Com Hash Regulatório</span>
            <p className="text-2xl font-black text-sky-400 mt-0.5">{hashed}</p>
            <span className="text-[10px] text-sky-400/80 font-medium">Validação SHA-512</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Aguardando Pagamento</span>
            <p className="text-2xl font-black text-amber-400 mt-0.5">{orders.length - paid.length}</p>
            <span className="text-[10px] text-amber-400/80 font-medium">Cotados / pendentes</span>
          </div>
        </div>

        {!loading && orders.length === 0 && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground">
            Nenhum pedido agêntico registrado até agora. Os números aparecerão aqui na primeira venda real.
          </div>
        )}

        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={14} />
                </div>
                <div>
                  <span className="font-bold text-foreground font-mono">{o.id.slice(0, 8)}</span>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[200px] sm:max-w-[320px] font-mono">
                    {o.regulatory_hash ? `Hash: ${o.regulatory_hash.slice(0, 24)}...` : "Sem hash regulatório"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-black text-emerald-400">{BRL(Number(o.total_amount || 0))}</span>
                <Badge
                  variant="outline"
                  className={`text-[9px] font-bold uppercase ${
                    o.status === "paid"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {o.status || "—"}
                </Badge>
                {o.payment_method && (
                  <Badge variant="outline" className="text-[9px] font-mono bg-muted/50">
                    {o.payment_method.toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
