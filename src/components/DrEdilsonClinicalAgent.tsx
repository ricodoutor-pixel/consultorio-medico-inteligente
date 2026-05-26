// 🩺 Dr. Edilson Bezerra — Agente de Apoio Clínico (chat flutuante no Dashboard Médico)
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, X, Send, Sparkles, BookOpen, AlertTriangle, FlaskConical, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  { icon: AlertTriangle, label: "Interação CBD + clobazam (CYP2C19)" },
  { icon: FlaskConical, label: "Exames basais antes de iniciar CBD/THC" },
  { icon: BookOpen, label: "Evidência para CBD em epilepsia refratária" },
  { icon: Sparkles, label: "Titulação CBD:THC 20:1 em dor crônica" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dr-edilson-clinical-support`;

export function DrEdilsonClinicalAgent({ patientContext }: { patientContext?: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const contextPrefix = patientContext && messages.length === 0
      ? `[Contexto do paciente em atendimento]: ${patientContext}\n\n[Pergunta]: `
      : "";

    const userMsg: Msg = { role: "user", content: contextPrefix + trimmed };
    const newMessages = [...messages, userMsg];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    abortRef.current = new AbortController();
    let assistantText = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
        signal: abortRef.current.signal,
      });

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
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
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
                copy[copy.length - 1] = { role: "assistant", content: assistantText };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setMessages((prev) => {
          const copy = [...prev];
          if (copy[copy.length - 1]?.role === "assistant" && !copy[copy.length - 1].content) {
            copy[copy.length - 1] = { role: "assistant", content: "⚠️ Erro ao consultar Dr. Edilson. Tente novamente." };
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
        className={`fixed bottom-4 right-4 z-40 group flex items-center gap-2 px-4 py-3 rounded-2xl
          bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30
          border border-primary/40 backdrop-blur-md hover:shadow-primary/50 transition-all
          ${open ? "hidden" : ""}`}
        aria-label="Pergunte ao Dr. Edilson Bezerra"
      >
        <div className="relative">
          <Stethoscope className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-[10px] uppercase tracking-wider opacity-80">Apoio clínico IA</span>
          <span className="text-sm font-semibold">Pergunte ao Dr. Edilson</span>
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
            className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[min(640px,calc(100vh-2rem))]"
          >
            <Card className="flex flex-col h-full bg-card/95 backdrop-blur-xl border-primary/30 shadow-2xl shadow-primary/20 overflow-hidden">
              {/* Header */}
              <header className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                      <Stethoscope className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-card animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold leading-tight">Dr. Edilson Bezerra</h3>
                    <p className="text-[11px] text-muted-foreground leading-tight flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      Apoio clínico • 40k+ estudos
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
                      <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground leading-relaxed">
                        Pergunte sobre <strong className="text-foreground">interações medicamentosas</strong>, mapeamento <strong className="text-foreground">CYP450</strong>, protocolos de exames, evidência científica ou conduta clínica embasada em ANVISA/CFM.
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s.label}
                            onClick={() => send(s.label)}
                            className="flex items-center gap-2 text-left p-2.5 rounded-lg bg-card/60 hover:bg-primary/10 border border-border/40 hover:border-primary/40 text-xs transition-all"
                          >
                            <s.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{s.label}</span>
                          </button>
                        ))}
                      </div>
                      {patientContext && (
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                          📋 Contexto do paciente ativo será incluído
                        </Badge>
                      )}
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted/60 border border-border/40 rounded-bl-sm"
                      }`}>
                        {m.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none
                            prose-headings:text-foreground prose-headings:font-semibold prose-headings:my-2
                            prose-p:my-1.5 prose-p:leading-relaxed
                            prose-strong:text-primary prose-strong:font-semibold
                            prose-ul:my-1.5 prose-li:my-0.5
                            prose-code:bg-background/50 prose-code:px-1 prose-code:rounded">
                            {m.content || (loading && i === messages.length - 1 ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span className="text-xs">Dr. Edilson está raciocinando...</span>
                              </div>
                            ) : null)}
                            {m.content && <ReactMarkdown>{m.content}</ReactMarkdown>}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        )}
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
                    placeholder="Ex: paciente em uso de warfarina, posso iniciar CBD 200mg/dia?"
                    rows={2}
                    className="resize-none min-h-[44px] max-h-32 text-sm bg-card/60 border-border/40"
                    disabled={loading}
                  />
                  <Button
                    size="icon"
                    onClick={() => send(input)}
                    disabled={loading || !input.trim()}
                    className="shrink-0 h-11 w-11"
                    aria-label="Enviar"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                  Apoio à decisão clínica • A decisão final é sempre do médico assistente
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default DrEdilsonClinicalAgent;
