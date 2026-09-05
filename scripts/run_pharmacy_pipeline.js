/**
 * Orquestrador Completo: Prospecção, Sincronização e Cadência de Farmácias
 * Planta y Raíz Ltda
 * 
 * Executa as 4 Fases do fluxo:
 * 1. Extração e Tratamento (CNAE 4771-7/01) -> pharmacies_raw.json
 * 2. Sincronização de Contatos e Atributos no Brevo CRM (Lista: Prospeccao-Farmacias-Brasil)
 * 3. Disparo Cadenciado com throttle de 60s e Trava de 300 e-mails/dia
 * 4. Auditoria contínua em dispatch_log.json e dispatch_state.json com retries
 * 
 * Exemplos de Uso:
 *   node scripts/run_pharmacy_pipeline.js --dry-run
 *   node scripts/run_pharmacy_pipeline.js --interval=60000
 *   node scripts/run_pharmacy_pipeline.js --extract-only
 *   node scripts/run_pharmacy_pipeline.js --sync-only
 *   node scripts/run_pharmacy_pipeline.js --dispatch-only
 */

import { extractAndProcessPharmacies } from './extract_pharmacies.js';
import { syncPharmaciesToBrevo } from './sync_brevo_contacts.js';
import { runCadenceEngine } from './dispatch_cadence.js';

const args = process.argv.slice(2);
const EXTRACT_ONLY = args.includes('--extract-only');
const SYNC_ONLY = args.includes('--sync-only');
const DISPATCH_ONLY = args.includes('--dispatch-only');

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   PLANTA Y RAÍZ — PIPELINE AUTÔNOMO DE PROSPECÇÃO FARMÁCIAS  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    if (!SYNC_ONLY && !DISPATCH_ONLY) {
      await extractAndProcessPharmacies();
    }

    if (EXTRACT_ONLY) {
      console.log('🏁 Fase 1 concluída com sucesso (--extract-only). Encerrando.');
      return;
    }

    if (!DISPATCH_ONLY) {
      await syncPharmaciesToBrevo();
    }

    if (SYNC_ONLY) {
      console.log('🏁 Fases 1 & 2 concluídas com sucesso (--sync-only). Encerrando.');
      return;
    }

    await runCadenceEngine();

  } catch (err) {
    console.error('❌ Erro na execução do pipeline:', err);
    process.exit(1);
  }
}

main();
