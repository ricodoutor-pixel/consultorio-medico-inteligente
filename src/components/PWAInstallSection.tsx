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
import { Download, Smartphone, Flame, Share, Plus, Check } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { motion } from "framer-motion";
import { toast } from "sonner";

const IOS_HINT_KEY = "pyr_ios_install_hint_shown";

export function PWAInstallSection() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [iosDialogOpen, setIosDialogOpen] = useState(false);

  // Auto-mostra a instrução iOS uma vez por sessão (Safari não tem prompt nativo)
  useEffect(() => {
    if (isIOS && !isInstalled && typeof sessionStorage !== "undefined") {
      const alreadyShown = sessionStorage.getItem(IOS_HINT_KEY);
      if (!alreadyShown) {
        const t = setTimeout(() => {
          setIosDialogOpen(true);
          sessionStorage.setItem(IOS_HINT_KEY, "1");
        }, 2500);
        return () => clearTimeout(t);
      }
    }
  }, [isIOS, isInstalled]);

  const handleClick = async () => {
    // Já instalado → reabrir o app
    if (isInstalled) {
      window.location.href = "/?source=pwa";
      return;
    }

    // Android / Desktop com prompt nativo disponível → dispara IMEDIATAMENTE
    if (canInstall) {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        toast.success("App Planta y Raiz instalado! 🐸");
      } else if (outcome === "dismissed") {
        toast.info("Você pode instalar a qualquer momento pelo menu do navegador.");
      }
      return;
    }

    // iOS — sem beforeinstallprompt, mostrar instruções
    if (isIOS) {
      setIosDialogOpen(true);
      return;
    }

    // Fallback: navegador sem suporte → instrução genérica
    toast.info(
      "Use o menu do seu navegador (⋮) e escolha 'Instalar app' ou 'Adicionar à tela inicial'.",
      { duration: 6000 }
    );
  };

  const buttonLabel = isInstalled
    ? "Abrir App"
    : isIOS
      ? "Adicionar à Tela Inicial"
      : "Instalar App Planta y Raiz";

  const ButtonIcon = isInstalled ? Check : Download;

  return (
    <section className="py-8 md:py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden relative">
            <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1.5">
              <Flame size={16} className="text-orange-400 animate-pulse" />
              <span className="text-xs font-bold text-orange-400">Ofensiva de Saúde</span>
            </div>

            <CardContent className="p-5 md:p-10">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 border border-primary/20 shrink-0 overflow-hidden">
                  <img
                    src="/dr-verdinho-192.png?v=6"
                    alt="Dr. Verdinho — mascote oficial Planta y Raiz"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg md:text-2xl font-display font-black text-foreground mb-2">
                    Sua Saúde no Bolso:{" "}
                    <span className="text-gradient-green">
                      {isInstalled ? "Abra o App Oficial" : "Baixe o App Oficial"}
                    </span>
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground max-w-lg">
                    {isInstalled
                      ? "Você já tem o app instalado. Toque em Abrir App para retomar seu tratamento na hora."
                      : "Não quebre sua sequência de cuidados! Receba lembretes diários e acompanhe seu tratamento direto na tela inicial do seu celular."}
                  </p>
                </div>

                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl h-12 px-6 shrink-0 w-full md:w-auto"
                  onClick={handleClick}
                  aria-label={buttonLabel}
                >
                  <ButtonIcon size={18} className="mr-2" />
                  {buttonLabel}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/50">
                {[
                  { icon: "🔔", text: "Lembretes de dose" },
                  { icon: "🩺", text: "Orientações Técnicas rápidas" },
                  { icon: "📱", text: "Acesso offline" },
                  { icon: "🔥", text: "Ofensiva diária" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-base">{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Diálogo de instruções iOS (Safari não suporta beforeinstallprompt) */}
      <Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone size={20} className="text-primary" />
              Instalar no iPhone / iPad
            </DialogTitle>
            <DialogDescription>
              No Safari, siga estes 2 passos para adicionar o Dr. Verdinho à sua tela inicial:
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
