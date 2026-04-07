import React, { useState } from "react";
import { Search, Send, MessageCircle, ChevronDown, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Interactive FAQ Page with AI-Powered Responses
 * Respostas automáticas baseadas em IA para dúvidas de pacientes
 */

interface FAQItem {
  id: string;
  question: string;
  category: string;
  views: number;
  helpful: number;
  aiGenerated: boolean;
}

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

const COMMON_QUESTIONS = [
  {
    id: "1",
    question: "Como funciona a consulta com especialista?",
    category: "Consultas",
    views: 1250,
    helpful: 890,
    aiGenerated: false,
  },
  {
    id: "2",
    question: "Qual é o tempo médio de resposta do especialista?",
    category: "Consultas",
    views: 980,
    helpful: 750,
    aiGenerated: false,
  },
  {
    id: "3",
    question: "Como recebo minha receita digital?",
    category: "Receitas",
    views: 1100,
    helpful: 920,
    aiGenerated: false,
  },
  {
    id: "4",
    question: "Quais são os efeitos colaterais do cannabis medicinal?",
    category: "Saúde",
    views: 2100,
    helpful: 1650,
    aiGenerated: true,
  },
  {
    id: "5",
    question: "Como funciona o sistema de indicação?",
    category: "Indicações",
    views: 850,
    helpful: 680,
    aiGenerated: false,
  },
  {
    id: "6",
    question: "Qual é o prazo de entrega do marketplace?",
    category: "Marketplace",
    views: 1450,
    helpful: 1100,
    aiGenerated: false,
  },
];

const AI_RESPONSES: Record<string, string> = {
  "como funciona a consulta": `A consulta funciona de forma simples e segura:

1. **Escolha o especialista** - Navegue por nosso diretório de médicos, farmacêuticos e terapeutas verificados
2. **Agende a consulta** - Escolha data e hora disponível
3. **Faça a pré-entrevista** - Responda perguntas sobre seu histórico médico
4. **Pague via PIX** - Pagamento seguro e instantâneo
5. **Consulte via chat/vídeo** - Converse com o especialista na plataforma
6. **Receba receita digital** - Assinada digitalmente e válida em farmácias

Todo o processo leva em média 15 minutos!`,

  "tempo de resposta": `O tempo médio de resposta dos especialistas é:

- **Chat**: 5-15 minutos (se especialista está online)
- **Vídeo**: Agendado com antecedência
- **Receita**: Emitida imediatamente após consulta

Você pode ver o status de disponibilidade (bolinha verde) de cada especialista antes de escolher.`,

  "receita digital": `Sua receita digital é:

✅ **Gerada automaticamente** após a consulta
✅ **Assinada digitalmente** com certificado ICP-Brasil
✅ **ANVISA-compliant** - válida em qualquer farmácia
✅ **Enviada por email** e SMS
✅ **Acessível na plataforma** 24/7
✅ **Renovável** sem necessidade de nova consulta

Você pode compartilhar o QR Code com a farmácia ou farmacêutico!`,

  "efeitos colaterais": `Os efeitos colaterais do cannabis medicinal são geralmente leves:

**Comuns:**
- Boca seca
- Olhos vermelhos
- Tonturas leves
- Fadiga

**Menos comuns:**
- Ansiedade (com THC alto)
- Alterações de apetite
- Problemas de memória curta

**Importante:** Sempre consulte com um especialista antes de usar. Nossos médicos irão personalizar a dosagem para minimizar efeitos colaterais.`,

  "sistema de indicação": `Ganhe comissões indicando amigos:

1. **Copie seu código** de indicação único
2. **Compartilhe** com amigos via WhatsApp, email, etc
3. **Amigos se cadastram** usando seu código
4. **Você ganha R$ 10-50** por indicação bem-sucedida
5. **Bônus mensal** para top indicadores (até R$ 5.000)

Sem limite de indicações! Quanto mais você compartilha, mais você ganha.`,

  "prazo de entrega": `Nosso marketplace oferece:

📦 **Frete Grátis** em todo Brasil
⏱️ **Entrega 24-48h** nas principais cidades
🏙️ **Entrega 3-5 dias** no interior

Você acompanha o pedido em tempo real na plataforma com rastreamento completo.`,

  "anvisa": `Planta & Raiz é 100% ANVISA-compliant:

✅ **RDC 327/2019** - Prescrição eletrônica
✅ **RDC 660/2022** - Cannabis medicinal
✅ **RDC 751/2022** - Aplicativos de saúde
✅ **CFM 2.299/2021** - Telemedicina

Todos os especialistas são verificados e licenciados. Todas as receitas são válidas em farmácias autorizadas.`,

  "segurança": `Sua segurança é nossa prioridade:

🔒 **Criptografia SSL** - Dados protegidos
🔐 **LGPD-compliant** - Privacidade garantida
💳 **PCI-DSS** - Pagamentos seguros
🛡️ **Backup automático** - Dados sempre salvos
🚨 **Monitoramento 24/7** - Detecção de fraudes

Seus dados de saúde nunca são compartilhados com terceiros.`,

  "preço": `Os preços na Planta & Raiz são os mais competitivos:

💰 **Consultas**: R$ 30-150 (você escolhe o especialista)
📦 **Marketplace**: Até 50% mais barato que farmácias físicas
🚚 **Frete**: Grátis em todo Brasil
💸 **Reembolso**: Cobertura de seguros de saúde

Sem taxas escondidas. Transparência total!`,
};

export default function InteractiveFAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const categories = ["Consultas", "Receitas", "Saúde", "Indicações", "Marketplace", "Segurança"];

  const filteredQuestions = COMMON_QUESTIONS.filter((q) => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || q.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: "user",
      content: userInput,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, userMessage]);
    setUserInput("");
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      let aiResponse = "Desculpe, não consegui entender sua pergunta. Tente reformular ou escolha uma das perguntas frequentes abaixo.";

      // Simple keyword matching for AI responses
      const lowerInput = userInput.toLowerCase();
      for (const [keyword, response] of Object.entries(AI_RESPONSES)) {
        if (lowerInput.includes(keyword)) {
          aiResponse = response;
          break;
        }
      }

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        type: "ai",
        content: aiResponse,
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Central de Ajuda - Planta & Raiz
          </h1>
          <p className="text-xl text-slate-300">
            Respostas automáticas com IA para suas dúvidas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - FAQ List */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 sticky top-4">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Perguntas Frequentes
                </h2>

                {/* Search */}
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-slate-300 mb-3">Categorias</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        !selectedCategory
                          ? "bg-green-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      Todas
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedCategory === cat
                            ? "bg-green-600 text-white"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FAQ Items */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredQuestions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setExpandedFAQ(expandedFAQ === q.id ? null : q.id)}
                      className="w-full text-left p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-white font-medium line-clamp-2">
                          {q.question}
                        </p>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${
                            expandedFAQ === q.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                      {expandedFAQ === q.id && (
                        <div className="mt-3 pt-3 border-t border-slate-600">
                          <p className="text-xs text-slate-400">
                            {q.views} visualizações • {q.helpful} úteis
                          </p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Right Content - Chat */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 h-full flex flex-col">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-t-lg">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Assistente IA
                </h2>
                <p className="text-green-100 text-sm mt-1">
                  Disponível 24/7 para responder suas dúvidas
                </p>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-96">
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <MessageCircle className="w-10 h-10 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">
                        Olá! Sou o assistente IA da Planta & Raiz.
                      </p>
                      <p className="text-slate-500 text-sm mt-2">
                        Faça suas perguntas e receba respostas instantâneas!
                      </p>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          msg.type === "user"
                            ? "bg-green-600 text-white rounded-br-none"
                            : "bg-slate-700 text-slate-100 rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs mt-2 opacity-70">
                          {msg.timestamp.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 text-slate-100 px-4 py-3 rounded-lg rounded-bl-none">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="border-t border-slate-700 p-6">
                <div className="flex gap-3">
                  <Input
                    placeholder="Digite sua pergunta..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !userInput.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  💡 Dica: Pergunte sobre consultas, receitas, segurança, preços, indicações ou
                  marketplace!
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Trust Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700 p-6 text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">24/7</div>
            <p className="text-slate-300">Disponível sempre</p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6 text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">IA Avançada</div>
            <p className="text-slate-300">Respostas inteligentes</p>
          </Card>
          <Card className="bg-slate-800 border-slate-700 p-6 text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">100% Seguro</div>
            <p className="text-slate-300">Seus dados protegidos</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
