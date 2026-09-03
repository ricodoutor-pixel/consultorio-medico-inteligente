import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, Loader2 } from "lucide-react";
import {
  formatCep,
  isValidCep,
  quoteShipping,
  sanitizeCep,
  type ShippingOption,
} from "@/lib/shipping-quote";

interface ShippingCalculatorProps {
  subtotal: number;
  weightKg?: number;
  compact?: boolean;
  onSelect?: (option: ShippingOption, cep: string) => void;
}

/**
 * Cálculo automático de frete e prazo por CEP.
 * O valor integral do frete é repassado à farmácia responsável pela dispensação.
 */
export function ShippingCalculator({
  subtotal,
  weightKg = 0.5,
  compact = false,
  onSelect,
}: ShippingCalculatorProps) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [place, setPlace] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const handleQuote = async () => {
    setError(null);
    if (!isValidCep(cep)) {
      setError("Informe um CEP válido (8 dígitos).");
      return;
    }
    setLoading(true);
    try {
      const quote = await quoteShipping(cep, subtotal, weightKg);
      setOptions(quote.options);
      setPlace(quote.city && quote.state ? `${quote.city} / ${quote.state}` : null);
      const first = quote.options[0];
      if (first) {
        setSelected(`${first.carrier}-${first.service}`);
        onSelect?.(first, sanitizeCep(cep));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível calcular o frete.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Truck size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={formatCep(cep)}
            onChange={(e) => setCep(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleQuote(); }}
            placeholder="CEP de entrega"
            inputMode="numeric"
            maxLength={9}
            className="h-9 pl-8 text-sm"
            aria-label="CEP de entrega"
          />
        </div>
        <Button size="sm" variant="outline" onClick={handleQuote} disabled={loading}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Calcular"}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {place && <p className="text-[11px] text-muted-foreground">Entrega em {place}</p>}

      {options.length > 0 && (
        <div className="space-y-1.5">
          {options.map((opt) => {
            const key = `${opt.carrier}-${opt.service}`;
            const active = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelected(key);
                  onSelect?.(opt, sanitizeCep(cep));
                }}
                className={`flex w-full items-center justify-between rounded-lg border p-2.5 text-left text-xs transition-colors ${
                  active
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/50 bg-muted/20 hover:bg-muted/40"
                }`}
              >
                <span className="font-medium text-foreground">
                  {opt.carrier} {opt.service}
                  <span className="ml-1.5 text-muted-foreground">· até {opt.days} dias úteis</span>
                </span>
                <span className="font-bold text-primary">
                  {opt.price === 0 ? "Grátis" : `R$ ${opt.price.toFixed(2)}`}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ShippingCalculator;
