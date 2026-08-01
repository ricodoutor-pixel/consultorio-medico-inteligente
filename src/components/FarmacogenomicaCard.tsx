import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dna, TestTube, AlertTriangle, ArrowRight, FlaskConical, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FarmacogenomicaCardProps {
  patientId?: string;
  isDoctorView?: boolean;
  className?: string;
}

export const FarmacogenomicaCard = ({ patientId, isDoctorView = false, className = "" }: FarmacogenomicaCardProps) => {
  const { toast } = useToast();
  // Simulate state: "untested", "processing", "completed"
  const [testStatus, setTestStatus] = useState<"untested" | "processing" | "completed">("untested");

  const handleOrderKit = () => {
    setTestStatus("processing");
    toast({
      title: "Kit de Saliva Solicitado",
      description: "O kit de DNA Canabinoide será enviado para o seu endereço em até 2 dias úteis.",
    });
    
    // Auto-complete for demo purposes after a few seconds
    setTimeout(() => {
      setTestStatus("completed");
      toast({
        title: "Laudo Farmacogenômico Disponível",
        description: "Seu mapeamento do Sistema Endocanabinoide foi concluído.",
      });
    }, 4000);
  };

  if (testStatus === "untested") {
    return (
      <Card className={`border-primary/20 bg-card/50 overflow-hidden relative ${className}`}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Dna size={80} />
        </div>
        <CardHeader className="relative z-10 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dna className="text-primary" size={20} />
            Perfil Genético & DNA Canabinoide
          </CardTitle>
          <CardDescription>
            Descubra como seu corpo metaboliza o THC e CBD através de um teste de saliva.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 text-sm text-muted-foreground mt-2">
          {isDoctorView ? (
            <p>O paciente ainda não possui mapeamento CYP450. Recomende o teste para prescrever com 100% de precisão baseada no DNA.</p>
          ) : (
            <p>Um simples swab bucal mapeia seu Sistema Endocanabinoide, permitindo que nossos médicos prescrevam a dosagem e cepa ideais para a sua genética.</p>
          )}
        </CardContent>
        <CardFooter className="relative z-10 pt-2">
          <Button onClick={handleOrderKit} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            <TestTube className="mr-2" size={16} />
            Pedir Kit de Saliva (DNA Canabinoide)
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (testStatus === "processing") {
    return (
      <Card className={`border-primary/20 bg-card/50 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="text-primary animate-pulse" size={20} />
            Análise Farmacogenômica em Andamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={65} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Extraindo DNA da amostra e sequenciando genes do complexo CYP450...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Completed State
  return (
    <Card className={`border-green/40 bg-gradient-to-br from-card to-primary/5 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dna className="text-primary" size={20} />
            Laudo Farmacogenômico (DNA Canabinoide)
          </CardTitle>
          <Badge className="bg-primary/20 text-primary border-primary/30 flex items-center gap-1">
            <CheckCircle2 size={12} /> Verificado
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isDoctorView && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 items-start">
            <AlertTriangle className="text-red-400 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-sm font-bold text-red-400">Alerta Clínico de Metabolização</p>
              <p className="text-xs text-red-400/80 mt-1">
                Paciente apresenta alelo CYP2C9*3 (Metabolizador Lento de THC). Risco elevado de efeitos adversos psicotrópicos em dosagens padrão.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 bg-muted/40 rounded-xl border border-border">
            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">CYP2C9 (Metabolismo THC)</p>
            <p className="text-lg font-black text-foreground">Metabolizador Lento</p>
            <Progress value={20} className="h-1 mt-2" indicatorColor="bg-red-400" />
          </div>
          <div className="p-3 bg-muted/40 rounded-xl border border-border">
            <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">CYP3A4 (Metabolismo CBD)</p>
            <p className="text-lg font-black text-foreground">Metabolizador Normal</p>
            <Progress value={80} className="h-1 mt-2" indicatorColor="bg-green-400" />
          </div>
        </div>

        <div className="p-4 bg-background rounded-xl border border-border space-y-2">
          <h4 className="text-sm font-bold text-foreground">Recomendação Terapêutica Baseada no DNA</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Devido à via metabólica lenta para o Tetrahidrocanabinol, recomenda-se iniciar o tratamento com proporção <strong>CBD:THC de 20:1 ou 10:1</strong> em regime de <em>microdosagem</em>. Evite vias de administração pulmonar (vaporização) sem titulação prévia rigorosa por via sublingual.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
