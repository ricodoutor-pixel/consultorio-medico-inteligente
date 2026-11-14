import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ExternalLink, FileCheck } from "lucide-react";
import type { PatientData, PrescriptionData } from "@/lib/anvisaAutomation";

/** Serviço oficial do Governo Federal para a autorização de importação (RDC 660/2022). */
export const ANVISA_IMPORT_SERVICE_URL =
  "https://www.gov.br/pt-br/servicos/solicitar-autorizacao-para-importacao-excepcional-de-produtos-a-base-de-canabidiol";

interface Anvisa1ClickButtonProps {
  patientData?: PatientData;
  prescriptionData?: PrescriptionData;
  className?: string;
  /** Mantido por compatibilidade: a plataforma não gera nem aprova protocolos da ANVISA. */
  onSuccess?: (protocol: string) => void;
}

/**
 * Guia honesto para o pedido de autorização na ANVISA.
 * A plataforma NÃO envia o pedido, NÃO gera protocolo e NÃO aprova nada:
 * o próprio paciente (ou responsável) solicita no portal gov.br, e a decisão é da ANVISA.
 */
export function Anvisa1ClickButton({ prescriptionData, className }: Anvisa1ClickButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={`bg-amber-500 hover:bg-amber-600 text-white font-medium shadow-lg ${className ?? ""}`}
        size="lg"
      >
        <FileCheck className="mr-2 h-5 w-5" />
        Como pedir a autorização da ANVISA
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Autorização de importação — ANVISA</DialogTitle>
            <DialogDescription>
              O pedido é feito pelo próprio paciente (ou responsável) no portal oficial gov.br. A Planta y Raíz não envia o
              pedido, não gera protocolo e não aprova autorizações: quem analisa e decide é a ANVISA.
            </DialogDescription>
          </DialogHeader>

          <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
            <li>Entre no portal gov.br com a sua conta gov.br.</li>
            <li>
              Anexe a receita emitida pelo seu médico
              {prescriptionData?.doctorName ? ` (${prescriptionData.doctorName})` : ""} e os documentos pedidos no formulário.
            </li>
            <li>Acompanhe o andamento e o protocolo oficial pelo próprio portal da ANVISA.</li>
          </ol>

          <Button asChild className="w-full mt-2">
            <a href={ANVISA_IMPORT_SERVICE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Abrir o serviço oficial no gov.br
            </a>
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
