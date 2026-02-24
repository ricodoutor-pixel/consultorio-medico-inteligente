import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { professionals } from "@/data/professionals";
import { CheckCircle2, Copy, Clock, ArrowRight, Shield, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const ConsultationPayment = () => {
  const [searchParams] = useSearchParams();
  const proId = searchParams.get("pro") || "med-1";
  const pro = professionals.find((p) => p.id === proId) || professionals[0];
  const [status, setStatus] = useState<"pending" | "processing" | "confirmed">("pending");
  const [countdown, setCountdown] = useState(300);
  const { toast } = useToast();

  const pixCode = "00020126580014br.gov.bcb.pix0136plantaeraiz-" + pro.id + "-" + Date.now().toString(36);
  const commission = pro.priceValue * 0.1;
  const total = pro.priceValue;

  useEffect(() => {
    if (status !== "pending") return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    toast({ title: "Código PIX copiado!", description: "Cole no app do seu banco para pagar." });
  };

  const simulatePayment = () => {
    setStatus("processing");
    setTimeout(() => {
      setStatus("confirmed");
      toast({ title: "✅ Pagamento confirmado!", description: "Você será redirecionado para a entrevista." });
    }, 3000);
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="min-h-screen bg-background">
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
                  <QrCode size={20} className="text-primary" /> Pagamento via PIX
                </h3>

                {status === "confirmed" ? (
                  <div className="text-center py-8">
                    <CheckCircle2 size={64} className="text-primary mx-auto mb-4" />
                    <h4 className="text-xl font-display font-black text-foreground mb-2">Pagamento Confirmado!</h4>
                    <p className="text-muted-foreground mb-6">Sua consulta com {pro.name} está agendada.</p>
                    <Button className="bg-primary text-primary-foreground font-black rounded-2xl" asChild>
                      <Link to={`/telemedicina?pro=${pro.id}`}>
                        Iniciar Pré-Entrevista IA <ArrowRight size={18} className="ml-2" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* QR Code placeholder */}
                    <div className="w-48 h-48 mx-auto mb-4 rounded-2xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-muted/30">
                      <div className="text-center">
                        <QrCode size={64} className="text-primary mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground font-bold">QR Code PIX</p>
                      </div>
                    </div>

                    {/* PIX Copy & Paste */}
                    <div className="mb-4">
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Código PIX (Copia e Cola)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={pixCode}
                          className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono"
                        />
                        <Button variant="outline" size="sm" onClick={handleCopyPix} className="rounded-xl border-primary/30 text-primary">
                          <Copy size={14} className="mr-1" /> Copiar
                        </Button>
                      </div>
                    </div>

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

                    {/* Price Breakdown */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Consulta</span>
                        <span className="text-foreground font-bold">{pro.price}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa da plataforma (10%)</span>
                        <span className="text-foreground font-bold">R$ {commission.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between">
                        <span className="font-black text-foreground">Total</span>
                        <span className="font-display font-black text-gradient-green text-xl">R$ {total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Simulate Payment */}
                    <Button
                      onClick={simulatePayment}
                      disabled={status === "processing"}
                      className="w-full bg-primary text-primary-foreground font-black rounded-2xl h-12"
                    >
                      {status === "processing" ? (
                        <span className="animate-pulse">Aguardando confirmação do PIX...</span>
                      ) : (
                        <>Simular Pagamento PIX</>
                      )}
                    </Button>
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
