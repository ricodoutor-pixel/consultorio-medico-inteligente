import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, User, Stethoscope, Store, CheckCircle, ArrowRight, ShieldCheck, Video, Settings, ClipboardList, Wallet, Sprout, ShoppingBag, Lock, Smartphone, Pill, HeartPulse } from "lucide-react";
import { motion } from "framer-motion";

const ComicPanel = ({ children, className = "", type = "default" }: { children: React.ReactNode, className?: string, type?: "default" | "primary" | "purple" }) => {
  const borderClass = type === "primary" ? "comic-panel-primary" : type === "purple" ? "comic-panel-purple" : "comic-panel";
  return (
    <div className={`p-6 ${borderClass} bg-card ${className}`}>
      {children}
    </div>
  );
};

const NarrationBox = ({ text, className = "" }: { text: string, className?: string }) => (
  <div className={`narration-box text-foreground bg-yellow-300 ${className}`}>
    {text}
  </div>
);

const SpeechBubble = ({ children, direction = "left", className = "" }: { children: React.ReactNode, direction?: "left" | "right" | "top", className?: string }) => {
  const dirClass = direction === "left" ? "" : direction === "right" ? "speech-bubble-right" : "speech-bubble-top";
  return (
    <div className={`speech-bubble ${dirClass} ${className}`}>
      {children}
    </div>
  );
};

