import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, Package, Loader2, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  delivery_time: number;
  company: string;
}

interface ShippingCalculatorProps {
  onSelectShipping: (option: ShippingOption) => void;
  cartTotal: number;
}

export function ShippingCalculator({ onSelectShipping, cartTotal }: ShippingCalculatorProps) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateShipping = useCallback(async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      toast({ title: "CEP inválido", description: "Digite um CEP com 8 dígitos.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Simulated Melhor Envio response (mock until API key is configured)
      // In production, this would call the Melhor Envio API
      const mockOptions: ShippingOption[] = [
        {
          id: "pac",
          name: "PAC",
          price: cartTotal > 200 ? 0 : 18.90,
          delivery_time: 8,
          company: "Correios",
        },
        {
          id: "sedex",
          name: "SEDEX",
          price: 32.50,
          delivery_time: 3,
          company: "Correios",
        },
        {
          id: "jadlog",
          name: "Jadlog Package",
          price: 24.90,
          delivery_time: 5,
          company: "Jadlog",
        },
      ];

      setOptions(mockOptions);
    } catch {
      toast({ title: "Erro ao calcular frete", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [cep, cartTotal, toast]);

  const handleSelect = (option: ShippingOption) => {
    setSelected(option.id);
    onSelectShipping(option);
  };

  const formatCep = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 8);
    return clean.length > 5 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : clean;
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <MapPin size={16} className="text-primary" />
          Calcular Frete
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="00000-000"
            value={cep}
            onChange={(e) => setCep(formatCep(e.target.value))}
            className="bg-background border-border"
            maxLength={9}
          />
          <Button onClick={calculateShipping} disabled={loading} variant="outline" className="border-primary/30 text-primary shrink-0">
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Calcular"}
          </Button>
        </div>

        {options.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  selected === opt.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    {opt.name === "SEDEX" ? <Truck size={14} className="text-primary" /> : <Package size={14} className="text-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{opt.name}</p>
                    <p className="text-xs text-muted-foreground">{opt.company} • {opt.delivery_time} dias úteis</p>
                  </div>
                </div>
                <span className="text-sm font-black text-primary">
                  {opt.price === 0 ? "GRÁTIS" : `R$ ${opt.price.toFixed(2)}`}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
