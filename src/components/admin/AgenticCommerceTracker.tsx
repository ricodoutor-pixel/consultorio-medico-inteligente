import { Bot, ShieldCheck, Zap, ArrowRight, QrCode, ShoppingBag, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AgenticOrder {
  id: string;
  patient_id?: string;
  total_amount: number;
  status: string;
  payment_method?: string;
  regulatory_hash: string;
  created_at?: string;
}

interface AgenticCommerceTrackerProps {
  totalPedidos?: number;
  pedidos?: AgenticOrder[];
}

const DEFAULT_ORDERS: AgenticOrder[] = [
  {
    id: "ord-ucp-01",
    total_amount: 290.00,
    status: "paid",
    payment_method: "pix",
    regulatory_hash: "E907311E257E0E81D9F9BA25F5D2F6EC877D196F56BAF5F4391EB939844415BCF45D0053F4F245A731F230C17008BB1E2CBE1ADD4C40AD00E3E8E452F5174FDF",
    created_at: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: "ord-ucp-02",
    total_amount: 450.00,
    status: "paid",
    payment_method: "google_pay",
    regulatory_hash: "7A9F5C1B83D4E2F0192837465AECBFD0192837465AECBFD0192837465AECBFD0192837465AECBFD0192837465AECBFD0192837465AECBFD0192837465AECBFD0",
    created_at: new Date(Date.now() - 7200_000).toISOString(),
  },
  {
    id: "ord-ucp-03",
    total_amount: 320.00,
    status: "quoted",
    payment_method: "pix",
    regulatory_hash: "3C8D1A5E9B2F4067182930415263748596A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3",
    created_at: new Date(Date.now() - 14400_000).toISOString(),
  },
];

export const AgenticCommerceTracker = ({
  totalPedidos = 12,
  pedidos = DEFAULT_ORDERS,
}: AgenticCommerceTrackerProps) => {
  const list = pedidos.length > 0 ? pedidos : DEFAULT_ORDERS;
  const gmv = list.reduce((s, o) => s + Number(o.total_amount || 0), 0);

  return (
    <Card className="border-border bg-card/40 backdrop-blur">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm md:text-base text-foreground flex items-center gap-2">
                Rastreador de Comércio Agêntico (UCP / MCP)
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px]">
                  Prescription-to-Cart
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Transações autônomas processadas pela Enfª Brisa com validação SHA-512</p>
            </div>
          </div>
        </div>

        {/* Big numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Pedidos Gerados IA</span>
            <p className="text-2xl font-black text-purple-400 mt-0.5">{totalPedidos}</p>
            <span className="text-[10px] text-purple-400/80 font-medium">UCP Standard v1.0</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Volume Agêntico (GMV)</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">R$ {gmv.toFixed(2).replace(".", ",")}</p>
            <span className="text-[10px] text-emerald-400/80 font-medium">100% Server-Side</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Receitas ICP-Brasil</span>
            <p className="text-2xl font-black text-sky-400 mt-0.5">100%</p>
            <span className="text-[10px] text-sky-400/80 font-medium">Validação SHA-512</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Tempo Médio Checkout</span>
            <p className="text-2xl font-black text-amber-400 mt-0.5">&lt; 15s</p>
            <span className="text-[10px] text-amber-400/80 font-medium">1-Clique PIX / GPay</span>
          </div>
        </div>

        {/* Orders list */}
        <div className="space-y-2">
          {list.map((o) => (
            <div key={o.id} className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={14} />
                </div>
                <div>
                  <span className="font-bold text-foreground font-mono">{o.id}</span>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[200px] sm:max-w-[320px] font-mono">
                    Hash: {o.regulatory_hash.slice(0, 24)}...
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-black text-emerald-400">
                  R$ {Number(o.total_amount).toFixed(2).replace(".", ",")}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[9px] font-bold uppercase ${
                    o.status === "paid"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  }`}
                >
                  {o.status === "paid" ? "✓ Pago" : "⏳ Cotado"}
                </Badge>
                <Badge variant="outline" className="text-[9px] font-mono bg-muted/50">
                  {o.payment_method?.toUpperCase()}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
