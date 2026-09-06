const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

async function pushFile(path, message) {
  const content = fs.readFileSync(path, 'utf8');
  const base64Content = Buffer.from(content).toString('base64');

  const getRes = await fetch('https://api.github.com/repos/ricodoutor-pixel/consultorio-medico-inteligente/contents/' + path, {
    headers: {
      'Authorization': 'token ' + process.env.GITHUB_TOKEN,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Node.js'
    }
  });

  let sha;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  const putRes = await fetch('https://api.github.com/repos/ricodoutor-pixel/consultorio-medico-inteligente/contents/' + path, {
    method: 'PUT',
    headers: {
      'Authorization': 'token ' + process.env.GITHUB_TOKEN,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Node.js'
    },
    body: JSON.stringify({
      message: message,
      content: base64Content,
      sha: sha,
      branch: 'main'
    })
  });

  if (putRes.ok) {
    console.log('Successfully pushed ' + path);
  } else {
    console.error('Failed to push ' + path, await putRes.text());
  }
}

async function run() {
  await pushFile('src/pages/Cadastro.tsx', 'feat: remove extra roles and fix google login visibility');
  await pushFile('src/pages/Login.tsx', 'feat: limit google login to patients');
  await pushFile('src/pages/AdminLogin.tsx', 'feat: remove google login from admin');
  await pushFile('vite.config.ts', 'fix: expand esbuild target for iOS Safari compatibility');
}

run();
