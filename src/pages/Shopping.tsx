import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ShoppingBag, Star, ArrowLeft, ArrowRight,
  Store, CreditCard, Truck, Search, Shield, Grid3X3, List, ChevronRight,
  Tag, Package, Bitcoin, Clock, ChevronLeft,
  BadgeCheck, Flame, Filter, X, SlidersHorizontal, Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProductAlertBell } from "@/components/ProductAlertBell";
import { WhatsAppProofModal, useWhatsAppProofModal, type WhatsAppContext } from "@/components/WhatsAppProofModal";
import { BTCPaymentModal } from "@/components/BTCPaymentModal";
import { PrescriptionVerificationModal } from "@/components/PrescriptionVerificationModal";
import { DoctorEndorsedBadge } from "@/components/DoctorEndorsedBadge";
import { AnvisaBadge } from "@/components/AnvisaBadge";
import { FarmaciaCard } from "@/components/FarmaciaCard";
import { buildProductSchema } from "@/lib/schema-org";

// Import product images
import oleoCbd1 from "@/assets/products/oleo-cbd-1.jpg";
import oleoCbd2 from "@/assets/products/oleo-cbd-2.jpg";
import oleoCbd3 from "@/assets/products/oleo-cbd-3.jpg";
import capsulas1 from "@/assets/products/capsulas-1.jpg";
import capsulas2 from "@/assets/products/capsulas-2.jpg";
import capsulas3 from "@/assets/products/capsulas-3.jpg";
import tintura1 from "@/assets/products/tintura-1.jpg";
import tintura2 from "@/assets/products/tintura-2.jpg";
import tintura3 from "@/assets/products/tintura-3.jpg";
import vape1 from "@/assets/products/vape-1.jpg";
import vape2 from "@/assets/products/vape-2.jpg";
import vape3 from "@/assets/products/vape-3.jpg";
import gummies1 from "@/assets/products/gummies-1.jpg";
import gummies2 from "@/assets/products/gummies-2.jpg";
import gummies3 from "@/assets/products/gummies-3.jpg";
import cha1 from "@/assets/products/cha-1.jpg";
import cha2 from "@/assets/products/cha-2.jpg";
import cha3 from "@/assets/products/cha-3.jpg";
import creme1 from "@/assets/products/creme-1.jpg";
import creme2 from "@/assets/products/creme-2.jpg";
import creme3 from "@/assets/products/creme-3.jpg";
import lip1 from "@/assets/products/lip-1.jpg";
import lip2 from "@/assets/products/lip-2.jpg";
import lip3 from "@/assets/products/lip-3.jpg";
import proteina1 from "@/assets/products/proteina-1.jpg";
import proteina2 from "@/assets/products/proteina-2.jpg";
import proteina3 from "@/assets/products/proteina-3.jpg";
import patch1 from "@/assets/products/patch-1.jpg";
import patch2 from "@/assets/products/patch-2.jpg";
import patch3 from "@/assets/products/patch-3.jpg";
import massage1 from "@/assets/products/massage-1.jpg";
import massage2 from "@/assets/products/massage-2.jpg";
import massage3 from "@/assets/products/massage-3.jpg";
import spray1 from "@/assets/products/spray-1.jpg";
import spray2 from "@/assets/products/spray-2.jpg";
import spray3 from "@/assets/products/spray-3.jpg";
import bath1 from "@/assets/products/bath-1.jpg";
import bath2 from "@/assets/products/bath-2.jpg";
import bath3 from "@/assets/products/bath-3.jpg";

