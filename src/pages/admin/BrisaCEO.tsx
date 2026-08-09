import { useState } from "react";
import { MessageCircle, Instagram, Facebook, Phone, AlertTriangle, UserCheck, Clock, TrendingUp, Filter } from "lucide-react";
import {
  useBrisaConversations,
  useBrisaConversationHistory,
  takeOverConversation,
  releaseTakeover,
  type UnifiedContact,
  type Channel,
  type LeadClass,
} from "@/hooks/useBrisaConversations";
import { toast } from "sonner";
import BrisaHealthChecklist from "@/components/admin/BrisaHealthChecklist";
import BrisaMetaDebugPanel from "@/components/admin/BrisaMetaDebugPanel";
import AutoPostCountdown from "@/components/admin/AutoPostCountdown";
import BrisaChannelsStatus from "@/components/admin/BrisaChannelsStatus";
import BrisaAudioPanel from "@/components/admin/BrisaAudioPanel";
import MetaContentManager from "@/components/admin/MetaContentManager";
import BrisaTestSendPanel from "@/components/admin/BrisaTestSendPanel";




const CHANNEL_META: Record<Channel, { label: string; Icon: any; color: string }> = {
  whatsapp: { label: "WhatsApp", Icon: Phone, color: "text-green-400" },
  instagram_dm: { label: "Instagram DM", Icon: Instagram, color: "text-pink-400" },
  messenger: { label: "Messenger", Icon: Facebook, color: "text-blue-400" },
  fb_comment: { label: "FB Comentário", Icon: Facebook, color: "text-blue-300" },
  ig_comment: { label: "IG Comentário", Icon: Instagram, color: "text-pink-300" },
};

