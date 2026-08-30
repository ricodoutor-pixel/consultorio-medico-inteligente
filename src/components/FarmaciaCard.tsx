import { motion } from "framer-motion";
import { MapPin, Star, BadgeCheck, Store, ArrowRight, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
  const cityStr = vendor?.city || "Brasil";
  const stateStr = vendor?.state ? `, ${vendor.state}` : "";
  const storeName = vendor?.store_name || "Farmácia Parceira";

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(29,158,117,0.2)" }}
      transition={{ duration: 0.2 }}
      className="bg-card border border-border rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between shadow-md"
      onClick={() => onClick ? onClick() : navigate(`/shopping/farmacia/${vendor.id}`)}
    >
      {/* Banner */}
      <div>
        <div
          className="h-20 sm:h-24 relative"
          style={{
            background: vendor?.store_banner_url
              ? `url(${vendor.store_banner_url}) center/cover`
              : "linear-gradient(135deg, #0a2e1f, #1D9E75)"
          }}
        >
          {/* Logo */}
          <div className="absolute -bottom-5 left-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-primary bg-background overflow-hidden flex items-center justify-center shadow-md">
              {vendor?.store_logo_url ? (
                <img src={vendor.store_logo_url} alt={storeName} className="w-full h-full object-cover" />
              ) : (
                <Store className="text-primary" size={20} />
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="pt-7 px-4 pb-2">
          <div className="flex items-center justify-between mb-1">
            {vendor?.is_verified !== false && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                <BadgeCheck size={10} className="mr-1" /> Verificada
              </Badge>
            )}
            <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold ml-auto">
              <Star size={12} fill="currentColor" /> {isNaN(ratingVal) ? "5.0" : ratingVal.toFixed(1)}
            </div>
          </div>

          <h3 className="font-bold text-foreground text-sm mt-1.5 mb-1 leading-tight group-hover:text-primary transition-colors line-clamp-1">
            {storeName}
          </h3>

          <p className="text-muted-foreground text-xs flex items-center gap-1 mb-2.5">
            <MapPin size={10} /> {cityStr}{stateStr}
          </p>

          {/* Produto em destaque */}
          {vendor?.featured_product && (
            <div className="bg-muted/40 rounded-xl p-2 mb-2 flex items-center gap-2 border border-border/40">
              <div className="w-9 h-9 rounded-lg bg-background overflow-hidden flex-shrink-0 border border-border/50">
                {vendor.featured_product.image_url ? (
                  <img src={vendor.featured_product.image_url} alt={vendor.featured_product.name} className="w-full h-full object-cover" />
                ) : (
                  <ShoppingBag size={14} className="m-auto mt-2 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground truncate">{vendor.featured_product.name}</p>
                <p className="text-xs text-primary font-bold">
                  R$ {Number(vendor.featured_product.price || 0).toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 pt-1">
        <Button
          size="sm"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-semibold h-8"
        >
          Ver Catálogo <ArrowRight size={12} className="ml-1" />
        </Button>
      </div>
    </motion.div>
  );
}
