import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, User, Stethoscope, Store, CheckCircle, ArrowRight, ShieldCheck, Video, Settings, ClipboardList } from "lucide-react";

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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container max-w-5xl mx-auto pt-24 pb-16 px-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <BookOpen size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black text-foreground">
              Passo a Passo da Plataforma
            </h1>
            <p className="text-muted-foreground mt-1">
              O manual completo de como pacientes, médicos e lojistas interagem em nosso ecossistema.
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-8">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted">
            <TabsTrigger value="paciente" className="font-bold data-[state=active]:bg-background">
              <User size={16} className="mr-2" /> Para Pacientes
            </TabsTrigger>
            <TabsTrigger value="medico" className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Stethoscope size={16} className="mr-2" /> Para Médicos
            </TabsTrigger>
            <TabsTrigger value="lojista" className="font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Store size={16} className="mr-2" /> Para Lojistas
            </TabsTrigger>
          </TabsList>

          {/* TAB: PACIENTE */}
          <TabsContent value="paciente" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
              <CardHeader className="bg-primary/5 rounded-t-xl border-b border-border">
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="text-primary" /> Jornada do Paciente
                </CardTitle>
                <CardDescription>
                  Entenda como você chega ao médico e como suas consultas funcionam.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm">1</span> 
                    Como o Paciente Chega ao Médico
                  </h3>
                  <p className="text-muted-foreground ml-8">
                    Ao acessar a plataforma, você pode navegar pela vitrine de <strong>Profissionais</strong>. Cada profissional possui dois valores: 
                    um para <em>Consulta Completa (com vídeo)</em> e outro para <em>Orientação Rápida (via chat)</em>. 
                    Após escolher o profissional e realizar o pagamento (que é processado via Mercado Pago ou Stripe de forma segura), 
                    você é automaticamente direcionado para a <strong>Sala de Espera</strong> do médico escolhido.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm">2</span> 
                    A Sala de Espera e o Atendimento
                  </h3>
                  <p className="text-muted-foreground ml-8">
                    Dentro do seu Dashboard, você entrará no "Consultório Virtual" (Telemedicina). Inicialmente, o sistema pode bloquear 
                    o envio de mensagens diretamente para o médico até que o seu status mude para "Pronto para Atendimento". 
                    A enfermeira IA (Brisa) pode coletar seus sintomas previamente através de uma triagem rápida.
                  </p>
                  <p className="text-muted-foreground ml-8">
                    Quando o médico fica online e aceita a chamada, a sala de vídeo é liberada via sistema seguro. Todo o atendimento 
                    acontece em um ambiente similar ao WhatsApp, facilitando o uso no celular.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm">3</span> 
                    Pós-Consulta e Dispensário (Compras)
                  </h3>
                  <p className="text-muted-foreground ml-8">
                    Durante o atendimento, se houver prescrição, o médico envia a receita com assinatura digital (padrão CFM/Anvisa) 
                    direto pelo chat. Assim que a consulta é finalizada, o médico encerra o acesso ao chat dele. 
                  </p>
                  <p className="text-muted-foreground ml-8">
                    Com a sua prescrição digital salva no sistema, você automaticamente ganha acesso ao <strong>Dispensário Seguro</strong> 
                    (Shopping da Plataforma). Apenas pacientes com prescrições validadas conseguem ver preços e comprar produtos 
                    específicos diretamente das marcas (Lojistas parceiros).
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: MÉDICO */}
          <TabsContent value="medico" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-primary/20">
              <CardHeader className="bg-primary text-primary-foreground rounded-t-xl">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Stethoscope /> Jornada do Médico & Consultório Virtual
                </CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  O guia completo de como operar a clínica virtual e gerenciar seus pacientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <ClipboardList className="text-primary" size={20} /> Como o Médico Chega ao Paciente
                  </h3>
                  <p className="text-muted-foreground">
                    Ao acessar a plataforma, o médico entra no <strong>Dashboard do Médico</strong> e visualiza o botão <strong>"Consultório Virtual"</strong>. 
                    Neste ambiente, nossa tecnologia faz a leitura de login: o médico não vê outros profissionais da rede, mas sim a <strong>fila de pacientes aguardando atendimento</strong>.
                  </p>
                  <p className="text-muted-foreground">
                    Pacientes cujo pagamento ainda não foi validado constam com "Aguardando Pagamento". Quando liberados, ficam "Prontos para Atendimento".
                    Ao selecionar um paciente na lista, o médico abre a sala privada (chat e prontuário).
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Settings className="text-primary" size={20} /> O Workspace (As ferramentas no Clipe de Papel 📎)
                  </h3>
                  <p className="text-muted-foreground">
                    A tela de atendimento foi construída para parecer o WhatsApp, porém, o ícone de anexar (Clipe) revela ferramentas clínicas:
                  </p>
                  <ul className="list-disc ml-8 text-muted-foreground space-y-2">
                    <li><strong>Vídeo Integrado:</strong> A chamada de vídeo acontece no mesmo painel (lado esquerdo), permitindo consultar o prontuário no lado direito.</li>
                    <li><strong>Ferramentas Diagnósticas:</strong> (Leitor de Batimentos Cardíacos e Exame de Fundo de Olho por foto), cujos dados são cruzados pela IA.</li>
                    <li><strong>Prontuário Rápido:</strong> Um painel embutido para anotar a evolução do quadro clínico sem sair da tela.</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <ShieldCheck className="text-primary" size={20} /> Prescrição Avançada & CYP450
                  </h3>
                  <p className="text-muted-foreground">
                    Através do botão de Prescrição, o médico acessa o Copiloto IA. Nele existe a <strong>Calculadora de Rampa de Dose</strong>, 
                    onde o profissional define (concentração, gotas, dias de aumento) e o sistema gera o texto de receita. 
                  </p>
                  <p className="text-muted-foreground">
                    Também no painel está o <strong>Verificador CYP450</strong>, que cruza dados de medicamentos que o paciente já toma (ex: Varfarina, Clobazam) 
                    para emitir alertas sobre interações hepáticas do CBD/THC. Ao finalizar a receita, um PDF carimbado (CFM) é ejetado no chat do paciente.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <CheckCircle className="text-primary" size={20} /> Finalizar & Bloquear Contato
                  </h3>
                  <p className="text-muted-foreground">
                    No topo do chat, ao clicar na seta ao lado do nome do paciente, há a opção de <strong>"Finalizar & Bloquear"</strong>. 
                    Esta função encerra o fluxo, restringindo que o paciente fique mandando mensagens ilimitadas como em um WhatsApp normal. 
                    O canal só reabre após um novo agendamento ou se o médico deliberadamente interagir novamente.
                  </p>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: LOJISTA */}
          <TabsContent value="lojista" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-purple-500/20">
              <CardHeader className="bg-purple-600 text-white rounded-t-xl">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Store /> Manual do Lojista (Dispensário)
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Como gerenciar seu catálogo, ler tendências do IA Matchmaker e converter vendas.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-purple-700">
                    <ArrowRight size={16}/> 1. Configurando sua Loja e Catálogo
                  </h3>
                  <p className="text-muted-foreground ml-6">
                    No seu Dashboard ("Desk bord de Lojista"), você possui acesso a uma inteligência B2B. A aba <strong>Meu Catálogo (Shopping)</strong> 
                    permite submeter produtos de Cannabis Medicinal (Óleos, Gummies, Flores). 
                    Cada produto submetido passa por uma <em>Auditoria e Curadoria Técnica</em> da nossa diretoria.
                    Uma vez aprovado, o produto reflete em tempo real na aba <strong>Dispensário</strong> visível apenas para os pacientes.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-purple-700">
                    <ArrowRight size={16}/> 2. Quem vê meus produtos?
                  </h3>
                  <p className="text-muted-foreground ml-6">
                    Por força da legislação (RDC-660 da Anvisa), o "Dispensário" da Planta y Raíz é uma área estrita (<em>Gated Community</em>). 
                    Um paciente recém-chegado não consegue ver preços ou estoques livremente. 
                    <strong>Seu produto só será exibido se o paciente possuir uma Prescrição Ativa</strong> na plataforma, atestada pelos médicos da rede.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-purple-700">
                    <ArrowRight size={16}/> 3. IA Matchmaker e Demanda Preditiva
                  </h3>
                  <p className="text-muted-foreground ml-6">
                    A aba <strong>Demanda Preditiva</strong> no seu painel exibe gráficos em tempo real gerados a partir de receitas. 
                    Se nossos médicos estão prescrevendo muitos produtos ricos em "Limoneno" (terpeno) nesta semana, o gráfico alertará 
                    você dessa tendência, permitindo que você reabasteça estrategicamente os produtos mais procurados.
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-purple-700">
                    <ArrowRight size={16}/> 4. Pedidos B2B e Atendimento
                  </h3>
                  <p className="text-muted-foreground ml-6">
                    A aba <strong>Pedidos B2B</strong> no painel compila todas as conversões de venda que passaram da prescrição médica para o carrinho de compras. 
                    Quando o paciente finaliza o checkout, o pedido desponta em sua base para embalo e rastreio, consolidando a ponte perfeita entre a indicação clínica e o acesso logístico seguro.
                  </p>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default ManualPlataforma;
