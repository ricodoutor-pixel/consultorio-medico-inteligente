import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Star, ShoppingCart, Plus, Minus, ArrowLeft, ArrowRight, Store, CreditCard, Truck, Search, Shield, Grid3X3, List, ChevronRight, Tag, Percent, Package, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { products, productCategories, Product } from "@/data/products";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppProofModal, useWhatsAppProofModal, type WhatsAppContext } from "@/components/WhatsAppProofModal";

const handleBuyNowProduct = async (product: Product, toast: any, showModal: any) => {
  showModal(
    { type: "compra", productName: product.title, value: product.priceValue } as WhatsAppContext,
    async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({ title: "Faça login para comprar", variant: "destructive" });
          setTimeout(() => window.location.href = "/login", 1500);
          return;
        }
        const { data, error } = await supabase.functions.invoke("create-cart-payment", {
          body: {
            items: [{ title: product.title, quantity: 1, price: product.priceValue }],
            total: product.priceValue,
            description: `Planta y Raiz Ltda - ${product.title}`,
          },
        });
        if (error) throw error;
        if (data?.init_point) {
          window.open(data.init_point, "_blank");
          toast({ title: "Redirecionando para pagamento... 💳" });
        }
      } catch (err) {
        console.error(err);
        toast({ title: "Erro ao gerar pagamento", variant: "destructive" });
      }
    }
  );
};

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const ProductDetail = ({ id }: { id: string }) => {
  const product = products.find((p) => p.id === id);
  const { addItem } = useCart();
  const { toast } = useToast();
  const { modalState, showModal, setModalOpen } = useWhatsAppProofModal();

  if (!product) return <div className="container mx-auto px-4 pt-32 text-center text-muted-foreground">Produto não encontrado.</div>;

  return (
    <div className="container mx-auto px-4 pt-24 pb-16 md:pt-32">
      <Link to="/shopping" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={16} /> Voltar ao Shopping
      </Link>
      <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <Card className="border-border overflow-hidden bg-card/50">
          <img src={product.imageUrl} alt={product.title} className="w-full h-96 object-cover" />
          <div className="p-3 flex gap-2">
            <div className="w-20 h-20 rounded-lg border-2 border-primary overflow-hidden">
              <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="w-20 h-20 rounded-lg border border-border overflow-hidden opacity-60">
              <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </Card>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-bold border border-secondary/30">Loja Verificada</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">Frete Grátis</span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">{product.vendor} • {product.category}</p>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">{product.title}</h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= Math.round(product.rating) ? "text-primary fill-primary" : "text-muted-foreground/30"} />)}
            </div>
            <span className="text-sm font-bold">{product.rating}</span>
            <span className="text-xs text-muted-foreground">| 127 vendidos</span>
          </div>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mb-4">
            <p className="text-3xl font-display font-bold text-gradient-gold mb-1">{product.price}</p>
            <p className="text-xs text-secondary font-bold">em até 12x de R$ {(product.priceValue / 12).toFixed(2).replace('.', ',')} sem juros</p>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4 text-sm">{product.description}</p>
          {product.benefits && (
            <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20 mb-6">
              <p className="text-xs font-bold text-secondary mb-1">🔬 Evidências Científicas</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{product.benefits}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-6">
            {product.tags.map((t) => (
              <span key={t} className="px-2 py-1 rounded-full text-xs font-bold border border-border text-muted-foreground">{t}</span>
            ))}
          </div>
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Truck size={14} className="text-secondary" /> Frete Grátis para todo o Brasil</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Shield size={14} className="text-primary" /> Compra 100% Segura • Escrow até Confirmação</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Package size={14} className="text-primary" /> Entrega rastreada com prazo de 3-7 dias úteis</div>
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1 font-bold h-14 text-base bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleBuyNowProduct(product, toast, showModal)}
            >
              Comprar Agora 💳
            </Button>
            <Button
              variant="outline"
              className="h-14 px-6 border-primary text-primary hover:bg-primary/10"
              onClick={() => {
                addItem(product);
                toast({ title: "Adicionado ao carrinho!", description: product.title });
              }}
            >
              <ShoppingCart size={20} />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-4 text-center">⚠️ A Planta & Raiz é uma infraestrutura tecnológica autônoma. A responsabilidade técnica pelo produto cabe exclusivamente ao lojista cadastrado.</p>
        </div>
      </div>
    </div>
  );
};

