import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles, Trash2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FrogMascot } from "@/components/FrogMascot";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

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

const fallbackResponses: Record<string, string> = {
  default: "Olá! 🐸 Estou com dificuldade para me conectar agora. Mas posso te ajudar! Acesse /telemedicina para consultas, /shopping para produtos, ou /profissionais para especialistas. 💚",
  oi: "Eae! 🐸👑 Sou o Verdinho! Estou com problemas técnicos, mas a plataforma funciona normalmente. Como posso ajudar? 💚",
  consulta: "Para agendar: acesse /telemedicina, faça a triagem IA, escolha seu especialista e pague via PIX! Tudo em 5 minutos. ✅",
  preco: "Consultas a partir de R$ 55 via PIX (Mercado Pago). Confira nossos planos em /planos! 💳",
};

const getFallback = (text: string): string => {
  const lower = text.toLowerCase();
  if (lower.match(/oi|olá|hey|eae/)) return fallbackResponses.oi;
  if (lower.match(/consult|agend|marc/)) return fallbackResponses.consulta;
  if (lower.match(/preç|valor|custo|pag/)) return fallbackResponses.preco;
  return fallbackResponses.default;
};

const QUICK_ACTIONS = [
  { label: "🩺 Agendar consulta", msg: "Como faço para agendar uma consulta?" },
  { label: "💊 Cannabis medicinal", msg: "O que é cannabis medicinal e quais condições trata?" },
  { label: "💰 Preços", msg: "Quais são os preços das consultas?" },
  { label: "📱 Como funciona?", msg: "Como funciona a plataforma Planta & Raiz?" },
];

export const FrogChatModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Olá! 🐸👑 Sou o **Verdinho**, assistente IA da **Planta & Raiz**!\n\nPosso te ajudar com:\n- 🩺 Consultas e agendamentos\n- 💊 Cannabis medicinal\n- 🛒 Shopping e produtos\n- 📋 Cadastro e plataforma\n- 🧠 Saúde e bem-estar\n\nPergunte qualquer coisa!",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [frogMood, setFrogMood] = useState<"happy" | "thinking" | "excited">("happy");
  const [showLeadGate, setShowLeadGate] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(() => {
    return localStorage.getItem("pr_lead_captured") === "true";
  });
  const [pendingMessage, setPendingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-frog-chat", handler);
    return () => window.removeEventListener("open-frog-chat", handler);
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text,
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
    history.push({ role: "user", content: text });

    let accumulated = "";

    streamChat({
      messages: history.slice(-12),
      onDelta: (delta) => {
        accumulated += delta;
        setStreamingText(accumulated);
        setFrogMood("excited");
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
        setFrogMood("happy");
      },
      onError: (err) => {
        console.error("Chat error:", err);
        const fallback = getFallback(text);
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), text: fallback, sender: "ai", timestamp: new Date() },
        ]);
        setStreamingText("");
        setIsStreaming(false);
        setFrogMood("happy");
      },
    });
  }, [isStreaming, messages]);

  const handleSendMessage = useCallback(() => {
    sendMessage(inputValue);
  }, [inputValue, sendMessage]);

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
        className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] sm:max-w-[calc(100vw-2rem)] h-[85dvh] sm:h-[560px] sm:max-h-[75vh] rounded-t-2xl sm:rounded-2xl border-t sm:border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-1.5 sm:px-4 sm:py-2 border-b border-border bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 pl-2">
            <div className="flex-shrink-0" style={{ marginLeft: '6px' }}>
              <FrogMascot size={32} mood={frogMood} compact />
            </div>
            <div className="min-w-0">
              <p className="font-display font-black text-sm text-foreground flex items-center gap-1 truncate">
                Verdinho <Sparkles size={12} className="text-primary flex-shrink-0" /> <span className="text-[10px] font-normal text-muted-foreground">IA</span>
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold truncate">
                {isStreaming ? "✍️ Digitando..." : "🟢 Online 24/7"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Limpar conversa" aria-label="Limpar conversa">
              <Trash2 size={14} />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Minimizar chat" aria-label="Minimizar chat">
              <Minimize2 size={14} />
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors text-destructive font-bold" title="Fechar chat" aria-label="Fechar chat">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-live="polite">
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
                    <div className="prose prose-sm prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>li]:my-0.5">
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  )}
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
                  <div className="prose prose-sm prose-invert max-w-none [&>p]:my-1">
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

          {/* Quick actions - only show at start */}
          {messages.length === 1 && !isStreaming && (
            <div className="flex flex-wrap gap-2 pt-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => sendMessage(action.msg)}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors font-semibold"
                >
                  {action.label}
                </button>
              ))}
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
            placeholder="Pergunte qualquer coisa ao Verdinho..."
            disabled={isStreaming}
            aria-label="Digite sua mensagem"
            className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={isStreaming || !inputValue.trim()}
            className="rounded-xl bg-primary text-primary-foreground h-9 w-9"
          >
            <Send size={16} />
            <span className="sr-only">Enviar</span>
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
