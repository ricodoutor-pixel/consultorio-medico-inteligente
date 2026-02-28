import { useState, useRef, useEffect } from "react";
import { X, Send, Stethoscope, Dumbbell, Brain, Settings, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FrogMascot } from "@/components/FrogMascot";

type PersonalityMode = "medico" | "coach" | "psicologo" | "admin" | "amigo";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  personality?: PersonalityMode;
}

const personalityConfig: Record<PersonalityMode, { label: string; emoji: string; color: string; icon: typeof Stethoscope }> = {
  medico: { label: "Médico", emoji: "🩺", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Stethoscope },
  coach: { label: "Coach", emoji: "💪", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: Dumbbell },
  psicologo: { label: "Psicólogo", emoji: "🧠", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Brain },
  admin: { label: "Admin", emoji: "⚙️", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30", icon: Settings },
  amigo: { label: "Amigo", emoji: "😄", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: Smile },
};

const personalityResponses: Record<PersonalityMode, Record<string, string>> = {
  medico: {
    dor: "Entendo que está com dor. Pode ser muscular, articular ou neuropática. Recomendo: repouso, compressas e analgésico leve. Se persistir >3 dias ou for intensa, agende consulta com especialista. ⚠️ Consulte um profissional para diagnóstico definitivo.",
    cabeça: "Dor de cabeça pode ser tensional, enxaqueca ou ter outras causas. Hidrate-se, descanse em ambiente escuro e tome analgésico leve. Se for recorrente ou intensa, procure um neurologista. ⚠️ Consulte um profissional.",
    insônia: "A insônia pode ter diversas causas: estresse, hábitos ruins, condições médicas. Dicas: evite telas 1h antes de dormir, mantenha horários regulares, ambiente escuro e fresco. Cannabis medicinal com CBD pode auxiliar — consulte um prescritor. ⚠️ Consulte um profissional.",
    ansiedade: "A ansiedade é uma resposta natural, mas quando excessiva precisa de atenção. Técnicas de respiração (4-7-8), exercício regular e terapia são eficazes. CBD tem mostrado resultados promissores em estudos. ⚠️ Consulte um profissional para tratamento adequado.",
    cannabis: "A cannabis medicinal possui mais de 100 canabinoides. O CBD é anti-inflamatório e ansiolítico, enquanto o THC ajuda na dor e náusea. A prescrição deve ser individualizada por um médico habilitado. ⚠️ Consulte um profissional.",
    sintoma: "Para avaliar seus sintomas adequadamente, recomendo agendar uma consulta com um de nossos especialistas. Eles farão uma análise completa e, se indicado, prescreverão o tratamento mais adequado. ⚠️ Consulte um profissional.",
    medicamento: "Medicamentos à base de cannabis devem ser prescritos por médicos habilitados. Temos óleos (CBD, THC, full spectrum), cápsulas, pomadas e flores. Cada paciente tem necessidades específicas. ⚠️ Consulte um profissional antes de iniciar qualquer tratamento.",
    epilepsia: "O CBD tem evidências robustas para epilepsia refratária, especialmente em síndromes como Dravet e Lennox-Gastaut. A Charlotte's Web foi desenvolvida especificamente para este uso. ⚠️ Consulte um neurologista especializado.",
    depressão: "A depressão é uma condição séria que requer acompanhamento profissional. Algumas variedades sativa com perfil específico de terpenos podem auxiliar como complemento ao tratamento. ⚠️ Consulte um psiquiatra.",
    default: "Como assistente médico, posso orientar sobre sintomas, medicamentos e tratamentos com cannabis medicinal. Descreva sua queixa e farei uma orientação inicial. ⚠️ Lembre-se: consulte sempre um profissional para diagnóstico definitivo.",
  },
  coach: {
    peso: "Ótimo objetivo! 3 pilares: 1) Déficit calórico moderado (~500 kcal/dia), 2) Proteína em cada refeição (1.6g/kg), 3) 30min de atividade física diária. Comece hoje com uma caminhada! 💪",
    exercício: "Para começar: 3x/semana de treino é suficiente. Dia 1: superior, Dia 2: inferior, Dia 3: full body. 20min cardio pós-treino. Aumente gradualmente. Consistência > intensidade! 🏋️",
    dieta: "Foque em alimentos reais: proteínas magras, vegetais coloridos, gorduras boas e carboidratos complexos. Evite ultraprocessados. Hidrate-se (35ml/kg). Não faça dietas radicais — sustentabilidade é a chave! 🥗",
    stress: "Estresse crônico sabota sua saúde. Rotina anti-stress: 1) 7-8h de sono, 2) Exercício regular, 3) 10min de meditação, 4) Limite cafeína após 14h, 5) Desconecte 1h antes de dormir. Você consegue! ✨",
    sono: "Sono de qualidade é o pilar #1 da saúde. Dicas: quarto escuro e fresco (18-20°C), horário fixo, sem telas 1h antes, evite álcool e café à noite. CBD pode ajudar na regulação — consulte um médico. 😴",
    nutrição: "Regra dos 80/20: 80% alimentos nutritivos, 20% flexibilidade. Inclua: verduras em cada refeição, 2-3 frutas/dia, proteína adequada, e hidratação. Suplementos: vitamina D e ômega-3 são os mais importantes. 🌱",
    motivação: "Motivação é momentânea — disciplina é permanente. Comece com hábitos pequenos: 5min de exercício, 1 copo de água ao acordar. Aumente 1% por semana. Em 1 ano você será outra pessoa! 🚀",
    default: "Sou seu Coach de Saúde! Posso ajudar com fitness, nutrição, hábitos saudáveis e bem-estar geral. Qual é seu objetivo hoje? 💪🌱",
  },
  psicologo: {
    ansiedade: "Sua ansiedade é válida e merece atenção. Técnica imediata: respiração 4-7-8 (inspire 4s, segure 7s, expire 8s). Repita 4x. Grounding: nomeie 5 coisas que vê, 4 que toca, 3 que ouve. Você não está sozinho. 🤍",
    triste: "É natural sentir tristeza. Permita-se sentir sem julgamento. Algumas estratégias: converse com alguém de confiança, pratique autocuidado, saia ao ar livre. Se persistir por mais de 2 semanas, procure um profissional. Estou aqui por você. 💙",
    medo: "O medo é uma emoção protetora, mas quando limitante precisa ser trabalhado. Técnica de exposição gradual: liste seus medos do menor ao maior, enfrente o menor primeiro. Celebre cada conquista. Você é mais forte do que pensa. 🌟",
    raiva: "A raiva é uma emoção válida. Antes de reagir: PARE, respire 3x profundamente, pergunte-se 'isso importará em 5 anos?'. Canalizar raiva em exercício ou escrita ajuda. Se for frequente, terapia cognitivo-comportamental é muito eficaz. 🧘",
    relacionamento: "Relacionamentos saudáveis precisam de: comunicação aberta, respeito mútuo, espaço individual e empatia. Se está passando por dificuldades, terapia de casal pode ajudar muito. Cuidar de si é o primeiro passo. 💚",
    autoestima: "Autoestima se constrói com ações, não pensamentos. Comece: liste 3 qualidades suas todo dia, estabeleça limites saudáveis, celebre pequenas conquistas. Comparação com outros é o ladrão da alegria. Você é único e suficiente. ✨",
    pânico: "Se está tendo uma crise de pânico agora: sente-se, pés no chão, respire lentamente (5s inspira, 5s expira). Lembre: crises de pânico NÃO são perigosas e passam em 10-20 minutos. Você vai ficar bem. Se recorrente, busque ajuda profissional. 🤍",
    default: "Sou o modo Psicólogo do Verdinho. Estou aqui para ouvir sem julgamento. Conte-me o que está sentindo — posso oferecer técnicas de acolhimento, respiração e mindfulness. Você importa. 🤍",
  },
  admin: {
    agendamento: "Para agendar uma consulta: 1) Clique em 'Telemedicina' no menu, 2) Faça a pré-entrevista IA (7 perguntas), 3) Escolha seu especialista, 4) Pague via PIX. Você receberá o link 15min antes! ✅",
    pagamento: "Aceitamos PIX (QR Code ou copia e cola) via Mercado Pago. Confirmação instantânea e automática. Consultas a partir de R$ 55. Também temos planos com desconto! 💳",
    cadastro: "Para se cadastrar: acesse /cadastro, preencha seus dados e confirme seu email. Em 2 minutos você tem acesso completo à plataforma! 📋",
    prescrição: "Prescrições digitais são certificadas ICP-Brasil e conformes com a ANVISA. Após a consulta, você recebe um código de validação para usar na farmácia parceira. 📄",
    perfil: "Para editar seu perfil: clique no ícone de usuário no menu, acesse 'Meu Perfil' e atualize seus dados. Mantenha seu telefone e email atualizados para receber notificações. ⚙️",
    indicação: "Sistema de Indicação Premiada: ganhe 10% de comissão automática! Acesse /indicacoes, gere seu código único, compartilhe e receba via PIX. Sem limite de indicações! 🎁",
    shopping: "No Shopping você encontra medicamentos de farmácias autorizadas ANVISA: óleos, cápsulas, chás, pomadas. Frete grátis para todo o Brasil. Acesse /shopping! 🛒",
    download: "Nosso app está disponível para iOS e Android! Acesse /download para baixar. 125K+ downloads, nota 4.9★. Todas as funcionalidades na palma da sua mão! 📱",
    profissional: "Temos 500+ profissionais verificados: médicos prescritores, farmacêuticos, terapeutas e psicólogos. Filtre por especialidade, idioma e preço em /profissionais. 👨‍⚕️",
    default: "Posso ajudar com agendamento, pagamento, cadastro, prescrições, shopping e navegação na plataforma. O que precisa? ⚙️",
  },
  amigo: {
    piada: "Sabia que o sapo foi ao banco? Ele queria ver seu extrato... de lodo! 🐸😂 Quer outra?",
    rei: "Claro que sou rei! 👑 Veja minha coroa de ouro e meu manto real! Sou o rei da saúde digital! Mas meu verdadeiro reino é cuidar de você. Quer ver minha dança real? 🎉",
    nome: "Sou o Verdinho! 🐸 Mascote e assistente IA da Planta & Raiz. Tenho 5 personalidades: médico, coach, psicólogo, admin e amigo. Estou aqui 24/7 para ajudar! ✨",
    olá: "Eeeeae! 🐸👑 Bora lá! Posso ajudar com consultas médicas, dicas de saúde, apoio emocional, ou simplesmente bater um papo! O que tá afim?",
    tudo: "Tô ótimo, pulando de alegria como sempre! 🐸💚 E você? Conta aí, o que posso fazer pra deixar seu dia melhor? Tenho piadas, dicas de saúde e muito mais!",
    obrigado: "Disponha! 🐸💚 É um prazer ajudar! Se precisar de qualquer coisa, é só chamar. Tô aqui 24/7, sem folga, sem férias — porque sapo rei não descansa! 👑",
    carro: "Viu meus carrinhos de luxo? 🏎️ Ferrari, Lamborghini, Porsche e Tesla! Tudo orbitando ao meu redor! Quando você cuida da sua saúde, você também merece o melhor! 🚗✨",
    legal: "Valeu! 🐸 Fico feliz que curtiu! Se quiser explorar a plataforma, tenho várias sugestões. Ou se preferir, posso contar uma curiosidade sobre cannabis medicinal! 🌿",
    default: "Eae! 🐸👑 Sou o Verdinho, seu amigo sapo rei! Posso ajudar com saúde, consultas, ou simplesmente bater papo. Bora? 🎉",
  },
};

const detectPersonality = (text: string): PersonalityMode => {
  const lower = text.toLowerCase();

  // Check frustrated/angry → psicólogo
  const frustratedWords = ["frustrad", "raiva", "ódio", "odeio", "cansado disso", "não aguento", "porra", "merda"];
  if (frustratedWords.some(w => lower.includes(w))) return "psicologo";

  // Médico
  const medicoWords = ["sintoma", "dor", "doença", "medicament", "remed", "diagnóstic", "prescr", "receit", "epilepsia", "enxaqueca", "câncer", "tumor", "inflamação", "febre", "náusea", "vômit", "cannabis medic", "cbd", "thc", "canabidiol"];
  if (medicoWords.some(w => lower.includes(w))) return "medico";

  // Psicólogo
  const psiWords = ["ansied", "ansiosa", "ansioso", "depress", "triste", "tristeza", "medo", "pânico", "emocional", "emoção", "chorar", "choro", "angústia", "solidão", "sozinho", "autoestima", "suicíd", "trauma", "relacion"];
  if (psiWords.some(w => lower.includes(w))) return "psicologo";

  // Coach
  const coachWords = ["exercício", "treino", "academia", "dieta", "peso", "emagrec", "gordura", "proteína", "nutrição", "fitness", "musculação", "cardio", "sono", "dormir", "stress", "estress", "hábito", "motivação"];
  if (coachWords.some(w => lower.includes(w))) return "coach";

  // Admin
  const adminWords = ["agend", "consult", "pagam", "pix", "preç", "valor", "custo", "cadastr", "perfil", "indica", "comiss", "shop", "compra", "produto", "download", "app", "celular", "como func", "passo", "biblio", "profission"];
  if (adminWords.some(w => lower.includes(w))) return "admin";

  return "amigo";
};

const getResponse = (text: string, personality: PersonalityMode): string => {
  const lower = text.toLowerCase();
  const responses = personalityResponses[personality];

  for (const [key, value] of Object.entries(responses)) {
    if (key === "default") continue;
    if (lower.includes(key)) return value;
  }

  // Cross-check some broader keywords
  if (personality === "medico") {
    if (lower.includes("dor")) return responses.dor;
    if (lower.includes("cabeça")) return responses.cabeça;
    if (lower.includes("dormir") || lower.includes("sono")) return responses.insônia;
  }
  if (personality === "coach") {
    if (lower.includes("gordu") || lower.includes("emagrec")) return responses.peso;
    if (lower.includes("comer") || lower.includes("aliment")) return responses.nutrição;
  }
  if (personality === "psicologo") {
    if (lower.includes("nerv") || lower.includes("irrit")) return responses.raiva;
    if (lower.includes("mal") || lower.includes("sofr")) return responses.triste;
  }
  if (personality === "amigo") {
    if (lower.includes("oi") || lower.includes("olá") || lower.includes("eae") || lower.includes("hey")) return responses.olá;
    if (lower.includes("tudo bem") || lower.includes("como vai")) return responses.tudo;
    if (lower.includes("obrigad") || lower.includes("valeu")) return responses.obrigado;
  }

  return responses.default;
};

export const FrogChatModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Olá! 🐸👑 Sou o Verdinho, assistente IA premium da Planta & Raiz! Tenho 5 modos: 🩺 Médico, 💪 Coach, 🧠 Psicólogo, ⚙️ Admin e 😄 Amigo. Pergunte qualquer coisa!",
      sender: "ai",
      timestamp: new Date(),
      personality: "amigo",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPersonality, setCurrentPersonality] = useState<PersonalityMode>("amigo");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-frog-chat", handler);
    return () => window.removeEventListener("open-frog-chat", handler);
  }, []);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    const detectedPersonality = detectPersonality(inputValue);
    setCurrentPersonality(detectedPersonality);

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    setTimeout(() => {
      const aiResponse = getResponse(inputValue, detectedPersonality);

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: aiResponse,
          sender: "ai",
          timestamp: new Date(),
          personality: detectedPersonality,
        },
      ]);
      setIsLoading(false);
    }, 800);
  };

  if (!isOpen) return null;

  const currentConfig = personalityConfig[currentPersonality];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[70vh] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/10">
        <div className="flex items-center gap-2">
          <FrogMascot size={28} />
          <div>
            <p className="font-display font-black text-sm text-foreground">Verdinho 👑</p>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-muted-foreground font-semibold">IA Premium • 24/7</p>
              <Badge className={`text-[9px] px-1.5 py-0 h-4 border ${currentConfig.color}`}>
                {currentConfig.emoji} {currentConfig.label}
              </Badge>
            </div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%]">
              {message.sender === "ai" && message.personality && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1 inline-block border ${personalityConfig[message.personality].color}`}>
                  {personalityConfig[message.personality].emoji} {personalityConfig[message.personality].label}
                </span>
              )}
              <div
                className={`px-3 py-2 rounded-2xl text-sm ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                <p>{message.text}</p>
                <p className={`text-[10px] mt-1 ${message.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {message.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md text-sm text-muted-foreground">
              <span className="animate-pulse">{currentConfig.emoji} Digitando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Pergunte ao Verdinho..."
          className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        />
        <Button size="icon" onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className="rounded-xl bg-primary text-primary-foreground h-9 w-9">
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
};
