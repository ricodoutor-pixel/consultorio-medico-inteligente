import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gift, Copy, QrCode, Users, DollarSign, TrendingUp, Medal, Share2,
  CheckCircle2, ArrowRight, Lock, Crown, Star, Zap, BarChart3,
  Wallet, Clock, Award, ChevronRight, Percent, Layers,
  Sparkles, MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { AffiliateWalletCard } from "@/components/affiliates/AffiliateWalletCard";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

// Will be loaded from DB for authenticated users

// Commission structure - 3 levels, up to 50% total
const commissionLevels = [
  { level: 1, name: "Geração 1 — Diretos", rate: 50, desc: "Sua indicação direta", color: "hsl(var(--primary))" },
  { level: 2, name: "Geração 2 — Indiretos", rate: 5, desc: "Indicação do seu direto", color: "hsl(var(--accent-foreground))" },
  { level: 3, name: "Geração 3 — Rede", rate: 2, desc: "Indicação do seu indireto", color: "hsl(45,76%,52%)" },
];

// Subscription plans with affiliate earnings
const planEarnings = [
  { plan: "Essencial", price: 50, l1: 25, l2: 2.5, l3: 1, total: 28.5 },
  { plan: "Acesso VIP", price: 100, l1: 50, l2: 5, l3: 2, total: 57 },
  { plan: "Família", price: 250, l1: 125, l2: 12.5, l3: 5, total: 142.5 },
  { plan: "Empresas", price: 300, l1: 150, l2: 15, l3: 6, total: 171 },
];

// Affiliate tiers
const affiliateTiers = [
  { name: "Bronze", icon: Award, min: 0, max: 10, bonus: 0, color: "hsl(30,60%,50%)" },
  { name: "Prata", icon: Star, min: 11, max: 50, bonus: 5, color: "hsl(0,0%,65%)" },
  { name: "Ouro", icon: Crown, min: 51, max: 150, bonus: 10, color: "hsl(45,76%,52%)" },
  { name: "Diamante", icon: Zap, min: 151, max: 9999, bonus: 15, color: "hsl(200,80%,55%)" },
];

const leaderboard = [
  { pos: 1, name: "Ana C.", indicacoes: 147, ganhos: "R$ 8.410", badge: "🥇", tier: "Diamante" },
  { pos: 2, name: "Dr. Felipe A.", indicacoes: 98, ganhos: "R$ 5.140", badge: "🥈", tier: "Ouro" },
  { pos: 3, name: "Verde Vida", indicacoes: 71, ganhos: "R$ 3.930", badge: "🥉", tier: "Ouro" },
  { pos: 4, name: "Marcos T.", indicacoes: 44, ganhos: "R$ 2.720", badge: "", tier: "Prata" },
  { pos: 5, name: "Juliana R.", indicacoes: 29, ganhos: "R$ 1.570", badge: "", tier: "Prata" },
];

const myNetwork = {
  level1: [
    { name: "Pedro M.", plan: "Acesso Usuários", date: "22/02/2026", status: "ativo", comissao: "R$ 20,00/mês" },
    { name: "Farmácia Vida", plan: "Empresas", date: "20/02/2026", status: "ativo", comissao: "R$ 60,00/mês" },
    { name: "Lucia F.", plan: "Essencial", date: "18/02/2026", status: "pendente", comissao: "—" },
  ],
  level2: [
    { name: "Dr. Hugo T.", plan: "Acesso Usuários", date: "15/02/2026", status: "ativo", comissao: "R$ 15,00/mês" },
    { name: "Maria S.", plan: "Família", date: "12/02/2026", status: "ativo", comissao: "R$ 37,50/mês" },
  ],
  level3: [
    { name: "Carlos R.", plan: "Essencial", date: "10/02/2026", status: "ativo", comissao: "R$ 7,50/mês" },
  ],
};

