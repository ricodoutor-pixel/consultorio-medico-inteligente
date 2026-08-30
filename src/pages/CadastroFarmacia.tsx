import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, UploadCloud, CheckCircle } from "lucide-react";

export default function CadastroFarmacia() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simula API
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast({
        title: "Credenciamento Solicitado!",
        description: "Seus dados foram enviados para o Compliance. Em breve entraremos em contato.",
      });
    }, 1500);
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-32 max-w-4xl">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <Building2 size={32} />
          </div>
          <h1 className="text-4xl font-display font-black text-foreground mb-4">Credenciamento de Lojistas e Farmácias</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Junte-se ao maior marketplace B2B2C de prescrições canabinoides. Despache produtos diretamente para nossos pacientes com repasse automático de 95% via Mercado Pago.
          </p>
        </div>

        {submitted ? (
          <Card className="border-emerald-500/30 bg-emerald-950/10 text-center py-12">
            <CardContent>
              <CheckCircle size={64} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Solicitação Recebida</h2>
              <p className="text-muted-foreground mb-6">Nosso time regulatório fará a verificação dos seus documentos (KYC). Avisaremos via e-mail assim que seu acesso ao Dashboard for liberado.</p>
              <Button asChild><Link to="/">Voltar para a Home</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Dados Regulatórios KYC</CardTitle>
              <CardDescription>Preencha os dados oficiais da sua farmácia ou dispensário.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Razão Social</Label>
                    <Input required placeholder="Ex: Farmácia Vida Verde Ltda" />
                  </div>
                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input required placeholder="00.000.000/0001-00" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Farmacêutico RT (Nome)</Label>
                    <Input required placeholder="Responsável Técnico" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>CRF</Label>
                      <Input required placeholder="Número" />
                    </div>
                    <div className="space-y-2">
                      <Label>UF do CRF</Label>
                      <Input required placeholder="SP" maxLength={2} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Licença ANVISA (AFE)</Label>
                    <Input required placeholder="Número de Autorização" />
                  </div>
                  <div className="space-y-2">
                    <Label>Chave Pix (Para recebimentos 95%)</Label>
                    <Input required placeholder="CNPJ ou E-mail" />
                  </div>
                </div>

                <div className="border-t border-border pt-6 mt-6">
                  <h3 className="font-bold mb-4">Upload de Documentos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-slate-900 transition-colors cursor-pointer">
                      <UploadCloud className="mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-bold">Logo Oficial</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG (Máx 2MB)</p>
                    </div>
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:bg-slate-900 transition-colors cursor-pointer">
                      <UploadCloud className="mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-bold">Certidão CRF / AFE</p>
                      <p className="text-xs text-muted-foreground">PDF (Máx 5MB)</p>
                    </div>
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full font-bold text-lg" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando para Auditoria..." : "Solicitar Credenciamento Oficial"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
