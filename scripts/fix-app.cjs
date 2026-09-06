const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
if (!c.includes('import { BrisaChatModal }')) {
  c = c.replace('import { FrogChatModal }', 'import { BrisaChatModal } from "@/components/BrisaChatModal";\nimport { FrogChatModal }');
  fs.writeFileSync('src/App.tsx', c);
  console.log('Fixed imports!');
}
