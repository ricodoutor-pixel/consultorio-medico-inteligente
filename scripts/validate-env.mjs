import fs from 'node:fs';
import path from 'node:path';

const envExamplePath = path.resolve('.env.example');
const envPath = path.resolve('.env');

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return new Map();
  return new Map(
    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .filter(line => !line.startsWith('#'))
      .map(line => {
        const [key, ...rest] = line.split('=');
        return [key.trim(), rest.join('=').trim()];
      })
  );
}

const exampleEnv = readEnvFile(envExamplePath);
const currentEnv = readEnvFile(envPath);

const missing = [];
for (const [key] of exampleEnv.entries()) {
  if (key.startsWith('VITE_')) continue;
  if (!currentEnv.has(key) || !currentEnv.get(key)) {
    missing.push(key);
  }
}

if (missing.length > 0) {
  console.error('Variáveis ausentes no ambiente local:', missing.join(', '));
  process.exit(1);
}

console.log('Configuração de ambiente validada com sucesso.');
