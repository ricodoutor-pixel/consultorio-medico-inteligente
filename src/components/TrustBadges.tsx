import { ShieldCheck, Award, FileCheck2, Lock, Landmark, FileText, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface TrustBadgesProps {
  className?: string;
  variant?: "horizontal" | "grid" | "compact";
}

export const TrustBadges = ({ className = "", variant = "grid" }: TrustBadgesProps) => {
  const badges = [
    {
      icon: Landmark,
      title: "Software Registrado no INPI",
      highlight: "Proc. nº 512026007103-8",
      description: "Tecnologia médica e IA proprietárias protegidas sob a Lei nº 9.609/1998.",
      accent: "text-amber-400 border-amber-500/30 bg-amber-500/10",
      badge: "OFICIAL INPI",
    },
    {
      icon: Lock,
      title: "Prontuário & IA Blindados",
      highlight: "Integridade SHA-512",
      description: "Histórico clínico imutável, conformidade total com LGPD, CFM e criptografia avançada.",
      accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
      badge: "LGPD & CFM",
    },
    {
      icon: FileCheck2,
      title: "Prescrições Válidas no Brasil",
      highlight: "Padrão ICP-Brasil",
      description: "Receitas digitais com assinatura eletrônica qualificada aceitas em farmácias de todo o país.",
      accent: "text-blue-400 border-blue-500/30 bg-blue-500/10",
      badge: "ANVISA RDC 660",
    },
    {
      icon: ShieldCheck,
      title: "Checkout Seguro & Auditado",
      highlight: "Mercado Pago & Stripe",
      description: "Transações criptografadas de ponta a ponta com split automático e proteção antifraude.",
      accent: "text-purple-400 border-purple-500/30 bg-purple-500/10",
      badge: "SSL 256-BIT",
    },
  ];

  if (variant === "compact") {
    return (
      <div className={`p-4 rounded-2xl bg-card/40 border border-border/80 backdrop-blur-sm ${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {badges.map((b, i) => (
            <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl bg-background/50 border border-border/50">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${b.accent}`}>
                <b.icon size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{b.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{b.highlight}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="rounded-3xl bg-gradient-to-br from-card/80 via-card/40 to-background/90 border border-border/70 p-6 md:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-4 border-b border-border/60">
          <div>
            <span className="text-[11px] font-mono font-bold tracking-widest text-primary uppercase flex items-center gap-1.5 mb-1">
              <Award size={14} className="text-primary" /> Credibilidade, Governança & Segurança Jurídica
            </span>
            <h3 className="text-lg md:text-xl font-display font-black text-foreground">
              Plataforma Certificada & Registrada nos Órgãos Oficiais
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              <CheckCircle2 size={12} /> 100% em Conformidade
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-background/60 border border-border/60 hover:border-primary/40 hover:bg-background/90 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${b.accent}`}>
                    <b.icon size={20} />
                  </div>
                  <span className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                    {b.badge}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {b.title}
                </h4>
                <p className="text-xs font-semibold text-primary/90 mb-1.5">
                  {b.highlight}
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;
