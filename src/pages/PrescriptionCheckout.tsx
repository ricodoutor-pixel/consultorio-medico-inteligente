import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { MercadoPagoCheckout } from "@/components/MercadoPagoCheckout";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Clock, Shield, Leaf } from "lucide-react";

interface CartItem {
  product_name: string;
  quantity: number;
  dosage?: string;
  unit_price?: number;
}

interface PrescriptionCart {
  id: string;
  cart_token: string;
  items: CartItem[];
  total_amount: number;
  discount_percent: number;
  status: string;
  expires_at: string;
}

export default function PrescriptionCheckout() {
  const { token } = useParams<{ token: string }>();
  const [cart, setCart] = useState<PrescriptionCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data, error: err } = await supabase.functions.invoke("prescription-to-cart", {
          body: { action: "get_cart", cart_token: token },
        });
        if (err || !data?.cart) {
          setError("Carrinho não encontrado ou expirado.");
          return;
        }
        setCart(data.cart as PrescriptionCart);
      } catch {
        setError("Erro ao carregar carrinho.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Countdown timer
  useEffect(() => {
    if (!cart?.expires_at) return;
    const interval = setInterval(() => {
      const diff = new Date(cart.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expirado");
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [cart?.expires_at]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <div className="pt-28 pb-16 max-w-2xl mx-auto px-4 space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (error || !cart) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <div className="pt-28 pb-16 flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-4 px-4">
            <ShoppingCart size={64} className="mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground">{error || "Carrinho não encontrado"}</h1>
            <p className="text-muted-foreground">O link pode ter expirado ou já foi utilizado.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const items = (cart.items as any as CartItem[]) || [];

  return (
    <div className="min-h-dvh bg-background">
      <PaymentTestModeBanner />
      <Navbar />
      <section className="pt-28 pb-16 max-w-2xl mx-auto px-4">
        {/* Timer de urgência */}
        {timeLeft && timeLeft !== "Expirado" && (
          <div className="mb-6 flex items-center justify-center gap-2 bg-destructive/10 border border-destructive/30 rounded-xl p-3">
            <Clock size={18} className="text-destructive" />
            <span className="text-destructive font-bold text-sm">Oferta expira em {timeLeft}</span>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Leaf size={16} className="text-primary" />
            <span className="text-primary text-sm font-medium">Prescrição Personalizada</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Seu Carrinho Exclusivo</h1>
          <p className="text-muted-foreground mt-2">Produtos prescritos pelo seu médico, prontos para compra</p>
        </div>

        {/* Items list */}
        <div className="space-y-3 mb-6">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
              <div>
                <p className="font-medium text-foreground">{item.product_name}</p>
                {item.dosage && <p className="text-xs text-muted-foreground">{item.dosage}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Qtd: {item.quantity}</p>
                {item.unit_price && (
                  <p className="font-bold text-foreground">R$ {(item.unit_price * item.quantity).toFixed(2)}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-2">
          {cart.discount_percent > 0 && (
            <div className="flex justify-between text-sm text-primary">
              <span>Desconto assinante</span>
              <span>-{cart.discount_percent}%</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">R$ {(cart.total_amount || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-4 mb-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield size={14} className="text-primary" />
            <span>Pagamento seguro</span>
          </div>
          <span>•</span>
          <span>Criptografia SSL</span>
          <span>•</span>
          <span>LGPD Compliance</span>
        </div>

        {!showPayment ? (
          <button
            onClick={() => setShowPayment(true)}
            disabled={timeLeft === "Expirado"}
            className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-lg transition-all disabled:opacity-50"
          >
            {timeLeft === "Expirado" ? "Oferta Expirada" : "💳 Pagar Agora"}
          </button>
        ) : (
          <div className="rounded-xl overflow-hidden border border-border">
            <MercadoPagoCheckout
              cartToken={token}
              label={`Pagar R$ ${(cart.total_amount || 0).toFixed(2)} com Mercado Pago`}
            />
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}
