const fs = require('fs');
let c = fs.readFileSync('src/pages/MonitoramentoSaude.tsx', 'utf8');
const imp = "import { PatientDiagnosticPanel } from '@/components/diagnostics/PatientDiagnosticPanel';\n";
if (!c.includes('PatientDiagnosticPanel')) {
  c = imp + c;
  const titleI = c.indexOf('<div className="grid gap-8');
  if (titleI !== -1) {
    const inject = '<div className="mb-12"><h2 className="text-2xl font-bold text-gray-900 mb-6">Painel Diagnóstico Avançado (INPI)</h2><PatientDiagnosticPanel /></div>\n        ';
    c = c.substring(0, titleI) + inject + c.substring(titleI);
  }
  fs.writeFileSync('src/pages/MonitoramentoSaude.tsx', c);
  console.log('Injected PatientDiagnosticPanel into MonitoramentoSaude.tsx');
}

let doc = fs.readFileSync('src/pages/WorkspaceMedico.tsx', 'utf8');
const impDoc = "import { DoctorIoMTDashboard } from '@/components/diagnostics/DoctorIoMTDashboard';\n";
if (!doc.includes('DoctorIoMTDashboard')) {
  doc = impDoc + doc;
  const contentStart = doc.indexOf('<main className="flex-1 p-4 md:p-8 overflow-auto">');
  if (contentStart !== -1) {
    const insertAfter = '<main className="flex-1 p-4 md:p-8 overflow-auto">\n        <div className="max-w-7xl mx-auto space-y-6">\n          ';
    // Let's replace precisely by finding `space-y-6">`
    const insertPos = doc.indexOf('max-w-7xl mx-auto space-y-6">') + 'max-w-7xl mx-auto space-y-6">'.length;
    if (insertPos > 'max-w-7xl mx-auto space-y-6">'.length) {
      doc = doc.substring(0, insertPos) + '\n<div className="mb-8"><h2 className="text-xl font-bold text-slate-800 mb-2">Central de Telemetria e Diagnóstico IoMT</h2><DoctorIoMTDashboard /></div>' + doc.substring(insertPos);
    }
  }
  fs.writeFileSync('src/pages/WorkspaceMedico.tsx', doc);
  console.log('Injected DoctorIoMTDashboard into WorkspaceMedico.tsx');
}
