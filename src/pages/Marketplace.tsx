import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Star, Truck, CreditCard, Shield, Store, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const categories = [
  { name: "Óleos & Extratos", count: 24, emoji: "🌿" },
  { name: "Suplementos", count: 18, emoji: "💊" },
  { name: "Bem-Estar", count: 32, emoji: "🧘" },
  { name: "Cosméticos", count: 15, emoji: "✨" },
  { name: "Acessórios", count: 20, emoji: "🔧" },
  { name: "Livros & Cursos", count: 12, emoji: "📚" },
];

const featuredProducts = [
  { name: "Óleo Full Spectrum 1000mg", vendor: "Cannabis Pharma", price: "R$ 189,90", rating: 4.8 },
  { name: "Cápsulas CBD 25mg (60un)", vendor: "Green Health", price: "R$ 149,90", rating: 4.7 },
  { name: "Creme Tópico Analgésico", vendor: "Nature Lab", price: "R$ 89,90", rating: 4.9 },
  { name: "Kit Bem-Estar Completo", vendor: "Vida Natural", price: "R$ 299,90", rating: 4.8 },
  { name: "Óleo para Sono 500mg", vendor: "Cannabis Pharma", price: "R$ 129,90", rating: 4.9 },
  { name: "Gummies Relaxantes (30un)", vendor: "Green Health", price: "R$ 79,90", rating: 4.6 },
];

const Marketplace = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      <section className="pt-24 pb-16 md:pt-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] right-[10%] w-[500px] h-[300px] rounded-full bg-secondary/8 blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div className="text-center mb-16" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4">
              <span className="text-gradient-green">Marketplace</span> Completo
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Lojas, farmácias, suplementos e bem-estar — multi-vendor com checkout via Pix
            </p>
          </motion.div>

          {/* Features row */}
          <motion.div className="grid md:grid-cols-3 gap-6 mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {[
              { icon: Store, title: "Lojas Verificadas", desc: "Catálogo de lojas parceiras com avaliações, logística e qualidade garantida." },
              { icon: CreditCard, title: "Checkout Pix", desc: "QR code + copia e cola — confirmação automática via webhook Mercado Pago." },
              { icon: Truck, title: "Repasse Automático", desc: "Extrato e conciliação para vendedores e parceiros com transparência total." },
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full border-border hover:border-secondary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-green border border-green flex items-center justify-center mb-4">
                      <f.icon size={24} className="text-secondary" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-foreground mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Categories */}
          <motion.div className="mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">Categorias</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((cat, i) => (
                <Card key={i} className="border-border hover:border-primary/30 transition-all hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <span className="text-2xl mb-2 block">{cat.emoji}</span>
                    <p className="font-bold text-sm text-foreground">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.count} produtos</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Products */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">Produtos em Destaque</h2>
          </motion.div>
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {featuredProducts.map((p, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="border-border hover:border-primary/30 transition-all hover:-translate-y-1">
                  <CardContent className="p-5">
                    <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-card to-muted border border-border flex items-center justify-center mb-4">
                      <ShoppingBag size={32} className="text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{p.vendor}</p>
                    <h3 className="font-bold text-foreground mb-2">{p.name}</h3>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-display font-bold text-gradient-gold">{p.price}</span>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-primary fill-primary" />
                        <span className="text-xs font-bold text-foreground">{p.rating}</span>
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-secondary/20 to-secondary/10 border border-green text-secondary hover:from-secondary/30 text-sm font-bold" asChild>
                      <a href={`https://wa.me/5511987131241?text=Olá!%20Quero%20comprar%20${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer">
                        Comprar via Pix
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="py-16 md:py-24 bg-card/30">
        <div className="container mx-auto px-4 text-center">
          <Shield size={48} className="text-secondary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            É Lojista ou Fabricante?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Cadastre sua loja no marketplace, gerencie produtos, estoque e receba via Pix
          </p>
          <Button size="lg" className="font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground" asChild>
            <a href="https://wa.me/5511987131241?text=Olá!%20Quero%20cadastrar%20minha%20loja%20no%20marketplace%20Planta%20%26%20Raiz" target="_blank" rel="noopener noreferrer">
              Cadastrar Loja <ArrowRight size={20} className="ml-2" />
            </a>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Marketplace;
