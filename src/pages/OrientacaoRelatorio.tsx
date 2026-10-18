import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, ArrowLeft, ArrowRight, ShieldCheck, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ReportData {
  id: string;
  session_id: string;
  user_id: string;
  content_md: string;
  status: string;
  approved_at: string | null;
  verification_code: string | null;
  created_at: string;
}

export default function OrientacaoRelatorio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from("ot_reports")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast.error("Relatório não encontrado ou ainda em revisão.");
          return;
        }

        if (data.status !== "approved") {
          toast.info("Este relatório ainda está em análise pelo Dr. Edilson Bezerra.");
        }

        setReport(data as ReportData);
      } catch (e: any) {
        console.error("Erro ao buscar relatório", e);
        toast.error("Não foi possível carregar o relatório.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-muted-foreground">Carregando relatório técnico...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <Card className="max-w-md w-full text-center p-6 space-y-4">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold">Relatório não disponível</h2>
          <p className="text-sm text-muted-foreground">
            O documento solicitado não foi localizado ou ainda aguarda revisão e aprovação médica.
          </p>
          <Button onClick={() => navigate("/orientacao-tecnica")} className="w-full">
            Voltar para Orientação Técnica
          </Button>
        </Card>
      </div>
    );
  }

  const isApproved = report.status === "approved";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      {/* Botões de Ação na Tela (Ocultos na impressão) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate("/orientacao-tecnica")} className="gap-2">
          <ArrowLeft size={16} /> Voltar à Sala
        </Button>
        {isApproved && (
          <Button onClick={handlePrint} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            <Printer size={16} /> Imprimir / Salvar PDF
          </Button>
        )}
      </div>

      {/* Folha do Relatório */}
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-8 md:p-12 print:border-none print:shadow-none print:p-0">
        {/* Cabeçalho Oficial */}
        <div className="border-b border-slate-200 pb-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Planta y Raíz · Telemedicina Integrativa
              </span>
              <h1 className="text-2xl font-black text-slate-900 mt-2">Dr. Edilson Bezerra</h1>
              <p className="text-xs text-slate-600 font-medium">Médico Geral · Medicina Integrativa · Formado em 2018</p>
              <p className="text-xs text-slate-500">
                CRM Bolívia nº 10963 · Consultório: Edifício Ecodent, 1º Anillo, 13º andar, sala 15 · Santa Cruz de la Sierra
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isApproved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}>
                <ShieldCheck size={14} />
                {isApproved ? "Aprovado pelo Dr. Edilson" : "Em Revisão"}
              </span>
              {report.verification_code && (
                <p className="text-[10px] text-slate-400 font-mono mt-1">Cód: {report.verification_code}</p>
              )}
            </div>
          </div>
        </div>

        {/* Status de Rascunho / Alerta */}
        {!isApproved && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Rascunho de Orientação:</strong> Este documento foi gerado pelo assistente de IA e está sob revisão direta do Dr. Edilson Bezerra. A versão final com validade técnica será liberada assim que revisada.
            </div>
          </div>
        )}

        {/* Conteúdo do Relatório em Markdown */}
        <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm">
          <ReactMarkdown>{report.content_md}</ReactMarkdown>
        </div>

        {/* Encaminhamento Clínico para Médicos Prescritores */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden shadow-lg">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-bold text-base text-emerald-300">Próximo Passo: Consulta com Médico Prescritor</h3>
            <p className="text-xs text-slate-200">
              Com seu relatório individual em mãos, agende sua teleconsulta com um dos médicos prescritores habilitados em nossa vitrine.
            </p>
          </div>
          <Button
            onClick={() => navigate("/profissionais")}
            className="w-full sm:w-auto shrink-0 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md"
          >
            Ver Médicos Prescritores <ArrowRight size={16} className="ml-1.5" />
          </Button>
        </div>

        {/* Rodapé e Aviso Legal Obrigatório */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500 space-y-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] leading-relaxed text-slate-600">
            ⚖️ <strong>Aviso Legal & Regulatório:</strong> Este relatório é fruto de orientação técnica educativa e acolhimento em saúde individualizado. <strong>Não é receita médica, não prescreve substâncias nem medicamentos, não estabelece dosagens e não substitui consulta médica formal.</strong> Para prescrição ou indicação de medicamentos, consulte um dos médicos prescritores habilitados em nossa vitrine: <span className="font-semibold text-emerald-700">plantayraiz.com.br/profissionais</span>.
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] text-slate-400">
            <span>Emitido em: {new Date(report.created_at).toLocaleDateString("pt-BR")}</span>
            {report.approved_at && (
              <span>Revisado e Aprovado pelo Dr. Edilson em: {new Date(report.approved_at).toLocaleString("pt-BR")}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
