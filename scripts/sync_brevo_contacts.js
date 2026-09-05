/**
 * Fase 2: Sincronização de Contatos no Brevo via API (v3)
 * 
 * Endpoint: POST /contacts
 * Headers: api-key: ${BREVO_API_KEY}, Content-Type: application/json
 * Lista dedicada: Prospeccao-Farmacias-Brasil
 * Atributos mapeados:
 * - NOME_FANTASIA
 * - RAZAO_SOCIAL
 * - CIDADE
 * - UF
 * - STATUS_PROSPECCAO: PENDENTE
 * updateEnabled: true
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHARMACIES_FILE = path.join(__dirname, '..', 'pharmacies_raw.json');

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_BASE_URL = 'https://api.brevo.com/v3';
const LIST_NAME = 'Prospeccao-Farmacias-Brasil';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Obtém ou cria a lista de prospecção de farmácias no Brevo
 */
async function getOrCreatePharmacyList() {
  const res = await fetch(`${BREVO_BASE_URL}/contacts/lists?limit=50&offset=0`, {
    headers: {
      'api-key': BREVO_API_KEY,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`Falha ao buscar listas no Brevo (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  const existingList = data.lists?.find(l => l.name === LIST_NAME);

  if (existingList) {
    console.log(`📌 Lista '${LIST_NAME}' já existente com ID: ${existingList.id}`);
    return existingList.id;
  }

  console.log(`✨ Criando nova lista dedicada '${LIST_NAME}' no Brevo...`);
  const createRes = await fetch(`${BREVO_BASE_URL}/contacts/lists`, {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      name: LIST_NAME,
      folderId: 1
    })
  });

  if (!createRes.ok) {
    throw new Error(`Falha ao criar lista no Brevo (${createRes.status}): ${await createRes.text()}`);
  }

  const createdData = await createRes.json();
  console.log(`✅ Lista criada com sucesso! ID: ${createdData.id}`);
  return createdData.id;
}

/**
 * Garante que os atributos personalizados existem no Brevo
 */
async function ensureCustomAttributes() {
  const requiredAttrs = ['NOME_FANTASIA', 'RAZAO_SOCIAL', 'CIDADE', 'UF', 'STATUS_PROSPECCAO'];
  
  for (const attr of requiredAttrs) {
    try {
      const res = await fetch(`${BREVO_BASE_URL}/contacts/attributes/normal/${attr}`, {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'text' })
      });
      if (res.status === 201) {
        console.log(`➕ Atributo '${attr}' registrado no Brevo.`);
      }
    } catch {
      // Ignorar caso já exista
    }
  }
}

/**
 * Insere ou atualiza um contato no Brevo
 */
async function syncContact(pharmacy, listId) {
  const payload = {
    email: pharmacy.email,
    attributes: {
      NOME_FANTASIA: pharmacy.nome_fantasia || '',
      RAZAO_SOCIAL: pharmacy.razao_social || '',
      CIDADE: pharmacy.cidade || '',
      UF: pharmacy.uf || '',
      STATUS_PROSPECCAO: 'PENDENTE'
    },
    listIds: [listId],
    updateEnabled: true
  };

  const res = await fetch(`${BREVO_BASE_URL}/contacts`, {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const responseText = await res.text();

  if (res.status === 201) {
    return { ok: true, status: 'CREATED' };
  } else if (res.status === 204 || res.ok) {
    return { ok: true, status: 'UPDATED' };
  } else if (responseText.includes('duplicate_parameter')) {
    return { ok: true, status: 'ALREADY_EXISTS' };
  } else {
    return { ok: false, error: responseText, status: res.status };
  }
}

export async function syncPharmaciesToBrevo() {
  console.log('================================================================');
  console.log('📬 PLANTA Y RAÍZ — FASE 2: SINCRONIZAÇÃO DE CONTATOS NO BREVO');
  console.log('================================================================\n');

  if (!BREVO_API_KEY) {
    console.error('❌ ERRO: BREVO_API_KEY não configurada no ambiente (.env)!');
    process.exit(1);
  }

  if (!fs.existsSync(PHARMACIES_FILE)) {
    console.error(`❌ ERRO: Arquivo ${PHARMACIES_FILE} não encontrado! Execute a Fase 1 primeiro.`);
    process.exit(1);
  }

  const pharmacies = JSON.parse(fs.readFileSync(PHARMACIES_FILE, 'utf-8'));
  console.log(`📦 Carregados ${pharmacies.length} registros de ${path.basename(PHARMACIES_FILE)}`);

  // 1. Garantir atributos e lista
  await ensureCustomAttributes();
  const listId = await getOrCreatePharmacyList();

  console.log(`\n🚀 Iniciando sincronização para a lista [ID: ${listId}]...\n`);

  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < pharmacies.length; i++) {
    const pharmacy = pharmacies[i];
    const prefix = `[${String(i + 1).padStart(3, '0')}/${pharmacies.length}]`;

    try {
      const result = await syncContact(pharmacy, listId);
      if (result.ok) {
        successCount++;
        console.log(`  ✅ ${prefix} Sincronizado: ${pharmacy.nome_fantasia} (${pharmacy.email}) [${result.status}]`);
      } else {
        failedCount++;
        console.log(`  ❌ ${prefix} Falha: ${pharmacy.nome_fantasia} (${pharmacy.email}) → Status ${result.status}: ${result.error?.slice(0, 100)}`);
      }
    } catch (err) {
      failedCount++;
      console.log(`  ⚠️ ${prefix} Erro de rede: ${pharmacy.email} → ${err.message}`);
    }

    // Intervalo de segurança entre chamadas (200ms)
    await sleep(200);
  }

  console.log('\n' + '═'.repeat(64));
  console.log(`🏁 Sincronização concluída no Brevo CRM:`);
  console.log(`   ✅ Sucessos (Criados/Atualizados): ${successCount}`);
  console.log(`   ❌ Falhas:                        ${failedCount}`);
  console.log(`   📋 Lista no Brevo:                 ${LIST_NAME} (ID: ${listId})`);
  console.log('═'.repeat(64) + '\n');

  return { listId, successCount, failedCount };
}

// Execução direta via CLI
if (process.argv[1] && process.argv[1].endsWith('sync_brevo_contacts.js')) {
  syncPharmaciesToBrevo().catch(err => {
    console.error('Erro na sincronização Brevo:', err);
    process.exit(1);
  });
}