const ManualPlataforma = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "paciente";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (searchParams.get("tab")) {
      setActiveTab(searchParams.get("tab") as string);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  return (
    <div className="min-h-dvh bg-background halftone-bg">
      <Navbar />
      
      <div className="container max-w-6xl mx-auto pt-28 pb-20 px-4">
        
        {/* CABEÇALHO ESTILO HQ */}
        <div className="text-center mb-10">
          <div className="inline-block relative">
            <h1 className="text-4xl md:text-6xl comic-font comic-pop text-foreground mb-4 relative z-10 transform -rotate-2">
              GUIA DE SOBREVIVÊNCIA
            </h1>
            <div className="absolute -bottom-4 right-0 transform rotate-6 bg-primary text-primary-foreground font-black px-4 py-1 border-2 border-foreground shadow-[4px_4px_0px_#000] z-20">
              PLANTA Y RAÍZ
            </div>
          </div>
          <p className="mt-8 text-xl font-bold bg-background/80 inline-block px-4 py-2 border-2 border-foreground rounded-lg">
            Como dominar a plataforma passo a passo!
          </p>
        </div>

        {/* TABS (SELEÇÃO DE PERSONAGEM) */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-12 bg-background border-4 border-foreground rounded-xl shadow-[6px_6px_0px_#000] h-auto p-1">
            <TabsTrigger value="paciente" className="font-bold py-3 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-lg border-2 border-transparent data-[state=active]:border-foreground transition-all">
              <User size={20} className="mr-2" /> PACIENTE
            </TabsTrigger>
            <TabsTrigger value="medico" className="font-bold py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border-2 border-transparent data-[state=active]:border-foreground transition-all">
              <Stethoscope size={20} className="mr-2" /> MÉDICO
            </TabsTrigger>
            <TabsTrigger value="lojista" className="font-bold py-3 data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg border-2 border-transparent data-[state=active]:border-foreground transition-all">
              <Store size={20} className="mr-2" /> LOJISTA
            </TabsTrigger>
          </TabsList>

          {/* TAB: PACIENTE */}
          <TabsContent value="paciente" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <ComicPanel>
                <NarrationBox text="EPISÓDIO 1: O INÍCIO DA JORNADA" className="bg-blue-300" />
                <div className="flex gap-4">
                  <div className="w-16 h-16 shrink-0 bg-blue-100 rounded-full border-2 border-foreground flex items-center justify-center">
                    <User size={32} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <SpeechBubble direction="left" className="bg-blue-50 text-foreground">
                      "Estou com dores e ansiedade... como encontro o tratamento certo com Cannabis?"
                    </SpeechBubble>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-foreground text-background font-black flex items-center justify-center shrink-0">1</span>
                    <p className="font-bold">Acesse a aba <strong>Profissionais</strong> no menu principal.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-foreground text-background font-black flex items-center justify-center shrink-0">2</span>
                    <p className="font-bold">Filtre médicos por especialidade (ex: Psiquiatria, Dor Crônica).</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-foreground text-background font-black flex items-center justify-center shrink-0">3</span>
                    <p className="font-bold">Escolha entre "Orientação Rápida (Chat)" ou "Consulta (Vídeo)" e faça o pagamento seguro.</p>
                  </div>
                </div>
              </ComicPanel>

              <ComicPanel type="primary">
                <NarrationBox text="EPISÓDIO 2: A SALA DE ESPERA" className="bg-primary text-primary-foreground" />
                <div className="flex flex-col h-full">
                  <div className="flex justify-end gap-4 mb-4">
                    <div className="flex-1">
                      <SpeechBubble direction="right" className="bg-green-50 text-foreground">
                        "Encontrei um médico! O que eu faço agora?"
                      </SpeechBubble>
                    </div>
                    <div className="w-16 h-16 shrink-0 bg-green-100 rounded-full border-2 border-foreground flex items-center justify-center">
                      <User size={32} className="text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 p-4 border-2 border-foreground rounded-xl bg-card border-dashed">
                    <h4 className="font-black comic-font mb-2 flex items-center gap-2"><Lock className="text-primary"/> AMBIENTE SEGURO</h4>
                    <p className="font-medium text-sm mb-2">
                      Após o pagamento, o sistema te leva direto para o <strong>Consultório Virtual</strong>.
                    </p>
                    <ul className="space-y-2 text-sm font-bold">
                      <li>• A IA (Enfermeira Brisa) fará uma triagem inicial.</li>
                      <li>• Aguarde o médico ficar ONLINE e liberar o acesso.</li>
                      <li>• Você receberá um aviso sonoro quando for sua vez!</li>
                    </ul>
                  </div>
                </div>
              </ComicPanel>

              <ComicPanel className="md:col-span-2">
                <NarrationBox text="EPISÓDIO FINAL: PRESCRIÇÃO E COMPRA" className="bg-yellow-300" />
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-full md:w-1/3">
                    <div className="relative">
                      <img src="https://images.unsplash.com/photo-1576091160550-2173ff9e8eb4?auto=format&fit=crop&q=80&w=400&h=300" alt="Médico" className="rounded-xl border-4 border-foreground grayscale hover:grayscale-0 transition-all duration-300 object-cover" />
                      <SpeechBubble direction="top" className="absolute -top-12 left-4 text-xs font-bold w-48 bg-white">
                        "Aqui está sua prescrição médica validada, em PDF!"
                      </SpeechBubble>
                    </div>
                  </div>
                  <div className="w-full md:w-2/3 space-y-4">
                    <h3 className="font-black text-2xl comic-font">A MÁGICA ACONTECE AQUI!</h3>
                    <p className="text-lg font-bold">
                      O médico encerrará a chamada e gerará sua receita digital. Imediatamente:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 border-2 border-foreground rounded-lg bg-orange-50">
                        <Wallet size={24} className="mb-2 text-orange-600" />
                        <h4 className="font-black uppercase mb-1">Dispensário Liberado</h4>
                        <p className="text-sm font-medium">As portas do shopping se abrem. Antes disso, tudo era bloqueado!</p>
                      </div>
                      <div className="p-4 border-2 border-foreground rounded-lg bg-purple-50">
                        <ShoppingBag size={24} className="mb-2 text-purple-600" />
                        <h4 className="font-black uppercase mb-1">Compra Direta</h4>
                        <p className="text-sm font-medium">Você verá apenas os produtos liberados pela sua receita. Compre sem sair do app!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </ComicPanel>

            </div>
          </TabsContent>

          {/* TAB: MÉDICO */}
          <TabsContent value="medico" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <ComicPanel type="primary">
                <NarrationBox text="PARTE 1: O COMANDO CENTRAL" className="bg-primary text-primary-foreground" />
                <div className="flex gap-4 mb-6">
                  <div className="w-16 h-16 shrink-0 bg-primary/20 rounded-full border-2 border-foreground flex items-center justify-center">
                    <Stethoscope size={32} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <SpeechBubble direction="left" className="bg-green-50 text-foreground">
                      "Doutor(a), sua fila de pacientes aguarda no Consultório Virtual!"
                    </SpeechBubble>
                  </div>
                </div>
                <div className="space-y-3 font-bold text-sm">
                  <p>1. Vá ao seu <strong>Dashboard Médico</strong>.</p>
                  <p>2. Clique em <strong>"Consultório Virtual"</strong>.</p>
                  <p>3. Você não verá outros médicos. Apenas a sua <span className="bg-yellow-200 px-1 border border-black">FILA PRIVADA</span>.</p>
                  <p>4. Pacientes "Aguardando Pagamento" ainda estão finalizando o checkout.</p>
                  <p>5. Clique em "Pronto para Atendimento" para abrir a sala do paciente.</p>
                </div>
              </ComicPanel>

              <ComicPanel>
                <NarrationBox text="PARTE 2: SUPER PODERES CLÍNICOS" className="bg-blue-300" />
                <h3 className="font-black comic-font text-xl mb-4 text-center">O CLIPE DE PAPEL MÁGICO 📎</h3>
                <p className="font-bold mb-4">Dentro da sala de chat do paciente, o ícone de anexo (clipe) abre seu arsenal:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border-2 border-foreground p-2 rounded bg-card flex flex-col items-center text-center">
                    <Video className="mb-1 text-red-500" />
                    <span className="text-xs font-black uppercase">Vídeo Seguro</span>
                  </div>
                  <div className="border-2 border-foreground p-2 rounded bg-card flex flex-col items-center text-center">
                    <HeartPulse className="mb-1 text-pink-500" />
                    <span className="text-xs font-black uppercase">Exame Cardíaco</span>
                  </div>
                  <div className="border-2 border-foreground p-2 rounded bg-card flex flex-col items-center text-center">
                    <ShieldCheck className="mb-1 text-blue-500" />
                    <span className="text-xs font-black uppercase">Verificador CYP450</span>
                  </div>
                  <div className="border-2 border-foreground p-2 rounded bg-card flex flex-col items-center text-center">
                    <ClipboardList className="mb-1 text-green-500" />
                    <span className="text-xs font-black uppercase">Prontuário Rápido</span>
                  </div>
                </div>
              </ComicPanel>

              <ComicPanel className="md:col-span-2">
                <NarrationBox text="PARTE 3: PRESCRIÇÃO E ENCERRAMENTO" className="bg-red-400 text-white" />
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <h3 className="font-black comic-font text-2xl">O COPILOTO DE RECEITAS</h3>
                    <p className="font-bold">
                      Esquecer dosagens? Nunca mais! Nosso copiloto permite que você ajuste a <span className="bg-yellow-300 border border-black px-1">Calculadora de Rampa de Dose</span> (gotas, concentração, dias de aumento). 
                      O sistema redige o texto legal automaticamente.
                    </p>
                    <p className="font-bold">
                      Um PDF com assinatura digital (padrão CFM) é enviado ao paciente no chat.
                    </p>
                  </div>
                  <div className="flex-1 border-4 border-foreground p-4 bg-muted rounded-xl transform rotate-1 hover:rotate-0 transition-all">
                    <h3 className="font-black comic-font text-xl mb-2 text-destructive flex items-center gap-2">
                      <Lock size={20} /> FINALIZAR & BLOQUEAR
                    </h3>
                    <p className="font-bold text-sm">
                      Para evitar mensagens intermináveis fora de hora, clique na seta superior direita e escolha <strong>"Finalizar & Bloquear"</strong>. 
                      Isso encerra a sessão clínica. O paciente precisará agendar um novo retorno para reabrir o chat!
                    </p>
                  </div>
                </div>
              </ComicPanel>

            </div>
          </TabsContent>

          {/* TAB: LOJISTA */}
          <TabsContent value="lojista" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <ComicPanel type="purple">
                <NarrationBox text="CAPÍTULO 1: ENTRANDO NO DISPENSÁRIO" className="bg-purple-600 text-white" />
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 shrink-0 bg-purple-100 rounded-full border-2 border-foreground flex items-center justify-center">
                    <Store size={32} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <SpeechBubble direction="left" className="bg-purple-50 text-foreground">
                      "Meus produtos estão cadastrados. Por que não consigo vê-los online livremente?"
                    </SpeechBubble>
                  </div>
                </div>
                <div className="bg-yellow-100 border-2 border-foreground p-4 rounded-xl">
                  <h4 className="font-black comic-font text-lg mb-2">A LEI DA RDC-660 (ANVISA)</h4>
                  <p className="font-bold text-sm">
                    A Planta y Raíz possui um "Gated Community" (Comunidade Fechada). Pessoas não autorizadas não veem preços nem estoques.
                    Seu catálogo só é destravado e exibido quando um paciente obtém uma <strong>Prescrição Médica Ativa</strong> validada na plataforma.
                  </p>
                </div>
              </ComicPanel>

              <ComicPanel>
                <NarrationBox text="CAPÍTULO 2: INTELIGÊNCIA B2B" className="bg-blue-300" />
                <h3 className="font-black comic-font text-xl text-center mb-4">A BOLA DE CRISTAL DAS VENDAS 🔮</h3>
                <p className="font-bold mb-4">
                  Seu Dashboard Lojista é uma máquina de previsões. Acesse a aba <strong>Demanda Preditiva</strong>.
                </p>
                <ul className="space-y-3 font-bold text-sm">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="text-purple-600 shrink-0 mt-0.5" size={18} />
                    O sistema escaneia quais cepas ou dosagens os médicos mais estão prescrevendo nesta semana.
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="text-purple-600 shrink-0 mt-0.5" size={18} />
                    Ele gera gráficos que te avisam: <em>"A demanda por Óleo de CBD Isolate 1500mg vai disparar!"</em>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="text-purple-600 shrink-0 mt-0.5" size={18} />
                    Você reabastece seu estoque <strong>antes</strong> do paciente tentar comprar.
                  </li>
                </ul>
              </ComicPanel>

              <ComicPanel className="md:col-span-2">
                <NarrationBox text="CAPÍTULO FINAL: CONVERSÃO & LOGÍSTICA" className="bg-green-400" />
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-full md:w-1/2">
                    <h3 className="font-black comic-font text-2xl uppercase mb-3">Do Consultório à sua Porta</h3>
                    <p className="font-bold mb-4">
                      Na aba <strong>Pedidos B2B</strong> do seu painel, caem as vendas garantidas. O processo flui organicamente:
                    </p>
                    <div className="flex items-center justify-between bg-card border-4 border-foreground p-3 rounded-full font-black text-xs md:text-sm shadow-[4px_4px_0px_#000]">
                      <span>Receita</span>
                      <ArrowRight size={16} />
                      <span>Carrinho</span>
                      <ArrowRight size={16} />
                      <span className="text-primary">Faturamento</span>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 p-6 bg-card border-4 border-dashed border-purple-600 rounded-xl text-center">
                    <Store size={48} className="mx-auto text-purple-600 mb-3" />
                    <h4 className="font-black text-lg uppercase mb-2">Suporte Integrado</h4>
                    <p className="font-bold text-sm">
                      Dúvidas sobre o pedido? O paciente tem um chat direto com você pós-compra, focado apenas em rastreio e logística.
                    </p>
                  </div>
                </div>
              </ComicPanel>

            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default ManualPlataforma;
