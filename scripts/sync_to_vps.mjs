import { execSync } from 'child_process';
import path from 'path';

const filesToUpload = [
  'scripts/contatos-enf-brisa.vcf',
  'scripts/medico_socio_campaign_state.json',
  'scripts/agent_cadence_10min_inviter.mjs',
  'scripts/agent_evolution_brisa_live_responder.mjs'
];

const keyPath = 'C:\\Users\\ricod\\.ssh\\id_ed25519';
const remoteHost = 'root@179.236.244.168';
const remoteDir = '/opt/plantayraiz/scripts/';

for (const file of filesToUpload) {
  console.log(`Uploading ${file} to VPS...`);
  const cmd = `scp -i "${keyPath}" -o BatchMode=yes -o StrictHostKeyChecking=no "${file}" ${remoteHost}:${remoteDir}`;
  try {
    execSync(cmd, { stdio: 'inherit', timeout: 30000 });
    console.log(`✅ Uploaded ${file}`);
  } catch (e) {
    console.error(`❌ Error uploading ${file}:`, e.message);
  }
}
