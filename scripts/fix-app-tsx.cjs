const fs = require('fs');
const path = require('path');

const appTsxPath = path.join(__dirname, '..', 'src', 'App.tsx');
let content = fs.readFileSync(appTsxPath, 'utf8');

if (!content.includes('import { BrisaChatModal }')) {
  content = content.replace('import { FrogChatModal } from "./components/FrogChatModal";', 'import { FrogChatModal } from "./components/FrogChatModal";\nimport { BrisaChatModal } from "./components/BrisaChatModal";');
}

if (!content.includes('<BrisaChatModal />')) {
  content = content.replace('<FrogChatModal />', '<FrogChatModal />\n            <BrisaChatModal />');
}

fs.writeFileSync(appTsxPath, content);
console.log('App.tsx updated successfully!');
