/**
 * TelemedChat — Interface Telemed estilo WhatsApp Web
 * Painel de contatos à esquerda + Janela de chat ativa à direita.
 * Enfª Brisa desbloqueada 24h. Médicos bloqueados até consulta confirmada.
 */
import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Lock, Send, Bot, Search, ArrowLeft, Calendar,
  CheckCircle2, Stethoscope, MessageCircle, Leaf, Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { professionals, type Professional } from "@/data/professionals";
import { Link } from "react-router-dom";

// ── Types ──────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Contact {
  id: string;
  name: string;
  subtitle: string;
  avatar: string | null;
  imageUrl?: string;
  online: boolean;
  locked: boolean;
  isBrisa: boolean;
  lastMsg?: string;
  unread?: number;
}

// ── Brisa Contact (always first, always unlocked) ──────
const BRISA_CONTACT: Contact = {
  id: "brisa",
  name: "Enfª Brisa",
  subtitle: "Triagem • Dúvidas • Agendamento",
  avatar: "🩺",
  online: true,
  locked: false,
  isBrisa: true,
  lastMsg: "Olá! Como posso ajudar? 💚",
  unread: 1,
};

const BRISA_WELCOME: ChatMessage[] = [
  {
    id: "brisa-1",
    role: "assistant",
    content: "Olá! Eu sou a Enfª Brisa, sua enfermeira orientadora e especialista em saúde canabinoide da Planta & Raiz 🌿\n\nEstou disponível 24h para orientações sobre:\n• Regras da Anvisa (RDC 660/2022 e RDC 327/2019)\n• Direitos perante Planos de Saúde e SUS (STJ)\n• Viagens aéreas nacionais com medicamento\n• Laudos médicos para Habeas Corpus de cultivo\n• Agendamento de teleconsulta com médicos especialistas\n\nComo posso orientar você hoje?",
    timestamp: new Date(),
  },
];

// ── Helper: Build contacts from professionals ──────────
function buildDoctorContacts(pros: Professional[], unlockedIds: Set<string>): Contact[] {
  return pros
    .filter(p => p.category === "Médicos Prescritores")
    .slice(0, 8)
    .map(p => ({
      id: p.id,
      name: p.name,
      subtitle: p.tags.slice(0, 2).join(" • "),
      avatar: p.avatar,
      imageUrl: p.imageUrl,
      online: p.online ?? false,
      locked: !unlockedIds.has(p.id),
      isBrisa: false,
      lastMsg: unlockedIds.has(p.id) ? "Consulta confirmada ✅" : "🔒 Agendar para desbloquear",
    }));
}

// ── Main Component ─────────────────────────────────────
interface TelemedChatProps {
  patientId?: string;
}

