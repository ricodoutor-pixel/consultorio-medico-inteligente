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
  [key: string]: any;
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
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useDoctors] error fetching doctors:", error);
        return;
      }

      const rows = (data ?? []) as unknown as DoctorRow[];
      const userIds = Array.from(new Set(rows.map((d) => d.user_id).filter(Boolean)));

      // Dados reais de cadastro (nome, CPF, nascimento, WhatsApp, PIX, foto) — visíveis ao admin via RLS
      const [{ data: profiles }, { data: kycDocs }] = await Promise.all([
        userIds.length
          ? supabase
              .from("profiles")
              .select("id, full_name, phone, cpf, date_of_birth, pix_key, pix_type, avatar_url, city, region, country, created_at")
              .in("id", userIds)
          : Promise.resolve({ data: [] as any[] } as any),
        userIds.length
          ? supabase
              .from("doctor_kyc_documents" as any)
              .select("doctor_user_id, document_kind, storage_path, verification_status, created_at")
              .in("doctor_user_id", userIds)
          : Promise.resolve({ data: [] as any[] } as any),
      ]);

      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      const docsMap = new Map<string, any[]>();
      for (const doc of (kycDocs ?? []) as any[]) {
        const list = docsMap.get(doc.doctor_user_id) ?? [];
        list.push(doc);
        docsMap.set(doc.doctor_user_id, list);
      }

      setDoctors(
        rows.map((d) => ({
          ...d,
          profile: profileMap.get(d.user_id) ?? null,
          kyc_docs: docsMap.get(d.user_id) ?? [],
          full_name: (profileMap.get(d.user_id) as any)?.full_name ?? d.full_name ?? null,
          avatar_url: (profileMap.get(d.user_id) as any)?.avatar_url ?? d.avatar_url ?? null,
        }))
      );
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
