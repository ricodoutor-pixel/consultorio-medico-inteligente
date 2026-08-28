import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { GatewayHibridoCheckout } from "@/components/GatewayHibridoCheckout";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { professionals } from "@/data/professionals";
import { CheckCircle2, Copy, Clock, ArrowRight, Shield, QrCode, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { userChannel } from "@/lib/realtime-channels";
import { usePaymentGateway } from "@/hooks/usePaymentGateway";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const ConsultationPayment = () => {
  const [searchParams] = useSearchParams();
  const proId = searchParams.get("pro") || "med-1";
  const appointmentId = searchParams.get("appointment") || null;
  const agenticOrderId = searchParams.get("agentic_order_id") || null;
  const agenticMethod = searchParams.get("method") || null;
  const pro = professionals.find((p) => p.id === proId) || professionals[0];
  const [status, setStatus] = useState<"pending" | "loading" | "processing" | "confirmed" | "rejected">("pending");
  const [processingStep, setProcessingStep] = useState(0);
  const [countdown, setCountdown] = useState(900); // 15 min
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { price: dynamicPrice, gateway, createPayment: createGatewayPayment, loading: loadingGateway } = usePaymentGateway();

  const [isExempt, setIsExempt] = useState(false);
  // Comércio Agêntico (UCP/MCP): valor sempre validado server-side
  const [agenticOrder, setAgenticOrder] = useState<{ total_amount: number; status: string } | null>(null);

  useEffect(() => {
    if (!agenticOrderId) return;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("agentic_orders")
        .select("total_amount, status")
        .eq("id", agenticOrderId)
        .maybeSingle();
      if (error || !data) {
        toast({ title: "Pedido agêntico não encontrado", description: "Seguindo com o checkout padrão." });
        return;
      }
      setAgenticOrder({ total_amount: Number(data.total_amount), status: data.status });
    })();
  }, [agenticOrderId, toast]);


  // Check if the doctor has an active Consultório Virtual subscription (exempt from 7% fee)
  useEffect(() => {
    const checkExemption = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return;
      const { data } = await supabase
        .from("btc_subscriptions")
        .select("status, plan_id")
        .eq("email", session.user.email)
        .eq("plan_id", "consultorio-virtual")
        .eq("status", "approved")
        .limit(1);
      if (data && data.length > 0) setIsExempt(true);
    };
    checkExemption();
  }, []);

  const feeRate = isExempt ? 0 : 0.07;
  const basePrice = dynamicPrice || pro.priceValue;
  const commission = basePrice * feeRate;
  const total = basePrice + commission;

  // Create payment preference on mount or when dynamic price is ready
  useEffect(() => {
    if (!loadingGateway) {
      createPayment();
    }
  }, [loadingGateway]);

  const createPayment = async () => {
    setStatus("loading");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const data = await createGatewayPayment({
        appointmentId,
        doctorName: pro.name,
        patientEmail: session?.user?.email || "",
        description: `Orientação Técnica com ${pro.name} - Planta & Raiz`,
      });

      if (data?.init_point || data?.url) {
        setCheckoutUrl(data.init_point || data.url);
        setStatus("pending");
      } else {
        // Fallback to static link
        setCheckoutUrl(pro.paymentLink);
        setStatus("pending");
      }
    } catch (err) {
      console.error("Payment creation error:", err);
      // Fallback to static link
      setCheckoutUrl(pro.paymentLink);
      setStatus("pending");
      toast({ title: "Usando link de pagamento direto", description: "Link alternativo disponível." });
    }
  };

  // Countdown timer
  useEffect(() => {
    if (status !== "pending" && status !== "processing") return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  // Real-time payment polling via check-payment edge function
  const checkPaymentStatus = useCallback(async () => {
    if (!appointmentId || status === "confirmed") return;
    try {
      const { data, error } = await supabase.functions.invoke("check-payment", {
        body: { appointmentId },
      });
      if (error) throw error;
      if (data?.status === "paid" || data?.status === "approved") {
        setStatus("processing");
        setProcessingStep(0);
        // Animate processing steps
        const steps = [1, 2, 3];
        for (const step of steps) {
          await new Promise(r => setTimeout(r, 800));
          setProcessingStep(step);
        }
        await new Promise(r => setTimeout(r, 600));
        setStatus("confirmed");
        toast({ title: "✅ Pagamento confirmado!", description: "Conectando com médico online..." });
        // Redireciona para a sala de espera onde o match com médico online acontece
        setTimeout(() => {
          window.location.href = "/sala-espera";
        }, 1500);
      } else if (data?.status === "rejected") {
        setStatus("rejected");
        toast({ title: "❌ Pagamento recusado", description: "Tente novamente.", variant: "destructive" });
      }
    } catch (err) {
      console.error("Payment check error:", err);
    }
  }, [appointmentId, status, toast]);

  // Poll every 5 seconds for payment status
  useEffect(() => {
    if (status !== "pending" && status !== "processing") return;
    if (!appointmentId) return;
    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [checkPaymentStatus, status, appointmentId]);

  // Realtime listener — channel name follows realtime.messages RLS convention
  useEffect(() => {
    if (!appointmentId) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      channel = supabase
        .channel(userChannel(uid, `payment-${appointmentId}`))
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `id=eq.${appointmentId}`,
        }, (payload: any) => {
          if (payload.new?.payment_status === "paid") {
            setStatus("confirmed");
            toast({ title: "✅ Pagamento confirmado!", description: "Redirecionando..." });
          }
        })
        .subscribe();
    });
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [appointmentId, toast]);

  const handleCopyLink = () => {
    if (checkoutUrl) {
      navigator.clipboard.writeText(checkoutUrl);
      toast({ title: "Link copiado!", description: "Cole no navegador para pagar." });
    }
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            {/* Specialist Summary */}
            <Card className="border-border mb-6">
              <CardContent className="p-5 flex items-center gap-4">
                <img src={pro.imageUrl} alt={pro.name} className="w-16 h-16 rounded-2xl object-cover border border-border" />
                <div className="flex-1">
                  <h2 className="font-display font-black text-foreground">{pro.name}</h2>
                  <p className="text-sm text-muted-foreground">{pro.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-display font-black text-gradient-green">{pro.price}</p>
                  <p className="text-xs text-muted-foreground">consulta</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card className="border-border mb-6">
              <CardContent className="p-6">
                <h3 className="font-display font-black text-foreground text-lg mb-4 flex items-center gap-2">
                  <QrCode size={20} className="text-primary" /> Pagamento via Mercado Pago
                </h3>

                {status === "loading" ? (
                  <div className="text-center py-12">
                    <Loader2 size={48} className="text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Gerando link de pagamento...</p>
                  </div>
                ) : status === "processing" ? (
                  <div className="text-center py-8">
                    <Loader2 size={48} className="text-primary animate-spin mx-auto mb-4" />
                    <h4 className="text-lg font-display font-black text-foreground mb-4">Processando Pagamento...</h4>
                    <div className="space-y-3 max-w-xs mx-auto text-left">
                      {[
                        "Verificando pagamento PIX...",
                        "Aplicando split automático (médico + plataforma)...",
                        "Gerando protocolo Anvisa...",
                      ].map((step, i) => (
                        <div key={i} className={`flex items-center gap-2 text-sm transition-opacity ${processingStep >= i + 1 ? "opacity-100" : "opacity-30"}`}>
                          {processingStep > i + 1 ? (
                            <CheckCircle2 size={16} className="text-primary shrink-0" />
                          ) : processingStep === i + 1 ? (
                            <Loader2 size={16} className="text-primary animate-spin shrink-0" />
                          ) : (
                            <Clock size={16} className="text-muted-foreground shrink-0" />
                          )}
                          <span className="text-muted-foreground">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : status === "confirmed" ? (
                  <div className="text-center py-8">
                    <CheckCircle2 size={64} className="text-primary mx-auto mb-4" />
                    <h4 className="text-xl font-display font-black text-foreground mb-2">Pagamento Confirmado!</h4>
                    <p className="text-muted-foreground mb-4">Sua consulta com {pro.name} está agendada.</p>
                    
                    {/* Anvisa Protocol */}
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6 text-left">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield size={16} className="text-primary" />
                        <span className="text-sm font-black text-foreground">Protocolo Anvisa</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Número do protocolo:</p>
                      <p className="font-mono text-sm font-bold text-primary">ANV-{Date.now().toString(36).toUpperCase()}-{Math.random().toString(36).substring(2, 6).toUpperCase()}</p>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        📋 Sua prescrição será preparada pelo médico durante a consulta. O protocolo ANVISA será vinculado automaticamente.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/30 border border-border mb-4 text-left">
                      <p className="text-xs text-muted-foreground">🪙 <span className="font-bold text-primary">+50 Planta-Coins</span> creditados como bônus de boas-vindas!</p>
                    </div>

                    <Button className="bg-primary text-primary-foreground font-black rounded-2xl" asChild>
                      <Link to={`/telemedicina?pro=${pro.id}`}>
                        Iniciar Pré-Entrevista IA <ArrowRight size={18} className="ml-2" />
                      </Link>
                    </Button>
                  </div>
                ) : status === "rejected" ? (
                  <div className="text-center py-8">
                    <AlertCircle size={64} className="text-destructive mx-auto mb-4" />
                    <h4 className="text-xl font-display font-black text-foreground mb-2">Pagamento Recusado</h4>
                    <p className="text-muted-foreground mb-6">Tente novamente com outro método.</p>
                    <Button onClick={createPayment} className="bg-primary text-primary-foreground font-black rounded-2xl">
                      Tentar Novamente
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Link copy */}
                    {checkoutUrl && (
                      <div className="mb-4">
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Link de Pagamento</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={checkoutUrl}
                            className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono truncate"
                          />
                          <Button variant="outline" size="sm" onClick={handleCopyLink} className="rounded-xl border-primary/30 text-primary">
                            <Copy size={14} className="mr-1" /> Copiar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Timer */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock size={16} />
                        <span className="text-sm font-bold">Expira em</span>
                      </div>
                      <span className="font-display font-black text-foreground">
                        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                      </span>
                    </div>

                    {/* Polling status */}
                    {appointmentId && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                        <Loader2 size={14} className="text-primary animate-spin" />
                        <span className="text-xs text-muted-foreground">Aguardando confirmação automática do pagamento...</span>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Orientação Técnica</span>
                        <span className="text-foreground font-bold">{pro.price}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isExempt ? "Taxa administrativa (isento — Consultório Virtual)" : "Taxa administrativa (7%)"}
                        </span>
                        <span className={`text-foreground font-bold ${isExempt ? "line-through text-muted-foreground" : ""}`}>
                          {isExempt ? "R$ 0,00" : `R$ ${commission.toFixed(2)}`}
                        </span>
                      </div>
                      {isExempt && (
                        <p className="text-xs text-primary font-semibold">✅ Assinante Consultório Virtual — isento da taxa de 7%</p>
                      )}
                      <div className="border-t border-border pt-2 flex justify-between">
                        <span className="font-black text-foreground">Total</span>
                        <span className="font-display font-black text-gradient-green text-xl">R$ {total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Pay button */}
                    <div className="space-y-3">
                      <GatewayHibridoCheckout 
                        amountBrl={total} 
                        productName={`Consulta com ${pro.name}`} 
                        triggerComponent={
                          <Button className="w-full bg-primary text-primary-foreground font-black rounded-2xl h-12">
                            Pagar com Gateway Sem Fronteiras
                          </Button>
                        } 
                      />

                      <Button
                        className="w-full bg-muted text-foreground font-black rounded-2xl h-12 border border-border hover:bg-muted/80"
                        asChild
                      >
                        <a href={checkoutUrl || pro.paymentLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={16} className="mr-2" />
                          Pagar via Mercado Pago
                        </a>
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Security Badge */}
            <div className="flex items-center gap-2 justify-center text-muted-foreground">
              <Shield size={16} className="text-primary" />
              <p className="text-xs font-medium">Pagamento seguro via Mercado Pago • Dados protegidos LGPD</p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ConsultationPayment;
