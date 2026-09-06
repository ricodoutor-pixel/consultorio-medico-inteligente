const fs = require('fs');
let c = fs.readFileSync('src/components/admin/KycDocViewer.tsx', 'utf8');

c = c.replace(
  '<ExternalLink size={12} /> Abrir em nova aba / baixar original',
  '<Download size={18} /> Baixar Arquivo Original (Alta Resolução)'
);

c = c.replace(
  'import { Loader2, AlertTriangle, ExternalLink }',
  'import { Loader2, AlertTriangle, ExternalLink, Download }'
);

c = c.replace(
  'className="text-xs font-bold text-emerald-400 flex items-center gap-1 hover:underline"',
  'className="flex w-full mt-4 items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold transition-colors text-sm shadow-md"'
);

fs.writeFileSync('src/components/admin/KycDocViewer.tsx', c);
console.log('updated KycDocViewer');
