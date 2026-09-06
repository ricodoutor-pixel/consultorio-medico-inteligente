const fs = require('fs');
let code = fs.readFileSync('src/components/WhatsAppButton.tsx', 'utf8');
if (!code.includes('import { BrisaChatModal }')) {
  code = code.replace('import brisaAvatar', 'import { BrisaChatModal } from "./BrisaChatModal";\nimport brisaAvatar');
  code = code.replace('</button>', '</button>\n      <BrisaChatModal />');
  fs.writeFileSync('src/components/WhatsAppButton.tsx', code);
  console.log('Injected BrisaChatModal into WhatsAppButton.tsx');
}
