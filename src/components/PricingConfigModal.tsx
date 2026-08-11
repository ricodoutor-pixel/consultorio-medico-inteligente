import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Percent, TrendingUp, Lock } from "lucide-react";
import { SERVICE_MENU, PREMIUM_SUGGESTED_PRICE, FIXED_SERVICE_NOTICE, formatBRL } from "@/lib/pricing";
import { supabase as _supabase } from "@/integrations/supabase/client";
const supabase: any = _supabase;
import { toast } from "sonner";

interface PricingConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: string;
}

export function PricingConfigModal({ open, onOpenChange, doctorId }: PricingConfigModalProps) {
  const [premiumPriceInput, setPremiumPriceInput] = useState(String(PREMIUM_SUGGESTED_PRICE));
  const [platformCommission, setPlatformCommission] = useState(20);
  const [loading, setLoading] = useState(false);

  // Valores dos serviços 1–4 são fixos (plataforma). Apenas o Premium é editável.
  const videoPrice = 150;
  const chatPrice = 100;
  const premiumPrice = parseFloat(premiumPriceInput) || 0;
  const videoFee = videoPrice * (platformCommission / 100);
  const videoEarnings = videoPrice - videoFee;
  const chatFee = chatPrice * (platformCommission / 100);
  const chatEarnings = chatPrice - chatFee;
  const premiumFee = premiumPrice * (platformCommission / 100);
  const premiumEarnings = premiumPrice - premiumFee;

  useEffect(() => {
    if (open && doctorId) {
      loadPricingConfig();
    }
  }, [open, doctorId]);

  const loadPricingConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("price_video_chat, platform_commission_percentage")
        .eq("id", doctorId)
        .single();

      if (error) throw error;

      if (data) {
        setPremiumPriceInput(data.price_video_chat?.toString() || String(PREMIUM_SUGGESTED_PRICE));
        setPlatformCommission(data.platform_commission_percentage || 20);
      }
    } catch (err) {
      console.error("Erro ao carregar configuração de preço:", err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("doctors")
        .update({
          // Serviços padronizados pela plataforma (não editáveis pelo médico)
          consultation_price: 100,
          price_chat_only: 100,
          price_return: 90,
          // Consulta Premium — único valor definido pelo profissional
          price_video_chat: Math.min(2000, Math.max(100, premiumPrice || PREMIUM_SUGGESTED_PRICE)),
          platform_commission_percentage: platformCommission,
        })
        .eq("id", doctorId);

      if (error) throw error;

      toast.success("✅ Preços atualizados com sucesso!");
      onOpenChange(false);
    } catch (err) {
      console.error("Erro ao salvar preços:", err);
      toast.error("Erro ao salvar configuração de preços");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Configurar Preços de Consulta
          </DialogTitle>
          <DialogDescription>
            Os valores dos serviços 1 a 4 são padronizados pela plataforma. Você define apenas a Consulta Premium (Vídeo + Chat).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuração de Preços */}
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-black text-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" /> Tabela oficial (valores fixos)
              </p>
              {SERVICE_MENU.filter((sv) => sv.fixed).map((sv, i) => (
                <div key={sv.sku} className="flex items-center justify-between gap-3 text-xs py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">
                    {i + 1}. <span className="text-foreground font-semibold">{sv.name}</span> · {sv.duration}
                  </span>
                  <span className="font-bold text-primary">{formatBRL(sv.price)}</span>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground">{FIXED_SERVICE_NOTICE}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="premium-price">Consulta Premium (Vídeo + Chat) — R$</Label>
              <Input
                id="premium-price"
                type="number"
                step="1"
                min="100"
                max="2000"
                value={premiumPriceInput}
                onChange={(e) => setPremiumPriceInput(e.target.value)}
                className="text-lg font-semibold"
                placeholder="180"
              />
              <p className="text-xs text-muted-foreground">Sugerido R$ 180 · mínimo R$ 100 · máximo R$ 2.000</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission">Taxa da Plataforma (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="commission"
                  type="number"
                  step="1"
                  min="0"
                  max="50"
                  value={platformCommission}
                  onChange={(e) => setPlatformCommission(parseInt(e.target.value) || 0)}
                  className="text-lg font-semibold"
                />
                <span className="text-sm font-medium text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">Padrão: 20% (você recebe 80%)</p>
            </div>
          </div>

          {/* Preview de Split */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-blue-50/50 border-blue-200/50 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Consulta por Vídeo</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-900 border-blue-300">
                    Video
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Final:</span>
                    <span className="font-semibold">R$ {videoPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span className="text-muted-foreground">Taxa Plataforma ({platformCommission}%):</span>
                    <span className="font-semibold">-R$ {videoFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 flex justify-between text-green-700">
                    <span className="font-semibold">Você Recebe:</span>
                    <span className="font-bold text-lg">R$ {videoEarnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-purple-50/50 border-purple-200/50 rounded-lg">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-900">Consulta por Chat</span>
                  <Badge variant="outline" className="bg-purple-100 text-purple-900 border-purple-300">
                    Chat
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Final:</span>
                    <span className="font-semibold">R$ {chatPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span className="text-muted-foreground">Taxa Plataforma ({platformCommission}%):</span>
                    <span className="font-semibold">-R$ {chatFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-purple-200 pt-2 flex justify-between text-green-700">
                    <span className="font-semibold">Você Recebe:</span>
                    <span className="font-bold text-lg">R$ {chatEarnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-4 bg-amber-50/50 border-amber-200/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-900">Consulta Premium (Vídeo + Chat)</span>
              <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300">Premium</Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Final:</span>
                <span className="font-semibold">R$ {premiumPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-700">
                <span className="text-muted-foreground">Taxa Plataforma ({platformCommission}%):</span>
                <span className="font-semibold">-R$ {premiumFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-amber-200 pt-2 flex justify-between text-green-700">
                <span className="font-semibold">Você Recebe:</span>
                <span className="font-bold text-lg">R$ {premiumEarnings.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Info sobre Participação nos Lucros */}
          <Card className="p-4 bg-green-50/50 border-green-200/50 rounded-lg">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-green-900 flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Participação nos Lucros
                </p>
                <p className="text-sm text-green-800">
                  Você recebe bonus mensal por desempenho: <strong>5% a 15%</strong> de lucro adicional conforme número de consultas.
                </p>
                <ul className="text-xs text-green-700 mt-2 space-y-1 ml-4">
                  <li>• 15+ consultas: +5% bonus</li>
                  <li>• 30+ consultas: +10% bonus</li>
                  <li>• 50+ consultas: +15% bonus</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            {loading ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PricingConfigModal;
