import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Smartphone, Flame } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { motion } from "framer-motion";

export function PWAInstallSection() {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();

  if (isInstalled || !canInstall) return null;

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
                <div className="flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary/10 border border-primary/20 shrink-0">
                  <Smartphone size={32} className="text-primary" />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg md:text-2xl font-display font-black text-foreground mb-2">
                    Sua Saúde no Bolso: <span className="text-gradient-green">Baixe o App Oficial</span>
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground max-w-lg">
                    Não quebre sua sequência de cuidados! Receba lembretes diários e acompanhe seu tratamento direto na tela inicial do seu celular.
                  </p>
                </div>

                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-black rounded-xl h-12 px-6 shrink-0 w-full md:w-auto"
                  onClick={() => promptInstall()}
                >
                  <Download size={18} className="mr-2" />
                  Instalar App Planta y Raiz
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/50">
                {[
                  { icon: "🔔", text: "Lembretes de dose" },
                  { icon: "🩺", text: "Consultas rápidas" },
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
    </section>
  );
}
