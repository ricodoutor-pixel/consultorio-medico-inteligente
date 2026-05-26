import { useEffect, useState, lazy, Suspense } from "react";

const WidgetMonitorRapido = lazy(() => import("@/components/WidgetMonitorRapido"));
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import CartaoVirtual from "@/components/CartaoVirtual";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, ShoppingBag, ShieldCheck, Copy } from "lucide-react";

type Sub = {
  id: string;
  card_number: string;
  plan_type: "individual" | "familiar";
  billing_cycle: "monthly" | "annual";
  amount: number;
  status: "pending" | "active" | "cancelled" | "expired" | "past_due";
  current_period_end: string | null;
};

const PLANS = [
  { id: "individual", label: "Individual", monthly: 24.9, annual: 24.9 * 12 },
  { id: "familiar", label: "Familiar (até 4)", monthly: 34.9, annual: 29.9 * 12 },
] as const;

export default function MeuCartao() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("Assinante Planta y Raiz");
  const [sub, setSub] = useState<Sub | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [creatingSub, setCreatingSub] = useState(false);
  const [pix, setPix] = useState<{ qr_base64?: string; qr_code?: string } | null>(null);
  const [loadAmount, setLoadAmount] = useState(50);
  const [loadingPix, setLoadingPix] = useState(false);
  const [walletPix, setWalletPix] = useState<{ qr_base64?: string; qr_code?: string } | null>(null);

  const refresh = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const meta = (user.user_metadata || {}) as Record<string, string>;
    setNome(meta.full_name || user.email?.split("@")[0] || "Assinante");

    const { data: subs } = await supabase
      .from("health_card_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    setSub((subs?.[0] as Sub) || null);

    const { data: wallet } = await supabase
      .from("health_card_wallet")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    setWalletBalance(Number(wallet?.balance || 0));
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const subscribe = async (plan_type: "individual" | "familiar", billing_cycle: "monthly" | "annual") => {
    setCreatingSub(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-saude-plus-subscription", {
        body: { plan_type, billing_cycle },
      });
      if (error) throw error;
      setPix({ qr_base64: data.payment?.qr_base64, qr_code: data.payment?.qr_code });
      toast({ title: "PIX gerado", description: "Pague para ativar seu cartão." });
      refresh();
    } catch (e) {
      toast({ title: "Erro", description: String((e as Error).message), variant: "destructive" });
    } finally {
      setCreatingSub(false);
    }
  };

  const loadWallet = async () => {
    setLoadingPix(true);
    try {
      const { data, error } = await supabase.functions.invoke("load-wallet-pix", {
        body: { amount: loadAmount },
      });
      if (error) throw error;
      setWalletPix({ qr_base64: data.qr_base64, qr_code: data.qr_code });
      toast({ title: "PIX de carga gerado", description: `R$ ${loadAmount.toFixed(2)}` });
    } catch (e) {
      toast({ title: "Erro", description: String((e as Error).message), variant: "destructive" });
    } finally {
      setLoadingPix(false);
    }
  };

  const copyPix = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast({ title: "Código PIX copiado" });
  };

  const isActive = sub?.status === "active";

  return (
    <main className="min-h-[100dvh] bg-[#04080F] text-white px-4 py-8 pb-24">
      <Helmet>
        <title>Meu Cartão Saúde Plus | Planta y Raiz</title>
        <meta name="description" content="Cartão Saúde Plus virtual com QR dinâmico, descontos em clínicas e saldo PIX para farmácia." />
      </Helmet>

      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-1">Meu Cartão Saúde Plus</h1>
        <p className="text-center text-sm text-emerald-300/80 mb-6">
          Descontos em clínicas + saldo PIX para farmácia.
        </p>

        <Suspense fallback={null}>
          <div className="mb-5">
            <WidgetMonitorRapido />
          </div>
        </Suspense>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
          </div>
        ) : isActive && sub ? (
          <>
            <CartaoVirtual
              numeroCartao={sub.card_number}
              nomeTitular={nome}
              plano={sub.plan_type === "familiar" ? "Terra" : "Raiz"}
              validade={sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" }) : "12/2027"}
            />

            {/* Carteira */}
            <section className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-semibold">Saldo Farmácia</span>
                </div>
                <span className="text-xl font-bold text-white">R$ {walletBalance.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-emerald-300/70 mb-3 flex items-center gap-1">
                <ShoppingBag className="h-3 w-3" /> Use o mesmo cartão para compras em farmácia (débito automático).
              </p>
              <div className="flex gap-2">
                <input
                  type="number" min={10} max={5000} step={10}
                  value={loadAmount}
                  onChange={(e) => setLoadAmount(Number(e.target.value))}
                  className="flex-1 rounded-lg bg-black/40 border border-emerald-500/30 px-3 py-2 text-white text-sm"
                  placeholder="Valor R$"
                />
                <Button onClick={loadWallet} disabled={loadingPix} className="bg-emerald-500 hover:bg-emerald-600 text-black">
                  {loadingPix ? <Loader2 className="h-4 w-4 animate-spin" /> : "Carregar PIX"}
                </Button>
              </div>
              {walletPix?.qr_base64 && (
                <div className="mt-3 text-center">
                  <img src={`data:image/png;base64,${walletPix.qr_base64}`} alt="QR Pix carga" className="mx-auto h-40 w-40 rounded bg-white p-1" />
                  <button onClick={() => copyPix(walletPix.qr_code)} className="mt-2 text-xs text-emerald-300 inline-flex items-center gap-1">
                    <Copy className="h-3 w-3" /> Copiar código PIX
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#0a2a18] to-[#04080F] p-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-bold">Ative seu Cartão Saúde Plus</h2>
            </div>
            <ul className="text-sm text-emerald-100/80 space-y-1 mb-4 list-disc list-inside">
              <li>Até 80% off em consultas, exames e terapias</li>
              <li>Até 60% off em medicamentos</li>
              <li>Saldo PIX para compras em farmácia</li>
              <li>Rede de 3.000+ parceiros</li>
            </ul>

            <div className="space-y-3">
              {PLANS.map((p) => (
                <div key={p.id} className="rounded-xl border border-emerald-500/20 p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{p.label}</span>
                    <span className="text-emerald-300 text-sm">R$ {p.monthly.toFixed(2)}/mês</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm" disabled={creatingSub}
                      onClick={() => subscribe(p.id as "individual" | "familiar", "monthly")}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black"
                    >
                      Mensal
                    </Button>
                    <Button
                      size="sm" variant="outline" disabled={creatingSub}
                      onClick={() => subscribe(p.id as "individual" | "familiar", "annual")}
                      className="flex-1 border-emerald-500/40 text-emerald-300"
                    >
                      Anual R$ {p.annual.toFixed(2)}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {pix?.qr_base64 && (
              <div className="mt-5 text-center">
                <p className="text-xs text-emerald-300 mb-2">Pague o PIX para ativar:</p>
                <img src={`data:image/png;base64,${pix.qr_base64}`} alt="QR Pix" className="mx-auto h-48 w-48 rounded bg-white p-1" />
                <button onClick={() => copyPix(pix.qr_code)} className="mt-2 text-xs text-emerald-300 inline-flex items-center gap-1">
                  <Copy className="h-3 w-3" /> Copiar código PIX
                </button>
                <p className="text-[11px] text-emerald-300/60 mt-2">Cartão libera automaticamente após confirmação.</p>
              </div>
            )}

            {sub?.status === "pending" && !pix && (
              <p className="mt-4 text-center text-xs text-amber-300">
                Você tem uma assinatura pendente. Pague o PIX para ativar.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
