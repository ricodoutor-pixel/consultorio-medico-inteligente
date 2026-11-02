import dotenv from 'dotenv';
dotenv.config();

const APIFY_TOKEN = process.env.APIFY_API_TOKEN || '';

async function cleanApify() {
  console.log('🧹 [APIFY CLEANER] Iniciando auditoria e limpeza da conta Apify...');

  // 1. Verificar limites e consumo da conta
  try {
    const userRes = await fetch(`https://api.apify.com/v2/users/me?token=${APIFY_TOKEN}`);
    const userData = await userRes.json();
    console.log(`👤 Usuário Apify: ${userData.data?.username || 'N/A'} (ID: ${userData.data?.id})`);

    const usageRes = await fetch(`https://api.apify.com/v2/users/me/usage/monthly?token=${APIFY_TOKEN}`);
    const usageData = await usageRes.json();
    const cycle = usageData.data?.usageCycle;
    const totalUsd = usageData.data?.totalUsageCreditsUsdAfterVolumeDiscount || 0;
    console.log(`💳 Consumo do ciclo atual: $${totalUsd.toFixed(2)} USD (Período: ${cycle?.startAt?.slice(0, 10)} até ${cycle?.endAt?.slice(0, 10)})`);
  } catch (e) {
    console.error('Erro ao consultar usuário:', e.message);
  }

  // 2. Abortar execuções pendentes ou travadas
  try {
    const runsRes = await fetch(`https://api.apify.com/v2/actor-runs?token=${APIFY_TOKEN}&status=RUNNING`);
    const runsData = await runsRes.json();
    const running = runsData.data?.items || [];
    console.log(`🏃 Execuções em andamento encontradas: ${running.length}`);
    for (const r of running) {
      console.log(`🛑 Abortando run ${r.id}...`);
      await fetch(`https://api.apify.com/v2/actor-runs/${r.id}/abort?token=${APIFY_TOKEN}`, { method: 'POST' });
    }
  } catch (e) {
    console.error('Erro ao abortar runs:', e.message);
  }

  // 3. Limpar datasets vazios
  try {
    const dsRes = await fetch(`https://api.apify.com/v2/datasets?token=${APIFY_TOKEN}&unnamed=true&limit=50`);
    const dsData = await dsRes.json();
    const datasets = dsData.data?.items || [];
    console.log(`📦 Datasets encontrados: ${datasets.length}`);
    let deletedCount = 0;
    for (const d of datasets) {
      if (d.itemCount === 0) {
        await fetch(`https://api.apify.com/v2/datasets/${d.id}?token=${APIFY_TOKEN}`, { method: 'DELETE' });
        deletedCount++;
      }
    }
    console.log(`✨ ${deletedCount} datasets vazios removidos com sucesso.`);
  } catch (e) {
    console.error('Erro ao limpar datasets:', e.message);
  }

  console.log('✅ [APIFY CLEANER] Limpeza concluída!');
}

cleanApify().catch(console.error);
