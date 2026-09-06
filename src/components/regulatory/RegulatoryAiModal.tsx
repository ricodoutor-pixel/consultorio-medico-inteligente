import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Scale,
  ShieldCheck,
  BookOpen,
  Send,
  Plane,
  FileText,
  HeartHandshake,
  Sprout,
  HelpCircle,
  Stethoscope,
  Sparkles,
  RotateCcw,
  Bot,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface RegulatoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const STORAGE_KEY = "regulatory_ai_history_v1";

export const STARTER_QUESTIONS = [
  {
    icon: FileText,
    label: "Como funciona a autorização da Anvisa para importar?",
    prompt: "Como funciona a autorização da Anvisa para importar?",
    badge: "RDC 660/2022"
  },
  {
    icon: Plane,
    label: "Posso viajar de avião pelo Brasil com meu medicamento?",
    prompt: "Posso viajar de avião pelo Brasil com meu medicamento?",
    badge: "Viagens Aéreas"
  },
  {
    icon: HeartHandshake,
    label: "O plano de saúde é obrigado a cobrir o tratamento?",
    prompt: "O plano de saúde é obrigado a cobrir o tratamento?",
    badge: "Direitos & STJ"
  },
  {
    icon: Sprout,
    label: "Quais laudos médicos são exigidos para Habeas Corpus de cultivo?",
    prompt: "Quais laudos médicos são exigidos para Habeas Corpus de cultivo?",
    badge: "Salvo-Conduto"
  }
];

const INITIAL_GREETING: RegulatoryMessage = {
  id: "greeting",
  role: "assistant",
  content: `Olá! Sou o seu **Guia Regulatório e Direitos do Paciente** da Planta y Raíz 🌿🏛️

Estou aqui para esclarecer dúvidas sobre a **legislação sanitária brasileira**, resoluções da Anvisa (**RDC 660/2022** e **RDC 327/2019**), regras de transporte em viagens, direitos em planos de saúde e requisitos para laudos médicos.

Escolha uma das perguntas frequentes abaixo ou digite sua dúvida:`,
  timestamp: new Date().toISOString(),
};

interface RegulatoryAiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuestion?: string;
}

