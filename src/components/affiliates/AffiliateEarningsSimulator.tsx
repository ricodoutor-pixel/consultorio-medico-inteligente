import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calculator, TrendingUp, Users, Target, Sparkles,
  Rocket, MessageCircle, Share2, Trophy, ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

// Comissões oficiais (Affiliate Economy v6)
const RATE_N1 = 0.25;
const RATE_N2 = 0.15;
const RATE_N3 = 0.10;

const PLANS = [
  { id: "vip", label: "VIP", price: 99 },
  { id: "pro", label: "Pro", price: 299 },
  { id: "premium", label: "Premium", price: 599 },
] as const;

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function AffiliateEarningsSimulator() {
  const [directs, setDirects] = useState(3);
  const [perPerson, setPerPerson] = useState(3);
  const [planPrice, setPlanPrice] = useState<number>(99);

  const sim = useMemo(() => {
    const n1 = directs;
    const n2 = directs * perPerson;
    const n3 = directs * perPerson * perPerson;

    const e1 = n1 * planPrice * RATE_N1;
    const e2 = n2 * planPrice * RATE_N2;
    const e3 = n3 * planPrice * RATE_N3;
    const total = e1 + e2 + e3;

    return {
      n1, n2, n3,
      e1, e2, e3,
      total,
      totalNetwork: n1 + n2 + n3,
      yearly: total * 12,
    };
  }, [directs, perPerson, planPrice]);

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Simulador de Ganhos — Rede de 3 Níveis
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Veja quanto você pode faturar todo mês com indicações recorrentes.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Plan selector */}
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">
            Plano que sua rede vai assinar
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlanPrice(p.price)}
                className={`rounded-lg border px-2 py-2 text-xs transition-all ${
                  planPrice === p.price
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border/40 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {p.label}
                <span className="block text-[10px] opacity-80">{fmt(p.price)}/mês</span>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">
              Quantos amigos VOCÊ indica
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={directs}
              onChange={(e) => setDirects(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Quantos cada um indica
            </Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={perPerson}
              onChange={(e) => setPerPerson(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1"
            />
          </div>
        </div>

        {/* Levels breakdown */}
        <div className="space-y-2">
          <LevelRow
            level={1}
            rate={RATE_N1}
            people={sim.n1}
            earnings={sim.e1}
            color="from-emerald-500/20 to-emerald-500/5"
            badge="border-emerald-400/40 text-emerald-300"
          />
          <LevelRow
            level={2}
            rate={RATE_N2}
            people={sim.n2}
            earnings={sim.e2}
            color="from-sky-500/20 to-sky-500/5"
            badge="border-sky-400/40 text-sky-300"
          />
          <LevelRow
            level={3}
            rate={RATE_N3}
            people={sim.n3}
            earnings={sim.e3}
            color="from-amber-500/20 to-amber-500/5"
            badge="border-amber-400/40 text-amber-300"
          />
        </div>

        {/* Totals */}
        <motion.div
          key={sim.total}
          initial={{ scale: 0.98, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-4"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              Sua renda mensal recorrente
            </span>
            <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
              {sim.totalNetwork} pessoas na rede
            </Badge>
          </div>
          <p className="text-3xl font-extrabold text-primary leading-tight">
            {fmt(sim.total)}
            <span className="text-xs font-normal text-muted-foreground"> /mês</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Projeção em 12 meses:{" "}
            <span className="text-foreground font-semibold">{fmt(sim.yearly)}</span>
          </p>
        </motion.div>

        <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
          * Cálculo assumindo assinaturas ativas (renovação mensal). Comissões: 25% no nível 1, 15% no nível 2 e 10% no nível 3, conforme regulamento Planta y Raiz.
        </p>
      </CardContent>
    </Card>
  );
}

function LevelRow({
  level, rate, people, earnings, color, badge,
}: {
  level: number; rate: number; people: number; earnings: number;
  color: string; badge: string;
}) {
  return (
    <div className={`rounded-lg bg-gradient-to-r ${color} border border-border/30 p-3`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-[10px] ${badge}`}>
            Nível {level}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            {(rate * 100).toFixed(0)}% por assinatura
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" /> {people}
        </span>
      </div>
      <p className="text-lg font-bold text-foreground">{fmt(earnings)}<span className="text-[10px] font-normal text-muted-foreground"> /mês</span></p>
    </div>
  );
}

// ============================================================
// PLANO DE AÇÃO — guia prático para novos afiliados
// ============================================================

const STEPS = [
  {
    icon: Rocket,
    title: "1. Ative seu link e domine sua história",
    body:
      "Copie seu link de indicação no topo do painel e salve-o no bio do Instagram, WhatsApp Business e descrição do TikTok. Antes de divulgar, escreva em 3 frases por que a Planta y Raiz mudou (ou pode mudar) a sua vida. Pessoas compram histórias, não cupons.",
  },
  {
    icon: MessageCircle,
    title: "2. Lista quente: comece pelos 20 mais próximos",
    body:
      "Faça uma lista no papel com 20 pessoas que confiam em você (família, amigos, colegas de trabalho, grupos de pacientes). Mande UMA mensagem personalizada por dia — nada de copia-e-cola em massa. Meta da primeira semana: 3 inscritos no plano VIP (R$ 99).",
  },
  {
    icon: Share2,
    title: "3. Conteúdo de autoridade 3x por semana",
    body:
      "Poste depoimentos reais, antes/depois, dúvidas comuns sobre cannabis medicinal e bastidores das consultas. Use os criativos prontos do Club Planta y Raiz. Sempre termine com call-to-action: \"Quer falar com a Brisa? Clica no meu link\".",
  },
  {
    icon: Users,
    title: "4. Duplicação: ensine sua rede a indicar",
    body:
      "Seu maior salto acontece quando os indicados começam a indicar. Faça uma call semanal de 20 minutos no Google Meet com seus 3 primeiros afiliados, mostre como você fez e dê os scripts. Quando cada um indicar 3, você multiplica sua renda por 4x sem trabalhar mais.",
  },
  {
    icon: Trophy,
    title: "5. Suba de nível e libere bônus",
    body:
      "Ao bater 10 indicações ativas você vira Prata (mais visibilidade na busca). Aos 30, vira Ouro e recebe bônus de R$ 500. Aos 100, vira Diamante e participa do split executivo. Mire em crescer 3 indicações por mês — em 1 ano você está no topo.",
  },
];

export function AffiliateActionPlan() {
  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Plano de Ação — Do Zero ao Primeiro Salário
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          5 passos práticos para quem está começando agora.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-border/30 bg-background/30 p-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-foreground mb-1">{s.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            </div>
          </motion.div>
        ))}

        <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/15 to-transparent p-3 mt-2">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold text-foreground">Meta inteligente</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Indicar 3 pessoas no plano VIP e ensiná-las a indicar mais 3 te coloca, em até 90 dias, faturando perto de <span className="text-primary font-bold">{fmt(475.2)}/mês de renda passiva</span>. Repita a duplicação por 3 ciclos e seu salário passa de R$ 4 mil/mês — sem teto.
          </p>
          <Button size="sm" className="mt-3 w-full gap-1" variant="default">
            Quero começar agora <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
