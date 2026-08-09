import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Star, ShieldCheck, Search, Building2 } from "lucide-react";

type Partner = {
  id: string; name: string; category: string; city: string; state: string;
  discount_pct: number; discount_pct_max: number; price_from_brl: number | null;
  rating: number; is_verified: boolean; logo_url: string | null;
};

const categories = [
  { value: "all", label: "Todas as categorias" },
  { value: "clinica", label: "Clínicas" },
  { value: "laboratorio", label: "Laboratórios" },
  { value: "farmacia", label: "Farmácias" },
  { value: "odontologia", label: "Odontologia" },
  { value: "terapia", label: "Terapias" },
  { value: "hospital", label: "Hospitais" },
];

export default function SaudeVerdeRede() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    setLoading(true);
    let q = supabase.from("saude_verde_partners_public" as never)
      .select("*").eq("is_active", true).order("rating", { ascending: false }).limit(50);
    if (city) q = q.ilike("city", `%${city}%`);
    if (category !== "all") q = q.eq("category", category);
    q.then(({ data }) => {
      setPartners((data as unknown as Partner[]) || []);
      setLoading(false);
    });
  }, [city, category]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Helmet>
        <title>Rede credenciada — Cartão Saúde Verde | Planta y Raiz</title>
        <meta name="description" content="Encontre clínicas, laboratórios e farmácias parceiras do Cartão Saúde Verde com até 80% de desconto." />
        <link rel="canonical" href="https://plantayraiz.com.br/saude-verde/rede" />
      </Helmet>

      <section className="py-12 bg-gradient-to-br from-primary/10 via-background to-background border-b border-border/40">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Rede Saúde Verde</h1>
          <p className="text-muted-foreground mb-8">Mais de 3.000 parceiros em todo o Brasil.</p>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cidade (ex: São Paulo)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button asChild variant="outline" className="border-primary/30">
              <Link to="/saude-verde">← Voltar ao Cartão Saúde Verde</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-10 container mx-auto px-4 max-w-6xl">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Carregando rede credenciada...</div>
        ) : partners.length === 0 ? (
          <Card className="p-10 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2">Nenhum parceiro encontrado</h3>
            <p className="text-muted-foreground mb-4">Estamos expandindo a rede rapidamente. Tente outra cidade ou categoria.</p>
            <Button asChild variant="outline"><Link to="/saude-verde/seja-parceiro">Conhece uma clínica? Indique-nos</Link></Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map(p => (
              <Card key={p.id} className="p-5 border-border/50 hover:border-primary/40 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold truncate">{p.name}</h3>
                      {p.is_verified && <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1 capitalize">{p.category}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3.5 h-3.5" /> {p.city}, {p.state}
                </div>
                <div className="flex items-center gap-1 text-xs mb-3">
                  <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                  <span className="font-medium">{Number(p.rating || 0).toFixed(1)}</span>
                </div>
                <div className="border-t border-border/40 pt-3">
                  <div className="text-lg font-bold text-primary">Até {p.discount_pct_max}% OFF</div>
                  {p.price_from_brl && (
                    <div className="text-xs text-muted-foreground mb-3">a partir de R$ {Number(p.price_from_brl).toFixed(2)}</div>
                  )}
                  <Button asChild size="sm" className="w-full bg-primary hover:bg-primary/90">
                    <Link to={`/saude-verde/agendar?partner=${p.id}`}>Agendar</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