export const TelemedChat = ({ patientId }: TelemedChatProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockTarget, setLockTarget] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load unlocked doctors (patients with confirmed appointments)
  useEffect(() => {
    const loadContacts = async () => {
      let unlockedIds = new Set<string>();

      if (patientId) {
        const { data: appts } = await supabase
          .from("appointments")
          .select("doctor_id")
          .eq("patient_id", patientId)
          .in("status", ["confirmed", "completed", "scheduled"]);

        if (appts) {
          // Map doctor UUIDs to professional IDs
          for (const a of appts) {
            // Try to find matching professional
            const match = professionals.find(p => p.id === a.doctor_id);
            if (match) unlockedIds.add(match.id);
          }
          // Always unlock med-0 (Dr. Edilson) for OT R$30
          unlockedIds.add("med-0");
        }
      }

      const doctorContacts = buildDoctorContacts(professionals, unlockedIds);
      setContacts([BRISA_CONTACT, ...doctorContacts]);
    };

    loadContacts();
  }, [patientId]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Select contact handler
  const handleSelectContact = (contact: Contact) => {
    if (contact.locked) {
      setLockTarget(contact);
      setLockModalOpen(true);
      return;
    }

    setSelectedContact(contact);
    setMobileShowChat(true);

    if (contact.isBrisa) {
      setMessages(BRISA_WELCOME);
    } else {
      setMessages([{
        id: `${contact.id}-welcome`,
        role: "assistant",
        content: `Olá! Aqui é ${contact.name}. Sua consulta está confirmada. Como posso ajudá-lo(a)?`,
        timestamp: new Date(),
      }]);
    }
  };

  // Send message (Brisa uses AI gateway, doctors are placeholder)
  const handleSend = async () => {
    if (!input.trim() || !selectedContact) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      if (selectedContact.isBrisa) {
        // Call AI gateway for Brisa
        const { data, error } = await supabase.functions.invoke("ai-gateway", {
          body: {
            messages: [
              {
                role: "system",
                content: `Você é a Enfermeira Brisa da Planta y Raíz, enfermeira orientadora e especialista em saúde canabinoide e regulação sanitária brasileira.
Responda de forma acolhedora, empática, didática e em português do Brasil.

DIRETRIZES:
- Suas respostas têm caráter estritamente educativo e informativo, não substituindo a consulta médica individual nem a assessoria de um advogado.
- Você domina: RDC 660/2022 (importação individual pelo gov.br), RDC 327/2019 (farmácias no Brasil com receitas C1/B), transporte em voos nacionais (receita válida + autorização Anvisa + bagagem de mão), cobertura por Planos de Saúde/SUS (jurisprudência do STJ exigindo Laudo Médico Circunstanciado) e Habeas Corpus para cultivo.
- Sempre convide o paciente a agendar teleconsulta com os médicos especialistas da plataforma em /telemedicina para obter sua receita médica ou laudo circunstanciado.`
              },
              ...messages.map(m => ({ role: m.role, content: m.content })),
              { role: "user", content: userMsg.content },
            ],
          },
        });

        const reply = data?.text || data?.choices?.[0]?.message?.content || "Desculpe, estou passando por uma instabilidade. Tente novamente em instantes. 💚";

        setMessages(prev => [...prev, {
          id: `brisa-${Date.now()}`,
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        }]);
      } else {
        // Placeholder for doctor chat
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `doc-${Date.now()}`,
            role: "assistant",
            content: "Recebi sua mensagem. Retorno em breve durante o horário de atendimento. 🩺",
            timestamp: new Date(),
          }]);
        }, 1000);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Ops! Ocorreu um erro. Tente novamente. 😔",
        timestamp: new Date(),
      }]);
    } finally {
      setSending(false);
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // ── RENDER ─────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <Card className="border-border overflow-hidden">
        <div className="flex h-[520px] md:h-[580px]">
          {/* ── Left Panel: Contacts ──────────────── */}
          <div className={`w-full md:w-[320px] md:min-w-[320px] border-r border-border flex flex-col bg-card ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
            {/* Search */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar contato..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 bg-muted/30 border-border text-sm h-9 rounded-xl"
                />
              </div>
            </div>

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto">
              {filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectContact(contact)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/30 border-b border-border/50 ${selectedContact?.id === contact.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {contact.imageUrl ? (
                      <img
                        src={contact.imageUrl}
                        alt={contact.name}
                        className="w-11 h-11 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold ${contact.isBrisa ? "bg-gradient-to-br from-primary/30 to-emerald-500/30 border-2 border-primary/50" : "bg-muted border border-border"}`}>
                        {contact.avatar || contact.name[0]}
                      </div>
                    )}
                    {/* Online indicator */}
                    {contact.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-card" />
                    )}
                    {/* Lock icon */}
                    {contact.locked && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-muted border border-border flex items-center justify-center">
                        <Lock size={8} className="text-muted-foreground" />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground truncate">
                        {contact.name}
                      </span>
                      {contact.isBrisa && (
                        <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 px-1.5 py-0 shrink-0">
                          Online 24h
                        </Badge>
                      )}
                      {contact.locked && (
                        <Lock size={12} className="text-muted-foreground shrink-0 ml-1" />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{contact.subtitle}</p>
                    <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">
                      {contact.lastMsg}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {contact.unread && contact.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                      {contact.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Right Panel: Chat Window ──────────── */}
          <div className={`flex-1 flex flex-col bg-background ${!mobileShowChat && !selectedContact ? "hidden md:flex" : "flex"} ${mobileShowChat ? "flex" : !selectedContact ? "hidden md:flex" : ""}`}>
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
                  <button
                    className="md:hidden p-1 hover:bg-muted rounded-lg"
                    onClick={() => { setMobileShowChat(false); setSelectedContact(null); }}
                  >
                    <ArrowLeft size={18} className="text-muted-foreground" />
                  </button>
                  {selectedContact.imageUrl ? (
                    <img src={selectedContact.imageUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-border" />
                  ) : (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${selectedContact.isBrisa ? "bg-gradient-to-br from-primary/30 to-emerald-500/30" : "bg-muted"}`}>
                      {selectedContact.avatar || selectedContact.name[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{selectedContact.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedContact.online ? (
                        <span className="text-green-400 font-bold">● Online</span>
                      ) : (
                        "Offline"
                      )}
                    </p>
                  </div>
                  {selectedContact.isBrisa && (
                    <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">
                      <Bot size={10} className="mr-1" /> IA
                    </Badge>
                  )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: "linear-gradient(180deg, hsl(240 15% 6%) 0%, hsl(240 15% 8%) 100%)" }}>
                  <AnimatePresence>
                    {messages.map(msg => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${msg.role === "user"
                          ? "bg-primary/20 border border-primary/30 text-foreground"
                          : "bg-card border border-border text-foreground"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <p className="text-[9px] text-muted-foreground mt-1 text-right">
                            {formatTime(msg.timestamp)}
                            {msg.role === "user" && <CheckCircle2 size={10} className="inline ml-1 text-primary" />}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-card border border-border rounded-2xl px-4 py-2.5">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Perguntas Rápidas quando conversando com a Enfª Brisa */}
                {selectedContact.isBrisa && (
                  <div className="px-3 py-1.5 border-t border-border/50 bg-muted/20 flex gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                      "Como funciona a autorização da Anvisa?",
                      "Posso viajar de avião com meu óleo?",
                      "O plano de saúde cobre o tratamento?",
                      "Como conseguir laudo para processo ou cultivo?",
                    ].map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={sending}
                        onClick={() => {
                          setInput(q);
                          setTimeout(() => {
                            const btn = document.getElementById("telemed-chat-send-btn");
                            btn?.click();
                          }, 50);
                        }}
                        className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] bg-card border border-primary/20 hover:border-primary text-foreground hover:bg-primary/10 transition-colors shrink-0 font-medium"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Bar */}
                <div className="px-3 py-2.5 border-t border-border bg-card flex flex-col gap-1.5">
                  <form
                    onSubmit={e => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      placeholder={selectedContact.isBrisa ? "Dúvidas sobre Anvisa, laudos, viagens..." : `Mensagem para ${selectedContact.name}...`}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      className="flex-1 bg-muted/30 border-border text-sm h-10 rounded-xl"
                      disabled={sending}
                    />
                    <Button
                      id="telemed-chat-send-btn"
                      type="submit"
                      size="sm"
                      className="h-10 w-10 rounded-xl bg-primary text-primary-foreground p-0"
                      disabled={!input.trim() || sending}
                    >
                      <Send size={16} />
                    </Button>
                  </form>
                  {selectedContact.isBrisa && (
                    <p className="text-[9px] text-muted-foreground text-center leading-tight">
                      🌿 <strong>Enfª Brisa</strong>: Orientação educativa e de saúde. Não substitui consulta médica ou advocatícia.
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-emerald-500/10 flex items-center justify-center mb-4">
                  <MessageCircle size={32} className="text-primary" />
                </div>
                <h3 className="text-lg font-display font-black text-foreground mb-2">Telemed Chat</h3>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  Selecione a <span className="text-primary font-bold">Enfª Brisa</span> para iniciar sua triagem ou escolha um médico da lista.
                </p>
                <p className="text-[10px] text-muted-foreground mt-4 flex items-center gap-1">
                  <Shield size={10} /> Conversas protegidas com criptografia
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Lock Modal ──────────────────────────────── */}
      <Dialog open={lockModalOpen} onOpenChange={setLockModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock size={18} className="text-amber-400" /> Profissional Bloqueado
            </DialogTitle>
            <DialogDescription>
              Para iniciar a conversa com <span className="font-bold text-foreground">{lockTarget?.name}</span>, faça o agendamento da sua consulta.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/20 rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3 mb-3">
              {lockTarget?.imageUrl ? (
                <img src={lockTarget.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-border" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-lg font-bold">
                  {lockTarget?.avatar}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-foreground">{lockTarget?.name}</p>
                <p className="text-xs text-muted-foreground">{lockTarget?.subtitle}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Leaf size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                O chat com especialistas é desbloqueado automaticamente após a confirmação do agendamento de Orientação Técnica. Isso garante a qualidade e a segurança do seu atendimento.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setLockModalOpen(false)}>
              Voltar
            </Button>
            <Button className="rounded-xl bg-primary text-primary-foreground" asChild>
              <Link to="/profissionais" onClick={() => setLockModalOpen(false)}>
                <Calendar size={14} className="mr-1.5" /> Agendar Consulta Agora
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