const imageMap: Record<string, string> = {
  "/src/assets/products/oleo-cbd-1.jpg": oleoCbd1, "/src/assets/products/oleo-cbd-2.jpg": oleoCbd2, "/src/assets/products/oleo-cbd-3.jpg": oleoCbd3,
  "/src/assets/products/capsulas-1.jpg": capsulas1, "/src/assets/products/capsulas-2.jpg": capsulas2, "/src/assets/products/capsulas-3.jpg": capsulas3,
  "/src/assets/products/tintura-1.jpg": tintura1, "/src/assets/products/tintura-2.jpg": tintura2, "/src/assets/products/tintura-3.jpg": tintura3,
  "/src/assets/products/vape-1.jpg": vape1, "/src/assets/products/vape-2.jpg": vape2, "/src/assets/products/vape-3.jpg": vape3,
  "/src/assets/products/gummies-1.jpg": gummies1, "/src/assets/products/gummies-2.jpg": gummies2, "/src/assets/products/gummies-3.jpg": gummies3,
  "/src/assets/products/cha-1.jpg": cha1, "/src/assets/products/cha-2.jpg": cha2, "/src/assets/products/cha-3.jpg": cha3,
  "/src/assets/products/creme-1.jpg": creme1, "/src/assets/products/creme-2.jpg": creme2, "/src/assets/products/creme-3.jpg": creme3,
  "/src/assets/products/lip-1.jpg": lip1, "/src/assets/products/lip-2.jpg": lip2, "/src/assets/products/lip-3.jpg": lip3,
  "/src/assets/products/proteina-1.jpg": proteina1, "/src/assets/products/proteina-2.jpg": proteina2, "/src/assets/products/proteina-3.jpg": proteina3,
  "/src/assets/products/patch-1.jpg": patch1, "/src/assets/products/patch-2.jpg": patch2, "/src/assets/products/patch-3.jpg": patch3,
  "/src/assets/products/massage-1.jpg": massage1, "/src/assets/products/massage-2.jpg": massage2, "/src/assets/products/massage-3.jpg": massage3,
  "/src/assets/products/spray-1.jpg": spray1, "/src/assets/products/spray-2.jpg": spray2, "/src/assets/products/spray-3.jpg": spray3,
  "/src/assets/products/bath-1.jpg": bath1, "/src/assets/products/bath-2.jpg": bath2, "/src/assets/products/bath-3.jpg": bath3,
};

const resolveImg = (url: string | null) => (url && imageMap[url]) || "/placeholder.svg";

interface VendorProduct {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  category: string;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  stock: number;
  sold_count: number;
  rating: number | null;
  review_count: number;
  is_active: boolean;
  endorsed_by_doctor?: boolean | null;
  as_anvisa?: string | null;
  vendors?: { id: string; store_name: string; rating: number | null };
}

const CATEGORIES = [
  { key: "Todos", label: "Todos", icon: ShoppingBag },
  { key: "oleo", label: "Óleos CBD", icon: Package },
  { key: "capsula", label: "Cápsulas", icon: Package },
  { key: "tintura", label: "Tinturas", icon: Package },
  { key: "vape", label: "Vaporizadores", icon: Package },
  { key: "comestivel", label: "Comestíveis", icon: Package },
  { key: "topico", label: "Tópicos", icon: Package },
  { key: "suplemento", label: "Suplementos", icon: Package },
  { key: "spray", label: "Sprays", icon: Package },
];

const fadeUp = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };
const stagger = { visible: { transition: { staggerChildren: 0.02 } } };

/* ─── PREFETCH CACHE ─── */
let prefetchedProducts: VendorProduct[] | null = null;
let prefetchPromise: Promise<VendorProduct[]> | null = null;

const prefetchProducts = () => {
  if (prefetchedProducts) return Promise.resolve(prefetchedProducts);
  if (prefetchPromise) return prefetchPromise;
  prefetchPromise = (async () => {
    const { data } = await supabase.from("vendor_products").select("*, vendors(id, store_name, rating)").eq("is_active", true);
    prefetchedProducts = (data as any) || [];
    return prefetchedProducts;
  })();
  return prefetchPromise;
};

// Start prefetch immediately on module load
prefetchProducts();

/* ─── SKELETON GRID ─── */
const ProductSkeleton = () => (
  <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
    <div className="aspect-square bg-muted/20 animate-pulse" />
    <div className="p-2.5 space-y-2">
      <div className="h-3 bg-muted/30 rounded animate-pulse w-3/4" />
      <div className="h-3 bg-muted/30 rounded animate-pulse w-1/2" />
      <div className="h-8 bg-muted/20 rounded-lg animate-pulse mt-2" />
    </div>
  </div>
);

const fmtPrice = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

/* ─── FAVORITES HOOK (localStorage) ─── */
const useFavorites = () => {
  const [favs, setFavs] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("pyr_favorites");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const toggle = (id: string) => {
    setFavs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("pyr_favorites", JSON.stringify([...next]));
      return next;
    });
  };

  return { favs, toggle, isFav: (id: string) => favs.has(id) };
};

