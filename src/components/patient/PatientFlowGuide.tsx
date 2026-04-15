import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, ShoppingBag, FileText, Calendar, 
  Star, X, CheckCircle2, Pill
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export type FlowStep = 
  | "payment_completed"
  | "consultation_completed"
  | "prescription_ready"
  | "product_delivered";

interface NextAction {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  route: string;
  highlight?: boolean;
}

const FLOW_MAP: Record<FlowStep, NextAction[]> = {
  payment_completed: [
    {
      id: "go-waiting",
      icon: <Calendar size={20} />,
      title: "Entrar na Sala de Espera",
      description: "Sua consulta está confirmada. Aguarde o médico.",
      route: "/consulta",
      highlight: true,
    },
    {
      id: "view-receipt",
      icon: <FileText size={20} />,
      title: "Ver Comprovante",
      description: "Acesse o comprovante de pagamento.",
      route: "/consultorio",
    },
  ],
  consultation_completed: [
    {
      id: "view-prescription",
      icon: <FileText size={20} />,
      title: "Ver Receita Médica",
      description: "Sua prescrição digital está pronta.",
      route: "/consultorio",
      highlight: true,
    },
    {
      id: "shop-products",
      icon: <ShoppingBag size={20} />,
      title: "Comprar Produtos Prescritos",
      description: "Acesse a loja com desconto exclusivo.",
      route: "/shopping",
    },
    {
      id: "rate-doctor",
      icon: <Star size={20} />,
      title: "Avaliar Consulta",
      description: "Sua opinião nos ajuda a melhorar.",
      route: "#nps",
    },
  ],
  prescription_ready: [
    {
      id: "buy-meds",
      icon: <Pill size={20} />,
      title: "Comprar na Farmácia Parceira",
      description: "Link direto para os produtos prescritos.",
      route: "/shopping",
      highlight: true,
    },
    {
      id: "download-pdf",
      icon: <FileText size={20} />,
      title: "Baixar Receita PDF",
      description: "Receita com assinatura digital ICP-Brasil.",
      route: "/consultorio",
    },
  ],
  product_delivered: [
    {
      id: "rate-product",
      icon: <Star size={20} />,
      title: "Avaliar Produto",
      description: "Conte-nos sua experiência.",
      route: "#nps",
      highlight: true,
    },
    {
      id: "schedule-followup",
      icon: <Calendar size={20} />,
      title: "Agendar Retorno",
      description: "Marque sua consulta de acompanhamento.",
      route: "/agendar",
    },
    {
      id: "reorder",
      icon: <ShoppingBag size={20} />,
      title: "Recomprar com 1 Clique",
      description: "Mesmo produto, mesma receita.",
      route: "/shopping",
    },
  ],
};

interface PatientFlowGuideProps {
  currentStep: FlowStep;
  onClose?: () => void;
  onTriggerNPS?: () => void;
}

export const PatientFlowGuide = ({ currentStep, onClose, onTriggerNPS }: PatientFlowGuideProps) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const actions = FLOW_MAP[currentStep] || [];

  if (dismissed || actions.length === 0) return null;

  const handleAction = (action: NextAction) => {
    if (action.route === "#nps") {
      onTriggerNPS?.();
    } else {
      navigate(action.route);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
      >
        <Card className="bg-card border-primary/20 shadow-xl">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-primary" />
                <span className="text-sm font-bold text-foreground">Próximo Passo</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => { setDismissed(true); onClose?.(); }}
              >
                <X size={14} />
              </Button>
            </div>

            <div className="space-y-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    action.highlight
                      ? "bg-primary/10 border border-primary/30 hover:bg-primary/20"
                      : "bg-muted/30 hover:bg-muted/50"
                  }`}
                >
                  <div className={`shrink-0 ${action.highlight ? "text-primary" : "text-muted-foreground"}`}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
