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
        // Ordem de chegada real (primeiro cadastro primeiro): Dr. Edilson → Dra. Olivia → Dra. Suelen → …
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[useDoctors] error fetching doctors:", error);
        return;
      }

      const rows = (data ?? []) as unknown as DoctorRow[];
      const userIds = Array.from(new Set(rows.map((d) => d.user_id).filter(Boolean)));

      // Dados reais de cadastro (nome, CPF, nascimento, WhatsApp, PIX, endereço, foto) — visíveis ao admin via RLS
      const [{ data: profiles }, { data: kycDocs }] = await Promise.all([
        userIds.length
          ? // RPC admin: retorna dados fiéis de cadastro sem trazer fotos base64 gigantes (2MB+)
            (supabase.rpc as any)("admin_doctor_profiles", { _ids: userIds })
          : Promise.resolve({ data: [] as any[] } as any),
        userIds.length
          ? supabase
              .from("doctor_kyc_documents" as any)
              .select("doctor_user_id, document_kind, storage_path, mime_type, verification_status, created_at")
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

      // Fotos legadas gravadas como base64 no banco: carregadas sob demanda
      const inlineIds = (profiles ?? [])
        .filter((p: any) => p?.has_inline_avatar)
        .map((p: any) => p.id as string);
      if (inlineIds.length) {
        const resolved = await Promise.all(
          inlineIds.map(async (id) => [id, await fetchInlineAvatar(id)] as const),
        );
        const inlineMap = new Map(resolved);
        setDoctors((prev) =>
          prev.map((d) => {
            const inline = inlineMap.get(d.user_id);
            if (!inline) return d;
            return {
              ...d,
              avatar_url: inline,
              profile: d.profile ? { ...d.profile, avatar_url: inline } : d.profile,
            };
          }),
        );
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