/* ─── IMAGE CAROUSEL ─── */
const ImageCarousel = ({ images, alt }: { images: string[]; alt: string }) => {
  const [idx, setIdx] = useState(0);
  const validImgs = images.filter(Boolean);

  return (
    <div className="relative group aspect-square overflow-hidden bg-muted/10">
      <img
        src={resolveImg(validImgs[idx])}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        decoding="async"
      />
      {validImgs.length > 1 && (
        <>
          <button
            aria-label="Imagem anterior do produto"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx((idx - 1 + validImgs.length) % validImgs.length); }}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-background"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            aria-label="Próxima imagem do produto"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx((idx + 1) % validImgs.length); }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-background"
          >
            <ChevronRight size={14} />
          </button>
        </>
      )}
    </div>
  );
};

/* ─── PRODUCT DETAIL ─── */
const ProductDetail = ({ id }: { id: string }) => {
  const [product, setProduct] = useState<VendorProduct | null>(null);
  const [vendor, setVendor] = useState<{ store_name: string; rating: number | null } | null>(null);
  const [mainImg, setMainImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { modalState, showModal, setModalOpen } = useWhatsAppProofModal();
  const [btcModal, setBtcModal] = useState({ open: false, planName: "", planId: "", amount: "" });
  const [rxModal, setRxModal] = useState({ open: false, productName: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("vendor_products").select("*, vendors(id, store_name, rating)").eq("id", id).single();
      if (data) { setProduct(data as any); setVendor((data as any).vendors); }
      setLoading(false);
    })();
  }, [id]);

  // Product JSON-LD for rich results
  useEffect(() => {
    if (!product) return;
    const schema = buildProductSchema({
      id: String(product.id),
      name: product.name,
      description: (product as any).description || undefined,
      image: (product as any).image_url || undefined,
      price: fmtPrice(product.price),
      brand: (product as any).brand || undefined,
    });
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-product-schema", "true");
    el.textContent = JSON.stringify(schema.data);
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [product]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!product) return <div className="container mx-auto px-4 pt-32 text-center text-muted-foreground">Produto não encontrado.</div>;

  const images = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean) as string[];
  const discount = product.compare_price ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;
  const priceStr = fmtPrice(product.price);

  const handleBuy = () => {
    setRxModal({ open: true, productName: product.name });
  };

  const proceedWithPurchase = () => {
    setRxModal({ open: false, productName: "" });
    showModal(
      { type: "compra", productName: product.name, value: product.price } as WhatsAppContext,
      async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { toast({ title: "Faça login para comprar", variant: "destructive" }); return; }
        const { data, error } = await supabase.functions.invoke("create-cart-payment", {
          body: { items: [{ product_id: product.id, quantity: 1 }], description: `Planta y Raiz Ltda - ${product.name}` },
        });
        if (error) { toast({ title: "Erro ao gerar pagamento", variant: "destructive" }); return; }
        if (data?.init_point) { window.open(data.init_point, "_blank"); toast({ title: "Redirecionando para pagamento... 💳" }); }
      }
    );
  };

  return (
    <div className="container mx-auto px-4 pt-20 pb-12 md:pt-24 max-w-6xl">
      <Link to="/shopping" className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors mb-4 sm:mb-6">
        <ArrowLeft size={14} /> Voltar ao Shopping
      </Link>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
        {/* Images */}
        <div className="space-y-3">
          <Card className="border-border/50 overflow-hidden bg-card/30 backdrop-blur-sm rounded-2xl">
            <div className="aspect-square">
              <img src={resolveImg(images[mainImg])} alt={product.name} className="w-full h-full object-contain bg-muted/5 p-4 sm:p-6" />
            </div>
          </Card>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setMainImg(i)}
                className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 overflow-hidden transition-all ${i === mainImg ? "border-primary ring-2 ring-primary/20" : "border-border/30 opacity-60 hover:opacity-100"}`}
              >
                <img src={resolveImg(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-bold border border-primary/20 flex items-center gap-1">
              <BadgeCheck size={11} /> Loja Verificada
            </span>
            {discount > 0 && (
              <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive font-bold border border-destructive/20">
                -{discount}% OFF
              </span>
            )}
          </div>

          <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1">
            <Store size={12} className="text-primary" /> {vendor?.store_name || "Loja Parceira"} • {product.category}
          </p>

          <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-foreground leading-tight">{product.name}</h1>

          <div className="flex flex-wrap items-center gap-2">
            {product.endorsed_by_doctor && <DoctorEndorsedBadge />}
            {product.as_anvisa && <AnvisaBadge registration={product.as_anvisa} />}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} size={13} className={s <= Math.round(product.rating || 5) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"} />)}</div>
            <span className="text-xs sm:text-sm font-bold">{product.rating || 5}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">| {product.sold_count} vendidos</span>
          </div>

          {/* Price */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
            {product.compare_price && (
              <p className="text-xs sm:text-sm text-muted-foreground line-through">{fmtPrice(product.compare_price)}</p>
            )}
            <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">{priceStr}</p>
            <p className="text-[10px] sm:text-xs text-primary font-bold mt-1">em até 12x de {fmtPrice(product.price / 12)} sem juros</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">Taxa plataforma: 5% • Lojista recebe 95%</p>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-card/50 border border-border/30"><Truck size={13} className="text-primary shrink-0" /> Frete Grátis</div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-card/50 border border-border/30"><Shield size={13} className="text-primary shrink-0" /> Compra Segura</div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-card/50 border border-border/30"><Package size={13} className="text-primary shrink-0" /> Estoque: {product.stock}</div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-card/50 border border-border/30"><Clock size={13} className="text-amber-400 shrink-0" /> 3-7 dias úteis</div>
          </div>

          <div className="space-y-2 pt-2">
            <Button className="w-full font-bold h-12 sm:h-14 text-sm sm:text-base bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20" onClick={handleBuy}>
              Comprar Agora 💳
            </Button>
            <Button variant="outline" className="w-full font-bold border-amber-500/30 text-amber-500 hover:bg-amber-500/10 gap-2 h-10 sm:h-12 rounded-xl" onClick={() => setBtcModal({ open: true, planName: product.name, planId: product.id, amount: priceStr })}>
              <Bitcoin size={15} /> Pague Com BTC
            </Button>
          </div>

          <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center">⚠️ Planta & Raiz retém 5% para manutenção. Lojista recebe 95% automaticamente.</p>
        </div>
      </div>

      <WhatsAppProofModal open={modalState.open} onOpenChange={setModalOpen} context={modalState.context} onProceed={modalState.onProceed} />
      <BTCPaymentModal open={btcModal.open} onClose={() => setBtcModal({ ...btcModal, open: false })} planName={btcModal.planName} planId={btcModal.planId} amount={btcModal.amount} />
      <PrescriptionVerificationModal
        open={rxModal.open}
        onClose={() => setRxModal({ open: false, productName: "" })}
        productName={rxModal.productName}
        onHasPrescription={proceedWithPurchase}
        onNeedsPrescription={() => { setRxModal({ open: false, productName: "" }); window.location.href = "/profissionais"; }}
      />
    </div>
  );
};

/* ─── MAIN SHOPPING PAGE ─── */
const Shopping = () => {
  const { id } = useParams();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"relevance" | "price_asc" | "price_desc" | "sold">("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const { modalState, showModal, setModalOpen } = useWhatsAppProofModal();
  const [btcModal, setBtcModal] = useState({ open: false, planName: "", planId: "", amount: "" });
  const [rxModal, setRxModal] = useState<{ open: boolean; productName: string; pendingProduct: VendorProduct | null }>({ open: false, productName: "", pendingProduct: null });

  const [verifiedVendors, setVerifiedVendors] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('vendors')
      .select('id, store_name, store_logo_url, store_banner_url, rating, total_sales, is_active')
      .eq('is_active', true)
      .limit(8)
      .then(async ({ data: vData }) => {
        if (!vData || vData.length === 0) return;
        
        const { data: pData } = await supabase
          .from('vendor_products')
          .select('id, vendor_id, name, price, image_url, category, is_active')
          .eq('is_active', true);

        const mapped = vData.map((v: any) => {
          const featured = pData?.find((p: any) => p.vendor_id === v.id) || null;
          return {
            id: v.id,
            store_name: v.store_name || "Farmácia Parceira",
            store_logo_url: v.store_logo_url || null,
            store_banner_url: v.store_banner_url || null,
            rating: Number(v.rating || 5.0),
            total_sales: Number(v.total_sales || 0),
            is_verified: true,
            city: "São Paulo",
            state: "SP",
            featured_product: featured ? {
              name: featured.name,
              price: Number(featured.price || 0),
              image_url: featured.image_url,
              category: featured.category || "oleo"
            } : null
          };
        });
        setVerifiedVendors(mapped);
      })
      .catch((err) => {
        console.warn("[Shopping] Falha ao carregar farmácias:", err);
      });

    if (prefetchedProducts) {
      setProducts(prefetchedProducts);
      setLoading(false);
      return;
    }
    prefetchProducts().then(data => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  if (id) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <ProductDetail id={id} />
        <Footer />
      </div>
    );
  }

  let filtered = products
    .filter(p => activeCategory === "Todos" || p.category === activeCategory)
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description || "").toLowerCase().includes(searchQuery.toLowerCase()));

  if (sortBy === "price_asc") filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === "price_desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === "sold") filtered = [...filtered].sort((a, b) => b.sold_count - a.sold_count);

  const handleBuyProduct = (p: VendorProduct) => {
    setRxModal({ open: true, productName: p.name, pendingProduct: p });
  };

  const proceedWithPurchaseMain = () => {
    const p = rxModal.pendingProduct;
    setRxModal({ open: false, productName: "", pendingProduct: null });
    if (!p) return;
    showModal(
      { type: "compra", productName: p.name, value: p.price } as WhatsAppContext,
      async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { toast({ title: "Faça login para comprar", variant: "destructive" }); setTimeout(() => window.location.href = "/login", 1500); return; }
        const { data, error } = await supabase.functions.invoke("create-cart-payment", {
          body: { items: [{ product_id: p.id, quantity: 1 }], description: `Planta y Raiz Ltda - ${p.name}` },
        });
        if (error) { toast({ title: "Erro ao gerar pagamento", variant: "destructive" }); return; }
        if (data?.init_point) { window.open(data.init_point, "_blank"); toast({ title: "Redirecionando... 💳" }); }
      }
    );
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      {/* Hero Search Bar */}
      <section className="pt-20 md:pt-28 pb-4 sm:pb-6 bg-gradient-to-b from-primary/8 to-background border-b border-border/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-1 sm:mb-2">
              🌿 Shopping Medicinal
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">Produtos de cannabis medicinal verificados e auditados</p>
            <ProductAlertBell category="shopping" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 sm:h-11 rounded-xl border-border/50 bg-background/80 backdrop-blur-sm text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={14} className="text-muted-foreground" />
                </button>
              )}
            </div>
            <Button className="h-10 sm:h-11 px-4 rounded-xl bg-primary text-primary-foreground font-bold shrink-0" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline ml-2 text-xs">Filtros</span>
            </Button>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground mt-3 max-w-2xl mx-auto">
            <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
            <ChevronRight size={10} />
            <span className="text-foreground font-bold">Shopping</span>
            {activeCategory !== "Todos" && <>
              <ChevronRight size={10} />
              <span className="text-primary font-bold">{CATEGORIES.find(c => c.key === activeCategory)?.label}</span>
            </>}
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-2 border-b border-border/30 bg-card/20 overflow-x-auto">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-start sm:justify-center gap-3 sm:gap-6 min-w-max sm:min-w-0 text-[9px] sm:text-[10px] md:text-[11px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1"><Shield size={11} className="text-primary shrink-0" /> Compra Segura</span>
            <span className="flex items-center gap-1"><Truck size={11} className="text-primary shrink-0" /> Frete Grátis</span>
            <span className="flex items-center gap-1"><BadgeCheck size={11} className="text-primary shrink-0" /> Verificadas</span>
            <span className="flex items-center gap-1"><CreditCard size={11} className="text-primary shrink-0" /> Pix + Cartão</span>
            <span className="flex items-center gap-1"><Bitcoin size={11} className="text-amber-400 shrink-0" /> BTC</span>
            <span className="flex items-center gap-1"><Tag size={11} className="text-primary shrink-0" /> 12x s/ juros</span>
          </div>
        </div>
      </section>

      {/* Categories horizontal scroll */}
      <section className="py-2.5 border-b border-border/30 bg-background sticky top-[60px] sm:top-[68px] z-30">
        <div className="container mx-auto px-4">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold border whitespace-nowrap transition-all shrink-0 ${
                  activeCategory === cat.key
                    ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "border-border/40 bg-card/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/30 bg-card/30"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-2"><Filter size={13} className="text-primary" /> Ordenar por</h3>
                <button onClick={() => setShowFilters(false)}><X size={16} className="text-muted-foreground" /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { k: "relevance" as const, l: "Relevância" },
                  { k: "price_asc" as const, l: "Menor preço" },
                  { k: "price_desc" as const, l: "Maior preço" },
                  { k: "sold" as const, l: "Mais vendidos" },
                ].map(s => (
                  <button
                    key={s.k}
                    onClick={() => { setSortBy(s.k); setShowFilters(false); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold border transition-all ${
                      sortBy === s.k ? "border-primary bg-primary/10 text-primary" : "border-border/40 text-muted-foreground"
                    }`}
                  >
                    {s.l}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="py-4 sm:py-6">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid lg:grid-cols-[200px_1fr] gap-4 sm:gap-6">

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col gap-3">
              <Card className="border-border/30 bg-card/30 backdrop-blur-sm p-3 rounded-xl">
                <h3 className="font-bold text-xs text-foreground mb-2 flex items-center gap-2"><ShoppingBag size={13} className="text-primary" /> Categorias</h3>
                <div className="space-y-0.5">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${
                        activeCategory === cat.key ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="border-border/30 bg-card/30 backdrop-blur-sm p-3 rounded-xl">
                <h3 className="font-bold text-xs text-foreground mb-2">Ordenar</h3>
                <div className="space-y-0.5 text-xs">
                  {[
                    { k: "relevance" as const, l: "Mais relevantes" },
                    { k: "price_asc" as const, l: "Menor preço" },
                    { k: "price_desc" as const, l: "Maior preço" },
                    { k: "sold" as const, l: "Mais vendidos" },
                  ].map(s => (
                    <button
                      key={s.k}
                      onClick={() => setSortBy(s.k)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg transition-all ${
                        sortBy === s.k ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                      }`}
                    >
                      {s.l}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-3 rounded-xl">
                <Flame size={18} className="text-primary mb-1.5" />
                <h3 className="font-bold text-xs text-foreground mb-0.5">Seja um Lojista</h3>
                <p className="text-[10px] text-muted-foreground mb-2">Exponha até 10 produtos e receba 95%!</p>
                <Button size="sm" className="w-full text-[10px] font-bold bg-primary text-primary-foreground rounded-lg h-8" asChild>
                  <Link to="/cadastro">Cadastrar Loja</Link>
                </Button>
              </Card>
            </aside>

            {/* Products Grid */}
            <div>
              {/* Seção de Farmácias Parceiras Verificadas */}
              {verifiedVendors.length > 0 && !searchQuery && activeCategory === "Todos" && (
                <div className="mb-6 p-4 rounded-2xl bg-card/40 border border-border/40">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs sm:text-sm font-bold flex items-center gap-1.5 text-foreground">
                      <Store size={15} className="text-primary" /> Farmácias Parceiras Verificadas
                    </h2>
                    <span className="text-[10px] text-muted-foreground font-mono">Dispensação Oficial</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {verifiedVendors.map((v) => (
                      <FarmaciaCard key={v.id} vendor={v} />
                    ))}
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{filtered.length} produto{filtered.length !== 1 ? "s" : ""}</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}><Grid3X3 size={14} /></button>
                  <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}><List size={14} /></button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                  {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
                </div>
              ) : (
                <motion.div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3"
                      : "space-y-2.5"
                  }
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={stagger}
                  key={activeCategory + searchQuery + sortBy}
                >
                  {filtered.map(p => {
                    const discount = p.compare_price ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100) : 0;
                    const vendorName = (p as any).vendors?.store_name || "Loja Parceira";
                    const images = [p.image_url, p.image_url_2, p.image_url_3].filter(Boolean) as string[];

                    return (
                      <motion.div key={p.id} variants={fadeUp}>
                        {viewMode === "grid" ? (
                          <Card className="border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 bg-card/30 backdrop-blur-sm overflow-hidden group rounded-xl">
                            <CardContent className="p-0">
                              <div className="relative">
                                <Link to={`/shopping/${p.id}`} className="block">
                                  <ImageCarousel images={images} alt={p.name} />
                                </Link>
                                {/* Badges - left side stacked */}
                                <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 pointer-events-none">
                                  {discount > 0 && (
                                    <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md bg-destructive text-destructive-foreground font-bold shadow-sm w-fit">
                                      {discount}% OFF
                                    </span>
                                  )}
                                  <span className="text-[7px] sm:text-[8px] px-1.5 py-0.5 rounded-md bg-primary/90 text-primary-foreground font-bold shadow-sm w-fit">
                                    FRETE GRÁTIS
                                  </span>
                                  {p.endorsed_by_doctor && <DoctorEndorsedBadge compact />}
                                  {p.as_anvisa && <AnvisaBadge compact registration={p.as_anvisa} />}
                                </div>
                                {/* Favorite heart - outside Link */}
                                <button
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(p.id); }}
                                  className="absolute top-1.5 right-1.5 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                                >
                                  <Heart size={16} className={isFav(p.id) ? "text-red-500 fill-red-500" : "text-muted-foreground"} />
                                </button>
                              </div>

                              <div className="p-2.5 sm:p-3">
                                <p className="text-[8px] sm:text-[9px] text-muted-foreground mb-0.5 flex items-center gap-1 truncate">
                                  <Store size={8} className="text-primary shrink-0" /> {vendorName}
                                </p>

                                <Link to={`/shopping/${p.id}`}>
                                  <h2 className="font-bold text-foreground hover:text-primary transition-colors text-[11px] sm:text-xs line-clamp-2 min-h-[2.2em] leading-tight mb-1">
                                    {p.name}
                                  </h2>
                                </Link>

                                <div className="flex items-center gap-0.5 mb-1">
                                  {[1,2,3,4,5].map(s => <Star key={s} size={8} className={s <= Math.round(p.rating || 5) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"} />)}
                                  <span className="text-[8px] text-muted-foreground ml-0.5">({p.review_count})</span>
                                </div>

                                {p.compare_price && <p className="text-[8px] sm:text-[9px] text-muted-foreground line-through">{fmtPrice(p.compare_price)}</p>}
                                <p className="text-base sm:text-lg font-display font-bold text-foreground leading-none">{fmtPrice(p.price)}</p>
                                <p className="text-[8px] sm:text-[9px] text-primary font-bold mt-0.5">12x {fmtPrice(p.price / 12)} s/ juros</p>
                                <p className="text-[7px] sm:text-[8px] text-muted-foreground mt-0.5 mb-2">{p.sold_count} vendidos</p>

                                <Button
                                  size="sm"
                                  className="w-full text-[10px] sm:text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-8 shadow-md shadow-primary/10 mb-1.5"
                                  onClick={(e) => { e.preventDefault(); handleBuyProduct(p); }}
                                >
                                  Comprar Agora 💳
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full text-[8px] sm:text-[9px] font-bold border-amber-500/20 text-amber-500 hover:bg-amber-500/10 rounded-lg h-6 sm:h-7"
                                  onClick={(e) => { e.preventDefault(); setBtcModal({ open: true, planName: p.name, planId: p.id, amount: fmtPrice(p.price) }); }}
                                >
                                  <Bitcoin size={9} className="mr-0.5" /> Pague Com BTC
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          /* List View */
                          <Card className="border-border/30 hover:border-primary/30 transition-all bg-card/30 backdrop-blur-sm rounded-xl">
                            <CardContent className="p-0">
                              <div className="flex gap-3 p-3">
                                <Link to={`/shopping/${p.id}`} className="shrink-0 relative">
                                  <img src={resolveImg(p.image_url)} alt={p.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover" loading="lazy" />
                                </Link>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[8px] sm:text-[9px] text-muted-foreground mb-0.5 flex items-center gap-1"><Store size={9} className="text-primary" /> {vendorName}</p>
                                      <Link to={`/shopping/${p.id}`}>
                                        <h2 className="font-bold text-foreground hover:text-primary transition-colors text-xs sm:text-sm mb-0.5 line-clamp-1">{p.name}</h2>
                                      </Link>
                                      {p.endorsed_by_doctor && <div className="mt-1"><DoctorEndorsedBadge compact /></div>}
                                      {p.as_anvisa && <div className="mt-1"><AnvisaBadge compact registration={p.as_anvisa} /></div>}
                                    </div>
                                    <button
                                      onClick={() => toggleFav(p.id)}
                                      className="shrink-0 w-8 h-8 rounded-full bg-card/80 flex items-center justify-center hover:scale-110 transition-transform ml-2"
                                    >
                                      <Heart size={16} className={isFav(p.id) ? "text-red-500 fill-red-500" : "text-muted-foreground"} />
                                    </button>
                                  </div>
                                  <p className="text-[9px] sm:text-xs text-muted-foreground line-clamp-1 mb-1">{p.description}</p>
                                  <div className="flex items-center gap-0.5 mb-1">
                                    {[1,2,3,4,5].map(s => <Star key={s} size={9} className={s <= Math.round(p.rating || 5) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"} />)}
                                    <span className="text-[8px] text-muted-foreground">({p.review_count}) • {p.sold_count} vendidos</span>
                                  </div>
                                  <div className="flex items-end justify-between flex-wrap gap-2">
                                    <div>
                                      {p.compare_price && <p className="text-[9px] text-muted-foreground line-through">{fmtPrice(p.compare_price)}</p>}
                                      <p className="text-lg sm:text-xl font-display font-bold text-foreground">{fmtPrice(p.price)}</p>
                                      <p className="text-[8px] sm:text-[9px] text-primary font-bold">Frete Grátis • 12x</p>
                                    </div>
                                    <div className="flex gap-1.5">
                                      <Button size="sm" className="text-[10px] font-bold bg-primary text-primary-foreground rounded-lg h-8 px-3" onClick={() => handleBuyProduct(p)}>Comprar 💳</Button>
                                      <Button size="sm" variant="outline" className="text-[8px] font-bold border-amber-500/20 text-amber-500 hover:bg-amber-500/10 rounded-lg h-8 px-2"
                                        onClick={() => setBtcModal({ open: true, planName: p.name, planId: p.id, amount: fmtPrice(p.price) })}>
                                        <Bitcoin size={10} /> BTC
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="text-center py-16">
                  <Search size={40} className="text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum produto encontrado{searchQuery && ` para "${searchQuery}"`}</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-[8px] sm:text-[9px] text-muted-foreground text-center mt-6">
            ⚠️ A Planta & Raiz é uma infraestrutura tecnológica autônoma. Responsabilidade técnica pelo produto cabe ao lojista cadastrado. Taxa: 5%.
          </p>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="py-10 sm:py-16 bg-gradient-to-br from-primary/5 to-card/30 border-t border-border/30">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-2 sm:mb-3">É Lojista ou Fabricante?</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Até 10 produtos, 3 fotos por item</p>
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Receba 95% • Saque imediato ou acumulado</p>
          <p className="text-xs sm:text-sm text-primary font-bold mb-6">Mercado Pago + Bitcoin aceitos!</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button className="font-bold bg-primary text-primary-foreground rounded-xl h-11 sm:h-12 shadow-lg shadow-primary/20" asChild>
              <Link to="/cadastro">Cadastrar Loja <ArrowRight size={16} className="ml-2" /></Link>
            </Button>
            <Button variant="outline" className="font-bold border-primary/30 text-primary rounded-xl h-11 sm:h-12" asChild>
              <Link to="/dashboard-loja">Dashboard Lojista <Store size={16} className="ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <WhatsAppProofModal open={modalState.open} onOpenChange={setModalOpen} context={modalState.context} onProceed={modalState.onProceed} />
      <BTCPaymentModal open={btcModal.open} onClose={() => setBtcModal({ ...btcModal, open: false })} planName={btcModal.planName} planId={btcModal.planId} amount={btcModal.amount} />
      <PrescriptionVerificationModal
        open={rxModal.open}
        onClose={() => setRxModal({ open: false, productName: "", pendingProduct: null })}
        productName={rxModal.productName}
        onHasPrescription={proceedWithPurchaseMain}
        onNeedsPrescription={() => { setRxModal({ open: false, productName: "", pendingProduct: null }); window.location.href = "/profissionais"; }}
      />
      <Footer />
    </div>
  );
};

export default Shopping;
