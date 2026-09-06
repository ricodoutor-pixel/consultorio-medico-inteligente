const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

async function pushFile(path, message) {
  if (!fs.existsSync(path)) return;
  const content = fs.readFileSync(path, 'utf8');
  const base64Content = Buffer.from(content).toString('base64');

  const getRes = await fetch('https://api.github.com/repos/ricodoutor-pixel/consultorio-medico-inteligente/contents/' + path, {
    headers: { 'Authorization': 'token ' + process.env.GITHUB_TOKEN, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Node.js' }
  });

  let sha;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  const putRes = await fetch('https://api.github.com/repos/ricodoutor-pixel/consultorio-medico-inteligente/contents/' + path, {
    method: 'PUT',
    headers: { 'Authorization': 'token ' + process.env.GITHUB_TOKEN, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Node.js' },
    body: JSON.stringify({ message: message, content: base64Content, sha: sha, branch: 'main' })
  });

  if (putRes.ok) { console.log('✅ ' + path); } 
}

async function run() {
  const msg = 'fix(auth): separate login for pharmacies';
  await pushFile('src/pages/LoginFarmacia.tsx', msg);
  await pushFile('src/pages/Login.tsx', msg);
  await pushFile('src/pages/Cadastro.tsx', msg);
  await pushFile('src/App.tsx', msg);
  console.log('Done!');
}
run();
