/**
 * Checkpoint Sync Initialization
 * 🛑 DESATIVADO PERMANENTEMENTE — auto-commits a cada 5min entupiam a fila de deploy Hostinger.
 * Para reativar (não recomendado), defina FORCE_CHECKPOINT_SYNC=true no ambiente.
 */

import { initializeCheckpointSync } from "../services/CheckpointSyncServiceV2";

let checkpointSyncInitialized = false;

export function initCheckpointSyncService(): void {
  if (process.env.FORCE_CHECKPOINT_SYNC !== "true") {
    console.log("[Checkpoint Sync] ⛔ Desativado (evita flood de commits → Hostinger).");
    return;
  }

  if (checkpointSyncInitialized) return;

  try {
    const repoPath = process.env.REPO_PATH || process.cwd();
    const syncService = initializeCheckpointSync({
      repoPath,
      githubToken: process.env.GITHUB_TOKEN || "",
      repoOwner: process.env.GITHUB_REPO_OWNER || "ricodoutor-pixel",
      repoName: process.env.GITHUB_REPO_NAME || "consultorio-medico-inteligente",
      branch: process.env.GIT_BRANCH || "main",
      autoCommitInterval: parseInt(process.env.AUTO_COMMIT_INTERVAL || "3600000", 10),
      enableAutoSync: process.env.ENABLE_AUTO_SYNC !== "false",
      historyFile: `${repoPath}/.sync-history.json`,
    });

    syncService.on("sync-success", (r) => console.log("[Checkpoint Sync] ✅", r.message));
    syncService.on("sync-error", (e) => console.error("[Checkpoint Sync] ❌", e));

    checkpointSyncInitialized = true;
    console.log("[Checkpoint Sync] ✅ Inicializado (FORCE_CHECKPOINT_SYNC=true)");
  } catch (error) {
    console.error("[Checkpoint Sync] ❌ Erro ao inicializar:", error);
  }
}
