import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FrogMascot } from "@/components/FrogMascot";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const aiResponses: { [key: string]: string } = {
  agendamento: 'Para agendar uma consulta, clique em "Telemedicina" no menu. Você passará por uma pré-entrevista com IA de 7 perguntas e escolherá seu especialista.',
  prescrição: "Nossas prescrições digitais são certificadas ICP-Brasil e conformes com a ANVISA. Você recebe um código de validação para usar na farmácia.",
  medicamentos: "Após sua consulta, compre medicamentos no nosso Shopping com farmácias autorizadas ANVISA. Pagamento via PIX e frete grátis para todo o Brasil.",
  profissionais: "Temos 500+ profissionais verificados: médicos prescritores, farmacêuticos, terapeutas e psicólogos. Filtre por especialidade, idioma e preço.",
  segurança: "Operamos com conformidade LGPD, ANVISA, CFM e ICP-Brasil. Criptografia TLS 1.3, 2FA e todos os dados protegidos.",
  preço: "Consultas a partir de R$ 55. Planos populares com descontos exclusivos. Shopping com preços acessíveis e frete grátis.",
  pix: "Aceitamos PIX via Mercado Pago: QR Code ou copia e cola. Confirmação instantânea e automática por webhook.",
  indicação: "Sistema de Indicação Premiada: ganhe 10% de comissão automática! Gere seu código único, compartilhe e receba via PIX.",
  biblioteca: "Nossa Biblioteca Científica tem 100+ variedades catalogadas com efeitos, THC/CBD, benefícios, origem e avaliações de usuários.",
  shopping: "Shopping com farmácias e produtores autorizados ANVISA. Óleos, cápsulas, chás, pomadas. Frete grátis para todo o Brasil.",
  download: "Nosso app está disponível para iOS e Android! Acesse /download para baixar. 125K+ downloads, nota 4.9★.",
  como: "É simples: 1) Escolha um especialista, 2) Faça a pré-entrevista IA, 3) Pague via PIX, 4) Receba atendimento por chat/vídeo.",
  default: "Olá! 🐸 Posso ajudar com consultas, biblioteca de variedades, shopping, indicações e muito mais. O que deseja saber?",
};

export const FrogChatModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Olá! 🐸 Sou o Verdinho, assistente IA da Planta & Raiz. Pergunte sobre consultas, shopping, biblioteca ou qualquer dúvida!",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for external open events
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-frog-chat", handler);
    return () => window.removeEventListener("open-frog-chat", handler);
  }, []);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    setTimeout(() => {
      const lower = inputValue.toLowerCase();
      let aiResponse = aiResponses.default;

      if (lower.includes("agend") || lower.includes("consult")) aiResponse = aiResponses.agendamento;
      else if (lower.includes("prescr") || lower.includes("receit")) aiResponse = aiResponses.prescrição;
      else if (lower.includes("medicam") || lower.includes("remed")) aiResponse = aiResponses.medicamentos;
      else if (lower.includes("profissional") || lower.includes("médic") || lower.includes("doutor")) aiResponse = aiResponses.profissionais;
      else if (lower.includes("segur") || lower.includes("privac") || lower.includes("lgpd")) aiResponse = aiResponses.segurança;
      else if (lower.includes("preç") || lower.includes("valor") || lower.includes("custo")) aiResponse = aiResponses.preço;
      else if (lower.includes("pix") || lower.includes("pagam")) aiResponse = aiResponses.pix;
      else if (lower.includes("indica") || lower.includes("comiss")) aiResponse = aiResponses.indicação;
      else if (lower.includes("biblio") || lower.includes("cepa") || lower.includes("varied")) aiResponse = aiResponses.biblioteca;
      else if (lower.includes("shop") || lower.includes("compra") || lower.includes("produto")) aiResponse = aiResponses.shopping;
      else if (lower.includes("download") || lower.includes("app") || lower.includes("celular")) aiResponse = aiResponses.download;
      else if (lower.includes("como") || lower.includes("funciona") || lower.includes("passo")) aiResponse = aiResponses.como;

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: aiResponse, sender: "ai", timestamp: new Date() },
      ]);
      setIsLoading(false);
    }, 800);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[70vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/10">
        <div className="flex items-center gap-2">
          <FrogMascot size={28} />
          <div>
            <p className="font-display font-black text-sm text-foreground">Verdinho</p>
            <p className="text-[10px] text-muted-foreground font-semibold">Assistente IA • Online 24/7</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                message.sender === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              <p>{message.text}</p>
              <p className={`text-[10px] mt-1 ${message.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md text-sm text-muted-foreground">
              <span className="animate-pulse">Digitando...</span>
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
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Pergunte ao Verdinho..."
          className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        />
        <Button size="icon" onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className="rounded-xl bg-primary text-primary-foreground h-9 w-9">
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};
