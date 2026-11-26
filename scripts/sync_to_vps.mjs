import { execSync } from 'child_process';
import path from 'path';

const filesToUpload = [
  'scripts/lib/brisa_security.mjs',
  'scripts/agent_evolution_brisa_live_responder.mjs',
  'scripts/agent_brevo_doctor_whatsapp_inviter.mjs',
  'scripts/agent_brevo_multi_pipeline.mjs'
];

const keyPath = process.platform === 'win32' ? 'C:\\Users\\ricod\\.ssh\\id_ed25519' : '~/.ssh/id_ed25519';
const remoteHost = 'root@179.236.244.168';
const remoteDir = '/opt/plantayraiz/scripts/';

for (const file of filesToUpload) {
  console.log(`Uploading ${file} to VPS...`);
  const targetPath = file.includes('lib/') ? `${remoteDir}lib/` : remoteDir;
  const cmd = `scp -i "${keyPath}" -o BatchMode=yes -o StrictHostKeyChecking=no "${file}" ${remoteHost}:${targetPath}`;
  try {
    execSync(cmd, { stdio: 'inherit', timeout: 30000 });
    console.log(`✅ Uploaded ${file}`);
  } catch (e) {
    console.error(`❌ Error uploading ${file}:`, e.message);
  }
}

try {
  console.log('🔄 Reiniciando serviços PM2 no VPS para aplicar a pausa e as regras novas...');
  const restartCmd = `ssh -i "${keyPath}" -o BatchMode=yes -o StrictHostKeyChecking=no ${remoteHost} "pm2 stop cadence-10min-inviter && pm2 restart brisa-live-responder"`;
  execSync(restartCmd, { stdio: 'inherit', timeout: 30000 });
  console.log('✅ PM2 atualizado com sucesso no VPS!');
} catch (e) {
  console.error('⚠️ Não foi possível rodar restart remoto direto:', e.message);
}
