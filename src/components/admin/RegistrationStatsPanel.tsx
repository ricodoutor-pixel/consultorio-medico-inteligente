/**
 * RegistrationStatsPanel
 * Shows new registrations (professionals, patients, pharmacies, distributors)
 * by day, month, and year on the admin dashboard.
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Stethoscope, Users, Store, Truck, CalendarDays, CalendarRange, Calendar } from "lucide-react";

interface RegistrationStats {
  doctors: { today: number; month: number; year: number; total: number };
  patients: { today: number; month: number; year: number; total: number };
  // Pharmacies & distributors tracked via profiles with user_type
  pharmacies: { today: number; month: number; year: number; total: number };
  distributors: { today: number; month: number; year: number; total: number };
}

const defaultStats: RegistrationStats = {
  doctors: { today: 0, month: 0, year: 0, total: 0 },
  patients: { today: 0, month: 0, year: 0, total: 0 },
  pharmacies: { today: 0, month: 0, year: 0, total: 0 },
  distributors: { today: 0, month: 0, year: 0, total: 0 },
};

function countByPeriod(dates: string[]): { today: number; month: number; year: number; total: number } {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const monthStr = now.toISOString().slice(0, 7);
  const yearStr = now.getFullYear().toString();

  let today = 0, month = 0, year = 0;
  for (const d of dates) {
    if (d.startsWith(todayStr)) today++;
    if (d.startsWith(monthStr)) month++;
    if (d.startsWith(yearStr)) year++;
  }
  return { today, month, year, total: dates.length };
}

export const RegistrationStatsPanel = () => {
  const [stats, setStats] = useState<RegistrationStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Doctors
        const { data: doctors } = await supabase
          .from("doctors")
          .select("created_at")
          .eq("is_verified", true);

        // Profiles by user_type
        const { data: profiles } = await supabase
          .from("profiles")
          .select("created_at, user_type");

        const doctorDates = (doctors || []).map(d => d.created_at);
        const patientDates = (profiles || []).filter(p => p.user_type === "patient").map(p => p.created_at);
        const pharmacyDates = (profiles || []).filter(p => p.user_type === "pharmacy").map(p => p.created_at);
        const distributorDates = (profiles || []).filter(p => p.user_type === "distributor").map(p => p.created_at);

        setStats({
          doctors: countByPeriod(doctorDates),
          patients: countByPeriod(patientDates),
          pharmacies: countByPeriod(pharmacyDates),
          distributors: countByPeriod(distributorDates),
        });
      } catch (err) {
        console.error("[RegistrationStats] Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const categories = [
    { key: "doctors" as const, label: "Profissionais", icon: Stethoscope, color: "text-primary bg-primary/10" },
    { key: "patients" as const, label: "Pacientes", icon: Users, color: "text-green-500 bg-green-500/10" },
    { key: "pharmacies" as const, label: "Farmácias", icon: Store, color: "text-amber-500 bg-amber-500/10" },
    { key: "distributors" as const, label: "Distribuidores", icon: Truck, color: "text-blue-500 bg-blue-500/10" },
  ];

  const periods = [
    { key: "today" as const, label: "Hoje", icon: CalendarDays },
    { key: "month" as const, label: "Este Mês", icon: CalendarRange },
    { key: "year" as const, label: "Este Ano", icon: Calendar },
  ];

  if (loading) {
    return (
      <Card className="border-border bg-card/50">
        <CardContent className="p-6 text-center">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Users size={14} /> Novos Cadastros — Dia / Mês / Ano
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categories.map(cat => {
            const Icon = cat.icon;
            const data = stats[cat.key];
            return (
              <div key={cat.key} className="rounded-2xl border border-border bg-background/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cat.color}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-foreground">{cat.label}</p>
                    <p className="text-[10px] text-muted-foreground">Total: {data.total}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {periods.map(p => {
                    const PIcon = p.icon;
                    const val = data[p.key];
                    return (
                      <div key={p.key} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/30">
                        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                          <PIcon size={10} /> {p.label}
                        </span>
                        <span className={`text-sm font-black ${val > 0 ? "text-primary" : "text-muted-foreground"}`}>
                          {val > 0 ? `+${val}` : "0"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
