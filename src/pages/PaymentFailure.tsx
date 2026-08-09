import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { Link } from "react-router-dom";

const PaymentFailure = () => (
  <div className="min-h-dvh bg-background">
    <Navbar />
    <section className="pt-28 pb-16 flex items-center justify-center min-h-[70vh]">
      <div className="text-center space-y-6 px-4">
        <XCircle size={80} className="mx-auto text-destructive" />
        <h1 className="text-3xl font-display font-bold text-foreground">Pagamento não processado</h1>
        <p className="text-muted-foreground max-w-md mx-auto">Houve um problema. Tente novamente ou entre em contato via WhatsApp.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button asChild className="bg-primary text-primary-foreground"><Link to="/planos">Tentar Novamente</Link></Button>
          <Button variant="outline" asChild><a href="https://wa.me/5511991363154" target="_blank">Suporte WhatsApp</a></Button>
        </div>
      </div>
    </section>
    <Footer />
  </div>
);

export default PaymentFailure;
