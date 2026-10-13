import { useState, useEffect, useCallback } from "react";
import { isDesktopDevice, downloadDesktopShortcut } from "@/lib/pwa-desktop-shortcut";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  // iPadOS 13+ reporta como Mac — detecta via touch
  const isIPadOS =
    navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1;
  return isIOS || isIPadOS;
}

function detectAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== "undefined" && (window as any).__pyr_install_prompt) {
      return (window as any).__pyr_install_prompt as BeforeInstallPromptEvent;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;
    setIsStandalone(standalone);
    setIsInstalled(standalone);
    setIsIOS(detectIOS());
    setIsAndroid(detectAndroid());
    setIsDesktop(isDesktopDevice());

    // Se o evento foi capturado previamente pelo script precoce no index.html
    if ((window as any).__pyr_install_prompt) {
      setDeferredPrompt((window as any).__pyr_install_prompt);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).__pyr_install_prompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Ouvinte do evento customizado disparado pelo index.html
    const canInstallHandler = (e: any) => {
      if (e.detail) {
        setDeferredPrompt(e.detail);
      }
    };
    window.addEventListener("pyr:can-install", canInstallHandler);

    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (typeof window !== "undefined") {
        (window as any).__pyr_install_prompt = null;
      }
    };
    window.addEventListener("appinstalled", installedHandler);
    window.addEventListener("pyr:installed", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("pyr:can-install", canInstallHandler);
      window.removeEventListener("appinstalled", installedHandler);
      window.removeEventListener("pyr:installed", installedHandler);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const prompt =
      deferredPrompt ||
      (typeof window !== "undefined" ? (window as any).__pyr_install_prompt : null);

    if (prompt) {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        if (outcome === "accepted") {
          setIsInstalled(true);
          setDeferredPrompt(null);
          if (typeof window !== "undefined") {
            (window as any).__pyr_install_prompt = null;
          }
        }
        return outcome;
      } catch (err) {
        console.warn("Erro ao chamar prompt PWA:", err);
      }
    }
    return null;
  }, [deferredPrompt]);

  return {
    canInstall: (!!deferredPrompt || (typeof window !== "undefined" && !!(window as any).__pyr_install_prompt)) && !isInstalled,
    isInstalled,
    isStandalone,
    isIOS,
    isAndroid,
    isDesktop,
    promptInstall,
    downloadDesktopShortcut,
  };
}
