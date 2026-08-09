import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { DoctorPerformanceWidget } from "@/components/doctor/DoctorPerformanceWidget";
import { DoctorSubscriptionPlans } from "@/components/doctor/DoctorSubscriptionPlans";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Crown, TrendingUp, DollarSign, Shield, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ["hsl(152 80% 45%)", "hsl(45 90% 55%)", "hsl(270 60% 60%)", "hsl(200 70% 50%)"];

const RevenueDistribution = () => {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState("basic");
  const [simulatedTier, setSimulatedTier] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoctor();
  }, []);

  const fetchDoctor = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data: doctor } = await supabase
      .from("doctors")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (doctor) {
      setDoctorId(doctor.id);

      const { data: sub } = await supabase
        .from("medical_subscriptions")
        .select("plan_tier")
        .eq("doctor_id", doctor.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sub?.plan_tier) setCurrentTier(sub.plan_tier);
    }
    setLoading(false);
  };

  const distributionData = [
    { name: "Orientações Técnicas (50%)", value: 50 },
    { name: "Horas Online (30%)", value: 30 },
    { name: "Avaliação (20%)", value: 20 },
  ];

  const fraudRules = [
    { flag: "Horas online altas, poucas consultas", points: 20, color: "text-amber-400" },
    { flag: "Avaliação alta, poucas interações", points: 15, color: "text-amber-400" },
    { flag: "Aumento anormal de consultas (>300%)", points: 25, color: "text-red-400" },
    { flag: "Múltiplas avaliações do mesmo usuário", points: 30, color: "text-red-400" },
  ];

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground mb-2">
              Distribuição de <span className="text-amber-400">Renda</span>
            </h1>
            <p className="text-muted-foreground mb-8">
              Sistema de participação nos lucros baseado em desempenho e plano de assinatura.
            </p>

            {!doctorId ? (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-6 flex items-center gap-4">
                  <AlertTriangle size={24} className="text-destructive" />
                  <div>
                    <p className="font-bold text-foreground">Acesso restrito a médicos</p>
                    <p className="text-xs text-muted-foreground">Complete seu cadastro profissional para participar.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Performance + Formula */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                  <DoctorPerformanceWidget doctorId={doctorId} simulatedTier={simulatedTier} />

                  <Card className="border-border">
                    <CardContent className="p-6">
                      <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-primary" /> Fórmula de Cálculo
                      </h3>
                      <div className="bg-muted/20 rounded-xl p-4 border border-border mb-4 font-mono text-sm text-muted-foreground">
                        <p className="text-amber-400 font-bold mb-2">Peso = (Orientações Técnicas × 0.5) + (HorasOnline × 0.3) + (Avaliação × 0.2)</p>
                        <p className="text-primary">PesoFinal = Peso × Multiplicador do Plano</p>
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={distributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, value }) => `${value}%`}>
                            {distributionData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-3 mt-2 justify-center">
                        {distributionData.map((d, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]" style={{ borderColor: COLORS[i], color: COLORS[i] }}>
                            {d.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Subscription Plans */}
                <div className="mb-8">
                  <DoctorSubscriptionPlans doctorId={doctorId} currentTier={currentTier} onTierChange={setSimulatedTier} />
                </div>

                {/* Fraud Detection Info */}
                <Card className="border-border">
                  <CardContent className="p-6">
                    <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                      <Shield size={18} className="text-amber-400" /> Sistema Anti-Fraude IA
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      O sistema monitora automaticamente padrões suspeitos. Score &lt; 50 = elegível para distribuição.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {fraudRules.map((rule, i) => (
                        <div key={i} className="bg-muted/20 rounded-xl p-3 border border-border flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{rule.flag}</span>
                          <Badge variant="outline" className={`${rule.color} text-[10px]`}>+{rule.points}pts</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default RevenueDistribution;
