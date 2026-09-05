/**
 * Ponte de Integração Nativa Capacitor (iOS, Android & Web)
 * 
 * Centraliza o acesso seguro aos recursos de hardware e APIs nativas do dispositivo:
 * - Câmera clínica para teleconsulta e aferição óptica (rPPG).
 * - Notificações push em tempo real da Enfª Brisa e prescrições liberadas.
 * - Feedback háptico tátil para confirmações críticas de segurança.
 * - Compartilhamento nativo de receitas e laudos criptografados.
 * 
 * Implementa fallback gracioso e transparente para navegadores Web (PWA).
 */

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
      Plugins?: Record<string, any>;
    };
  }
}

export type NativePlatform = "ios" | "android" | "web";

/**
 * Retorna se a aplicação está executando em contêiner nativo (iOS / Android).
 */
export function isNativePlatform(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

/**
 * Identifica a plataforma de execução atual.
 */
export function getAppPlatform(): NativePlatform {
  if (typeof window === "undefined") return "web";
  const platform = window.Capacitor?.getPlatform?.();
  if (platform === "ios") return "ios";
  if (platform === "android") return "android";
  return "web";
}

/**
 * Solicita permissão de acesso à câmera fotográfica (teleconsulta e rPPG).
 */
export async function requestCameraPermissions(): Promise<boolean> {
  if (isNativePlatform()) {
    try {
      const cameraPlugin = window.Capacitor?.Plugins?.Camera;
      if (cameraPlugin?.requestPermissions) {
        const res = await cameraPlugin.requestPermissions({ permissions: ["camera"] });
        return res.camera === "granted";
      }
    } catch (e) {
      console.warn("[CapacitorBridge] Erro ao solicitar permissão nativa de câmera:", e);
    }
  }

  // Fallback Web: MediaDevices API
  if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (e) {
      console.warn("[CapacitorBridge] Permissão de câmera web negada:", e);
      return false;
    }
  }

  return false;
}

/**
 * Solicita permissão para notificações push nativas (alertas da Brisa e receitas).
 */
export async function requestPushNotificationPermissions(): Promise<boolean> {
  if (isNativePlatform()) {
    try {
      const pushPlugin = window.Capacitor?.Plugins?.PushNotifications;
      if (pushPlugin?.requestPermissions) {
        const res = await pushPlugin.requestPermissions();
        if (res.receive === "granted") {
          await pushPlugin.register?.();
          return true;
        }
        return false;
      }
    } catch (e) {
      console.warn("[CapacitorBridge] Erro ao registrar push nativo:", e);
    }
  }

  // Fallback Web Notifications API
  if (typeof window !== "undefined" && "Notification" in window) {
    try {
      const perm = await Notification.requestPermission();
      return perm === "granted";
    } catch (e) {
      console.warn("[CapacitorBridge] Falha ao solicitar notificação web:", e);
      return false;
    }
  }

  return false;
}

/**
 * Dispara feedback tátil/háptico para ações de relevância clínica.
 */
export function triggerHapticFeedback(
  type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light"
): void {
  if (isNativePlatform()) {
    try {
      const haptics = window.Capacitor?.Plugins?.Haptics;
      if (haptics) {
        if (type === "success" || type === "warning" || type === "error") {
          haptics.notification?.({ type: type.toUpperCase() });
        } else {
          haptics.impact?.({ style: type.toUpperCase() });
        }
        return;
      }
    } catch (e) {
      console.warn("[CapacitorBridge] Haptics nativo falhou:", e);
    }
  }

  // Fallback Web Vibration API
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    const patterns: Record<string, number | number[]> = {
      light: 15,
      medium: 30,
      heavy: 50,
      success: [20, 50, 20],
      warning: [30, 40, 30],
      error: [50, 100, 50],
    };
    navigator.vibrate(patterns[type] || 20);
  }
}

/**
 * Abre URLs externas e termos regulatórios com segurança em Custom Tabs ou Web View.
 */
export async function openExternalBrowser(url: string): Promise<void> {
  if (isNativePlatform()) {
    try {
      const browser = window.Capacitor?.Plugins?.Browser;
      if (browser?.open) {
        await browser.open({ url, windowName: "_blank" });
        return;
      }
    } catch (e) {
      console.warn("[CapacitorBridge] Erro ao abrir browser nativo:", e);
    }
  }

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Compartilha documentos clínicos de forma nativa (Sheet do iOS / Share Intent do Android).
 */
export async function shareClinicalDocument(
  title: string,
  text: string,
  url?: string
): Promise<boolean> {
  if (isNativePlatform()) {
    try {
      const share = window.Capacitor?.Plugins?.Share;
      if (share?.share) {
        await share.share({ title, text, url, dialogTitle: "Compartilhar Prontuário / Receita" });
        return true;
      }
    } catch (e) {
      console.warn("[CapacitorBridge] Share nativo falhou:", e);
    }
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (e) {
      console.warn("[CapacitorBridge] Web share cancelado:", e);
    }
  }

  return false;
}
