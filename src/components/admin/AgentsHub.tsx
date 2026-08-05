import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Crown, TrendingUp, Shield, Heart, Stethoscope, Repeat, Megaphone,
  MessageCircle, Sprout, Sparkles, DollarSign, Scale, Bot, Send, Loader2, Play,
} from "lucide-react";

const ICONS: Record<string, any> = {
  Crown, TrendingUp, Shield, Heart, Stethoscope, Repeat, Megaphone,
  MessageCircle, Sprout, Sparkles, DollarSign, Scale, Bot,
};

interface Agent {
  id: string;
  slug: string;
  name: string;
  role: string;
  description: string;
  icon: string;
  color: string;
  edge_function: string | null;
  is_active: boolean;
  last_run_at: string | null;
}

interface Msg { role: "user" | "assistant"; content: string; }

export function AgentsHub() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatAgent, setChatAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("agent_registry")
        .select("*")
        .order("name");
      if (error) toast.error("Falha ao carregar agentes");
      else setAgents(data as Agent[]);
      setLoading(false);
    })();
  }, []);

  const openChat = (agent: Agent) => {
    setChatAgent(agent);
    setMessages([{
      role: "assistant",
      content: `Olá Dra. Suelen, sou ${agent.name} — ${agent.role}. Como posso melhorar a Planta y Raiz hoje? Sugiro pedir: "quais 3 melhorias urgentes na sua área?"`,
    }]);
  };

  const send = async () => {
    if (!input.trim() || !chatAgent) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-chat", {
        body: { slug: chatAgent.slug, messages: next },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setMessages([...next, { role: "assistant", content: (data as any).reply }]);
    } catch (e: any) {
      toast.error(e.message || "Falha no chat");
      setMessages(next);
    } finally {
      setSending(false);
    }
  };

  const runNow = async (agent: Agent) => {
    if (!agent.edge_function) {
      toast.info("Este agente não tem execução manual disponível");
      return;
    }
    setRunning(agent.slug);
    try {
      const { error } = await supabase.functions.invoke(agent.edge_function, {
        body: { triggered_by: "admin_manual" },
      });
      if (error) throw error;
      toast.success(`${agent.name} executado com sucesso`);
    } catch (e: any) {
      toast.error(`Falha: ${e.message}`);
    } finally {
      setRunning(null);
    }
  };

  const colorClass = (c: string) => {
    const map: Record<string, string> = {
      amber: "border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5",
      emerald: "border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5",
      rose: "border-rose-500/30 hover:border-rose-500/60 bg-rose-500/5",
      pink: "border-pink-500/30 hover:border-pink-500/60 bg-pink-500/5",
      lime: "border-lime-500/30 hover:border-lime-500/60 bg-lime-500/5",
      violet: "border-violet-500/30 hover:border-violet-500/60 bg-violet-500/5",
      green: "border-green-500/30 hover:border-green-500/60 bg-green-500/5",
      blue: "border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5",
    };
    return map[c] || "border-border";
  };

  const iconColor = (c: string) => {
    const map: Record<string, string> = {
      amber: "text-amber-400", emerald: "text-emerald-400", rose: "text-rose-400",
      pink: "text-pink-400", lime: "text-lime-400", violet: "text-violet-400",
      green: "text-green-400", blue: "text-blue-400",
    };
    return map[c] || "text-foreground";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-emerald-400" />
            Hub de Agentes IA — {agents.length} ativos 24x7
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Toque em qualquer agente para conversar ou executar manualmente
          </p>
        </div>
        <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2" />
          Sentinela 24x7 ATIVO
        </Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {agents.map((a) => {
            const Icon = ICONS[a.icon] || Bot;
            return (
              <Card key={a.id} className={`p-3 transition-all ${colorClass(a.color)}`}>
                <div className="flex items-start gap-2 mb-2">
                  <Icon className={`h-5 w-5 shrink-0 ${iconColor(a.color)}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{a.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{a.role}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">{a.description}</p>
                <div className="flex gap-1.5">
                  <Button
                    size="sm" variant="default"
                    className="flex-1 h-7 text-xs"
                    onClick={() => openChat(a)}
                  >
                    <MessageCircle className="h-3 w-3 mr-1" /> Chat
                  </Button>
                  {a.edge_function && (
                    <Button
                      size="sm" variant="outline" className="h-7 px-2"
                      disabled={running === a.slug}
                      onClick={() => runNow(a)}
                      title="Executar agora"
                    >
                      {running === a.slug
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Play className="h-3 w-3" />}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!chatAgent} onOpenChange={(o) => !o && setChatAgent(null)}>
        <DialogContent className="max-w-lg h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="flex items-center gap-2 text-base">
              {chatAgent && (() => {
                const Icon = ICONS[chatAgent.icon] || Bot;
                return <Icon className={`h-5 w-5 ${iconColor(chatAgent.color)}`} />;
              })()}
              {chatAgent?.name}
              <Badge variant="outline" className="ml-auto text-[10px]">{chatAgent?.role}</Badge>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>{m.content}</div>
                </div>
              ))}
              {sending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> {chatAgent?.name} pensando...
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-3 border-t flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !sending && send()}
              placeholder="Peça sugestões de melhoria..."
              disabled={sending}
            />
            <Button onClick={send} disabled={sending || !input.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
