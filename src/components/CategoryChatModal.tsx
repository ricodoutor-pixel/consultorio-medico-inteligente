import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type ChatCategory =
  | "paciente"
  | "medico"
  | "lojista"
  | "afiliado"
  | "investidor"
  | "imprensa"
  | "geral";

const CATEGORY_LABEL: Record<ChatCategory, string> = {
  paciente: "Paciente",
  medico: "Médico(a)",
  lojista: "Lojista / Farmácia",
  afiliado: "Afiliado",
  investidor: "Investidor",
  imprensa: "Imprensa",
  geral: "Atendimento Geral",
};

const CATEGORY_GREETING: Record<ChatCategory, string> = {
  paciente:
    "Sou a Enf. Brisa da Planta y Raiz. Posso te explicar como funciona a Orientação Técnica em cannabis medicinal (R$30 via WhatsApp) e o próximo passo do seu tratamento. Como posso te ajudar?",
  medico:
    "Sou a Enf. Brisa da Planta y Raiz. Que bom te receber, Dr(a). Posso te explicar o cadastro de médico prescritor, o split de pagamentos (93/7) e a prescrição digital ANVISA. Por onde começamos?",
  lojista:
    "Sou a Enf. Brisa da Planta y Raiz. Posso te apresentar nossa parceria de marketplace verificado ANVISA (comissão 5–15%) e o processo de onboarding da sua loja. Qual sua categoria de produtos?",
  afiliado:
    "Sou a Enf. Brisa da Planta y Raiz. Vou te explicar o programa de afiliados 3 gerações (25/15/10%) e Planta-Coins. Me conta um pouco sobre seu público?",
  investidor:
    "Sou a Enf. Brisa da Planta y Raiz. Posso te compartilhar dados institucionais e agendar uma call com a diretoria. Qual seu foco: tese, tração ou roadmap?",
  imprensa:
    "Sou a Enf. Brisa da Planta y Raiz. Posso te enviar press kit institucional, dados de mercado e agendar entrevista com porta-voz. Qual seu veículo?",
  geral:
    "Sou a Enf. Brisa da Planta y Raiz. Me conta: você é paciente, médico, lojista, afiliado, investidor ou imprensa? Assim eu te direciono certinho.",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  open: boolean;
  category: ChatCategory;
  onClose: () => void;
}

function getUTM() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    source: p.get("utm_source") || undefined,
    medium: p.get("utm_medium") || undefined,
    campaign: p.get("utm_campaign") || undefined,
  };
}

export function CategoryChatModal({ open, category, onClose }: Props) {
  const [step, setStep] = useState<"form" | "chat">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactId, setContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    // reuse if already captured this session
    const cachedPhone = localStorage.getItem("pr_lead_phone");
    const cachedName = localStorage.getItem("pr_lead_name");
    const cachedContactId = localStorage.getItem("pr_lead_contact_id");
    if (cachedPhone && cachedName) {
      setName(cachedName);
      setPhone(cachedPhone);
      if (cachedContactId) setContactId(cachedContactId);
      setStep("chat");
      setMessages([{ role: "assistant", content: CATEGORY_GREETING[category] }]);
    } else {
      setStep("form");
      setMessages([]);
      setContactId(null);
    }
  }, [open, category]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  if (!open) return null;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanName.length < 2) return setError("Informe seu nome");
    if (cleanPhone.length < 10) return setError("Informe um WhatsApp válido com DDD");
    localStorage.setItem("pr_lead_name", cleanName);
    localStorage.setItem("pr_lead_phone", cleanPhone);
    setError(null);
    setStep("chat");
    setMessages([{ role: "assistant", content: CATEGORY_GREETING[category] }]);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("category-chat", {
        body: {
          contactId,
          name,
          phone: phone.replace(/\D/g, ""),
          category,
          message: text,
          utm: getUTM(),
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        },
      });
      if (fnErr) throw fnErr;
      if (data?.contactId && !contactId) {
        setContactId(data.contactId);
        localStorage.setItem("pr_lead_contact_id", data.contactId);
      }
      const reply = data?.reply || "(sem resposta)";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Tivemos uma instabilidade momentânea. Fale com o time humano no WhatsApp +55 11 99136-3154 que a gente te atende agora.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-t-2xl sm:rounded-2xl w-full max-w-md h-[85vh] sm:h-[600px] flex flex-col overflow-hidden shadow-2xl">
        <header className="flex items-center justify-between px-4 py-3 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-900/40 to-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Leaf size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Enf. Brisa · Planta y Raiz</p>
              <p className="text-[10px] text-emerald-400">{CATEGORY_LABEL[category]}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-white/70 hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        {step === "form" ? (
          <form onSubmit={handleStart} className="flex-1 flex flex-col gap-3 p-5 justify-center">
            <p className="text-sm text-white/80 leading-relaxed">
              Sou a Enf. Brisa. Antes de conversarmos, me diga como te chamo e seu WhatsApp — se a
              gente cair, eu te retorno.
            </p>
            <label className="text-xs text-white/60">Seu nome</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500"
            />
            <label className="text-xs text-white/60">WhatsApp com DDD</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              inputMode="tel"
              className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              className="mt-2 w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold text-sm transition"
            >
              Falar com a Enf. Brisa
            </button>
            <p className="text-[10px] text-white/40 leading-relaxed pt-1">
              Ao continuar, você concorda com nossa Política de Privacidade. A Planta y Raiz é nome
              fantasia da Bezerra Med Soluções Integradas Ltda. (CNPJ 30.740.319/0001-14) —
              plataforma de intermediação digital sob supervisão técnica da Dra. Suelen Rodrigues
              (CRM 49354/PR).
            </p>
          </form>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-emerald-500 text-slate-900 rounded-br-sm"
                        : "bg-slate-800 text-white/90 rounded-bl-sm border border-slate-700/50"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-bl-sm px-3 py-2 flex items-center gap-2 text-white/60 text-xs">
                    <Loader2 size={12} className="animate-spin" /> Brisa está digitando…
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 p-3 flex items-end gap-2 bg-slate-900">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Escreva sua mensagem…"
                className="flex-1 px-3 py-2.5 rounded-full bg-slate-800 border border-slate-700 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                aria-label="Enviar"
                className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 flex items-center justify-center text-slate-900"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CategoryChatModal;
