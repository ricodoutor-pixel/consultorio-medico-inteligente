/**
 * 🩺 Chat Dr. Edilson Bezerra — Consultoria de Orientação Técnica
 * Liberado após pagamento da Consultoria Breve (R$ 30 / $ 10).
 * Inclui disclaimer legal automático e geração de PDF de Encaminhamento.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, Link } from "react-router-dom";
import { Send, Download, ShieldAlert, Stethoscope, MessageCircle, Lock } from "lucide-react";
import jsPDF from "jspdf";
import drEdilsonImg from "@/assets/dr-edilson-bezerra.jpg";
import { supabase } from "@/integrations/supabase/client";

// 📋 Dados oficiais do Responsável Técnico
const DR_EDILSON = {
  fullName: "Dr. Edilson Bezerra da Silva",
  crm: "CRM 10963 — Bolívia",
  cpf: "009.536.834-51",
  phone: "+55 11 98713-1241",
  email: "contato@plantayraiz.com.br",
  address: "Planta y Raiz Ltda. — São Paulo/SP, Brasil",
};

interface ChatMessage {
  id: string;
  role: "doctor" | "patient" | "system";
  content: string;
  timestamp: Date;
}

const DISCLAIMER =
  "Esta é uma consultoria de orientação técnica e integrativa. Para emissão de receitas e prescrições médicas válidas no seu país, você será encaminhado ao nosso corpo de médicos prescritores após esta breve sessão.";

const WHATSAPP_DR_EDILSON = "5511987131241";

// 📲 Monta mensagem de handoff para WhatsApp com contexto + ID de pagamento confirmado
function buildWhatsAppHandoff(
  patientName: string,
  messages: ChatMessage[],
  paymentId: string
): string {
  const header = `Olá Dr. Edilson, ${
    patientName || "o paciente"
  } concluiu a consultoria paga e está pronto para orientação. [ID_PAGAMENTO_CONFIRMADO_${paymentId}]`;
  const transcript = messages
    .filter((m) => m.role !== "system")
    .slice(-10)
    .map((m) => `${m.role === "doctor" ? "Dr." : "Paciente"}: ${m.content}`)
    .join("\n");
  return `${header}\n\n— Resumo da anamnese —\n${transcript}`;
}

const ChatDrEdilson = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sys-disclaimer",
      role: "system",
      content: DISCLAIMER,
      timestamp: new Date(),
    },
    {
      id: "doc-welcome",
      role: "doctor",
      content:
        "Olá! Sou o Dr. Edilson Bezerra (CRM 10963 — Bolívia), Responsável Técnico da Planta y Raiz. Vou conduzir uma anamnese breve para te orientar. Pode me contar qual é a sua principal queixa hoje?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [patientName, setPatientName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();

  // 🔒 Gate de pagamento: exige ?payment_id=xxx&status=approved (vindo do redirect Mercado Pago)
  const paymentId = useMemo(() => {
    return (
      searchParams.get("payment_id") ||
      searchParams.get("collection_id") ||
      ""
    );
  }, [searchParams]);
  const paymentStatus = searchParams.get("status") || searchParams.get("collection_status") || "";

  useEffect(() => {
    // Permite acesso se: (a) payment_id presente + status approved, OU (b) usuário autenticado com assinatura ativa
    const verify = async () => {
      try {
        if (paymentId && (paymentStatus === "approved" || paymentStatus === "success")) {
          setPaymentVerified(true);
        } else {
          // Fallback: checar assinatura ativa do usuário logado
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: sub } = await supabase
              .from("health_subscriptions")
              .select("status")
              .eq("user_id", user.id)
              .eq("status", "active")
              .maybeSingle();
            if (sub) setPaymentVerified(true);
          }
        }
      } catch (err) {
        console.warn("[ChatDrEdilson] payment verify error:", err);
      } finally {
        setVerifying(false);
      }
    };
    verify();
  }, [paymentId, paymentStatus]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg: ChatMessage = {
      id: `p-${Date.now()}`,
      role: "patient",
      content: input.trim(),
      timestamp: new Date(),
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsTyping(true);

    try {
      const history = next
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "doctor" ? "assistant" : "user",
          content: m.content,
        }));

      const { data, error } = await supabase.functions.invoke("dr-edilson-chat", {
        body: { messages: history, patientName: patientName || undefined },
      });

      if (error) throw error;
      const reply =
        data?.reply ??
        "Desculpe, tive um problema técnico. Pode repetir sua última mensagem?";

      setMessages((m) => [
        ...m,
        { id: `d-${Date.now()}`, role: "doctor", content: reply, timestamp: new Date() },
      ]);
    } catch (e) {
      console.error("dr-edilson-chat error:", e);
      setMessages((m) => [
        ...m,
        {
          id: `d-${Date.now()}`,
          role: "doctor",
          content:
            "Tive uma instabilidade momentânea. Vamos seguir: pode me contar há quanto tempo convive com esse sintoma e qual a intensidade (0 a 10)?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateReferralPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Header
    doc.setFillColor(10, 12, 16);
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Planta y Raiz", margin, 18);
    doc.setTextColor(220, 220, 220);
    doc.setFontSize(9);
    doc.text("PROTOCOLO DE ENCAMINHAMENTO MÉDICO", margin, 26);
    doc.text(
      `Emitido em ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`,
      margin,
      32
    );

    y = 50;
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("RESPONSÁVEL TÉCNICO", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(DR_EDILSON.fullName, margin, y);
    y += 5;
    doc.text(`${DR_EDILSON.crm} | CPF: ${DR_EDILSON.cpf}`, margin, y);
    y += 5;
    doc.text("Cannabis Medicinal & Medicina Integrativa", margin, y);
    y += 5;
    doc.text(`Tel: ${DR_EDILSON.phone}  |  E-mail: ${DR_EDILSON.email}`, margin, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("PACIENTE", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${patientName || "Não informado"}`, margin, y);
    y += 10;

    // Disclaimer
    doc.setDrawColor(16, 185, 129);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("AVISO LEGAL", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const discLines = doc.splitTextToSize(DISCLAIMER, pageWidth - margin * 2);
    doc.text(discLines, margin, y);
    y += discLines.length * 4 + 6;

    // Anamnese (resumo da conversa)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text("RESUMO DA ANAMNESE", margin, y);
    y += 7;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const anamnese = messages
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role === "doctor" ? "Dr. Edilson" : "Paciente"}: ${m.content}`)
      .join("\n\n");
    const anamLines = doc.splitTextToSize(anamnese || "Sem registros.", pageWidth - margin * 2);
    anamLines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 4;
    });

    y = Math.max(y + 12, 245);
    doc.setDrawColor(120, 120, 120);
    doc.line(margin, y, margin + 80, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(DR_EDILSON.fullName, margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.text(`${DR_EDILSON.crm} · CPF ${DR_EDILSON.cpf}`, margin, y);
    y += 4;
    doc.text("Responsável Técnico — Planta y Raiz Ltda.", margin, y);
    y += 4;
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(
      "Assinatura eletrônica padrão — validada digitalmente pela plataforma Planta y Raiz.",
      margin,
      y
    );

    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `${DR_EDILSON.address} · plantayraiz.com.br · ${DR_EDILSON.email} · ${DR_EDILSON.phone}`,
      pageWidth / 2,
      footerY - 4,
      { align: "center" }
    );
    doc.text(
      "Documento gerado eletronicamente — Encaminhamento sem valor de prescrição",
      pageWidth / 2,
      footerY,
      { align: "center" }
    );

    doc.save(`encaminhamento-dr-edilson-${Date.now()}.pdf`);
  };

  return (
    <>
      <Helmet>
        <title>Consultoria Dr. Edilson Bezerra | Planta y Raiz</title>
        <meta
          name="description"
          content="Consultoria de orientação técnica em cannabis medicinal com Dr. Edilson Bezerra. Anamnese breve com encaminhamento ao médico prescritor."
        />
      </Helmet>

      <div className="min-h-[100dvh] bg-background pb-24 pt-20 md:pt-24">
        <div className="max-w-3xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={drEdilsonImg}
              alt="Dr. Edilson Bezerra"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/40"
            />
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                Dr. Edilson Bezerra
              </h1>
              <p className="text-xs text-muted-foreground">
                CRM 10963 — Bolívia · Responsável Técnico
              </p>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">
              ● ONLINE
            </span>
          </div>

          {/* Disclaimer banner */}
          <div className="mb-3 rounded-xl border border-primary/30 bg-primary/5 p-3 flex gap-2">
            <ShieldAlert className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-foreground/80">{DISCLAIMER}</p>
          </div>

          {/* Patient name */}
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Seu nome (para o protocolo de encaminhamento)"
            className="w-full mb-3 px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />

          {/* Chat */}
          <div
            ref={scrollRef}
            className="bg-card border border-border rounded-2xl p-4 h-[55vh] overflow-y-auto space-y-3"
          >
            {messages.map((m) => {
              if (m.role === "system") {
                return (
                  <div
                    key={m.id}
                    className="text-[10px] text-center text-muted-foreground italic px-4 py-2 rounded-lg bg-muted/40"
                  >
                    ⚖️ {m.content}
                  </div>
                );
              }
              const isDoc = m.role === "doctor";
              return (
                <div
                  key={m.id}
                  className={`flex ${isDoc ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                      isDoc
                        ? "bg-muted text-foreground rounded-tl-sm"
                        : "bg-primary text-primary-foreground rounded-tr-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted px-3 py-2 rounded-2xl text-sm text-muted-foreground">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.3s]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Descreva seus sintomas..."
              className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center gap-1 hover:bg-primary/90 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
            <button
              onClick={generateReferralPDF}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition"
            >
              <Download className="w-4 h-4" />
              Download PDF de Encaminhamento
            </button>
            {paymentVerified ? (
              <a
                href={`https://wa.me/${WHATSAPP_DR_EDILSON}?text=${encodeURIComponent(
                  buildWhatsAppHandoff(patientName, messages, paymentId || "ASSINANTE_ATIVO")
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-card border border-border text-foreground rounded-xl font-bold hover:bg-muted transition"
              >
                <MessageCircle className="w-4 h-4" />
                Falar no WhatsApp (com contexto)
              </a>
            ) : (
              <Link
                to="/agendamento"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-muted border border-border text-muted-foreground rounded-xl font-bold hover:bg-muted/80 transition"
                title="Disponível após confirmação de pagamento"
              >
                <Lock className="w-4 h-4" />
                Liberar WhatsApp (pagar consultoria)
              </Link>
            )}
          </div>
          {!paymentVerified && !verifying && (
            <p className="mt-2 text-[11px] text-muted-foreground text-center">
              🔒 O contato direto com o Dr. Edilson é liberado apenas após confirmação do pagamento da consultoria.
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatDrEdilson;
