import { useEffect, useState } from "react";
import { Download, FileText, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { consultationDocumentLabel } from "@/lib/consultation-prescription";

interface Props {
  appointmentId: string;
  patientId: string;
}

type SignedRx = { id: string; signature_date: string | null; prescription_type: string | null };

/** Documentos assinados da consulta (receita, atestado, exames): aparecem assim que o médico envia o PDF assinado. */
export function ConsultationPrescriptionCard({ appointmentId, patientId }: Props) {
  const [rxs, setRxs] = useState<SignedRx[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("prescriptions")
        .select("id, signature_date, prescription_type")
        .eq("appointment_id", appointmentId)
        .eq("patient_id", patientId)
        .eq("status", "signed")
        .order("signature_date", { ascending: true });
      if (!cancelled && data) setRxs(data);
    };
    void load();
    const t = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [appointmentId, patientId]);

  const download = async (id: string) => {
    setDownloading(id);
    try {
      const { data, error } = await supabase.functions.invoke("prescription-download", { body: { prescriptionId: id } });
      if (error || !data?.url) throw new Error();
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Não foi possível baixar a receita agora. Tente de novo.");
    } finally {
      setDownloading(null);
    }
  };

  if (!rxs.length) {
    return (
      <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-3 text-xs text-emerald-900 flex items-center gap-2">
        <FileText size={15} className="shrink-0" />
        Se o médico emitir receita, atestado ou pedido de exames, o documento aparece aqui assinado digitalmente para você baixar.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-300 bg-white p-3 space-y-2">
      <p className="text-sm font-bold text-emerald-900 inline-flex items-center gap-1.5">
        <ShieldCheck size={16} /> Documentos da consulta assinados digitalmente
      </p>
      {rxs.map((rx, i) => (
        <Button
          key={rx.id}
          variant="outline"
          className="w-full justify-start"
          onClick={() => void download(rx.id)}
          disabled={downloading === rx.id}
        >
          {downloading === rx.id ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Download size={15} className="mr-2" />}
          Baixar {consultationDocumentLabel(rx.prescription_type).toLowerCase()} (PDF){rxs.length > 1 ? ` · ${i + 1}` : ""}
        </Button>
      ))}
      <p className="text-[11px] text-slate-500">
        A assinatura pode ser conferida em validar.iti.gov.br.
      </p>
    </div>
  );
}
