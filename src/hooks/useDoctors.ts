// src/hooks/useDoctors.ts
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DoctorRow {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string | null;
  specialty: string | null;
  document_type?: string | null;
  country?: string | null;
  city?: string | null;
  is_online: boolean | null;
  is_available?: boolean | null;
  is_verified?: boolean | null;
  approval_status?: "approved" | "pending" | "blocked" | string;
  rating?: number | null;
  total_consultations?: number | null;
  full_name?: string | null;
  avatar_url?: string | null;
}

interface Counts {
  total: number;
  approved: number;
  pending: number;
  blocked: number;
}

export function useDoctors() {
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDoctors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("doctors" as any)
        .select("*");
      if (error) {
        console.error("[useDoctors] error fetching doctors:", error);
      } else if (data) {
        setDoctors(data as DoctorRow[]);
      }
    } catch (e) {
      console.error("[useDoctors] unexpected error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const performFetch = async () => {
      await fetchDoctors();
    };

    performFetch();
    const poll = setInterval(performFetch, 20_000);

    const channel = supabase
      .channel("public:doctors-status-hook")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "doctors" },
        () => performFetch()
      )
      .subscribe();

    return () => {
      active = false;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [fetchDoctors]);

  const counts = useMemo<Counts>(() => {
    const total = doctors.length;
    const approved = doctors.filter((d) => d.approval_status === "approved").length;
    const pending = doctors.filter((d) => d.approval_status === "pending").length;
    const blocked = doctors.filter((d) => d.approval_status === "blocked").length;
    return { total, approved, pending, blocked };
  }, [doctors]);

  return { doctors, setDoctors, loading, fetchDoctors, counts };
}
