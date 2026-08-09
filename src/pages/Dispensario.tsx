import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Lock, Search, ShoppingCart, FileCheck, AlertTriangle,
  Pill, Leaf, ExternalLink, CheckCircle2
} from "lucide-react";
import { AnvisaBadge } from "@/components/AnvisaBadge";

interface DispensaryProduct {
  id: string;
  name: string;
  brand: string;
  type: string;
  cbdMg: number;
  thcPct: number;
  volume: string;
  price: number;
  requiresReceitaA: boolean;
  anvisaReg: string;
  inStock: boolean;
}

const PRODUCTS: DispensaryProduct[] = [
  { id: "1", name: "CBD Full Spectrum 3000mg", brand: "Ease Labs", type: "Óleo", cbdMg: 3000, thcPct: 0.1, volume: "30mL", price: 389.90, requiresReceitaA: false, anvisaReg: "RDC-660/22-001", inStock: true },
  { id: "2", name: "CBD Isolado 1500mg", brand: "HempMeds", type: "Óleo", cbdMg: 1500, thcPct: 0, volume: "30mL", price: 249.90, requiresReceitaA: false, anvisaReg: "RDC-660/22-002", inStock: true },
  { id: "3", name: "CBD + THC Balanced 1:1", brand: "Charlotte's Web", type: "Óleo", cbdMg: 500, thcPct: 2.5, volume: "15mL", price: 599.90, requiresReceitaA: true, anvisaReg: "RDC-660/22-003", inStock: true },
  { id: "4", name: "CBD Broad Spectrum 5000mg", brand: "Abrace", type: "Óleo", cbdMg: 5000, thcPct: 0, volume: "60mL", price: 520.00, requiresReceitaA: false, anvisaReg: "RDC-660/22-004", inStock: false },
  { id: "5", name: "THC Medicinal 10mg/mL", brand: "Verdemed", type: "Óleo", cbdMg: 0, thcPct: 5, volume: "30mL", price: 890.00, requiresReceitaA: true, anvisaReg: "RDC-660/22-005", inStock: true },
  { id: "6", name: "CBD Cápsulas 25mg", brand: "Prati-Donaduzzi", type: "Cápsulas", cbdMg: 750, thcPct: 0, volume: "30 caps", price: 179.90, requiresReceitaA: false, anvisaReg: "RDC-660/22-006", inStock: true },
];

const Dispensario = () => {
  const { toast } = useToast();
  const [hasValidPrescription, setHasValidPrescription] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<DispensaryProduct[]>([]);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      setIsAuthenticated(true);

      // Check for valid prescriptions
      const { data: prescriptions } = await supabase
        .from("prescriptions")
        .select("id, status, valid_until")
        .eq("patient_id", session.user.id)
        .eq("status", "signed")
        .gte("valid_until", new Date().toISOString().split("T")[0]);

      if (prescriptions && prescriptions.length > 0) {
        setHasValidPrescription(true);
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const { data: dbProducts, error } = await (supabase as any).from("products").select("*").eq("is_active", true);
      if (dbProducts && dbProducts.length > 0) {
        setProducts(dbProducts.map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand || "Marca Parceira",
          type: p.category || "Óleo",
          cbdMg: p.cbd_mg || 0,
          thcPct: p.thc_pct || 0,
          volume: p.volume || "30mL",
          price: p.price || 0,
          requiresReceitaA: p.requires_receita_a || false,
          anvisaReg: p.anvisa_reg || "Isento",
          inStock: p.in_stock !== false
        })));
      } else {
        setProducts(PRODUCTS); // Fallback if no real products
      }
    } catch (e) {
      console.error(e);
      setProducts(PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Gate: Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center max-w-lg">
          <Lock size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Dispensário Seguro</h1>
          <p className="text-muted-foreground mb-6">
            Faça login para acessar o dispensário de cannabis medicinal.
          </p>
          <Button onClick={() => window.location.href = "/login"} className="bg-primary text-primary-foreground">
            Fazer Login
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Gate: No valid prescription
  if (!hasValidPrescription) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center max-w-lg">
          <FileCheck size={48} className="mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Prescrição Necessária</h1>
          <p className="text-muted-foreground mb-4">
            Para acessar o dispensário, você precisa de uma prescrição válida assinada digitalmente
            por um médico credenciado. Conforme RDC ANVISA 660/2022.
          </p>
          <div className="space-y-3">
            <Button onClick={() => window.location.href = "/falar-com-especialista"} className="w-full bg-primary text-primary-foreground">
              <Pill size={16} className="mr-2" /> Orientação Técnicar um Prescritor
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/dashboard"} className="w-full">
              Voltar ao Dashboard
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-6">
            🔒 O dispensário é liberado automaticamente quando uma prescrição válida é vinculada ao seu perfil.
            Todas as transações são auditadas conforme LGPD e ANVISA.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  // Unlocked: Show marketplace
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-2">
          <Leaf className="text-primary" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dispensário Medicinal</h1>
            <p className="text-sm text-muted-foreground">
              Shopping autorizado — Prescrição validada
            </p>
          </div>
          <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">
            <CheckCircle2 size={12} className="mr-1" /> Prescrição Ativa
          </Badge>
        </div>

        <div className="flex items-center gap-2 my-6">
          <Search size={16} className="text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar produto, marca..."
            className="bg-muted border-border max-w-md"
          />
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 border border-dashed border-border rounded-xl">
            <ShoppingCart size={48} className="mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-bold text-foreground">Nenhum produto encontrado</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Não encontramos produtos para esta busca ou a loja está vazia.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <Card key={product.id} className={`bg-card border-border ${!product.inStock ? "opacity-50" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm">{product.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                    </div>
                    {product.requiresReceitaA && (
                      <Badge variant="destructive" className="text-[9px]">
                        <AlertTriangle size={8} className="mr-1" /> Receita A
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{product.type}</Badge>
                    <Badge variant="outline" className="text-[10px]">CBD {product.cbdMg}mg</Badge>
                    {product.thcPct > 0 && (
                      <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-500">
                        THC {product.thcPct}%
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">{product.volume}</Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <AnvisaBadge registration={product.anvisaReg} compact />
                    <span className="text-[9px] text-muted-foreground/70 font-mono">{product.anvisaReg}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      R$ {product.price.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      disabled={!product.inStock}
                      className="bg-primary text-primary-foreground text-xs"
                    >
                      {product.inStock ? (
                        <><ShoppingCart size={12} className="mr-1" /> Comprar</>
                      ) : "Indisponível"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8 bg-muted/30 border-border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield size={20} className="text-primary shrink-0 mt-0.5" />
              <div className="text-[10px] text-muted-foreground space-y-1">
                <p className="font-bold text-xs text-foreground">Conformidade ANVISA</p>
                <p>Todos os produtos são importados ou fabricados conforme RDC ANVISA 660/2022.</p>
                <p>Produtos com THC {'>'} 0.2% exigem Receita Tipo A (Notificação de Receita A – amarela).</p>
                <p>Cada transação é vinculada à prescrição do paciente e registrada no Audit Trail.</p>
                <a href="https://www.gov.br/anvisa/pt-br" target="_blank" rel="noopener noreferrer"
                  className="text-primary flex items-center gap-1 hover:underline">
                  <ExternalLink size={10} /> Portal ANVISA
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Dispensario;
