import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Crown, Percent, RefreshCw, Calendar, CheckCircle2, Sparkles } from "lucide-react";

interface ClubSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe?: (planId: string) => void;
}

const BENEFITS = [
  "15% de desconto em todos os pedidos",
  "Renovação automática de receita",
  "Orientações Técnicas ilimitadas com especialistas",
  "Acesso ao conteúdo premium exclusivo",
  "Prioridade na fila de atendimento",
];

export function ClubSubscriptionModal({ isOpen, onClose, onSubscribe }: ClubSubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");

  if (!isOpen) return null;

  const plans = {
    monthly: { price: 9900, label: "Mensal", period: "/mês" },
    yearly: { price: 89900, label: "Anual", period: "/ano", savings: "25%" },
  };

  const plan = plans[selectedPlan];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6">
            <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Club Planta & Raiz</h2>
                <p className="text-sm text-muted-foreground">Economize em cada pedido</p>
              </div>
            </div>
          </div>

          {/* Plan Toggle */}
          <div className="px-6 pt-4">
            <div className="flex gap-2 bg-background/50 p-1 rounded-xl">
              {(["monthly", "yearly"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlan(p)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    selectedPlan === p
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {plans[p].label}
                  {p === "yearly" && (
                    <span className="ml-1 text-[10px] opacity-80">-{plans[p].savings}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="text-center py-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-sm text-muted-foreground">R$</span>
              <span className="text-4xl font-bold text-foreground">{(plan.price / 100).toFixed(0)}</span>
              <span className="text-lg text-muted-foreground">,{String(plan.price % 100).padStart(2, "0")}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="px-6 pb-4 space-y-2">
            {BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Auto-renewal info */}
          <div className="mx-6 mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 text-primary" />
              <span>
                Próxima renovação automática:{" "}
                <strong className="text-foreground">
                  {new Date(Date.now() + (selectedPlan === "monthly" ? 30 : 365) * 86400000)
                    .toLocaleDateString("pt-BR")}
                </strong>
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="p-6 pt-0 space-y-2">
            <Button
              className="w-full py-6 font-bold gap-2 rounded-xl shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
              onClick={() => {
                onSubscribe?.(selectedPlan);
                onClose();
              }}
            >
              <Sparkles className="h-5 w-5" /> Assinar Agora
            </Button>
            <button onClick={onClose} className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2">
              Continuar sem desconto
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
