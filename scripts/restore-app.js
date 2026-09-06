import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function run() {
  const commitsRes = await fetch('https://api.github.com/repos/ricodoutor-pixel/consultorio-medico-inteligente/commits?path=src/App.tsx', {
    headers: { 'Authorization': 'token ' + GITHUB_TOKEN, 'Accept': 'application/vnd.github.v3+json' }
  });
  const commits = await commitsRes.json();
  const sha = commits[1].sha; // previous commit before my push
  
  const contentRes = await fetch('https://api.github.com/repos/ricodoutor-pixel/consultorio-medico-inteligente/contents/src/App.tsx?ref=' + sha, {
    headers: { 'Authorization': 'token ' + GITHUB_TOKEN, 'Accept': 'application/vnd.github.v3+json' }
  });
  const data = await contentRes.json();
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  
  // Add BrisaChatModal
  let fixed = content.replace('import { FrogChatModal } from "./components/FrogChatModal";', 'import { FrogChatModal } from "./components/FrogChatModal";\nimport { BrisaChatModal } from "./components/BrisaChatModal";');
  fixed = fixed.replace('<FrogChatModal />', '<FrogChatModal />\n            <BrisaChatModal />');
  
  fs.writeFileSync('src/App.tsx', fixed);
  console.log('Restored App.tsx correctly!');
}

run();
