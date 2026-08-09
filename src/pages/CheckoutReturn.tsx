import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CheckCircle, XCircle, Calendar, FileText, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-28 pb-16 flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-8 px-4 max-w-2xl mx-auto">
          {sessionId ? (
            <>
              <CheckCircle size={80} className="mx-auto text-primary" />
              <h1 className="text-3xl font-display font-bold text-foreground">Pagamento Confirmado! 🎉</h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Seu pagamento foi processado com sucesso. Seus Planta-Coins foram creditados automaticamente.
              </p>

              {/* Próximos Passos */}
              <div className="text-left space-y-4 mt-8">
                <h2 className="text-xl font-semibold text-foreground text-center">🌿 Próximos Passos</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card className="border-primary/20">
                    <CardContent className="p-4 text-center space-y-2">
                      <Calendar className="mx-auto text-primary" size={32} />
                      <p className="text-sm font-medium text-foreground">Agende sua Orientação Técnica</p>
                      <p className="text-xs text-muted-foreground">Escolha o melhor horário com seu especialista.</p>
                      <Button size="sm" variant="outline" asChild className="w-full">
                        <Link to="/falar-com-especialista">Agendar</Link>
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20">
                    <CardContent className="p-4 text-center space-y-2">
                      <FileText className="mx-auto text-primary" size={32} />
                      <p className="text-sm font-medium text-foreground">Veja suas Prescrições</p>
                      <p className="text-xs text-muted-foreground">Acompanhe receitas e tratamentos.</p>
                      <Button size="sm" variant="outline" asChild className="w-full">
                        <Link to="/dashboard">Ver Receitas</Link>
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20">
                    <CardContent className="p-4 text-center space-y-2">
                      <MessageCircle className="mx-auto text-primary" size={32} />
                      <p className="text-sm font-medium text-foreground">Fale com a Brisa</p>
                      <p className="text-xs text-muted-foreground">Tire dúvidas pelo WhatsApp.</p>
                      <Button size="sm" variant="outline" asChild className="w-full">
                        <a href="https://wa.me/5511991363154" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex gap-3 justify-center pt-4">
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
              <div className="flex gap-3 justify-center">
                <Button asChild className="bg-primary text-primary-foreground">
                  <Link to="/planos">Tentar Novamente</Link>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://wa.me/5511991363154" target="_blank" rel="noopener noreferrer">Suporte via WhatsApp</a>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
