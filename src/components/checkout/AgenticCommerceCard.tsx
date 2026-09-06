import { useState } from "react";
import { ShieldCheck, Zap, ArrowRight, Pill, Truck, CreditCard, QrCode, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface AgenticCommerceCardProps {
  orderId: string;
  productName: string;
  amount: number;
  pharmacyName?: string;
  deliveryEstimate?: string;
  regulatoryHash?: string;
  paymentMethod?: string;
}

export const AgenticCommerceCard = ({
  orderId,
  productName,
  amount,
  pharmacyName = "Farmácia Oficial Planta y Raíz Dispensary",
  deliveryEstimate = "2 a 4 dias úteis",
  regulatoryHash,
}: AgenticCommerceCardProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handle1ClickCheckout = (method: "pix" | "google_pay" | "card") => {
    setLoading(true);
    // Redireciona para o checkout protegido com o ID da ordem agêntica validada
    navigate(`/pagamento?agentic_order_id=${encodeURIComponent(orderId)}&method=${method}`);
  };

  return (
    <div className="my-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-950 border border-emerald-500/30 shadow-xl text-left space-y-3">
      {/* Badge Regulatório */}
      <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1.5 py-0.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Receita Validada · SHA-512 ICP-Brasil
        </Badge>
        <span className="text-[10px] text-zinc-400 font-mono">UCP v1.0</span>
      </div>

      {/* Detalhes do Produto */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
          <Pill className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-white leading-snug truncate">
            {productName}
          </h4>
          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
            <Truck className="w-3 h-3 text-emerald-500" />
            {pharmacyName} · {deliveryEstimate}
          </p>
        </div>
      </div>

      {/* Valor e Preço Oficial */}
      <div className="flex items-baseline justify-between bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
        <span className="text-xs text-zinc-400 font-medium">Valor Oficial Server-Side:</span>
        <span className="text-lg font-black text-emerald-400">
          R$ {amount.toFixed(2).replace(".", ",")}
        </span>
      </div>

      {/* Botões de Ação Rápida em 1 Clique */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <Button
          onClick={() => handle1ClickCheckout("pix")}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950"
        >
          <QrCode className="w-3.5 h-3.5" />
          Pagar com PIX em 1 Clique
        </Button>
        <Button
          onClick={() => handle1ClickCheckout("google_pay")}
          disabled={loading}
          variant="outline"
          className="w-full border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-white font-semibold text-xs h-9 rounded-xl flex items-center justify-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Google Pay / Cartão
        </Button>
      </div>

      {regulatoryHash && (
        <p className="text-[9px] text-zinc-400 truncate font-mono">
          Hash: {regulatoryHash.slice(0, 32)}...
        </p>
      )}
    </div>
  );
};
