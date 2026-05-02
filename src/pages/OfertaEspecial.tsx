import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Shield, Star, CheckCircle2, AlertTriangle, Heart, Zap } from "lucide-react";

const INITIAL_SECONDS = 15 * 60; // 15 minutes

const OfertaEspecial = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cupom = searchParams.get("cupom") || "RAIZ200";
  const nome = searchParams.get("nome") || "Paciente";

  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [isCopied, setIsCopied] = useState(false);

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
    if (cupom === "RAIZ200") return 200;
    return 200;
  }, [cupom]);

  const handleCopyCoupon = () => {
    navigator.clipboard.writeText(cupom);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const urgencyMessages = [
    "Vai adiar sua saúde até quando?",
    "Não ignore a sugestão do seu médico.",
    "Sua qualidade de vida não pode esperar.",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Urgency Banner */}
      <div className={`w-full py-3 px-4 text-center text-sm font-bold transition-colors ${
        isExpiring ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"
      }`}>
        {isExpired
          ? "⏰ Tempo esgotado! Entre em contato para verificar disponibilidade."
          : `⏰ Oferta expira em ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">
            🔒 Oferta Exclusiva via WhatsApp
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {nome}, garantimos seu desconto <span className="text-primary">por tempo limitado</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Dr. Edilson preparou sua prescrição personalizada. Não deixe seu tratamento parar.
          </p>
        </div>

        {/* Countdown Card */}
        <Card className={`mb-6 border-2 ${isExpiring ? "border-destructive" : "border-primary"}`}>
          <CardContent className="p-6 text-center">
            <Clock className={`w-10 h-10 mx-auto mb-3 ${isExpiring ? "text-destructive" : "text-primary"}`} />
            <div className="text-5xl font-mono font-bold text-foreground mb-2">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            <p className="text-muted-foreground">
              {isExpired ? "Esta oferta expirou" : "Tempo restante para usar seu cupom"}
            </p>
          </CardContent>
        </Card>

        {/* Coupon Card */}
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Seu cupom exclusivo:</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-4xl font-bold text-primary tracking-wider">{cupom}</span>
            </div>
            <p className="text-2xl font-bold text-foreground mb-3">
              R$ {discount},00 de desconto
            </p>
            <Button
              onClick={handleCopyCoupon}
              variant="default"
              size="lg"
              className="w-full max-w-xs"
              disabled={isExpired}
            >
              {isCopied ? "✅ Cupom Copiado!" : "📋 Copiar Cupom"}
            </Button>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" /> O que você recebe:
            </h3>
            <div className="space-y-3">
              {[
                "Teleorientação técnica com Dr. Edilson (Especialista em Cannabis Medicinal)",
                "Prescrição digital válida em todo Brasil",
                "Acompanhamento contínuo pelo app",
                "Acesso ao Club Planta & Raiz",
                "Suporte 24/7 com a Enfermeira Brisa",
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Urgency Messages */}
        <div className="space-y-3 mb-6">
          {urgencyMessages.map((msg, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
              {i === 0 ? <AlertTriangle className="w-5 h-5 text-destructive shrink-0" /> :
               i === 1 ? <Heart className="w-5 h-5 text-primary shrink-0" /> :
               <Zap className="w-5 h-5 text-accent-foreground shrink-0" />}
              <p className="text-foreground font-medium text-sm">{msg}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full text-lg py-6"
            onClick={() => navigate(`/orientação técnica-rapida?cupom=${cupom}`)}
            disabled={isExpired}
          >
            🩺 Agendar Minha Consulta com Desconto
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate("/planos")}
          >
            Ver Todos os Planos
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
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
        <div className="mt-6 p-4 rounded-lg bg-muted text-center">
          <p className="text-sm text-muted-foreground italic">
            "O tratamento com cannabis mudou minha vida. O Dr. Edilson é incrível!"
          </p>
          <p className="text-xs text-muted-foreground mt-1">— Maria S., São Paulo ⭐⭐⭐⭐⭐</p>
        </div>
      </div>
    </div>
  );
};

export default OfertaEspecial;
