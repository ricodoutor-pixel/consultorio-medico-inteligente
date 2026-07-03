import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, DollarSign, Percent, TrendingUp } from "lucide-react";
import { supabase as _supabase } from "@/integrations/supabase/client";
const supabase: any = _supabase;
import { toast } from "sonner";

interface PricingConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: string;
}

export function PricingConfigModal({ open, onOpenChange, doctorId }: PricingConfigModalProps) {
  const [videoPriceInput, setVideoPriceInput] = useState("150.00");
  const [chatPriceInput, setChatPriceInput] = useState("100.00");
  const [platformCommission, setPlatformCommission] = useState(20);
  const [loading, setLoading] = useState(false);

  // Calcular valores
  const videoPrice = parseFloat(videoPriceInput) || 0;
  const chatPrice = parseFloat(chatPriceInput) || 0;
  const videoFee = videoPrice * (platformCommission / 100);
  const videoEarnings = videoPrice - videoFee;
  const chatFee = chatPrice * (platformCommission / 100);
  const chatEarnings = chatPrice - chatFee;

  useEffect(() => {
    if (open && doctorId) {
      loadPricingConfig();
    }
  }, [open, doctorId]);

  const loadPricingConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("consultation_price_video, consultation_price_chat, platform_commission_percentage")
        .eq("id", doctorId)
        .single();

      if (error) throw error;

      if (data) {
        setVideoPriceInput(data.consultation_price_video?.toString() || "150.00");
        setChatPriceInput(data.consultation_price_chat?.toString() || "100.00");
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
          consultation_price_video: parseFloat(videoPriceInput),
          consultation_price_chat: parseFloat(chatPriceInput),
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
            Defina o valor final da consulta (vídeo/chat). O sistema calcula automaticamente o split entre você e a plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Aviso sobre Orientação Técnica */}
          <Card className="p-4 bg-amber-50/50 border-amber-200/50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-900">Orientação Técnica</p>
                <p className="text-sm text-amber-800">
                  A taxa de "Orientação Técnica" tem valor fixo de <strong>R$ 30</strong> ou <strong>US$ 10</strong>, cobrado separadamente pela plataforma e é exclusiva do Dr. Edilson Bezerra.
                </p>
              </div>
            </div>
          </Card>

          {/* Configuração de Preços */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-price">Preço da Consulta por Vídeo (R$)</Label>
              <Input
                id="video-price"
                type="number"
                step="0.01"
                min="0"
                value={videoPriceInput}
                onChange={(e) => setVideoPriceInput(e.target.value)}
                className="text-lg font-semibold"
                placeholder="150.00"
              />
              <p className="text-xs text-muted-foreground">Valor mínimo recomendado: R$ 100</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chat-price">Preço da Consulta por Chat (R$)</Label>
              <Input
                id="chat-price"
                type="number"
                step="0.01"
                min="0"
                value={chatPriceInput}
                onChange={(e) => setChatPriceInput(e.target.value)}
                className="text-lg font-semibold"
                placeholder="100.00"
              />
              <p className="text-xs text-muted-foreground">Valor mínimo recomendado: R$ 70</p>
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
