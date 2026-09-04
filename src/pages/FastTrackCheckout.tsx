import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, CheckCircle2, Shield, Clock, Percent, CreditCard, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";

interface CartItem {
  id: string;
  name: string;
  dosage: string;
  price: number;
  quantity: number;
}

export default function FastTrackCheckout() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [discount] = useState(0.10);
  const patientId = searchParams.get("pid");

  useEffect(() => {
    // Load prescription items from URL or localStorage cache
    const cached = localStorage.getItem(`fast-cart-${patientId}`);
    if (cached) {
      try {
        setItems(JSON.parse(cached));
      } catch { /* ignore */ }
    } else {
      // Demo items based on common prescriptions
      setItems([
        { id: "1", name: "CBD Full Spectrum 10% 30mL", dosage: "1 gota/kg/dia", price: 28900, quantity: 1 },
        { id: "2", name: "CBD:THC 20:1 Broad Spectrum 30mL", dosage: "0.5mg/kg/dia", price: 34900, quantity: 1 },
      ]);
    }
    setLoading(false);
  }, [patientId]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = Math.floor(subtotal * discount);
  const total = subtotal - discountAmount;

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Faça login para continuar");
        setProcessing(false);
        return;
      }

      // 1) Pedido criado no servidor (preços e frete validados lá).
      const { data: order, error: orderError } = await supabase.functions.invoke("shopping-order-create", {
        body: {
          items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
          cep: localStorage.getItem("shipping-cep") || "",
        },
      });
      if (orderError || !order?.order_id) {
        throw new Error(order?.error || orderError?.message || "Não foi possível criar o pedido.");
      }

      // 2) Cobrança real no Mercado Pago (split 95% farmácia · 5% plataforma).
      const { data: payment, error: payError } = await supabase.functions.invoke("mp-checkout", {
        body: { orderId: order.order_id },
      });
      if (payError || !payment?.init_point) {
        throw new Error(payment?.error || payError?.message || "Falha ao abrir o pagamento.");
      }

      localStorage.removeItem(`fast-cart-${patientId}`);
      window.location.href = payment.init_point;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar pedido");
      setProcessing(false);
    }
  };


  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-3">
              <Percent className="h-4 w-4" /> Desconto exclusivo pós-consulta
            </div>
            <h1 className="text-2xl font-bold text-foreground">Checkout Rápido</h1>
            <p className="text-sm text-muted-foreground mt-1">Itens do seu protocolo com 10% de desconto</p>
          </div>

          {/* Timer */}
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardContent className="p-3 flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Oferta válida por <strong className="text-primary">30 minutos</strong></span>
            </CardContent>
          </Card>

          {/* Items */}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <Card key={item.id} className="bg-card/60 backdrop-blur-sm border-border/30">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.dosage}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground line-through">
                        R$ {(item.price / 100).toFixed(2)}
                      </p>
                      <p className="font-bold text-primary">
                        R$ {((item.price * (1 - discount)) / 100).toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Totals */}
          <Card className="mb-6 bg-card/80 backdrop-blur-sm border-border/30">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {(subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-primary">
                <span>Desconto (10%)</span>
                <span>- R$ {(discountAmount / 100).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">R$ {(total / 100).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Button
            className="w-full py-6 text-base font-bold gap-2 rounded-xl shadow-[0_0_30px_hsl(var(--primary)/0.3)]"
            onClick={handleCheckout}
            disabled={processing || items.length === 0}
          >
            {processing ? (
              <div className="h-5 w-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            ) : (
              <>
                <CreditCard className="h-5 w-5" /> Pagar com PIX
              </>
            )}
          </Button>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><Shield className="h-3 w-3" /> Pagamento Seguro</div>
            <div className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> ANVISA Compliance</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
