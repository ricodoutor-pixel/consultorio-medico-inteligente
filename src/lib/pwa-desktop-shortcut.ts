/**
 * Utilitário de Download de Atalho do App Planta y Raiz (Dr. Verdinho)
 * Permite que qualquer usuário no Desktop (Windows / Mac / Linux)
 * baixe o atalho oficial do App em 1 clique direto para a Área de Trabalho / Downloads.
 */

export function isDesktopDevice(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isIPadOS = navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1;
  return !isMobile && !isIPadOS;
}

export function downloadDesktopShortcut(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const origin = window.location.origin || "https://plantayraiz.com.br";
    const appUrl = `${origin}/?source=desktop_app`;
    const iconUrl = `${origin}/favicon.ico`;

    // Formato oficial do Internet Shortcut do Windows (.url)
    const shortcutContent = [
      "[InternetShortcut]",
      `URL=${appUrl}`,
      "IconIndex=0",
      `IconFile=${iconUrl}`,
      "HotKey=0",
      "[{000214A0-0000-0000-C000-000000000046}]",
      "Prop3=19,0",
      "",
    ].join("\r\n");

    const blob = new Blob([shortcutContent], { type: "application/internet-shortcut;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Planta y Raiz - Dr Verdinho.url";
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (_) {}
    }, 1500);

    return true;
  } catch (error) {
    console.error("Erro ao gerar atalho de desktop:", error);
    return false;
  }
}
