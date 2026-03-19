/**
 * CheckpointSyncServiceV2
 * Sincronização automática de checkpoints com GitHub em tempo real
 * Versão simplificada sem dependência direta de banco de dados
 * 
 * Funcionalidades:
 * - Monitoramento de mudanças no código
 * - Commit automático ao Git
 * - Push para GitHub em tempo real
 * - Histórico em memória com persistência em arquivo
 * - Alertas de falhas
 */

import { EventEmitter } from "events";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const execAsync = promisify(exec);

export interface CheckpointSyncConfig {
  repoPath: string;
  githubToken: string;
  repoOwner: string;
  repoName: string;
  branch: string;
  autoCommitInterval: number; // ms
  enableAutoSync: boolean;
  historyFile?: string;
}

export interface SyncEvent {
  id: string;
  timestamp: number;
  type: "commit" | "push" | "pull" | "conflict" | "error";
  status: "pending" | "success" | "failed";
  message: string;
  filesChanged?: number;
  linesAdded?: number;
  linesRemoved?: number;
  errorMessage?: string;
}

export class CheckpointSyncServiceV2 extends EventEmitter {
  private config: CheckpointSyncConfig;
  private syncInProgress: boolean = false;
  private lastSyncTime: number = 0;
  private syncQueue: string[] = [];
  private syncInterval: NodeJS.Timer | null = null;
  private syncHistory: SyncEvent[] = [];
  private historyFile: string;

  constructor(config: CheckpointSyncConfig) {
    super();
    this.config = config;
    this.historyFile = config.historyFile || join(config.repoPath, ".sync-history.json");
    this.loadHistory();
    this.initializeSync();
  }

  /**
   * Carregar histórico de arquivo
   */
  private loadHistory(): void {
    try {
      if (existsSync(this.historyFile)) {
        const data = readFileSync(this.historyFile, "utf-8");
        this.syncHistory = JSON.parse(data);
        console.log(`[Checkpoint Sync] Histórico carregado: ${this.syncHistory.length} eventos`);
      }
    } catch (error) {
      console.warn("[Checkpoint Sync] Erro ao carregar histórico:", error);
      this.syncHistory = [];
    }
  }

  /**
   * Salvar histórico em arquivo
   */
  private saveHistory(): void {
    try {
      // Manter apenas últimos 1000 eventos
      const recentHistory = this.syncHistory.slice(-1000);
      writeFileSync(this.historyFile, JSON.stringify(recentHistory, null, 2));
    } catch (error) {
      console.warn("[Checkpoint Sync] Erro ao salvar histórico:", error);
    }
  }

  /**
   * Inicializar sincronização automática
   */
  private initializeSync(): void {
    if (!this.config.enableAutoSync) {
      console.log("[Checkpoint Sync] Auto-sync desativado");
      return;
    }

    console.log("[Checkpoint Sync] Inicializando sincronização automática");
    
    // Sincronizar a cada intervalo configurado
    this.syncInterval = setInterval(() => {
      this.performAutoSync().catch(err => {
        console.error("[Checkpoint Sync] Erro na sincronização automática:", err);
        this.emit("sync-error", {
          timestamp: Date.now(),
          error: err.message,
        });
      });
    }, this.config.autoCommitInterval);
  }

