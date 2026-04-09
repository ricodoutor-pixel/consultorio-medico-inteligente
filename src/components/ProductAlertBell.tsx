import { useState, useEffect } from "react";
import { Bell, BellRing, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  category: "shopping" | "club";
}

export const ProductAlertBell = ({ category }: Props) => {
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data } = await supabase
      .from("product_alert_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data && data.is_active) {
      const cats = (data as any).categories as string[];
      if (cats?.includes(category)) {
        setIsSubscribed(true);
        setPhone((data as any).phone || "");
      }
    }
    setLoading(false);
  };

  const handleSubscribe = async () => {
    if (!userId) {
      toast({ title: "Faça login primeiro", description: "Você precisa estar logado para ativar alertas", variant: "destructive" });
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast({ title: "Número inválido", description: "Insira seu WhatsApp com DDD", variant: "destructive" });
      return;
    }

    setSaving(true);

    const formattedPhone = cleanPhone.startsWith("55") ? `+${cleanPhone}` : `+55${cleanPhone}`;

    // Check if subscription exists
    const { data: existing } = await supabase
      .from("product_alert_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const currentCats = (existing as any).categories as string[] || [];
      const newCats = currentCats.includes(category) ? currentCats : [...currentCats, category];
      await supabase
        .from("product_alert_subscriptions")
        .update({ phone: formattedPhone, categories: newCats, is_active: true, updated_at: new Date().toISOString() } as any)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("product_alert_subscriptions")
        .insert({ user_id: userId, phone: formattedPhone, categories: [category], channels: ["whatsapp"] } as any);
    }

    setIsSubscribed(true);
    setShowForm(false);
    setSaving(false);
    toast({ title: "🔔 Alertas ativados!", description: `Você receberá notificações WhatsApp de novos produtos no ${category === "shopping" ? "Shopping" : "Club"}` });
  };

  const handleUnsubscribe = async () => {
    if (!userId) return;
    setSaving(true);

    const { data: existing } = await supabase
      .from("product_alert_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const currentCats = ((existing as any).categories as string[] || []).filter((c: string) => c !== category);
      if (currentCats.length === 0) {
        await supabase.from("product_alert_subscriptions").update({ is_active: false, updated_at: new Date().toISOString() } as any).eq("user_id", userId);
      } else {
        await supabase.from("product_alert_subscriptions").update({ categories: currentCats, updated_at: new Date().toISOString() } as any).eq("user_id", userId);
      }
    }

    setIsSubscribed(false);
    setSaving(false);
    toast({ title: "Alertas desativados", description: "Você não receberá mais notificações de novos produtos" });
  };

  if (loading) return null;

  return (
    <div className="relative inline-flex">
      <Button
        variant={isSubscribed ? "default" : "outline"}
        size="sm"
        className={`gap-1.5 text-xs sm:text-sm ${isSubscribed ? "bg-primary text-primary-foreground" : ""}`}
        onClick={() => {
          if (isSubscribed) handleUnsubscribe();
          else if (!userId) {
            toast({ title: "Faça login primeiro", variant: "destructive" });
          } else setShowForm(!showForm);
        }}
        disabled={saving}
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isSubscribed ? (
          <BellRing size={14} className="animate-pulse" />
        ) : (
          <Bell size={14} />
        )}
        {isSubscribed ? "Alertas ON" : "Ativar Alertas"}
      </Button>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-xl p-4 z-50 w-72"
          >
            <p className="text-sm font-medium mb-1">🔔 Receba alertas via WhatsApp</p>
            <p className="text-xs text-muted-foreground mb-3">Novos produtos direto no seu celular</p>
            <Input
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mb-3 text-sm"
              type="tel"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubscribe} disabled={saving} className="flex-1 gap-1">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Ativar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
