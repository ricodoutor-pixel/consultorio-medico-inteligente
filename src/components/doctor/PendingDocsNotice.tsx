import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { KYC_LABELS, KYC_REQUIRED, type KycKind } from "@/lib/kyc-docs";
import { Badge } from "@/components/ui/badge";

interface Props {
  userId: string;
  profile: any;
  /** Nome do médico usado no aviso */
  doctorName?: string | null;
}

/**
 * Aviso específico do Consultório Virtual: lista exatamente quais documentos e
 * dados de cadastro ainda faltam para liberar o card médico público.
 */
export function PendingDocsNotice({ userId, profile, doctorName }: Props) {
  const [uploaded, setUploaded] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("doctor_kyc_documents" as any)
        .select("document_kind")
        .eq("doctor_user_id", userId);
      if (!active) return;
      setUploaded(new Set(((data ?? []) as any[]).map((d) => d.document_kind)));
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const missingDocs = KYC_REQUIRED.filter((k) => !uploaded.has(k)) as KycKind[];
  const missingData = [
    !profile?.cpf && "CPF",
    !profile?.date_of_birth && "Data de nascimento",
    !profile?.phone && "WhatsApp",
    !profile?.pix_key && "Chave PIX (recebimentos)",
    !profile?.cep && "CEP / endereço",
    !profile?.avatar_url && "Foto de perfil",
  ].filter(Boolean) as string[];

  if (!loaded) return null;

  const allOk = missingDocs.length === 0 && missingData.length === 0;

  if (allOk) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-emerald-500">Documentação completa</h4>
          <p className="text-xs text-emerald-500/80 mt-1">
            Todos os documentos e dados obrigatórios foram recebidos. Seu card médico está apto à
            publicação pela Diretoria Técnica.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-amber-500">
            Pendências para publicar seu card{doctorName ? ` — ${doctorName}` : ""}
          </h4>
          <p className="text-xs text-amber-500/80 mt-1">
            Seu card médico está criado, porém permanece <strong>desligado</strong> até o envio dos
            itens abaixo. A equipe pode entrar em contato pelo WhatsApp para concluir.
          </p>

          {missingDocs.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-500/90">
                Documentos faltantes
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {missingDocs.map((k) => (
                  <Badge key={k} variant="secondary" className="text-[10px] bg-amber-500/20 text-amber-500">
                    {KYC_LABELS[k]}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {missingData.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-amber-500/90">
                Dados de cadastro faltantes
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {missingData.map((label) => (
                  <Badge key={label} variant="secondary" className="text-[10px] bg-amber-500/20 text-amber-500">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PendingDocsNotice;
