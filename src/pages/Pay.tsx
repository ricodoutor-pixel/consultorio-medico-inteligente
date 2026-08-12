import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Copy, CheckCircle2, ArrowRight, ShoppingCart, AlertCircle, Stethoscope, Star, Loader2, ExternalLink } from "lucide-react";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/use-toast";
import { professionals } from "@/data/professionals";
import { supabase } from "@/integrations/supabase/client";

const BRISA_WHATSAPP = "5511991363154";

const plans: Record<string, { name: string; price: number }> = {
  plano_paciente: { name: "Plano Paciente", price: 99 },
  plano_medico: { name: "Plano Médico", price: 99 },
  plano_lojista: { name: "Plano Lojista", price: 99 },
};


const Pay = () => {
  const [searchParams] = useSearchParams();
  const payType = searchParams.get("type") || "order";
  const planId = searchParams.get("planId");
  const proId = searchParams.get("proId");
  const amountParam = searchParams.get("amount");

  const { items, total, clearCart, count } = useCart();
  const { toast } = useToast();
  const [status, setStatus] = useState<"pending" | "loading" | "approved">("loading");
  const [copied, setCopied] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const pro = proId ? professionals.find((p) => p.id === proId) : null;
  const plan = planId ? plans[planId] : null;

  let paymentAmount = 0;
  let paymentLabel = "";
  if (payType === "intake" || payType === "appointment") {
    paymentAmount = amountParam ? parseFloat(amountParam) : (pro?.priceValue || 0);
    paymentLabel = pro ? `Orientação Técnica com ${pro.name}` : "Orientação Técnica";
  } else if (payType === "subscription") {
    paymentAmount = plan?.price || 0;
    paymentLabel = plan ? `Assinatura ${plan.name}` : "Assinatura";
  } else {
    paymentAmount = total();
    paymentLabel = `Pedido Shopping (${count()} itens)`;
  }

  useEffect(() => {
    createDynamicPayment();
  }, []);

  const createDynamicPayment = async () => {
    setStatus("loading");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Faça login para pagar", description: "Redirecionando...", variant: "destructive" });
        setTimeout(() => window.location.href = "/login", 1500);
        return;
      }

      if (payType === "order" && items.length > 0) {
        const cartItems = items.map(item => ({
          product_id: item.product.id,
          quantity: item.qty,
        }));
        const { data, error } = await supabase.functions.invoke("create-cart-payment", {
          body: { items: cartItems, description: paymentLabel },
        });
        if (error) throw error;
        if (data?.init_point) { setCheckoutUrl(data.init_point); setStatus("pending"); }
      } else if (payType === "subscription" && planId) {
        // Planos universais R$99 — catálogo server-side do mp-checkout
        const { data, error } = await supabase.functions.invoke("mp-checkout", {
          body: { sku: planId.startsWith("plano_") ? planId : `plano_${planId}` },
        });
        if (error) throw error;
        if (data?.init_point) { setCheckoutUrl(data.init_point); setStatus("pending"); }
      } else if ((payType === "intake" || payType === "appointment") && paymentAmount > 0) {
        const { data, error } = await supabase.functions.invoke("create-payment", {
          body: {
            doctorName: pro?.name || "Especialista",
            patientEmail: session.user.email || "",
            description: paymentLabel,
          },
        });
        if (error) throw error;
        if (data?.init_point) { setCheckoutUrl(data.init_point); setStatus("pending"); }
      } else {
        setStatus("pending");
      }
    } catch (err) {
      console.error("Payment creation error:", err);
      setStatus("pending");
      toast({ title: "Erro ao gerar link", description: "Use o botão para tentar novamente." });
    }
  };

  const handleCopy = () => {
    if (checkoutUrl) {
      navigator.clipboard.writeText(checkoutUrl);
      setCopied(true);
      toast({ title: "Link copiado!", description: "Cole no navegador para pagar." });
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4 tracking-tight">
            Pagamento <span className="text-gradient-green">Mercado Pago</span>
          </h1>
          <p className="text-muted-foreground mb-10 font-medium">Pague e receba acesso automaticamente</p>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl">
            <Card className="border-border">
              <CardContent className="p-6">
                <h2 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                  {payType === "order" ? <><ShoppingCart size={18} /> Resumo do Pedido</> :
                   payType === "subscription" ? <><Star size={18} /> Assinatura</> :
                   <><Stethoscope size={18} /> Orientação Técnica</>}
                </h2>

                {payType === "order" && items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart size={40} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm mb-4">Nenhum item no carrinho</p>
                    <Button variant="outline" className="rounded-xl" asChild>
                      <Link to="/shopping">Ir ao Shopping</Link>
                    </Button>
                  </div>
                ) : payType === "order" ? (
                  <div className="space-y-3 mb-4">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border">
                        <div className="flex items-center gap-3">
                          <img src={item.product.imageUrl} alt={item.product.title} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <p className="text-sm font-black text-foreground">{item.product.title}</p>
                            <p className="text-xs text-muted-foreground">Qtd: {item.qty}</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-gradient-green">R$ {(item.product.priceValue * item.qty).toFixed(2).replace(".", ",")}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                    {pro && (
                      <div className="flex items-center gap-3 mb-3">
                        <img src={pro.imageUrl} alt={pro.name} className="w-12 h-12 rounded-2xl object-cover border border-border" />
                        <div>
                          <p className="font-black text-foreground">{pro.name}</p>
                          <p className="text-xs text-muted-foreground">{pro.category}</p>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{paymentLabel}</p>
                  </div>
                )}

                <div className="border-t border-border pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-foreground text-lg">Total:</span>
                    <span className="text-2xl font-display font-black text-gradient-green">R$ {paymentAmount.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6">
                <h2 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                  <QrCode size={18} /> Pagamento Seguro
                </h2>

                {status === "approved" ? (
                  <div className="text-center py-8">
                    <CheckCircle2 size={48} className="text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-display font-black text-foreground mb-2">Pagamento Aprovado!</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      {payType === "intake" || payType === "appointment"
                        ? "Seu atendimento foi liberado automaticamente."
                        : payType === "subscription"
                        ? "Sua assinatura foi ativada!"
                        : "Seu pedido foi confirmado."}
                    </p>
                    <Button className="font-black bg-primary text-primary-foreground rounded-2xl" asChild>
                      <Link to="/carteira">Ver Meus Pedidos <ArrowRight size={16} className="ml-2" /></Link>
                    </Button>
                  </div>
                ) : status === "loading" ? (
                  <div className="text-center py-12">
                    <Loader2 size={48} className="text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Gerando link de pagamento personalizado...</p>
                  </div>
                ) : (
                  <>
                    {checkoutUrl && (
                      <div className="mb-4">
                        <label className="text-xs font-black text-muted-foreground block mb-2">Link de Pagamento</label>
                        <div className="flex gap-2">
                          <code className="flex-1 p-3 rounded-xl bg-muted border border-border text-xs text-foreground break-all font-mono truncate">
                            {checkoutUrl}
                          </code>
                          <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 rounded-xl">
                            {copied ? <CheckCircle2 size={16} className="text-primary" /> : <Copy size={16} />}
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted/30 border border-border mb-4">
                      <AlertCircle size={16} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Aguardando pagamento</span>
                    </div>
                    {checkoutUrl ? (
                      <Button className="w-full font-black bg-primary text-primary-foreground rounded-2xl mb-2" asChild>
                        <a href={checkoutUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={16} className="mr-2" /> Pagar R$ {paymentAmount.toFixed(2).replace(".", ",")} no Mercado Pago
                        </a>
                      </Button>
                    ) : (
                      <Button className="w-full font-black bg-primary text-primary-foreground rounded-2xl mb-2" onClick={createDynamicPayment}>
                        Gerar Link de Pagamento
                      </Button>
                    )}
                    {(payType === "intake" || payType === "appointment") && (
                      <Button className="w-full font-black rounded-2xl mt-2" variant="outline" asChild>
                        <a href={`https://wa.me/${BRISA_WHATSAPP}?text=${encodeURIComponent(`Olá Enfermeira Brisa, acabei de pagar a consulta com ${pro?.name || 'o especialista'}.`)}`} target="_blank" rel="noopener noreferrer">
                          Confirmar com Enfermeira Brisa 💬
                        </a>
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-4">Pagamento seguro via Mercado Pago. Valor: R$ {paymentAmount.toFixed(2).replace(".", ",")}</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pay;
