import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Camera, Mic, Video, Phone, Search, MoreVertical, Lock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  sender_type: "patient" | "doctor" | "brisa" | "system";
  sender_id: string | null;
  content: string;
  created_at: string;
}

interface WhatsAppTelemedicineChatProps {
  appointmentId: string;
  currentUserRole: "patient" | "doctor" | "admin";
  currentUserId: string;
  consultationType: string;
  doctorName: string;
  doctorPhoto?: string | null;
  onVideoCallClick?: () => void;
}

export function WhatsAppTelemedicineChat({
  appointmentId,
  currentUserRole,
  currentUserId,
  consultationType,
  doctorName,
  doctorPhoto,
  onVideoCallClick,
}: WhatsAppTelemedicineChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isDoctorPresent, setIsDoctorPresent] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canUseVideo = consultationType.toLowerCase().includes("video") || consultationType.toLowerCase().includes("completo");

  useEffect(() => {
    fetchMessages();

    // Set up Realtime subscription
    const channel = supabase
      .channel("consultation_chats_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "consultation_chats",
          filter: `appointment_id=eq.${appointmentId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
          
          if (newMsg.sender_type === "system" && newMsg.content.includes("entrou na sala")) {
            setIsDoctorPresent(true);
          } else if (newMsg.sender_type === "doctor") {
            setIsDoctorPresent(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("consultation_chats")
      .select("*")
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data as ChatMessage[]);
    
    // Check if doctor has ever sent a message or system announced doctor
    const doctorWasPresent = data.some(
      (m) => m.sender_type === "doctor" || (m.sender_type === "system" && m.content.includes("entrou na sala"))
    );
    setIsDoctorPresent(doctorWasPresent);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage(""); // optimistic clear

    const { error } = await supabase.from("consultation_chats").insert({
      appointment_id: appointmentId,
      sender_type: currentUserRole,
      sender_id: currentUserId,
      content: messageText,
    });

    if (error) {
      toast.error("Erro ao enviar mensagem.");
      setNewMessage(messageText); // restore on error
    } else {
      // If doctor is sending first message, notify system
      if (currentUserRole === "doctor" && !isDoctorPresent) {
        setIsDoctorPresent(true);
        await supabase.from("consultation_chats").insert({
          appointment_id: appointmentId,
          sender_type: "system",
          sender_id: null,
          content: `O Dr(a). ${doctorName} entrou na sala e assumiu a consulta.`,
        });
      }
    }
  };

  const handleVideoClick = () => {
    if (!canUseVideo) {
      toast.error("Este pacote não inclui chamada de vídeo.");
      return;
    }
    if (onVideoCallClick) onVideoCallClick();
  };

  // Header Data based on handoff
  const displayPhoto = isDoctorPresent || currentUserRole === "doctor" ? (doctorPhoto || "") : "/brisa-avatar.png";
  const displayName = isDoctorPresent || currentUserRole === "doctor" ? `Dr(a). ${doctorName}` : "Enfª Brisa 🌿";
  const displayStatus = isDoctorPresent || currentUserRole === "doctor" ? "Online" : "Triagem IA Automática";

  return (
    <div className="flex flex-col w-full h-[600px] max-h-[80vh] bg-[#efeae2] rounded-xl overflow-hidden shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#075e54] text-white">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-white/20">
            <AvatarImage src={displayPhoto} alt={displayName} />
            <AvatarFallback className="bg-primary-foreground text-primary">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-[15px]">{displayName}</span>
            <span className="text-[12px] text-white/80">{displayStatus}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-white/90">
          <button onClick={handleVideoClick} className={`${canUseVideo ? "hover:text-white" : "opacity-40 cursor-not-allowed"} transition-colors`}>
            <Video size={20} />
          </button>
          <Phone size={18} className="hover:text-white cursor-pointer" />
          <Search size={20} className="hidden sm:block hover:text-white cursor-pointer" />
          <MoreVertical size={20} className="hover:text-white cursor-pointer" />
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto flex flex-col gap-2"
        style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: "repeat" }}
      >
        <div className="flex justify-center mb-4">
          <div className="bg-[#FFEEDB] text-[#544837] text-[11px] px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm text-center max-w-[80%]">
            <Lock size={12} />
            As mensagens e chamadas são protegidas com criptografia de ponta a ponta e auditoria clínica.
          </div>
        </div>

        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId || (currentUserRole === 'doctor' && msg.sender_type === 'doctor');
          
          if (msg.sender_type === "system") {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="bg-black/10 text-black/70 text-xs px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMine ? "self-end" : "self-start"}`}>
              {msg.sender_type === "brisa" && !isMine && (
                <span className="text-[11px] text-gray-500 ml-1 mb-0.5 font-medium">Enfª Brisa</span>
              )}
              <div className={`relative px-3 py-2 rounded-xl shadow-sm text-[14px] ${isMine ? "bg-[#dcf8c6] rounded-tr-none" : "bg-white rounded-tl-none"}`}>
                <p className="text-gray-800 break-words">{msg.content}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-gray-500">{format(new Date(msg.created_at), "HH:mm")}</span>
                  {isMine && <span className="text-blue-500 text-[10px]">✓✓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-2 p-3 bg-[#f0f0f0]">
        <button className="text-gray-500 hover:text-gray-700 transition-colors">
          <Paperclip size={22} />
        </button>
        <div className="flex-1 bg-white rounded-full flex items-center px-4 py-1.5 border border-gray-200">
          <input
            type="text"
            placeholder="Mensagem"
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-400 py-1"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
          />
          <button className="text-gray-500 hover:text-gray-700 ml-2">
            <Camera size={20} />
          </button>
        </div>
        {newMessage.trim() ? (
          <button 
            onClick={handleSendMessage}
            className="bg-[#00a884] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#008f6f] shadow-sm transition-colors"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        ) : (
          <button className="text-gray-500 hover:text-gray-700 w-10 h-10 flex items-center justify-center transition-colors">
            <Mic size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