const Indicacoes = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("painel");
  const [userId, setUserId] = useState<string | null>(null);

  // Real data from DB
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [networkData, setNetworkData] = useState({ level1: 0, level2: 0, level3: 0 });

  // Calculator states
  const [diretos, setDiretos] = useState([10]);
  const [indiretosPorPessoa, setIndiretosPorPessoa] = useState([5]);

  const totalG1 = diretos[0];
  const totalG2 = totalG1 * indiretosPorPessoa[0];
  const totalG3 = totalG2 * indiretosPorPessoa[0];

  const basePlan = 100;
  const earningG1 = totalG1 * (basePlan * 0.50);
  const earningG2 = totalG2 * (basePlan * 0.05);
  const earningG3 = totalG3 * (basePlan * 0.02);
  const totalEarning = earningG1 + earningG2 + earningG3;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session?.user) {
        setUserId(session.user.id);
        loadAffiliateData(session.user.id);
      }
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session?.user) {
        setUserId(session.user.id);
        loadAffiliateData(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadAffiliateData = async (uid: string) => {
    // Load referral link
    const { data: refLink } = await supabase
      .from("referral_links")
      .select("code, total_referrals, total_earnings")
      .eq("user_id", uid)
      .maybeSingle();

    if (refLink) {
      setReferralCode(refLink.code);
      setReferralLink(`${window.location.origin}/cadastro?ref=${refLink.code}`);
      setTotalReferrals(refLink.total_referrals || 0);
      setTotalEarnings(refLink.total_earnings || 0);
    } else {
      // Generate a new referral code if none exists
      const newCode = "PLANTA-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      setReferralCode(newCode);
      setReferralLink(`https://plantaeraiz.com.br/cadastro?ref=${newCode}`);
    }

    // Load commissions
    const { data: comms } = await supabase
      .from("affiliate_commissions")
      .select("*")
      .eq("referrer_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);

    if (comms) {
      setCommissions(comms);
      const l1 = comms.filter(c => c.level === 1).length;
      const l2 = comms.filter(c => c.level === 2).length;
      const l3 = comms.filter(c => c.level === 3).length;
      setNetworkData({ level1: l1, level2: l2, level3: l3 });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copiado!", description: "Código de afiliado copiado para a área de transferência." });
    setTimeout(() => setCopied(false), 3000);
  };

  // Calculate tier from real data
  const currentTier = affiliateTiers.reduce((prev, tier) => totalReferrals >= tier.min ? tier : prev, affiliateTiers[0]);
  const nextTierIdx = affiliateTiers.indexOf(currentTier) + 1;
  const nextTier = nextTierIdx < affiliateTiers.length ? affiliateTiers[nextTierIdx] : affiliateTiers[affiliateTiers.length - 1];
  const progressToNext = nextTier.min > currentTier.min
    ? Math.min(100, Math.round(((totalReferrals - currentTier.min) / (nextTier.min - currentTier.min)) * 100))
    : 100;

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center text-muted-foreground">Carregando...</div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-24 pb-16 md:pt-32">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <Lock size={48} className="text-primary mx-auto mb-6" />
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4 tracking-tight">
              Programa de <span className="text-gradient-green">Afiliados</span>
            </h1>
            <p className="text-muted-foreground mb-6 font-medium text-lg">
              Ganhe até <span className="text-primary font-black text-2xl">50%</span> de comissão em 3 níveis sobre assinaturas mensais dos seus indicados.
            </p>

            {/* Preview commission table */}
            <div className="mb-8 text-left">
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={18} className="text-primary" />
                    <span className="font-black text-sm text-foreground">Estrutura de Comissões</span>
                  </div>
                  <div className="space-y-2">
                    {commissionLevels.map((c) => (
                      <div key={c.level} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <span className="text-sm text-muted-foreground">{c.name}</span>
                        <Badge className="bg-primary/10 text-primary border-primary/20 font-black">{c.rate}%</Badge>
                      </div>
                    ))}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-sm font-black text-foreground">Total Máximo</span>
                      <Badge className="bg-primary text-primary-foreground font-black text-base px-3">50%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
              <Button className="font-black bg-primary text-primary-foreground rounded-2xl h-14 px-8" onClick={() => navigate("/cadastro")}>
                Quero Ser Afiliado <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button variant="outline" className="font-black rounded-2xl h-14 px-8" onClick={() => navigate("/login")}>
                Já Tenho Conta
              </Button>
            </div>

            {/* Calculadora de Ganhos */}
            <div className="mb-16 text-left" id="calculadora">
              <div className="text-center mb-8">
                <Badge className="bg-primary/20 text-primary border-primary/30 font-bold mb-3">Simulador de Ganhos</Badge>
                <h2 className="text-2xl md:text-3xl font-display font-black text-foreground">Calcule sua Renda Recorrente</h2>
                <p className="text-muted-foreground mt-2">Veja quanto você pode ganhar mensalmente indicando o Plano Acesso VIP (R$ 100).</p>
              </div>

              <Card className="border-border bg-card/50 backdrop-blur">
                <CardContent className="p-6 md:p-8">
                  <div className="grid md:grid-cols-2 gap-10 items-center">
                    <div className="space-y-8">
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label className="font-bold">Quantas pessoas você indicaria? (Geração 1)</Label>
                          <span className="font-black text-primary">{diretos[0]}</span>
                        </div>
                        <Slider value={diretos} onValueChange={setDiretos} max={100} min={1} step={1} className="py-2" />
                        <p className="text-xs text-muted-foreground mt-1">Você ganha 50% de cada um.</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2">
                          <Label className="font-bold">Quantas pessoas cada um indicaria? (Média G2 e G3)</Label>
                          <span className="font-black text-primary">{indiretosPorPessoa[0]}</span>
                        </div>
                        <Slider value={indiretosPorPessoa} onValueChange={setIndiretosPorPessoa} max={20} min={1} step={1} className="py-2" />
                        <p className="text-xs text-muted-foreground mt-1">Sua rede viraliza até a 3ª geração.</p>
                      </div>
                    </div>

                    <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                      <h3 className="text-sm font-bold text-muted-foreground mb-4">Projeção Mensal Recorrente</h3>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-foreground">Sua indicação (G1)</span>
                          <span className="font-bold">R$ {earningG1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-foreground">Rede Indireta (G2)</span>
                          <span className="font-bold">R$ {earningG2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-foreground">Profundidade (G3)</span>
                          <span className="font-bold">R$ {earningG3.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      <div className="border-t border-border pt-4">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Estimado</p>
                        <p className="text-4xl font-display font-black text-primary text-gradient-green">
                          R$ {totalEarning.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs font-medium text-muted-foreground mt-1">/mês enquanto os planos estiverem ativos</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Como Funciona & Automação */}
            <div className="mb-16 text-left">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-display font-black text-foreground">Como Funciona a Parceria?</h2>
                <p className="text-muted-foreground mt-2">Tecnologia, transparência e pagamentos automáticos na sua conta.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: Share2, title: "1. Link Exclusivo", desc: "No seu painel VIP, você ganha um código único (ex: PRZ-123) para compartilhar." },
                  { icon: Zap, title: "2. Rastreamento Automático", desc: "Tudo é automatizado. O sistema reconhece quem veio pelo seu link em até 3 gerações." },
                  { icon: DollarSign, title: "3. Saque PIX Rápido", desc: "Acumule RaizCoins no painel. Solicitou o saque? Cai no seu PIX sem burocracia." }
                ].map((item, i) => (
                  <Card key={i} className="border-border bg-card hover:border-primary/30 transition-colors">
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <item.icon size={24} className="text-primary" />
                      </div>
                      <h3 className="font-black text-foreground text-lg mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Preview do Painel Pessoal */}
            <div className="mb-16 text-left relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none -z-10" />
              <div className="text-center mb-10">
                <Badge className="bg-primary/20 text-primary border-primary/30 font-bold mb-3">Transparência</Badge>
                <h2 className="text-2xl md:text-3xl font-display font-black text-foreground">Seu Painel Pessoal Exclusivo</h2>
                <p className="text-muted-foreground mt-2">Acompanhe sua rede, veja quem converteu e peça seus saques PIX em tempo real.</p>
              </div>
              
              <div className="rounded-3xl border border-border shadow-2xl overflow-hidden bg-background relative max-w-4xl mx-auto">
                {/* Mockup Topbar */}
                <div className="h-10 border-b border-border bg-muted/30 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <div className="mx-auto bg-background border border-border rounded-md px-3 py-1 flex items-center gap-2">
                    <Lock size={10} className="text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-mono">painel.plantayraiz.com/afiliados</span>
                  </div>
                </div>
                {/* Mockup Content */}
                <div className="p-4 md:p-8 grid md:grid-cols-2 gap-6 opacity-90 grayscale-[20%] hover:grayscale-0 transition-all duration-500">
                  <div className="space-y-4">
                    <div className="h-24 rounded-2xl bg-muted/50 border border-border p-4 flex justify-between items-center">
                      <div>
                        <div className="h-4 w-24 bg-muted rounded mb-2" />
                        <div className="h-8 w-32 bg-primary/20 rounded" />
                      </div>
                      <div className="h-12 w-12 rounded-full bg-primary/10" />
                    </div>
                    <div className="h-32 rounded-2xl bg-muted/50 border border-border p-4">
                      <div className="h-4 w-32 bg-muted rounded mb-4" />
                      <div className="flex gap-2">
                        <div className="h-8 flex-1 bg-muted rounded" />
                        <div className="h-8 w-10 bg-primary/20 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="h-60 rounded-2xl bg-muted/50 border border-border p-4">
                     <div className="h-4 w-40 bg-muted rounded mb-6" />
                     <div className="space-y-3">
                       <div className="h-10 bg-background rounded-lg border border-border" />
                       <div className="h-10 bg-background rounded-lg border border-border" />
                       <div className="h-10 bg-background rounded-lg border border-border" />
                     </div>
                  </div>
                </div>
                
                {/* Overlay CTA */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10 p-4 text-center">
                  <h3 className="text-xl md:text-2xl font-black text-foreground mb-4 shadow-sm">Destrave seu Acesso VIP</h3>
                  <Button className="font-black bg-primary text-primary-foreground rounded-2xl h-14 px-8 shadow-xl" onClick={() => navigate("/cadastro")}>
                    Criar Minha Conta VIP
                  </Button>
                </div>
              </div>
            </div>

            {/* Influencer Special Conditions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-10 text-left"
            >
              <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card/60 to-accent/10 overflow-hidden">
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <Badge className="bg-primary/20 text-primary border-primary/30 font-bold">Programa Influencer</Badge>
                      </div>
                      <h2 className="text-lg md:text-xl font-display font-black text-foreground mb-2">
                        Condições Especiais para Influenciadores
                      </h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        Tem audiência nas redes? Ganhe comissões premium, materiais exclusivos e acompanhamento dedicado da nossa equipe.
                      </p>
                      <ul className="space-y-2 mb-4">
                        {[
                          "Comissões de até 35% (vs. 25% padrão)",
                          "Materiais de divulgação personalizados com sua marca",
                          "Acompanhamento 1:1 com nossa equipe de growth",
                          "Pagamento prioritário toda terça-feira",
                          "Acesso antecipado a lançamentos e campanhas",
                        ].map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                            <Star className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="md:w-auto shrink-0">
                      <a
                        href={`https://wa.me/5511991363154?text=${encodeURIComponent("Olá! Sou influenciador/criador de conteúdo e quero conhecer as condições especiais de afiliado da Planta y Raiz. Pode me orientar?")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="w-full md:w-auto gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-2xl h-12 px-6">
                          <MessageCircle className="h-4 w-4" />
                          Cadastre-se e fale com a Enfª Brisa
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </a>
                      <p className="text-[10px] text-muted-foreground text-center md:text-left mt-2">
                        Tire suas dúvidas agora pelo WhatsApp
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-8 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-green border border-green flex items-center justify-center glow-green">
                <Crown size={24} className="text-primary" />
              </div>
              <div>
                <span className="text-sm font-bold text-primary">PROGRAMA DE AFILIADOS</span>
                <div className="flex items-center gap-2">
                  <Badge style={{ backgroundColor: currentTier.color + "22", color: currentTier.color, borderColor: currentTier.color + "44" }}>
                    <currentTier.icon size={12} className="mr-1" /> {currentTier.name}
                  </Badge>
                  {currentTier.bonus > 0 && (
                    <span className="text-xs text-muted-foreground">+{currentTier.bonus}% bônus</span>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-2">
              Painel de <span className="text-gradient-green">Afiliados</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-muted-foreground max-w-3xl font-medium mb-6">
              Ganhe até <span className="text-primary font-black">50% de comissão</span> em 3 níveis sobre o plano mensal dos seus indicados. Pagamento automático via PIX.
            </motion.p>

            {/* Stats */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              {[
                { label: "Rede Total", value: String(totalReferrals), icon: Users },
                { label: "Nível 1", value: String(networkData.level1), icon: Layers },
                { label: "Nível 2", value: String(networkData.level2), icon: Layers },
                { label: "Nível 3", value: String(networkData.level3), icon: Layers },
                { label: "Ganhos Total", value: `R$ ${totalEarnings.toFixed(0)}`, icon: DollarSign },
              ].map((s, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-3 text-center">
                    <s.icon size={16} className="text-primary mx-auto mb-1" />
                    <p className="text-xl font-display font-black text-foreground">{s.value}</p>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase">{s.label}</span>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Tier progress */}
            <motion.div variants={fadeUp}>
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-muted-foreground">Progresso para {nextTier.name}</span>
                    <span className="text-xs text-primary font-bold">{totalReferrals}/{nextTier.min} indicados</span>
                  </div>
                  <Progress value={progressToNext} className="h-2" />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Alcance {nextTier.name} e ganhe +{nextTier.bonus}% de bônus em todas as comissões!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Tabs */}
      <section className="py-4">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-5 h-12 mb-6">
              <TabsTrigger value="painel" className="font-bold text-xs">
                <BarChart3 size={14} className="mr-1" /> Painel
              </TabsTrigger>
              <TabsTrigger value="carteira" className="font-bold text-xs">
                <Wallet size={14} className="mr-1" /> Carteira
              </TabsTrigger>
              <TabsTrigger value="rede" className="font-bold text-xs">
                <Users size={14} className="mr-1" /> Minha Rede
              </TabsTrigger>
              <TabsTrigger value="comissoes" className="font-bold text-xs">
                <Percent size={14} className="mr-1" /> Comissões
              </TabsTrigger>
              <TabsTrigger value="ranking" className="font-bold text-xs">
                <Medal size={14} className="mr-1" /> Ranking
              </TabsTrigger>
            </TabsList>

            {/* CARTEIRA TAB */}
            <TabsContent value="carteira">
              <AffiliateWalletCard />
            </TabsContent>

            {/* PAINEL TAB */}
            <TabsContent value="painel">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Referral code */}
                <Card className="border-border border-primary/20">
                  <CardContent className="p-6">
                    <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                      <Share2 size={18} className="text-primary" /> Seu Código de Afiliado
                    </h3>

                    <div className="p-4 rounded-2xl bg-gradient-green border border-green mb-4 text-center">
                      <p className="text-3xl font-display font-black text-primary tracking-widest">{referralCode}</p>
                    </div>

                    <div className="mb-4">
                      <label className="text-xs font-bold text-muted-foreground mb-2 block">Link de afiliado</label>
                      <div className="flex gap-2">
                        <Input value={referralLink} readOnly className="bg-muted border-border text-xs font-mono" />
                        <Button variant="outline" size="sm" className="shrink-0 rounded-xl" onClick={() => handleCopy(referralLink)}>
                          {copied ? <CheckCircle2 size={16} className="text-primary" /> : <Copy size={16} />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-center p-6 rounded-2xl bg-card border border-border">
                      <div className="w-32 h-32 border-2 border-dashed border-primary/50 rounded-2xl flex items-center justify-center">
                        <QrCode size={48} className="text-primary" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">QR Code para compartilhar</p>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Button variant="outline" className="rounded-xl text-xs font-bold" onClick={() => handleCopy(referralCode)}>
                        <Copy size={14} className="mr-1" /> Copiar Código
                      </Button>
                      <Button className="rounded-xl text-xs font-bold bg-primary text-primary-foreground" onClick={() => handleCopy(referralLink)}>
                        <Share2 size={14} className="mr-1" /> Compartilhar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Earnings summary */}
                <div className="space-y-4">
                  <Card className="border-border">
                    <CardContent className="p-6">
                      <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                        <Wallet size={18} className="text-primary" /> Resumo Financeiro
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <div>
                            <p className="text-xs text-muted-foreground font-bold">Ganhos Este Mês</p>
                            <p className="text-2xl font-display font-black text-primary">R$ {totalEarnings},00</p>
                          </div>
                          <TrendingUp size={24} className="text-primary" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-3 rounded-xl bg-muted/50 text-center">
                            <p className="text-xs text-muted-foreground">Nível 1</p>
                            <p className="text-sm font-black text-foreground">R$ 80</p>
                          </div>
                          <div className="p-3 rounded-xl bg-muted/50 text-center">
                            <p className="text-xs text-muted-foreground">Nível 2</p>
                            <p className="text-sm font-black text-foreground">R$ 52,50</p>
                          </div>
                          <div className="p-3 rounded-xl bg-muted/50 text-center">
                            <p className="text-xs text-muted-foreground">Nível 3</p>
                            <p className="text-sm font-black text-foreground">R$ 7,50</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                          <span className="text-xs text-muted-foreground">Próximo pagamento</span>
                          <div className="flex items-center gap-1">
                            <Clock size={12} className="text-muted-foreground" />
                            <span className="text-xs font-bold text-foreground">01/04/2026</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tier badges */}
                  <Card className="border-border">
                    <CardContent className="p-6">
                      <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                        <Award size={18} className="text-primary" /> Níveis de Afiliado
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {affiliateTiers.map((tier) => (
                          <div key={tier.name} className={`p-3 rounded-xl border transition-all ${
                            tier.name === currentTier.name 
                              ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" 
                              : "border-border bg-muted/30"
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <tier.icon size={16} style={{ color: tier.color }} />
                              <span className="text-xs font-black" style={{ color: tier.color }}>{tier.name}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">{tier.min}+ indicados</p>
                            <p className="text-[10px] font-bold text-foreground">+{tier.bonus}% bônus</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* REDE TAB */}
            <TabsContent value="rede">
              <div className="space-y-6">
                {[
                  { level: 1, data: myNetwork.level1, rate: "20%", color: "primary" },
                  { level: 2, data: myNetwork.level2, rate: "15%", color: "accent-foreground" },
                  { level: 3, data: myNetwork.level3, rate: "15%", color: "muted-foreground" },
                ].map((group) => (
                  <Card key={group.level} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display font-black text-foreground flex items-center gap-2">
                          <Layers size={16} className="text-primary" />
                          Nível {group.level}
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-black">{group.rate}</Badge>
                        </h3>
                        <span className="text-xs text-muted-foreground font-bold">{group.data.length} afiliado(s)</span>
                      </div>
                      <div className="space-y-2">
                        {group.data.map((r, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                {r.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-black text-sm text-foreground">{r.name}</p>
                                <p className="text-xs text-muted-foreground">Plano {r.plan} • {r.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`text-xs ${
                                r.status === "ativo" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
                              }`}>
                                {r.status === "ativo" ? "Ativo" : "Pendente"}
                              </Badge>
                              <span className="font-bold text-xs text-foreground">{r.comissao}</span>
                            </div>
                          </div>
                        ))}
                        {group.data.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">Nenhum afiliado neste nível ainda</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* COMISSÕES TAB */}
            <TabsContent value="comissoes">
              <div className="space-y-6">
                {/* Commission structure */}
                <Card className="border-border border-primary/20">
                  <CardContent className="p-6">
                    <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                      <Percent size={18} className="text-primary" /> Estrutura de Comissões — 3 Níveis
                    </h3>
                    <div className="space-y-3 mb-4">
                      {commissionLevels.map((c) => (
                        <div key={c.level} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 border border-border">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg"
                            style={{ backgroundColor: c.color + "18", color: c.color }}>
                            {c.level}
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-sm text-foreground">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.desc}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-display font-black" style={{ color: c.color }}>{c.rate}%</p>
                            <p className="text-[10px] text-muted-foreground">por mês</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Comissão Total Máxima</p>
                      <p className="text-4xl font-display font-black text-primary">50%</p>
                      <p className="text-xs text-muted-foreground">do valor do plano mensal, recorrente!</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Earnings per plan */}
                <Card className="border-border">
                  <CardContent className="p-6">
                    <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                      <DollarSign size={18} className="text-primary" /> Ganhos por Plano de Assinatura
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 text-xs font-bold text-muted-foreground">Plano</th>
                            <th className="text-center py-2 text-xs font-bold text-muted-foreground">Valor</th>
                            <th className="text-center py-2 text-xs font-bold text-primary">Nív. 1 (20%)</th>
                            <th className="text-center py-2 text-xs font-bold text-primary/70">Nív. 2 (15%)</th>
                            <th className="text-center py-2 text-xs font-bold text-primary/50">Nív. 3 (15%)</th>
                            <th className="text-center py-2 text-xs font-black text-primary">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {planEarnings.map((p) => (
                            <tr key={p.plan} className="border-b border-border/50">
                              <td className="py-3 font-bold text-foreground">{p.plan}</td>
                              <td className="py-3 text-center text-muted-foreground">R$ {p.price}</td>
                              <td className="py-3 text-center font-bold text-primary">R$ {p.l1.toFixed(2)}</td>
                              <td className="py-3 text-center font-bold text-primary/70">R$ {p.l2.toFixed(2)}</td>
                              <td className="py-3 text-center font-bold text-primary/50">R$ {p.l3.toFixed(2)}</td>
                              <td className="py-3 text-center font-black text-primary">R$ {p.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 text-center">
                      💡 Valores recorrentes — você ganha todo mês enquanto o indicado mantiver o plano ativo!
                    </p>
                  </CardContent>
                </Card>

                {/* How it works */}
                <Card className="border-border">
                  <CardContent className="p-6">
                    <h3 className="font-display font-black text-foreground mb-4">Como Funciona?</h3>
                    <div className="grid sm:grid-cols-4 gap-4">
                      {[
                        { step: "1", title: "Compartilhe", desc: "Envie seu código de afiliado via WhatsApp, e-mail ou redes sociais.", icon: Share2 },
                        { step: "2", title: "Cadastro", desc: "Quando alguém se cadastrar com seu código, entra na sua rede nível 1.", icon: Users },
                        { step: "3", title: "Assinatura", desc: "Quando seu indicado assinar um plano, você recebe 20% todo mês.", icon: DollarSign },
                        { step: "4", title: "Rede cresce", desc: "Seus indicados também indicam e você ganha nos níveis 2 e 3!", icon: TrendingUp },
                      ].map((s) => (
                        <div key={s.step} className="text-center">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <s.icon size={20} className="text-primary" />
                          </div>
                          <div className="step-number mx-auto mb-2">{s.step}</div>
                          <p className="font-black text-sm text-foreground">{s.title}</p>
                          <p className="text-xs text-muted-foreground">{s.desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* RANKING TAB */}
            <TabsContent value="ranking">
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <Medal size={18} className="text-[hsl(45,76%,52%)]" /> Ranking Top Afiliados
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">Atualizado em tempo real</p>

                  <div className="space-y-3">
                    {leaderboard.map((l) => (
                      <div key={l.pos} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                        l.pos <= 3 ? "bg-gradient-gold border-gold" : "bg-muted/30 border-border"
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-black w-8 text-center">{l.badge || `#${l.pos}`}</span>
                          <div>
                            <p className="font-black text-sm text-foreground">{l.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">{l.indicacoes} na rede</p>
                              <Badge className="text-[10px] bg-muted/50 text-muted-foreground border-border">{l.tier}</Badge>
                            </div>
                          </div>
                        </div>
                        <span className="font-display font-black text-primary">{l.ganhos}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <div className="pb-12" />
      <Footer />
    </div>
  );
};

export default Indicacoes;
