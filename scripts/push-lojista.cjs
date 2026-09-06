const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

async function pushFile(path, message) {
  if (!fs.existsSync(path)) { console.log('SKIP (not found): ' + path); return; }
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
    console.log('✅ ' + path);
  } else {
    const errText = await putRes.text();
    console.error('❌ ' + path + ' → ' + putRes.status + ': ' + errText.slice(0, 200));
  }
}

async function run() {
  console.log('🚀 Deploy Lojista and Tour changes\n');

  const msg = 'fix(lojista): Complete Lojista dashboard access and Tour resizing';
  await pushFile('src/components/InteractiveTour3DModal.tsx', msg);
  await pushFile('src/pages/Login.tsx', msg);
  await pushFile('src/pages/AuthCallback.tsx', msg);
  await pushFile('src/pages/LojistaDashboard.tsx', msg);
  await pushFile('src/hooks/useLojista.ts', msg);

  console.log('\n🎯 Deploy concluído!');
}

run();
