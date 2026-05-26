import { useEffect, useState } from "react";
import { Volume2, VolumeX, AlertTriangle, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Config = {
  audio_enabled: boolean;
  monthly_budget_brl: number;
  paused_reason: string | null;
};

export default function BrisaAudioPanel() {
  const [cfg, setCfg] = useState<Config | null>(null);
  const [spent, setSpent] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [{ data: c }, { data: u }] = await Promise.all([
      supabase.from("brisa_audio_config").select("audio_enabled, monthly_budget_brl, paused_reason").eq("id", true).single(),
      supabase.from("brisa_audio_usage").select("cost_brl, success").gte("created_at", monthStart.toISOString()),
    ]);
    if (c) setCfg(c as Config);
    if (u) {
      setSpent(u.reduce((s, r: any) => s + Number(r.cost_brl || 0), 0));
      setSentCount(u.filter((r: any) => r.success).length);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  const toggle = async () => {
    if (!cfg) return;
    setSaving(true);
    const next = !cfg.audio_enabled;
    const { error } = await supabase
      .from("brisa_audio_config")
      .update({
        audio_enabled: next,
        paused_reason: next ? null : "Pausado manualmente via dashboard",
        updated_at: new Date().toISOString(),
      })
      .eq("id", true);
    setSaving(false);
    if (error) toast.error("Falha: " + error.message);
    else {
      toast.success(next ? "🔊 Áudio ATIVADO" : "🔇 Áudio PAUSADO");
      load();
    }
  };

  const updateBudget = async () => {
    const v = prompt("Novo orçamento mensal (R$):", String(cfg?.monthly_budget_brl ?? 300));
    if (!v) return;
    const n = parseFloat(v);
    if (!Number.isFinite(n) || n <= 0) return toast.error("Valor inválido");
    const { error } = await supabase
      .from("brisa_audio_config")
      .update({ monthly_budget_brl: n, updated_at: new Date().toISOString() })
      .eq("id", true);
    if (error) toast.error(error.message);
    else { toast.success("Orçamento atualizado"); load(); }
  };

  if (loading) return null;

  const pct = cfg ? Math.min(100, (spent / Math.max(1, cfg.monthly_budget_brl)) * 100) : 0;
  const danger = pct >= 85;

  return (
    <div className="bg-card/60 backdrop-blur border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {cfg?.audio_enabled ? (
            <Volume2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-red-400" />
          )}
          <h3 className="font-bold">Brisa Áudio (Sarah) — Híbrido</h3>
        </div>
        <button
          onClick={toggle}
          disabled={saving}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
            cfg?.audio_enabled
              ? "bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25"
              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
          }`}
        >
          {cfg?.audio_enabled ? "🔇 Pausar áudio" : "🔊 Ativar áudio"}
        </button>
      </div>

      {cfg?.paused_reason && !cfg.audio_enabled && (
        <div className="flex items-start gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded p-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{cfg.paused_reason}</span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-2xl font-bold text-emerald-400">{sentCount}</div>
          <div className="text-[10px] uppercase text-muted-foreground">Áudios/mês</div>
        </div>
        <div>
          <div className="text-2xl font-bold">R$ {spent.toFixed(2)}</div>
          <div className="text-[10px] uppercase text-muted-foreground">Gasto</div>
        </div>
        <button onClick={updateBudget} className="hover:bg-muted/30 rounded p-1 transition">
          <div className="text-2xl font-bold flex items-center justify-center gap-1">
            <DollarSign className="w-4 h-4" />{cfg?.monthly_budget_brl?.toFixed(0)}
          </div>
          <div className="text-[10px] uppercase text-muted-foreground">Orçamento (clique p/ editar)</div>
        </button>
      </div>

      <div className="space-y-1">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${danger ? "bg-red-500" : pct > 60 ? "bg-amber-400" : "bg-emerald-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-right">{pct.toFixed(1)}% do orçamento</p>
      </div>
    </div>
  );
}
