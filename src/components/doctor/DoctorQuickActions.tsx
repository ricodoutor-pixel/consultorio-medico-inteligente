import { Button } from "@/components/ui/button";
import { CreditCard, FileText, FileSymlink, Stethoscope, PowerOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  patientId: string;
  appointmentId: string;
  patientName: string;
}

export const DoctorQuickActions = ({ patientId, appointmentId, patientName }: Props) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleEndConsultation = async () => {
    try {
      await supabase.from("appointments")
        .update({ status: "completed" })
        .eq("id", appointmentId);
        
      toast({ title: "Consulta Finalizada", description: "O status foi atualizado para concluído." });
      navigate("/dashboard-medico");
    } catch (e) {
      toast({ title: "Erro", description: "Erro ao finalizar consulta", variant: "destructive" });
    }
  };

  const handleSendPaymentLink = () => {
    toast({ title: "Link de Pagamento", description: `Link de pagamento extra (Upsell) enviado para o chat de ${patientName}.` });
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" className="h-9 hidden md:flex" onClick={() => toast({ title: "Atestado Gerado", description: "O atestado foi gerado e salvo nos arquivos do paciente." })}>
        <FileText size={16} className="mr-2 text-primary" /> Atestado Médico
      </Button>
      <Button variant="outline" size="sm" className="h-9 hidden lg:flex" onClick={() => toast({ title: "Exames Solicitados", description: "Guia gerada." })}>
        <Stethoscope size={16} className="mr-2 text-blue-500" /> Solicitar Exames
      </Button>
      <Button variant="outline" size="sm" className="h-9 hidden lg:flex" onClick={handleSendPaymentLink}>
        <CreditCard size={16} className="mr-2 text-green-500" /> Cobrança Extra
      </Button>
      
      <div className="w-px h-6 bg-border mx-1"></div>
      
      <Button variant="destructive" size="sm" className="h-9" onClick={handleEndConsultation}>
        <PowerOff size={16} className="mr-2" /> Encerrar
      </Button>
    </div>
  );
};
