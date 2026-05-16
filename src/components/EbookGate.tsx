import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Download, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * EbookGate — Lead capture (Nome + WhatsApp) → libera ebook PDF
 * Estratégia: Closed Gate (mem://marketing/lead-gate-strategy)
 * Salva lead em `leads` table e dispara WhatsApp boas-vindas via Brisa.
 */

const EBOOK_URL = "/ebook-guia-completo-cannabis-medicinal.pdf";

export function EbookGate() {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatWhatsapp = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const digits = whatsapp.replace(/\D/g, "");
    if (name.trim().length < 2) return setError("Informe seu nome completo.");
    if (digits.length < 10) return setError("WhatsApp inválido. Use DDD + número.");

    setLoading(true);
    try {
      // Salva lead (tabela leads existente; ignora falha silenciosamente para não bloquear download)
      await supabase.from("leads" as any).insert({
        name: name.trim(),
        whatsapp: `+55${digits}`,
        source: "ebook_gate_home",
        lead_score: 30,
      } as any);
    } catch (err) {
      // não bloqueia
      console.warn("[EbookGate] lead insert failed (non-blocking):", err);
    } finally {
      setLoading(false);
      setDone(true);
      // dispara download
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = EBOOK_URL;
        a.download = "guia-cannabis-medicinal-planta-y-raiz.pdf";
        a.click();
      }, 400);
    }
  };

  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-10 max-w-5xl">
        <Card className="relative border-primary/30 bg-gradient-to-br from-primary/10 via-card/60 to-[hsl(280,80%,65%)]/10 backdrop-blur-md rounded-3xl overflow-hidden">
          <CardContent className="p-6 md:p-10 grid md:grid-cols-[1fr_1.2fr] gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-[11px] font-black uppercase tracking-wider text-primary">
                <BookOpen size={12} /> Ebook Gratuito · 48 páginas
              </span>
              <h2 className="font-display font-black text-2xl md:text-4xl leading-tight">
                Guia Completo da <span className="text-gradient-green">Cannabis Medicinal</span> no Brasil
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                  Como funciona a RDC 660/2022 e a importação legal
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                  CBD, THC, terpenos: qual perfil para cada condição
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                  Protocolos baseados em 40.000+ estudos PubMed
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                  Passo a passo da Anvisa sem advogado
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              {!done ? (
                <form
                  onSubmit={handleSubmit}
                  className="p-6 rounded-2xl bg-background/80 border border-border space-y-4"
                >
                  <div>
                    <label htmlFor="ebook-name" className="text-xs font-black uppercase tracking-wider text-primary block mb-1.5">
                      Seu nome
                    </label>
                    <input
                      id="ebook-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Maria Silva"
                      autoComplete="name"
                      className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="ebook-wa" className="text-xs font-black uppercase tracking-wider text-primary block mb-1.5">
                      WhatsApp (com DDD)
                    </label>
                    <input
                      id="ebook-wa"
                      type="tel"
                      inputMode="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
                      placeholder="(11) 99999-9999"
                      autoComplete="tel"
                      className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium"
                      required
                    />
                  </div>
                  {error && (
                    <p className="text-xs text-rose-400 font-bold">{error}</p>
                  )}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full h-14 text-sm font-black bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/30 hover:scale-[1.02] transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Liberando...
                      </>
                    ) : (
                      <>
                        <Download size={18} className="mr-2" />
                        Baixar Ebook Grátis
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                    Ao baixar você aceita receber dicas da Enfª Brisa via WhatsApp. Cancele quando quiser.
                  </p>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-2xl bg-primary/10 border border-primary/40 text-center space-y-3"
                >
                  <CheckCircle2 size={48} className="text-primary mx-auto" />
                  <h3 className="font-display font-black text-xl">Download iniciado!</h3>
                  <p className="text-sm text-muted-foreground">
                    Em instantes a Enfª Brisa enviará uma mensagem no seu WhatsApp com um bônus exclusivo.
                  </p>
                  <Button asChild variant="outline" size="sm" className="rounded-xl">
                    <a href={EBOOK_URL} download>
                      <Download size={14} className="mr-2" />
                      Baixar novamente
                    </a>
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default EbookGate;
