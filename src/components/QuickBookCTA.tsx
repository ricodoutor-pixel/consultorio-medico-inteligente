import { Link } from "react-router-dom";
import { Calendar, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface QuickBookCTAProps {
  variant?: "inline" | "floating" | "banner";
  className?: string;
}

export function QuickBookCTA({ variant = "inline", className = "" }: QuickBookCTAProps) {
  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm">Orientação Técnica Express</p>
            <p className="text-xs text-muted-foreground">Agende em 2 cliques • A partir de R$30</p>
          </div>
        </div>
        <Link to="/falar-com-especialista">
          <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1.5 font-bold shadow-lg shadow-primary/30">
            <Calendar className="w-4 h-4" />
            Agendar Agora
          </Button>
        </Link>
      </motion.div>
    );
  }

  if (variant === "floating") {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`fixed bottom-20 right-4 z-40 md:bottom-6 ${className}`}
      >
        <Link to="/falar-com-especialista">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 rounded-full gap-2 font-bold shadow-2xl shadow-primary/40 px-6"
          >
            <Calendar className="w-5 h-5" />
            Orientação Técnicar R$30
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <Link to="/falar-com-especialista" className={className}>
      <Button className="bg-primary hover:bg-primary/90 gap-2 font-bold w-full">
        <Calendar className="w-4 h-4" />
        Agendar Orientação Técnica
      </Button>
    </Link>
  );
}
