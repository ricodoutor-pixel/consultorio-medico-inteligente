import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Users, TrendingUp, DollarSign, Heart, RefreshCw, MessageSquare, Calendar, Link2, Zap, Globe, Share2, BarChart3, UserCheck, ShoppingCart, UserX, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BrisaReport {
  period: { start: string; end: string };
  leads: { total: number; source: string };
  conversations: { total: number; intents: Record<string, number>; scheduling_intents: number };
  conversion: { rate: string; conversations: number; appointments: number };
  payments: { total_transactions: number; total_revenue: number; currency: string };
  sentiment: { positive: number; negative: number; neutral: number; overall: string };
  generated_at: string;
  generated_by: string;
}

interface MarketingMetrics {
  social_media: { posts_published: number; platforms: string[]; social_leads: number };
  organic_traffic: { total_leads: number; brisa_assisted: number; recovery_campaigns: number };
  affiliates: { total_commissions_paid: number; total_commissions_pending: number; commission_count: number };
}

interface RetentionMetrics {
  retention: { total_patients: number; returning_patients: number; retention_rate: string };
  rebuys: { followups_sent: number };
  churn: { inactive_120d: number; total_contacts: number; churn_rate: string };
  crisis: { negative_this_week: number; total_this_week: number; is_crisis: boolean };
}

interface AffiliateConversion {
  affiliate_code: string;
  leads_count: number;
  brisa_assisted: number;
}

