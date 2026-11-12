import { useEffect, useState } from "react";
import { Calendar, FileSignature, Loader2, NotebookPen, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { consultationDocumentLabel } from "@/lib/consultation-prescription";

interface Props {
  patientId: string;
}

interface TimelineItem {
  id: string;
  at: string;
  kind: "consulta" | "evolucao" | "documento";
  title: string;
  detail: string;
  status?: string;
}

const STATUS_LABEL: Record<string, string> = {
  completed: "concluída",
  in_progress: "em andamento",
  confirmed: "paga, aguardando",
  pending: "pendente",
  scheduled: "agendada",
  cancelled: "cancelada",
  draft: "rascunho",
  signed: "assinado",
};

const ICONS = { consulta: Video, evolucao: NotebookPen, documento: FileSignature };

/**
 * Linha do tempo do paciente no prontuário: consultas, evoluções e documentos que o médico pode ver
 * (as regras de acesso do banco filtram o que pertence a ele).
 */
export function PatientTimeline({ patientId }: Props) {
  const [items, setItems] = useState<TimelineItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    let active = true;
    void Promise.all([
      supabase
        .from("appointments")
        .select("id, created_at, type, status")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("medical_records")
        .select("id, created_at, diagnosis, diagnosis_cid, notes, treatment_plan")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("prescriptions")
        .select("id, created_at, prescription_type, status, signed_pdf_path, instructions")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]).then(([appts, records, docs]) => {
      if (!active) return;
      if (appts.error && records.error && docs.error) {
        setError(true);
        return;
      }
      const list: TimelineItem[] = [
        ...(appts.data ?? []).map((a) => ({
          id: `a-${a.id}`,
          at: a.created_at,
          kind: "consulta" as const,
          title: `Consulta (${String(a.type ?? "").replace(/_/g, " ") || "teleconsulta"})`,
          detail: "",
          status: a.status,
        })),
        ...(records.data ?? []).map((r) => ({
          id: `r-${r.id}`,
          at: r.created_at,
          kind: "evolucao" as const,
          title: r.diagnosis_cid || r.diagnosis ? `Evolução: ${r.diagnosis_cid || r.diagnosis}` : "Evolução clínica",
          detail: [r.notes, r.treatment_plan ? `Plano: ${r.treatment_plan}` : ""].filter(Boolean).join("\n"),
        })),
        ...(docs.data ?? []).map((d) => ({
          id: `d-${d.id}`,
          at: d.created_at,
          kind: "documento" as const,
          title: consultationDocumentLabel(d.prescription_type),
          detail: d.instructions ?? "",
          status: d.signed_pdf_path ? "signed" : d.status,
        })),
      ].sort((x, y) => Date.parse(y.at) - Date.parse(x.at));
      setItems(list);
    });
    return () => {
      active = false;
    };
  }, [patientId]);

  if (error) return <p className="py-6 text-sm text-red-600">Não foi possível carregar o histórico agora.</p>;
  if (!items) {
    return (
      <p className="py-6 text-sm text-muted-foreground inline-flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico...
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
        <Calendar size={32} className="mb-2 opacity-30" />
        <p>Nenhum registro anterior deste paciente com você.</p>
      </div>
    );
  }

  return (
    <ol className="relative border-l border-border ml-3 space-y-4">
      {items.map((item) => {
        const Icon = ICONS[item.kind];
        return (
          <li key={item.id} className="ml-5">
            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Icon className="h-3 w-3" />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-foreground">{item.title}</p>
              {item.status && (
                <Badge variant="outline" className="text-[10px]">
                  {STATUS_LABEL[item.status] ?? item.status}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{new Date(item.at).toLocaleString("pt-BR")}</p>
            {item.detail && <p className="mt-1 text-xs text-foreground/80 whitespace-pre-wrap line-clamp-6">{item.detail}</p>}
          </li>
        );
      })}
    </ol>
  );
}
