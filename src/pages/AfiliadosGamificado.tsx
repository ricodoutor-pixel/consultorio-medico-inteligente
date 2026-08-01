import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Copy, Wallet, Gift, Trophy, ArrowUpRight, Medal, Crown, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const leaderboardData = [
  { rank: 1, name: "Dr. Marcos T.", coins: 14500, avatar: "MT", type: "medico" },
  { rank: 2, name: "Ana Clara", coins: 8200, avatar: "AC", type: "paciente" },
  { rank: 3, name: "Carlos V.", coins: 5400, avatar: "CV", type: "paciente" },
  { rank: 4, name: "Dra. Juliana", coins: 3100, avatar: "DJ", type: "medico" },
  { rank: 5, name: "Roberto M.", coins: 2800, avatar: "RM", type: "paciente" },
];

export default function AfiliadosGamificado() {
  const { toast } = useToast();
  const [balance] = useState(3250); // RaizCoins
  const brlEquivalent = (balance * 0.1).toFixed(2); // 10 RC = 1 BRL
  const refCode = "PRZ-8X9L2";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`https://plantayraiz.com.br?ref=${refCode}`);
    toast({ title: "Link copiado!", description: "Compartilhe com seus amigos e pacientes." });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto py-8 px-4 space-y-8 pt-24">
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
            <Button size="sm" className="ml-2 font-bold rounded-xl" onClick={() => toast({ title: "Resgate", description: "Área de saque em manutenção." })}>
              <Gift size={16} className="mr-1" /> Resgatar
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
                  <div className="flex-1 bg-muted p-4 rounded-xl border border-border font-mono text-sm text-foreground overflow-hidden text-ellipsis">
                    https://plantayraiz.com.br?ref={refCode}
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
                      <span className="block text-2xl font-black text-primary">10%</span>
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
                      <span className="block text-xl font-black text-foreground">3%</span>
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
    </div>
  );
}
