import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { Link } from "react-router-dom";

const PaymentPending = () => (
  <div className="min-h-dvh bg-background">
    <Navbar />
    <section className="pt-28 pb-16 flex items-center justify-center min-h-[70vh]">
      <div className="text-center space-y-6 px-4">
        <Clock size={80} className="mx-auto text-yellow-500" />
        <h1 className="text-3xl font-display font-bold text-foreground">Pagamento Pendente ⏳</h1>
        <p className="text-muted-foreground max-w-md mx-auto">Seu pagamento está sendo processado. Você será notificado assim que for confirmado.</p>
        <Button asChild className="bg-primary text-primary-foreground"><Link to="/dashboard">Voltar ao Painel</Link></Button>
      </div>
    </section>
    <Footer />
  </div>
);

export default PaymentPending;
