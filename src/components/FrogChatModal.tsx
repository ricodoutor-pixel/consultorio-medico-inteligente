import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FrogMascot } from "@/components/FrogMascot";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verdinho-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: { role: "user" | "assistant"; content: string }[];
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
      body: JSON.stringify({ messages }),
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

// Fallback responses when AI is unavailable
const fallbackResponses: Record<string, string> = {
  default: "Olá! 🐸 Estou tendo dificuldade para me conectar ao meu cérebro IA agora. Mas posso te ajudar! Acesse /telemedicina para consultas, /shopping para produtos, ou /profissionais para encontrar especialistas. 💚",
  oi: "Eae! 🐸👑 Sou o Verdinho! Desculpa, estou com problemas técnicos, mas a plataforma funciona normalmente. Como posso ajudar? 💚",
  consulta: "Para agendar uma consulta: acesse /telemedicina, faça a triagem IA, escolha seu especialista e pague via PIX! Tudo em 5 minutos. ✅",
  preco: "Consultas a partir de R$ 55 via PIX (Mercado Pago). Confira nossos planos em /planos com descontos especiais! 💳",
};

const getFallback = (text: string): string => {
  const lower = text.toLowerCase();
  if (lower.match(/oi|olá|hey|eae/)) return fallbackResponses.oi;
  if (lower.match(/consult|agend|marc/)) return fallbackResponses.consulta;
  if (lower.match(/preç|valor|custo|pag/)) return fallbackResponses.preco;
  return fallbackResponses.default;
};

export const FrogChatModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Olá! 🐸👑 Sou o Verdinho, assistente IA da Planta & Raiz! Posso te ajudar com consultas médicas, dúvidas sobre cannabis medicinal, dicas de saúde, suporte da plataforma ou simplesmente bater um papo. Pergunte qualquer coisa!",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [frogMood, setFrogMood] = useState<"happy" | "thinking" | "excited">("happy");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-frog-chat", handler);
    return () => window.removeEventListener("open-frog-chat", handler);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isStreaming) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsStreaming(true);
    setStreamingText("");
    setFrogMood("thinking");

    const history = messages
      .filter((m) => m.id !== "1")
      .map((m) => ({
        role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      }));

    history.push({ role: "user", content: inputValue });

    let accumulated = "";

    streamChat({
      messages: history.slice(-10), // keep last 10 messages for context
      onDelta: (delta) => {
        accumulated += delta;
        setStreamingText(accumulated);
        setFrogMood("excited");
      },
      onDone: () => {
        if (accumulated) {
          setMessages((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              text: accumulated,
              sender: "ai",
              timestamp: new Date(),
            },
          ]);
        }
        setStreamingText("");
        setIsStreaming(false);
        setFrogMood("happy");
      },
      onError: (err) => {
        console.error("Chat error:", err);
        // Use fallback
        const fallback = getFallback(inputValue);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            text: fallback,
            sender: "ai",
            timestamp: new Date(),
          },
        ]);
        setStreamingText("");
        setIsStreaming(false);
        setFrogMood("happy");
      },
    });
  }, [inputValue, isStreaming, messages]);

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        text: "Chat limpo! 🐸 Como posso ajudar? 💚",
        sender: "ai",
        timestamp: new Date(),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        role="dialog"
        aria-label="Chat com Verdinho — Assistente IA"
        aria-modal="true"
        className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[70vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-2">
            <FrogMascot size={32} mood={frogMood} />
            <div>
              <p className="font-display font-black text-sm text-foreground flex items-center gap-1">
                Verdinho <Sparkles size={12} className="text-primary" />
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold">
                IA Premium • {isStreaming ? "Digitando..." : "Online 24/7"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Limpar conversa" aria-label="Limpar conversa">
              <Trash2 size={14} aria-hidden="true" />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" aria-label="Fechar chat">
              <X size={18} aria-hidden="true" />
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
                  <p className="whitespace-pre-wrap">{message.text}</p>
                  <p className={`text-[10px] mt-1 ${message.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
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
                  <p className="whitespace-pre-wrap">{streamingText}<span className="animate-pulse">▊</span></p>
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
        <div className="p-3 border-t border-border flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder="Pergunte ao Verdinho..."
            disabled={isStreaming}
            className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={isStreaming || !inputValue.trim()}
            className="rounded-xl bg-primary text-primary-foreground h-9 w-9"
          >
            <Send size={16} />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
