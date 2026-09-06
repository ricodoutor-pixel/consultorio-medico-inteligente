const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');

const TARGET_DIRECTORIES = [
  'src',
  'supabase',
  'scripts',
  'public'
];

const ROOT_CONFIG_FILES = [
  'package.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'index.html',
  'tailwind.config.ts',
  'postcss.config.js',
  'components.json'
];

const IGNORE_EXTENSIONS = new Set([
  '.zip',
  '.log',
  '.tmp'
]);

function getSourceFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item.startsWith('.')) continue; // ignore hidden files/folders
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      getSourceFiles(fullPath, fileList);
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (!IGNORE_EXTENSIONS.has(ext)) {
        fileList.push({
          fullPath,
          relPath: path.relative(rootDir, fullPath).replace(/\\/g, '/'),
          size: stat.size
        });
      }
    }
  }
  return fileList;
}

function readFileWithRetry(filePath, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return fs.readFileSync(filePath);
    } catch (e) {
      if (i === retries - 1) throw e;
      // Sleep synchronously for 100ms
      const start = Date.now();
      while (Date.now() - start < 100) {}
    }
  }
}

function computeDirectSha512() {
  console.log("================================================================================");
  console.log("  GERAÇÃO DE RESUMO DIGITAL (HASH SHA-512) PARA REGISTRO DE PROGRAMA NO INPI   ");
  console.log("  Planta y Raíz — Consultório Médico Inteligente & Telemedicina Canabinoide    ");
  console.log("================================================================================");

  let allFiles = [];

  // Coleta arquivos das pastas-alvo do código-fonte
  TARGET_DIRECTORIES.forEach(d => {
    const full = path.join(rootDir, d);
    getSourceFiles(full, allFiles);
  });

  // Coleta arquivos de configuração na raiz
  ROOT_CONFIG_FILES.forEach(f => {
    const full = path.join(rootDir, f);
    if (fs.existsSync(full)) {
      const stat = fs.statSync(full);
      allFiles.push({
        fullPath: full,
        relPath: f,
        size: stat.size
      });
    }
  });

  // Ordenação determinística por caminho relativo canônico
  allFiles.sort((a, b) => a.relPath.localeCompare(b.relPath));

  console.log(`[1] Total de arquivos-fonte do projeto computados: ${allFiles.length}`);

  // Resumo Digital Determinístico Oficial (SHA-512)
  const masterSha512 = crypto.createHash('sha512');
  let totalBytes = 0;

  allFiles.forEach(f => {
    const data = readFileWithRetry(f.fullPath);
    totalBytes += data.length;
    masterSha512.update(`BLOB:${f.relPath}:${f.size}\n`);
    masterSha512.update(data);
    masterSha512.update('\n---END_OF_FILE---\n');
  });

  const finalSha512 = masterSha512.digest('hex').toUpperCase();

  console.log(`[2] Volume total de código-fonte processado: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB (${totalBytes} bytes)`);

  console.log("\n================================================================================");
  console.log("  RESUMO DIGITAL DO CÓDIGO-FONTE (SHA-512 - 128 CARACTERES HEXADECIMAL MAIÚSCULO): ");
  console.log("================================================================================");
  console.log(finalSha512);
  console.log("================================================================================");

  // Salvar relatório formal para submissão ao e-Software do INPI
  const certReport = {
    titulo_software: "Planta y Raiz - Plataforma de Telemedicina Canabinoide, Marketplace Farmacêutico & Hub de Agentes Autônomos",
    titular_direitos: "Planta y Raiz Ltda",
    autor_responsavel: "Dr. Edilson Bezerra da Silva",
    versao: "2.6.0-PROD",
    linguagens_principais: [
      "TypeScript",
      "React",
      "Node.js",
      "Tailwind CSS",
      "SQL (PostgreSQL)",
      "Deno Edge Functions"
    ],
    campo_aplicacao: "Telemedicina, Prescrição Digital Canabinoide, E-commerce Farmacêutico e Inteligência Artificial para Gestão Clínica",
    data_calculo_iso: new Date().toISOString(),
    algoritmo_resumo_digital: "SHA-512 (Secure Hash Algorithm 512-bit / 128 Caracteres Hexadecimais Maiúsculos)",
    resumo_digital_sha512_inpi: finalSha512,
    total_arquivos_fontes: allFiles.length,
    volume_total_bytes: totalBytes,
    escopo_diretorios_incluidos: [
      "src/",
      "src/components/",
      "src/components/admin/",
      "src/pages/",
      "src/pages/admin/",
      "src/lib/",
      "src/hooks/",
      "src/integrations/",
      "supabase/functions/",
      "supabase/migrations/",
      "scripts/",
      "public/"
    ]
  };

  fs.writeFileSync(
    path.join(rootDir, 'INPI_RESUMO_DIGITAL_SHA512.json'),
    JSON.stringify(certReport, null, 2),
    'utf8'
  );

  console.log(`\n[OK] Certificado e Declaração gerados em: INPI_RESUMO_DIGITAL_SHA512.json`);
}

computeDirectSha512();
