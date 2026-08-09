import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Copy, Wallet, Gift, Trophy, ArrowUpRight, Medal, Crown, Star, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const leaderboardData = [
  { rank: 1, name: "Dr. Marcos T.", coins: 14500, avatar: "MT", type: "medico" },
  { rank: 2, name: "Ana Clara", coins: 8200, avatar: "AC", type: "paciente" },
  { rank: 3, name: "Carlos V.", coins: 5400, avatar: "CV", type: "paciente" },
  { rank: 4, name: "Dra. Juliana", coins: 3100, avatar: "DJ", type: "medico" },
  { rank: 5, name: "Roberto M.", coins: 2800, avatar: "RM", type: "paciente" },
];

export default function AfiliadosGamificado() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [balance, setBalance] = useState(0); 
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [pixType, setPixType] = useState("cpf");
  
  useEffect(() => {
    fetchProfile();
  }, []);

  const generateRefCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'PRZ-';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    let { data } = await (supabase as any).from("profiles").select("*").eq("id", session.user.id).single();
    
    if (data && !data.referral_code) {
      const newRefCode = generateRefCode();
      const { data: updated } = await (supabase as any).from("profiles").update({ referral_code: newRefCode }).eq("id", session.user.id).select().single();
      if (updated) data = updated;
    }

    setProfile(data);
    setBalance(data?.planta_coins || 0);
    setPixKey(data?.pix_key || "");
    setPixType(data?.pix_type || "cpf");
    setLoading(false);
  };

  const brlEquivalent = (balance * 0.1).toFixed(2); // 10 RC = 1 BRL
  const refCode = profile?.referral_code || "PRZ-00000";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`https://plantayraiz.com.br/cadastro?ref=${refCode}`);
    toast({ title: "Link copiado!", description: "Compartilhe com seus amigos e pacientes." });
  };

  const handleWithdrawalRequest = async () => {
    if (!profile?.is_vip) {
      toast({
        title: "Acesso Restrito",
        description: "Você precisa ser assinante VIP para solicitar saques PIX.",
        variant: "destructive"
      });
      navigate("/upgrade");
      return;
    }
    
    setPixModalOpen(true);
  };

  const submitPix = async () => {
    if (!pixKey) {
      toast({ title: "Chave PIX inválida", variant: "destructive" });
      return;
    }
    
    // Save PIX key to profile
    await supabase.from("profiles").update({ pix_key: pixKey, pix_type: pixType }).eq("id", profile.id);
    
    // Simulate withdrawal request
    toast({ title: "Saque Solicitado", description: "Sua solicitação de saque PIX está em análise." });
    setPixModalOpen(false);
  };

  if (loading) {
    return <div className="min-h-dvh bg-background pt-24 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto py-8 px-4 space-y-8 pt-24">
        {!profile?.is_vip && balance > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-yellow-500" />
              <div>
                <p className="font-bold text-foreground">Você possui R$ {brlEquivalent} acumulados!</p>
                <p className="text-sm text-muted-foreground">Ative seu Plano VIP para liberar a transferência via PIX.</p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate("/upgrade")} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold shrink-0 ml-4">
              Ativar VIP
            </Button>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground flex items-center gap-3">
              <Trophy className="text-yellow-500 h-8 w-8" /> 
              Programa Raiz VIP
            </h1>
            <p className="text-muted-foreground mt-2">Indique a Planta y Raíz, ajude milhares de pacientes e ganhe prêmios reais.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-card border border-border p-3 rounded-2xl shadow-sm w-full md:w-auto">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Wallet className="text-primary h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase">Seu Saldo</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">{balance} RC</span>
                <span className="text-sm font-bold text-green-500">~ R$ {brlEquivalent}</span>
              </div>
            </div>
            <Button 
              size="sm" 
              className="ml-2 font-bold rounded-xl" 
              variant={profile?.is_vip ? "default" : "secondary"}
              onClick={handleWithdrawalRequest}
            >
              <Gift size={16} className="mr-1" /> Saque PIX
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border shadow-md overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <CardHeader>
                <CardTitle>Seu Link de Indicação</CardTitle>
                <CardDescription>Compartilhe este link. Você ganha RaizCoins quando alguém se cadastra ou compra.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 bg-muted p-4 rounded-xl border border-border font-mono text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                    https://plantayraiz.com.br/cadastro?ref={refCode}
                  </div>
                  <Button onClick={copyToClipboard} size="lg" className="rounded-xl px-6">
                    <Copy size={18} className="mr-2" /> Copiar Link
                  </Button>
                </div>

                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Users size={18} className="text-primary" /> Sua Rede (3 Gerações)
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-foreground">1ª Geração (Diretos)</h4>
                      <p className="text-sm text-muted-foreground">Pessoas que você convidou diretamente</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-2xl font-black text-primary">50%</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Comissão</span>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between pl-8 relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-border"></div>
                    <div className="absolute left-4 top-1/2 w-4 h-px bg-border"></div>
                    <div>
                      <h4 className="font-bold text-foreground">2ª Geração</h4>
                      <p className="text-sm text-muted-foreground">Convidados dos seus diretos</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-xl font-black text-foreground">5%</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Comissão</span>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between pl-12 relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-border"></div>
                    <div className="absolute left-4 top-1/2 w-8 h-px bg-border"></div>
                    <div>
                      <h4 className="font-bold text-foreground">3ª Geração</h4>
                      <p className="text-sm text-muted-foreground">Rede profunda</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-lg font-black text-muted-foreground">2%</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">Comissão</span>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-yellow-500/30 shadow-lg shadow-yellow-500/5 bg-gradient-to-b from-card to-yellow-500/5 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 justify-center text-xl">
                  <Crown className="text-yellow-500" /> Leaderboard Semanal
                </CardTitle>
                <CardDescription className="text-center">Os maiores divulgadores ganham bônus VIP todo domingo!</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {leaderboardData.map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border relative overflow-hidden group hover:border-yellow-500/50 transition-colors">
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0 ? "bg-yellow-500 text-white" : 
                        idx === 1 ? "bg-slate-300 text-slate-800" : 
                        idx === 2 ? "bg-amber-700 text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        {idx < 3 ? <Medal size={16} /> : idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{user.type}</p>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <p className="font-black text-sm text-foreground">{user.coins.toLocaleString()} RC</p>
                    </div>
                    {idx === 0 && (
                      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-yellow-500/20 to-transparent"></div>
                    )}
                  </div>
                ))}

                <div className="pt-4 border-t border-border mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-muted-foreground">Sua Posição: 14º</span>
                    <span className="font-bold text-primary">Faltam 450 RC pro Top 10</span>
                  </div>
                  <Progress value={75} className="h-2 bg-muted" />
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Saque PIX</DialogTitle>
            <DialogDescription>
              Confirme sua chave PIX para receber R$ {brlEquivalent}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Chave</Label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={pixType}
                onChange={(e) => setPixType(e.target.value)}
              >
                <option value="cpf">CPF/CNPJ</option>
                <option value="email">E-mail</option>
                <option value="phone">Telefone</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input 
                placeholder="Sua chave PIX" 
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPixModalOpen(false)}>Cancelar</Button>
            <Button onClick={submitPix}>Confirmar Solicitação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
