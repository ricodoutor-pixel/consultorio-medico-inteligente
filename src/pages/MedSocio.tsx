import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Users, TrendingUp, Copy, Network, ShieldCheck, DollarSign, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { AffiliateTree } from "@/components/doctor/AffiliateTree";

export const MedSocio = () => {
  const { toast } = useToast();
  const [directInvites, setDirectInvites] = useState([5]);
  const [indirectInvites, setIndirectInvites] = useState([3]);
  const [doctor, setDoctor] = useState<any>(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('doctors').select('*').eq('user_id', user.id).single();
      setDoctor(data);
    };
    fetchDoctor();
  }, []);

  // Constantes de pagamento
  const GEN1_PAY = 50;
  const GEN2_PAY = 15;
  const GEN3_PAY = 10;

  // Cálculo da simulação
  const calcGen1 = directInvites[0];
  const calcGen2 = calcGen1 * indirectInvites[0];
  const calcGen3 = calcGen2 * indirectInvites[0];
  
  const totalMonthly = (calcGen1 * GEN1_PAY) + (calcGen2 * GEN2_PAY) + (calcGen3 * GEN3_PAY);

  const referralCode = doctor?.crm ? `DR_${doctor.full_name?.split(' ')[1] || 'MEDICO'}_CRM${doctor.crm}`.toUpperCase() : doctor?.id || "CONVIDADO_" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const referralLink = `https://plantayraiz.com.br/cadastro-profissional?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link Copiado!",
      description: "Seu link exclusivo de indicação foi copiado para a área de transferência.",
    });
  };

  const handleCEOContact = () => {
    window.open("https://wa.me/5511987131241?text=Olá%20Manus%20CEO,%20quero%20suporte%20sobre%20a%20minha%20rede%20Médico%20Sócio.", "_blank");
  };

  return (
    <div className="min-h-dvh bg-[#0a0f0a] text-slate-200">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-32 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-12"
        >
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight text-white">
              Programa <span className="text-gradient-green drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]">Médico Sócio</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
              Construa sua rede médica na Planta y Raiz. Ganhe recorrência vitalícia por cada profissional ativo na sua estrutura.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-900/50 border-emerald-500/20 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center justify-between">
                  Indicados (Hoje) <Users className="h-4 w-4 text-emerald-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">0</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-emerald-500/20 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center justify-between">
                  Indicados (Mês) <TrendingUp className="h-4 w-4 text-emerald-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">0</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-emerald-500/20 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center justify-between">
                  Rede Total <Network className="h-4 w-4 text-emerald-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">0</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/50 border-emerald-500/50 backdrop-blur shadow-[0_0_15px_rgba(16,185,129,0.15)] relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/5" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-300 flex items-center justify-between">
                  Ativos VIP <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-emerald-400">0</div>
                <p className="text-xs text-emerald-500/80 mt-1">Gerando recorrência (R$ 99/mês)</p>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown Generations */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/40 to-slate-900/80 border border-emerald-500/20 text-center">
              <div className="text-emerald-400 font-black text-xl mb-1">1ª Geração</div>
              <div className="text-slate-400 text-sm mb-4">Seus convidados diretos</div>
              <div className="text-3xl font-bold text-white mb-2">R$ 50<span className="text-sm text-slate-500 font-normal">/mês</span></div>
              <div className="text-xs text-emerald-400/80">Por médico ativo</div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-slate-900/80 border border-emerald-500/10 text-center">
              <div className="text-emerald-300 font-black text-xl mb-1">2ª Geração</div>
              <div className="text-slate-400 text-sm mb-4">Convidados dos seus diretos</div>
              <div className="text-3xl font-bold text-white mb-2">R$ 15<span className="text-sm text-slate-500 font-normal">/mês</span></div>
              <div className="text-xs text-emerald-300/80">Por médico ativo</div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900/10 to-slate-900/80 border border-emerald-500/10 text-center">
              <div className="text-emerald-200 font-black text-xl mb-1">3ª Geração</div>
              <div className="text-slate-400 text-sm mb-4">3º nível de profundidade</div>
              <div className="text-3xl font-bold text-white mb-2">R$ 10<span className="text-sm text-slate-500 font-normal">/mês</span></div>
              <div className="text-xs text-emerald-200/80">Por médico ativo</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calculadora Interativa */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-2">
                  <DollarSign className="text-emerald-500" />
                  Simulador de Ganhos
                </CardTitle>
                <p className="text-slate-400 text-sm">Projete sua renda recorrente mensal</p>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-300">Quantos colegas diretos você indica?</label>
                    <span className="text-emerald-400 font-bold">{directInvites[0]}</span>
                  </div>
                  <Slider 
                    value={directInvites} 
                    onValueChange={setDirectInvites} 
                    max={100} 
                    step={1}
                    className="py-4"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-slate-300">Quantos cada um deles indica em média?</label>
                    <span className="text-emerald-400 font-bold">{indirectInvites[0]}</span>
                  </div>
                  <Slider 
                    value={indirectInvites} 
                    onValueChange={setIndirectInvites} 
                    max={50} 
                    step={1}
                    className="py-4"
                  />
                </div>

                <div className="p-6 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-2 mt-8">
                  <p className="text-emerald-100 font-medium text-sm">Projeção Mensal Recorrente</p>
                  <div className="text-5xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMonthly)}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Simulação baseada em {calcGen1} (G1) + {calcGen2} (G2) + {calcGen3} (G3) médicos VIP ativos.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Links and Actions */}
            <div className="space-y-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Seu Link de Indicação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-emerald-400 font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                      {referralLink}
                    </div>
                    <Button onClick={copyLink} className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all shrink-0">
                      <Copy className="h-4 w-4 mr-2" /> Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Compartilhe este link. Médicos cadastrados por ele entram automaticamente na sua 1ª Geração.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Auditoria e Suporte</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400 mb-6">
                    Precisa de ajuda para estruturar uma rede grande ou auditar seus repasses PIX?
                  </p>
                  <Button 
                    onClick={handleCEOContact}
                    className="w-full bg-transparent border-2 border-slate-500 hover:border-white text-white font-bold h-14"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Fale com Administrador (Manus CEO)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <AffiliateTree />
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default MedSocio;