const CartDrawer = () => {
  const { items, removeItem, updateQty, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <Card className="border-border bg-card/50">
        <CardContent className="p-6 text-center">
          <ShoppingCart size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Seu carrinho está vazio</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50">
      <CardContent className="p-4">
        <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
          <ShoppingCart size={18} className="text-primary" /> Carrinho ({items.length})
        </h3>
        <div className="space-y-3 mb-4">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/30 border border-border">
              <img src={item.product.imageUrl} alt={item.product.title} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{item.product.title}</p>
                <p className="text-xs text-gradient-gold font-bold">{item.product.price}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Diminuir quantidade"><Minus size={12} /></button>
                <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Aumentar quantidade"><Plus size={12} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-3 mb-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-foreground">Total:</span>
            <span className="text-xl font-display font-bold text-gradient-gold">R$ {total().toFixed(2).replace(".", ",")}</span>
          </div>
          <p className="text-xs text-secondary font-bold mt-1">Frete Grátis ✓</p>
        </div>
        <Button className="w-full font-bold bg-primary text-primary-foreground mb-2" asChild>
          <Link to="/pay">Finalizar Compra <ArrowRight size={16} className="ml-2" /></Link>
        </Button>
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={clearCart}>
          Limpar carrinho
        </Button>
      </CardContent>
    </Card>
  );
};

