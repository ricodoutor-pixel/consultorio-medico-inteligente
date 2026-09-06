const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

async function pushFile(path, message) {
  if (!fs.existsSync(path)) return;
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
    console.log('✅ Pushed ' + path);
  } else {
    console.error('❌ Failed ' + path, await putRes.text());
  }
}

async function deleteFile(path, message) {
  const getRes = await fetch('https://api.github.com/repos/ricodoutor-pixel/consultorio-medico-inteligente/contents/' + path, {
    headers: {
      'Authorization': 'token ' + process.env.GITHUB_TOKEN,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Node.js'
    }
  });

  if (!getRes.ok) return;
  const data = await getRes.json();
  const sha = data.sha;

  const delRes = await fetch('https://api.github.com/repos/ricodoutor-pixel/consultorio-medico-inteligente/contents/' + path, {
    method: 'DELETE',
    headers: {
      'Authorization': 'token ' + process.env.GITHUB_TOKEN,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Node.js'
    },
    body: JSON.stringify({
      message: message,
      sha: sha,
      branch: 'main'
    })
  });

  if (delRes.ok) {
    console.log('🗑️ Deleted from repo: ' + path);
  }
}

async function run() {
  const msg = 'fix(security): surgical corrections v3 — sanitize prompt injection, strict CORS, prompt safety, devlog console cleanup, consolidate SEO';

  const files = [
    'supabase/functions/brisa-web-chat/index.ts',
    'supabase/functions/_shared/cors.ts',
    'supabase/functions/process-payout/index.ts',
    'supabase/functions/process-pix-payout/index.ts',
    'supabase/functions/create-payment/index.ts',
    'supabase/functions/mercadopago-webhook/index.ts',
    'supabase/functions/dr-edilson-clinical-support/index.ts',
    'src/lib/devlog.ts',
    'src/lib/anti-clone.ts',
    'src/services/module4-financial-engine.ts',
    'src/lib/module5-devops-integrity.ts',
    'src/services/consultationWorkflow.ts',
    'src/main.tsx',
  ];

  for (const f of files) {
    await pushFile(f, msg);
  }

  // Delete deprecated files from repo
  await deleteFile('src/components/Navigation.tsx', 'chore: remove deprecated Navigation.tsx wrapper');
  await deleteFile('src/lib/open-graph.ts', 'chore: remove legacy open-graph.ts (consolidated to complete)');
  await deleteFile('src/lib/open-graph-expanded.ts', 'chore: remove open-graph-expanded.ts (consolidated to complete)');

  console.log('\n🚀 Deploy das Correções Cirúrgicas v3 concluído na main!');
}

run();
