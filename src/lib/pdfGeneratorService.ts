// pdfGeneratorService.ts

export interface PrescriptionData {
  patientName: string;
  doctorName: string;
  date: string;
  products: string[];
  posology: string;
  generalGuidelines: string[];
}

/**
 * Mock service that generates an elegant PDF guide for the patient.
 * It injects the data into a hidden DOM element and uses window.print()
 * combined with CSS @media print to format it as a beautiful PDF without 
 * needing heavy third-party libraries like jspdf.
 */
export function generateEducationalPDF(data: PrescriptionData) {
  // Create a hidden iframe or div to hold the print content
  const printContainer = document.createElement("div");
  printContainer.id = "print-container";
  
  // Set styling that will only be active during print
  printContainer.innerHTML = `
    <style>
      @media screen {
        #print-container { display: none; }
      }
      @media print {
        @page { margin: 2cm; }
        body { font-family: 'Inter', sans-serif; color: #111; }
        h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 20px; font-size: 18px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: 900; color: #10b981; }
        .content { line-height: 1.6; }
        .card { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px; }
        .footer { margin-top: 50px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
      }
    </style>
    
    <div class="header">
      <div>
        <div class="logo">Planta y Raíz</div>
        <div>Medicina Canabinoide Avançada</div>
      </div>
      <div style="text-align: right;">
        <div><strong>Paciente:</strong> ${data.patientName}</div>
        <div><strong>Médico:</strong> ${data.doctorName}</div>
        <div><strong>Data:</strong> ${data.date}</div>
      </div>
    </div>

    <h1>Guia Pessoal de Tratamento</h1>
    
    <div class="content">
      <p>Este guia foi gerado exclusivamente para você pela Brisa IA para auxiliar na sua adaptação ao tratamento.</p>

      <h2>💊 Seus Produtos</h2>
      <div class="card">
        <ul>
          ${data.products.map(p => `<li><strong>${p}</strong></li>`).join("")}
        </ul>
      </div>

      <h2>⚖️ Posologia e Titulação (Start Low, Go Slow)</h2>
      <div class="card">
        <p>${data.posology.replace(/\n/g, "<br/>")}</p>
      </div>

      <h2>🌿 Orientações de Ouro</h2>
      <div class="card">
        <ul>
          ${data.generalGuidelines.map(g => `<li>${g}</li>`).join("")}
        </ul>
      </div>
    </div>

    <div class="footer">
      Documento auxiliar educativo. Sempre siga a receita médica original e acompanhe sua titulação no Dashboard.
    </div>
  `;

  document.body.appendChild(printContainer);

  // Trigger print
  window.print();

  // Cleanup after printing dialog is closed
  setTimeout(() => {
    if (document.body.contains(printContainer)) {
      document.body.removeChild(printContainer);
    }
  }, 1000);
}
