import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { PostConsultationViralLoop } from "@/components/PostConsultationViralLoop";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { orientationEntryUrl } from "@/lib/orientation-navigation";

const PaymentSuccess = () => {
  const [orientationStatus, setOrientationStatus] = useState<"checking" | "approved" | "pending" | "other">("other");
  const ref = new URLSearchParams(window.location.search).get("ref") || "";
  const isOrientation = ref.startsWith("brisa-orientacao-");

  useEffect(() => {
    if (!isOrientation) return;
    let active = true;
    let attempts = 0;
    const check = async () => {
      attempts += 1;
      const { data } = await supabase.functions.invoke("brisa-payment-link", { body: { action: "status", external_reference: ref } });
      if (!active) return;
      if (data?.status === "approved") setOrientationStatus("approved");
      else if (attempts < 12) window.setTimeout(check, 2500);
      else setOrientationStatus("pending");
    };
    setOrientationStatus("checking");
    void check();
    return () => { active = false; };
  }, [isOrientation, ref]);

  return (
  <div className="min-h-dvh bg-background">
    <Navbar />
    <section className="pt-28 pb-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <CheckCircle size={80} className="mx-auto text-primary" />
          <h1 className="text-3xl font-display font-bold text-foreground">Pagamento Confirmado! 🎉</h1>
          <p className="text-muted-foreground max-w-md mx-auto">{orientationStatus === "checking" ? "Estamos confirmando seu pagamento..." : orientationStatus === "pending" ? "O Mercado Pago ainda está confirmando seu pagamento. Você receberá uma mensagem assim que for aprovado." : "Seu pagamento foi processado com sucesso. Você receberá uma confirmação por e-mail e WhatsApp."}</p>
          {orientationStatus === "checking" && <Loader2 className="mx-auto animate-spin text-primary" />}
          {orientationStatus === "approved" ? (
            <Button asChild className="bg-primary text-primary-foreground"><Link to={orientationEntryUrl(`?ref=${encodeURIComponent(ref)}`)}><MessageCircle className="mr-2" />Iniciar Orientação Técnica</Link></Button>
          ) : (
            <Button asChild className="bg-primary text-primary-foreground"><Link to="/dashboard">Ir para o Painel</Link></Button>
          )}
        </div>

        {/* Loop viral: Planta-Coins + indicação */}
        <PostConsultationViralLoop coinsEarned={15} bonusPerReferral={10} />
      </div>
    </section>
    <Footer />
  </div>
  );
};

export default PaymentSuccess;
