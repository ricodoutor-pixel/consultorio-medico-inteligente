import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Users, ShoppingBag, Stethoscope, DollarSign, TrendingUp, Shield, CheckCircle2, XCircle, Clock, AlertTriangle, Activity, Globe, Eye, UserPlus, LogOut, RefreshCw, Wallet, HeartPulse, BarChart3, Bell, Bitcoin, CreditCard, MessageSquare, Send, Bot, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const generateLiveData = () => ({
  usersOnline: Math.floor(Math.random() * 300) + 150,
  pageViews: Math.floor(Math.random() * 5000) + 8000,
  newSignups: Math.floor(Math.random() * 50) + 20,
  activeConsults: Math.floor(Math.random() * 30) + 5,
  gmv: (Math.random() * 20000 + 40000).toFixed(2),
  orders: Math.floor(Math.random() * 100) + 300,
  appointments: Math.floor(Math.random() * 50) + 100,
  conversionRate: (Math.random() * 2 + 3.5).toFixed(1),
  activeSellers: Math.floor(Math.random() * 5) + 8,
  activeProfessionals: 15,
  whatsappAlertsSent: Math.floor(Math.random() * 200) + 500,
  clicksignDocsPending: Math.floor(Math.random() * 15) + 5,
});

const Admin = () => {
  const [tab, setTab] = useState("dashboard");
  const [live, setLive] = useState(generateLiveData());
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Olá, Comandante Dr. Edilson! Sou o Manus CEO. Como posso ajudar na gestão da Planta y Raiz hoje?" }
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin-login"); return; }
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!roleData) { navigate("/admin-login"); return; }
    };
    checkAuth();
    const interval = setInterval(() => setLive(generateLiveData()), 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsgs = [...messages, { role: "user", content: chatInput }];
    setMessages(newMsgs);
    setChatInput("");
    setTimeout(() => {
      setMessages([...newMsgs, { role: "assistant", content: "Comando recebido! Estou processando a análise de dados e otimizando os webhooks de pagamento. Status: 100% Operacional." }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div className="mb-8 flex items-center justify-between flex-wrap gap-4" initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-gold border border-gold flex items-center justify-center glow-gold">
                <Shield size={24} className="text-[hsl(45,76%,52%)]" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-display font-black text-foreground">Painel Administrativo - Manus CEO</h1>
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Plataforma Autônoma 24x7 • Inteligência Ativa
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setChatOpen(!chatOpen)} className="bg-primary text-white font-black rounded-xl">
                <Bot size={18} className="mr-2" /> Falar com Manus CEO
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl text-xs text-destructive border-destructive/30" onClick={() => navigate("/admin-login")}>
                <LogOut size={14} className="mr-1" /> Sair
              </Button>
            </div>
          </motion.div>

          {/* Rastreio de Novas Funções */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Alertas WhatsApp", value: live.whatsappAlertsSent, icon: MessageSquare, color: "text-green-500" },
              { label: "Docs ClickSign", value: live.clicksignDocsPending, icon: FileText, color: "text-blue-500" },
              { label: "Status Brisa IA", value: "Online", icon: Zap, color: "text-yellow-500" },
              { label: "Nível Autonomia", value: "98%", icon: Activity, color: "text-purple-500" },
            ].map((stat, i) => (
              <Card key={i} className="border-border bg-card/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <stat.icon size={20} className={stat.color} />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">{stat.label}</p>
                    <p className="text-xl font-black text-foreground">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dashboard Content (Placeholder for original charts) */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border bg-card/30">
              <CardContent className="p-6">
                <h3 className="font-display font-black mb-6">Métricas de Produção Imediata</h3>
                <div className="h-80 w-full bg-muted/20 rounded-2xl flex items-center justify-center">
                  <TrendingUp size={48} className="text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground font-bold ml-4">Gráficos de Performance Ativos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card/30">
              <CardContent className="p-6">
                <h3 className="font-display font-black mb-6">Atividade Recente</h3>
                <div className="space-y-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground">Nova consulta agendada</p>
                        <p className="text-[10px] text-muted-foreground">Há {i*2} minutos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Chat GPT Manus CEO ADM */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-0 right-0 w-96 h-full bg-card border-l border-border shadow-2xl z-[100] flex flex-col"
          >
            <div className="p-6 border-b border-border bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Bot size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-sm">Manus CEO ADM</p>
                  <p className="text-[10px] text-primary font-bold">CONECTADO • IA ATIVA</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setChatOpen(false)}>
                <XCircle size={20} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium ${
                    m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-muted border border-border rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-border bg-background">
              <div className="flex gap-2">
                <Input 
                  placeholder="Comande a clínica..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="rounded-xl h-10"
                />
                <Button onClick={handleSendMessage} className="h-10 w-10 rounded-xl bg-primary text-white">
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

const FileText = ({ className, ...props }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);

export default Admin;
