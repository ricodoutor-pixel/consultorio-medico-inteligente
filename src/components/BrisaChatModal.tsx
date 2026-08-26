import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles, Trash2, Minimize2, Headset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import brisaAvatar from "@/assets/brisa-whatsapp-icon.jpg";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brisa-chat`;

async function streamChat({
  messages,
  leadName,
  category,
  onDelta,
  onDone,
  onError,
}: {
  messages: { role: "user" | "assistant"; content: string }[];
  leadName: string;
  category: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, leadName, category }),
    });

    if (!resp.ok) {
      const data = await resp.json().catch(() => ({ error: "Erro de conexão" }));
      onError(data.error || `Erro ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError("Sem resposta do servidor");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIdx).trim();
        buffer = buffer.slice(newlineIdx + 1);

        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") { onDone(); return; }

        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) onDelta(delta);
        } catch { /* partial JSON, skip */ }
      }
    }
    onDone();
    } catch (e) {
    onError(e instanceof Error ? e.message : "Erro de conexão");
  }
}

export const BrisaChatModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [categoryLabel, setCategoryLabel] = useState("");
  
  // 0: Ask Name, 1: Ask Email, 2: Ask Phone, 3: Ask Registered, 4: Free Chat
  const [onboardingStep, setOnboardingStep] = useState(0);
  
  const [leadData, setLeadData] = useState({ name: "", email: "", phone: "", registered: "" });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText, isOpen]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setCategory(detail.id);
      setCategoryLabel(detail.label);
      setIsOpen(true);
      
      // Reset state on open
      setOnboardingStep(0);
      setLeadData({ name: "", email: "", phone: "", registered: "" });
      setMessages([
        {
          id: "1",
          text: `Olá! Sou a **Enfª Brisa**, estou aqui para te ajudar! Primeiro eu preciso fazer umas perguntas para dar início ao seu atendimento como **${detail.label}**.\n\n1. Qual é o seu nome?`,
          sender: "ai",
          timestamp: new Date(),
        }
      ]);
    };
    window.addEventListener("open-brisa-chat", handler);
    return () => window.removeEventListener("open-brisa-chat", handler);
  }, []);

  const saveLeadToCRM = async (finalData: typeof leadData) => {
    try {
      await supabase.from("leads_contatos").insert({
        nome: finalData.name,
        email: finalData.email,
        telefone: finalData.phone,
        origem: "brisa_chat_onboarding",
        categoria: category,
        tags: [finalData.registered.toLowerCase().includes("sim") ? "ja_cadastrado" : "novo_cadastro"],
      });

      // Sync with Brevo
      supabase.functions.invoke('brevo-sync', {
        body: { nome: finalData.name, email: finalData.email, telefone: finalData.phone, categoria: category, origem: 'brisa_chat_onboarding' }
      }).catch(e => console.error('Brevo sync failed:', e));
    } catch (e) {
      console.warn("Failed to save lead:", e);
    }
  };

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isStreaming) return;
    const text = inputValue.trim();
    
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    
    const isHumanRequest = /humano|atendente|pessoa|falar com algu[eé]m/i.test(text);
    if (isHumanRequest && onboardingStep < 4) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: "Entendo. Se preferir falar diretamente com um agente humano da nossa equipe, basta clicar neste link: [💬 Falar com Agente Humano (WhatsApp)](https://wa.me/5511991363154)",
          sender: "ai",
          timestamp: new Date(),
        }]);
      }, 500);
      // Optional: keep them in the same step so they can still fill it out if they change their mind, or let them bypass. We'll just return.
      return;
    }

    // Onboarding flow
    if (onboardingStep === 0) {
      const firstName = text.split(' ')[0];
      setLeadData(prev => ({ ...prev, name: text }));
      setOnboardingStep(1);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: `Muito prazer, ${firstName}! 🌿 Agora, por favor, me informe o seu melhor endereço de e-mail:`,
          sender: "ai",
          timestamp: new Date(),
        }]);
      }, 500);
      return;
    }

    if (onboardingStep === 1) {
      setLeadData(prev => ({ ...prev, email: text }));
      setOnboardingStep(2);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: `Ótimo! Agora digite seu número de celular/WhatsApp (com DDD):`,
          sender: "ai",
          timestamp: new Date(),
        }]);
      }, 500);
      return;
    }

    if (onboardingStep === 2) {
      setLeadData(prev => ({ ...prev, phone: text }));
      setOnboardingStep(3);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: `Perfeito! Uma última perguntinha: você já tem cadastro em nossa plataforma? (Sim ou Não)`,
          sender: "ai",
          timestamp: new Date(),
        }]);
      }, 500);
      return;
    }

    if (onboardingStep === 3) {
      const finalData = { ...leadData, registered: text };
      setLeadData(finalData);
      setOnboardingStep(4);
      saveLeadToCRM(finalData); // Save to DB
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: `Ok, muito obrigada por suas respostas! 🌿\n\nAgora eu fico à disposição para esclarecer suas dúvidas sobre nossa plataforma. Lembrando que toda nossa conversa será encaminhada para revisão de um agente humano da nossa equipe, para garantir o melhor atendimento.\n\nFique à vontade para perguntar!`,
          sender: "ai",
          timestamp: new Date(),
        }]);
      }, 500);
      return;
    }

    // AI Free Chat phase
    setIsStreaming(true);
    setStreamingText("");

    const history = messages
      .filter((m) => m.id !== "1" && m.sender === "user") // Send only relevant history to save tokens
      .map((m) => ({
        role: "user" as "user" | "assistant",
        content: m.text,
      }));
    
    // Add current message
    history.push({ role: "user", content: text });

    let accumulated = "";

    streamChat({
      messages: history.slice(-6),
      leadName: leadData.name,
      category,
      onDelta: (delta) => {
        accumulated += delta;
        setStreamingText(accumulated);
      },
      onDone: () => {
        if (accumulated) {
          setMessages((prev) => [
            ...prev,
            { id: (Date.now() + 1).toString(), text: accumulated, sender: "ai", timestamp: new Date() },
          ]);
        }
        setStreamingText("");
        setIsStreaming(false);
      },
      onError: (err) => {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), text: "Tive um problema na conexão 🌿 Pode repetir?", sender: "ai", timestamp: new Date() },
        ]);
        setStreamingText("");
        setIsStreaming(false);
      },
    });
  }, [inputValue, isStreaming, onboardingStep, leadData, messages, category]);


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        role="dialog"
        aria-label="Chat com Enfª Brisa"
        aria-modal="true"
        className="fixed right-0 sm:right-6 z-[60] w-full sm:w-[380px] sm:max-w-[calc(100vw-2rem)] h-[min(65dvh,520px)] sm:h-[560px] sm:max-h-[75vh] rounded-t-2xl sm:rounded-2xl border-t sm:border border-border bg-card shadow-2xl flex flex-col overflow-hidden bottom-[calc(72px+env(safe-area-inset-bottom,0px))] sm:bottom-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 border-b border-border bg-gradient-to-r from-primary/20 via-emerald-500/10 to-transparent flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 flex-shrink-0">
              <img src={brisaAvatar} alt="Brisa" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground flex items-center gap-1 truncate">
                Enfª Brisa <Sparkles size={12} className="text-primary" />
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold truncate">
                {isStreaming ? "✍️ Digitando..." : `Atendimento: ${categoryLabel}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <a href="https://wa.me/5511991363154" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-500 transition-colors mr-1" title="Falar com Humano">
              <Headset size={14} />
            </a>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Minimizar chat">
              <Minimize2 size={14} />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors text-destructive font-bold" title="Fechar chat">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[85%]">
                <div
                  className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  {message.sender === "ai" ? (
                    <div className="text-sm max-w-none [&>p]:my-1 [&_a]:text-green-500 [&_a]:underline [&_a]:font-bold hover:[&_a]:text-green-400">
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  )}
                  <p className={`text-[10px] mt-1 text-right ${message.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Streaming message */}
          {streamingText && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="max-w-[85%]">
                <div className="bg-muted text-foreground rounded-2xl rounded-bl-md px-3 py-2 text-sm leading-relaxed">
                  <div className="text-sm max-w-none [&>p]:my-1 [&_a]:text-green-500 [&_a]:underline [&_a]:font-bold hover:[&_a]:text-green-400">
                    <ReactMarkdown>{streamingText}</ReactMarkdown>
                  </div>
                  <span className="animate-pulse text-primary">▊</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Typing indicator */}
          {isStreaming && !streamingText && (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border flex gap-2 bg-card">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder={onboardingStep < 4 ? "Responda a pergunta..." : "Digite sua dúvida..."}
            disabled={isStreaming}
            className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={isStreaming || !inputValue.trim()}
            className="rounded-xl bg-primary text-primary-foreground h-9 w-9 flex-shrink-0"
          >
            <Send size={16} />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
