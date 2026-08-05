import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, X, Send, Lock, AlertTriangle, Loader2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { supabase as _supabase } from "@/integrations/supabase/client";
const supabase: any = _supabase;

type Message = { id: string; role: "doctor" | "assistant"; content: string; timestamp: Date };

interface Dra. SuelenExclusiveChatProps {
  appointmentId?: string;
  patientName?: string;
  patientContext?: string;
}

const QUICK_QUESTIONS = [
  "Qual é o protocolo recomendado para este paciente?",
  "Há interações medicamentosas a considerar?",
  "Quais exames basais são necessários?",
  "Qual é a dosagem inicial recomendada?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dr-edilson-clinical-support`;

export function Dra. SuelenExclusiveChat({
  appointmentId,
  patientName,
  patientContext,
}: Dra. SuelenExclusiveChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (open && appointmentId) {
      loadChatHistory();
    }
  }, [open, appointmentId]);

  const loadChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("dr_edilson_support_chat")
        .select("*")
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data) {
        setMessages(
          data.map((item) => ({
            id: item.id,
            role: item.role as "doctor" | "assistant",
            content: item.message,
            timestamp: new Date(item.created_at),
          }))
        );
      }
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    }
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const contextPrefix = patientContext && messages.length === 0
      ? `[Contexto do Paciente em Atendimento]\
${patientContext}\
\
[Pergunta do Médico]\
`
      : "";

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "doctor",
      content: contextPrefix + trimmed,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMsg];
    setMessages([...newMessages, { id: (Date.now() + 1).toString(), role: "assistant", content: "", timestamp: new Date() }]);
    setInput("");
    setLoading(true);

    abortRef.current = new AbortController();
    let assistantText = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Faça login como médico para usar o suporte.");
        throw new Error("no-session");
      }

      // Salvar mensagem do médico no banco
      if (appointmentId) {
        await supabase.from("dr_edilson_support_chat").insert({
          appointment_id: appointmentId,
          message: trimmed,
          role: "doctor",
          message_type: "text",
        });
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: newMessages }),
        signal: abortRef.current.signal,
      });

      if (resp.status === 401) { toast.error("Sessão expirada. Faça login novamente."); throw new Error("401"); }
      if (resp.status === 403) { toast.error("Acesso restrito a médicos cadastrados."); throw new Error("403"); }
      if (resp.status === 429) { toast.error("Limite de uso. Tente em instantes."); throw new Error("429"); }
      if (resp.status === 402) { toast.error("Créditos de IA esgotados."); throw new Error("402"); }
      if (!resp.ok || !resp.body) throw new Error("stream error");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\
