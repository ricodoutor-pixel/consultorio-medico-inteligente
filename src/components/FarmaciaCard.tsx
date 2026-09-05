import { motion } from "framer-motion";
import { MapPin, Star, BadgeCheck, Store, ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { resolveProductImg } from "@/lib/productImages";
import farmaciaFachadaImg from "@/assets/farmacia-fachada.jpg";
import logoFarmaciaImg from "@/assets/logo-farmacia.jpg";

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

  const bannerBackground = vendor?.store_banner_url && !vendor.store_banner_url.startsWith("linear-gradient")
    ? vendor.store_banner_url.includes("fachada") ? farmaciaFachadaImg : vendor.store_banner_url
    : farmaciaFachadaImg;

  const logoSrc = vendor?.store_logo_url && !vendor.store_logo_url.includes("dr-verdinho")
    ? vendor.store_logo_url.includes("logo") ? logoFarmaciaImg : vendor.store_logo_url
    : logoFarmaciaImg;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 16px 45px rgba(29,158,117,0.3)" }}
      transition={{ duration: 0.2 }}
      className="bg-card border border-border/60 hover:border-emerald-500/60 rounded-3xl overflow-hidden cursor-pointer group flex flex-col justify-between shadow-xl max-w-sm"
      onClick={() => (onClick ? onClick() : navigate(`/shopping/farmacia/${vendor.id}`))}
    >
      {/* Banner da Fachada */}
      <div>
        <div
          className="h-36 relative overflow-hidden"
          style={{
            backgroundImage: `url(${bannerBackground})`,
            backgroundPosition: "center 28%",
            backgroundSize: "cover"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Logotipo Oficial — 100% visível, sem corte */}
          <div className="absolute -bottom-4 left-4 z-10">
            <div className="w-16 h-16 rounded-xl border-2 border-emerald-500 bg-white p-1 flex items-center justify-center shadow-2xl ring-2 ring-black/30 group-hover:scale-105 transition-transform duration-300">
              <img
                src={logoSrc}
                alt={storeName}
                className="w-[80%] h-[80%] object-contain"
                loading="eager"
              />
            </div>
          </div>

          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="text-[10px] bg-emerald-600/95 backdrop-blur-md text-white px-2.5 py-1 rounded-full font-bold shadow-lg border border-emerald-400/30">
              Farmácia Física & Digital
            </span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="pt-6 px-4 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            {vendor?.is_verified !== false && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                <BadgeCheck size={11} className="mr-1 text-emerald-400" /> Farmácia Oficial ANVISA
              </Badge>
            )}
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold ml-auto">
              <Star size={12} fill="currentColor" /> {isNaN(ratingVal) ? "5.0" : ratingVal.toFixed(1)}
            </div>
          </div>

          <h3 className="font-display font-bold text-foreground text-base mt-1 mb-1 leading-tight group-hover:text-emerald-400 transition-colors line-clamp-1">
            {storeName}
          </h3>

          <p className="text-muted-foreground text-xs flex items-center gap-1 mb-3">
            <MapPin size={11} className="text-emerald-400" /> {cityStr}{stateStr} • Dispensação Nacional
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
                <p className="text-xs text-emerald-400 font-bold">
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
          Ver Catálogo da Farmácia <ArrowRight size={13} className="ml-1.5" />
        </Button>
      </div>
    </motion.div>
  );
}
