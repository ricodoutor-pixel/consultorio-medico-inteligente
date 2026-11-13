import { Link } from "react-router-dom";
import { Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnlineStatusIndicator } from "@/components/OnlineStatusIndicator";
import { useRealProfessionals } from "@/hooks/useRealProfessionals";

const MEDICOS_CATEGORY = "Médicos Prescritores";

/**
 * Plantão público com presença REAL (mesma regra da vitrine): lista só quem está online (verde) ou em consulta
 * (amarelo). Nunca usa dados de exemplo nem o cadastro privado de médicos.
 */
export function PublicDoctorsOnlineBoard({ title = "Médicos disponíveis agora" }: { title?: string }) {
  const { professionals } = useRealProfessionals();
  const active = professionals.filter(
    (p) => p.category === MEDICOS_CATEGORY && (p.online || p.presenceState === "em_consulta"),
  );
  const online = active.filter((p) => p.online).length;
  const busy = active.length - online;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-500">{online} online</Badge>
          {busy > 0 && <Badge variant="secondary" className="bg-amber-500/15 text-amber-500">{busy} em consulta</Badge>}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {active.length === 0 ? (
          <div className="px-4 py-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Nenhum médico de plantão neste momento.</p>
            <p className="text-xs text-muted-foreground">
              Os médicos entram ao longo do dia.{" "}
              <Link to="/profissionais" className="text-primary font-bold underline">Escolha seu médico</Link> ou{" "}
              <Link to="/agendamento" className="text-primary font-bold underline">agende um horário</Link>.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {active.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <img src={p.imageUrl || "/placeholder.svg"} alt={`Foto de ${p.name}`} loading="lazy" className="w-10 h-10 rounded-full object-cover bg-muted shrink-0" />
                <div className="min-w-0 flex-1">
                  <Link to={`/profissionais/${p.id}`} className="font-semibold text-sm truncate hover:underline block">{p.name}</Link>
                  <p className="text-xs text-muted-foreground truncate">{[p.crm ? `CRM ${p.crm}` : "", p.tags?.[0] ?? ""].filter(Boolean).join(" · ")}</p>
                </div>
                <OnlineStatusIndicator online={p.online} presenceState={p.presenceState} showLabel />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
