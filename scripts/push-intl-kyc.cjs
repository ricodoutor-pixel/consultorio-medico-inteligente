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
  await pushFile('src/index.css', 'style: fix phone input dropdown styles for dark mode');
  await pushFile('src/lib/kyc-docs.ts', 'feat: add passport and visa stay kyc doc types');
  await pushFile('src/pages/CadastroProfissional.tsx', 'feat: expand international countries, multilingual mode, and dynamic KYC');
}

run();
