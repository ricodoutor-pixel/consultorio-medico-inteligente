const fs = require('fs');
let c = fs.readFileSync('src/pages/MonitoramentoCSI.tsx', 'utf8');
const imp = "import { DoctorIoMTDashboard } from '@/components/diagnostics/DoctorIoMTDashboard';\n";
if (!c.includes('DoctorIoMTDashboard')) {
  c = imp + c;
  const insertPos = c.indexOf('</CardContent>\n        </Card>\n      </div>');
  if (insertPos !== -1) {
    // Just inject at the end of the container
    const endContainer = c.lastIndexOf('</div>\n    </div>');
    if (endContainer !== -1) {
      c = c.substring(0, endContainer) + '\n<div className="mt-8"><h2 className="text-2xl font-bold mb-4">Instrumentação Clínica Remota</h2><DoctorIoMTDashboard /></div>' + c.substring(endContainer);
    }
  }
  fs.writeFileSync('src/pages/MonitoramentoCSI.tsx', c);
  console.log('Injected DoctorIoMTDashboard into MonitoramentoCSI.tsx');
}
