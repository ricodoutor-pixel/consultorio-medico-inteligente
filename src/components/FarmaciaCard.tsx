import { motion } from "framer-motion";
import { MapPin, Star, BadgeCheck, Store, ArrowRight, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { resolveProductImg } from "@/lib/productImages";

export interface FarmaciaCardProps {
  vendor: {
    id: string;
    store_name: string;
    store_logo_url?: string | null;
    store_banner_url?: string | null;
    rating?: number | string | null;
    total_sales?: number | string | null;
    is_verified?: boolean;
    city?: string | null;
    state?: string | null;
    featured_product?: {
      name: string;
      price: number | string;
      image_url?: string | null;
      category?: string | null;
    } | null;
  };
  onClick?: () => void;
}

export function FarmaciaCard({ vendor, onClick }: FarmaciaCardProps) {
  const navigate = useNavigate();

  const ratingVal = Number(vendor?.rating || 5);
  const cityStr = vendor?.city || "São Paulo";
  const stateStr = vendor?.state ? `, ${vendor.state}` : ", SP";
  const storeName = vendor?.store_name || "Planta y Raiz Ltda";

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(29,158,117,0.25)" }}
      transition={{ duration: 0.2 }}
      className="bg-card border border-border/60 hover:border-primary/50 rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between shadow-lg max-w-sm"
      onClick={() => (onClick ? onClick() : navigate(`/shopping/farmacia/${vendor.id}`))}
    >
      {/* Banner */}
      <div>
        <div
          className="h-24 relative"
          style={{
            background: vendor?.store_banner_url && !vendor.store_banner_url.startsWith("linear-gradient")
              ? `url(${vendor.store_banner_url}) center/cover`
              : "linear-gradient(135deg, #062b1e 0%, #0d4a34 50%, #10b981 100%)"
          }}
        >
          {/* Logo */}
          <div className="absolute -bottom-5 left-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary bg-background overflow-hidden flex items-center justify-center shadow-lg">
              {vendor?.store_logo_url ? (
                <img src={vendor.store_logo_url} alt={storeName} className="w-full h-full object-cover" />
              ) : (
                <Store className="text-primary" size={24} />
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="pt-7 px-4 pb-2">
          <div className="flex items-center justify-between mb-1">
            {vendor?.is_verified !== false && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                <BadgeCheck size={10} className="mr-1" /> Farmácia Verificada
              </Badge>
            )}
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold ml-auto">
              <Star size={12} fill="currentColor" /> {isNaN(ratingVal) ? "5.0" : ratingVal.toFixed(1)}
            </div>
          </div>

          <h3 className="font-display font-bold text-foreground text-base mt-1.5 mb-1 leading-tight group-hover:text-primary transition-colors line-clamp-1">
            {storeName}
          </h3>

          <p className="text-muted-foreground text-xs flex items-center gap-1 mb-3">
            <MapPin size={11} className="text-primary" /> {cityStr}{stateStr}
          </p>

          {/* Produto em destaque */}
          {vendor?.featured_product && (
            <div className="bg-muted/40 rounded-xl p-2.5 mb-2 flex items-center gap-2.5 border border-border/50">
              <div className="w-10 h-10 rounded-lg bg-background overflow-hidden flex-shrink-0 border border-border/50">
                <img
                  src={resolveProductImg(vendor.featured_product.image_url)}
                  alt={vendor.featured_product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground truncate">{vendor.featured_product.name}</p>
                <p className="text-xs text-primary font-bold">
                  R$ {Number(vendor.featured_product.price || 0).toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 pt-1">
        <Button
          size="sm"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold h-9 shadow-md shadow-emerald-950/20"
        >
          Ver Catálogo Completo <ArrowRight size={13} className="ml-1.5" />
        </Button>
      </div>
    </motion.div>
  );
}
