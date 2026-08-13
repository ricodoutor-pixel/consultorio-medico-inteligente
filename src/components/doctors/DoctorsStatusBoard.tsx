import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OnlineStatusIndicator } from "@/components/OnlineStatusIndicator";
import { Loader2, Stethoscope } from "lucide-react";
import { useDoctors } from "@/hooks/useDoctors";

interface Props {
  /** Admin mode shows extra data (consultas, verificado) */
  variant?: "admin" | "public";
  title?: string;
}

export function DoctorsStatusBoard({ variant = "public", title = "Médicos na plataforma" }: Props) {
  const { doctors: rawDoctors, loading } = useDoctors();

  // Sort: online first, then alphabetical
  const doctors = useMemo(() => {
    return [...rawDoctors].sort((a, b) => {
      const ao = a.is_online && (a.is_available ?? true) ? 0 : 1;
      const bo = b.is_online && (b.is_available ?? true) ? 0 : 1;
      if (ao !== bo) return ao - bo;
      return (a.full_name || a.crm || "").localeCompare(b.full_name || b.crm || "");
    });
  }, [rawDoctors]);

  const onlineCount = doctors.filter((d) => d.is_online && (d.is_available ?? true)).length;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-500">
            {onlineCount} online
          </Badge>
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            {Math.max(0, doctors.length - onlineCount)} offline
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : doctors.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum médico cadastrado.</p>
        ) : (
          <ul className="divide-y divide-border">
            {doctors.map((d) => {
              const online = Boolean(d.is_online && (d.is_available ?? true));
              const name = d.full_name || `Dr(a). ${d.crm}`;
              const doc =
                d.document_type === "ci" ? `CI ${d.crm} - BO` : `CRM ${d.crm}${d.crm_state ? `/${d.crm_state}` : ""}`;
              const local = d.city ? `${d.city}${d.country ? `, ${d.country}` : ""}` : d.country || "";
              return (
                <li key={d.id} className="flex items-center gap-3 px-4 py-3">
                  <img
                    src={d.avatar_url || "/placeholder.svg"}
                    alt={`Foto de ${name}`}
                    loading="lazy"
                    className="w-10 h-10 rounded-full object-cover bg-muted shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{name}</p>
                      {variant === "admin" && d.is_verified && (
                        <Badge variant="secondary" className="text-[10px] bg-primary/15 text-primary">
                          Verificado
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc}
                      {d.specialty ? ` · ${d.specialty}` : ""}
                      {local ? ` · ${local}` : ""}
                    </p>
                    {variant === "admin" && (
                      <p className="text-[10px] text-muted-foreground">
                        ⭐ {(d.rating ?? 5).toFixed(1)} · {d.total_consultations ?? 0} consultas
                      </p>
                    )}
                  </div>
                  <OnlineStatusIndicator online={online} size="md" showLabel />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default DoctorsStatusBoard;
