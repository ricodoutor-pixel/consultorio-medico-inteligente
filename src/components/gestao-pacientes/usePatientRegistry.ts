import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RegistryPatient {
  id: string;
  name: string;
  cpf: string | null;
  registeredAt: string;
  status: "Ativo" | "Pendente";
}

export interface PatientRegistry {
  patients: RegistryPatient[];
  loading: boolean;
  total: number;
  newThisMonth: number;
  activeCount: number;
  pendingCount: number;
}

/** Carrega os pacientes realmente cadastrados no banco (sem dados fictícios). */
export function usePatientRegistry(): PatientRegistry {
  const [patients, setPatients] = useState<RegistryPatient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, cpf, phone, date_of_birth, created_at")
        .or("user_type.eq.patient,signup_role.eq.paciente")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.warn("[usePatientRegistry]", error);
        setPatients([]);
        setLoading(false);
        return;
      }

      const ids = (data || []).map((p) => p.id);
      const consented = new Set<string>();
      if (ids.length) {
        const { data: tcle } = await supabase
          .from("tcle_consents")
          .select("user_id")
          .in("user_id", ids);
        (tcle || []).forEach((t) => consented.add(t.user_id));
      }

      if (!active) return;

      setPatients(
        (data || []).map((p) => ({
          id: p.id,
          name: p.full_name || "Paciente sem nome",
          cpf: p.cpf,
          registeredAt: p.created_at,
          status:
            p.full_name && p.cpf && p.phone && p.date_of_birth && consented.has(p.id)
              ? "Ativo"
              : "Pendente",
        }))
      );
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  return {
    patients,
    loading,
    total: patients.length,
    newThisMonth: patients.filter((p) => new Date(p.registeredAt) >= monthStart).length,
    activeCount: patients.filter((p) => p.status === "Ativo").length,
    pendingCount: patients.filter((p) => p.status === "Pendente").length,
  };
}
