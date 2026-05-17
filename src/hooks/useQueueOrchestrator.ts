import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AvailableDoctor {
  doctor_id: string;
  user_id: string;
  specialty: string;
  rating: number | null;
}

/**
 * Varre `doctors` em tempo real procurando médico is_online=true e is_available=true.
 * Usado pelo "Atendimento Imediato" (Opção C Videoconsulta R$ 80) e botão homepage.
 */
export function useQueueOrchestrator(pollMs = 15000) {
  const [doctor, setDoctor] = useState<AvailableDoctor | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_next_available_doctor" as any);
    if (!error && data && (data as any[]).length > 0) {
      setDoctor((data as any[])[0] as AvailableDoctor);
    } else {
      setDoctor(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { doctor, loading, hasDoctor: !!doctor, refresh };
}
