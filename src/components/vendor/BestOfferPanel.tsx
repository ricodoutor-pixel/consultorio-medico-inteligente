import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, Sparkles, Package, Loader2, Tag } from "lucide-react";
import { resolveProductImg } from "@/lib/productImages";

const MASTER_EMAIL = "contato@plantayraiz.com.br";

type OfferLabel = "oferta" | "promocao";

interface OfferProduct {
  id: string;
  name: string;
  price: number | string;
  image_url: string | null;
  category: string | null;
  is_featured_offer: boolean;
  offer_label: OfferLabel;
}

export function BestOfferPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [products, setProducts] = useState<OfferProduct[]>([]);
  const [label, setLabel] = useState<OfferLabel>("oferta");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Faça login com a conta da farmácia para definir sua melhor oferta.");
        return;
      }
      const isMaster = (user.email || "").toLowerCase() === MASTER_EMAIL;
      let q = (supabase as any).from("vendors").select("id").order("created_at", { ascending: true }).limit(1);
      if (!isMaster) q = q.eq("user_id", user.id);
      const { data: vendorRows } = await q;
      const vId = (vendorRows || [])[0]?.id as string | undefined;
      if (!vId) {
        setError("Nenhuma farmácia vinculada a esta conta.");
        return;
      }
      setVendorId(vId);

      const { data } = await (supabase as any)
        .from("vendor_products")
        .select("id, name, price, image_url, category, is_featured_offer, offer_label")
        .eq("vendor_id", vId)
        .order("created_at", { ascending: false })
        .limit(10);

      const list = (data || []) as OfferProduct[];
      setProducts(list);
      const current = list.find((p) => p.is_featured_offer);
      if (current?.offer_label) setLabel(current.offer_label);
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const featured = products.find((p) => p.is_featured_offer) || null;

  const applyOffer = async (productId: string, newLabel: OfferLabel) => {
    if (!vendorId) return;
    setSaving(productId);
    try {
      await (supabase as any)
        .from("vendor_products")
        .update({ is_featured_offer: false })
        .eq("vendor_id", vendorId)
        .neq("id", productId);

      const { error: upErr } = await (supabase as any)
        .from("vendor_products")
        .update({ is_featured_offer: true, offer_label: newLabel })
        .eq("id", productId);
      if (upErr) throw upErr;

      toast({
        title: "Melhor oferta atualizada!",
        description: "O produto já aparece no card da farmácia e na vitrine.",
      });
      await load();
    } catch (e: any) {
      toast({ title: "Não foi possível salvar", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card className="border-emerald-500/30 bg-emerald-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-emerald-400">
          <Sparkles size={18} /> Sua Melhor Oferta
        </CardTitle>
        <CardDescription>
          Escolha 1 dos seus produtos para ficar em destaque no card da farmácia e na vitrine do Shopping.
          Você pode trocar quando quiser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-6">
            <Loader2 size={16} className="animate-spin" /> Carregando produtos...
          </div>
        ) : error ? (
          <p className="text-sm text-amber-400 py-4">{error}</p>
        ) : (
          <>
            {/* Selo exibido */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <Tag size={12} className="text-emerald-400" /> Selo exibido junto ao produto
              </Label>
              <div className="flex gap-2">
                {(["oferta", "promocao"] as OfferLabel[]).map((opt) => (
                  <Button
                    key={opt}
                    type="button"
                    size="sm"
                    variant={label === opt ? "default" : "outline"}
                    className="rounded-xl text-xs font-bold"
                    onClick={() => {
                      setLabel(opt);
                      if (featured) applyOffer(featured.id, opt);
                    }}
                  >
                    {opt === "oferta" ? "Oferta" : "Promoção"}
                  </Button>
                ))}
              </div>
            </div>

            {/* Destaque atual */}
            <div className="rounded-2xl border border-emerald-500/30 bg-background/60 p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-bold">
                Em destaque agora
              </p>
              {featured ? (
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
                    <img src={resolveProductImg(featured.image_url)} alt={featured.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{featured.name}</p>
                    <p className="text-sm text-emerald-400 font-bold">
                      R$ {Number(featured.price || 0).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <Badge className="ml-auto bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                    {(featured.offer_label || "oferta") === "promocao" ? "Promoção" : "Oferta"}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum produto em destaque ainda.</p>
              )}
            </div>

            {/* Lista de produtos */}
            <div className="space-y-2">
              {products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
                  <Package size={28} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Cadastre produtos no Catálogo para escolher sua melhor oferta.</p>
                </div>
              ) : (
                products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/60"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border">
                      <img src={resolveProductImg(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {Number(p.price || 0).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    {p.is_featured_offer ? (
                      <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                        <Star size={10} className="mr-1" fill="currentColor" /> Em destaque
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] font-bold rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                        disabled={saving === p.id}
                        onClick={() => applyOffer(p.id, label)}
                      >
                        {saving === p.id ? <Loader2 size={12} className="animate-spin" /> : "Destacar"}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default BestOfferPanel;