const CLASS_META: Record<LeadClass, { label: string; color: string }> = {
  patient: { label: "Paciente", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  professional: { label: "Profissional", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  b2b: { label: "B2B", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  influencer: { label: "Influencer", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
  unknown: { label: "Indefinido", color: "bg-muted text-muted-foreground border-border" },
};

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}m atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export default function BrisaCEO() {
  const [channelFilter, setChannelFilter] = useState<Channel | "all">("all");
  const [classFilter, setClassFilter] = useState<LeadClass | "all">("all");
  const [selected, setSelected] = useState<UnifiedContact | null>(null);

  const { contacts, metrics, loading, error } = useBrisaConversations({
    channel: channelFilter,
    classification: classFilter,
  });

  const { messages } = useBrisaConversationHistory(selected?.id ?? null);

  const handleTakeover = async () => {
    if (!selected) return;
    try {
      await takeOverConversation(selected.id, 30, "CEO takeover via painel");
      toast.success("Bot silenciado 30min. Você assumiu a conversa.");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao assumir");
    }
  };

  const handleRelease = async () => {
    if (!selected) return;
    try {
      await releaseTakeover(selected.id);
      toast.success("Brisa retomou a conversa.");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao liberar");
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-card/40 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageCircle className="text-primary" /> Brisa CEO · Omnichannel 360°
            </h1>
            <p className="text-sm text-muted-foreground">Conversas unificadas dos 4 canais — atualiza a cada 15s</p>
          </div>
        </div>
      </header>

      {/* Countdown auto-post + Checklist */}
      <div className="container mx-auto px-4 pt-4 space-y-3">
        <BrisaTestSendPanel />
        <AutoPostCountdown />
        <BrisaChannelsStatus />
        <BrisaAudioPanel />
        <BrisaHealthChecklist />
        <BrisaMetaDebugPanel />
        <MetaContentManager />
      </div>




      {/* Métricas */}
      <section className="container mx-auto px-4 pb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard label="Ativas 24h" value={metrics.active24h} Icon={MessageCircle} />
        <MetricCard label="Leads R$30" value={metrics.leadsR30} Icon={TrendingUp} accent="text-emerald-400" />
        <MetricCard label="Profissionais" value={metrics.leadsProfessional} Icon={UserCheck} accent="text-blue-400" />
        <MetricCard label="B2B" value={metrics.leadsB2B} Icon={UserCheck} accent="text-purple-400" />
        <MetricCard label="Conversão" value={`${metrics.conversionRate24h}%`} Icon={TrendingUp} accent="text-yellow-400" />
      </section>

      {/* Filtros */}
      <section className="container mx-auto px-4 pb-3 flex flex-wrap gap-2 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value as any)}
          className="bg-card border border-border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="all">Todos canais</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="instagram_dm">Instagram DM</option>
          <option value="messenger">Messenger</option>
          <option value="ig_comment">IG Comentário</option>
          <option value="fb_comment">FB Comentário</option>
        </select>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value as any)}
          className="bg-card border border-border rounded-md px-3 py-1.5 text-sm"
        >
          <option value="all">Todas classificações</option>
          <option value="patient">Pacientes</option>
          <option value="professional">Profissionais</option>
          <option value="b2b">B2B</option>
          <option value="influencer">Influencers</option>
          <option value="unknown">Indefinidos</option>
        </select>
      </section>

      {/* Layout 2 colunas */}
      <main className="container mx-auto px-4 pb-12 grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4">
        {/* Lista */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-3 border-b border-border text-sm font-medium">
            Conversas ({contacts.length})
          </div>
          <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
            {loading && <div className="p-6 text-center text-muted-foreground">Carregando…</div>}
            {error && <div className="p-6 text-center text-destructive">{error}</div>}
            {!loading && contacts.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">Nenhuma conversa ainda.</div>
            )}
            {contacts.map((c) => {
              const meta = c.last_channel ? CHANNEL_META[c.last_channel] : null;
              const cls = CLASS_META[c.lead_classification];
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left p-3 hover:bg-muted/30 transition flex items-start gap-3 ${
                    selected?.id === c.id ? "bg-muted/50" : ""
                  }`}
                >
                  {meta && <meta.Icon className={`w-5 h-5 mt-0.5 ${meta.color}`} />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {c.display_name || c.instagram_username || c.phone_e164 || "Contato"}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime(c.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded border ${cls.color}`}>{cls.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.total_messages} msg · {c.funnel_stage}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer/detalhe */}
        <div className="bg-card border border-border rounded-lg flex flex-col max-h-[80vh]">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
              Selecione uma conversa para ver o histórico cross-channel
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-border">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {selected.display_name || selected.instagram_username || "Contato"}
                    </h2>
                    <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                      {selected.phone_e164 && <div>📱 {selected.phone_e164}</div>}
                      {selected.instagram_username && <div>📷 @{selected.instagram_username}</div>}
                      {selected.facebook_psid && <div>💬 PSID {selected.facebook_psid.slice(0, 12)}…</div>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleTakeover}
                      className="text-xs px-3 py-1.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 transition flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Assumir 30min
                    </button>
                    <button
                      onClick={handleRelease}
                      className="text-xs px-3 py-1.5 rounded bg-muted text-muted-foreground hover:bg-muted/70 transition flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" /> Liberar bot
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">Sem mensagens registradas.</div>
                )}
                {messages.map((m) => {
                  const meta = CHANNEL_META[m.channel];
                  const isInbound = m.direction === "inbound";
                  return (
                    <div key={m.id} className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 text-sm ${
                          isInbound
                            ? "bg-muted text-foreground"
                            : "bg-primary/20 text-foreground border border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs opacity-70 mb-1">
                          <meta.Icon className={`w-3 h-3 ${meta.color}`} />
                          <span>{meta.label}</span>
                          {m.intent && <span>· {m.intent}</span>}
                          <span>· {relativeTime(m.created_at)}</span>
                        </div>
                        <div className="whitespace-pre-wrap break-words">{m.content || "(sem texto)"}</div>
                        {m.audio_transcript && (
                          <div className="mt-2 text-xs italic opacity-70 border-t border-current/20 pt-2">
                            🎤 {m.audio_transcript}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function MetricCard({ label, value, Icon, accent }: { label: string; value: number | string; Icon: any; accent?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${accent ?? "text-muted-foreground"}`} />
      </div>
      <div className={`text-2xl font-bold mt-1 ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
