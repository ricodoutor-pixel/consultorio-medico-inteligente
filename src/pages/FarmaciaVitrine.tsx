import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Store, 
  MapPin, 
  Star, 
  BadgeCheck, 
  Shield, 
  ShoppingBag, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Truck, 
  ArrowLeft,
  Share2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface PublicVendor {
  id: string;
  store_name: string;
  store_description: string | null;
  store_logo_url: string | null;
  store_banner_url: string | null;
  rating: number;
  total_sales: number;
  is_verified: boolean;
  city: string;
  state: string;
}

interface PublicProduct {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  category: string;
  image_url: string;
  image_url_2: string | null;
  image_url_3: string | null;
  stock: number;
  sold_count: number;
  rating: number;
  is_active: boolean;
}

export default function FarmaciaVitrine() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addItem } = useCart();

  const [vendor, setVendor] = useState<PublicVendor | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    async function loadPublicStore() {
      if (!vendorId) return;
      try {
        setLoading(true);
        // 1. Buscar vendor
        const { data: vData, error: vErr } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', vendorId)
          .maybeSingle();

        if (vErr || !vData) {
          toast({ title: "Farmácia não encontrada", variant: "destructive" });
          setLoading(false);
          return;
        }

        setVendor({
          id: vData.id,
          store_name: vData.store_name || "Farmácia Parceira",
          store_description: vData.store_description || "Farmácia de manipulação e dispensação credenciada na rede Planta y Raíz.",
          store_logo_url: vData.store_logo_url || null,
          store_banner_url: vData.store_banner_url || null,
          rating: Number(vData.rating || 5.0),
          total_sales: Number(vData.total_sales || 0),
          is_verified: true,
          city: "São Paulo",
          state: "SP"
        });

        // 2. Buscar produtos da farmácia
        const { data: pData } = await supabase
          .from('vendor_products')
          .select('*')
          .eq('vendor_id', vendorId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10);

        setProducts(pData || []);
      } catch (err: any) {
        console.error("[FarmaciaVitrine] erro:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPublicStore();
  }, [vendorId, toast]);

  const handleAddToCart = (product: PublicProduct) => {
    addItem({
      id: product.id,
      title: product.name,
      description: product.description || "",
      benefits: "Uso sob prescrição médica.",
      price: `R$ ${product.price.toFixed(2).replace('.', ',')}`,
      priceValue: product.price,
      category: product.category,
      vendor: vendor?.store_name || "Farmácia Parceira",
      rating: product.rating || 5.0,
      imageUrl: product.image_url,
      tags: ["Canabidiol", "Farmácia", product.category],
      freeShipping: true
    });

    toast({
      title: "🛒 Produto adicionado ao carrinho!",
      description: `${product.name} foi inserido no seu pedido.`
    });
    setSelectedProduct(null);
  };

  const getProductImages = (p: PublicProduct) => {
    return [p.image_url, p.image_url_2, p.image_url_3].filter(Boolean) as string[];
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center">
        <Navbar />
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-[-15px] rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Store size={48} className="text-primary animate-pulse" />
        </div>
        <p className="mt-6 text-foreground font-bold">Carregando Vitrine da Farmácia...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-dvh bg-background flex flex-col justify-between">
        <Navbar />
        <div className="container mx-auto px-4 py-24 text-center max-w-md">
          <Store size={64} className="text-muted-foreground mx-auto mb-4 opacity-40" />
          <h2 className="text-2xl font-bold text-foreground">Farmácia Não Encontrada</h2>
          <p className="text-muted-foreground text-sm mt-2 mb-6">
            A vitrine que você está procurando pode ter sido desativada ou não existe.
          </p>
          <Button asChild className="bg-primary text-primary-foreground font-bold">
            <Link to="/shopping">Voltar ao Shopping Geral</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-16">
        {/* Botão Voltar */}
        <div className="mb-4">
          <Button variant="ghost" size="sm" asChild className="text-xs font-bold text-muted-foreground hover:text-foreground">
            <Link to="/shopping">
              <ArrowLeft size={14} className="mr-1.5" /> Voltar ao Shopping
            </Link>
          </Button>
        </div>

        {/* Header da Farmácia */}
        <div className="rounded-3xl overflow-hidden border border-border bg-card shadow-2xl mb-8">
          {/* Banner */}
          <div
            className="h-44 md:h-56 relative w-full"
            style={{
              background: vendor.store_banner_url
                ? `url(${vendor.store_banner_url}) center/cover`
                : "linear-gradient(135deg, #062b1e 0%, #0d4a34 50%, #10b981 100%)"
            }}
          >
            <div className="absolute inset-0 bg-black/30" />
          </div>

          {/* Dados da Loja */}
          <div className="p-6 pt-0 relative flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-12 md:-mt-14">
            <div className="flex items-end gap-4">
              {/* Logo */}
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-card bg-background overflow-hidden flex items-center justify-center shadow-xl flex-shrink-0">
                {vendor.store_logo_url ? (
                  <img src={vendor.store_logo_url} alt={vendor.store_name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="text-primary" size={48} />
                )}
              </div>

              <div className="mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-display font-black text-foreground">
                    {vendor.store_name}
                  </h1>
                  {vendor.is_verified && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold">
                      <BadgeCheck size={12} className="mr-1" /> Farmácia Verificada
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-primary" /> {vendor.city}, {vendor.state}
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star size={12} fill="currentColor" /> {vendor.rating.toFixed(1)} / 5.0
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Truck size={12} /> Envio para todo o Brasil
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-bold rounded-xl"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast({ title: "Link copiado!", description: "Link da vitrine copiado para a área de transferência." });
                }}
              >
                <Share2 size={14} className="mr-1.5" /> Compartilhar Loja
              </Button>
            </div>
          </div>

          {/* Descrição */}
          {vendor.store_description && (
            <div className="px-6 pb-6 text-xs text-muted-foreground max-w-3xl leading-relaxed border-t border-border/40 pt-4">
              {vendor.store_description}
            </div>
          )}
        </div>

        {/* Grid de Produtos */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShoppingBag size={18} className="text-primary" /> Catálogo da Farmácia ({products.length} produtos)
          </h2>
          <span className="text-xs text-muted-foreground font-mono">Dispensação Autorizada ANVISA</span>
        </div>

        {products.length === 0 ? (
          <Card className="bg-card border-border p-12 text-center">
            <ShoppingBag size={48} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-foreground">Nenhum produto disponível no momento</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Esta farmácia está atualizando o estoque e catálogo. Volte em breve!
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const discount = p.compare_price ? Math.round(((p.compare_price - p.price) / p.compare_price) * 100) : 0;

              return (
                <motion.div
                  key={p.id}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all flex flex-col justify-between shadow-lg"
                >
                  <div 
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedProduct(p);
                      setActiveImageIndex(0);
                    }}
                  >
                    {/* Imagem do Produto */}
                    <div className="h-48 bg-muted/20 relative p-4 flex items-center justify-center overflow-hidden">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      {discount > 0 && (
                        <Badge className="absolute top-2 left-2 bg-rose-600 text-white font-bold text-[10px]">
                          -{discount}% OFF
                        </Badge>
                      )}
                      <Badge className="absolute top-2 right-2 bg-emerald-600/90 text-[9px] uppercase font-bold">
                        <Shield size={10} className="mr-1" /> ANVISA
                      </Badge>
                    </div>

                    {/* Detalhes */}
                    <div className="p-4">
                      <p className="text-[10px] text-primary font-mono uppercase font-bold">{p.category}</p>
                      <h3 className="font-bold text-sm text-foreground mt-1 line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors">
                        {p.name}
                      </h3>

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-black text-foreground">
                          R$ {p.price.toFixed(2).replace('.', ',')}
                        </span>
                        {p.compare_price && (
                          <span className="text-xs text-muted-foreground line-through">
                            R$ {p.compare_price.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        <CheckCircle size={10} className="text-emerald-400" /> {p.stock > 0 ? `${p.stock} em estoque` : "Sob encomenda"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl h-10 shadow-md shadow-emerald-950/20"
                      onClick={() => handleAddToCart(p)}
                    >
                      <ShoppingBag size={14} className="mr-1.5" /> Adicionar ao Carrinho
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Modal de Detalhes do Produto */}
        <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
          {selectedProduct && (
            <DialogContent className="max-w-xl bg-card border-border rounded-2xl">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-primary/20 text-primary uppercase text-[10px] font-bold">
                    {selectedProduct.category}
                  </Badge>
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                    <Shield size={10} className="mr-1" /> ANVISA Autorizado
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-bold text-foreground leading-tight">
                  {selectedProduct.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Vendido e entregue por <strong>{vendor.store_name}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="py-2 space-y-4">
                {/* Carrossel de 3 Fotos */}
                {(() => {
                  const images = getProductImages(selectedProduct);
                  return (
                    <div className="relative rounded-2xl bg-muted/20 border border-border p-4 h-60 flex items-center justify-center overflow-hidden">
                      <img
                        src={images[activeImageIndex] || selectedProduct.image_url}
                        alt={selectedProduct.name}
                        className="h-full w-full object-contain"
                      />

                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full p-1.5 shadow-md"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full p-1.5 shadow-md"
                          >
                            <ChevronRight size={16} />
                          </button>

                          {/* Indicadores de Ponto */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                            {images.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setActiveImageIndex(i)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  activeImageIndex === i ? "bg-primary w-5" : "bg-muted-foreground/40"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Preço e Estoque */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-foreground">
                        R$ {selectedProduct.price.toFixed(2).replace('.', ',')}
                      </span>
                      {selectedProduct.compare_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          R$ {selectedProduct.compare_price.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                      Em até 12x no cartão ou com desconto no PIX
                    </p>
                  </div>

                  <div className="text-right">
                    <Badge variant="outline" className="text-xs border-border">
                      📦 {selectedProduct.stock} unidades disponíveis
                    </Badge>
                  </div>
                </div>

                {/* Descrição */}
                {selectedProduct.description && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-foreground">Descrição do Produto:</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/20 p-3 rounded-xl border border-border">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-11 rounded-xl"
                  onClick={() => handleAddToCart(selectedProduct)}
                >
                  <ShoppingBag size={16} className="mr-2" /> Adicionar ao Carrinho
                </Button>
                <Button
                  variant="outline"
                  className="text-xs font-bold border-border h-11 rounded-xl"
                  onClick={() => {
                    setSelectedProduct(null);
                    navigate("/login?redirect=/prontuario");
                  }}
                >
                  <FileText size={16} className="mr-2" /> Verificar Minha Receita
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}
