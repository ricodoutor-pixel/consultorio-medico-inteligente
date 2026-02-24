import { useState, useRef, useEffect } from "react";
import { X, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const aiResponses: { [key: string]: string } = {
  agendamento:
    'Para agendar uma consulta, clique em "Ver Profissionais" na página inicial. Você passará por uma pré-entrevista com IA que leva cerca de 5 minutos.',
  prescrição:
    "Nossas prescrições digitais são certificadas ICP-Brasil e conformes com a ANVISA. Você recebe um código de validação para usar na farmácia.",
  medicamentos:
    "Após sua consulta, você pode comprar medicamentos diretamente em nosso marketplace integrado com pagamento via PIX ou cartão.",
  profissionais:
    "Temos 500+ profissionais verificados especializados em cannabis medicinal. Você pode filtrar por especialidade, idioma e preço.",
  segurança:
    "Operamos com conformidade LGPD, ANVISA, CFM e ICP-Brasil. Todos os dados são criptografados e sua privacidade é garantida.",
  preço:
    "Consultas a partir de R$ 55. Temos planos populares com descontos e frete grátis no Shopping para todo o Brasil.",
  pix:
    "Aceitamos pagamento via PIX com QR Code ou código copia e cola. A confirmação é instantânea e automática via Mercado Pago.",
  indicação:
    "Nosso sistema de Indicação Premiada paga 10% de comissão automática! Gere seu código único, compartilhe e ganhe por cada indicação.",
  biblioteca:
    "A Biblioteca Científica contém 100 variedades de cannabis com detalhes completos: efeitos, THC/CBD, benefícios, origem e avaliações.",
  shopping:
    "No Shopping você encontra óleos, cápsulas, chás, pomadas e vitaminas de farmácias autorizadas ANVISA com frete grátis para todo o Brasil.",
  default:
    "Ótima pergunta! 🤔 Você pode explorar nossos serviços de telemedicina, marketplace e prescrições digitais. Qual desses temas te interessa?",
};

export const FrogChatModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Olá! 🐸 Sou o Sapo Verde, assistente de IA da Planta & Raiz. Como posso ajudar você hoje?",
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

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    }, 800);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform glow-green"
        aria-label="Abrir chat com IA"
      >
        <span className="text-2xl">🐸</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[70vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐸</span>
          <div>
            <p className="font-display font-black text-sm text-foreground">Sapo Verde</p>
            <p className="text-[10px] text-muted-foreground font-semibold">Assistente de IA • Online</p>
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
          placeholder="Digite sua pergunta..."
          className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        />
        <Button size="icon" onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className="rounded-xl bg-primary text-primary-foreground h-9 w-9">
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};
