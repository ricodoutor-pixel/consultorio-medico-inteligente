import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Phone, Video, MoreVertical, Paperclip, Smile } from 'lucide-react';

export default function ChatRealtime() {
  const [conversations, setConversations] = useState([
    {
      id: 1,
      name: 'Dr. Carlos Silva',
      avatar: '👨‍⚕️',
      lastMessage: 'Como você está se sentindo?',
      timestamp: '14:30',
      unread: 2,
      online: true,
    },
    {
      id: 2,
      name: 'Dra. Maria Santos',
      avatar: '👩‍⚕️',
      lastMessage: 'Sua prescrição está pronta',
      timestamp: '12:15',
      unread: 0,
      online: true,
    },
  ]);

  const [selectedConversation, setSelectedConversation] = useState(1);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Dr. Carlos Silva',
      message: 'Olá! Como posso ajudar?',
      timestamp: '14:00',
      isOwn: false,
    },
    {
      id: 2,
      sender: 'Você',
      message: 'Gostaria de discutir meu tratamento',
      timestamp: '14:05',
      isOwn: true,
    },
    {
      id: 3,
      sender: 'Dr. Carlos Silva',
      message: 'Claro! Vamos começar com algumas perguntas sobre seus sintomas.',
      timestamp: '14:10',
      isOwn: false,
    },
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          sender: 'Você',
          message: newMessage,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          isOwn: true,
        },
      ]);
      setNewMessage('');

      // Simular resposta do profissional
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: prev.length + 1,
            sender: 'Dr. Carlos Silva',
            message: 'Entendi. Vou analisar isso e enviar uma recomendação.',
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            isOwn: false,
          },
        ]);
      }, 2000);
    }
  };

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27]">
      {/* HEADER */}
      <div className="bg-[#0A0E27]/80 backdrop-blur-sm border-b border-[#00FF00]/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-white">Chat em Tempo Real</h1>
          <p className="text-gray-400">Comunique-se com seus profissionais de saúde</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6 h-[600px]">
          {/* LISTA DE CONVERSAS */}
          <Card className="bg-white/5 border border-[#00FF00]/20 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#00FF00]/20">
              <Input
                type="text"
                placeholder="Buscar conversa..."
                className="bg-white/10 border-[#00FF00]/30 text-white"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-4 border-b border-white/10 text-left transition-colors ${
                    selectedConversation === conv.id
                      ? 'bg-[#00FF00]/20 border-l-2 border-l-[#00FF00]'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <span className="text-2xl">{conv.avatar}</span>
                      {conv.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00FF00] rounded-full border-2 border-[#0A0E27]"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm">{conv.name}</h3>
                      <p className="text-gray-400 text-xs truncate">{conv.lastMessage}</p>
                      <p className="text-gray-500 text-xs mt-1">{conv.timestamp}</p>
                    </div>
                    {conv.unread > 0 && (
                      <div className="bg-[#9D4EDD] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conv.unread}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* ÁREA DE CHAT */}
          <Card className="lg:col-span-3 bg-white/5 border border-[#00FF00]/20 overflow-hidden flex flex-col">
            {/* HEADER DO CHAT */}
            <div className="p-4 border-b border-[#00FF00]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentConversation?.avatar}</span>
                <div>
                  <h2 className="text-white font-bold">{currentConversation?.name}</h2>
                  <p className="text-xs text-[#00FF00]">
                    {currentConversation?.online ? '● Online' : '● Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Phone className="w-5 h-5 text-[#00FF00]" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Video className="w-5 h-5 text-[#9D4EDD]" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* MENSAGENS */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-lg ${
                      msg.isOwn
                        ? 'bg-[#00FF00] text-[#0A0E27] rounded-br-none'
                        : 'bg-white/10 text-white rounded-bl-none border border-white/20'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.isOwn ? 'text-[#0A0E27]/70' : 'text-gray-400'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white px-4 py-3 rounded-lg rounded-bl-none border border-white/20">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT DE MENSAGEM */}
            <div className="p-4 border-t border-[#00FF00]/20">
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5 text-gray-400" />
                </button>
                <Input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-white/10 border-[#00FF00]/30 text-white"
                />
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Smile className="w-5 h-5 text-gray-400" />
                </button>
                <Button
                  onClick={handleSendMessage}
                  className="bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00] font-bold"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
