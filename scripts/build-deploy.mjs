import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

console.log("🚀 Iniciando processo de Build e Zip para o Hostinger...");

try {
  // 1. Build
  console.log("\n📦 Executando npm run build...");
  execSync('npm run build', { stdio: 'inherit' });
  
  // 2. Zip
  const zipPath = join(process.cwd(), 'deploy.zip');
  if (existsSync(zipPath)) {
    console.log(`\n🗑️ Removendo zip antigo: ${zipPath}`);
    rmSync(zipPath);
  }

  console.log("\n🗜️ Compactando pasta dist/ para deploy.zip...");
  
  // Usando PowerShell (disponível no Windows)
  const psCommand = `Compress-Archive -Path dist\\* -DestinationPath deploy.zip -Force`;
  execSync(`powershell.exe -Command "${psCommand}"`, { stdio: 'inherit' });
  
  console.log("\n✅ Sucesso! O arquivo 'deploy.zip' foi gerado na raiz do projeto.");
  console.log("Upload este arquivo no Gerenciador de Arquivos do Hostinger e extraia na pasta public_html.");
  
} catch (error) {
  console.error("\n❌ Ocorreu um erro durante o build/zip:", error.message);
  process.exit(1);
}