export const BrisaReportsModule = () => {
  const [report, setReport] = useState<BrisaReport | null>(null);
  const [marketing, setMarketing] = useState<MarketingMetrics | null>(null);
  const [retention, setRetention] = useState<RetentionMetrics | null>(null);
  const [affiliateConversions, setAffiliateConversions] = useState<AffiliateConversion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const [reportRes, marketingRes, retentionRes, leadsRes] = await Promise.all([
        supabase.functions.invoke("brisa-reports"),
        supabase.functions.invoke("brisa-social-manager", { body: { action: "marketing_metrics" } }),
        supabase.functions.invoke("brisa-retention", { body: { action: "retention_metrics" } }),
        supabase.from("leads_contatos").select("tags").not("tags", "is", null),
      ]);

      if (reportRes.error) throw reportRes.error;
      setReport(reportRes.data);
      if (!marketingRes.error) setMarketing(marketingRes.data);
      if (!retentionRes.error) setRetention(retentionRes.data);

      if (leadsRes.data) {
        const affiliateMap = new Map<string, { leads: number; assisted: number }>();
        for (const lead of leadsRes.data) {
          const tags: string[] = lead.tags || [];
          const affTag = tags.find((t: string) => t.startsWith("affiliate:"));
          if (affTag) {
            const code = affTag.replace("affiliate:", "");
            const current = affiliateMap.get(code) || { leads: 0, assisted: 0 };
            current.leads++;
            if (tags.includes("brisa_assisted")) current.assisted++;
            affiliateMap.set(code, current);
          }
        }
        setAffiliateConversions(
          Array.from(affiliateMap.entries()).map(([code, data]) => ({
            affiliate_code: code, leads_count: data.leads, brisa_assisted: data.assisted,
          })).sort((a, b) => b.leads_count - a.leads_count)
        );
      }

      toast.success("Relatório gerado pela Brisa COO");
    } catch (err) {
      console.error("Report error:", err);
      toast.error("Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) => (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-xl font-bold text-slate-100">{value}</p>
      {sub && <p className="text-[10px] text-slate-500 mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Relatórios da Brisa COO</h3>
            <p className="text-[10px] text-slate-500">Operacional + Marketing + Retenção</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReport} disabled={loading} className="text-xs border-slate-700 text-slate-300">
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {report ? (
        <>
          {/* Core Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Leads Captados" value={report.leads.total} sub="Semana atual" color="bg-blue-600/80" />
            <StatCard icon={MessageSquare} label="Conversas WhatsApp" value={report.conversations.total} sub={`${report.conversations.scheduling_intents} agendamentos`} color="bg-emerald-600/80" />
            <StatCard icon={TrendingUp} label="Taxa de Conversão" value={report.conversion.rate} sub={`${report.conversion.appointments} consultas`} color="bg-purple-600/80" />
            <StatCard icon={DollarSign} label="Receita Processada" value={`R$ ${report.payments.total_revenue.toLocaleString("pt-BR")}`} sub={`${report.payments.total_transactions} transações`} color="bg-amber-600/80" />
          </div>

          {/* Marketing Metrics */}
          {marketing && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={Share2} label="Posts Publicados" value={marketing.social_media.posts_published} sub={marketing.social_media.platforms.join(", ")} color="bg-pink-600/80" />
              <StatCard icon={Globe} label="Leads Orgânicos" value={marketing.organic_traffic.total_leads} sub={`${marketing.organic_traffic.brisa_assisted} assistidos`} color="bg-cyan-600/80" />
              <StatCard icon={Zap} label="Recuperações" value={marketing.organic_traffic.recovery_campaigns} sub="Campanhas ativas" color="bg-orange-600/80" />
              <StatCard icon={BarChart3} label="Comissões Pagas" value={`R$ ${(marketing.affiliates.total_commissions_paid / 100).toFixed(2)}`} sub={`R$ ${(marketing.affiliates.total_commissions_pending / 100).toFixed(2)} pendente`} color="bg-indigo-600/80" />
            </div>
          )}

          {/* Retention Metrics */}
          {retention && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={UserCheck} label="Taxa de Retenção" value={retention.retention.retention_rate} sub={`${retention.retention.returning_patients} de ${retention.retention.total_patients} voltaram`} color="bg-teal-600/80" />
                <StatCard icon={ShoppingCart} label="Follow-ups Enviados" value={retention.rebuys.followups_sent} sub="Recompra assistida" color="bg-lime-600/80" />
                <StatCard icon={UserX} label="Churn Rate" value={retention.churn.churn_rate} sub={`${retention.churn.inactive_120d} inativos 120d+`} color="bg-red-600/80" />
                <StatCard
                  icon={AlertTriangle}
                  label="Alerta de Crise"
                  value={retention.crisis.is_crisis ? "⚠️ ATIVO" : "✅ Normal"}
                  sub={`${retention.crisis.negative_this_week}/${retention.crisis.total_this_week} negativos`}
                  color={retention.crisis.is_crisis ? "bg-red-600" : "bg-emerald-600/80"}
                />
              </div>
            </>
          )}

          {/* Sentiment */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-medium text-slate-200">Sentimento do Paciente</span>
              <span className="text-xs text-slate-400 ml-auto">{report.sentiment.overall}</span>
            </div>
            <div className="flex gap-3">
              {[
                { label: "Positivo 😊", value: report.sentiment.positive, color: "bg-emerald-500" },
                { label: "Neutro 😐", value: report.sentiment.neutral, color: "bg-slate-500" },
                { label: "Negativo 😟", value: report.sentiment.negative, color: "bg-red-500" },
              ].map(s => (
                <div key={s.label} className="flex-1 text-center">
                  <div className={`h-2 rounded-full ${s.color} mb-1`} style={{ width: `${Math.max(10, (s.value / Math.max(1, report.sentiment.positive + report.sentiment.neutral + report.sentiment.negative)) * 100)}%` }} />
                  <p className="text-lg font-bold text-slate-100">{s.value}</p>
                  <p className="text-[10px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Intent breakdown */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-slate-200">Intenções Detectadas</span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {Object.entries(report.conversations.intents).sort((a, b) => b[1] - a[1]).map(([intent, count]) => (
                <div key={intent} className="bg-slate-700/30 rounded px-2 py-1.5 text-center">
                  <p className="text-xs font-bold text-slate-200">{count}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{intent}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Affiliate Conversions */}
          {affiliateConversions.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-slate-200">Vendas Assistidas pela Brisa</span>
              </div>
              <div className="space-y-2">
                {affiliateConversions.slice(0, 10).map((aff) => (
                  <div key={aff.affiliate_code} className="flex items-center justify-between bg-slate-700/30 rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="text-xs font-mono text-slate-300">{aff.affiliate_code}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-slate-400">{aff.leads_count} leads</span>
                      <span className="text-emerald-400 font-semibold">{aff.brisa_assisted} convertidos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-slate-600 text-right">
            Gerado em {new Date(report.generated_at).toLocaleString("pt-BR")} por {report.generated_by}
          </p>
        </>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
};
