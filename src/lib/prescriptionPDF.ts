/**
 * 🐸 Planta y Raiz — Gerador de PDF de Prescrição (Client-Side)
 * Gera receitas médicas em PDF usando jsPDF
 * Layout Limpo - Receituário Simples com assinatura gov.br
 */

import jsPDF from "jspdf";

export interface PrescriptionData {
  clinicName: string;
  clinicPhone: string;
  doctorName: string;
  doctorCRM: string;
  doctorCRMState: string;
  patientName: string;
  patientCPF: string;
  patientAge: number;
  medications: {
    name: string;
    dosage: string;
    instructions: string;
  }[];
  notes?: string;
  signatureHash?: string;
  signatureUrl?: string; // Imagem da assinatura ICP-Brasil (Gov.br)
  date: Date;
}

// Helper para carregar a imagem da assinatura
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

export async function generatePrescriptionPDF(data: PrescriptionData): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25; // Margem padrão
  let y = 30;

  // Cor do texto base
  doc.setTextColor(0, 0, 0);

  // ─── CABEÇALHO (RECEITUÁRIO SIMPLES) ─────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("RECEITUÁRIO SIMPLES", pageWidth / 2, y, { align: "center" });
  
  y += 8;
  doc.setFontSize(12);
  doc.text("Planta y Raíz Mega Clínica Digital", pageWidth / 2, y, { align: "center" });
  
  y += 20;

  // ─── DADOS DO PACIENTE ──────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Nome: ", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.patientName, margin + 14, y);
  y += 6;
  
  doc.setFont("helvetica", "bold");
  doc.text("CPF: ", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.patientCPF, margin + 11, y);

  y += 15;

  // ─── USO CONTÍNUO (CENTRALIZADO EM ITÁLICO) ─────────────────────────────
  doc.setFont("helvetica", "italic");
  doc.setFontSize(14);
  doc.text("USO CONTÍNUO", pageWidth / 2, y, { align: "center" });

  y += 15;

  // ─── MEDICAMENTOS (DUAS COLUNAS) ────────────────────────────────────────
  data.medications.forEach((med) => {
    // Esquerda: Medicamento e Posologia
    // Direita: Quantidade de frascos
    
    // Nome do medicamento
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    // Underline para o nome do medicamento (no estilo da imagem)
    doc.text(med.name, margin, y);
    const textWidth = doc.getTextWidth(med.name);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 1, margin + textWidth, y + 1);

    // Quantidade na direita
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    // Calcular qtd baseada na receita ou default 3
    const qtdMatches = med.dosage.match(/(\d+)\s*(frasco|goma|gota)/i);
    let frascosPorAno = "3";
    if (qtdMatches && parseInt(qtdMatches[1]) > 5) frascosPorAno = "12";

    doc.text("Quant. de frascos por", pageWidth - margin - 40, y);
    doc.text("ano:", pageWidth - margin - 40, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(frascosPorAno, pageWidth - margin - 40, y + 10);

    // Instruções e dosagem
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const instructionsText = `${med.dosage}${med.instructions ? ` - ${med.instructions}` : ''}`;
    const lines = doc.splitTextToSize(instructionsText, pageWidth - margin * 2 - 45);
    doc.text(lines, margin, y);
    
    y += (lines.length * 5) + 12;

    if (y > 200) {
      doc.addPage();
      y = 30;
    }
  });

  // ─── VALIDADE (3 MESES) ─────────────────────────────────────────────────
  y += 10;
  const validDate = new Date(data.date);
  validDate.setMonth(validDate.getMonth() + 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Válido até: ${validDate.toLocaleDateString("pt-BR")} (3 meses)`, margin, y);

  // ─── ASSINATURA MÉDICA (RODAPÉ ESQUERDO) ────────────────────────────────
  // Fica fixo mais para o final da página principal
  y = pageHeight - 85;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(data.doctorName.toUpperCase(), margin, y);
  y += 5;
  doc.text(`MÉDICO: CRM ${data.doctorCRM}/${data.doctorCRMState}`, margin, y);

  // ─── ÁREA DE ASSINATURA DIGITAL (GOV.BR / ICP-BRASIL) ───────────────────
  const footerY = pageHeight - 60;
  
  // Linha marrom clara divisória (fundo color)
  doc.setFillColor(242, 235, 230); // cor pêssego/marrom clara do header/footer
  doc.rect(0, footerY, pageWidth, 5, "F");

  // Logo ICP Brasil (Simulado com texto para facilitar, ou usar base64 no futuro)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ICP", pageWidth - margin - 15, footerY + 12);
  doc.setFontSize(10);
  doc.text("Brasil", pageWidth - margin - 15, footerY + 16);
  
  // Ícone chave simples
  doc.setLineWidth(0.5);
  doc.circle(pageWidth - margin - 10, footerY + 20, 2);
  doc.line(pageWidth - margin - 8, footerY + 20, pageWidth - margin, footerY + 20);
  doc.line(pageWidth - margin - 4, footerY + 20, pageWidth - margin - 4, footerY + 22);

  // Texto ASSINATURAS DIGITAIS DO DOCUMENTO
  let currentY = footerY + 18;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ASSINATURAS DIGITAIS DO DOCUMENTO", margin, currentY);

  currentY += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const legalText = `O documento eletrônico, incluindo a(s) sua(s) assinatura(s), contém ${doc.getNumberOfPages()} páginas e foi produzido para ser assinado digitalmente, mediante o uso de certificados digitais ICP-Brasil, de acordo com os termos do Art. 10, § 1º, da Medida Provisória nº 2.200-2, de 24 de agosto de 2001.`;
  
  const legalLines = doc.splitTextToSize(legalText, pageWidth - margin * 2 - 20);
  doc.text(legalLines, margin, currentY);

  currentY += legalLines.length * 4 + 4;
  doc.setFont("helvetica", "bold");
  doc.text("Documento assinado digitalmente por:", margin, currentY);

  currentY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Digitally signed by ${data.doctorName.toUpperCase()}:${data.doctorCRM}`, margin, currentY);
  doc.text(`Date: ${data.date.toISOString().replace("T", " ").substring(0, 19)} UTC`, margin, currentY + 4);

  // Se o médico fez o upload da imagem da assinatura digital gov.br, insere aqui
  if (data.signatureUrl) {
    try {
      const img = await loadImage(data.signatureUrl);
      // Calcula proporção
      const maxWidth = 50;
      const maxHeight = 25;
      let imgWidth = img.width;
      let imgHeight = img.height;
      const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
      imgWidth = imgWidth * ratio;
      imgHeight = imgHeight * ratio;

      // Coloca no canto inferior esquerdo (logo acima das letras "Digitally signed")
      doc.addImage(img, "PNG", margin + 60, currentY - 10, imgWidth, imgHeight);
    } catch (e) {
      console.warn("Erro ao carregar imagem da assinatura:", e);
    }
  }

  return doc;
}
