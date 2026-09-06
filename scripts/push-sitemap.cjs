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
  console.log('🚀 Deploy New Sitemap\n');

  const msg = 'chore(seo): Update sitemap.xml to 60 SEO prioritized URLs';
  await pushFile('public/sitemap.xml', msg);

  console.log('\n🎯 Deploy concluído!');
}

run();
