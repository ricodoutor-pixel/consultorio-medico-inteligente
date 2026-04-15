import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, DollarSign, TrendingUp, Clock, CheckCircle2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface EarningEvent {
  id: string;
  amount: number;
  level: number;
  status: string;
  created_at: string;
}

interface WithdrawalStatus {
  id: string;
  amount: number;
  status: string;
  pix_key: string | null;
  created_at: string;
  processed_at: string | null;
}

export const EarningsNotificationBell = ({ userId }: { userId: string | undefined }) => {
  const [earnings, setEarnings] = useState<EarningEvent[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalStatus[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [lastChecked, setLastChecked] = useState<string>(new Date(Date.now() - 86400000).toISOString());

  const fetchData = useCallback(async () => {
    if (!userId) return;

    const [commRes, wdRes] = await Promise.all([
      supabase
        .from("affiliate_commissions")
        .select("id, amount, level, status, created_at")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("affiliate_withdrawals")
        .select("id, amount, status, pix_key, created_at, processed_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (commRes.data) {
      const newOnes = (commRes.data as EarningEvent[]).filter(
        (e) => e.created_at > lastChecked
      );
      if (newOnes.length > 0) {
        const total = newOnes.reduce((s, e) => s + Number(e.amount), 0);
        toast.success(`💰 Nova comissão! +R$ ${total.toFixed(2)}`, {
          description: `${newOnes.length} nova(s) comissão(ões) recebida(s).`,
        });
        setNewCount(newOnes.length);
      }
      setEarnings(commRes.data as EarningEvent[]);
    }

    if (wdRes.data) {
      const recentPaid = (wdRes.data as WithdrawalStatus[]).filter(
        (w) => w.status === "paid" && w.processed_at && w.processed_at > lastChecked
      );
      for (const w of recentPaid) {
        toast.success(`✅ Saque de R$ ${Number(w.amount).toFixed(2)} confirmado via PIX!`);
      }
      setWithdrawals(wdRes.data as WithdrawalStatus[]);
    }

    setLastChecked(new Date().toISOString());
  }, [userId, lastChecked]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: "Pendente", color: "text-yellow-500" },
      processing: { label: "Processando", color: "text-blue-500" },
      paid: { label: "Pago ✅", color: "text-primary" },
      rejected: { label: "Rejeitado", color: "text-destructive" },
    };
    return map[s] || { label: s, color: "text-muted-foreground" };
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => { setShowPanel(!showPanel); setNewCount(0); }}
      >
        <Bell size={18} />
        {newCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
            {newCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-10 w-80 z-50"
          >
            <Card className="bg-card border-border shadow-xl">
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground flex items-center gap-2">
                    <DollarSign size={14} className="text-primary" /> Ganhos
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowPanel(false)}>
                    <X size={14} />
                  </Button>
                </div>

                {/* Recent Commissions */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">Comissões Recentes</p>
                  {earnings.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhuma comissão ainda.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {earnings.slice(0, 5).map((e) => (
                        <div key={e.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <TrendingUp size={12} className="text-primary" />
                            <div>
                              <p className="text-xs font-medium text-foreground">
                                +R$ {Number(e.amount).toFixed(2)}
                              </p>
                              <p className="text-[9px] text-muted-foreground">Nível {e.level}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[8px]">
                            {statusLabel(e.status).label}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Withdrawal Status */}
                {withdrawals.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">Status dos Saques</p>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto">
                      {withdrawals.map((w) => {
                        const st = statusLabel(w.status);
                        return (
                          <div key={w.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                            <div className="flex items-center gap-2">
                              {w.status === "paid" ? (
                                <CheckCircle2 size={12} className="text-primary" />
                              ) : (
                                <Clock size={12} className="text-muted-foreground" />
                              )}
                              <p className="text-xs text-foreground">R$ {Number(w.amount).toFixed(2)}</p>
                            </div>
                            <span className={`text-[10px] font-medium ${st.color}`}>{st.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
