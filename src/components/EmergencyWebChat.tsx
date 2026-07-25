import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, User, Phone, Tag, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type Message = { id: string; role: "assistant" | "user" | "system"; content: string; timestamp: Date };

export function EmergencyWebChat() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"triage" | "chat">("triage");
  const [loading, setLoading] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);

  // Triage Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("Dúvida Geral");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Olá! Sou a Enfª Brisa 🌿. Vi que você acionou o chat de suporte. Como posso ajudar agora?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, open, step]);

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error("Por favor, preencha nome e WhatsApp.");
      return;
    }

    setLoading(true);
    try {
      // Save lead to emergency_leads
      const { data, error } = await supabase.from("emergency_leads").insert([
        { name, phone, category }
      ]).select().single();

      if (error) {
        console.error("Erro ao salvar lead:", error);
        toast.error("Erro ao iniciar chat.");
        return;
      }

      if (data) {
        setLeadId(data.id);
        setStep("chat");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const currentMessages = [...messages, userMsg];
      
      const { data, error } = await supabase.functions.invoke("brisa-web-chat", {
        body: {
          messages: currentMessages.filter(m => m.role !== 'system'),
          leadInfo: { name, phone, category }
        }
      });

      if (error) throw error;

      if (data?.text) {
        const assistantMsg: Message = { id: Date.now().toString() + "a", role: "assistant", content: data.text, timestamp: new Date() };
        setMessages((prev) => [...prev, assistantMsg]);
        
        // Atualizar histórico no banco (opcional, se quisermos manter registro completo do chat)
        if (leadId) {
          await supabase.from("emergency_leads").update({
            chat_history: [...currentMessages, assistantMsg]
          }).eq("id", leadId);
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "e", role: "system", content: "⚠️ Tivemos uma instabilidade na resposta. Nossa equipe foi notificada.", timestamp: new Date() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[#22C55E] text-white shadow-sm hover:bg-[#16a34a] hover:scale-105 transition-all text-xs w-max"
            aria-label="Atendimento de Emergência"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="font-bold">Suporte Brisa</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-[max(env(safe-area-inset-bottom,0px),1rem)] right-4 z-[100] w-[calc(100vw-32px)] sm:w-[400px] bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col h-[500px] max-h-[85vh]"
          >
            {/* Header */}
            <div className="bg-[#22C55E] p-4 flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm">
                  <ShieldAlert className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm leading-tight">Enfª Brisa 🌿</h3>
                  <p className="text-white/80 text-[11px]">Canal de Suporte Autônomo</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-white hover:bg-black/20 transition-colors"
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-muted/20 relative">
              {step === "triage" ? (
                <div className="p-6">
                  <div className="mb-6">
                    <p className="text-sm text-foreground font-medium mb-1">Bem-vindo(a) ao Suporte,</p>
                    <p className="text-xs text-muted-foreground">Por favor, informe seus dados para iniciarmos o atendimento com a Brisa.</p>
                  </div>
                  <form onSubmit={handleTriageSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><User size={14}/> Nome completo</label>
                      <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Seu nome" className="h-10 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Phone size={14}/> WhatsApp</label>
                      <Input value={phone} onChange={e => setPhone(e.target.value)} required type="tel" placeholder="(11) 99999-9999" className="h-10 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"><Tag size={14}/> Motivo do contato</label>
                      <select 
                        value={category} 
                        onChange={e => setCategory(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option>Dúvida Geral</option>
                        <option>Agendamento</option>
                        <option>Problemas Técnicos</option>
                        <option>Urgência Médica</option>
                      </select>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full h-10 mt-2 bg-[#22C55E] hover:bg-[#16a34a] text-white">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar Atendimento"}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : m.role === "system" ? "justify-center" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                        m.role === "user" ? "bg-[#22C55E] text-white rounded-br-none" : 
                        m.role === "system" ? "bg-amber-500/10 text-amber-600 text-[11px] border border-amber-500/20" :
                        "bg-card border border-border text-foreground rounded-bl-none"
                      }`}>
                        {m.role === "system" ? (
                          m.content
                        ) : (
                          <div className={`prose prose-sm max-w-none ${m.role === "user" ? "prose-invert" : "prose-p:leading-snug"}`}>
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        )}
                        <span className={`block text-[9px] mt-1.5 text-right ${m.role === "user" ? "text-white/70" : "text-muted-foreground"}`}>
                          {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-card border border-border rounded-2xl rounded-bl-none p-3 px-4 flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            {step === "chat" && (
              <form onSubmit={handleSendMessage} className="p-3 bg-card border-t border-border shrink-0 flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  disabled={loading}
                  className="flex-1 rounded-full bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-[#22C55E]"
                />
                <Button 
                  type="submit" 
                  disabled={!input.trim() || loading}
                  size="icon"
                  className="rounded-full bg-[#22C55E] hover:bg-[#16a34a] text-white shrink-0"
                >
                  <Send className="h-4 w-4 ml-0.5" />
                </Button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default EmergencyWebChat;
