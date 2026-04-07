import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Copy, CheckCircle2, Clock, ArrowRight, ShoppingCart, AlertCircle, Stethoscope, Star } from "lucide-react";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/use-toast";
import { professionals } from "@/data/professionals";

const PIX_PLACEHOLDER = "00020126580014br.gov.bcb.pix0136plantaeraiz-pix-placeholder5204000053039865802BR";

const plans: Record<string, { name: string; price: number }> = {
  essencial: { name: "Essencial", price: 19.9 },
  acesso: { name: "Acesso", price: 29.9 },
  familia: { name: "Família", price: 49.9 },
};

const Pay = () => {
  const [searchParams] = useSearchParams();
  const payType = searchParams.get("type") || "order";
  const planId = searchParams.get("planId");
  const proId = searchParams.get("proId");
  const amountParam = searchParams.get("amount");

  const { items, total, clearCart, count } = useCart();
  const { toast } = useToast();
  const [status, setStatus] = useState<"pending" | "processing" | "approved">("pending");
  const [copied, setCopied] = useState(false);

  const pro = proId ? professionals.find((p) => p.id === proId) : null;
  const plan = planId ? plans[planId] : null;

  let paymentAmount = 0;
  let paymentLabel = "";
  let paymentLink = "";
  if (payType === "intake" || payType === "appointment") {
    paymentAmount = amountParam ? parseFloat(amountParam) : (pro?.priceValue || 0);
    paymentLabel = pro ? `Consulta com ${pro.name}` : "Consulta";
    paymentLink = pro?.paymentLink || "https://link.mercadopago.com.br/assinaturaplantaerai";
  } else if (payType === "subscription") {
    paymentAmount = plan?.price || 0;
    paymentLabel = plan ? `Assinatura ${plan.name}` : "Assinatura";
    paymentLink = "https://link.mercadopago.com.br/assinaturaplantaerai";
  } else {
    paymentAmount = total();
    paymentLabel = `Pedido Shopping (${count()} itens)`;
    paymentLink = "https://link.mercadopago.com.br/assinaturaplantaerai";
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    toast({ title: "Link copiado!", description: "Cole no navegador para pagar." });
    setTimeout(() => setCopied(false), 3000);
  };

  const simulatePayment = () => {
    setStatus("processing");
    setTimeout(() => {
      setStatus("approved");
      if (payType === "order") clearCart();
      toast({ title: "Pagamento aprovado!", description: "Seu acesso foi liberado." });
    }, 3000);
  };

  const canPay = paymentAmount > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4 tracking-tight">
            Pagamento <span className="text-gradient-green">Pix</span>
          </h1>
          <p className="text-muted-foreground mb-10 font-medium">Pague e receba acesso automaticamente</p>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl">
            <Card className="border-border">
              <CardContent className="p-6">
                <h2 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                  {payType === "order" ? <><ShoppingCart size={18} /> Resumo do Pedido</> :
                   payType === "subscription" ? <><Star size={18} /> Assinatura</> :
                   <><Stethoscope size={18} /> Consulta</>}
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
                        <img src={pro.imageUrl} alt={pro.name} className="w-10 h-10 rounded-2xl object-cover border border-border" />
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
                  <QrCode size={18} /> Pague com Pix
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
                ) : (
                  <>
                    <div className="border border-green/30 rounded-2xl p-6 bg-gradient-green text-center mb-4">
                      <div className="w-40 h-40 mx-auto rounded-2xl border-2 border-dashed border-green/50 flex items-center justify-center bg-card mb-3">
                        <QrCode size={64} className="text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground">QR code gerado pelo Mercado Pago (produção)</p>
                    </div>

                    <div className="mb-4">
                      <label className="text-xs font-black text-muted-foreground block mb-2">Link de Pagamento (Copia e Cola)</label>
                      <div className="flex gap-2">
                        <code className="flex-1 p-3 rounded-xl bg-muted border border-border text-xs text-foreground break-all font-mono">
                          {paymentLink}
                        </code>
                        <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 rounded-xl" aria-label="Copiar link de pagamento">
                          {copied ? <CheckCircle2 size={16} className="text-primary" /> : <Copy size={16} />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted/30 border border-border mb-4">
                      {status === "processing" ? (
                        <>
                          <Clock size={16} className="text-primary animate-spin" />
                          <span className="text-sm text-muted-foreground">Verificando pagamento...</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={16} className="text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Aguardando pagamento</span>
                        </>
                      )}
                    </div>

                    <Button
                      className="w-full font-black bg-primary text-primary-foreground rounded-2xl mb-2"
                      asChild
                    >
                      <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                        Pagar Agora no Mercado Pago <ArrowRight size={16} className="ml-2" />
                      </a>
                    </Button>

                    <Button
                      className="w-full font-black rounded-2xl"
                      variant="outline"
                      onClick={simulatePayment}
                      disabled={status === "processing" || !canPay}
                    >
                      {status === "processing" ? "Processando..." : "Simular Pagamento Aprovado"}
                    </Button>

                    <p className="text-xs text-muted-foreground mt-4">
                      Pagamento seguro via Mercado Pago. Confirmação automática.
                    </p>
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
