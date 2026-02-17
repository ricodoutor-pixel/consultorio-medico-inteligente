import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Copy, CheckCircle2, Clock, ArrowRight, ShoppingCart, AlertCircle } from "lucide-react";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const PIX_PLACEHOLDER = "00020126580014br.gov.bcb.pix0136plantaeraiz-pix-placeholder5204000053039865802BR";

const Pay = () => {
  const { items, total, clearCart, count } = useCart();
  const { toast } = useToast();
  const [status, setStatus] = useState<"pending" | "processing" | "approved">("pending");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PIX_PLACEHOLDER);
    setCopied(true);
    toast({ title: "Código Pix copiado!", description: "Cole no app do seu banco." });
    setTimeout(() => setCopied(false), 3000);
  };

  const simulatePayment = () => {
    setStatus("processing");
    setTimeout(() => {
      setStatus("approved");
      toast({ title: "Pagamento aprovado!", description: "Seu acesso foi liberado." });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4 text-center">
            Pagamento <span className="text-gradient-gold">Pix</span>
          </h1>
          <p className="text-muted-foreground text-center mb-10">Pague e receba acesso automaticamente</p>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Order Summary */}
            <Card className="border-border">
              <CardContent className="p-6">
                <h2 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
                  <ShoppingCart size={18} /> Resumo do Pedido
                </h2>
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart size={40} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm mb-4">Nenhum item no carrinho</p>
                    <Button variant="outline" asChild>
                      <Link to="/shopping">Ir ao Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {items.map((item) => (
                        <div key={item.product.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-center gap-3">
                            <img src={item.product.imageUrl} alt={item.product.title} className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <p className="text-sm font-bold text-foreground">{item.product.title}</p>
                              <p className="text-xs text-muted-foreground">Qtd: {item.qty}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gradient-gold">R$ {(item.product.priceValue * item.qty).toFixed(2).replace(".", ",")}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-foreground text-lg">Total:</span>
                        <span className="text-2xl font-display font-bold text-gradient-gold">R$ {total().toFixed(2).replace(".", ",")}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Pix Payment */}
            <Card className="border-border">
              <CardContent className="p-6">
                <h2 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
                  <QrCode size={18} /> Pague com Pix
                </h2>

                {status === "approved" ? (
                  <div className="text-center py-8">
                    <CheckCircle2 size={48} className="text-secondary mx-auto mb-4" />
                    <h3 className="text-xl font-display font-bold text-foreground mb-2">Pagamento Aprovado!</h3>
                    <p className="text-muted-foreground text-sm mb-6">Seu acesso foi liberado automaticamente.</p>
                    <Button className="font-bold bg-gradient-to-r from-secondary/20 to-secondary/10 border border-green text-secondary" asChild>
                      <Link to="/carteira">Ver Meus Pedidos <ArrowRight size={16} className="ml-2" /></Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* QR Placeholder */}
                    <div className="border border-gold/30 rounded-xl p-6 bg-gradient-gold/30 text-center mb-4">
                      <div className="w-40 h-40 mx-auto rounded-xl border-2 border-dashed border-gold/50 flex items-center justify-center bg-card mb-3">
                        <QrCode size={64} className="text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground">QR code gerado pelo Mercado Pago (produção)</p>
                    </div>

                    {/* Copy paste */}
                    <div className="mb-4">
                      <label className="text-xs font-bold text-muted-foreground block mb-2">Pix Copia e Cola</label>
                      <div className="flex gap-2">
                        <code className="flex-1 p-3 rounded-xl bg-muted border border-border text-xs text-foreground break-all font-mono">
                          {PIX_PLACEHOLDER.substring(0, 40)}...
                        </code>
                        <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0" aria-label="Copiar código Pix">
                          {copied ? <CheckCircle2 size={16} className="text-secondary" /> : <Copy size={16} />}
                        </Button>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border mb-4">
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

                    {/* Simulate */}
                    <Button
                      className="w-full font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
                      onClick={simulatePayment}
                      disabled={status === "processing" || items.length === 0}
                    >
                      {status === "processing" ? "Processando..." : "Simular Pagamento Aprovado"}
                    </Button>

                    <p className="text-xs text-muted-foreground mt-4">
                      Em produção: cobrança criada via API Mercado Pago + confirmação automática via webhook.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* How it works */}
          <Card className="border-border mt-8 max-w-5xl mx-auto">
            <CardContent className="p-6">
              <h3 className="font-display font-bold text-foreground mb-4">Como funciona em produção</h3>
              <div className="grid sm:grid-cols-5 gap-3">
                {[
                  "1. Criar cobrança Pix via Mercado Pago",
                  "2. Salvar transação no banco (pending)",
                  "3. Webhook confirma pagamento (approved)",
                  "4. Liberar pedido/consulta automaticamente",
                  "5. Notificar usuário + recibo",
                ].map((step, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground font-bold">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pay;
