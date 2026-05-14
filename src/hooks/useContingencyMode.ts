import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ContingencyState {
  enabled: boolean;
  since: string | null;
  reason: string | null;
}

/**
 * Lê em tempo real a flag mp_contingency_mode em system_settings.
 * Quando true, o checkout deve exibir <PixEstaticoFallback />.
 */
export function useContingencyMode(): ContingencyState & { loading: boolean } {
  const [state, setState] = useState<ContingencyState>({ enabled: false, since: null, reason: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "mp_contingency_mode")
        .maybeSingle();
      if (alive && data?.value) {
        const v = data.value as any;
        setState({ enabled: !!v.enabled, since: v.since ?? null, reason: v.reason ?? null });
      }
      if (alive) setLoading(false);
    };
    load();
    const interval = setInterval(load, 60_000); // re-check a cada 60s
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  return { ...state, loading };
}
