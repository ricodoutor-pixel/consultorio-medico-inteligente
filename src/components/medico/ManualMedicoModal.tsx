import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BookOpen, 
  Wifi, 
  Video, 
  MessageSquareHeart, 
  FileSignature,
  AlertCircle,
  Activity,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

export function ManualMedicoModal({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2 border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
            <BookOpen className="h-4 w-4" />
            Manual do Médico
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 flex flex-col gap-0 border-emerald-500/20">
        <DialogHeader className="p-6 pb-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-b">
          <DialogTitle className="flex items-center gap-2 text-2xl text-emerald-800 dark:text-emerald-400">
            <Stethoscope className="h-6 w-6" />
            Guia Operacional e Manual Clínico
          </DialogTitle>
          <DialogDescription>
            Documentação completa das ferramentas e protocolos do ecossistema Planta y Raiz.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="telemetry" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4">
            <TabsList className="grid grid-cols-4 w-full h-auto">
              <TabsTrigger value="telemetry" className="py-2.5 text-xs sm:text-sm data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 dark:data-[state=active]:bg-emerald-900/40 dark:data-[state=active]:text-emerald-300">
                <Wifi className="h-4 w-4 mr-2 hidden sm:block" />
                Telemetria RuView
              </TabsTrigger>
              <TabsTrigger value="teleconsulta" className="py-2.5 text-xs sm:text-sm data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 dark:data-[state=active]:bg-emerald-900/40 dark:data-[state=active]:text-emerald-300">
                <Video className="h-4 w-4 mr-2 hidden sm:block" />
                Teleconsulta
              </TabsTrigger>
              <TabsTrigger value="triage" className="py-2.5 text-xs sm:text-sm data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 dark:data-[state=active]:bg-emerald-900/40 dark:data-[state=active]:text-emerald-300">
                <MessageSquareHeart className="h-4 w-4 mr-2 hidden sm:block" />
                Triagem (Brisa)
              </TabsTrigger>
              <TabsTrigger value="emr" className="py-2.5 text-xs sm:text-sm data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-900 dark:data-[state=active]:bg-emerald-900/40 dark:data-[state=active]:text-emerald-300">
                <FileSignature className="h-4 w-4 mr-2 hidden sm:block" />
                Prontuário
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 py-4">
            {/* 1. Telemetria RuView */}
            <TabsContent value="telemetry" className="mt-0 space-y-4">
              <div className="space-y-4">
                <Alert className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
                  <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <AlertTitle className="text-emerald-800 dark:text-emerald-400 font-semibold">O que é a Telemetria Wi-Fi CSI (RuView)?</AlertTitle>
                  <AlertDescription className="text-emerald-700/80 dark:text-emerald-300/80">
                    Um sistema inovador de monitoramento passivo que utiliza as ondas do roteador Wi-Fi (OFDM/CSI) para detectar micromovimentos corporais, como a expansão torácica (respiração) e o pulso arterial, sem o uso de câmeras, microfones ou pulseiras, garantindo 100% de privacidade.
                  </AlertDescription>
                </Alert>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-left font-medium">Calibração Inicial (60s)</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Quando o sistema é iniciado, ele precisa mapear a disposição física do quarto (móveis, paredes). Oriente o paciente a manter o cômodo <strong>vazio ou permanecer completamente imóvel por 60 segundos</strong>. Movimentos bruscos durante a calibração podem gerar falsos positivos de taquicardia ou respiração acelerada.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger className="text-left font-medium">Interpretação Clínica e Titulação</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed space-y-2">
                      <p>O RuView é seu maior aliado para titulação segura de fitocanabinoides:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>CBD e CBN (Foco no Sono):</strong> Observe o card "Padrão de Sono". Acompanhe a latência de repouso (tempo para dormir) e os microdespertares para validar se a dose de CBD/CBN está sendo eficaz para a insônia.</li>
                        <li><strong>THC (Atenção Cardíaca):</strong> O THC pode causar taquicardia transitória leve. Acompanhe a Freq. Cardíaca (BPM) na janela de 2h após a administração para garantir que o paciente não ultrapasse limites seguros.</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger className="text-left font-medium">Lidando com Alertas (Queda e Estresse)</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      Se a rede neural detectar um padrão de <strong>Queda</strong> ou <strong>Agitação/Estresse Severo</strong>, um banner de alerta urgente aparecerá no topo do painel. Nestes casos, recomenda-se que a equipe de triagem (Enfermeira Brisa) dispare uma mensagem automatizada de *check-in* no WhatsApp do paciente ou de seu cuidador para verificar a integridade física.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Alert variant="destructive" className="bg-rose-50 dark:bg-rose-950/20 border-rose-200">
                  <ShieldCheck className="h-4 w-4 text-rose-600" />
                  <AlertTitle className="text-rose-800 dark:text-rose-400 font-semibold">Nota Regulatória (ANVISA/CFM)</AlertTitle>
                  <AlertDescription className="text-rose-700/80 dark:text-rose-300/80 text-xs mt-1 leading-relaxed">
                    A telemetria RuView opera em caráter de <strong>triagem e suporte complementar</strong>. Esta tecnologia <strong>NÃO SUBSTITUI</strong> equipamentos médicos de monitoramento de UTI (Holter, Oximetria hospitalar) e <strong>NÃO CONSTITUI</strong> um diagnóstico autônomo (SaMD de alta classe). Suas decisões clínicas e prescrições devem considerar o quadro geral, anamnese e exames laboratoriais do paciente.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            {/* 2. Teleconsulta Jitsi */}
            <TabsContent value="teleconsulta" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Consultório Virtual em Vídeo</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  A plataforma Planta y Raiz utiliza uma infraestrutura de vídeo dedicada (baseada em Jitsi) com criptografia ponta-a-ponta (E2EE) para garantir o sigilo médico-paciente.
                </p>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="jitsi-1">
                    <AccordionTrigger>Como iniciar uma consulta?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      No seu "Dashboard do Médico", localize a aba de Agendamentos do dia. Ao clicar em "Entrar na Sala" ao lado do nome do paciente, você será direcionado para o Consultório Virtual. O paciente aguardará na "Sala de Espera" até que você permita sua entrada.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="jitsi-2">
                    <AccordionTrigger>Controles da Sala</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground space-y-2">
                      <ul className="list-disc pl-5">
                        <li><strong>Microfone/Câmera:</strong> Na barra inferior, use os ícones para silenciar ou desativar o vídeo.</li>
                        <li><strong>Compartilhar Tela:</strong> Útil para mostrar exames ou gráficos de telemetria ao paciente.</li>
                        <li><strong>Chat Seguro:</strong> Permite envio de links e documentos em texto durante a sessão.</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>

            {/* 3. Triagem Brisa */}
            <TabsContent value="triage" className="mt-0">
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <MessageSquareHeart className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Triagem e Acolhimento (Brisa)</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Nossa agente virtual, Enfermeira Brisa, realiza a primeira camada de atendimento via WhatsApp antes de a consulta chegar até você.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4 bg-background">
                    <h4 className="font-medium text-emerald-600 mb-2">O que a Brisa faz?</h4>
                    <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                      <li>Confirmação de agendamentos.</li>
                      <li>Coleta de exames laboratoriais anteriores (PDF/Imagens).</li>
                      <li>Anamnese básica (motivo da consulta, dores, insônia).</li>
                      <li>Dúvidas primárias sobre a legislação do óleo de cannabis.</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4 bg-background">
                    <h4 className="font-medium text-blue-600 mb-2">Como chega para o Médico?</h4>
                    <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                      <li>No seu dashboard, o resumo da triagem da Brisa fica anexado ao perfil do paciente.</li>
                      <li>Você já entra na consulta de vídeo sabendo o foco do problema, otimizando o seu tempo clínico.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 4. Prontuário Eletrônico */}
            <TabsContent value="emr" className="mt-0">
               <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <FileSignature className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Prontuário & Prescrição Eletrônica</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Toda a evolução clínica e as receitas de controle especial devem ser registradas no sistema interno da plataforma.
                </p>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="emr-1">
                    <AccordionTrigger>Evolução e Anotações Clínicas</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      Durante a teleconsulta, a lateral direita da tela fornece um bloco de notas integrado ao Prontuário. Estas anotações são criptografadas e não ficam visíveis para o paciente. Você pode revisar o histórico de interações e as curvas de sinais vitais passadas (Telemetria).
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="emr-2">
                    <AccordionTrigger>Prescrição Canabinoide (Laudos e Receitas)</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground space-y-2">
                      <p>Para prescrições de Cannabis Medicinal, acesse o módulo de Receituário:</p>
                      <ul className="list-disc pl-5">
                        <li>Geração automática do <strong>Laudo Médico</strong> exigido pela RDC 660/327.</li>
                        <li>Receituário tipo A (Amarela) ou B (Azul) formatado digitalmente para a assinatura eletrônica via certificado digital (ICP-Brasil).</li>
                        <li>Disparo automático do PDF da receita para o WhatsApp do paciente e para a farmácia parceira (se autorizado).</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
