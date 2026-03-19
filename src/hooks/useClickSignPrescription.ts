import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

interface SignPrescriptionParams {
  prescriptionId?: string;
  documentPath: string;
  contentBase64: string;
  doctorEmail: string;
  doctorName: string;
  patientName: string;
}

interface SignResult {
  success: boolean;
  document_key?: string;
  signer_key?: string;
  signature_url?: string;
  message?: string;
  error?: string;
}

export function useClickSignPrescription() {
  const [loading, setLoading] = useState(false);

  const signPrescription = async (params: SignPrescriptionParams): Promise<SignResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("clicksign-prescription", {
        body: { action: "upload_and_sign", ...params },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(data.message || "Receita enviada para assinatura digital!");
      } else {
        toast.error(data?.error || "Erro ao enviar para assinatura");
      }

      return data as SignResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro na assinatura digital: ${message}`);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async (documentKey: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("clicksign-prescription", {
        body: { action: "check_status", documentKey },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Erro ao verificar status:", err);
      return null;
    }
  };

  return { signPrescription, checkStatus, loading };
}
