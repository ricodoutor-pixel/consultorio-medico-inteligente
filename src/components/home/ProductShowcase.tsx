import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Truck, FileText, CheckCircle } from "lucide-react";
import { ShoppingCart } from "lucide-react";

export function ProductShowcase({ products }: { products: any[] }) {
  if (!products || products.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((p) => (
        <Card key={p.id} className="border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 bg-card/30 backdrop-blur-sm overflow-hidden group rounded-xl">
          <CardContent className="p-0">
            <div className="relative">
              {/* Vendor Identification Badge */}
              <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-full px-2 py-1 shadow-lg">
                <img 
                  src={p.vendor?.logo_url || "/dr-verdinho.png"} 
                  alt={p.vendor?.nome_fantasia || "Farmácia Parceira"} 
                  className="w-5 h-5 rounded-full object-cover bg-white"
                />
                <span className="text-[9px] font-bold text-white truncate max-w-[100px]">
                  {p.vendor?.nome_fantasia || "Loja Oficial"}
                </span>
              </div>

              {/* ANVISA Badge */}
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-blue-600/90 hover:bg-blue-600 text-[9px] shadow-lg">
                  <Shield size={10} className="mr-1"/> ANVISA
                </Badge>
              </div>

              <Link to={`/shopping/${p.id}`} className="block h-48 sm:h-56 bg-muted/20 p-6 flex items-center justify-center">
                <img 
                  src={p.image_url} 
                  alt={p.name} 
                  className="w-full h-full object-contain mix-blend-multiply drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
                />
              </Link>
            </div>
            
            <div className="p-4">
              <Link to={`/shopping/${p.id}`}>
                <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors">
                  {p.name}
                </h3>
              </Link>

              {p.concentration && (
                <p className="text-xs text-muted-foreground mt-1 mb-2 font-mono bg-muted/50 inline-block px-2 py-0.5 rounded">
                  {p.concentration}
                </p>
              )}

              <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold mb-3">
                <Truck size={12} /> Frete Grátis Brasil
              </div>

              <div className="flex items-end justify-between mt-2">
                <div>
                  <p className="text-lg font-display font-black text-foreground">
                    R$ {Number(p.price).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              <Button 
                className="w-full mt-4 font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-900/20"
              >
                <FileText size={16} className="mr-2" /> Comprar com Receita
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
