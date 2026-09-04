import { useEffect, useState } from "react";
import { DollarSign, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface FinancialSplitPanelProps {
  receita30d?: number;
  receitaHoje?: number;
  ordens30d?: number;
  ticketMedio?: number;
}

export const FinancialSplitPanel = ({
  receita30d = 0,
  receitaHoje = 0,
  ordens30d = 0,
  ticketMedio = 0,
}: FinancialSplitPanelProps) => {
  const [saas, setSaas] = useState(0);
  const [assinaturasAtivas, setAssinaturasAtivas] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("amount, status")
        .eq("status", "active");
      if (!alive) return;
      const rows = data || [];
      setAssinaturasAtivas(rows.length);
      setSaas(rows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0));
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const gmv = Number(receita30d || 0);
  const repasseMedicos = gmv * 0.93;
  const retencaoPlataforma = gmv * 0.07;

  const BRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <Card className="border-border bg-card/40 backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <DollarSign size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm md:text-base text-foreground flex items-center gap-2">
                Painel Financeiro & Split de Pagamentos
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px]">
                  Split 93% / 7%
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Valores calculados sobre pagamentos reais aprovados nos últimos 30 dias
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Volume Bruto (GMV 30d)</span>
            <p className="text-2xl font-black text-foreground mt-0.5">{BRL(gmv)}</p>
            <span className="text-[10px] text-muted-foreground font-medium">
              {ordens30d} pedido(s) · hoje {BRL(Number(receitaHoje || 0))}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-sky-500/5 border border-sky-500/30">
            <span className="text-[10px] text-sky-400 uppercase font-bold">Repasses Médicos (93%)</span>
            <p className="text-2xl font-black text-sky-400 mt-0.5">{BRL(repasseMedicos)}</p>
            <span className="text-[10px] text-sky-400/80 font-medium">PIX direto na conta</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 uppercase font-bold">Retenção Plataforma (7%)</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{BRL(retencaoPlataforma)}</p>
            <span className="text-[10px] text-emerald-400/80 font-medium">
              Ticket médio {BRL(Number(ticketMedio || 0))}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/30">
            <span className="text-[10px] text-purple-400 uppercase font-bold">Receita de Assinaturas</span>
            <p className="text-2xl font-black text-purple-400 mt-0.5">{BRL(saas)}</p>
            <span className="text-[10px] text-purple-400/80 font-medium">{assinaturasAtivas} assinatura(s) ativa(s)</span>
          </div>
        </div>

        {gmv === 0 && (
          <div className="mb-3 p-3 rounded-xl bg-muted/30 border border-border text-xs text-muted-foreground">
            Ainda não há pagamentos aprovados registrados. Os valores aparecem aqui automaticamente na primeira venda real.
          </div>
        )}

        <div className="p-3 rounded-xl bg-muted/20 border border-border flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="text-muted-foreground">Gateway principal:</span>
            <span className="font-bold text-foreground">Mercado Pago (PIX e cartão)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
