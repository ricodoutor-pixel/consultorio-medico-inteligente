/**
 * Checkpoint Sync Initialization
 * Inicializar serviço de sincronização automática com GitHub
 */

import { initializeCheckpointSync } from "../services/CheckpointSyncServiceV2";

let checkpointSyncInitialized = false;

export function initCheckpointSyncService(): void {
  if (checkpointSyncInitialized) {
    console.log("[Checkpoint Sync] Serviço já inicializado");
    return;
  }

  try {
    // Obter configurações do ambiente
    const repoPath = process.env.REPO_PATH || process.cwd();
    const githubToken = process.env.GITHUB_TOKEN || "";
    const repoOwner = process.env.GITHUB_REPO_OWNER || "ricodoutor-pixel";
    const repoName = process.env.GITHUB_REPO_NAME || "consultorio-medico-inteligente";
    const branch = process.env.GIT_BRANCH || "main";
    const autoCommitInterval = parseInt(process.env.AUTO_COMMIT_INTERVAL || "300000", 10); // 5 minutos
    const enableAutoSync = process.env.ENABLE_AUTO_SYNC !== "false";

    console.log("[Checkpoint Sync] Inicializando com configurações:");
    console.log(`  - Repositório: ${repoPath}`);
    console.log(`  - Owner: ${repoOwner}`);
    console.log(`  - Repo: ${repoName}`);
    console.log(`  - Branch: ${branch}`);
    console.log(`  - Intervalo: ${autoCommitInterval}ms`);
    console.log(`  - Auto-sync: ${enableAutoSync ? "ativado" : "desativado"}`);

    // Inicializar serviço
    const syncService = initializeCheckpointSync({
      repoPath,
      githubToken,
      repoOwner,
      repoName,
      branch,
      autoCommitInterval,
      enableAutoSync,
      historyFile: `${repoPath}/.sync-history.json`,
    });

    // Configurar listeners
    syncService.on("sync-success", (result) => {
      console.log("[Checkpoint Sync] ✅ Sincronização bem-sucedida:", result.message);
    });

    syncService.on("sync-error", (error) => {
      console.error("[Checkpoint Sync] ❌ Erro na sincronização:", error);
    });

    checkpointSyncInitialized = true;
    console.log("[Checkpoint Sync] ✅ Serviço inicializado com sucesso");
  } catch (error) {
    console.error("[Checkpoint Sync] ❌ Erro ao inicializar:", error);
  }
}

// Auto-inicializar se variável de ambiente estiver ativa
if (process.env.ENABLE_CHECKPOINT_SYNC === "true") {
  initCheckpointSyncService();
}