  /**
   * Executar sincronização automática
   */
  private async performAutoSync(): Promise<void> {
    if (this.syncInProgress) {
      console.log("[Checkpoint Sync] Sincronização já em progresso");
      return;
    }

    try {
      this.syncInProgress = true;

      // Verificar se há mudanças
      const hasChanges = await this.checkForChanges();
      if (!hasChanges) {
        console.log("[Checkpoint Sync] Nenhuma mudança detectada");
        return;
      }

      // Fazer commit
      const commitResult = await this.createAutoCommit();
      if (!commitResult.success) {
        throw new Error(`Falha ao criar commit: ${commitResult.message}`);
      }

      // Fazer push
      const pushResult = await this.pushToGitHub();
      if (!pushResult.success) {
        throw new Error(`Falha ao fazer push: ${pushResult.message}`);
      }

      // Registrar sucesso
      this.logSyncEvent({
        id: `sync_${Date.now()}`,
        timestamp: Date.now(),
        type: "push",
        status: "success",
        message: "Sincronização automática concluída com sucesso",
        filesChanged: commitResult.filesChanged,
        linesAdded: commitResult.linesAdded,
        linesRemoved: commitResult.linesRemoved,
      });

      this.lastSyncTime = Date.now();
      this.emit("sync-success", commitResult);
    } catch (error) {
      this.logSyncEvent({
        id: `sync_error_${Date.now()}`,
        timestamp: Date.now(),
        type: "error",
        status: "failed",
        message: "Erro na sincronização automática",
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      this.emit("sync-error", error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Verificar se há mudanças no repositório
   */
  private async checkForChanges(): Promise<boolean> {
    try {
      const { stdout } = await execAsync("git status --porcelain", {
        cwd: this.config.repoPath,
      });
      return stdout.trim().length > 0;
    } catch (error) {
      console.error("[Checkpoint Sync] Erro ao verificar mudanças:", error);
      return false;
    }
  }

  /**
   * Criar commit automático
   */
  private async createAutoCommit(): Promise<{
    success: boolean;
    message: string;
    filesChanged?: number;
    linesAdded?: number;
    linesRemoved?: number;
  }> {
    try {
      // Adicionar todas as mudanças
      await execAsync("git add -A", { cwd: this.config.repoPath });

      // Obter estatísticas de mudanças
      const { stdout: diffStat } = await execAsync(
        "git diff --cached --stat",
        { cwd: this.config.repoPath }
      );

      // Contar arquivos e linhas
      const lines = diffStat.trim().split("\n");
      const lastLine = lines[lines.length - 1];
      const filesChanged = lines.length - 1;

      let linesAdded = 0;
      let linesRemoved = 0;

      if (lastLine) {
        const match = lastLine.match(/(\d+) insertions?\(\+\).*(\d+) deletions?\(-\)/);
        if (match) {
          linesAdded = parseInt(match[1], 10);
          linesRemoved = parseInt(match[2], 10);
        }
      }

      // Criar mensagem de commit
      const timestamp = new Date().toISOString();
      const commitMessage = `🔄 Checkpoint Sync: ${filesChanged} arquivos alterados (+${linesAdded}/-${linesRemoved}) [${timestamp}]`;

      // Fazer commit
      await execAsync(`git commit -m "${commitMessage}"`, {
        cwd: this.config.repoPath,
      });

      console.log("[Checkpoint Sync] Commit criado:", commitMessage);

      return {
        success: true,
        message: commitMessage,
        filesChanged,
        linesAdded,
        linesRemoved,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Ignorar erro se não há mudanças para commitar
      if (errorMessage.includes("nothing to commit")) {
        return {
          success: true,
          message: "Nenhuma mudança para commitar",
          filesChanged: 0,
          linesAdded: 0,
          linesRemoved: 0,
        };
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Fazer push para GitHub
   */
  private async pushToGitHub(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Configurar credenciais do GitHub
      const remoteUrl = `https://${this.config.githubToken}@github.com/${this.config.repoOwner}/${this.config.repoName}.git`;

      // Fazer push
      const { stdout } = await execAsync(
        `git push ${remoteUrl} ${this.config.branch}`,
        { cwd: this.config.repoPath }
      );

      console.log("[Checkpoint Sync] Push para GitHub concluído");

      return {
        success: true,
        message: stdout.trim() || "Push concluído com sucesso",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Ignorar erro se branch está atualizado
      if (errorMessage.includes("everything up-to-date")) {
        return {
          success: true,
          message: "Branch já está atualizado",
        };
      }

      console.error("[Checkpoint Sync] Erro ao fazer push:", errorMessage);

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Fazer pull do GitHub
   */
  async pullFromGitHub(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const { stdout } = await execAsync("git pull origin " + this.config.branch, {
        cwd: this.config.repoPath,
      });

      console.log("[Checkpoint Sync] Pull do GitHub concluído");

      this.logSyncEvent({
        id: `pull_${Date.now()}`,
        timestamp: Date.now(),
        type: "pull",
        status: "success",
        message: "Pull do GitHub concluído com sucesso",
      });

      return {
        success: true,
        message: stdout.trim() || "Pull concluído com sucesso",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logSyncEvent({
        id: `pull_error_${Date.now()}`,
        timestamp: Date.now(),
        type: "error",
        status: "failed",
        message: "Erro ao fazer pull do GitHub",
        errorMessage: errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Fazer commit manual
   */
  async manualCommit(message: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (this.syncInProgress) {
        return {
          success: false,
          message: "Sincronização já em progresso",
        };
      }

      this.syncInProgress = true;

      // Adicionar mudanças
      await execAsync("git add -A", { cwd: this.config.repoPath });

      // Criar commit com mensagem customizada
      const fullMessage = `📝 ${message} [${new Date().toISOString()}]`;
      await execAsync(`git commit -m "${fullMessage}"`, {
        cwd: this.config.repoPath,
      });

      // Fazer push
      const pushResult = await this.pushToGitHub();

      if (pushResult.success) {
        this.logSyncEvent({
          id: `manual_commit_${Date.now()}`,
          timestamp: Date.now(),
          type: "commit",
          status: "success",
          message: fullMessage,
        });
      }

      return pushResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logSyncEvent({
        id: `manual_commit_error_${Date.now()}`,
        timestamp: Date.now(),
        type: "error",
        status: "failed",
        message: "Erro ao fazer commit manual",
        errorMessage: errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Obter histórico de sincronizações
   */
  getSyncHistory(limit: number = 50): SyncEvent[] {
    return this.syncHistory.slice(-limit);
  }

  /**
   * Obter estatísticas de sincronização
   */
  getSyncStats(): {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    lastSyncTime: number;
    averageFilesPerSync: number;
    averageLinesPerSync: number;
  } {
    const successfulSyncs = this.syncHistory.filter(h => h.status === "success").length;
    const failedSyncs = this.syncHistory.filter(h => h.status === "failed").length;

    const filesPerSync = this.syncHistory
      .filter(h => h.filesChanged)
      .map(h => h.filesChanged || 0);
    const averageFilesPerSync =
      filesPerSync.length > 0
        ? filesPerSync.reduce((a, b) => a + b, 0) / filesPerSync.length
        : 0;

    const linesPerSync = this.syncHistory
      .filter(h => h.linesAdded)
      .map(h => (h.linesAdded || 0) + (h.linesRemoved || 0));
    const averageLinesPerSync =
      linesPerSync.length > 0
        ? linesPerSync.reduce((a, b) => a + b, 0) / linesPerSync.length
        : 0;

    return {
      totalSyncs: this.syncHistory.length,
      successfulSyncs,
      failedSyncs,
      lastSyncTime: this.lastSyncTime,
      averageFilesPerSync: Math.round(averageFilesPerSync * 100) / 100,
      averageLinesPerSync: Math.round(averageLinesPerSync * 100) / 100,
    };
  }

  /**
   * Registrar evento de sincronização
   */
  private logSyncEvent(event: SyncEvent): void {
    this.syncHistory.push(event);
    this.saveHistory();
  }

  /**
   * Parar sincronização automática
   */
  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log("[Checkpoint Sync] Sincronização automática parada");
    }
  }

  /**
   * Obter status atual
   */
  getStatus(): {
    isRunning: boolean;
    syncInProgress: boolean;
    lastSyncTime: number;
    queueSize: number;
  } {
    return {
      isRunning: this.syncInterval !== null,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      queueSize: this.syncQueue.length,
    };
  }
}

// Exportar instância singleton
let checkpointSyncInstance: CheckpointSyncServiceV2 | null = null;

export function initializeCheckpointSync(
  config: CheckpointSyncConfig
): CheckpointSyncServiceV2 {
  if (!checkpointSyncInstance) {
    checkpointSyncInstance = new CheckpointSyncServiceV2(config);
  }
  return checkpointSyncInstance;
}

export function getCheckpointSync(): CheckpointSyncServiceV2 | null {
  return checkpointSyncInstance;
}
