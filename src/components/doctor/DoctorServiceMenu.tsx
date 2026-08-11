import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Video, Zap, Crown, Stethoscope, Loader2, FileText, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  SERVICE_MENU,
  ServiceMenuItem,
  FIXED_SERVICE_NOTICE,
  PREMIUM_SUGGESTED_PRICE,
  formatBRL,
} from "@/lib/pricing";

const ICONS: Record<string, typeof MessageSquare> = {
  orientacao_tecnica: Stethoscope,
  consulta_chat: MessageSquare,
  consulta_video: Video,
  retorno_consulta: Zap,
  consulta_premium: Crown,
};

interface DoctorServiceMenuProps {
  doctorName: string;
  doctorId?: string;
  /** Preço da Consulta Premium definido pelo profissional. */
  premiumPrice?: number;
}

/**
 * Vitrine padronizada de serviços do profissional.
 * Fluxo: Pagamento (Mercado Pago) → Triagem Brisa → Consulta.
 * Orientação Técnica (R$ 30) é sempre direcionada ao Dr. Edilson Bezerra ON.
 */
export function DoctorServiceMenu({ doctorName, doctorId, premiumPrice }: DoctorServiceMenuProps) {
  const navigate = useNavigate();
  const [loadingSku, setLoadingSku] = useState<string | null>(null);

  const priceOf = (item: ServiceMenuItem) =>
    item.sku === "consulta_premium" ? premiumPrice || PREMIUM_SUGGESTED_PRICE : item.price;

  const handleSelect = async (item: ServiceMenuItem) => {
    setLoadingSku(item.sku);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Faça seu cadastro para contratar um serviço.", {
          action: { label: "Cadastro", onClick: () => navigate("/cadastro") },
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("mp-checkout", {
        body: {
          sku: item.sku,
          doctorId,
          returnUrl: item.redirectToEdilson
            ? "https://www.plantayraiz.com.br/brisa-orientacao"
            : "https://www.plantayraiz.com.br/quiz-triagem",
        },
      });
      if (error) throw error;

      if (data?.init_point) {
        toast.success("Redirecionando para o Mercado Pago…");
        window.location.href = data.init_point;
      } else {
        toast.error(data?.error || "Erro ao gerar link de pagamento");
      }
    } catch (err) {
      console.error("[DoctorServiceMenu]", err);
      toast.error("Erro ao processar pagamento. Tente novamente.");
    } finally {
      setLoadingSku(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICE_MENU.map((item) => {
          const Icon = ICONS[item.sku] ?? MessageSquare;
          const isLoading = loadingSku === item.sku;
          return (
            <Card
              key={item.sku}
              className={`relative border-border hover:border-primary/50 transition-all cursor-pointer hover:-translate-y-1 ${
                item.highlight ? "ring-2 ring-primary border-primary" : ""
              }`}
              onClick={() => !isLoading && handleSelect(item)}
            >
              {item.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black px-3 py-1 rounded-full">
                  Mais Popular
                </span>
              )}
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon size={22} className="text-primary" />
                </div>
                <h4 className="font-black text-foreground text-sm mb-1">{item.name}</h4>
                <p className="text-[11px] text-muted-foreground mb-2">{item.desc}</p>
                <div className="flex flex-wrap items-center justify-center gap-1 mb-3">
                  <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">
                    {item.duration}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-bold border-border text-muted-foreground gap-1">
                    <FileText size={10} />
                    {item.prescription ? "Com receita" : "Sem receita"}
                  </Badge>
                  {item.fixed ? (
                    <Badge variant="outline" className="text-[10px] font-bold border-border text-muted-foreground gap-1">
                      <Lock size={10} /> Valor padrão
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-bold border-amber-500/40 text-amber-400">
                      Definido pelo médico
                    </Badge>
                  )}
                </div>
                <p className="text-2xl font-display font-black text-gradient-green mb-3">
                  {formatBRL(priceOf(item))}
                </p>
                <Button
                  size="sm"
                  className="w-full font-black bg-primary text-primary-foreground rounded-xl text-xs"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 size={14} className="mr-1 animate-spin" /> Gerando…</>
                  ) : item.redirectToEdilson ? (
                    "Iniciar com Dr. Edilson ON"
                  ) : (
                    "Contratar Agora"
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {FIXED_SERVICE_NOTICE} Após o pagamento você passa pela triagem da Enfª Brisa e é direcionado
        à consulta com {doctorName}.
      </p>
    </div>
  );
}

export default DoctorServiceMenu;
