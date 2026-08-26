import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import brisaAvatar from "@/assets/brisa-whatsapp-icon.jpg";

export type BrisaCategoria = "paciente" | "medico" | "lojista" | "ebook" | "suporte";

interface BrisaChatModalProps {
  /** Controlado externamente (opcional). Sem props, o modal escuta o evento global `open-brisa-chat`. */
  open?: boolean;
  categoria?: BrisaCategoria;
  onClose?: () => void;
}


interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SAUDACAO: Record<BrisaCategoria, string> = {
  paciente:
    "Oi! Sou a Enfª Brisa 🌿 Antes de começarmos, me diz seu nome, e-mail e WhatsApp — assim consigo te acompanhar direitinho.",
  medico:
    "Olá, doutor(a)! Sou a Enfª Brisa 🌿 Me passa seu nome, e-mail e WhatsApp que eu te explico como funciona a prescrição na plataforma.",
  lojista:
    "Oi! Sou a Enfª Brisa 🌿 Me diz seu nome, e-mail e WhatsApp que eu te mostro como levar seus produtos para o nosso Shopping.",
  ebook:
    "Oi! Sou a Enfª Brisa 🌿 Deixa seu nome, e-mail e WhatsApp que eu te envio o e-book e o acesso à biblioteca.",
  suporte:
    "Oi! Sou a Enfª Brisa 🌿 Me diz seu nome, e-mail e WhatsApp e já te ajudo com o que precisar.",
};

const onlyDigits = (v: string) => v.replace(/\D/g, "");

export function BrisaChatModal({ open, categoria, onClose }: BrisaChatModalProps) {
  const [step, setStep] = useState<"onboarding" | "chat">("onboarding");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setErro(null);
    const savedName = localStorage.getItem("pr_lead_name") || "";
    const savedPhone = localStorage.getItem("pr_lead_phone") || "";
    const savedEmail = localStorage.getItem("pr_lead_email") || "";
    setNome(savedName);
    setTelefone(savedPhone);
    setEmail(savedEmail);
    const captured = savedName.length >= 2 && onlyDigits(savedPhone).length >= 10;
    setStep(captured ? "chat" : "onboarding");
    setMessages(captured ? [] : []);
  }, [open, categoria]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, step]);

  const callBrisa = async (payload: {
    message?: string;
    saveLead?: boolean;
    history: ChatMessage[];
  }) => {
    const { data, error } = await supabase.functions.invoke("brisa-chat", {
      body: {
        categoria,
        lead: { nome, email, telefone },
        messages: payload.history,
        message: payload.message ?? "",
        saveLead: !!payload.saveLead,
      },
    });
    if (error) throw error;
    return data as { reply: string | null; leadSaved?: boolean };
  };

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 2) return setErro("Me diz seu nome completo, por favor.");
    if (onlyDigits(telefone).length < 10) return setErro("Informe um WhatsApp válido com DDD.");
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return setErro("Esse e-mail parece inválido.");

    setErro(null);
    setLoading(true);
    try {
      localStorage.setItem("pr_lead_name", nome.trim());
      localStorage.setItem("pr_lead_phone", onlyDigits(telefone));
      if (email) localStorage.setItem("pr_lead_email", email.trim());

      const firstMessage = `Meu nome é ${nome.trim()}. Quero atendimento como ${categoria}.`;
      const res = await callBrisa({ message: firstMessage, saveLead: true, history: [] });
      setStep("chat");
      setMessages([
        { role: "user", content: firstMessage },
        {
          role: "assistant",
          content: res.reply ?? "Prontinho! Me conta em que posso te ajudar 🌿",
        },
      ]);
    } catch {
      setStep("chat");
      setMessages([
        {
          role: "assistant",
          content:
            "Registrei seus dados 🌿 Minha conexão oscilou um pouco, mas pode me contar o que você precisa.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const history = [...messages];
    setMessages([...history, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await callBrisa({ message: text, history });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply ?? "Deixa eu confirmar isso aqui e já te retorno 🌿",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Minha conexão oscilou agora. Pode repetir? Se preferir, seguimos no WhatsApp 🌿",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Chat com a Enfermeira Brisa"
    >
      <div
        className="w-full sm:max-w-md h-[100dvh] sm:h-[85vh] sm:rounded-2xl border border-border overflow-hidden flex flex-col shadow-2xl"
        style={{ background: "hsl(var(--card))" }}
      >
        <header
          className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(152 100% 74% / 0.15), hsl(152 100% 74% / 0.05))",
          }}
        >
          <img
            src={brisaAvatar}
            alt="Enfermeira Brisa"
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">Enfª Brisa</p>
            <p className="text-xs text-muted-foreground">
              Atendimento humanizado 24h · {categoria}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent/50 text-muted-foreground"
            aria-label="Fechar chat"
          >
            <X size={18} />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {step === "onboarding" ? (
            <>
              <div className="max-w-[85%] rounded-2xl px-3 py-2 bg-accent/40 text-sm text-foreground">
                {SAUDACAO[categoria]}
              </div>
              <form onSubmit={handleOnboarding} className="space-y-2 pt-2">
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
                />
                <input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="WhatsApp com DDD"
                  inputMode="tel"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
                />
                {erro && <p className="text-xs text-destructive">{erro}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl py-2.5 text-sm font-semibold text-background disabled:opacity-60"
                  style={{ background: "hsl(152 100% 74%)" }}
                >
                  {loading ? "Conectando com a Brisa..." : "Começar atendimento"}
                </button>
                <p className="text-[10px] text-muted-foreground text-center">
                  Seus dados são usados apenas para o atendimento (LGPD).
                </p>
              </form>
            </>
          ) : (
            <>
              {messages.length === 0 && (
                <div className="max-w-[85%] rounded-2xl px-3 py-2 bg-accent/40 text-sm text-foreground">
                  Oi{nome ? `, ${nome.split(" ")[0]}` : ""}! Sou a Enfª Brisa 🌿 Como posso te
                  ajudar hoje?
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "ml-auto text-background"
                      : "bg-accent/40 text-foreground"
                  }`}
                  style={m.role === "user" ? { background: "hsl(152 100% 74%)" } : undefined}
                >
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" /> Brisa está digitando...
                </div>
              )}
            </>
          )}
        </div>

        {step === "chat" && (
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 px-3 py-3 border-t border-border shrink-0"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreva sua mensagem..."
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl text-background disabled:opacity-50"
              style={{ background: "hsl(152 100% 74%)" }}
              aria-label="Enviar mensagem"
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default BrisaChatModal;
