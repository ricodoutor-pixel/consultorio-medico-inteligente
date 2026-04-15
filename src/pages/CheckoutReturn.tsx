import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-16 flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-6 px-4">
          {sessionId ? (
            <>
              <CheckCircle size={80} className="mx-auto text-primary" />
              <h1 className="text-3xl font-display font-bold text-foreground">Pagamento Confirmado! 🎉</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Seu pagamento foi processado com sucesso. Seus Planta-Coins foram creditados automaticamente.
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild className="bg-primary text-primary-foreground">
                  <Link to="/dashboard">Ir para o Painel</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/shopping">Continuar Comprando</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <XCircle size={80} className="mx-auto text-destructive" />
              <h1 className="text-3xl font-display font-bold text-foreground">Pagamento Não Concluído</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                O pagamento não foi finalizado. Tente novamente ou entre em contato com o suporte.
              </p>
              <Button asChild className="bg-primary text-primary-foreground">
                <Link to="/">Voltar ao Início</Link>
              </Button>
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
