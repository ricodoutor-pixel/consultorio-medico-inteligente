import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface NPSSummary {
  npsScore: number;
  avgScore: number;
  totalResponses: number;
  promoters: number;
  passives: number;
  detractors: number;
  responseRate: number;
  trends: Array<{ date: string; npsScore: number; totalResponses: number; avgScore: number }>;
  recentFeedback: Array<{ score: number; feedback: string; sentiment: string; date: string }>;
}

export interface NPSAlert {
  id: string;
  response_id: string;
  professional_id: string;
  alert_type: string;
  severity: string;
  message: string;
  status: string;
  created_at: string;
}

export function useNPS() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitResponse = useCallback(
    async (data: {
      orientação técnicationId: string;
      patientId: string;
      professionalId: string;
      score: number;
      feedback?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const { data: result, error: err } = await supabase.functions.invoke("nps-submit", { body: data });
        if (err) throw err;
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro desconhecido";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getSummary = useCallback(async (): Promise<NPSSummary> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke("nps-summary");
      if (err) throw err;
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAlerts = useCallback(async (): Promise<{ alerts: NPSAlert[] }> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke("nps-alerts");
      if (err) throw err;
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke("nps-alerts", {
        body: { alertId },
        method: "POST",
      });
      if (err) throw err;
      return data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitResponse, getSummary, getAlerts, acknowledgeAlert, loading, error };
}
