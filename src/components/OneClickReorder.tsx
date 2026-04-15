import { useState } from "react";
import { RefreshCcw, ShoppingCart, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PastOrder {
  id: string;
  product: string;
  quantity: string;
  lastOrdered: string;
  price: number;
  prescriptionId?: string;
}

const MOCK_PAST_ORDERS: PastOrder[] = [
  { id: "1", product: "CBD Oil Full Spectrum 1000mg", quantity: "1 frasco", lastOrdered: "15/03/2026", price: 289.90, prescriptionId: "rx-001" },
  { id: "2", product: "Cápsulas THC:CBD 5:20", quantity: "60 cáps", lastOrdered: "20/02/2026", price: 349.90, prescriptionId: "rx-002" },
  { id: "3", product: "Pomada Canábica 100ml", quantity: "1 tubo", lastOrdered: "01/03/2026", price: 189.90 },
];

export const OneClickReorder = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [reordered, setReordered] = useState<string[]>([]);
  const { toast } = useToast();

  const handleReorder = async (order: PastOrder) => {
    setLoading(order.id);
    try {
      // Simulate creating a new order from past purchase
      await new Promise((r) => setTimeout(r, 1200));

      setReordered((prev) => [...prev, order.id]);
      toast({
        title: "✅ Pedido refeito!",
        description: `${order.product} adicionado ao carrinho.`,
      });
    } catch {
      toast({ title: "Erro", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <RefreshCcw className="h-5 w-5 text-primary" />
          Recompra Rápida
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Refaça pedidos anteriores com 1 clique
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {MOCK_PAST_ORDERS.map((order) => {
          const done = reordered.includes(order.id);
          return (
            <div
              key={order.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-background/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{order.product}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{order.lastOrdered}</span>
                  {order.prescriptionId && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      Receita válida
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-3">
                <span className="text-sm font-semibold text-primary whitespace-nowrap">
                  R$ {order.price.toFixed(2)}
                </span>
                <Button
                  size="sm"
                  variant={done ? "outline" : "default"}
                  disabled={!!loading || done}
                  onClick={() => handleReorder(order)}
                  className="min-w-[100px]"
                >
                  {loading === order.id ? (
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : done ? (
                    <><CheckCircle2 className="h-4 w-4 mr-1" /> Feito</>
                  ) : (
                    <><ShoppingCart className="h-4 w-4 mr-1" /> Recomprar</>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
