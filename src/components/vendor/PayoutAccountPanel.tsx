import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function PayoutAccountPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [collectorId, setCollectorId] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [savedCollector, setSavedCollector] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await (supabase as any)
        .from("vendors")
        .select("id, mp_collector_id, pix_key")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setVendorId(data.id);
        setCollectorId(data.mp_collector_id || "");
        setSavedCollector(data.mp_collector_id || null);
        setPixKey(data.pix_key || "");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!vendorId) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("vendors")
        .update({ mp_collector_id: collectorId.trim() || null, pix_key: pixKey.trim() || null })
        .eq("id", vendorId);
      if (error) throw error;
      setSavedCollector(collectorId.trim() || null);
      toast({ title: "Conta de recebimento salva", description: "Os repasses de 95% serão enviados para esta conta." });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border bg-card/60">
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
          <Wallet className="text-emerald-400 w-5 h-5" /> Conta de Recebimento (Repasse 95%)
        </CardTitle>
        <CardDescription className="text-xs">
          Informe o ID de vendedor Mercado Pago da farmácia. Sem ele, as vendas ficam bloqueadas porque o repasse
          automático não pode ser feito.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando dados...
          </div>
        ) : (
          <>
            <div>
              {savedCollector ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-bold">
                  <CheckCircle2 size={11} className="mr-1" /> Conta vinculada · vendas liberadas
                </Badge>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px] font-bold">
                  <AlertTriangle size={11} className="mr-1" /> Conta pendente · vendas bloqueadas
                </Badge>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">ID de Vendedor Mercado Pago (collector_id)</Label>
                <Input
                  placeholder="Ex: 123456789"
                  value={collectorId}
                  onChange={(e) => setCollectorId(e.target.value)}
                  className="rounded-xl bg-muted/30 border-border text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Encontre em Mercado Pago → Seu negócio → Configurações → Credenciais (User ID).
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Chave Pix de saque</Label>
                <Input
                  placeholder="CNPJ, chave aleatória ou e-mail"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  className="rounded-xl bg-muted/30 border-border text-sm"
                />
              </div>
            </div>

            <Button onClick={save} disabled={saving} className="rounded-xl font-bold">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar conta de recebimento
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PayoutAccountPanel;
