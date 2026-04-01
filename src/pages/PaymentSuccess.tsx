import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const PaymentSuccess = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <section className="pt-28 pb-16 flex items-center justify-center min-h-[70vh]">
      <div className="text-center space-y-6 px-4">
        <CheckCircle size={80} className="mx-auto text-primary" />
        <h1 className="text-3xl font-display font-bold text-foreground">Pagamento Confirmado! 🎉</h1>
        <p className="text-muted-foreground max-w-md mx-auto">Seu pagamento foi processado com sucesso. Você receberá uma confirmação por e-mail.</p>
        <Button asChild className="bg-primary text-primary-foreground"><Link to="/dashboard">Ir para o Painel</Link></Button>
      </div>
    </section>
    <Footer />
  </div>
);

export default PaymentSuccess;
