import React, { useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Heart, Moon, Footprints, Smartphone, Watch, Link2, RefreshCw, Shield, Clock, Zap, AlertCircle, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const heartData = [
  { time: '00:00', bpm: 62 }, { time: '04:00', bpm: 58 }, { time: '08:00', bpm: 75 },
  { time: '12:00', bpm: 82 }, { time: '16:00', bpm: 78 }, { time: '20:00', bpm: 70 },
  { time: '23:59', bpm: 64 },
];

const IoMTHub = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(false);

  const syncData = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary glow-green">
                <Watch size={24} />
              </div>
              <span className="text-sm font-bold text-primary tracking-widest uppercase">IoMT Hub - Internet das Coisas Médicas</span>
            </div>
            <h1 className="text-4xl font-display font-black text-foreground mb-3">Monitoramento <span className="text-gradient-green">Vital</span> 24/7</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Dados biométricos integrados ao seu tratamento de cannabis medicinal para máxima precisão clínica.
            </p>
          </header>

          <Tabs defaultValue="vitals" className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <TabsList className="bg-muted/50 p-1 rounded-xl">
                <TabsTrigger value="vitals" className="rounded-lg font-bold">Sinais Vitais</TabsTrigger>
                <TabsTrigger value="devices" className="rounded-lg font-bold">Dispositivos</TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg font-bold">Histórico FHIR</TabsTrigger>
              </TabsList>
              <Button onClick={syncData} disabled={loading} variant="outline" className="rounded-xl border-primary/30 text-primary font-bold">
                {loading ? <RefreshCw className="animate-spin mr-2" size={16} /> : <RefreshCw className="mr-2" size={16} />}
                {loading ? 'Sincronizando...' : 'Sincronizar Wearables'}
              </Button>
            </div>

            <TabsContent value="vitals" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Heart Rate Area */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-border bg-card/50 backdrop-blur overflow-hidden">
                    <CardHeader className="border-b border-border bg-muted/20">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                          <Heart size={16} className="text-destructive animate-pulse" /> Frequência Cardíaca (24h)
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] border-green text-green-500 font-bold">MÉDIA: 68 BPM</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={heartData}>
                          <defs>
                            <linearGradient id="colorBpm" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(350 80% 55%)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(350 80% 55%)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis dataKey="time" stroke="#888" fontSize={10} />
                          <YAxis stroke="#888" fontSize={10} domain={[40, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px' }} />
                          <Area type="monotone" dataKey="bpm" stroke="hsl(350 80% 55%)" fillOpacity={1} fill="url(#colorBpm)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border bg-card/50">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                          <Moon size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase">Qualidade do Sono</p>
                          <h3 className="text-2xl font-black text-foreground">7h 45m</h3>
                          <p className="text-[10px] text-green-500 font-bold">+12% vs média</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-border bg-card/50">
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <Activity size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase">HRV (Variabilidade)</p>
                          <h3 className="text-2xl font-black text-foreground">42 ms</h3>
                          <p className="text-[10px] text-green-500 font-bold">Status: Otimizado</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* IA Insights Sidebar */}
                <div className="space-y-6">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                        <Zap size={16} className="text-primary" /> Análise Manus CEO
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-xl bg-background/50 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingDown size={14} className="text-green-500" />
                          <span className="text-xs font-bold text-foreground">Redução de Estresse</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Sua frequência cardíaca em repouso apresentou queda consistente de 4 BPM após a introdução do óleo CBD Full Spectrum.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-background/50 border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <Moon size={14} className="text-secondary" />
                          <span className="text-xs font-bold text-foreground">Eficiência do Sono</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          O tempo em Sono Profundo (Deep Sleep) aumentou 18% nos últimos 7 dias. O protocolo noturno está sendo eficaz.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-500/20 bg-orange-500/5">
                    <CardHeader>
                      <CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-orange-500">
                        <AlertCircle size={16} /> Alerta de Segurança
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Monitoramento ativo para taquicardia (FC {'>'} 110 BPM). Em caso de desvio crítico, a equipe médica será notificada automaticamente pela IA 24×7.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="devices" className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Apple Watch Ultra", status: "Conectado", icon: <Watch className="text-primary" />, battery: "85%" },
                { name: "Oura Ring Gen3", status: "Conectado", icon: <Activity className="text-secondary" />, battery: "42%" },
                { name: "Fitbit Sense", status: "Disponível", icon: <Smartphone className="text-muted-foreground" />, battery: "-" },
              ].map((device) => (
                <Card key={device.name} className="border-border bg-card/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        {device.icon}
                      </div>
                      <Badge variant={device.status === 'Conectado' ? 'default' : 'outline'}>{device.status}</Badge>
                    </div>
                    <h4 className="font-bold text-foreground mb-1">{device.name}</h4>
                    <p className="text-xs text-muted-foreground mb-4">Bateria: {device.battery}</p>
                    <Button variant="outline" size="sm" className="w-full rounded-lg text-xs font-bold">Configurar</Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="history">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                    <Shield size={16} className="text-primary" /> Histórico Clínico Criptografado (HL7 FHIR)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-xl p-4 overflow-x-auto">
                    <pre className="text-[10px] text-muted-foreground font-mono">
                      {JSON.stringify({
                        resourceType: "Bundle",
                        type: "collection",
                        timestamp: new Date().toISOString(),
                        entry: [
                          { resource: { id: "obs-1", code: "8867-4", display: "Heart rate", value: 72, unit: "bpm" } },
                          { resource: { id: "obs-2", code: "93832-4", display: "Sleep duration", value: 7.75, unit: "hours" } }
                        ]
                      }, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default IoMTHub;