const Shopping = () => {
  const { id } = useParams();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { addItem, count } = useCart();
  const { toast } = useToast();
  const [showCart, setShowCart] = useState(false);

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

  const filtered = products
    .filter(p => activeCategory === "Todos" || p.category === activeCategory)
    .filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      {/* Search Header - Mercado Livre style */}
      <section className="pt-24 md:pt-28 pb-4 bg-primary/5 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos medicinais..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-full border-border bg-background text-base font-medium"
              />
            </div>
            <Button className="h-12 px-6 rounded-full bg-primary text-primary-foreground font-bold">
              <Search size={18} />
            </Button>
          </div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3 max-w-3xl mx-auto">
            <Link to="/" className="hover:text-foreground">Início</Link>
            <ChevronRight size={12} />
            <span className="text-foreground font-bold">Shopping</span>
            {activeCategory !== "Todos" && (
              <>
                <ChevronRight size={12} />
                <span className="text-primary font-bold">{activeCategory}</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-3 border-b border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6 md:gap-10 flex-wrap text-xs font-bold text-muted-foreground">
            <span className="flex items-center gap-1.5"><Shield size={14} className="text-primary" /> Compra Segura</span>
            <span className="flex items-center gap-1.5"><Truck size={14} className="text-secondary" /> Frete Grátis</span>
            <span className="flex items-center gap-1.5"><Store size={14} className="text-primary" /> Lojas Verificadas</span>
            <span className="flex items-center gap-1.5"><CreditCard size={14} className="text-secondary" /> Pix + Cartão</span>
            <span className="flex items-center gap-1.5"><Tag size={14} className="text-primary" /> Até 12x s/ juros</span>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-[240px_1fr_280px] gap-6">
            {/* Sidebar Filters */}
            <aside className="hidden lg:block space-y-6">
              <Card className="border-border bg-card/50 p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">Categorias</h3>
                <div className="space-y-1">
                  {["Todos", ...productCategories].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === cat
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </Card>
              <Card className="border-border bg-card/50 p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">Preço</h3>
                <div className="space-y-1 text-sm">
                  <button className="w-full text-left px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30">Até R$ 100</button>
                  <button className="w-full text-left px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30">R$ 100 - R$ 200</button>
                  <button className="w-full text-left px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30">Acima de R$ 200</button>
                </div>
              </Card>
              <Card className="border-border bg-card/50 p-4">
                <h3 className="font-bold text-sm text-foreground mb-3">Frete</h3>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked readOnly className="accent-[hsl(var(--primary))]" />
                  Frete Grátis
                </label>
              </Card>
            </aside>

            {/* Products Grid */}
            <div>
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                {/* Mobile categories */}
                <div className="flex flex-wrap gap-2 lg:hidden">
                  {["Todos", ...productCategories].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        activeCategory === cat
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card/50 text-muted-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{filtered.length} resultados</span>
                  <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><Grid3X3 size={16} /></button>
                  <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><List size={16} /></button>
                </div>
              </div>

              <motion.div className={viewMode === "grid" ? "grid sm:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} key={activeCategory + searchQuery}>
                {filtered.map((p) => (
                  <motion.div key={p.id} variants={fadeUp}>
                    {viewMode === "grid" ? (
                      <Card className="border-border hover:border-primary/30 transition-all hover:-translate-y-1 bg-card/50 overflow-hidden">
                        <CardContent className="p-0">
                          <Link to={`/shopping/${p.id}`} className="relative block">
                            <img src={p.imageUrl} alt={p.title} className="w-full h-44 object-cover" />
                            <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-secondary/90 text-primary-foreground font-bold">FRETE GRÁTIS</span>
                          </Link>
                          <div className="p-4">
                            <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Store size={10} /> {p.vendor}</p>
                            <Link to={`/shopping/${p.id}`}>
                              <h3 className="font-bold text-foreground mb-1 hover:text-primary transition-colors text-sm line-clamp-2">{p.title}</h3>
                            </Link>
                            <div className="flex items-center gap-1 mb-2">
                              {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= Math.round(p.rating) ? "text-primary fill-primary" : "text-muted-foreground/20"} />)}
                              <span className="text-[10px] text-muted-foreground ml-1">({Math.floor(Math.random() * 200 + 50)})</span>
                            </div>
                            <p className="text-xl font-display font-bold text-gradient-gold mb-1">{p.price}</p>
                            <p className="text-[10px] text-secondary font-bold mb-3">em até 12x s/ juros</p>
                            <Button
                              size="sm"
                              className="w-full text-xs font-bold bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20"
                              onClick={() => {
                                addItem(p);
                                toast({ title: "Adicionado!", description: p.title });
                                setShowCart(true);
                              }}
                            >
                              <Plus size={14} className="mr-1" /> Adicionar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="border-border hover:border-primary/30 transition-all bg-card/50">
                        <CardContent className="p-0">
                          <div className="flex gap-4 p-4">
                            <Link to={`/shopping/${p.id}`} className="shrink-0">
                              <img src={p.imageUrl} alt={p.title} className="w-32 h-32 rounded-xl object-cover" />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1"><Store size={10} /> {p.vendor}</p>
                              <Link to={`/shopping/${p.id}`}>
                                <h3 className="font-bold text-foreground hover:text-primary transition-colors text-sm mb-1">{p.title}</h3>
                              </Link>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{p.description}</p>
                              <div className="flex items-center gap-1 mb-2">
                                {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= Math.round(p.rating) ? "text-primary fill-primary" : "text-muted-foreground/20"} />)}
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xl font-display font-bold text-gradient-gold">{p.price}</p>
                                  <p className="text-[10px] text-secondary font-bold">Frete Grátis • 12x s/ juros</p>
                                </div>
                                <Button
                                  size="sm"
                                  className="text-xs font-bold bg-primary text-primary-foreground"
                                  onClick={() => {
                                    addItem(p);
                                    toast({ title: "Adicionado!", description: p.title });
                                    setShowCart(true);
                                  }}
                                >
                                  <Plus size={14} className="mr-1" /> Comprar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <Search size={48} className="text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum produto encontrado para "{searchQuery}"</p>
                </div>
              )}
            </div>

            {/* Cart Sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <CartDrawer />
              </div>
            </div>
          </div>

          {/* Mobile cart button */}
          {count() > 0 && (
            <div className="lg:hidden fixed bottom-20 right-4 z-50">
              <Button
                className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl relative"
                onClick={() => setShowCart(!showCart)}
              >
                <ShoppingCart size={24} />
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-secondary text-primary-foreground text-xs font-bold flex items-center justify-center">{count()}</span>
              </Button>
            </div>
          )}

          {/* Mobile cart overlay */}
          {showCart && (
            <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setShowCart(false)}>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border" onClick={e => e.stopPropagation()}>
                <CartDrawer />
              </div>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center mt-8">
            ⚠️ A Planta & Raiz é uma infraestrutura tecnológica autônoma. A responsabilidade técnica pelo produto comercializado cabe exclusivamente aos lojistas cadastrados.
          </p>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="py-16 md:py-24 bg-card/30 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">É Lojista ou Fabricante?</h2>
          <p className="text-lg text-muted-foreground mb-2 max-w-xl mx-auto">Cadastre sua loja: até 10 produtos, 3 fotos por item, frete grátis obrigatório</p>
          <p className="text-sm text-muted-foreground mb-8">Receba seus pagamentos via Pix automaticamente após confirmação de entrega</p>
          <Button size="lg" className="font-bold bg-primary text-primary-foreground" asChild>
            <Link to="/cadastro">
              Cadastrar Loja <ArrowRight size={20} className="ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Shopping;