export function RegulatoryAiModal({
  open,
  onOpenChange,
  initialQuestion,
}: RegulatoryAiModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<RegulatoryMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Error loading regulatory chat history:", e);
    }
    return [INITIAL_GREETING];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Salvar no sessionStorage sempre que mudar
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn("Error saving regulatory chat history:", e);
    }
  }, [messages]);

  // Rolar para o fim da conversa
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, open]);

  // Disparar pergunta inicial se passada como prop
  useEffect(() => {
    if (open && initialQuestion && initialQuestion.trim().length > 0) {
      handleSendMessage(initialQuestion.trim());
    }
  }, [open, initialQuestion]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || input).trim();
    if (!content || loading) return;

    const userMsg: RegulatoryMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      // 1. Invocar Edge Function
      const { data, error } = await supabase.functions.invoke("regulatory-assistant", {
        body: {
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      let replyText = "";
      if (!error && data?.reply) {
        replyText = data.reply;
      } else {
        // Fallback local se a Edge Function não responder
        replyText = getFallbackResponse(content);
      }

      const botMsg: RegulatoryMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: replyText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error("[Regulatory AI error]:", err);
      const fallbackReply = getFallbackResponse(content);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: fallbackReply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([INITIAL_GREETING]);
    sessionStorage.removeItem(STORAGE_KEY);
    toast({ title: "Histórico limpo", description: "A conversa foi reiniciada." });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] h-[85vh] max-h-[750px] p-0 flex flex-col bg-card/98 backdrop-blur-2xl border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden">
        {/* Cabeçalho do Guia */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border/60 bg-gradient-to-r from-emerald-950/40 via-background to-emerald-950/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <Scale size={20} />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-display font-black text-foreground flex items-center gap-2">
                  Guia Regulatório & Direitos do Paciente
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] font-bold">
                    IA Informativa
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Tira-Dúvidas sobre Anvisa (RDC 660/327), Viagens, Planos de Saúde e Laudos
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              title="Limpar histórico da conversa"
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 rounded-xl"
            >
              <RotateCcw size={14} className="mr-1" /> Reiniciar
            </Button>
          </div>
        </DialogHeader>

        {/* Área de Mensagens */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[10px] text-muted-foreground px-1">
                {msg.role === "user" ? (
                  <span>Você</span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <Scale size={11} /> Guia Regulatório Planta y Raíz
                  </span>
                )}
              </div>

              <div
                className={`max-w-[90%] sm:max-w-[85%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-950/20 font-medium"
                    : "bg-muted/40 text-foreground border border-border/60 rounded-bl-none prose prose-invert prose-xs"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="space-y-2">
                    <ReactMarkdown
                      components={{
                        h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-emerald-400 mt-1 mb-2" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-emerald-300" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />,
                        li: ({ node, ...props }) => <li className="text-muted-foreground" {...props} />,
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    {/* Botão de Ação para Teleconsulta quando sugerido pelo assistente */}
                    {msg.id !== "greeting" && (
                      <div className="pt-2 mt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Stethoscope size={13} className="text-emerald-400" />
                          Precisa de receita ou laudo circunstanciado?
                        </span>
                        <Button
                          size="sm"
                          className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-950/20 flex items-center gap-1.5"
                          onClick={() => {
                            onOpenChange(false);
                            navigate("/telemedicina");
                          }}
                        >
                          <Stethoscope size={13} /> Agendar Teleconsulta Médica
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2">
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 rounded-bl-none text-xs flex items-center gap-2 text-muted-foreground">
                <Sparkles size={14} className="text-emerald-400 animate-spin" />
                <span>Consultando normas da Anvisa e jurisprudência sanitária...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Botões de Perguntas Rápidas */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 border-t border-border/40 bg-muted/20">
            <p className="text-[11px] font-bold text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles size={12} className="text-emerald-400" /> Perguntas Rápidas:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STARTER_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  disabled={loading}
                  onClick={() => handleSendMessage(q.prompt)}
                  className="p-2 text-left rounded-xl bg-card border border-border/60 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all flex items-start gap-2 text-xs text-foreground group"
                >
                  <q.icon size={14} className="text-emerald-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold line-clamp-1">{q.label}</p>
                    <span className="text-[9px] text-muted-foreground font-mono">{q.badge}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input de Mensagem */}
        <div className="p-3 sm:p-4 border-t border-border/60 bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida sobre a Anvisa, viagens ou laudos..."
              className="h-10 text-xs rounded-xl bg-muted/40 border-border focus:ring-1 focus:ring-emerald-500"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shrink-0 shadow-md shadow-emerald-950/20"
            >
              <Send size={15} />
            </Button>
          </form>

          {/* Aviso Legal Fixo Obrigatório */}
          <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center mt-2.5 leading-tight text-balance">
            ⚠️ <strong>Aviso Legal</strong>: Assistente de caráter estritamente educativo e informativo sobre normas sanitárias públicas. Não substitui consulta jurídica individual com advogado habilitado nem consulta médica.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Botão Flutuante no Canto da Tela ──
export function RegulatoryAiFloatingButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 left-6 z-40">
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-950/90 text-white border border-emerald-500/40 shadow-xl shadow-emerald-950/40 backdrop-blur-xl hover:border-emerald-400 hover:bg-slate-900 transition-all cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
            <Scale size={14} className="group-hover:rotate-12 transition-transform" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold leading-tight flex items-center gap-1.5 text-foreground">
              Dúvidas sobre Anvisa & Leis?
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </p>
            <p className="text-[10px] text-emerald-400 font-medium">Fale com nosso Guia Regulatório</p>
          </div>
          <div className="sm:hidden text-xs font-bold text-emerald-400 flex items-center gap-1">
            Guia Anvisa
          </div>
        </motion.button>
      </div>

      <RegulatoryAiModal open={open} onOpenChange={setOpen} />
    </>
  );
}

// ── Card de Destaque na Página Inicial (Home Hero/Section) ──
export function RegulatoryHomeCard() {
  const [open, setOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>(undefined);

  const handleOpenPrompt = (promptText: string) => {
    setSelectedPrompt(promptText);
    setOpen(true);
  };

  return (
    <>
      <section className="py-12 bg-gradient-to-b from-card/30 via-background to-card/20 border-y border-border/40">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-card via-card/90 to-emerald-950/20 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <Scale size={14} /> Tira-Dúvidas Anvisa & Legislação Sanitária
                </div>

                <h2 className="text-2xl sm:text-3xl font-display font-black text-foreground tracking-tight">
                  Guia Regulatório e Direitos do Paciente
                </h2>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Entenda seus direitos perante a **Anvisa (RDC 660/2022 e RDC 327/2019)**, regras para **viagens aéreas**, fornecimento por **planos de saúde/SUS** e requisitos para laudos médicos circunstanciados com auxílio de nossa IA informativa.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    onClick={() => {
                      setSelectedPrompt(undefined);
                      setOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm h-11 px-6 rounded-2xl shadow-lg shadow-emerald-950/30 flex items-center gap-2"
                  >
                    <MessageSquare size={16} /> Abrir Guia Regulatório Interativo
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                    className="text-xs sm:text-sm h-11 px-5 rounded-2xl border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Link to="/telemedicina">
                      <Stethoscope size={15} className="mr-1.5" /> Consultar Especialista
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Grid de 4 Acessos Rápidos */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {STARTER_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOpenPrompt(q.prompt)}
                    className="p-3.5 text-left rounded-2xl bg-muted/40 hover:bg-emerald-500/10 border border-border hover:border-emerald-500/40 transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <q.icon size={14} />
                      </div>
                      <Badge className="bg-muted text-muted-foreground text-[9px] font-mono border-border">
                        {q.badge}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-emerald-300 transition-colors">
                      {q.label}
                    </p>
                    <span className="text-[10px] text-emerald-400 font-semibold mt-2 flex items-center gap-0.5">
                      Consultar IA <ChevronRight size={11} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <RegulatoryAiModal
        open={open}
        onOpenChange={setOpen}
        initialQuestion={selectedPrompt}
      />
    </>
  );
}

// Fallback inteligente offline
function getFallbackResponse(question: string): string {
  const lower = question.toLowerCase();
  if (lower.includes("importar") || lower.includes("rdc 660") || lower.includes("gov.br")) {
    return `### Como funciona a autorização da Anvisa para importar (RDC 660/2022)?

A importação para uso próprio é 100% legal e regulamentada pela **RDC 660/2022**:

1. **Prescrição Médica**: Emitida por médico habilitado no Brasil com posologia e justificativa.
2. **Cadastro no Gov.br**: Solicitação online no serviço de importação da Anvisa.
3. **Autorização Rápida**: Documento eletrônico emitido gratuitamente com validade de 2 anos.
4. **Despacho Direto**: O medicamento chega via remessa postal no seu endereço.

👉 Agende sua teleconsulta em **/telemedicina** para obter sua prescrição médica digital válida.`;
  }

  if (lower.includes("avião") || lower.includes("viagem") || lower.includes("viajar") || lower.includes("voo")) {
    return `### Posso viajar de avião pelo Brasil com meu medicamento?

**Sim! O porte em voos domésticos nacionais é totalmente permitido.**

Requisitos essenciais:
- 📄 **Receita médica original** legível e dentro da validade.
- 🏛️ **Autorização da Anvisa** (caso o produto seja importado pela RDC 660).
- 📦 **Frasco original** rotulado com identificação do paciente.
- 🎒 Transporte na **bagagem de mão** para evitar avarias ou calor excessivo no porão.

👉 Precisa de laudo ou atualização de receita? Consulte nossos médicos em **/telemedicina**.`;
  }

  if (lower.includes("plano") || lower.includes("sus") || lower.includes("cobrir") || lower.includes("obrigado")) {
    return `### O plano de saúde ou SUS é obrigado a cobrir?

**Sim, conforme entendimento consolidado do STJ e Tribunais de Justiça:**

- O plano não pode intervir na conduta do médico prescritor.
- É indispensável o **Laudo Médico Circunstanciado** atestando a refratariedade aos tratamentos convencionais.
- Em caso de negativa, o paciente pode ingressar com ação de obrigação de fazer com pedido liminar.

👉 Nossos médicos emitem laudos circunstanciados completos em **/telemedicina**.`;
  }

  return `### Guia Regulatório e Direitos do Paciente

O tratamento com derivados de Cannabis Medicinal no Brasil é plenamente regulamentado pelas resoluções **RDC 660/2022** (importação individual) e **RDC 327/2019** (farmácias nacionais).

Para usufruir de seus direitos com total segurança jurídica e sanitária, o primeiro passo é sempre a consulta com médico especialista para avaliação e emissão da receita médica digital.

👉 Agende sua teleconsulta médica em **/telemedicina**.`;
}
