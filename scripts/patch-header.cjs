const fs = require('fs');
const path = 'src/components/BrisaChatModal.tsx';
let c = fs.readFileSync(path, 'utf8');

if (!c.includes('Headset')) {
  c = c.replace('import { X, Send, Sparkles, Trash2, Minimize2 } from "lucide-react";', 'import { X, Send, Sparkles, Trash2, Minimize2, Headset } from "lucide-react";');
}

if (!c.includes('href="https://wa.me/5511991363154"')) {
  c = c.replace('<button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Minimizar chat">', `<a href="https://wa.me/5511991363154" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-500 transition-colors mr-1" title="Falar com Humano">
              <Headset size={14} />
            </a>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Minimizar chat">`);
}

fs.writeFileSync(path, c);
console.log('BrisaChatModal header patched');
