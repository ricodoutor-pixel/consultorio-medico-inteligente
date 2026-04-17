/**
 * 🩺 Chat Dr. Edilson Bezerra — Consultoria de Orientação Técnica
 * Liberado após pagamento da Consultoria Breve (R$ 30 / $ 10).
 * Inclui disclaimer legal automático e geração de PDF de Encaminhamento.
 */

import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Send, Download, ShieldAlert, Stethoscope, MessageCircle } from "lucide-react";
import jsPDF from "jspdf";
import drEdilsonImg from "@/assets/dr-edilson-bezerra.jpg";

interface ChatMessage {
  id: string;
  role: "doctor" | "patient" | "system";
  content: string;
  timestamp: Date;
}

const DISCLAIMER =
  "Esta é uma consultoria de orientação técnica e integrativa. Para emissão de receitas e prescrições médicas válidas no seu país, você será encaminhado ao nosso corpo de médicos prescritores após esta breve sessão.";

const WHATSAPP_DR_EDILSON = "5511987131241";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: `p-${Date.now()}`,
      role: "patient",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    // Resposta simulada do Dr. Edilson (anamnese estruturada)
    setTimeout(() => {
      const replies = [
        "Entendido. Há quanto tempo você convive com esse sintoma e qual a intensidade (0 a 10)?",
        "Compreendo. Você já fez uso prévio de Cannabis medicinal (CBD/THC) ou outros tratamentos?",
        "Importante. Possui comorbidades, alergias ou faz uso contínuo de medicamentos?",
        "Ótimo. Com base no seu relato, recomendo encaminhamento a um médico prescritor habilitado. Vou gerar seu Protocolo de Encaminhamento em PDF.",
      ];
      const idx = Math.min(
        replies.length - 1,
        messages.filter((m) => m.role === "patient").length
      );
      setMessages((m) => [
        ...m,
        {
          id: `d-${Date.now()}`,
          role: "doctor",
          content: replies[idx],
          timestamp: new Date(),
        },
      ]);
      setIsTyping(false);
    }, 1200);
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
    doc.text("Dr. Edilson Bezerra da Silva", margin, y);
    y += 5;
    doc.text("CRM 10963 — Bolívia | Cannabis Medicinal & Medicina Integrativa", margin, y);
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

    y = Math.max(y + 12, 250);
    doc.setDrawColor(120, 120, 120);
    doc.line(margin, y, margin + 80, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Dr. Edilson Bezerra da Silva", margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.text("CRM 10963 — Bolívia | Responsável Técnico Planta y Raiz", margin, y);

    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(
      "Documento gerado eletronicamente — plantayraiz.com.br | Encaminhamento sem valor de prescrição",
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
              className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition"
            >
              <Download className="w-4 h-4" />
              Download PDF de Encaminhamento
            </button>
            <a
              href={`https://wa.me/${WHATSAPP_DR_EDILSON}?text=${encodeURIComponent(
                "Olá Dr. Edilson, acabei de realizar minha consultoria breve na plataforma e gostaria de orientações sobre o próximo passo."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-card border border-border text-foreground rounded-xl font-bold hover:bg-muted transition"
            >
              <MessageCircle className="w-4 h-4" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatDrEdilson;
