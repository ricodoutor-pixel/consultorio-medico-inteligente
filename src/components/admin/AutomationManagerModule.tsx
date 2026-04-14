import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Zap, MousePointerClick, TrendingUp, MessageCircle, Globe, Filter, Wifi, WifiOff, AlertTriangle } from "lucide-react";

const ITEM_HEIGHT = 52;
const VISIBLE_COUNT = 12;

const CATEGORY_MAP: Record<string, { label: string; icon: any; color: string }> = {
  attraction: { label: "Atração", icon: Zap, color: "text-amber-400" },
  conversion: { label: "Conversão", icon: MousePointerClick, color: "text-emerald-400" },
  retention: { label: "Retenção", icon: TrendingUp, color: "text-blue-400" },
  support: { label: "Suporte", icon: MessageCircle, color: "text-purple-400" },
};

const PLATFORM_ICONS: Record<string, string> = {
  manychat: "💬",
  instagram: "📷",
  facebook: "f",
  website: "🌐",
};

export function AutomationManagerModule() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: automations, isLoading } = useQuery({
    queryKey: ["automation-flows-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("automation_flows")
        .select("*")
        .order("ctr", { ascending: false });
      return data || [];
    },
    refetchInterval: 30000,
  });

  const filtered = (automations || []).filter((a: any) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || a.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const categoryCounts = (automations || []).reduce((acc: Record<string, number>, a: any) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});

  const statusCounts = (automations || []).reduce((acc: Record<string, number>, a: any) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  // Virtual scrolling
  const totalHeight = filtered.length * ITEM_HEIGHT;
  const startIdx = Math.floor(scrollTop / ITEM_HEIGHT);
  const endIdx = Math.min(startIdx + VISIBLE_COUNT + 2, filtered.length);
  const visibleItems = filtered.slice(startIdx, endIdx);
  const offsetY = startIdx * ITEM_HEIGHT;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] h-4"><Wifi className="w-2.5 h-2.5 mr-0.5" />Ativo</Badge>;
      case "paused": return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] h-4">Pausado</Badge>;
      case "error": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px] h-4"><AlertTriangle className="w-2.5 h-2.5 mr-0.5" />Erro</Badge>;
      default: return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30 text-[9px] h-4">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-slate-100">{automations?.length || 0}</p>
            <p className="text-[10px] text-slate-500 uppercase">Total</p>
          </CardContent>
        </Card>
        {Object.entries(CATEGORY_MAP).map(([key, { label, color }]) => (
          <Card
            key={key}
            className={`bg-slate-800/50 border-slate-700/50 cursor-pointer transition-colors ${categoryFilter === key ? "border-blue-500/50" : "hover:border-slate-600/50"}`}
            onClick={() => setCategoryFilter(categoryFilter === key ? null : key)}
          >
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{categoryCounts[key] || 0}</p>
              <p className="text-[10px] text-slate-500 uppercase">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <Input
            placeholder="Buscar entre as 100 automações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-slate-800/50 border-slate-700 text-slate-200 text-xs h-9 placeholder:text-slate-600"
          />
        </div>
        {categoryFilter && (
          <Button variant="ghost" size="sm" onClick={() => setCategoryFilter(null)} className="text-xs text-slate-400 h-9">
            <Filter className="w-3 h-3 mr-1" /> Limpar
          </Button>
        )}
      </div>

      {/* Virtual Scrolling List */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs text-slate-400">
              {filtered.length} automações {categoryFilter ? `(${CATEGORY_MAP[categoryFilter]?.label})` : ""} · {statusCounts.active || 0} ativas
            </CardTitle>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-3 py-1.5 border-b border-slate-700/30 text-[10px] text-slate-500 uppercase">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Nome</div>
            <div className="col-span-2">Categoria</div>
            <div className="col-span-1">Plat.</div>
            <div className="col-span-1">CTR</div>
            <div className="col-span-1">Clicks</div>
            <div className="col-span-2">Status</div>
          </div>
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="overflow-y-auto"
            style={{ height: Math.min(filtered.length, VISIBLE_COUNT) * ITEM_HEIGHT }}
          >
            <div style={{ height: totalHeight, position: "relative" }}>
              <div style={{ position: "absolute", top: offsetY, left: 0, right: 0 }}>
                {visibleItems.map((auto: any, idx: number) => {
                  const cat = CATEGORY_MAP[auto.category];
                  const CatIcon = cat?.icon || Globe;
                  return (
                    <div
                      key={auto.id}
                      className="grid grid-cols-12 gap-2 px-3 items-center border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors"
                      style={{ height: ITEM_HEIGHT }}
                    >
                      <div className="col-span-1 text-[10px] text-slate-600">{startIdx + idx + 1}</div>
                      <div className="col-span-4">
                        <p className="text-xs text-slate-200 truncate">{auto.name}</p>
                        <p className="text-[9px] text-slate-600 truncate">{auto.description}</p>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-1">
                          <CatIcon className={`w-3 h-3 ${cat?.color || "text-slate-400"}`} />
                          <span className="text-[10px] text-slate-400">{cat?.label || auto.category}</span>
                        </div>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="text-xs">{PLATFORM_ICONS[auto.platform] || "?"}</span>
                      </div>
                      <div className="col-span-1">
                        <span className="text-xs font-mono text-cyan-400">{Number(auto.ctr).toFixed(1)}%</span>
                      </div>
                      <div className="col-span-1">
                        <span className="text-[10px] text-slate-400">{auto.clicks?.toLocaleString()}</span>
                      </div>
                      <div className="col-span-2">
                        {getStatusBadge(auto.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
