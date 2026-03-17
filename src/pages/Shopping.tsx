import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag, Star, ShoppingCart, Plus, Minus, ArrowLeft, ArrowRight,
  Store, Truck, Search, Shield, Leaf, CreditCard, ImageIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { products, productCategories } from "@/data/products";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/use-toast";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ── Product Detail ── */
const ProductDetail = ({ id }: { id: string }) => {
  const product = products.find((p) => p.id === id);
  const { addItem } = useCart();
  const { toast } = useToast();

  if (!product) return <div className="container mx-auto px-4 pt-32 text-center text-muted-foreground">Produto não encontrado.</div>;

  return (
    <div className="container mx-auto px-4 pt-24 pb-16 md:pt-32 max-w-5xl">
      <Link to="/shopping" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={16} /> Voltar ao Shopping
      </Link>
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-border overflow-hidden bg-card">
          <img src={product.imageUrl} alt={product.title} className="w-full h-80 object-contain bg-white p-4" />
        </Card>
        <div>
          <p className="text-xs text-muted-foreground mb-1">{product.vendor} • {product.category}</p>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">{product.title}</h1>
          <div className="flex items-center gap-2 mb-4">
            <Star size={14} className="text-primary fill-primary" />
            <span className="text-sm font-bold">{product.rating}</span>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">{product.description}</p>
          {product.benefits && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-6">
              <p className="text-xs font-bold text-primary mb-1">🔬 Benefícios Científicos</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{product.benefits}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {product.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
            ))}
          </div>

          {/* Price & shipping */}
          <p className="text-3xl font-display font-bold text-gradient-gold mb-1">{product.price}</p>
          <div className="flex items-center gap-2 mb-6">
            <Truck size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary">Frete Grátis</span>
            <span className="text-xs text-muted-foreground">• Pagamento via Pix</span>
          </div>

          <Button
            className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              addItem(product);
              toast({ title: "Adicionado ao carrinho!", description: product.title });
            }}
          >
            <ShoppingCart size={18} className="mr-2" /> Adicionar ao Carrinho
          </Button>
          <p className="text-[10px] text-muted-foreground mt-4 text-center">
            ⚠️ Produto educativo. Uso responsável com orientação profissional.
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── Cart Drawer ── */
const CartDrawer = () => {
  const { items, removeItem, updateQty, total, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="p-6 text-center">
          <ShoppingCart size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Seu carrinho está vazio</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <h3 className="font-display font-bold text-foreground mb-4">Carrinho ({items.length})</h3>
        <div className="space-y-3 mb-4">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted/30 border border-border">
              <img src={item.product.imageUrl} alt={item.product.title} className="w-12 h-12 rounded-lg object-contain bg-white" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{item.product.title}</p>
                <p className="text-xs text-gradient-gold font-bold">{item.product.price}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Diminuir"><Minus size={12} /></button>
                <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Aumentar"><Plus size={12} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-3 mb-1">
          <div className="flex items-center gap-1 text-xs text-primary mb-2">
            <Truck size={12} /> <span className="font-bold">Frete Grátis</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-foreground">Total:</span>
            <span className="text-xl font-display font-bold text-gradient-gold">R$ {total().toFixed(2).replace(".", ",")}</span>
          </div>
        </div>
        <Button className="w-full font-bold bg-primary text-primary-foreground mt-3 mb-2" asChild>
          <Link to="/pay">Pagar com Pix <ArrowRight size={16} className="ml-2" /></Link>
        </Button>
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={clearCart}>
          Limpar carrinho
        </Button>
      </CardContent>
    </Card>
  );
};

/* ── Main Shopping Page ── */
const Shopping = () => {
  const { id } = useParams();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
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

  const filtered = products.filter((p) => {
    const matchCategory = activeCategory === "Todos" || p.category === activeCategory;
    const matchSearch = searchTerm === "" || 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      {/* Search bar - Mercado Livre style */}
      <section className="pt-20 md:pt-24 pb-0 bg-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produtos, marcas, categorias..."
                className="pl-10 bg-background border-border h-11 rounded-xl"
              />
            </div>
            <Button
              variant="outline"
              className="border-border relative h-11"
              onClick={() => setShowCart(!showCart)}
              aria-label="Ver carrinho"
            >
              <ShoppingCart size={18} />
              {count() > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {count()}
                </span>
              )}
            </Button>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Leaf className="text-primary" size={24} />
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-black text-foreground">
                Shopping <span className="text-gradient-green">Cannabis Medicinal</span>
              </h1>
              <p className="text-sm text-muted-foreground">Marketplace autorizado • Pix • Frete Grátis</p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { icon: Store, label: "Lojas Verificadas", sub: "Até 10 produtos cada" },
              { icon: CreditCard, label: "Pix Instantâneo", sub: "QR code automático" },
              { icon: Truck, label: "Frete Grátis", sub: "Todo o Brasil" },
              { icon: Shield, label: "Laudos COA", sub: "Qualidade garantida" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-card/50 border border-border">
                <f.icon size={18} className="text-primary shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {["Todos", ...productCategories].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                  activeCategory === cat
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid lg:grid-cols-4 gap-6">
            <div className={`${showCart ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
                key={activeCategory + searchTerm}
              >
                {filtered.map((p) => (
                  <motion.div key={p.id} variants={fadeUp}>
                    <Card className="border-border hover:border-primary/30 transition-all hover:-translate-y-1 overflow-hidden group">
                      <CardContent className="p-0">
                        <Link to={`/shopping/${p.id}`}>
                          <div className="relative bg-white">
                            <img src={p.imageUrl} alt={p.title} className="w-full h-36 md:h-44 object-contain p-2" />
                            {p.freeShipping && (
                              <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[9px] px-1.5 py-0.5">
                                <Truck size={10} className="mr-1" /> Frete Grátis
                              </Badge>
                            )}
                          </div>
                        </Link>
                        <div className="p-3">
                          <p className="text-[10px] text-muted-foreground mb-0.5">{p.vendor}</p>
                          <Link to={`/shopping/${p.id}`}>
                            <h3 className="font-bold text-foreground text-sm leading-tight mb-1 line-clamp-2 hover:text-primary transition-colors">{p.title}</h3>
                          </Link>
                          <p className="text-lg font-display font-black text-foreground mb-0.5">{p.price}</p>
                          <p className="text-[10px] text-primary font-bold mb-2">em até 3x sem juros</p>
                          <div className="flex items-center gap-1 mb-3">
                            <Star size={10} className="text-primary fill-primary" />
                            <span className="text-[10px] font-bold">{p.rating}</span>
                            <span className="text-[10px] text-muted-foreground">• {p.category}</span>
                          </div>
                          <Button
                            size="sm"
                            className="w-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={() => {
                              addItem(p);
                              toast({ title: "Adicionado!", description: p.title });
                              setShowCart(true);
                            }}
                          >
                            <Plus size={12} className="mr-1" /> Comprar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <Search size={40} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum produto encontrado.</p>
                </div>
              )}
            </div>

            {showCart && (
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <CartDrawer />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="py-12 md:py-20 bg-card/30 border-t border-border">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <Store size={32} className="mx-auto text-primary mb-4" />
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-3">É Lojista ou Fabricante?</h2>
          <p className="text-muted-foreground mb-2">Cadastre sua loja e exponha até <strong className="text-foreground">10 produtos</strong> com 5 fotos cada.</p>
          <p className="text-sm text-muted-foreground mb-6">Pagamento via Pix • Frete grátis • Laudos e compliance ANVISA</p>
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
