import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, CheckCircle2, ArrowRight } from "lucide-react";

interface UpsellOfferProps {
  currentTotal: number;
  onAccept: (newAmount: number, planName: string) => void;
  onDecline: () => void;
}

const UPSELL_OFFERS = [
  {
    id: "vip-upgrade",
    name: "Plano VIP",
    description: "Acesso prioritário + orientação técnicas ilimitadas + selo de verificação",
    additionalPrice: 79.90,
    icon: Crown,
    color: "text-amber-400",
    benefits: [
      "Atendimento prioritário na fila",
      "Taxa zero em orientação técnicas",
      "Selo VIP no perfil",
      "Suporte WhatsApp 24h",
    ],
    badge: "MAIS VENDIDO",
  },
  {
    id: "priority-access",
    name: "Acesso Prioritário",
    description: "Fure a fila e seja atendido em até 5 minutos",
    additionalPrice: 29.90,
    icon: Zap,
    color: "text-primary",
    benefits: [
      "Atendimento em até 5 min",
      "Prioridade no matching",
      "Notificação instantânea ao médico",
    ],
    badge: "RÁPIDO",
  },
];

export function UpsellOffer({ currentTotal, onAccept, onDecline }: UpsellOfferProps) {
  const [accepted, setAccepted] = useState<string | null>(null);

  const handleAccept = (offer: typeof UPSELL_OFFERS[0]) => {
    setAccepted(offer.id);
    onAccept(currentTotal + offer.additionalPrice, offer.name);
  };

  if (accepted) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <Badge className="bg-amber-500/10 text-amber-500 text-xs font-black mb-2">
          🎁 OFERTA EXCLUSIVA — APENAS NESTE CHECKOUT
        </Badge>
        <h3 className="text-lg font-display font-black text-foreground">
          Turbine sua experiência!
        </h3>
        <p className="text-xs text-muted-foreground">
          Adicione um upgrade antes de finalizar. Comissões de afiliados são recalculadas automaticamente.
        </p>
      </div>

      <div className="grid gap-3">
        {UPSELL_OFFERS.map((offer) => {
          const Icon = offer.icon;
          return (
            <Card key={offer.id} className="border-border hover:border-primary/40 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon size={20} className={offer.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-display font-black text-sm text-foreground">{offer.name}</h4>
                      <Badge variant="outline" className="text-[9px] px-1.5">{offer.badge}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{offer.description}</p>
                    <ul className="space-y-1 mb-3">
                      {offer.benefits.map((b, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <CheckCircle2 size={10} className="text-primary shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-display font-black text-primary">
                        + R$ {offer.additionalPrice.toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        className="rounded-xl font-bold gap-1"
                        onClick={() => handleAccept(offer)}
                      >
                        Adicionar <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button
        variant="ghost"
        className="w-full text-xs text-muted-foreground"
        onClick={onDecline}
      >
        Não, obrigado. Continuar sem upgrade.
      </Button>
    </div>
  );
}
