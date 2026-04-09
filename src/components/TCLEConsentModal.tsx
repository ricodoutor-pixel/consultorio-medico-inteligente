import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";

interface TCLEConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  doctorName?: string;
  patientName?: string;
}

export const TCLEConsentModal = ({ open, onAccept, onDecline, doctorName = "Médico(a)", patientName = "Paciente" }: TCLEConsentModalProps) => {
  const [checks, setChecks] = useState({
    read: false,
    limitations: false,
    privacy: false,
    recording: false,
  });

  const allChecked = Object.values(checks).every(Boolean);
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDecline(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="p-6 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText size={20} className="text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Termo de Consentimento Livre e Esclarecido (TCLE)
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Teleconsulta Médica — CFM Res. nº 2.314/2022 e nº 2.454/2026
              </p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit mt-2 text-[10px] border-primary/30 text-primary">
            <Shield size={8} className="mr-1" /> Documento com validade jurídica
          </Badge>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] px-6 py-4">
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p className="text-foreground font-semibold">
              Prezado(a) {patientName},
            </p>

            <p>
              Este Termo de Consentimento Livre e Esclarecido (TCLE) tem como objetivo informá-lo(a) sobre as condições, 
              benefícios, limitações e riscos da teleconsulta médica que será realizada por meio desta plataforma, 
              em conformidade com a <strong>Resolução CFM nº 2.314/2022</strong>, a <strong>Resolução CFM nº 2.454/2026</strong> (uso de IA na medicina), 
              a <strong>Lei nº 13.709/2018 (LGPD)</strong> e demais normativas aplicáveis.
            </p>

            <div className="bg-muted/30 border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-2">1. NATUREZA DA TELECONSULTA</h3>
              <p>
                A teleconsulta é uma modalidade de atendimento médico à distância, realizada por meio de tecnologias 
                de comunicação em tempo real (áudio e vídeo), que permite a interação entre médico e paciente sem a 
                necessidade de presença física simultânea no mesmo local. A teleconsulta será conduzida pelo(a) 
                Dr(a). <strong>{doctorName}</strong>, devidamente registrado(a) no Conselho Regional de Medicina (CRM).
              </p>
            </div>

            <div className="bg-muted/30 border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-2">2. OBJETIVOS</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Avaliação clínica e anamnese do(a) paciente;</li>
                <li>Orientação diagnóstica e terapêutica;</li>
                <li>Emissão de receitas, atestados e solicitações de exames, quando aplicável;</li>
                <li>Acompanhamento clínico de condições já diagnosticadas;</li>
                <li>Encaminhamento para consulta presencial, quando necessário.</li>
              </ul>
            </div>

            <div className="bg-muted/30 border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-2">3. LIMITAÇÕES DA TELECONSULTA</h3>
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle size={14} className="text-yellow-500 mt-0.5 shrink-0" />
                <p className="text-xs">O(A) paciente declara estar ciente de que:</p>
              </div>
              <ul className="list-disc list-inside space-y-1">
                <li>A teleconsulta <strong>não substitui</strong> o atendimento presencial em casos de urgência/emergência;</li>
                <li>O exame físico não pode ser realizado à distância, o que pode limitar a precisão diagnóstica;</li>
                <li>Problemas técnicos (conexão à internet, falhas de áudio/vídeo) podem prejudicar a qualidade do atendimento;</li>
                <li>O médico poderá solicitar atendimento presencial se julgar necessário para a segurança do paciente;</li>
                <li>Ferramentas de Inteligência Artificial podem ser utilizadas como <strong>apoio</strong> à decisão clínica, 
                    mas a decisão final é sempre do médico responsável (CFM nº 2.454/2026).</li>
              </ul>
            </div>

            <div className="bg-muted/30 border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-2">4. PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD)</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Todos os dados de saúde são classificados como <strong>dados sensíveis</strong> (Art. 5º, II, LGPD);</li>
                <li>As informações são criptografadas com protocolo <strong>AES-256</strong> (em repouso) e <strong>TLS 1.3</strong> (em trânsito);</li>
                <li>O conteúdo do vídeo <strong>não é gravado nem armazenado</strong>, salvo autorização expressa do paciente;</li>
                <li>O prontuário eletrônico é armazenado com acesso restrito e auditável;</li>
                <li>O(A) paciente tem direito de solicitar acesso, correção ou exclusão de seus dados (Art. 18, LGPD);</li>
                <li>Um Relatório de Impacto à Proteção de Dados (RIPD) está disponível em conformidade com o Art. 38 da LGPD.</li>
              </ul>
            </div>

            <div className="bg-muted/30 border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-2">5. ASSINATURA DIGITAL</h3>
              <p>
                Todos os documentos clínicos (receitas, atestados, laudos) emitidos durante ou após a teleconsulta 
                são assinados digitalmente no padrão <strong>ICP-Brasil</strong> (Infraestrutura de Chaves Públicas Brasileira), 
                possuindo validade jurídica equivalente à assinatura manuscrita, conforme a 
                <strong> Medida Provisória nº 2.200-2/2001</strong> e a <strong>Lei nº 14.063/2020</strong>.
              </p>
            </div>

            <div className="bg-muted/30 border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-2">6. USO DE INTELIGÊNCIA ARTIFICIAL (CFM nº 2.454/2026)</h3>
              <p>
                Esta plataforma pode utilizar recursos de IA para:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Transcrição automática de áudio (Speech-to-Text) para auxílio na redação do prontuário;</li>
                <li>Sugestões de diagnóstico e tratamento baseadas em evidências científicas;</li>
                <li>Triagem inicial para direcionamento ao especialista adequado.</li>
              </ul>
              <p className="mt-2 text-xs font-semibold text-foreground">
                ⚠️ Conforme a Resolução CFM nº 2.454/2026, todas as decisões clínicas são de responsabilidade 
                exclusiva do médico. A IA atua apenas como ferramenta de apoio e seus resultados estão sujeitos à 
                revisão médica obrigatória.
              </p>
            </div>

            <div className="bg-muted/30 border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-2">7. DIREITOS DO PACIENTE</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Revogar este consentimento a qualquer momento, sem prejuízo;</li>
                <li>Solicitar atendimento presencial;</li>
                <li>Acessar seu prontuário eletrônico completo;</li>
                <li>Solicitar segunda opinião médica;</li>
                <li>Registrar reclamações junto ao CRM ou à ANPD (Autoridade Nacional de Proteção de Dados).</li>
              </ul>
            </div>

            <div className="bg-muted/30 border border-border rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-2">8. REGISTRO DA CONSULTA</h3>
              <p>
                Conforme a Resolução CFM nº 2.314/2022, Art. 7º, a consulta será registrada no prontuário eletrônico 
                contendo: data e hora, meio de comunicação utilizado, número do CRM do médico, diagnóstico (CID-10), 
                conduta terapêutica e orientações fornecidas.
              </p>
            </div>

            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              Data: {today} — Plataforma Planta & Raiz — CNPJ: XX.XXX.XXX/0001-XX<br />
              Diretor Técnico Médico: Dr(a). [Nome] — CRM/UF: XXXXX
            </p>
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t border-border space-y-4">
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox checked={checks.read} onCheckedChange={(v) => setChecks(p => ({ ...p, read: !!v }))} />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Li e compreendi integralmente este Termo de Consentimento Livre e Esclarecido.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox checked={checks.limitations} onCheckedChange={(v) => setChecks(p => ({ ...p, limitations: !!v }))} />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Estou ciente das limitações da teleconsulta e de que o médico poderá solicitar atendimento presencial.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox checked={checks.privacy} onCheckedChange={(v) => setChecks(p => ({ ...p, privacy: !!v }))} />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Autorizo o tratamento dos meus dados de saúde conforme a LGPD e a Política de Privacidade da plataforma.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox checked={checks.recording} onCheckedChange={(v) => setChecks(p => ({ ...p, recording: !!v }))} />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Estou ciente de que o vídeo <strong>não será gravado</strong>, e que ferramentas de IA poderão ser utilizadas como apoio clínico.
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onDecline}>
              Recusar e Sair
            </Button>
            <Button className="flex-1 bg-primary text-primary-foreground font-bold" disabled={!allChecked} onClick={onAccept}>
              <CheckCircle2 size={16} className="mr-2" />
              Aceito o Termo
            </Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground">
            Ao aceitar, você assina eletronicamente este TCLE conforme Lei nº 14.063/2020. 
            Uma cópia será enviada ao seu e-mail cadastrado.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
