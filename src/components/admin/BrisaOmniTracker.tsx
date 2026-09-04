import { useEffect, useState } from "react";
import { MessageSquare, PhoneCall } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const CHANNELS: { key: string; label: string; color: string; bg: string }[] = [
  { key: "whatsapp", label: "WhatsApp", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  { key: "instagram_dm", label: "Instagram DM", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30" },
  { key: "messenger", label: "Messenger", color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/30" },
  { key: "ig_comment", label: "Comentários IG", color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30" },
  { key: "fb_comment", label: "Comentários FB", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
];

export const BrisaOmniTracker = () => {
  const [totalHoje, setTotalHoje] = useState(0);
  const [totalAcumulado, setTotalAcumulado] = useState(0);
  const [contatos, setContatos] = useState(0);
  const [takeovers, setTakeovers] = useState(0);
  const [porCanal, setPorCanal] = useState<Record<string, { hoje: number; total: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const iso = startOfDay.toISOString();

      const countConv = (filters?: { channel?: string; today?: boolean }) => {
        let q = supabase
          .from("brisa_unified_conversations")
          .select("id", { count: "exact", head: true })
          .eq("direction", "inbound");
        if (filters?.channel) q = q.eq("channel", filters.channel);
        if (filters?.today) q = q.gte("created_at", iso);
        return q;
      };

      const [all, today, contactsRes, takeoverRes, ...perChannel] = await Promise.all([
        countConv(),
        countConv({ today: true }),
        supabase.from("brisa_unified_contacts").select("id", { count: "exact", head: true }),
        supabase.from("brisa_human_takeover").select("id", { count: "exact", head: true }),
        ...CHANNELS.flatMap((c) => [countConv({ channel: c.key }), countConv({ channel: c.key, today: true })]),
      ]);

      if (!alive) return;

      setTotalAcumulado(all.count || 0);
      setTotalHoje(today.count || 0);
      setContatos(contactsRes.count || 0);
      setTakeovers(takeoverRes.count || 0);

      const map: Record<string, { hoje: number; total: number }> = {};
      CHANNELS.forEach((c, i) => {
        map[c.key] = {
          total: perChannel[i * 2]?.count || 0,
          hoje: perChannel[i * 2 + 1]?.count || 0,
        };
      });
      setPorCanal(map);
      setLoading(false);
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <Card className="border-border bg-card/40 backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-sm md:text-base text-foreground flex items-center gap-2">
                Atendimentos Enfª Brisa & WhatsApp 24/7
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                  {loading ? "Carregando..." : "Dados reais"}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">Mensagens recebidas registradas no histórico omnichannel</p>
            </div>
          </div>

          <a
            href="https://wa.me/5511991363154"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20"
          >
            <PhoneCall size={12} />
            WhatsApp da Brisa
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Mensagens Hoje</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{totalHoje}</p>
            <span className="text-[10px] text-muted-foreground font-medium">Desde 00:00</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Acumulado</span>
            <p className="text-2xl font-black text-foreground mt-0.5">{totalAcumulado}</p>
            <span className="text-[10px] text-muted-foreground font-medium">Histórico completo</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Contatos Únicos</span>
            <p className="text-2xl font-black text-sky-400 mt-0.5">{contatos}</p>
            <span className="text-[10px] text-sky-400/80 font-medium">Base omnichannel</span>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Transbordos Humanos</span>
            <p className="text-2xl font-black text-amber-400 mt-0.5">{takeovers}</p>
            <span className="text-[10px] text-amber-400/80 font-medium">Atendimento manual</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {CHANNELS.map((c) => (
            <div key={c.key} className="p-3 rounded-xl border border-border bg-card/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-bold ${c.color}`}>{c.label}</span>
                <Badge variant="outline" className={`text-[9px] font-bold ${c.bg} ${c.color}`}>
                  Hoje: {porCanal[c.key]?.hoje ?? 0}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                <span className="font-semibold text-foreground">{porCanal[c.key]?.total ?? 0}</span> acumuladas
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
