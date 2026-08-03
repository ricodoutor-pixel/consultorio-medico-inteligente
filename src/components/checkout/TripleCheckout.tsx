import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Calendar, Repeat, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type CheckoutOptionKey = "A" | "B" | "C";

interface TripleCheckoutProps {
  onSelect: (opt: CheckoutOptionKey) => void;
  defaultSelected?: CheckoutOptionKey;
}

const OPTIONS = [
  {
    key: "A" as const,
    icon: Repeat,
    title: "Plano Universal",
    price: "R$ 99",
    suffix: "/mês",
    tagline: "Paciente, Médico ou Lojista — mesmo valor",
    perks: ["Acompanhamento contínuo", "Receita sempre assinada digitalmente", "Descontos no Shopping", "Programa de indicações"],
    highlight: true,
  },
  {
    key: "B" as const,
    icon: Calendar,
    title: "Consulta por Chat",
    price: "R$ 100",
    suffix: "única",
    tagline: "Atendimento por chat com o profissional",
    perks: ["Receita com assinatura digital", "Histórico no prontuário", "Retorno por R$ 90"],
  },
  {
    key: "C" as const,
    icon: Zap,
    title: "Consulta por Vídeo",
    price: "R$ 150",
    suffix: "completa",
    tagline: "Telemedicina HD com receita digital",
    perks: ["Vídeo em alta definição", "Receita Gov.br / ICP / ClickSign", "Retorno por R$ 90"],
  },
];


export function TripleCheckout({ onSelect, defaultSelected }: TripleCheckoutProps) {
  const [selected, setSelected] = useState<CheckoutOptionKey | null>(defaultSelected ?? null);

  const handlePick = (k: CheckoutOptionKey) => {
    setSelected(k);
    onSelect(k);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {OPTIONS.map((opt, idx) => {
        const Icon = opt.icon;
        const active = selected === opt.key;
        return (
          <motion.div
            key={opt.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
          >
            <Card
              className={cn(
                "relative cursor-pointer transition-all border-border/40 bg-card/60 backdrop-blur-sm h-full",
                active && "border-primary shadow-[0_0_30px_hsl(var(--primary)/0.35)]",
                opt.highlight && !active && "border-primary/40",
              )}
              onClick={() => handlePick(opt.key)}
            >
              {opt.highlight && (
                <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground">
                  Mais escolhido
                </Badge>
              )}
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center",
                      active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{opt.title}</h3>
                    <p className="text-xs text-muted-foreground">{opt.tagline}</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-bold text-primary">{opt.price}</span>
                  <span className="text-sm text-muted-foreground">{opt.suffix}</span>
                </div>
                <ul className="space-y-1.5 mb-4 flex-1">
                  {opt.perks.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-foreground/80">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={active ? "default" : "outline"}
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePick(opt.key);
                  }}
                >
                  {active ? "Selecionado" : "Escolher"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
