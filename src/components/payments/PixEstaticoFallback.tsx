import { useEffect, useState } from "react";
import { AlertTriangle, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PixData {
  chave: string;
  tipo: string;
  favorecido: string;
}

/**
 * Exibido apenas quando mp_contingency_mode = true em system_settings.
 * Mostra a chave PIX estática para que vendas não se percam quando MP cai.
 */
export function PixEstaticoFallback() {
  const [pix, setPix] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase
      .from("system_settings")
      .select("value")
      .eq("key", "pix_estatico_fallback")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setPix(data.value as unknown as PixData);
      });
  }, []);

  const handleCopy = () => {
    if (!pix?.chave) return;
    navigator.clipboard.writeText(pix.chave);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!pix) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
      <div className="mb-2 flex items-center gap-2 text-amber-300">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-semibold">Pagamento em modo contingência</span>
      </div>
      <p className="mb-3 text-muted-foreground">
        Nosso processador está temporariamente indisponível. Use a chave PIX abaixo
        e envie o comprovante no WhatsApp da Enfª Brisa.
      </p>
      <div className="flex items-center justify-between gap-2 rounded-lg bg-background/50 p-3">
        <div>
          <div className="text-xs text-muted-foreground">Favorecido: {pix.favorecido}</div>
          <div className="font-mono text-foreground">{pix.chave}</div>
          <div className="text-xs uppercase text-muted-foreground">Tipo: {pix.tipo}</div>
        </div>
        <button
          onClick={handleCopy}
          className="rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-accent"
          aria-label="Copiar chave PIX"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
