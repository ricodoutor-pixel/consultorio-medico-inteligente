import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConsultationChat } from "@/hooks/useConsultationChat";

interface Props {
  appointmentId: string;
  doctorUserId: string;
  patientName?: string;
  /** Envio só é aceito pelo servidor com a consulta paga e em andamento. */
  live: boolean;
  onEnd?: () => void;
}

/** Chat ao vivo do lado do médico, ligado às mesmas mensagens que o paciente vê. */
export function ConsultationChatPanel({ appointmentId, doctorUserId, patientName, live, onEnd }: Props) {
  const { messages, send, sending } = useConsultationChat(appointmentId, doctorUserId, "doctor");
  const [text, setText] = useState("");
  const [failed, setFailed] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const submit = async () => {
    if (!text.trim() || sending) return;
    const ok = await send(text);
    setFailed(!ok);
    if (ok) setText("");
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#ECE5DD]">
      <div className="bg-[#075E54] text-white px-4 py-2 flex items-center justify-between gap-2 shrink-0">
        <span className="inline-flex items-center gap-2 text-sm font-bold truncate">
          <MessageSquare size={15} /> Chat com {patientName || "o paciente"}
        </span>
        {onEnd && live && (
          <button
            type="button"
            onClick={onEnd}
            className="rounded-full bg-red-600 hover:bg-red-700 px-3 py-1 text-xs font-bold"
          >
            Encerrar consulta
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2" aria-live="polite">
        {messages.length === 0 && (
          <p className="text-center text-xs text-slate-600 mt-6">
            {live ? "Nenhuma mensagem ainda. As mensagens do paciente aparecem aqui na hora." : "Consulta não está em andamento."}
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_type === "doctor" ? "justify-end" : m.sender_type === "system" ? "justify-center" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
                m.sender_type === "doctor"
                  ? "bg-[#DCF8C6] text-slate-900 rounded-br-sm"
                  : m.sender_type === "system"
                    ? "bg-amber-50 border border-amber-200 text-amber-950"
                    : "bg-white text-slate-900 rounded-bl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              <span className="block text-[10px] text-slate-500 text-right mt-0.5">
                {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="bg-[#F0F0F0] p-2 border-t border-slate-300 shrink-0 space-y-1">
        {failed && <p className="text-[11px] text-red-600 px-2">Mensagem não enviada. Confira a conexão e tente de novo.</p>}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            disabled={!live}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder={live ? "Digite sua mensagem ao paciente..." : "Chat disponível com a consulta em andamento"}
            className="flex-1 rounded-full bg-white px-4 py-2 text-xs text-slate-900 border border-slate-300 focus:outline-none focus:border-emerald-600 disabled:opacity-60"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => void submit()}
            disabled={!live || sending}
            className="rounded-full bg-[#075E54] hover:bg-[#064e46]"
            title="Enviar mensagem"
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
