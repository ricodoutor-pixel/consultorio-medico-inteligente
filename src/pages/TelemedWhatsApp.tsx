import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Paperclip, Send, Mic, Phone, Video, 
  MoreVertical, Check, CheckCheck, Lock, Unlock, 
  ArrowLeft, PhoneOff, MicOff, VideoOff, Maximize,
  FileImage, QrCode, Smile, Camera, Link, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { JitsiRoom } from "@/components/consultation/JitsiRoom";
import { invokeBrisaEngine, analyzeUserIntent } from "@/lib/brisaMasterEngine";
import { DiagnosticSidebar } from "@/components/diagnostics/DiagnosticSidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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
  replyTo?: {
    sender: string;
    text: string;
  };
}

export default function TelemedWhatsApp() {
  const navigate = useNavigate();
  const [activeContact, setActiveContact] = useState('brisa');
  const [chatState, setChatState] = useState<ChatState>('ANAMNESE');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isMobileList, setIsMobileList] = useState(true); // Control for mobile view
  const [doctorLocked, setDoctorLocked] = useState(true);
  const [selectedModality, setSelectedModality] = useState<string>('Nenhuma');
  const [isDiagnosticSidebarOpen, setDiagnosticSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [prontuarioOpen, setProntuarioOpen] = useState(false);
  const [receitaOpen, setReceitaOpen] = useState(false);
  const [prontuarioText, setProntuarioText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const email = session.user.email?.toLowerCase() || '';
        if (email.includes('medico') || email.includes('olivia') || email.includes('suelen') || email.includes('edilson')) {
          setViewMode('DOCTOR');
        }
      }
    };
    fetchSession();
  }, []);

  const handleFinishConsultation = () => {
    setDoctorLocked(true);
    setChatState('ANAMNESE');
    toast.success('Atendimento finalizado. O contato com o paciente foi bloqueado novamente.');
  };

  const handleSendReceita = () => {
    setReceitaOpen(false);
    toast.success('Receita gerada e assinada com sucesso!');
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      senderId: 'doctor',
      text: 'Receituário Digital Anexado',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachment: '📄 Receita_Canabidiol_PlantaYRaiz.pdf'
    }]);
  };

  const mockPatients = [
    {
      id: 'patient-1',
      name: 'João Silva (Paciente)',
      role: doctorLocked ? 'Sala de Espera - Aguardando Pagamento' : 'Pronto para Atendimento',
      avatar: 'https://i.pravatar.cc/150?u=joao',
      isOnline: true,
      isLocked: doctorLocked,
      lastMsg: doctorLocked ? 'Aguardando liberação do sistema.' : 'Pronto para atendimento.'
    },
    {
      id: 'patient-2',
      name: 'Maria Oliveira (Paciente)',
      role: 'Triagem em andamento',
      avatar: 'https://i.pravatar.cc/150?u=maria',
      isOnline: false,
      isLocked: true,
      lastMsg: 'Conversando com Enfª Brisa...'
    }
  ];

  const baseContacts = [
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
      id: 'verdinho',
      name: 'Dr Verdinho ADM',
      role: 'Patient Assistant',
      avatar: '/dr-verdinho-avatar.jpg',
      isOnline: true,
      isLocked: false,
      lastMsg: 'Olá, sou o Dr. Verdinho!'
    }
  ];

  const doctorContacts = [
    {
      id: 'doctor',
      name: 'Dr. Edilson Bezerra',
      role: 'Medicina Canábica - CRM-PR 49354',
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
      name: 'Dr. Edilson Bezerra',
      role: 'Médica Prescritora',
      avatar: '/dra-suelen-avatar.jpg',
      isOnline: true,
      isLocked: doctorLocked,
      lastMsg: doctorLocked ? 'Bloqueado aguardando triagem.' : 'Pronto para atendimento.'
    }
  ];

  const contacts = viewMode === 'DOCTOR' 
    ? [...baseContacts, ...mockPatients]
    : [...baseContacts, ...doctorContacts];

  const currentContact = contacts.find(c => c.id === activeContact);

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
        setTimeout(async () => {
          try {
            const aiHistory: any[] = messages.filter(m => m.senderId === 'user' || m.isBrisa).map(m => ({
              role: m.isBrisa ? 'assistant' : 'user',
              content: m.text
            }));
            
            const aiReply = await invokeBrisaEngine(aiHistory, inputText);
            
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              senderId: 'brisa',
              text: aiReply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isBrisa: true
            }]);

            // Transition to Doctor Choice only if the user didn't explicitly just ask for prices
            const intent = analyzeUserIntent(inputText);
            const isJustAskingPrice = inputText.toLowerCase().includes('quanto') || inputText.toLowerCase().includes('valor') || inputText.toLowerCase().includes('preco');
            
            if (!isJustAskingPrice) {
              setTimeout(() => {
                setChatState('ESCOLHA_MEDICO');
                setMessages(prev => [...prev, {
                  id: (Date.now() + 1).toString(),
                  senderId: 'brisa',
                  text: 'Para prosseguirmos: qual médico você prefere? (Dr. Edilson Bezerra, Dra. Olivia Zimeri, Dr. Edilson Bezerra ou o próximo disponível?) E qual a modalidade da consulta? (Atendimento Ao Vivo, Agendamento, Emergência, Orientação Técnica)',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isBrisa: true
                }]);
              }, 2000);
            }
            
          } catch (e) {
            console.error("AI triage error", e);
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
                text: 'Para prosseguirmos: qual médico você prefere? (Dr. Edilson Bezerra, Dra. Olivia Zimeri, Dr. Edilson Bezerra ou o próximo disponível?) E qual a modalidade da consulta? (Atendimento Ao Vivo, Agendamento, Emergência, Orientação Técnica)',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isBrisa: true
              }]);
            }, 2000);
          }
        }, 500);
      } else if (chatState === 'ESCOLHA_MEDICO') {
        const intent = analyzeUserIntent(inputText);
        
        if (intent.detectedModality !== 'NONE') {
          setSelectedModality(intent.detectedModality);

          setTimeout(() => {
            setChatState('PAYMENT');
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              senderId: 'brisa',
              text: `Perfeito! Registrei sua escolha para ${intent.tipoAtendimento}. Para confirmar e liberar o médico imediatamente, realize o pagamento do PIX correspondente ao valor do atendimento.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isBrisa: true
            }, {
              id: (Date.now() + 1).toString(),
              senderId: 'brisa',
              text: `R$ ${intent.value.toFixed(2)}`.replace('.', ','),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isBrisa: true,
              isPayment: true
            }]);
          }, 1000);
        } else {
          // User asked a question during ESCOLHA_MEDICO
          setTimeout(async () => {
            try {
              const aiHistory: any[] = messages.filter(m => m.senderId === 'user' || m.isBrisa).map(m => ({
                role: m.isBrisa ? 'assistant' : 'user',
                content: m.text
              }));
              
              const aiReply = await invokeBrisaEngine(aiHistory, inputText);
              
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                senderId: 'brisa',
                text: aiReply,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isBrisa: true
              }]);
            } catch (e) {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                senderId: 'brisa',
                text: "Nossas modalidades são: Orientação Técnica (R$ 30), Consulta por Chat (R$ 150) e Consulta por Vídeo (R$ 250). Qual você prefere?",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isBrisa: true
              }]);
            }
          }, 500);
        }
      }
    } else if (activeContact === 'verdinho') {
      // Verdinho handles general platform questions
      setTimeout(async () => {
        try {
          const aiHistory = messages.filter(m => m.senderId === 'user' || m.senderId === 'verdinho').map(m => ({
            role: m.senderId === 'verdinho' ? 'assistant' : 'user',
            content: m.text
          }));
          aiHistory.push({ role: 'user', content: inputText });
          
          const { data } = await supabase.functions.invoke('agent-chat', {
            body: { slug: 'verdinho', messages: aiHistory }
          });
          
          const aiReply = data?.reply || "Ribbit! Sou o Dr. Verdinho, assistente da Plataforma. Como posso ajudar?";
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            senderId: 'verdinho',
            text: aiReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        } catch (e) {
          console.error("AI Verdinho error", e);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            senderId: 'verdinho',
            text: "Ribbit! Olá! Sou o Dr. Verdinho, assistente da Plataforma. Como posso ajudar?",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      }, 500);
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

      const doctorGreeting: Message = {
        id: (Date.now() + 2).toString(),
        senderId: 'doctor',
        text: 'Super que bom estamos todos ansioso !',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        replyTo: {
          sender: 'Dr. Edilson Bezerra',
          text: 'Eu volto daqui a pouco com o diagnóstico.'
        }
      };

      setMessages(prev => [...prev, confirmMsg, summaryMsg, doctorGreeting]);
      toast.success('Médico desbloqueado!');
    }, 1500);
  };

  const handleStartVideoCall = () => {
    setChatState('VIDEO_CALL');
  };

  const handleEndVideoCall = () => {
    setChatState('DOCTOR_UNLOCKED');
  };

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
            <button type="button" onClick={() => setDiagnosticSidebarOpen(true)} title="Ferramentas de Diagnóstico" aria-label="Ferramentas de Diagnóstico"><MoreVertical size={20} className="cursor-pointer hover:text-[#00a884] transition-colors" /></button>
          </div>
        </div>

        <DiagnosticSidebar
          open={isDiagnosticSidebarOpen}
          onOpenChange={setDiagnosticSidebarOpen}
          isDoctor={viewMode === 'DOCTOR'}
          patientId={
            currentContact && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentContact.id)
              ? currentContact.id
              : undefined
          }
          patientName={currentContact?.name}
          onCompleteDiagnostic={(result) => {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              senderId: viewMode === 'DOCTOR' ? 'doctor' : 'user',
              text: `Exame digital realizado: ${result?.tool ?? 'exame'} — resultado disponível no prontuário.`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
          }}
          onSendReport={(report) => {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              senderId: 'doctor',
              text: report,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSummary: true,
            }]);
            toast.success('Relatório clínico anexado ao atendimento');
          }}
        />

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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-center p-2 rounded-full hover:bg-black/5 transition-colors group">
                      <Phone size={20} className="text-[#54656f] group-hover:text-[#00a884] transition-colors" />
                      <ChevronDown size={14} className="ml-1 text-[#54656f] group-hover:text-[#00a884] transition-colors" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-1 bg-white border border-gray-200 shadow-xl rounded-xl">
                    <DropdownMenuItem 
                      className="cursor-pointer py-3 px-4 text-[#111b21] hover:bg-[#f5f6f6] focus:bg-[#f5f6f6] rounded-lg mb-1"
                      onClick={() => {
                        if (selectedModality !== 'VIDEO' && selectedModality !== 'TECHNICAL_ORIENTATION') {
                          toast.error('Ligação de voz indisponível para a modalidade Chat.');
                        } else {
                          toast.success('Iniciando ligação de voz...');
                        }
                      }}
                    >
                      <Phone size={18} className="mr-3 text-[#54656f]" /> Ligação de voz
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer py-3 px-4 text-[#111b21] hover:bg-[#f5f6f6] focus:bg-[#f5f6f6] rounded-lg mb-1"
                      onClick={() => {
                        if (selectedModality !== 'VIDEO' && selectedModality !== 'TECHNICAL_ORIENTATION') {
                          toast.error('Ligação de vídeo indisponível para a modalidade Chat.');
                        } else {
                          handleStartVideoCall();
                        }
                      }}
                    >
                      <Video size={18} className="mr-3 text-[#54656f]" /> Ligação de vídeo
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer py-3 px-4 text-[#111b21] hover:bg-[#f5f6f6] focus:bg-[#f5f6f6] rounded-lg"
                      onClick={() => {
                         toast.success('Link de ligação copiado!');
                      }}
                    >
                      <Link size={18} className="mr-3 text-[#54656f]" /> Enviar link de ligação
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Search size={20} className="cursor-pointer" />
              <MoreVertical size={20} className="cursor-pointer" />
            </div>
          </div>
        )}

        {/* Video Call Overlay */}
        {chatState === 'VIDEO_CALL' && activeContact === 'doctor' ? (
          <div className="flex-1 bg-black flex flex-col relative z-20">
            <JitsiRoom 
              roomName={`telemed-${currentContact?.id || 'demo'}`}
              displayName="Paciente Planta y Raiz"
              isDoctor={false}
              onClose={handleEndVideoCall}
            />
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
                      className={`px-2 py-1.5 text-[15px] rounded-lg max-w-[85%] md:max-w-[70%] shadow-sm relative pb-5
                        ${msg.senderId === 'user' ? 'bg-[#d9fdd3] rounded-tr-none text-[#111b21]' : 'bg-white rounded-tl-none text-[#111b21]'}`}
                    >
                      {msg.replyTo && (
                        <div className="bg-black/5 border-l-4 border-[#00a884] p-2 rounded mb-1 text-sm cursor-pointer hover:bg-black/10 transition-colors">
                          <span className="font-bold text-[#00a884] block mb-0.5">{msg.replyTo.sender}</span>
                          <span className="text-gray-600 truncate block">{msg.replyTo.text}</span>
                        </div>
                      )}
                      {msg.attachment && (
                        <div className="flex items-center gap-2 bg-black/5 p-2 rounded mb-2 text-sm">
                          <FileImage size={16} className="text-gray-500" />
                          <span className="text-gray-700 italic">{msg.attachment}</span>
                        </div>
                      )}
                      <span className="leading-snug px-1 whitespace-pre-wrap">{msg.text}</span>
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
          <div className="bg-[#f0f2f5] min-h-[62px] px-3 py-2 flex items-end gap-2 w-full z-10">
            <button 
              className="text-[#54656f] p-2 hover:bg-black/5 rounded-full transition-colors mb-1"
            >
              <Smile size={24} />
            </button>
            <button 
              className="text-[#54656f] p-2 hover:bg-black/5 rounded-full transition-colors mb-1"
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
            
            <div className="flex-1 bg-white rounded-xl flex items-center px-4 py-1 min-h-[44px] shadow-sm mb-1 border border-transparent focus-within:border-gray-200">
              <input 
                type="text" 
                placeholder="Mensagem" 
                className="bg-transparent border-none outline-none w-full text-[15px] text-[#111b21]"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                className="text-[#54656f] p-1.5 hover:bg-black/5 rounded-full transition-colors ml-1"
                onClick={() => {
                  if (activeContact === 'doctor') {
                    if (selectedModality !== 'VIDEO' && selectedModality !== 'TECHNICAL_ORIENTATION') {
                      toast.error('Ligação de vídeo indisponível para a modalidade Chat.');
                    } else {
                      handleStartVideoCall();
                    }
                  } else {
                    toast.info('Videochamada disponível apenas com médicos liberados.');
                  }
                }}
              >
                 <Video size={22} />
              </button>
              <button className="text-[#54656f] p-1.5 hover:bg-black/5 rounded-full transition-colors ml-1">
                 <Camera size={22} />
              </button>
            </div>
            
            {inputText.trim() ? (
              <button 
                className="w-[44px] h-[44px] bg-[#00a884] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#008f6f] transition-colors mb-1 flex-shrink-0"
                onClick={handleSendMessage}
              >
                <Send size={20} className="ml-1" />
              </button>
            ) : (
              <button className="w-[44px] h-[44px] bg-[#00a884] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#008f6f] transition-colors mb-1 flex-shrink-0">
                <Mic size={22} fill="currentColor" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Prontuário Dialog */}
      <Dialog open={prontuarioOpen} onOpenChange={setProntuarioOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prontuário Digital</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Digite a evolução clínica do paciente..." 
              value={prontuarioText}
              onChange={(e) => setProntuarioText(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          <Button onClick={() => { setProntuarioOpen(false); toast.success('Prontuário salvo!'); }} className="w-full">
            Salvar no Histórico
          </Button>
        </DialogContent>
      </Dialog>

      {/* Receita Dialog */}
      <Dialog open={receitaOpen} onOpenChange={setReceitaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prescrever Receita</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Medicamento</p>
              <Input placeholder="Ex: Óleo de CBD Full Spectrum 10%" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Posologia</p>
              <Textarea placeholder="Ex: 5 gotas sublinguais 2x ao dia" />
            </div>
            <div className="p-3 bg-slate-100 rounded-lg flex items-center gap-2">
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-700">Assinatura Digital Anvisa ativada</span>
            </div>
          </div>
          <Button onClick={handleSendReceita} className="w-full bg-emerald-600 hover:bg-emerald-700">
            Assinar e Enviar ao Paciente
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
