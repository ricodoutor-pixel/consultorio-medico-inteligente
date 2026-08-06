/**
 * QuickActionHub — Hub Central de Ações Rápidas do Paciente
 * Cards interativos estilo dark/green tech com ícones animados e micro-interactions.
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Calendar, RefreshCw, Stethoscope, AlertTriangle,
  Heart, BookOpen, Gift, FileText, Droplets, Scale, Zap
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

interface ActionItem {
  emoji: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  to?: string;
  href?: string;
  gradient: string;
  iconColor: string;
}

const CONSULT_ACTIONS: ActionItem[] = [
  {
    emoji: "🎯",
    label: "Agendar Consulta",
    desc: "Lista de profissionais",
    icon: Calendar,
    to: "/profissionais",
    gradient: "from-primary/15 to-primary/5",
    iconColor: "text-primary",
  },
  {
    emoji: "🔄",
    label: "Solicitar Retorno",
    desc: "Consultas de retorno",
    icon: RefreshCw,
    to: "/agendamento",
    gradient: "from-blue-500/15 to-blue-500/5",
    iconColor: "text-blue-400",
  },
  {
    emoji: "🌿",
    label: "Orientação Técnica R$ 30",
    desc: "Atendimento c/ Dr. Edilson",
    icon: Stethoscope,
    href: "https://wa.me/5511991363154?text=Ol%C3%A1%20Brisa%2C%20quero%20a%20Orienta%C3%A7%C3%A3o%20T%C3%A9cnica%20R%24%2030",
    gradient: "from-emerald-500/15 to-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    emoji: "⚡",
    label: "Renovação Express",
    desc: "Renove sem vídeo",
    icon: Zap,
    to: "/telemedicina-assincrona",
    gradient: "from-amber-500/15 to-amber-500/5",
    iconColor: "text-amber-500",
  },
  {
    emoji: "🚨",
    label: "Emergência",
    desc: "Suporte rápido",
    icon: AlertTriangle,
    href: "https://wa.me/5511991363154?text=Ol%C3%A1%20Brisa%2C%20preciso%20de%20atendimento%20urgente!",
    gradient: "from-red-500/15 to-red-500/5",
    iconColor: "text-red-400",
  },
];

const TOOLS_ACTIONS: ActionItem[] = [
  {
    emoji: "🩸",
    label: "Pressão Arterial",
    desc: "Aferição biométrica",
    icon: Heart,
    to: "/monitor-cardiaco",
    gradient: "from-rose-500/15 to-rose-500/5",
    iconColor: "text-rose-400",
  },
  {
    emoji: "🤖",
    label: "Monitoramento IA",
    desc: "Exames com IA (Olho, Pele, SpO2)",
    icon: Zap,
    to: "/monitoramento-saude",
    gradient: "from-emerald-500/15 to-emerald-500/5",
    iconColor: "text-emerald-400",
  },
  {
    emoji: "📚",
    label: "E-book Gratuito",
    desc: "Baixe em 1 clique",
    icon: BookOpen,
    to: "/ebook-medicina-canabinoide",
    gradient: "from-amber-500/15 to-amber-500/5",
    iconColor: "text-amber-400",
  },
  {
    emoji: "🎁",
    label: "Indique e Ganhe",
    desc: "Programa de afiliados",
    icon: Gift,
    to: "/afiliados",
    gradient: "from-purple-500/15 to-purple-500/5",
    iconColor: "text-purple-400",
  },
];

const UTIL_ACTIONS: ActionItem[] = [
  {
    emoji: "📄",
    label: "Receitas e Documentos",
    desc: "Prescrições & laudos",
    icon: FileText,
    to: "#prescriptions",
    gradient: "from-cyan-500/15 to-cyan-500/5",
    iconColor: "text-cyan-400",
  },
  {
    emoji: "💧",
    label: "Diário de Gotas",
    desc: "Tracker de sintomas",
    icon: Droplets,
    to: "#diary",
    gradient: "from-teal-500/15 to-teal-500/5",
    iconColor: "text-teal-400",
  },
  {
    emoji: "⚖️",
    label: "Suporte Jurídico",
    desc: "ANVISA / HC",
    icon: Scale,
    to: "/lgpd",
    gradient: "from-yellow-500/15 to-yellow-500/5",
    iconColor: "text-yellow-400",
  },
];

const ActionCard = ({ item }: { item: ActionItem }) => {
  const Icon = item.icon;

  const content = (
    <Card className="border-border hover:border-primary/30 transition-all cursor-pointer group hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 h-full">
      <CardContent className="p-3 sm:p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={18} className={item.iconColor} />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-black text-foreground truncate flex items-center gap-1.5">
            <span>{item.emoji}</span> {item.label}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  return (
    <Link to={item.to || "/"} className="block">
      {content}
    </Link>
  );
};

interface QuickActionHubProps {
  onTabSwitch?: (tab: string) => void;
}

export const QuickActionHub = ({ onTabSwitch }: QuickActionHubProps) => {
  const handleSpecialAction = (item: ActionItem) => {
    if (item.to === "#prescriptions" && onTabSwitch) {
      onTabSwitch("prescriptions");
    } else if (item.to === "#diary" && onTabSwitch) {
      // Scroll to diary section
      const el = document.getElementById("symptom-diary-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.div className="space-y-5 mb-8" initial="hidden" animate="visible" variants={stagger}>
      {/* Atendimentos & Consultas */}
      <div>
        <h3 className="text-xs font-black uppercase text-muted-foreground mb-2.5 flex items-center gap-2 tracking-wider">
          <Stethoscope size={12} className="text-primary" /> Atendimentos & Consultas
        </h3>
        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5" variants={stagger}>
          {CONSULT_ACTIONS.map((item, i) => (
            <motion.div key={i} variants={fadeUp}>
              <ActionCard item={item} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Ferramentas & Educacional */}
      <div>
        <h3 className="text-xs font-black uppercase text-muted-foreground mb-2.5 flex items-center gap-2 tracking-wider">
          <Heart size={12} className="text-rose-400" /> Ferramentas & Educacional
        </h3>
        <motion.div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5" variants={stagger}>
          {TOOLS_ACTIONS.map((item, i) => (
            <motion.div key={i} variants={fadeUp}>
              <ActionCard item={item} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Utilidades Adicionais */}
      <div>
        <h3 className="text-xs font-black uppercase text-muted-foreground mb-2.5 flex items-center gap-2 tracking-wider">
          <FileText size={12} className="text-cyan-400" /> Utilidades
        </h3>
        <motion.div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5" variants={stagger}>
          {UTIL_ACTIONS.map((item, i) => (
            <motion.div key={i} variants={fadeUp}>
              {item.to?.startsWith("#") ? (
                <div onClick={() => handleSpecialAction(item)}>
                  <ActionCard item={{ ...item, to: "/" }} />
                </div>
              ) : (
                <ActionCard item={item} />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};