")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { ...copy[copy.length - 1], content: assistantText };
                return copy;
              });
            }
          } catch {
            buf = line + "\
" + buf;
            break;
          }
        }
      }

      // Salvar resposta do assistente
      if (appointmentId && assistantText) {
        await supabase.from("dr_edilson_support_chat").insert({
          appointment_id: appointmentId,
          message: assistantText,
          role: "assistant",
          message_type: "clinical_note",
        });
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setMessages((prev) => {
          const copy = [...prev];
          if (copy[copy.length - 1]?.role === "assistant" && !copy[copy.length - 1].content) {
            copy[copy.length - 1] = {
              ...copy[copy.length - 1],
              content: "⚠️ Erro ao consultar Dra. Suelen. Tente novamente.",
            };
          }
          return copy;
        });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className={`fixed bottom-4 right-24 z-40 group flex items-center gap-2 px-4 py-3 rounded-2xl
          bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/30
          border border-emerald-500/40 backdrop-blur-md hover:shadow-emerald-600/50 transition-all
          ${open ? "hidden" : ""}`}
        aria-label="Suporte Exclusivo - Dra. Suelen"
      >
        <div className="relative">
          <Lock className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-yellow-300 animate-pulse" />
        </div>
        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-[10px] uppercase tracking-wider opacity-90">Suporte Exclusivo</span>
          <span className="text-sm font-semibold">Dra. Suelen On</span>
        </div>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-4 right-24 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[min(640px,calc(100vh-2rem))]"
          >
            <Card className="flex flex-col h-full bg-card/95 backdrop-blur-xl border-emerald-300/30 shadow-2xl shadow-emerald-600/20 overflow-hidden">
              {/* Header */}
              <header className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-gradient-to-r from-emerald-600/10 to-transparent">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-600/30">
                      <Lock className="h-5 w-5 text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-yellow-400 border-2 border-card animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold leading-tight">Dra. Suelen Naves Rodrigues</h3>
                    <p className="text-[11px] text-muted-foreground leading-tight flex items-center gap-1">
                      <Stethoscope className="h-2.5 w-2.5" />
                      Suporte Exclusivo • Paciente: {patientName || "Não selecionado"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setOpen(false)} aria-label="Fechar">
                  <X className="h-4 w-4" />
                </Button>
              </header>

              {/* Messages */}
              <ScrollArea className="flex-1">
                <div ref={scrollRef} className="p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="space-y-3">
                      <Card className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/50">
                        <div className="flex items-start gap-2 mb-2">
                          <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-emerald-900">Suporte Exclusivo para Consultas</p>
                            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                              Faça perguntas sobre <strong>protocolos clínicos</strong>, <strong>dosagens</strong>, <strong>interações medicamentosas</strong> ou <strong>evidência científica</strong> para o paciente em atendimento.
                            </p>
                          </div>
                        </div>
                      </Card>

                      {patientContext && (
                        <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-700 bg-emerald-50">
                          📋 Contexto do paciente ativo
                        </Badge>
                      )}

                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">Perguntas Rápidas:</p>
                        {QUICK_QUESTIONS.map((q) => (
                          <button
                            key={q}
                            onClick={() => send(q)}
                            className="w-full flex items-start gap-2 text-left p-2.5 rounded-lg bg-card/60 hover:bg-emerald-50 border border-border/40 hover:border-emerald-300 text-xs transition-all"
                          >
                            <Stethoscope className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{q}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "doctor" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm ${
                          m.role === "doctor"
                            ? "bg-emerald-600 text-white rounded-br-sm"
                            : "bg-muted/60 border border-border/40 rounded-bl-sm"
                        }`}
                      >
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none prose-headings:text-foreground prose-headings:font-semibold prose-headings:my-2 prose-p:my-1.5 prose-p:leading-relaxed prose-strong:text-emerald-400 prose-strong:font-semibold prose-ul:my-1.5 prose-li:my-0.5 prose-code:bg-background/50 prose-code:px-1 prose-code:rounded">
                            {m.content || (loading && i === messages.length - 1 ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span className="text-xs">Dra. Suelen está analisando...</span>
                              </div>
                            ) : null)}
                            {m.content && <ReactMarkdown>{m.content}</ReactMarkdown>}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        )}
                        <p className={`text-[10px] mt-1 flex items-center gap-1 ${
                          m.role === "doctor" ? "text-emerald-200" : "text-muted-foreground"
                        }`}>
                          <Clock className="h-2.5 w-2.5" />
                          {m.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t border-border/40 p-3 bg-background/40">
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send(input);
                      }
                    }}
                    placeholder="Descreva a situação do paciente..."
                    rows={2}
                    className="resize-none min-h-[44px] max-h-32 text-sm bg-card/60 border-border/40"
                    disabled={loading}
                  />
                  <Button
                    size="icon"
                    onClick={() => send(input)}
                    disabled={loading || !input.trim()}
                    className="shrink-0 h-11 w-11 bg-emerald-600 hover:bg-emerald-700"
                    aria-label="Enviar"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 text-center flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Suporte à decisão clínica • Decisão final é sempre do médico
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Dra. SuelenExclusiveChat;
