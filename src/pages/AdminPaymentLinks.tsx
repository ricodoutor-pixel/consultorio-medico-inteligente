import { useState } from "react";
import { Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { SERVICES } from "@/lib/pricing";
import { PAYMENT_LINK_PRODUCTS, buildPaymentLink, paymentLinkMessage, type PaymentLinkSlug } from "@/lib/payment-links";

const LABELS: Record<PaymentLinkSlug, string> = {
  "orientacao-tecnica": "Orientação Técnica",
  triagem: "Triagem (Orientação Técnica)",
  "consulta-chat": "Consulta por Chat",
  "consulta-video": "Consulta por Vídeo",
  retorno: "Retorno",
};

export default function AdminPaymentLinks() {
  const [campaign, setCampaign] = useState("");
  const [ref, setRef] = useState("");
  const [pro, setPro] = useState("");
  const copy = async (text: string, what: string) => {
    try { await navigator.clipboard.writeText(text); toast.success(`${what} copiado`); }
    catch { toast.error("Não foi possível copiar"); }
  };
  return (
    <main className="min-h-[100dvh] bg-background text-foreground p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Link2 className="h-6 w-6 text-primary" /> Links de pagamento (WhatsApp)</h1>
      <p className="text-sm text-muted-foreground mt-1">Cole no campo "Link" de cada item do catálogo do WhatsApp Business. O atendimento só é liberado depois do pagamento confirmado.</p>
      <div className="grid gap-3 md:grid-cols-3 mt-6">
        <Input placeholder="Campanha (ex.: novembro)" value={campaign} onChange={(e) => setCampaign(e.target.value.trim())} />
        <Input placeholder="Código de indicação" value={ref} onChange={(e) => setRef(e.target.value.trim())} />
        <Input placeholder="ID do médico (só consultas)" value={pro} onChange={(e) => setPro(e.target.value.trim())} />
      </div>
      <div className="mt-6 space-y-3">
        {(Object.keys(PAYMENT_LINK_PRODUCTS) as PaymentLinkSlug[]).map((slug) => {
          const link = buildPaymentLink(slug, { campaign, ref, pro });
          const price = SERVICES[PAYMENT_LINK_PRODUCTS[slug]].price;
          return (
            <section key={slug} className="rounded-xl border border-border bg-card p-4">
              <div className="flex justify-between gap-2"><h2 className="font-semibold">{LABELS[slug]}</h2><span className="text-primary font-semibold">R$ {price}</span></div>
              <p className="text-xs text-muted-foreground break-all mt-1">{link}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => copy(link, "Link")}><Copy className="h-4 w-4 mr-1" />Copiar link</Button>
                <Button size="sm" onClick={() => copy(paymentLinkMessage(slug, link), "Mensagem")}><Copy className="h-4 w-4 mr-1" />Copiar mensagem para WhatsApp</Button>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
