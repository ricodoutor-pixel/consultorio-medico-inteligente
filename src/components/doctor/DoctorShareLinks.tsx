import { useEffect, useState } from "react";
import { Copy, Link2, Loader2, MessageSquare, Stethoscope, Users, Video, Share2, UserPlus, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { loadPermanentReferralCode } from "@/lib/referral-code";
import { doctorShareLinks } from "@/lib/doctor-share-links";

interface Props {
  doctorId: string;
  userId: string;
}

/**
 * Links pessoais do médico: pacientes entram direto na consulta com ele (chat ou vídeo) e colegas se cadastram
 * como profissionais. Todos levam o código permanente de indicação (ensure_referral_code), nunca um código local.
 */
export function DoctorShareLinks({ doctorId, userId }: Props) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadPermanentReferralCode(userId)
      .then(setCode)
      .catch(() => setError(true));
  }, [userId]);

  const links = code ? doctorShareLinks(window.location.origin, doctorId, code) : null;
  const copy = (value: string) => {
    void navigator.clipboard.writeText(value).then(
      () => toast.success("Link copiado!"),
      () => toast.error("Não foi possível copiar. Selecione e copie o link."),
    );
  };

  const shareWhatsApp = (text: string, url: string) => {
    const full = `${text}\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(full)}`, "_blank");
  };

  const rows = links
    ? [
        { 
          icon: Video, 
          label: "Pacientes — consulta por vídeo comigo (cai direto)", 
          url: links.video,
          shareText: "Olá! Você pode agendar uma teleconsulta diretamente comigo pelo consultório virtual da Planta y Raíz:"
        },
        { 
          icon: MessageSquare, 
          label: "Pacientes — consulta por chat comigo (cai direto)", 
          url: links.chat,
          shareText: "Olá! Se preferir atendimento ágil por chat, inicie sua consulta comigo através deste link:"
        },
        { 
          icon: Users, 
          label: "Colegas médicos — convite & comissões em 3 gerações", 
          url: links.colleague,
          shareText: "Olá, colega médico! Convido você a fazer parte da equipe de telemedicina da Planta y Raíz com consultório inteligente e comissões vitalícias em até 3 gerações:"
        },
        { 
          icon: UserPlus, 
          label: "Pacientes — cadastro geral na plataforma", 
          url: links.patient,
          shareText: "Cadastre-se na plataforma Planta y Raíz para acompanhar orientações e consultas de saúde:"
        },
      ]
    : [];

  return (
    <Card className="mb-6 border-emerald-500/30">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 size={18} className="text-emerald-600" />
          <h3 className="font-bold text-foreground">Meus links personalizados</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Envie aos seus pacientes: a consulta já abre com você escolhido. Se você não puder atender na hora, o paciente
          segue na fila oficial (assinantes → plantão online → sala de espera).
        </p>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
              <Sparkles size={13} /> Renda Mensal Vitalícia em 3 Gerações (Médico Sócio)
            </span>
            <p className="text-[11px] text-emerald-200/90 leading-tight">
              Indique colegas e pacientes. Ganhe comissões vitalícias em cascata toda vez que sua rede atende, assina ou expande novos membros!
            </p>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs font-bold border-emerald-500/40 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 shrink-0" asChild>
            <a href="/indicacoes">Simulador & Extrato <ArrowRight size={12} className="ml-1" /></a>
          </Button>
        </div>
        {error && <p className="text-sm text-red-600">Não foi possível carregar seus links agora. Recarregue a página.</p>}
        {!links && !error && (
          <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Carregando seus links...
          </p>
        )}
        {rows.map(({ icon: Icon, label, url, shareText }) => (
          <div key={url} className="space-y-1">
            <p className="text-xs font-bold text-foreground inline-flex items-center gap-1.5">
              <Icon size={13} className="text-emerald-600" /> {label}
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={url}
                className="flex-1 min-w-0 rounded-lg border border-border bg-muted px-3 py-2 text-xs font-mono"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button size="sm" variant="outline" onClick={() => copy(url)} title="Copiar link">
                <Copy size={14} />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-emerald-600/40 text-emerald-600 hover:bg-emerald-600/10" 
                onClick={() => shareWhatsApp(shareText, url)} 
                title="Compartilhar no WhatsApp"
              >
                <Share2 size={14} className="mr-1" />
                <span className="hidden sm:inline text-xs">WhatsApp</span>
              </Button>
            </div>
          </div>
        ))}
        {links && (
          <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Stethoscope size={12} /> Seu código de indicação: <span className="font-mono font-bold">{code}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
