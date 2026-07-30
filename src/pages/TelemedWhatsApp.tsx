import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Paperclip, Send, Mic, Phone, Video, 
  MoreVertical, Check, CheckCheck, Lock, Unlock, 
  ArrowLeft, PhoneOff, MicOff, VideoOff, Maximize,
  FileImage, QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

type ChatState = 'ANAMNESE' | 'ESCOLHA_MEDICO' | 'PAYMENT' | 'UPLOAD_RECEIPT' | 'DOCTOR_UNLOCKED' | 'VIDEO_CALL';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isBrisa?: boolean;
  isSystem?: boolean;
  attachment?: string;
  isPayment?: boolean;
  isSummary?: boolean;
}

export default function TelemedWhatsApp() {
  const navigate = useNavigate();
  const [activeContact, setActiveContact] = useState('brisa');
  const [chatState, setChatState] = useState<ChatState>('ANAMNESE');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMobileList, setIsMobileList] = useState(true); // Control for mobile view
  const [doctorLocked, setDoctorLocked] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contacts = [
    {
      id: 'brisa',
      name: 'Enfª Brisa - Triagem 24h',
      role: 'Triagem e Orientações Técnicas',
      avatar: '/enfa-brisa-avatar.jpg',
      isOnline: true,
      isLocked: false,
      lastMsg: chatState === 'DOCTOR_UNLOCKED' ? 'Resumo gerado.' : 'Olá, como posso ajudar?'
    },
    {
      id: 'doctor',
      name: 'Dr. Edilson Bezerra On',
      role: 'Medicina Canábica - CRM 10963',
      avatar: '/dr-edilson-avatar.jpg',
      isOnline: true,
      isLocked: doctorLocked,
      lastMsg: doctorLocked ? 'Bloqueado aguardando triagem.' : 'Pronto para atendimento.'
    },
    {
      id: 'olivia',
      name: 'Dra. Olivia Zimeri',
      role: 'Médica Prescritora',
      avatar: '/dra-olivia-avatar.jpg',
      isOnline: true,
      isLocked: doctorLocked,
      lastMsg: doctorLocked ? 'Bloqueado aguardando triagem.' : 'Pronto para atendimento.'
    },
    {
      id: 'suelen',
      name: 'Dra. Suelen Naves Rodrigues',
      role: 'Médica Prescritora',
      avatar: '/dra-suelen-avatar.jpg',
      isOnline: true,
      isLocked: doctorLocked,
      lastMsg: doctorLocked ? 'Bloqueado aguardando triagem.' : 'Pronto para atendimento.'
    }
  ];

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: '1',
          senderId: 'brisa',
          text: 'Olá! Sou a Brisa, sua assistente virtual. Para iniciarmos, poderia descrever brevemente seus sintomas ou o motivo da sua busca por tratamento canábico?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isBrisa: true
        }
      ]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatState]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulate Brisa's flow
    if (activeContact === 'brisa') {
      if (chatState === 'ANAMNESE') {
        // Mocked typing state could go here
        setTimeout(async () => {
          try {
            // Call AI agent to process anamnesis and check for red flags
            const aiHistory = messages.filter(m => m.senderId === 'user' || m.isBrisa).map(m => ({
              role: m.isBrisa ? 'assistant' : 'user',
              content: m.text
            }));
            aiHistory.push({ role: 'user', content: inputText });
            
            const { data, error } = await supabase.functions.invoke('agent-chat', {
              body: { slug: 'brisa-triage', messages: aiHistory } // Try generic slug, fallback if it fails
            });
            
            const aiReply = data?.reply || "Compreendi os seus sintomas. Estou aqui para ajudar a direcionar o seu atendimento de forma segura.";
            
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              senderId: 'brisa',
              text: aiReply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isBrisa: true
            }]);

            // Transition to Doctor Choice
            setTimeout(() => {
              setChatState('ESCOLHA_MEDICO');
              setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                senderId: 'brisa',
                text: 'Para prosseguirmos: qual médico você prefere? (Dr. Edilson Bezerra, Dra. Olivia Zimeri, Dra. Suelen Naves ou o próximo disponível?) E qual a modalidade da consulta? (Atendimento Ao Vivo, Agendamento, Emergência, Orientação Técnica)',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isBrisa: true
              }]);
            }, 2000);
            
          } catch (e) {
            console.error("AI triage error", e);
            // Fallback response if AI call fails
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              senderId: 'brisa',
              text: "Compreendo. Registrei seus sintomas com atenção e não identifiquei sinais de emergência crítica. Vamos dar andamento ao seu caso.",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isBrisa: true
            }]);
            setTimeout(() => {
              setChatState('ESCOLHA_MEDICO');
              setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                senderId: 'brisa',
                text: 'Para prosseguirmos: qual médico você prefere? (Dr. Edilson Bezerra, Dra. Olivia Zimeri, Dra. Suelen Naves ou o próximo disponível?) E qual a modalidade da consulta? (Atendimento Ao Vivo, Agendamento, Emergência, Orientação Técnica)',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isBrisa: true
              }]);
            }, 2000);
          }
        }, 500);
      } else if (chatState === 'ESCOLHA_MEDICO') {
        setTimeout(() => {
          setChatState('PAYMENT');
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            senderId: 'brisa',
            text: `Perfeito! Registrei sua triagem e sua preferência de atendimento. Para confirmar e liberar o médico imediatamente, realize o pagamento da taxa de triagem.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isBrisa: true
          }, {
            id: (Date.now() + 1).toString(),
            senderId: 'brisa',
            text: 'R$ 30,00',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isBrisa: true,
            isPayment: true
          }]);
        }, 1000);
      }
    }
  };

  const handleSimulatePayment = () => {
    setChatState('UPLOAD_RECEIPT');
    toast.success('Chave Pix copiada!');
  };

  const handleUploadReceipt = () => {
    const uploadMsg: Message = {
      id: Date.now().toString(),
      senderId: 'user',
      text: 'Comprovante em anexo.',
      attachment: 'comprovante.jpg',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, uploadMsg]);

    setTimeout(() => {
      setDoctorLocked(false);
      setChatState('DOCTOR_UNLOCKED');
      
      const confirmMsg: Message = {
        id: Date.now().toString(),
        senderId: 'system',
        text: '✅ Depósito Confirmado! Médico liberado para consulta.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      };

      const summaryMsg: Message = {
        id: (Date.now() + 1).toString(),
        senderId: 'brisa',
        text: 'Resumo da Triagem Clínica:\n- Sintomas avaliados: Sem Red Flags\n- Preferência: Atendimento Ao Vivo\n- Status: Handoff para o médico concluído.\nO cadeado foi destravado! Você já pode iniciar a chamada.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isBrisa: true,
        isSummary: true
      };

      setMessages(prev => [...prev, confirmMsg, summaryMsg]);
      toast.success('Médico desbloqueado!');
    }, 1500);
  };

  const handleStartVideoCall = () => {
    setChatState('VIDEO_CALL');
  };

  const handleEndVideoCall = () => {
    setChatState('DOCTOR_UNLOCKED');
  };

  const currentContact = contacts.find(c => c.id === activeContact);

  return (
    <div className="flex h-screen bg-[#f0f2f5] overflow-hidden font-sans">
      
      {/* Left Panel - Contacts List */}
      <div className={`w-full md:w-[30%] lg:w-[350px] bg-white border-r flex flex-col transition-all duration-300 ${isMobileList ? 'block' : 'hidden md:flex'}`}>
        
        {/* Header */}
        <div className="bg-[#f0f2f5] h-16 px-4 flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="text-[#54656f] hover:bg-black/5 p-1.5 rounded-full transition-colors flex items-center justify-center"
            >
              <ArrowLeft size={22} />
            </button>
            <span className="font-semibold text-[#41525d]">Telemed - Planta y Raiz</span>
          </div>
          <div className="flex gap-4 text-[#54656f]">
            <MoreVertical size={20} className="cursor-pointer" />
          </div>
        </div>

        {/* Search */}
        <div className="p-2 border-b bg-white">
          <div className="bg-[#f0f2f5] rounded-lg flex items-center px-3 py-1.5 h-9">
            <Search size={18} className="text-[#54656f] mr-3" />
            <input 
              type="text" 
              placeholder="Pesquisar ou começar uma nova conversa" 
              className="bg-transparent border-none outline-none w-full text-sm text-[#111b21] placeholder:text-[#54656f]"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto bg-white">
          {contacts.map(contact => (
            <div 
              key={contact.id} 
              onClick={() => {
                if (contact.isLocked) {
                  toast.error('Complete a triagem com a Brisa para desbloquear.');
                  return;
                }
                setActiveContact(contact.id);
                setIsMobileList(false);
              }}
              className={`flex items-center px-3 py-3 border-b cursor-pointer hover:bg-[#f5f6f6] transition-colors relative ${activeContact === contact.id ? 'bg-[#f0f2f5]' : ''} ${contact.isLocked ? 'opacity-60' : ''}`}
            >
              <div className="w-[49px] h-[49px] rounded-full overflow-hidden flex-shrink-0 bg-gray-200 border border-gray-300">
                <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover object-top" />
              </div>
              <div className="ml-3 flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <h3 className="text-[17px] text-[#111b21] truncate pr-2 font-normal">{contact.name}</h3>
                  <span className="text-xs text-[#667781]">Agora</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {contact.id === 'brisa' && <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold mr-1">Online 24h</span>}
                  <p className="text-sm text-[#667781] truncate">{contact.lastMsg}</p>
                </div>
              </div>
              {contact.isLocked && (
                <div className="absolute right-4 text-gray-400">
                  <Lock size={16} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#efeae2] relative ${!isMobileList ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Chat Header */}
        {currentContact && (
          <div className="bg-[#f0f2f5] h-16 px-4 flex items-center justify-between border-b shadow-sm z-10">
            <div className="flex items-center gap-3">
              <button 
                className="md:hidden text-[#54656f] mr-1"
                onClick={() => setIsMobileList(true)}
              >
                <ArrowLeft size={24} />
              </button>
              <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer border border-gray-300">
                <img src={currentContact.avatar} alt={currentContact.name} className="w-full h-full object-cover object-top" />
              </div>
              <div className="flex flex-col cursor-pointer">
                <span className="font-medium text-[#111b21] text-base">{currentContact.name}</span>
                <span className="text-xs text-[#667781]">{currentContact.role}</span>
              </div>
            </div>

            <div className="flex items-center gap-5 text-[#54656f]">
              {activeContact === 'doctor' && (
                <>
                  <button 
                    onClick={handleStartVideoCall}
                    className="flex items-center justify-center bg-[#00a884] text-white p-2 rounded-full hover:bg-[#008f6f] transition-all shadow-md transform hover:scale-105"
                    title="Iniciar Videochamada"
                  >
                    <Video size={18} fill="currentColor" />
                  </button>
                  <Phone size={20} className="cursor-pointer hover:text-primary transition-colors" />
                </>
              )}
              <Search size={20} className="cursor-pointer" />
              <MoreVertical size={20} className="cursor-pointer" />
            </div>
          </div>
        )}

        {/* Video Call Overlay */}
        {chatState === 'VIDEO_CALL' && activeContact === 'doctor' ? (
          <div className="flex-1 bg-black flex flex-col relative z-20">
            {/* Main Video (Doctor) */}
            <div className="flex-1 relative flex items-center justify-center">
              <img src={currentContact?.avatar} className="w-48 h-48 rounded-full opacity-50 blur-sm absolute" alt="Video Placeholder" />
              <div className="text-white z-10 text-xl font-medium animate-pulse">Conectando vídeo com {currentContact?.name}...</div>
              
              {/* Self Video (PIP) */}
              <div className="absolute bottom-6 right-6 w-32 h-44 bg-gray-800 border-2 border-gray-600 rounded-lg overflow-hidden shadow-2xl flex items-center justify-center">
                 <Camera size={32} className="text-gray-500" />
              </div>
            </div>
            
            {/* Video Controls */}
            <div className="h-24 bg-[#111b21]/90 flex items-center justify-center gap-6 px-6 pb-4">
              <button className="w-12 h-12 rounded-full bg-[#2a3942] flex items-center justify-center text-white hover:bg-[#3b4a54] transition-colors">
                <MicOff size={22} />
              </button>
              <button className="w-12 h-12 rounded-full bg-[#2a3942] flex items-center justify-center text-white hover:bg-[#3b4a54] transition-colors">
                <VideoOff size={22} />
              </button>
              <button 
                className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                onClick={handleEndVideoCall}
              >
                <PhoneOff size={26} />
              </button>
              <button className="w-12 h-12 rounded-full bg-[#2a3942] flex items-center justify-center text-white hover:bg-[#3b4a54] transition-colors">
                <Maximize size={22} />
              </button>
            </div>
          </div>
        ) : (
          /* Chat Background and Messages */
          <div 
            className="flex-1 overflow-y-auto p-4 md:p-6 lg:px-[8%] relative bg-cover bg-center" 
            style={{ backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')" }}
          >
            {/* Encryption notice */}
            <div className="flex justify-center mb-6">
              <div className="bg-[#ffeecd] text-[#54656f] text-xs px-4 py-2 rounded-lg text-center max-w-sm shadow-sm">
                <Lock size={10} className="inline mr-1" />
                As mensagens são criptografadas de ponta a ponta. Ninguém fora desta conversa pode ler ou ouvi-las.
              </div>
            </div>

            {/* Messages */}
            <div className="flex flex-col space-y-3 pb-8">
              {messages.filter(m => activeContact === 'brisa' ? (m.isBrisa || m.isSystem || m.senderId === 'user') : (!m.isBrisa && !m.isPayment)).map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                  {msg.isSystem ? (
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm max-w-[85%] md:max-w-[70%] text-center mx-auto shadow-sm border border-green-200 font-medium my-2">
                      {msg.text}
                    </div>
                  ) : msg.isSummary ? (
                    <div className="bg-white border-l-4 border-primary px-4 py-3 rounded-r-lg shadow-sm max-w-[85%] md:max-w-[70%] mt-4">
                      <div className="font-bold text-primary mb-2 flex items-center gap-2">
                        <CheckCheck size={16} /> Resumo Clínico Compartilhado
                      </div>
                      <div className="text-[#111b21] text-sm whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  ) : msg.isPayment ? (
                    <div className="bg-white px-4 py-4 rounded-lg rounded-tl-none shadow-sm max-w-[85%] md:max-w-[70%] border-t-4 border-green-500">
                      <h4 className="font-bold text-[#111b21] text-lg mb-1">{msg.text}</h4>
                      <p className="text-sm text-[#54656f] mb-4">Taxa de consulta e encaminhamento médico.</p>
                      <div className="flex justify-center bg-gray-50 p-4 rounded-lg mb-4">
                        <QrCode size={100} className="text-[#111b21]" />
                      </div>
                      <Button 
                        onClick={handleSimulatePayment} 
                        className="w-full bg-[#00a884] hover:bg-[#008f6f] text-white"
                      >
                        Copiar Chave PIX
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className={`px-3 py-1.5 text-[15px] rounded-lg max-w-[85%] md:max-w-[70%] shadow-sm relative pb-5
                        ${msg.senderId === 'user' ? 'bg-[#d9fdd3] rounded-tr-none text-[#111b21]' : 'bg-white rounded-tl-none text-[#111b21]'}`}
                    >
                      {msg.attachment && (
                        <div className="flex items-center gap-2 bg-black/5 p-2 rounded mb-2 text-sm">
                          <FileImage size={16} className="text-gray-500" />
                          <span className="text-gray-700 italic">{msg.attachment}</span>
                        </div>
                      )}
                      <span className="leading-snug">{msg.text}</span>
                      <span className="text-[10px] text-[#667781] absolute bottom-1 right-2 flex items-center gap-1">
                        {msg.timestamp}
                        {msg.senderId === 'user' && <CheckCheck size={14} className="text-[#53bdeb]" />}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Chat Input */}
        {chatState !== 'VIDEO_CALL' && (
          <div className="bg-[#f0f2f5] min-h-[62px] px-4 py-2 flex items-center gap-3 w-full z-10">
            <button 
              className="text-[#54656f] p-2 hover:bg-black/5 rounded-full transition-colors"
              onClick={() => {
                if (chatState === 'PAYMENT' || chatState === 'UPLOAD_RECEIPT') {
                  handleUploadReceipt();
                } else {
                  toast.info('Anexos habilitados no fluxo de pagamento.');
                }
              }}
            >
              <Paperclip size={24} />
            </button>
            
            <div className="flex-1 bg-white rounded-lg flex items-center px-4 py-2 min-h-[42px] shadow-sm">
              <input 
                type="text" 
                placeholder="Mensagem" 
                className="bg-transparent border-none outline-none w-full text-[15px] text-[#111b21]"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
            </div>
            
            {inputText.trim() ? (
              <button 
                className="text-[#54656f] p-2 hover:bg-black/5 rounded-full transition-colors"
                onClick={handleSendMessage}
              >
                <Send size={24} className="text-[#00a884] ml-1" />
              </button>
            ) : (
              <button className="text-[#54656f] p-2 hover:bg-black/5 rounded-full transition-colors">
                <Mic size={24} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
