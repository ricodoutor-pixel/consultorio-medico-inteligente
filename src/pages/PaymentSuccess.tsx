import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { PostConsultationViralLoop } from "@/components/PostConsultationViralLoop";

const PaymentSuccess = () => (
  <div className="min-h-dvh bg-background">
    <Navbar />
    <section className="pt-28 pb-16 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <CheckCircle size={80} className="mx-auto text-primary" />
          <h1 className="text-3xl font-display font-bold text-foreground">Pagamento Confirmado! 🎉</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Seu pagamento foi processado com sucesso. Você receberá uma confirmação por e-mail e WhatsApp.
          </p>
          <Button asChild className="bg-primary text-primary-foreground">
            <Link to="/dashboard">Ir para o Painel</Link>
          </Button>
        </div>

        {/* Loop viral: Planta-Coins + indicação */}
        <PostConsultationViralLoop coinsEarned={15} bonusPerReferral={10} />
      </div>
    </section>
    <Footer />
  </div>
);

export default PaymentSuccess;
