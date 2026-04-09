import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ShoppingBag, Star, ShoppingCart, Plus, Minus, ArrowLeft, ArrowRight,
  Store, CreditCard, Truck, Search, Shield, Grid3X3, List, ChevronRight,
  Tag, Package, Bitcoin, Heart, MapPin, Clock, ChevronLeft, Percent,
  BadgeCheck, Flame, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppProofModal, useWhatsAppProofModal, type WhatsAppContext } from "@/components/WhatsAppProofModal";
import { BTCPaymentModal } from "@/components/BTCPaymentModal";

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
  vendors?: { id: string; store_name: string; rating: number | null; };
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

const PLATFORM_FEE = 0.05; // 5%

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

/* ─── IMAGE CAROUSEL ─── */
const ImageCarousel = ({ images, alt }: { images: string[]; alt: string }) => {
  const [idx, setIdx] = useState(0);
  const validImgs = images.filter(Boolean);
  return (
    <div className="relative group">
      <img src={resolveImg(validImgs[idx])} alt={alt} className="w-full h-56 sm:h-64 object-cover" loading="lazy" />
      {validImgs.length > 1 && (
        <>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx((idx - 1 + validImgs.length) % validImgs.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={16} /></button>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx((idx + 1) % validImgs.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={16} /></button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {validImgs.map((_, i) => <span key={i} className={`w-2 h-2 rounded-full transition-all ${i === idx ? "bg-primary scale-125" : "bg-background/60"}`} />)}
          </div>
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

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("vendor_products").select("*, vendors(id, store_name, rating)").eq("id", id).single();
      if (data) {
        setProduct(data as any);
        setVendor((data as any).vendors);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!product) return <div className="container mx-auto px-4 pt-32 text-center text-muted-foreground">Produto não encontrado.</div>;

  const images = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean) as string[];
  const discount = product.compare_price ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100) : 0;
  const priceStr = `R$ ${product.price.toFixed(2).replace(".", ",")}`;

  const handleBuy = () => {
    showModal(
      { type: "compra", productName: product.name, value: product.price } as WhatsAppContext,
      async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { toast({ title: "Faça login para comprar", variant: "destructive" }); return; }
        const { data, error } = await supabase.functions.invoke("create-cart-payment", {
          body: { items: [{ title: product.name, quantity: 1, price: product.price }], total: product.price, description: `Planta y Raiz Ltda - ${product.name}` },
        });
        if (error) { toast({ title: "Erro ao gerar pagamento", variant: "destructive" }); return; }
        if (data?.init_point) { window.open(data.init_point, "_blank"); toast({ title: "Redirecionando para pagamento... 💳" }); }
      }
    );
  };

  return (
    <div className="container mx-auto px-4 pt-24 pb-16 md:pt-28">
      <Link to="/shopping" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={16} /> Voltar ao Shopping
      </Link>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8 max-w-6xl mx-auto">
        {/* Left: Images */}
        <div>
          <Card className="border-border overflow-hidden bg-card/50 mb-3">
            <img src={resolveImg(images[mainImg])} alt={product.name} className="w-full h-[400px] object-contain bg-background p-4" />
          </Card>
          <div className="flex gap-2">
            {images.map((img, i) => (
              <button key={i} onClick={() => setMainImg(i)} className={`w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${i === mainImg ? "border-primary" : "border-border opacity-60 hover:opacity-100"}`}>
                <img src={resolveImg(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div>
          {/* Vendor info */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20 flex items-center gap-1">
              <BadgeCheck size={12} /> Loja Verificada
            </span>
            {discount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-bold border border-red-500/20">
                -{discount}% OFF
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Store size={12} className="text-primary" /> {vendor?.store_name || "Loja Parceira"} • {product.category}
          </p>

          <h1 className="text-xl md:text-2xl font-display font-bold text-foreground mb-2">{product.name}</h1>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= Math.round(product.rating || 5) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"} />)}</div>
            <span className="text-sm font-bold">{product.rating || 5}</span>
            <span className="text-xs text-muted-foreground">| {product.sold_count} vendidos</span>
          </div>

          {/* Price block */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mb-4">
            {product.compare_price && (
              <p className="text-sm text-muted-foreground line-through">R$ {product.compare_price.toFixed(2).replace(".", ",")}</p>
            )}
            <p className="text-3xl font-display font-bold text-gradient-gold">{priceStr}</p>
            <p className="text-xs text-emerald-500 font-bold mt-1">em até 12x de R$ {(product.price / 12).toFixed(2).replace(".", ",")} sem juros</p>
            <p className="text-[10px] text-muted-foreground mt-1">Taxa de plataforma: 5% • Lojista recebe 95%</p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{product.description}</p>

          <div className="space-y-2 mb-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><Truck size={14} className="text-emerald-500" /> Frete Grátis para todo o Brasil</div>
            <div className="flex items-center gap-2"><Shield size={14} className="text-primary" /> Compra 100% Segura • Escrow até Confirmação</div>
            <div className="flex items-center gap-2"><Package size={14} className="text-primary" /> Estoque: {product.stock} unidades</div>
            <div className="flex items-center gap-2"><Clock size={14} className="text-amber-400" /> Entrega em 3-7 dias úteis</div>
          </div>

          <Button className="w-full font-bold h-14 text-base bg-primary text-primary-foreground hover:bg-primary/90 mb-2" onClick={handleBuy}>
            Comprar Agora 💳
          </Button>
          <Button variant="outline" className="w-full font-bold border-amber-500/40 text-amber-500 hover:bg-amber-500/10 gap-2 h-12" onClick={() => setBtcModal({ open: true, planName: product.name, planId: product.id, amount: priceStr })}>
            <Bitcoin size={16} /> Pague Com BTC
          </Button>

          <p className="text-[10px] text-muted-foreground mt-4 text-center">⚠️ A Planta & Raiz retém 5% para manutenção. O lojista recebe 95% do valor automaticamente.</p>
        </div>
      </div>

      <WhatsAppProofModal open={modalState.open} onOpenChange={setModalOpen} context={modalState.context} onProceed={modalState.onProceed} />
      <BTCPaymentModal open={btcModal.open} onClose={() => setBtcModal({ ...btcModal, open: false })} planName={btcModal.planName} planId={btcModal.planId} amount={btcModal.amount} />
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
  const { addItem, count, items, removeItem, updateQty, total, clearCart } = useCart();
  const { toast } = useToast();
  const [showCart, setShowCart] = useState(false);
  const { modalState, showModal, setModalOpen } = useWhatsAppProofModal();
  const [btcModal, setBtcModal] = useState({ open: false, planName: "", planId: "", amount: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("vendor_products").select("*, vendors(id, store_name, rating)").eq("is_active", true);
      if (data) setProducts(data as any);
      setLoading(false);
    })();
  }, []);

  if (id) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <WhatsAppButton />
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
    showModal(
      { type: "compra", productName: p.name, value: p.price } as WhatsAppContext,
      async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { toast({ title: "Faça login para comprar", variant: "destructive" }); setTimeout(() => window.location.href = "/login", 1500); return; }
        const { data, error } = await supabase.functions.invoke("create-cart-payment", {
          body: { items: [{ title: p.name, quantity: 1, price: p.price }], total: p.price, description: `Planta y Raiz Ltda - ${p.name}` },
        });
        if (error) { toast({ title: "Erro ao gerar pagamento", variant: "destructive" }); return; }
        if (data?.init_point) { window.open(data.init_point, "_blank"); toast({ title: "Redirecionando... 💳" }); }
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      {/* Top bar Mercado Livre style */}
      <section className="pt-20 md:pt-28 pb-3 bg-primary/5 border-b border-border">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center gap-2 sm:gap-4 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos medicinais..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-12 h-10 sm:h-12 rounded-full border-border bg-background text-sm font-medium"
              />
            </div>
            <Button className="h-10 sm:h-12 px-4 sm:px-6 rounded-full bg-primary text-primary-foreground font-bold">
              <Search size={16} />
            </Button>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 max-w-4xl mx-auto">
            <Link to="/" className="hover:text-foreground">Início</Link>
            <ChevronRight size={12} />
            <span className="text-foreground font-bold">Shopping</span>
            {activeCategory !== "Todos" && <>
              <ChevronRight size={12} />
              <span className="text-primary font-bold">{CATEGORIES.find(c => c.key === activeCategory)?.label}</span>
            </>}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-2.5 border-b border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap text-[11px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield size={13} className="text-emerald-500" /> Compra Segura</span>
            <span className="flex items-center gap-1.5"><Truck size={13} className="text-primary" /> Frete Grátis</span>
            <span className="flex items-center gap-1.5"><BadgeCheck size={13} className="text-emerald-500" /> Lojas Verificadas</span>
            <span className="flex items-center gap-1.5"><CreditCard size={13} className="text-primary" /> Pix + Cartão + BTC</span>
            <span className="flex items-center gap-1.5"><Tag size={13} className="text-amber-400" /> Até 12x s/ juros</span>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-[220px_1fr] gap-6">
            {/* Sidebar */}
            <aside className="hidden lg:block space-y-4">
              <Card className="border-border bg-card/50 p-4">
                <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2"><ShoppingBag size={14} className="text-primary" /> Categorias</h3>
                <div className="space-y-0.5">
                  {CATEGORIES.map(cat => (
                    <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${activeCategory === cat.key ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </Card>
              <Card className="border-border bg-card/50 p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">Ordenar</h3>
                <div className="space-y-0.5 text-sm">
                  {[
                    { k: "relevance" as const, l: "Mais relevantes" },
                    { k: "price_asc" as const, l: "Menor preço" },
                    { k: "price_desc" as const, l: "Maior preço" },
                    { k: "sold" as const, l: "Mais vendidos" },
                  ].map(s => (
                    <button key={s.k} onClick={() => setSortBy(s.k)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all ${sortBy === s.k ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"}`}>
                      {s.l}
                    </button>
                  ))}
                </div>
              </Card>
              <Card className="border-border bg-card/50 p-4">
                <h3 className="font-bold text-sm text-foreground mb-2">Frete</h3>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked readOnly className="accent-[hsl(var(--primary))]" /> Frete Grátis
                </label>
              </Card>

              {/* Become a vendor CTA */}
              <Card className="border-primary/20 bg-primary/5 p-4">
                <Flame size={20} className="text-primary mb-2" />
                <h3 className="font-bold text-sm text-foreground mb-1">Seja um Lojista</h3>
                <p className="text-[11px] text-muted-foreground mb-3">Exponha até 10 produtos e receba 95% do valor!</p>
                <Button size="sm" className="w-full text-xs font-bold bg-primary text-primary-foreground" asChild>
                  <Link to="/cadastro">Cadastrar Loja</Link>
                </Button>
              </Card>
            </aside>

            {/* Products */}
            <div>
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex flex-wrap gap-2 lg:hidden overflow-x-auto pb-1">
                  {CATEGORIES.map(cat => (
                    <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-colors ${activeCategory === cat.key ? "border-primary bg-primary/10 text-primary" : "border-border bg-card/50 text-muted-foreground"}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-muted-foreground">{filtered.length} produtos</span>
                  <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><Grid3X3 size={16} /></button>
                  <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><List size={16} /></button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
              ) : (
                <motion.div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4" : "space-y-3"} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} key={activeCategory + searchQuery + sortBy}>
                  {filtered.map(p => {
                    const discount = p.compare_price ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100) : 0;
                    const vendorName = (p as any).vendors?.store_name || "Loja Parceira";
                    const images = [p.image_url, p.image_url_2, p.image_url_3].filter(Boolean) as string[];

                    return (
                      <motion.div key={p.id} variants={fadeUp}>
                        {viewMode === "grid" ? (
                          <Card className="border-border hover:border-primary/30 transition-all hover:shadow-lg bg-card/50 overflow-hidden group">
                            <CardContent className="p-0">
                              <Link to={`/shopping/${p.id}`} className="relative block">
                                <ImageCarousel images={images} alt={p.name} />
                                {discount > 0 && <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">{discount}% OFF</span>}
                                <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/90 text-white font-bold">FRETE GRÁTIS</span>
                              </Link>
                              <div className="p-3 sm:p-4">
                                <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1 truncate">
                                  <Store size={10} className="text-primary shrink-0" /> {vendorName}
                                </p>
                                <Link to={`/shopping/${p.id}`}>
                                  <h3 className="font-bold text-foreground mb-1 hover:text-primary transition-colors text-xs sm:text-sm line-clamp-2 min-h-[2.5em]">{p.name}</h3>
                                </Link>
                                <div className="flex items-center gap-1 mb-1.5">
                                  {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= Math.round(p.rating || 5) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"} />)}
                                  <span className="text-[10px] text-muted-foreground ml-0.5">({p.review_count})</span>
                                </div>
                                {p.compare_price && <p className="text-[10px] text-muted-foreground line-through">R$ {p.compare_price.toFixed(2).replace(".", ",")}</p>}
                                <p className="text-lg sm:text-xl font-display font-bold text-gradient-gold">R$ {p.price.toFixed(2).replace(".", ",")}</p>
                                <p className="text-[10px] text-emerald-500 font-bold mb-2">12x R$ {(p.price / 12).toFixed(2).replace(".", ",")} s/ juros</p>
                                <p className="text-[9px] text-muted-foreground mb-2">{p.sold_count} vendidos</p>

                                <Button size="sm" className="w-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 mb-1.5 h-9" onClick={(e) => { e.preventDefault(); handleBuyProduct(p); }}>
                                  Comprar Agora 💳
                                </Button>
                                <Button size="sm" variant="outline" className="w-full text-[10px] font-bold border-amber-500/30 text-amber-500 hover:bg-amber-500/10 h-7"
                                  onClick={(e) => { e.preventDefault(); setBtcModal({ open: true, planName: p.name, planId: p.id, amount: `R$ ${p.price.toFixed(2).replace(".", ",")}` }); }}>
                                  <Bitcoin size={10} className="mr-1" /> Pague Com BTC
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Card className="border-border hover:border-primary/30 transition-all bg-card/50">
                            <CardContent className="p-0">
                              <div className="flex gap-4 p-4">
                                <Link to={`/shopping/${p.id}`} className="shrink-0">
                                  <img src={resolveImg(p.image_url)} alt={p.name} className="w-36 h-36 rounded-xl object-cover" loading="lazy" />
                                </Link>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Store size={10} className="text-primary" /> {vendorName}</p>
                                  <Link to={`/shopping/${p.id}`}><h3 className="font-bold text-foreground hover:text-primary transition-colors text-sm mb-1">{p.name}</h3></Link>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.description}</p>
                                  <div className="flex items-center gap-1 mb-2">
                                    {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= Math.round(p.rating || 5) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"} />)}
                                    <span className="text-[10px] text-muted-foreground">({p.review_count}) • {p.sold_count} vendidos</span>
                                  </div>
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div>
                                      {p.compare_price && <p className="text-xs text-muted-foreground line-through">R$ {p.compare_price.toFixed(2).replace(".", ",")}</p>}
                                      <p className="text-xl font-display font-bold text-gradient-gold">R$ {p.price.toFixed(2).replace(".", ",")}</p>
                                      <p className="text-[10px] text-emerald-500 font-bold">Frete Grátis • 12x s/ juros</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" className="text-xs font-bold bg-primary text-primary-foreground" onClick={() => handleBuyProduct(p)}>Comprar 💳</Button>
                                      <Button size="sm" variant="outline" className="text-[10px] font-bold border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                                        onClick={() => setBtcModal({ open: true, planName: p.name, planId: p.id, amount: `R$ ${p.price.toFixed(2).replace(".", ",")}` })}>
                                        <Bitcoin size={10} className="mr-1" /> BTC
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
                  <Search size={48} className="text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum produto encontrado{searchQuery && ` para "${searchQuery}"`}</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-center mt-8">
            ⚠️ A Planta & Raiz é uma infraestrutura tecnológica autônoma. A responsabilidade técnica pelo produto cabe exclusivamente ao lojista cadastrado. Taxa de manutenção: 5%.
          </p>
        </div>
      </section>

      {/* Vendor CTA Section */}
      <section className="py-16 md:py-20 bg-card/30 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-4">É Lojista ou Fabricante?</h2>
          <p className="text-base md:text-lg text-muted-foreground mb-2 max-w-xl mx-auto">Cadastre sua loja: até 10 produtos, 3 fotos por item</p>
          <p className="text-sm text-muted-foreground mb-2">Receba 95% do valor • Saque imediato ou acumulado</p>
          <p className="text-sm text-emerald-500 font-bold mb-8">Pagamentos via Mercado Pago + Bitcoin aceitos!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="font-bold bg-primary text-primary-foreground" asChild>
              <Link to="/cadastro">Cadastrar Loja <ArrowRight size={20} className="ml-2" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="font-bold border-primary text-primary" asChild>
              <Link to="/shopping-dashboard">Dashboard Lojista <Store size={20} className="ml-2" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <WhatsAppProofModal open={modalState.open} onOpenChange={setModalOpen} context={modalState.context} onProceed={modalState.onProceed} />
      <BTCPaymentModal open={btcModal.open} onClose={() => setBtcModal({ ...btcModal, open: false })} planName={btcModal.planName} planId={btcModal.planId} amount={btcModal.amount} />
      <Footer />
    </div>
  );
};

export default Shopping;
