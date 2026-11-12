import { useEffect, useState } from "react";
import { Copy, Link2, Loader2, MessageSquare, Stethoscope, Users, Video } from "lucide-react";
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

  const rows = links
    ? [
        { icon: MessageSquare, label: "Pacientes — consulta por chat comigo", url: links.chat },
        { icon: Video, label: "Pacientes — consulta por vídeo comigo", url: links.video },
        { icon: Users, label: "Colegas — cadastro de profissional", url: links.colleague },
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
        {error && <p className="text-sm text-red-600">Não foi possível carregar seus links agora. Recarregue a página.</p>}
        {!links && !error && (
          <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Carregando seus links...
          </p>
        )}
        {rows.map(({ icon: Icon, label, url }) => (
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
