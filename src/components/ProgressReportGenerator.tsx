import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

interface Outcome {
  symptom_level: number;
  mood: string;
  notes: string | null;
  created_at: string;
}

interface ProgressReportGeneratorProps {
  userId: string;
  patientName: string;
}

// Sanitize text: remove unsupported chars, replace accents for jsPDF Helvetica
const sanitize = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "") // keep latin-1 printable
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, "-")
    .replace(/\u2026/g, "...")
    .trim();
};

const safeName = (name: string): string => {
  const s = sanitize(name);
  return s.length > 0 ? s : "Paciente";
};

export function ProgressReportGenerator({ userId, patientName }: ProgressReportGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const { data: rawOutcomes } = await supabase
        .from("clinical_outcomes" as any)
        .select("symptom_level, mood, notes, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(90);

      const outcomes = (rawOutcomes || []) as unknown as Outcome[];

      if (outcomes.length === 0) {
        toast({ title: "Sem dados", description: "Registre check-ins de evolução antes de gerar o relatório.", variant: "destructive" });
        setGenerating(false);
        return;
      }

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210;
      const margin = 20;
      const contentW = W - margin * 2;
      let y = 20;

      const name = safeName(patientName);

      // ========= HEADER =========
      doc.setFillColor(34, 139, 34);
      doc.rect(0, 0, W, 38, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("Planta y Raiz", margin, 16);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Plataforma de Saude Digital | Cannabis Medicinal", margin, 24);

      doc.setFontSize(9);
      const today = new Date().toLocaleDateString("pt-BR");
      doc.text(sanitize(`Emissao: ${today}`), W - margin - 50, 16);
      doc.text("CRM: 12345/SP", W - margin - 50, 22);
      doc.text("Dra. Suelen Naves Rodrigues da Silva", W - margin - 50, 28);

      y = 48;

      // Patient info box
      doc.setFillColor(245, 248, 245);
      doc.roundedRect(margin, y, contentW, 18, 3, 3, "F");
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(sanitize(`Paciente: ${name}`), margin + 5, y + 7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const firstDate = new Date(outcomes[0].created_at).toLocaleDateString("pt-BR");
      const lastDate = new Date(outcomes[outcomes.length - 1].created_at).toLocaleDateString("pt-BR");
      doc.text(sanitize(`Periodo: ${firstDate} a ${lastDate} | Total de registros: ${outcomes.length}`), margin + 5, y + 14);

      y += 26;

      // ========= SECTION 1: EVOLUTION CHART =========
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(34, 139, 34);
      doc.text("1. Curva de Resposta Terapeutica", margin, y);
      y += 8;

      const chartX = margin + 10;
      const chartW = contentW - 20;
      const chartH = 55;
      const chartY = y;

      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      for (let i = 0; i <= 10; i += 2) {
        const ly = chartY + chartH - (i / 10) * chartH;
        doc.line(chartX, ly, chartX + chartW, ly);
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 130);
        doc.text(String(i), chartX - 6, ly + 1);
      }

      if (outcomes.length > 1) {
        const step = chartW / (outcomes.length - 1);
        doc.setDrawColor(34, 139, 34);
        doc.setLineWidth(0.8);

        for (let i = 0; i < outcomes.length - 1; i++) {
          const x1 = chartX + i * step;
          const x2 = chartX + (i + 1) * step;
          const lv1 = Number(outcomes[i].symptom_level) || 0;
          const lv2 = Number(outcomes[i + 1].symptom_level) || 0;
          const y1 = chartY + chartH - (lv1 / 10) * chartH;
          const y2 = chartY + chartH - (lv2 / 10) * chartH;
          doc.line(x1, y1, x2, y2);
        }

        for (let i = 0; i < outcomes.length; i++) {
          const cx = chartX + i * step;
          const lv = Number(outcomes[i].symptom_level) || 0;
          const cy = chartY + chartH - (lv / 10) * chartH;
          doc.setFillColor(34, 139, 34);
          doc.circle(cx, cy, 1.2, "F");
        }

        doc.setDrawColor(200, 170, 50);
        doc.setLineWidth(0.4);
        const goalY = chartY + chartH - (5 / 10) * chartH;
        doc.setLineDashPattern([2, 2], 0);
        doc.line(chartX, goalY, chartX + chartW, goalY);
        doc.setLineDashPattern([], 0);
        doc.setFontSize(7);
        doc.setTextColor(180, 150, 30);
        doc.text("Meta", chartX + chartW + 2, goalY + 1);
      }

      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.text(firstDate, chartX, chartY + chartH + 5);
      doc.text(lastDate, chartX + chartW - 15, chartY + chartH + 5);

      y = chartY + chartH + 14;

      // ========= SECTION 2: CLINICAL SUMMARY =========
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(34, 139, 34);
      doc.text("2. Resumo Clinico", margin, y);
      y += 8;

      const firstLevel = Number(outcomes[0].symptom_level) || 0;
      const lastLevel = Number(outcomes[outcomes.length - 1].symptom_level) || 0;
      const avgLevel = outcomes.reduce((s, o) => s + (Number(o.symptom_level) || 0), 0) / outcomes.length;
      const improvement = firstLevel > 0 ? Math.round(((firstLevel - lastLevel) / firstLevel) * 100) : 0;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);

      const summaryLines = [
        sanitize(`O paciente apresenta ${improvement > 0 ? `melhora de ${improvement}%` : improvement === 0 ? "estabilidade" : `aumento de ${Math.abs(improvement)}%`} nos sintomas desde o inicio do acompanhamento em ${firstDate}.`),
        "",
        sanitize(`Nivel medio de sintomas registrado: ${avgLevel.toFixed(1)}/10.`),
        sanitize(`Nivel inicial: ${firstLevel}/10 | Nivel atual: ${lastLevel}/10.`),
        sanitize(`Total de check-ins realizados: ${outcomes.length}.`),
      ];

      summaryLines.forEach(line => {
        if (line === "") { y += 3; return; }
        const split = doc.splitTextToSize(line, contentW - 5);
        doc.text(split, margin + 3, y);
        y += split.length * 5;
      });

      y += 4;
      if (improvement > 0) {
        doc.setFillColor(230, 255, 230);
        doc.roundedRect(margin, y, 80, 10, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(34, 139, 34);
        doc.text(sanitize(`Tendencia: Melhora de ${improvement}%`), margin + 4, y + 7);
      } else {
        doc.setFillColor(255, 245, 230);
        doc.roundedRect(margin, y, 80, 10, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(180, 100, 20);
        doc.text("Tendencia: Estavel / Em observacao", margin + 4, y + 7);
      }
      y += 18;

      // ========= SECTION 3: RECENT NOTES =========
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(34, 139, 34);
      doc.text("3. Notas de Acompanhamento", margin, y);
      y += 8;

      const notesEntries = outcomes.filter(o => o.notes && o.notes.trim().length > 0).slice(-5);

      if (notesEntries.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(130, 130, 130);
        doc.text("Nenhuma nota registrada pelo paciente.", margin + 3, y);
        y += 8;
      } else {
        notesEntries.forEach((entry, idx) => {
          const entryDate = new Date(entry.created_at).toLocaleDateString("pt-BR");
          doc.setFillColor(idx % 2 === 0 ? 250 : 245, idx % 2 === 0 ? 250 : 248, idx % 2 === 0 ? 255 : 252);
          doc.roundedRect(margin, y, contentW, 14, 2, 2, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(80, 80, 80);
          doc.text(sanitize(`${entryDate} | ${entry.mood || "neutro"} | Nivel: ${Number(entry.symptom_level) || 0}/10`), margin + 3, y + 5);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(60, 60, 60);
          const rawNote = entry.notes || "";
          const noteText = sanitize(rawNote.length > 120 ? rawNote.slice(0, 117) + "..." : rawNote);
          doc.text(noteText || "-", margin + 3, y + 11);
          y += 17;

          if (y > 265) {
            doc.addPage();
            y = 20;
          }
        });
      }

      // ========= QR CODE =========
      y += 6;
      if (y > 240) { doc.addPage(); y = 20; }

      doc.setFillColor(240, 240, 240);
      doc.roundedRect(margin, y, 30, 30, 2, 2, "F");
      doc.setFillColor(30, 30, 30);
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          if ((row + col) % 3 !== 0) {
            doc.rect(margin + 2 + col * 3.2, y + 2 + row * 3.2, 2.5, 2.5, "F");
          }
        }
      }

      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text("Escaneie para acessar a", margin + 34, y + 10);
      doc.setFont("helvetica", "bold");
      doc.text("Planta y Raiz", margin + 34, y + 16);
      doc.setFont("helvetica", "normal");
      doc.text("plantayraiz.com.br", margin + 34, y + 22);

      // ========= FOOTER =========
      const footerY = 280;
      doc.setDrawColor(34, 139, 34);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 4, W - margin, footerY - 4);

      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "italic");
      const disclaimer = "Este documento e um relatorio de acompanhamento para fins informativos e deve ser interpretado por um profissional de saude. Registros protegidos pela LGPD (Lei 13.709/2018). Planta y Raiz - Plataforma de Intermediacao de Saude Digital.";
      const footerLines = doc.splitTextToSize(disclaimer, contentW);
      doc.text(footerLines, margin, footerY);

      // Safe filename
      const safeFn = name.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_").slice(0, 50);
      doc.save(`Relatorio_Progresso_${safeFn}_${today.replace(/\//g, "-")}.pdf`);
      toast({ title: "PDF gerado com sucesso! 📄", description: "O relatório foi baixado automaticamente." });
    } catch (err) {
      toast({ title: "Erro ao gerar relatório", description: "Tente novamente em instantes. Se o problema persistir, entre em contato com o suporte.", variant: "destructive" });
    }
    setGenerating(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xl text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
      onClick={generatePDF}
      disabled={generating}
    >
      {generating ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
      {generating ? "Gerando..." : "Baixar Relatório PDF"}
    </Button>
  );
}
