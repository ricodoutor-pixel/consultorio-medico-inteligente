import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Copy, MessageCircle, Check, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Loop viral pós-orientação — exibido após uma sessão concluída.
 * Cumpre 2 objetivos da auditoria:
 *  1. Reforçar Planta-Coins ganhos (gamificação visível)
 *  2. Estimular indicação imediata (crescimento viral orgânico)
 *
 * Não altera fluxo financeiro; apenas mostra o link de indicação que já existe
 * no sistema (useReferralTracking) e oferece compartilhar via WhatsApp.
 */
export function PostConsultationViralLoop({ coinsEarned = 15, bonusPerReferral = 10 }: { coinsEarned?: number; bonusPerReferral?: number }) {
  const [refCode, setRefCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // Busca código existente
        const { data: existing } = await supabase
          .from("referral_links")
          .select("code")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing?.code) {
          setRefCode(existing.code);
        } else {
          // Cria um novo se não existir
          const newCode = `PLR-${user.id.replace(/-/g, "").substring(0, 6).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
          await supabase.from("referral_links").insert({
            user_id: user.id,
            code: newCode,
            level1_referrer: null,
            level2_referrer: null,
            level3_referrer: null,
          });
          setRefCode(newCode);
        }
      } catch (e) {
        console.warn("[ViralLoop] erro ao carregar código:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const shareUrl = refCode ? `https://plantayraiz.com.br/?ref=${refCode}` : "";
  const waMessage = encodeURIComponent(
    `Oi! Acabei de fazer minha Orientação Técnica de Cannabis Medicinal com o Dr. Edilson na Planta y Raiz 💚\n\nValeu muito a pena. Se quiser usar meu link de indicação (a partir de R$30): ${shareUrl}`
  );
  const waLink = `https://wa.me/?text=${waMessage}`;

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link copiado!", description: "Compartilhe com quem precisa." });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ title: "Não foi possível copiar", description: shareUrl, variant: "destructive" });
    }
  };

  if (loading) return null;
  if (!refCode) return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5 max-w-2xl mx-auto">
      <CardContent className="p-6 md:p-8 space-y-5">
        {/* Coins ganhos */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Coins className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">
              Você ganhou <span className="text-primary">R${coinsEarned} em Planta-Coins</span> 🎉
            </h3>
            <p className="text-sm text-muted-foreground">Por concluir sua orientação técnica.</p>
          </div>
        </div>

        {/* Convite para indicação */}
        <div className="border-t border-border/50 pt-5 space-y-3">
          <div className="flex items-start gap-3">
            <Gift className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                Indique um amigo e ganhe <span className="text-primary font-bold">+R${bonusPerReferral} extras</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Quando ele(a) fizer a primeira orientação, vocês dois recebem créditos. Sem custo, 100% orgânico.
              </p>
            </div>
          </div>

          {/* Link */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 rounded-md border border-border bg-muted/40 text-sm text-foreground font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
              aria-label="Seu link de indicação"
            />
            <Button onClick={handleCopy} variant="outline" size="default" className="shrink-0">
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>

          {/* WhatsApp */}
          <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            <a href={waLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" />
              Compartilhar pelo WhatsApp
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default PostConsultationViralLoop;
