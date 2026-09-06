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
  const files = [
    'supabase/functions/_shared/cors.ts',
    'supabase/functions/create-payment/index.ts',
    'supabase/functions/mp-checkout/index.ts',
    'supabase/functions/create-cart-payment/index.ts',
    'supabase/functions/process-payout-distribution/index.ts',
    'supabase/functions/financial-reconciliation/index.ts',
    'supabase/functions/process-pix-payout/index.ts',
    'supabase/functions/create-stripe-payment/index.ts',
    'supabase/functions/create-payment-split/index.ts',
    'supabase/functions/prescription-to-cart/index.ts',
    'supabase/functions/brevo-sync/index.ts',
    'supabase/functions/brisa-chat/index.ts',
    'supabase/functions/brisa-web-chat/index.ts',
    'supabase/functions/prescription-hash-audit/index.ts',
    'supabase/migrations/20260827220000_security_rls_hardening.sql',
    'src/components/consultation/JitsiRoom.tsx',
    'src/components/doctor/DoctorProfileSettings.tsx',
  ];

  for (const f of files) {
    await pushFile(f, 'fix(security): red-team audit consolidation - server-side pricing, RLS hardening, prompt injection defense, CORS restriction, and Jitsi WhatsApp failover');
  }
}

run();
