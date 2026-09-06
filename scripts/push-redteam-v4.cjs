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
  console.log('🚀 Deploy Red-Team v4 — Correções Cirúrgicas\n');

  // Migrations (Bloco 1-3)
  const migMsg = 'fix(security): RLS on sensitive tables + activate agents + cleanup test seeds';
  await pushFile('supabase/migrations/20260829000001_rls_security_fix.sql', migMsg);
  await pushFile('supabase/migrations/20260829000002_activate_agents_production.sql', migMsg);
  await pushFile('supabase/migrations/20260829000003_cleanup_test_seeds.sql', migMsg);

  // Edge Functions (Bloco 4-6)
  const efMsg = 'fix(security): JWT gate on brevo-sync, Evolution API in system-health, Brisa dynamic status';
  await pushFile('supabase/functions/brevo-sync/index.ts', efMsg);
  await pushFile('supabase/functions/system-health/index.ts', efMsg);
  await pushFile('supabase/functions/status-public/index.ts', efMsg);

  // Frontend (Bloco 7)
  const feMsg = 'fix(admin): KPI consultasHoje includes OT orders + polling 15s';
  await pushFile('src/pages/Admin.tsx', feMsg);

  // Infra (Bloco 8)
  const infraMsg = 'fix(infra): HTTPS redirect + www normalization + security headers in .htaccess';
  await pushFile('public/.htaccess', infraMsg);

  console.log('\n🎯 Deploy Red-Team v4 completo!');
}

run();
