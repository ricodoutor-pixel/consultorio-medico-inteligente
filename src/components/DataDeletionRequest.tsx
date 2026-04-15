import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function DataDeletionRequest() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("data_deletion_requests").insert({
      user_id: session.user.id,
      reason,
      status: "pending",
    });

    if (!error) {
      toast({
        title: "Solicitação registrada",
        description: "Sua solicitação de exclusão de dados será analisada em até 15 dias úteis.",
      });
      setOpen(false);
      setReason("");
    } else {
      toast({ title: "Erro", description: "Não foi possível enviar a solicitação.", variant: "destructive" });
    }
    setLoading(false);
  };

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
        <Trash2 className="h-4 w-4 mr-2" />
        Solicitar Exclusão dos Meus Dados
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-4">
      <div className="flex items-center gap-2 text-red-400">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="font-semibold">Direito ao Esquecimento (LGPD Art. 18)</h3>
      </div>
      <p className="text-xs text-gray-400">
        Esta ação é irreversível. Seus dados pessoais serão anonimizados conforme a legislação vigente. Dados médicos obrigatórios serão mantidos pelo prazo legal (20 anos - CFM).
      </p>
      <Textarea
        placeholder="Motivo da solicitação (opcional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="bg-black/30 border-white/10 text-white"
      />
      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={loading} variant="destructive" className="flex-1">
          {loading ? "Enviando..." : "Confirmar Solicitação"}
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)} className="text-gray-400">
          Cancelar
        </Button>
      </div>
    </div>
  );
}
