import { useEffect, useState } from "react";
import { BrainCircuit, CheckCircle2, Clock, FileSignature, Link2, Scale, Stethoscope, Video, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { DOCTOR_AI_DAILY_LIMITS, isPaidPlan } from "../../../supabase/functions/_shared/doctor-kit";

interface Props {
  planTier?: string | null;
  onOpenTab: (tab: string) => void;
}

interface Usage {
  limit: number;
  used: number;
}

/** Resumo do Kit do Assinante: o que o plano inclui, uso de hoje das ferramentas de IA e o que vem a seguir. */
export function MeuKitAssinante({ planTier, onOpenTab }: Props) {
  const paid = isPaidPlan(planTier);
  const [copiloto, setCopiloto] = useState<Usage | null>(null);
  const [juridico, setJuridico] = useState<Usage | null>(null);

  useEffect(() => {
    void supabase.functions.invoke("clinical-copilot", { body: { action: "status" } }).then(({ data }) => {
      if (data && typeof data.limit === "number") setCopiloto(data as Usage);
    });
    void supabase.functions.invoke("doctor-legal-assistant", { body: { action: "status" } }).then(({ data }) => {
      if (data && typeof data.limit === "number") setJuridico(data as Usage);
    });
  }, []);

  const usageText = (u: Usage | null, fallback: number) => (u ? `${u.used}/${u.limit} hoje` : `até ${fallback}/dia`);

  const tools = [
    {
      icon: BrainCircuit,
      title: "Copiloto de evidências (PubMed)",
      text: "Pergunta clínica, interações, titulação e SOAP com estudos conferidos pelo PMID.",
      badge: usageText(copiloto, paid ? DOCTOR_AI_DAILY_LIMITS.copiloto.paid : DOCTOR_AI_DAILY_LIMITS.copiloto.free),
      tab: "copiloto-vip",
    },
    {
      icon: Scale,
      title: "Assistente jurídico",
      text: "CFM, telemedicina, publicidade, LGPD e Anvisa. Orientação informativa.",
      badge: paid ? usageText(juridico, DOCTOR_AI_DAILY_LIMITS.juridico.paid) : "planos pagos",
      tab: "juridico",
    },
    {
      icon: Stethoscope,
      title: "Prontuário eletrônico",
      text: "Linha do tempo, CID-10 oficial (DATASUS), modelos de anamnese, alergias no topo e gráfico de evolução.",
      badge: "no Workspace",
      tab: "prontuarios-pacientes",
    },
    {
      icon: Video,
      title: "Consulta por chat e vídeo próprio",
      text: "Sala segura da Planta y Raíz, tela cheia, anexos e encerramento com avaliação.",
      badge: "incluído",
      tab: "atendimentos",
    },
    {
      icon: FileSignature,
      title: "Receita, atestado e pedido de exames",
      text: "PDF timbrado com sua assinatura visual e assinatura digital gov.br.",
      badge: "incluído",
      tab: "atendimentos",
    },
    {
      icon: Wallet,
      title: "Repasse de 93% e saque Pix",
      text: "Liberado após a avaliação do paciente; saque Pix e relatório mensal para o contador.",
      badge: "incluído",
      tab: "financeiro",
    },
    {
      icon: Clock,
      title: "Lembretes automáticos no WhatsApp",
      text: "Paciente recebe aviso 24 h e 1 h antes da consulta e convite de retorno em 30 dias.",
      badge: "incluído",
      tab: "atendimentos",
    },
    {
      icon: Link2,
      title: "Links personalizados e indicações",
      text: "Pacientes entram direto com você; colegas se cadastram pelo seu link.",
      badge: "incluído",
      tab: "perfil",
    },
  ];

  const next = [
    "Escriba de IA: a consulta vira rascunho do SOAP (com consentimento do paciente)",
    "Assinatura ICP-Brasil em 1 clique (BirdID/VIDaaS), inclusive controle especial",
  ];

  return (
    <div className="space-y-6">
      <Card className="border-emerald-500/30">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Meu Kit do Assinante</CardTitle>
            <Badge className={paid ? "bg-emerald-600 text-white" : "bg-muted text-foreground"}>
              {paid ? `Plano ${String(planTier).toUpperCase()}` : "Plano Free"}
            </Badge>
          </div>
          <CardDescription>
            Tudo o que você precisa para atender com segurança, eficiência e boa remuneração, num só lugar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {tools.map(({ icon: Icon, title, text, badge, tab }) => (
            <button
              key={title}
              type="button"
              onClick={() => onOpenTab(tab)}
              className="text-left rounded-xl border border-border p-4 hover:border-emerald-500/60 hover:bg-emerald-500/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-foreground inline-flex items-center gap-2">
                  <Icon className="h-4 w-4 text-emerald-600 shrink-0" /> {title}
                </p>
                <Badge variant="outline" className="shrink-0 text-[10px]">{badge}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{text}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base inline-flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" /> Chegando ao kit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {next.map((n) => (
            <p key={n} className="text-sm text-muted-foreground inline-flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-muted-foreground/60 shrink-0" /> {n}
            </p>
          ))}
          {!paid && (
            <Button asChild className="mt-2">
              <Link to="/dashboard-medico">Conhecer os planos</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
