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
    console.log('✅ Pushed ' + path);
  } else {
    console.error('❌ Failed ' + path, await putRes.text());
  }
}

async function run() {
  const msg = 'fix(admin): restore all doctors in approvals page with full KYC dossier and CFM verification';

  const files = [
    'src/hooks/useDoctors.ts',
  ];

  for (const f of files) {
    await pushFile(f, msg);
  }

  console.log('\n🚀 Deploy concluído! hook useDoctors sincronizado na main.');
}

run();
