// src/hooks/useDoctors.ts
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchInlineAvatar } from "@/lib/kyc-docs";

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
  is_approved_by_admin?: boolean | null;
  is_approved?: boolean | null;
  approval_status?: "approved" | "pending" | "blocked" | string;
  rating?: number | null;
  total_consultations?: number | null;
  full_name?: string | null;
  avatar_url?: string | null;
  profile?: any;
  kyc_docs?: any[];
  [key: string]: any;
}

interface Counts {
  total: number;
  approved: number;
  pending: number;
  blocked: number;
  withDocs: number;
}

function getStoredOverrides(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem("doctor_card_overrides") || "{}");
  } catch {
    return {};
  }
}

export function useDoctors() {
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("doctors" as any)
        .select("*")
        .order("created_at", { ascending: true });

      const dbRows = ((data ?? []) as unknown as DoctorRow[]);
      const userIds = Array.from(new Set(dbRows.map((d) => d.user_id).filter(Boolean)));

      let profiles: any[] = [];
      let kycDocs: any[] = [];

      if (userIds.length > 0) {
        const [profRes, kycRes] = await Promise.all([
          (supabase.rpc as any)("admin_doctor_profiles", { _ids: userIds }).catch(() => ({ data: [] })),
          Promise.resolve(
            supabase
              .from("doctor_kyc_documents" as any)
              .select("doctor_user_id, document_kind, storage_path, mime_type, verification_status, created_at")
              .in("doctor_user_id", userIds)
          ).catch(() => ({ data: [] })),
        ]);
        profiles = profRes.data || [];
        kycDocs = kycRes.data || [];
      }

      const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
      const docsMap = new Map<string, any[]>();
      for (const doc of kycDocs) {
        const list = docsMap.get(doc.doctor_user_id) ?? [];
        list.push(doc);
        docsMap.set(doc.doctor_user_id, list);
      }

      const overrides = getStoredOverrides();

      // Mapeia exclusivamente os registros reais do banco de dados (zero dados mockados)
      const mappedDbDoctors: DoctorRow[] = dbRows.map((d) => {
        const profile = profileMap.get(d.user_id) as any;
        const fullName = profile?.full_name ?? d.full_name ?? "";
        
        const avatarUrl = profile?.avatar_url ?? d.avatar_url ?? null;
        const overrideVal = overrides[d.id] ?? overrides[d.user_id];
        const isApproved = overrideVal !== undefined ? overrideVal : (d.is_approved_by_admin || d.is_verified || false);

        return {
          ...d,
          is_approved_by_admin: isApproved,
          is_approved: isApproved,
          is_verified: isApproved,
          approval_status: isApproved ? "approved" : "pending",
          kyc_status: isApproved ? "approved" : "pending",
          profile: profile ?? {
            id: d.user_id,
            full_name: fullName,
            cpf: d.document_number || null,
            phone: d.phone || null,
            pix_key: d.pix_key || null,
            date_of_birth: null,
            cep: null,
            avatar_url: avatarUrl,
          },
          kyc_docs: docsMap.get(d.user_id) ?? [],
          full_name: fullName || null,
          avatar_url: avatarUrl,
        };
      });

      // Exclusivamente os registros reais cadastrados no Supabase
      setDoctors(mappedDbDoctors);

      // Fotos legadas inline
      const inlineIds = profiles
        .filter((p: any) => p?.has_inline_avatar)
        .map((p: any) => p.id as string);
      if (inlineIds.length) {
        const resolved = await Promise.all(
          inlineIds.map(async (id) => [id, await fetchInlineAvatar(id)] as [string, string | null]),
        );
        const inlineMap = new Map(resolved);
        setDoctors((prev) =>
          prev.map((d): DoctorRow => {
            const inline = inlineMap.get(d.user_id) as string | null | undefined;
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
      console.error("[useDoctors] DB fetch error:", e);
      setDoctors([]);
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
    const poll = setInterval(performFetch, 30_000);

    const channel = supabase
      .channel("public:doctors-status-hook")
      .on("postgres_changes", { event: "*", schema: "public", table: "doctors" }, () => fetchDoctors())
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "doctor_kyc_documents" },
        () => fetchDoctors(),
      )
      .subscribe();

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [fetchDoctors]);

  const counts = useMemo<Counts>(() => {
    const total = doctors.length;
    const approved = doctors.filter((d) => d.is_approved_by_admin || d.approval_status === "approved" || d.is_verified).length;
    const pending = doctors.filter((d) => d.approval_status === "pending" || (!d.is_approved_by_admin && !d.is_verified && d.approval_status !== "rejected" && d.approval_status !== "blocked")).length;
    const blocked = doctors.filter((d) => d.approval_status === "blocked" || d.approval_status === "rejected").length;
    const withDocs = doctors.filter((d) => d.kyc_docs && (d.kyc_docs as any[]).length > 0).length;
    return { total, approved, pending, blocked, withDocs };
  }, [doctors]);

  return { doctors, setDoctors, loading, fetchDoctors, counts };
}
