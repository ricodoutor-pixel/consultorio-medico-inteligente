import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Award, Calendar, DollarSign, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface PerformanceData {
  month: string;
  consultations: number;
  totalRevenue: number;
  platformCommission: number;
  doctorEarnings: number;
  performanceBonus: number;
  bonusPercentage: number;
  finalAmount: number;
}

interface PerformanceBonusWidgetProps {
  doctorId: string;
}

export function PerformanceBonusWidget({ doctorId }: PerformanceBonusWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<PerformanceData | null>(null);
  const [previousMonths, setPreviousMonths] = useState<PerformanceData[]>([]);
  const [totalAccumulated, setTotalAccumulated] = useState(0);

  useEffect(() => {
    if (doctorId) {
      loadPerformanceData();
    }
  }, [doctorId]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);

      // Buscar dados do mês atual e anteriores
      const { data, error } = await supabase
        .from("doctor_performance_bonus")
        .select("*")
        .eq("doctor_id", doctorId)
        .order("month", { ascending: false })
        .limit(12);

      if (error) throw error;

      if (data && data.length > 0) {
        // Mês atual é o primeiro
        setCurrentMonth({
          month: new Date(data[0].month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
          consultations: data[0].total_consultations,
          totalRevenue: data[0].total_revenue,
          platformCommission: data[0].platform_commission,
          doctorEarnings: data[0].doctor_earnings,
          performanceBonus: data[0].performance_bonus,
          bonusPercentage: data[0].bonus_percentage,
          finalAmount: data[0].final_amount,
        });

        // Meses anteriores
        if (data.length > 1) {
          setPreviousMonths(
            data.slice(1).map((item) => ({
              month: new Date(item.month).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
              consultations: item.total_consultations,
              totalRevenue: item.total_revenue,
              platformCommission: item.platform_commission,
              doctorEarnings: item.doctor_earnings,
              performanceBonus: item.performance_bonus,
              bonusPercentage: item.bonus_percentage,
              finalAmount: item.final_amount,
            }))
          );

          // Total acumulado
          const total = data.reduce((sum, item) => sum + item.final_amount, 0);
          setTotalAccumulated(total);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar dados de performance:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-green-50/50 to-emerald-50/50 border-green-200/50">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 bg-gradient-to-br from-green-50/50 to-emerald-50/50 border-green-200/50 backdrop-blur-sm rounded-xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-green-900">
                Participação nos Lucros
              </h3>
              <p className="text-xs text-green-700">Desempenho mensal com bonus</p>
            </div>
          </div>
          <Badge className="bg-green-600 text-white">Ativo</Badge>
        </div>

        {/* Mês Atual */}
        {currentMonth && (
          <div className="space-y-4 mb-6 pb-6 border-b border-green-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-900 capitalize">{currentMonth.month}</span>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-900 border-green-300">
                Atual
              </Badge>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/60 rounded-lg p-3 border border-green-100/50">
                <p className="text-xs text-green-700 font-medium">Consultas</p>
                <p className="text-2xl font-bold text-green-900">{currentMonth.consultations}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3 border border-green-100/50">
                <p className="text-xs text-green-700 font-medium">Receita Total</p>
                <p className="text-lg font-bold text-green-900">R$ {currentMonth.totalRevenue.toFixed(2)}</p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="bg-white/60 rounded-lg p-4 border border-green-100/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-700">Ganho Base (80%):</span>
                <span className="font-semibold text-green-900">R$ {currentMonth.doctorEarnings.toFixed(2)}</span>
              </div>
              {currentMonth.performanceBonus > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-700 font-medium">
                      Bonus por Desempenho ({currentMonth.bonusPercentage}%):
                    </span>
                    <span className="font-semibold text-emerald-900">
                      +R$ {currentMonth.performanceBonus.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-green-200 pt-2 flex justify-between">
                    <span className="font-bold text-green-900">Total do Mês:</span>
                    <span className="font-bold text-lg text-green-600">
                      R$ {currentMonth.finalAmount.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Próximas Metas */}
            <div className="bg-amber-50/50 rounded-lg p-3 border border-amber-200/50">
              <div className="flex items-start gap-2">
                <Target className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-amber-900">Próximas Metas:</p>
                  <p className="text-amber-800">
                    {currentMonth.consultations < 15
                      ? `${15 - currentMonth.consultations} consultas para +5% bonus`
                      : currentMonth.consultations < 30
                        ? `${30 - currentMonth.consultations} consultas para +10% bonus`
                        : currentMonth.consultations < 50
                          ? `${50 - currentMonth.consultations} consultas para +15% bonus`
                          : "🎉 Máximo bonus atingido!"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Total Acumulado */}
        {totalAccumulated > 0 && (
          <div className="bg-white/60 rounded-lg p-4 border border-green-100/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-green-900">Total Acumulado (12 meses)</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-700 font-medium">Participação</p>
                <p className="text-2xl font-bold text-green-600">R$ {totalAccumulated.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Histórico Recente */}
        {previousMonths.length > 0 && (
          <div className="mt-6 pt-6 border-t border-green-200/50">
            <p className="text-xs font-bold uppercase tracking-wide text-green-900 mb-3">Histórico Recente</p>
            <div className="space-y-2">
              {previousMonths.slice(0, 3).map((month, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm bg-white/30 rounded-lg p-2 px-3">
                  <div>
                    <span className="font-medium text-green-900 capitalize">{month.month}</span>
                    <span className="text-xs text-green-700 ml-2">({month.consultations} consultas)</span>
                  </div>
                  <span className="font-semibold text-green-900">R$ {month.finalAmount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export default PerformanceBonusWidget;
