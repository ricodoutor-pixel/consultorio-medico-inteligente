import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Star, ShoppingCart, Plus, Minus, ArrowLeft, ArrowRight, Store, CreditCard, Truck } from "lucide-react";
import { motion } from "framer-motion";
import { products, productCategories } from "@/data/products";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/use-toast";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const ProductDetail = ({ id }: { id: string }) => {
  const product = products.find((p) => p.id === id);
  const { addItem } = useCart();
  const { toast } = useToast();

  if (!product) return <div className="container mx-auto px-4 pt-32 text-center text-muted-foreground">Produto não encontrado.</div>;

  return (
    <div className="container mx-auto px-4 pt-24 pb-16 md:pt-32">
      <Link to="/shopping" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft size={16} /> Voltar ao Shopping
      </Link>
      <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="border-border overflow-hidden">
          <img src={product.imageUrl} alt={product.title} className="w-full h-80 object-cover" />
        </Card>
        <div>
          <p className="text-xs text-muted-foreground mb-1">{product.vendor} • {product.category}</p>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">{product.title}</h1>
          <div className="flex items-center gap-2 mb-4">
            <Star size={14} className="text-primary fill-primary" />
            <span className="text-sm font-bold">{product.rating}</span>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {product.tags.map((t) => (
              <span key={t} className="px-2 py-1 rounded-full text-xs font-bold border border-border text-muted-foreground">{t}</span>
            ))}
          </div>
          <p className="text-3xl font-display font-bold text-gradient-gold mb-6">{product.price}</p>
          <Button
            className="w-full font-bold bg-gradient-to-r from-secondary/20 to-secondary/10 border border-green text-secondary hover:from-secondary/30"
            onClick={() => {
              addItem(product);
              toast({ title: "Adicionado ao carrinho!", description: product.title });
            }}
          >
            <ShoppingCart size={18} className="mr-2" /> Adicionar ao Carrinho
          </Button>
          <p className="text-xs text-muted-foreground mt-4">⚠️ Produto educativo. Uso responsável com orientação profissional.</p>
        </div>
      </div>
    </div>
  );
};

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
        </div>
        <Button className="w-full font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground mb-2" asChild>
          <Link to="/pay">Pagar com Pix <ArrowRight size={16} className="ml-2" /></Link>
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

  const filtered = activeCategory === "Todos" ? products : products.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      <section className="pt-24 pb-16 md:pt-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] right-[10%] w-[500px] h-[300px] rounded-full bg-secondary/8 blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div className="text-center mb-12" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4">
              <span className="text-gradient-green">Shopping</span> Popular
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Preços acessíveis, lojas verificadas e checkout via Pix
            </p>
          </motion.div>

          {/* Features */}
          <motion.div className="grid md:grid-cols-3 gap-4 mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { icon: Store, title: "Lojas Verificadas", desc: "Vendedores com documentação e laudos de qualidade." },
              { icon: CreditCard, title: "Pix Mercado Pago", desc: "QR code + copia e cola com confirmação automática." },
              { icon: Truck, title: "Entrega Rastreada", desc: "Acompanhe seu pedido e receba suporte via WhatsApp." },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="border-border">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-green border border-green flex items-center justify-center shrink-0">
                      <f.icon size={20} className="text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{f.title}</h3>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Category tabs + Cart button */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex flex-wrap gap-2">
              {["Todos", ...productCategories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                    activeCategory === cat
                      ? "border-green bg-gradient-green text-secondary"
                      : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              className="border-border relative"
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

          <div className="grid lg:grid-cols-4 gap-6">
            <div className={`lg:col-span-3 ${showCart ? '' : 'lg:col-span-4'}`}>
              <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} key={activeCategory}>
                {filtered.map((p) => (
                  <motion.div key={p.id} variants={fadeUp}>
                    <Card className="border-border hover:border-secondary/30 transition-all hover:-translate-y-1">
                      <CardContent className="p-0">
                        <Link to={`/shopping/${p.id}`}>
                          <img src={p.imageUrl} alt={p.title} className="w-full h-40 object-cover rounded-t-xl" />
                        </Link>
                        <div className="p-4">
                          <p className="text-xs text-muted-foreground mb-1">{p.vendor}</p>
                          <Link to={`/shopping/${p.id}`}>
                            <h3 className="font-bold text-foreground mb-1 hover:text-primary transition-colors text-sm">{p.title}</h3>
                          </Link>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-display font-bold text-gradient-gold">{p.price}</span>
                            <div className="flex items-center gap-1">
                              <Star size={12} className="text-primary fill-primary" />
                              <span className="text-xs font-bold">{p.rating}</span>
                            </div>
                          </div>
                          <Button
                            className="w-full text-sm font-bold bg-gradient-to-r from-secondary/20 to-secondary/10 border border-green text-secondary hover:from-secondary/30"
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
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {showCart && (
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <CartDrawer />
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-8">
            ⚠️ Produtos educativos. Uso responsável com orientação profissional.
          </p>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">É Lojista ou Fabricante?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">Cadastre sua loja no Shopping, gerencie produtos e receba via Pix</p>
          <Button size="lg" className="font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground" asChild>
            <a href="https://wa.me/5511987131241?text=Olá!%20Quero%20cadastrar%20minha%20loja%20no%20Shopping%20Planta%20%26%20Raiz" target="_blank" rel="noopener noreferrer">
              Cadastrar Loja <ArrowRight size={20} className="ml-2" />
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Shopping;
