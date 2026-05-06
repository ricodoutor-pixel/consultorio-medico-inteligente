import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star } from "lucide-react";

/**
 * Página pública de teste E2E do trigger trg_release_doctor_credit.
 * Insere em consultation_ratings e exibe o status gerado em consultation_credit_audit.
 * Acesso: /qa/rating-test (somente para QA — não linkada no menu)
 */
export default function QaRatingTest() {
  const [consultationId, setConsultationId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [patientId, setPatientId] = useState("");
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const submit = async () => {
    if (!consultationId || !doctorId || !patientId) {
      toast.error("Preencha consultation_id, doctor_id e patient_id");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data: inserted, error: insertErr } = await (supabase as any)
        .from("consultation_ratings")
        .insert({
          consultation_id: consultationId,
          professional_id: doctorId,
          patient_id: patientId,
          stars,
          comment: comment || null,
        })
        .select("id")
        .single();
      if (insertErr) throw insertErr;

      // Aguarda trigger
      await new Promise((r) => setTimeout(r, 800));

      // Aplica regra de release/under_review (5★ libera 93% ao médico)
      const { financialSplitService } = await import("@/services/financialSplitService");
      const release = await financialSplitService.releaseDoctorCreditOnRating(inserted.id);

      const { data: audit, error: auditErr } = await (supabase as any)
        .from("consultation_credit_audit")
        .select("*")
        .eq("consultation_id", consultationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (auditErr) throw auditErr;

      setResult({ ...audit, release });
      toast.success(
        release.status === "released"
          ? "✅ Crédito LIBERADO automaticamente (5★)"
          : "⚠️ Crédito EM AUDITORIA (avaliação <5★) — alerta gerado"
      );
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>QA — Teste do Trigger de Auditoria de Crédito</CardTitle>
          <p className="text-sm text-muted-foreground">
            Insere uma avaliação real em <code>consultation_ratings</code> e exibe
            o resultado processado pelo trigger em <code>consultation_credit_audit</code>.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">consultation_id (UUID)</label>
            <Input value={consultationId} onChange={(e) => setConsultationId(e.target.value)} placeholder="uuid da consulta" />
          </div>
          <div>
            <label className="text-sm font-medium">doctor_id (UUID)</label>
            <Input value={doctorId} onChange={(e) => setDoctorId(e.target.value)} placeholder="uuid do médico" />
          </div>
          <div>
            <label className="text-sm font-medium">patient_id (UUID)</label>
            <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="uuid do paciente" />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Estrelas</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setStars(n)} className="p-1">
                  <Star className={`w-7 h-7 ${n <= stars ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>

          <Textarea placeholder="Comentário (opcional)" value={comment} onChange={(e) => setComment(e.target.value)} />

          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? "Processando..." : "Disparar Avaliação"}
          </Button>

          {result && (
            <Card className="bg-muted">
              <CardContent className="p-4 space-y-1 text-sm">
                <div><b>status:</b> {result.status}</div>
                <div><b>stars:</b> {result.stars}</div>
                <div><b>amount:</b> {result.amount ?? "—"}</div>
                <div><b>reason:</b> {result.reason ?? "—"}</div>
                <div className="text-xs text-muted-foreground">id: {result.id}</div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
