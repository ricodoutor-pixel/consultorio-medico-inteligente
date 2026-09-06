import { Store, ShieldCheck, CheckCircle2, FileText, ShoppingBag, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const OfficialPharmacyCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-border bg-card/40 backdrop-blur">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Store size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm md:text-base text-foreground flex items-center gap-2">
                Dispensário & Farmácia Oficial Planta y Raíz Ltda
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                  Loja Oficial ANVISA
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Dispensação regulada de fitocanabinoides conforme RDC 660/2022 e RDC 327/2019</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/admin/aprovacoes-farmacias")}
              className="text-xs rounded-xl border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <FileText size={12} className="mr-1.5" />
              Dossiê Regulatório & KYC
            </Button>
          </div>
        </div>

        {/* Big numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Razão Social</span>
            <p className="text-xs md:text-sm font-black text-foreground mt-1 truncate">Planta y Raíz Ltda</p>
            <span className="text-[10px] text-muted-foreground font-mono">CNPJ: 30.740.319/0001-14</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/30">
            <span className="text-[10px] text-emerald-400 uppercase font-bold">Status Sanitário</span>
            <p className="text-sm md:text-base font-black text-emerald-400 mt-1 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" /> AFE / CRF ATIVO
            </p>
            <span className="text-[10px] text-emerald-500/80">Alvará Sanitário Vigente</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Catálogo no Shopping</span>
            <p className="text-2xl font-black text-amber-400 mt-0.5">38 Itens</p>
            <span className="text-[10px] text-amber-400/80 font-medium">Full & Broad Spectrum</span>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Rastreabilidade ICP</span>
            <p className="text-2xl font-black text-sky-400 mt-0.5">100%</p>
            <span className="text-[10px] text-sky-400/80 font-medium">Receita SHA-512 Obrigatória</span>
          </div>
        </div>

        {/* Operational info */}
        <div className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span className="text-muted-foreground">Responsável Técnico:</span>
            <span className="font-bold text-foreground">Farmacêutico Especialista CRF/PR & ANVISA</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">Integração Shopping:</span>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px] font-bold">
              ✓ ATIVO NO MARKETPLACE
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
