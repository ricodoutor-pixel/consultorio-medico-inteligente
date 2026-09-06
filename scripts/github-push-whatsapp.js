import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'ricodoutor-pixel';
const REPO_NAME = 'consultorio-medico-inteligente';
const BRANCH = 'main';

async function pushFile(filePath, commitMessage) {
  const content = fs.readFileSync(filePath, 'utf8');
  const base64Content = Buffer.from(content).toString('base64');
  
  // 1. Get current file sha
  const getUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`;
  const getRes = await fetch(getUrl, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  
  let sha;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }
  
  // 2. Put file
  const putRes = await fetch(getUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: commitMessage,
      content: base64Content,
      branch: BRANCH,
      sha: sha
    })
  });
  
  if (putRes.ok) {
    console.log(`Successfully pushed ${filePath}`);
    const json = await putRes.json();
    console.log("Commit SHA:", json.commit.sha);
  } else {
    const err = await putRes.text();
    console.error(`Failed to push ${filePath}:`, err);
  }
}

async function main() {
  await pushFile('src/components/WhatsAppButton.tsx', 'Force push WhatsAppButton.tsx to fix Brisa integration');
}
main();
