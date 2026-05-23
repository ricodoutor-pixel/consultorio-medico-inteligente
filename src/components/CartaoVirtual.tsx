import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { Eye, EyeOff, Smartphone, Wallet, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export interface CartaoVirtualProps {
  numeroCartao: string;       // ex: PYR-12345678
  nomeTitular: string;
  plano: "Verde" | "Raiz" | "Terra";
  validade: string;           // MM/AAAA
}

/** Token dinâmico que expira a cada 5 minutos (anti-print). */
function buildDynamicToken(numeroCartao: string) {
  const window5min = Math.floor(Date.now() / (5 * 60 * 1000));
  const raw = `${numeroCartao}.${window5min}`;
  // hash leve client-side (não-criptográfico, só para variar o QR)
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 31 + raw.charCodeAt(i)) | 0;
  return `${numeroCartao}|t=${window5min}|s=${(h >>> 0).toString(36)}`;
}

function maskNumber(num: string) {
  // PYR-12345678 -> PYR-12••••78
  const parts = num.split("-");
  if (parts.length !== 2) return num;
  const [prefix, digits] = parts;
  if (digits.length <= 4) return num;
  return `${prefix}-${digits.slice(0, 2)}${"•".repeat(digits.length - 4)}${digits.slice(-2)}`;
}

export function CartaoVirtual({ numeroCartao, nomeTitular, plano, validade }: CartaoVirtualProps) {
  const [flipped, setFlipped] = useState(false);
  const [masked, setMasked] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [token, setToken] = useState(() => buildDynamicToken(numeroCartao));
  const [secondsLeft, setSecondsLeft] = useState(0);
  const { toast } = useToast();

  const isMobile = useMemo(
    () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    [],
  );

  // Regenera token + QR a cada 5 minutos
  useEffect(() => {
    let alive = true;
    const regen = async () => {
      const t = buildDynamicToken(numeroCartao);
      const url = await QRCode.toDataURL(t, { width: 320, margin: 1, color: { dark: "#04080F", light: "#FFFFFF" } });
      if (!alive) return;
      setToken(t);
      setQrDataUrl(url);
    };
    regen();
    const interval = setInterval(regen, 5 * 60 * 1000);
    return () => { alive = false; clearInterval(interval); };
  }, [numeroCartao]);

  // Contador regressivo de expiração
  useEffect(() => {
    const tick = () => {
      const ms = 5 * 60 * 1000;
      const elapsed = Date.now() % ms;
      setSecondsLeft(Math.ceil((ms - elapsed) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const handleAddToWallet = (provider: "google" | "apple") => {
    toast({
      title: provider === "google" ? "Google Wallet" : "Apple Wallet",
      description:
        "Geração do passe digital em configuração. Use o QR Code dinâmico ao lado enquanto isso.",
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Cartão flip */}
      <div className="[perspective:1200px]">
        <motion.div
          className="relative w-full aspect-[1.586/1] cursor-pointer"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          onClick={() => setFlipped(f => !f)}
        >
          {/* Frente */}
          <div
            className="absolute inset-0 rounded-2xl p-5 flex flex-col justify-between shadow-xl"
            style={{
              backfaceVisibility: "hidden",
              background: "linear-gradient(135deg,#04080F 0%,#0a2a18 45%,#1B4332 100%)",
              border: "1px solid rgba(34,197,94,0.35)",
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-300/80">Cartão Saúde Plus</p>
                <p className="text-white font-bold text-lg leading-tight">Planta y Raiz</p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Plano {plano}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <p className="font-mono text-xl tracking-[0.2em] text-white">
                {masked ? maskNumber(numeroCartao) : numeroCartao}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); setMasked(m => !m); }}
                className="p-1 rounded hover:bg-white/10 text-emerald-300"
                aria-label={masked ? "Revelar número" : "Ocultar número"}
              >
                {masked ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] uppercase text-emerald-300/70">Titular</p>
                <p className="text-white text-sm font-semibold">{nomeTitular}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase text-emerald-300/70">Válido até</p>
                <p className="text-white text-sm font-semibold">{validade}</p>
              </div>
            </div>
            <p className="absolute bottom-1 right-3 text-[9px] text-emerald-300/50">Toque para virar</p>
          </div>

          {/* Verso */}
          <div
            className="absolute inset-0 rounded-2xl p-4 flex flex-col items-center justify-center shadow-xl"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "linear-gradient(135deg,#0a2a18 0%,#04080F 100%)",
              border: "1px solid rgba(34,197,94,0.35)",
            }}
          >
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code dinâmico do cartão" className="h-32 w-32 rounded bg-white p-1" />
            ) : (
              <div className="h-32 w-32 bg-white/10 animate-pulse rounded" />
            )}
            <p className="mt-2 text-[10px] text-emerald-300/80 font-mono break-all px-3 text-center">
              {token}
            </p>
            <p className="mt-1 text-[10px] text-emerald-300/60 flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Expira em {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, "0")}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Ações */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button
          onClick={() => handleAddToWallet("google")}
          className="bg-[#1a73e8] hover:bg-[#1765c1] text-white"
        >
          <Wallet className="h-4 w-4 mr-2" /> Google Wallet
        </Button>
        <Button
          onClick={() => handleAddToWallet("apple")}
          className="bg-black hover:bg-neutral-800 text-white"
        >
          <Wallet className="h-4 w-4 mr-2" /> Apple Wallet
        </Button>
      </div>

      {isMobile && (
        <Button
          variant="outline"
          className="w-full mt-2 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
          onClick={() => handleAddToWallet("google")}
        >
          <Smartphone className="h-4 w-4 mr-2" /> Abrir Wallet
        </Button>
      )}

      <p className="mt-3 text-[11px] text-center text-muted-foreground">
        QR Code dinâmico atualizado a cada 5 minutos para evitar fraude por print.
      </p>
    </div>
  );
}

export default CartaoVirtual;
