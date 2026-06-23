import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Send, Wifi, WifiOff, Loader2, Search, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Msg = {
  id: string;
  remote_jid: string;
  sender_name: string | null;
  message_text: string | null;
  message_type: string;
  direction: "in" | "out";
  status: string;
  timestamp: string;
};

function phoneFromJid(jid: string) {
  return jid?.split("@")[0]?.replace(/\D/g, "") ?? jid;
}
function formatTime(ts: string) {
  try { return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function WhatsAppInbox() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState<string | null>(null);
  const [realtimeOk, setRealtimeOk] = useState(false);
  const [activeJid, setActiveJid] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial load + realtime
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(500);
      if (cancelled) return;
      if (error) {
        setConnError("Não foi possível carregar as mensagens. Verifique o status do banco de dados e da Evolution API.");
        setLoading(false);
        return;
      }
      const ordered = (data as Msg[]).slice().reverse();
      setMessages(ordered);
      setConnError(null);
      setLoading(false);
    })();

    const channel = supabase
      .channel("public:whatsapp_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "whatsapp_messages" },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => [...prev, m]);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") { setRealtimeOk(true); setConnError(null); }
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setRealtimeOk(false);
          setConnError("Conexão Realtime perdida. Verifique a Evolution API e a conexão com o banco.");
        }
      });

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  // Group by JID
  const conversations = useMemo(() => {
    const map = new Map<string, { jid: string; name: string; last: Msg; unread: number }>();
    for (const m of messages) {
      const prev = map.get(m.remote_jid);
      if (!prev || new Date(m.timestamp) > new Date(prev.last.timestamp)) {
        map.set(m.remote_jid, {
          jid: m.remote_jid,
          name: m.sender_name || phoneFromJid(m.remote_jid),
          last: m,
          unread: 0,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => +new Date(b.last.timestamp) - +new Date(a.last.timestamp),
    );
  }, [messages]);

  const filteredConvs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) => c.name.toLowerCase().includes(q) || c.jid.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const activeMessages = useMemo(
    () => messages.filter((m) => m.remote_jid === activeJid),
    [messages, activeJid],
  );

  useEffect(() => {
    if (!activeJid && conversations[0]) setActiveJid(conversations[0].jid);
  }, [conversations, activeJid]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length, activeJid]);

  async function handleSend() {
    if (!activeJid || !draft.trim() || sending) return;
    setSending(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        toast({ title: "Faça login como admin", variant: "destructive" });
        return;
      }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-send`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ remote_jid: activeJid, text: draft.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = body?.error || `HTTP ${res.status}`;
        toast({
          title: "Falha ao enviar",
          description: `${reason}. Verifique o status da Evolution API.`,
          variant: "destructive",
        });
        return;
      }
      setDraft("");
    } catch (e) {
      toast({
        title: "Erro de rede",
        description: "Não foi possível alcançar a Evolution API.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  const activeName = conversations.find((c) => c.jid === activeJid)?.name;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <Helmet><title>WhatsApp Inbox — Planta y Raiz</title></Helmet>

      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="text-primary" size={22} />
          <h1 className="text-lg font-display font-bold">WhatsApp Inbox</h1>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {realtimeOk ? (
            <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-400">
              <Wifi size={12} /> Realtime ativo
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-400">
              <WifiOff size={12} /> Reconectando…
            </Badge>
          )}
        </div>
      </header>

      {connError && (
        <Alert variant="destructive" className="m-3">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Conexão instável</AlertTitle>
          <AlertDescription>{connError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] h-[calc(100dvh-57px)]">
        {/* Sidebar */}
        <aside className="border-r border-border flex flex-col min-h-0">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input
                className="pl-7 h-9"
                placeholder="Buscar conversa…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-6 flex items-center justify-center text-muted-foreground">
                <Loader2 className="animate-spin mr-2" size={16} /> Carregando…
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                Nenhuma conversa ainda.
              </div>
            ) : (
              filteredConvs.map((c) => (
                <button
                  key={c.jid}
                  onClick={() => setActiveJid(c.jid)}
                  className={cn(
                    "w-full text-left px-3 py-3 border-b border-border/50 hover:bg-muted/40 transition",
                    activeJid === c.jid && "bg-muted/60",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold truncate">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatTime(c.last.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.last.direction === "out" ? "Você: " : ""}{c.last.message_text}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">{phoneFromJid(c.jid)}</p>
                </button>
              ))
            )}
          </ScrollArea>
        </aside>

        {/* Chat */}
        <section className="flex flex-col min-h-0">
          {!activeJid ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Selecione uma conversa
            </div>
          ) : (
            <>
              <div className="border-b border-border px-4 py-3">
                <div className="font-semibold">{activeName}</div>
                <div className="text-xs text-muted-foreground">{phoneFromJid(activeJid)}</div>
              </div>

              <ScrollArea className="flex-1 px-4 py-4">
                <div className="flex flex-col gap-2 max-w-3xl mx-auto">
                  {activeMessages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                        m.direction === "out"
                          ? "self-end bg-primary text-primary-foreground rounded-br-sm"
                          : "self-start bg-muted text-foreground rounded-bl-sm",
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">{m.message_text}</div>
                      <div className={cn(
                        "text-[10px] mt-1 opacity-70",
                        m.direction === "out" ? "text-right" : "text-left",
                      )}>
                        {formatTime(m.timestamp)} · {m.status}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>

              <div className="border-t border-border p-3 flex items-end gap-2">
                <Textarea
                  className="min-h-[44px] max-h-32 resize-none"
                  placeholder="Escreva sua resposta…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button onClick={handleSend} disabled={!draft.trim() || sending} className="h-11">
                  {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
