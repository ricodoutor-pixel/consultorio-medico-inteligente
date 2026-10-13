import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Download, Smartphone, Flame, Share, Plus, Check, Monitor, Sparkles, FolderDown } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { motion } from "framer-motion";
import { toast } from "sonner";

const IOS_HINT_KEY = "pyr_ios_install_hint_shown";

export function PWAInstallSection() {
  const { canInstall, isInstalled, isIOS, isDesktop, promptInstall, downloadDesktopShortcut } = usePWAInstall();
  const [iosDialogOpen, setIosDialogOpen] = useState(false);
  const [desktopSuccessOpen, setDesktopSuccessOpen] = useState(false);

  // Auto-mostra a instrução iOS uma vez por sessão caso o usuário seja iOS
  useEffect(() => {
    if (isIOS && !isInstalled && typeof sessionStorage !== "undefined") {
      const alreadyShown = sessionStorage.getItem(IOS_HINT_KEY);
      if (!alreadyShown) {
        const t = setTimeout(() => {
          setIosDialogOpen(true);
          sessionStorage.setItem(IOS_HINT_KEY, "1");
        }, 3000);
        return () => clearTimeout(t);
      }
    }
  }, [isIOS, isInstalled]);

  const handleClick = async () => {
    // 1. Já instalado → reabrir o app PWA
    if (isInstalled) {
      window.location.href = "/?source=pwa";
      return;
    }

    // 2. Se for Desktop (Windows / Mac / Linux): 1-CLIQUE GARANTIDO
    if (isDesktop) {
      let nativePromptAccepted = false;

      // Se o navegador disparou o prompt nativo do PWA, tenta primeiro
      if (canInstall) {
        try {
          const outcome = await promptInstall();
          if (outcome === "accepted") {
            nativePromptAccepted = true;
            toast.success("App Planta y Raiz instalado! 🐸 O ícone do Dr. Verdinho já está no seu sistema.");
            return;
          }
        } catch (_) {}
      }

      // Se o prompt nativo não disparou ou foi dispensado: baixa o atalho oficial do Dr. Verdinho em 1 clique!
      if (!nativePromptAccepted) {
        const downloaded = downloadDesktopShortcut();
        if (downloaded) {
          setDesktopSuccessOpen(true);
          toast.success("Atalho do Dr. Verdinho baixado! 🐸 Verifique sua pasta Downloads.");
        }
      }
      return;
    }

    // 3. Android com prompt nativo disponível → dispara IMEDIATAMENTE
    if (canInstall) {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        toast.success("App Planta y Raiz instalado! 🐸 Dr. Verdinho na sua tela inicial.");
      } else if (outcome === "dismissed") {
        toast.info("Você pode instalar a qualquer momento clicando novamente.");
      }
      return;
    }

    // 4. iOS — sem beforeinstallprompt, mostrar passo a passo visual com Dr. Verdinho
    if (isIOS) {
      setIosDialogOpen(true);
      return;
    }

    // 5. Outros navegadores móveis: baixa o atalho e exibe confirmação
    downloadDesktopShortcut();
    toast.success("Download do atalho concluído! Toque no arquivo para abrir o app.");
  };

  const buttonLabel = isInstalled
    ? "Abrir App Planta y Raiz"
    : isDesktop
      ? "Baixar App para Desktop (1 Clique)"
      : isIOS
        ? "Adicionar à Tela Inicial"
        : "Instalar App Planta y Raiz";

  const ButtonIcon = isInstalled ? Check : isDesktop ? Monitor : Download;

  return (
    <section className="py-8 md:py-16" id="instalar-app">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-primary/40 bg-gradient-to-br from-emerald-950/40 via-background to-primary/10 overflow-hidden relative shadow-2xl">
            <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1.5">
              <Flame size={16} className="text-orange-400 animate-pulse" />
              <span className="text-xs font-bold text-orange-400">1 Clique • Sem Frescura</span>
            </div>

            <CardContent className="p-5 md:p-10">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                <div className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-primary/20 border-2 border-primary/40 shrink-0 overflow-hidden shadow-lg shadow-primary/20">
                  <img
                    src="/dr-verdinho-192.png?v=9"
                    alt="Dr. Verdinho — mascote oficial Planta y Raiz"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
                    <Sparkles size={14} />
                    <span>Disponível para Todos os Dispositivos (PC & Celular)</span>
                  </div>
                  <h3 className="text-xl md:text-3xl font-display font-black text-foreground mb-2">
                    Sua Saúde em 1 Clique:{" "}
                    <span className="text-gradient-green">
                      {isInstalled ? "Abra o App Oficial" : "Baixe o Dr. Verdinho no seu Desktop ou Celular"}
                    </span>
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
                    {isInstalled
                      ? "Você já tem o app oficial. Clique abaixo para abrir diretamente sem barras de navegação."
                      : "Sem cadastro obrigatório e sem frescura: baixe em 1 clique e tenha o ícone verdinho do Dr. Verdinho na sua Área de Trabalho ou tela inicial para acessar consultas, receitas e acompanhamento."}
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto shrink-0">
                  <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl h-14 px-8 text-base shadow-xl shadow-emerald-900/30 transition-transform active:scale-95 w-full md:w-auto"
                    onClick={handleClick}
                    aria-label={buttonLabel}
                  >
                    <ButtonIcon size={20} className="mr-2.5" />
                    {buttonLabel}
                  </Button>

                  {isDesktop && !isInstalled && (
                    <button
                      type="button"
                      onClick={() => {
                        downloadDesktopShortcut();
                        setDesktopSuccessOpen(true);
                      }}
                      className="text-[11px] text-muted-foreground hover:text-emerald-400 underline underline-offset-4 text-center transition-colors"
                    >
                      Ou clique aqui para baixar apenas o arquivo de atalho (.url)
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/50">
                {[
                  { icon: "💻", text: "Ícone Verdinho no Desktop" },
                  { icon: "🩺", text: "Orientação Técnica R$ 30" },
                  { icon: "⚡", text: "Download Instantâneo em 1 Clique" },
                  { icon: "📱", text: "Compatível PC, Android & iOS" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-base">{icon}</span>
                    <span className="font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modal de Sucesso do Download no Desktop (Windows / Mac) */}
      <Dialog open={desktopSuccessOpen} onOpenChange={setDesktopSuccessOpen}>
        <DialogContent className="max-w-md border-emerald-500/30 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-2 overflow-hidden shadow-lg shadow-emerald-500/20">
              <img
                src="/dr-verdinho-192.png?v=9"
                alt="Dr. Verdinho Mascote"
                className="w-full h-full object-cover"
              />
            </div>
            <DialogTitle className="text-center text-xl font-display font-black text-foreground">
              🎉 Atalho do Dr. Verdinho Baixado!
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              O atalho oficial da <strong>Planta y Raiz</strong> foi baixado com sucesso em seus Downloads.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-foreground">
              <FolderDown size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-400 block mb-0.5">Arquivo: Planta y Raiz - Dr Verdinho.url</strong>
                <span>Abra sua pasta de <strong>Downloads</strong> e dê 2 cliques para abrir a plataforma direto na tela cheia.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground">
              <Monitor size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground block mb-0.5">Dica para a sua Área de Trabalho:</strong>
                <span>Arraste o arquivo da pasta Downloads para a sua Área de Trabalho (Desktop) para ter o Dr. Verdinho sempre a um clique!</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl w-full"
              onClick={() => setDesktopSuccessOpen(false)}
            >
              Entendido, Dr. Verdinho! 🐸
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de instruções iOS (Safari não suporta beforeinstallprompt nativo) */}
      <Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
        <DialogContent className="max-w-sm border-primary/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone size={20} className="text-primary" />
              Instalar no iPhone / iPad
            </DialogTitle>
            <DialogDescription>
              No Safari, siga estes 2 passos rápidos para adicionar o Dr. Verdinho à sua tela inicial:
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 mt-2">
            <li className="flex items-start gap-3 text-sm">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary font-bold shrink-0">
                1
              </span>
              <span className="flex-1">
                Toque no ícone <Share size={14} className="inline mx-1" />
                <strong>Compartilhar</strong> na barra inferior do Safari.
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary font-bold shrink-0">
                2
              </span>
              <span className="flex-1">
                Escolha <Plus size={14} className="inline mx-1" />
                <strong>"Adicionar à Tela de Início"</strong> e confirme.
              </span>
            </li>
          </ol>
          <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
            Pronto! O ícone do Dr. Verdinho ficará na sua tela inicial e o app abrirá em tela cheia, sem barra de endereço.
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
