import fs from 'fs';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("ERRO: GITHUB_TOKEN não fornecido. Execute: set GITHUB_TOKEN=seu_token && node scripts/github_push.mjs");
  process.exit(1);
}

const REPO_OWNER = 'ricodoutor-pixel';
const REPO_NAME = 'consultorio-medico-inteligente';
const BRANCH = 'main';

const filesToUpdate = [
  'scripts/get-supabase-keys.mjs',
  'scripts/list-functions.mjs',
  'scripts/list-supabase-projects.mjs'
];

async function api(path, options = {}) {
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API Error: ${res.status} - ${text}`);
  }
  return res.json();
}

async function run() {
  try {
    console.log(`Buscando branch ${BRANCH}...`);
    const ref = await api(`git/refs/heads/${BRANCH}`);
    const latestCommitSha = ref.object.sha;

    console.log(`Buscando o último commit (${latestCommitSha})...`);
    const commit = await api(`git/commits/${latestCommitSha}`);
    const baseTreeSha = commit.tree.sha;

    console.log("Criando blobs para os arquivos atualizados...");
    const newTree = [];
    for (const filePath of filesToUpdate) {
      const content = fs.readFileSync(filePath, 'utf8');
      const blob = await api('git/blobs', {
        method: 'POST',
        body: JSON.stringify({ content, encoding: 'utf-8' })
      });
      newTree.push({
        path: filePath,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
      console.log(`Blob criado para ${filePath}: ${blob.sha}`);
    }

    console.log("Criando nova tree (árvore)...");
    const tree = await api('git/trees', {
      method: 'POST',
      body: JSON.stringify({ base_tree: baseTreeSha, tree: newTree })
    });
    
    console.log("Criando novo commit (Fix exposed secrets)...");
    const newCommit = await api('git/commits', {
      method: 'POST',
      body: JSON.stringify({
        message: "chore: remove exposed supabase token\n\nFixed via automated script.",
        tree: tree.sha,
        parents: [latestCommitSha]
      })
    });

    console.log("Atualizando a referência da branch...");
    await api(`git/refs/heads/${BRANCH}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: newCommit.sha, force: true })
    });

    console.log("SUCESSO! Código enviado para o GitHub.");
  } catch (err) {
    console.error("Falha ao executar push:", err);
  }
}

run();
