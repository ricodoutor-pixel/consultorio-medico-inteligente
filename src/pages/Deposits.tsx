import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, QrCode, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PIX_KEY = "plantayraiz@pix.com.br";

const Deposits = () => {
  const { toast } = useToast();

  const copyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    toast({ title: "Chave PIX copiada! ✅" });
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          <h1 className="text-3xl font-display font-bold text-foreground text-center mb-8">
            <Wallet className="inline mr-2" size={28} /> Depósitos
          </h1>
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center space-y-4">
              <QrCode size={80} className="mx-auto text-primary" />
              <p className="text-muted-foreground text-sm">Escaneie o QR Code ou copie a chave PIX abaixo</p>
              <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-foreground font-mono truncate">{PIX_KEY}</span>
                <Button variant="ghost" size="sm" onClick={copyPix}><Copy size={16} /></Button>
              </div>
              <p className="text-xs text-muted-foreground">Pagamento processado via Mercado Pago com confirmação automática</p>
            </CardContent>
          </Card>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Deposits;
