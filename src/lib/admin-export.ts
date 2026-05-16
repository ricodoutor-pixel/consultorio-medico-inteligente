import jsPDF from "jspdf";

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function exportCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) {
    rows = [{ aviso: "sem dados" }];
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v == null) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n;]/.test(s) ? `"${s}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface AdminPdfPayload {
  kpis: { label: string; value: string }[];
  revenue30d: { dia: string; receita: number; ordens: number }[];
  funnel: { etapa: string; total: number }[];
  audit: { action: string; table_name: string; created_at: string }[];
  alerts?: { title: string; message: string; created_at: string }[];
}

export function exportAdminPDF(payload: AdminPdfPayload, title = "Command Center 360 — Planta y Raiz") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let y = 48;

  // Header
  doc.setFillColor(15, 60, 35);
  doc.rect(0, 0, W, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 36, 40);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Relatório gerado em ${new Date().toLocaleString("pt-BR")}`, 36, 58);

  doc.setTextColor(20, 20, 20);
  y = 100;

  const section = (label: string) => {
    if (y > H - 80) { doc.addPage(); y = 48; }
    doc.setFillColor(27, 67, 50);
    doc.rect(36, y - 14, W - 72, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(label, 44, y);
    doc.setTextColor(20, 20, 20);
    y += 18;
  };

  const row = (cols: string[], widths: number[], bold = false) => {
    if (y > H - 60) { doc.addPage(); y = 48; }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9);
    let x = 44;
    cols.forEach((c, i) => {
      doc.text(String(c).slice(0, 60), x, y);
      x += widths[i];
    });
    y += 14;
  };

  // KPIs
  section("KPIs Principais");
  payload.kpis.forEach((k) => row([k.label, k.value], [220, 200]));

  // Revenue
  y += 8;
  section("Receita & Ordens — Últimos 30 dias");
  row(["Dia", "Receita", "Ordens"], [120, 160, 80], true);
  payload.revenue30d.forEach((r) =>
    row([r.dia, BRL(r.receita), String(r.ordens)], [120, 160, 80])
  );
  const totalRev = payload.revenue30d.reduce((s, r) => s + r.receita, 0);
  const totalOrd = payload.revenue30d.reduce((s, r) => s + r.ordens, 0);
  row(["TOTAL", BRL(totalRev), String(totalOrd)], [120, 160, 80], true);

  // Funnel
  y += 8;
  section("Funil de Conversão");
  row(["Etapa", "Total"], [260, 100], true);
  payload.funnel.forEach((f) => row([f.etapa, String(f.total)], [260, 100]));

  // Alerts
  if (payload.alerts && payload.alerts.length) {
    y += 8;
    section("Alertas Recentes");
    row(["Quando", "Título", "Mensagem"], [120, 140, 200], true);
    payload.alerts.slice(0, 20).forEach((a) =>
      row(
        [new Date(a.created_at).toLocaleString("pt-BR"), a.title, a.message],
        [120, 140, 200]
      )
    );
  }

  // Audit
  y += 8;
  section("Auditoria — Últimos Eventos");
  row(["Quando", "Ação", "Tabela"], [160, 160, 120], true);
  payload.audit.slice(0, 40).forEach((a) =>
    row(
      [new Date(a.created_at).toLocaleString("pt-BR"), a.action, a.table_name],
      [160, 160, 120]
    )
  );

  // Footer all pages
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Planta y Raiz — Confidencial — Página ${i}/${pages}`,
      W / 2,
      H - 18,
      { align: "center" }
    );
  }

  doc.save(`command-center-${new Date().toISOString().slice(0, 10)}.pdf`);
}
