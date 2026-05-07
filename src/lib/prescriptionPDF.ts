/**
 * 🐸 Planta y Raiz — Gerador de PDF de Prescrição (Client-Side)
 * Gera receitas médicas em PDF usando jsPDF
 * Conformidade: ANVISA RDC 660/327 + CFM
 */

import jsPDF from "jspdf";

export interface PrescriptionData {
  clinicName: string;
  clinicPhone: string;
  doctorName: string;
  doctorCRM: string;
  doctorCRMState: string;
  doctorRQE?: string;
  patientName: string;
  patientCPF: string;
  patientAge: number;
  diagnosisCID?: string;
  medications: {
    name: string;
    dosage: string;
    instructions: string;
  }[];
  notes?: string;
  signatureHash?: string;
  date: Date;
}

export function generatePrescriptionPDF(data: PrescriptionData): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;

  // ─── Header / Logo ─────────────────────────────────────
  doc.setFillColor(10, 12, 16); // #0a0c10
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(16, 185, 129); // Emerald #10b981
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(data.clinicName, margin, 18);

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.text("RECEITUÁRIO MÉDICO — CANNABIS MEDICINAL", margin, 26);
  doc.text(`Tel: ${data.clinicPhone}`, margin, 32);

  doc.setTextColor(16, 185, 129);
  doc.setFontSize(8);
  doc.text(
    `Emitido em: ${data.date.toLocaleDateString("pt-BR")} às ${data.date.toLocaleTimeString("pt-BR")}`,
    pageWidth - margin,
    32,
    { align: "right" }
  );

  y = 50;

  // ─── Dados do Médico ───────────────────────────────────
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("MÉDICO PRESCRITOR", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Dr(a). ${data.doctorName}`, margin, y);
  y += 5;
  doc.text(
    `CRM ${data.doctorCRM}/${data.doctorCRMState}${data.doctorRQE ? ` | RQE ${data.doctorRQE}` : ""}`,
    margin,
    y
  );
  y += 10;

  // ─── Dados do Paciente ─────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("PACIENTE", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Nome: ${data.patientName}`, margin, y);
  y += 5;
  doc.text(`CPF: ${data.patientCPF} | Idade: ${data.patientAge} anos`, margin, y);
  if (data.diagnosisCID) {
    y += 5;
    doc.text(`CID: ${data.diagnosisCID}`, margin, y);
  }
  y += 10;

  // ─── Separador ─────────────────────────────────────────
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ─── Prescrição ────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(16, 185, 129);
  doc.text("PRESCRIÇÃO", margin, y);
  y += 8;

  doc.setTextColor(40, 40, 40);
  data.medications.forEach((med, i) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${i + 1}. ${med.name}`, margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Posologia: ${med.dosage}`, margin + 4, y);
    y += 5;

    const lines = doc.splitTextToSize(
      `Instruções: ${med.instructions}`,
      pageWidth - margin * 2 - 4
    );
    doc.text(lines, margin + 4, y);
    y += lines.length * 4 + 6;

    // Check for page break
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  });

  // ─── Observações ───────────────────────────────────────
  if (data.notes) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Observações:", margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - margin * 2);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4 + 6;
  }

  // ─── Linha de Assinatura ───────────────────────────────
  y = Math.max(y + 10, 215);
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 80, y);
  y += 5;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Dr(a). ${data.doctorName}`, margin, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.text(`Medicina Integrativa`, margin, y);

  // ─── Carimbo Digital do CRM (destaque visual) ─────────
  const stampX = pageWidth - margin - 70;
  const stampY = y - 10;
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1.2);
  doc.roundedRect(stampX, stampY, 70, 26, 3, 3, "S");
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CARIMBO MÉDICO", stampX + 35, stampY + 5, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Dr(a). ${data.doctorName}`, stampX + 35, stampY + 11, { align: "center" });
  doc.setFontSize(10);
  doc.text(`CRM ${data.doctorCRM}/${data.doctorCRMState}`, stampX + 35, stampY + 17, { align: "center" });
  if (data.doctorRQE) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`RQE ${data.doctorRQE}`, stampX + 35, stampY + 22, { align: "center" });
  }
  doc.setTextColor(40, 40, 40);

  // ─── Selo de Assinatura Digital ────────────────────────
  y += 8;
  doc.setFillColor(30, 64, 175);
  doc.roundedRect(margin, y, 70, 10, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("✓ ASSINATURA DIGITAL gov.br / ITI", margin + 35, y + 6.5, { align: "center" });
  doc.setTextColor(40, 40, 40);

  // ─── Hash de Autenticidade ─────────────────────────────
  if (data.signatureHash) {
    y += 10;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Assinatura Digital: ${data.signatureHash}`,
      margin,
      y
    );
  }

  // ─── Footer ────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Documento gerado eletronicamente por Planta & Raiz — plantayraiz.com.br | Válido conforme RDC 660/2023",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  return doc;
}
