import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Star, CheckCircle2, AlertTriangle, Heart, Zap, Loader2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const INITIAL_SECONDS = 15 * 60; // 15 minutes
const BRISA_PHONE = "5511991363154";

const OfertaEspecial = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cupom = searchParams.get("cupom") || "RAIZ80";
  const nome = searchParams.get("nome") || "Paciente";
  const phoneParam = searchParams.get("phone") || "";

  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [isCopied, setIsCopied] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isExpiring = secondsLeft < 300;
  const isExpired = secondsLeft === 0;

  const discount = useMemo(() => {
    if (cupom === "RAIZ300") return 300;
    if (cupom === "RAIZ80") return 80;
    return 80;
  }, [cupom]);

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText(cupom);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePayNow = async () => {
    if (isExpired || paying) return;
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("brisa-payment-link", {
        body: { phone: phoneParam, name: nome },
      });
      if (error) throw error;
      const url = (data as { payment_url?: string })?.payment_url;
      if (!url) throw new Error("Link de pagamento indisponível");
      window.location.href = url;
    } catch (e) {
      toast.error("Não foi possível gerar o pagamento. Fale com a Brisa.");
      const msg = `Olá Brisa! Tentei pagar pelo site (cupom ${cupom}) e não consegui. Pode me ajudar?`;
      window.location.href = `https://wa.me/${BRISA_PHONE}?text=${encodeURIComponent(msg)}`;
    } finally {
      setPaying(false);
    }
  };

  const urgencyMessages = [
    "Vai adiar sua saúde até quando?",
    "Não ignore a sugestão do seu médico.",
    "Sua qualidade de vida não pode esperar.",
  ];

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-muted">
      {/* Urgency Banner */}
      <div className={`w-full py-2.5 px-3 text-center text-xs sm:text-sm font-bold transition-colors ${
        isExpiring ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"
      }`}>
        {isExpired
          ? "⏰ Tempo esgotado! Fale com a Brisa para verificar disponibilidade."
          : `⏰ Oferta expira em ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
        {/* Header */}
        <div className="text-center mb-6">
          <Badge variant="secondary" className="mb-3 text-xs px-3 py-1">
            🔒 Oferta Exclusiva via WhatsApp
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight">
            {nome}, garantimos seu desconto <span className="text-primary">por tempo limitado</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Dr. Edilson preparou sua orientação técnica personalizada. Não deixe seu tratamento parar.
          </p>
        </div>

        {/* Countdown Card */}
        <Card className={`mb-4 border-2 ${isExpiring ? "border-destructive" : "border-primary"}`}>
          <CardContent className="p-4 sm:p-6 text-center">
            <Clock className={`w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 ${isExpiring ? "text-destructive" : "text-primary"}`} />
            <div className="text-4xl sm:text-5xl font-mono font-bold text-foreground mb-1">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isExpired ? "Esta oferta expirou" : "Tempo restante para usar seu cupom"}
            </p>
          </CardContent>
        </Card>

        {/* Coupon Card */}
        <Card className="mb-4 bg-primary/5 border-primary/20">
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">Seu cupom exclusivo:</p>
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-3xl sm:text-4xl font-bold text-primary tracking-wider">{cupom}</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground mb-3">
              R$ {discount},00 de desconto
            </p>
            <Button
              onClick={handleCopyCoupon}
              variant="outline"
              size="lg"
              className="w-full max-w-xs"
              disabled={isExpired}
            >
              {isCopied ? "✅ Cupom Copiado!" : "📋 Copiar Cupom"}
            </Button>
          </CardContent>
        </Card>

        {/* PRIMARY CTA — Pay Now */}
        <Card className="mb-4 bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary">
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Orientação Técnica com Dr. Edilson</p>
            <p className="text-3xl sm:text-4xl font-black text-foreground mb-1">R$ 30,00</p>
            <p className="text-xs text-muted-foreground mb-4">PIX ou Cartão · Aprovação instantânea</p>
            <Button
              size="lg"
              className="w-full text-base sm:text-lg py-5 sm:py-6 font-bold"
              onClick={handlePayNow}
              disabled={isExpired || paying}
            >
              {paying ? (
                <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Gerando link…</>
              ) : (
                <><CreditCard className="w-5 h-5 mr-2" /> Pagar Agora</>
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground mt-2">
              Pagamento seguro via Mercado Pago
            </p>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="mb-4">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" /> O que você recebe:
            </h3>
            <div className="space-y-2.5">
              {[
                "Teleconsulta com Dr. Edilson (Especialista em Cannabis Medicinal)",
                "Prescrição digital válida em todo Brasil",
                "Acompanhamento contínuo pelo app",
                "Acesso ao Club Planta & Raiz",
                "Suporte 24/7 com a Enfermeira Brisa",
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm sm:text-base text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Urgency Messages */}
        <div className="space-y-2 mb-4">
          {urgencyMessages.map((msg, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
              {i === 0 ? <AlertTriangle className="w-5 h-5 text-destructive shrink-0" /> :
               i === 1 ? <Heart className="w-5 h-5 text-primary shrink-0" /> :
               <Zap className="w-5 h-5 text-accent-foreground shrink-0" />}
              <p className="text-foreground font-medium text-xs sm:text-sm">{msg}</p>
            </div>
          ))}
        </div>

        {/* Secondary CTAs */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              const msg = `Olá Brisa! Quero falar sobre minha orientação técnica (cupom ${cupom}).`;
              window.location.href = `https://wa.me/${BRISA_PHONE}?text=${encodeURIComponent(msg)}`;
            }}
          >
            💬 Falar com a Brisa no WhatsApp
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={() => navigate("/planos")}
          >
            Ver Todos os Planos
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="w-4 h-4" /> LGPD Compliant
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" /> ANVISA Regular
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> +5.000 pacientes
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-4 p-4 rounded-lg bg-muted text-center">
          <p className="text-xs sm:text-sm text-muted-foreground italic">
            "O tratamento com cannabis mudou minha vida. O Dr. Edilson é incrível!"
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">— Maria S., São Paulo ⭐⭐⭐⭐⭐</p>
        </div>
      </div>
    </div>
  );
};

export default OfertaEspecial;
