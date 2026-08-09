import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Users, Activity, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const initialCountries = [
  { country: "Brasil", flag: "🇧🇷", users: 12450, color: "hsl(152 80% 45%)" },
  { country: "Portugal", flag: "🇵🇹", users: 2100, color: "hsl(270 60% 60%)" },
  { country: "EUA", flag: "🇺🇸", users: 1850, color: "hsl(45 76% 52%)" },
  { country: "Canadá", flag: "🇨🇦", users: 980, color: "hsl(200 80% 50%)" },
  { country: "Alemanha", flag: "🇩🇪", users: 720, color: "hsl(350 80% 55%)" },
  { country: "Espanha", flag: "🇪🇸", users: 540, color: "hsl(30 80% 55%)" },
  { country: "Colômbia", flag: "🇨🇴", users: 430, color: "hsl(180 60% 50%)" },
  { country: "Uruguai", flag: "🇺🇾", users: 310, color: "hsl(220 60% 55%)" },
];

const userTypes = [
  { name: "Pacientes", value: 14200, color: "hsl(152 80% 45%)" },
  { name: "Especialistas", value: 580, color: "hsl(270 60% 60%)" },
  { name: "Farmácias", value: 120, color: "hsl(45 76% 52%)" },
];

const OnlineUsers = () => {
  const [countries, setCountries] = useState(initialCountries);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountries((prev) =>
        prev.map((c) => ({
          ...c,
          users: c.users + Math.floor(Math.random() * 20) - 8,
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalOnline = countries.reduce((s, c) => s + c.users, 0);

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-3xl md:text-4xl font-display font-black text-foreground mb-2">
              Usuários <span className="text-gradient-green">Online</span>
            </h1>
            <p className="text-muted-foreground font-medium mb-8">Monitoramento em tempo real • Atualiza a cada 3s</p>

            {/* Total */}
            <Card className="border-border mb-8 glow-green">
              <CardContent className="p-8 text-center">
                <Activity size={32} className="text-primary mx-auto mb-3 animate-pulse" />
                <p className="text-5xl md:text-6xl font-display font-black text-gradient-green">{totalOnline.toLocaleString()}</p>
                <p className="text-muted-foreground font-bold mt-2">Usuários Online Agora</p>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* By Country */}
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <Globe size={18} /> Por País
                  </h3>
                  <div className="space-y-3">
                    {countries.sort((a, b) => b.users - a.users).map((c, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{c.flag}</span>
                          <span className="font-bold text-sm text-foreground">{c.country}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${(c.users / countries[0].users) * 100}%`, background: c.color }}
                            />
                          </div>
                          <span className="text-sm font-display font-black text-foreground w-16 text-right">{c.users.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* By Type */}
              <Card className="border-border">
                <CardContent className="p-6">
                  <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                    <Users size={18} /> Por Tipo
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={userTypes} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={5}>
                        {userTypes.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(240 15% 7%)", border: "1px solid hsl(240 10% 14%)", borderRadius: "14px", color: "hsl(240 10% 93%)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4">
                    {userTypes.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: t.color }} />
                        <span className="text-xs font-bold text-muted-foreground">{t.name} ({t.value.toLocaleString()})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Regions */}
            <Card className="border-border">
              <CardContent className="p-6">
                <h3 className="font-display font-black text-foreground mb-4 flex items-center gap-2">
                  <MapPin size={18} /> Top Regiões Brasil
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { region: "Sudeste", users: 5200 },
                    { region: "Nordeste", users: 3100 },
                    { region: "Sul", users: 2400 },
                    { region: "Centro-Oeste", users: 1200 },
                    { region: "Norte", users: 550 },
                  ].map((r, i) => (
                    <div key={i} className="text-center p-3 rounded-xl bg-muted/30 border border-border">
                      <p className="text-lg font-display font-black text-foreground">{r.users.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground font-bold">{r.region}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default OnlineUsers;
