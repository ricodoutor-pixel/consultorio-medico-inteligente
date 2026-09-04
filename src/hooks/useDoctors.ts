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

/**
 * Fonte única de verdade do painel KYC: lê exclusivamente os cadastros reais
 * gravados no banco (doctors + profiles + doctor_kyc_documents).
 * Nada é inventado — se o médico não enviou um documento, o painel mostra a falta.
 */
export function useDoctors() {
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDoctors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("doctors" as any)
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const dbRows = (data ?? []) as unknown as DoctorRow[];
      const userIds = Array.from(new Set(dbRows.map((d) => d.user_id).filter(Boolean)));

      let profiles: any[] = [];
      let kycDocs: any[] = [];

      if (userIds.length > 0) {
        const [profRes, kycRes] = await Promise.all([
          Promise.resolve((supabase.rpc as any)("admin_doctor_profiles", { _ids: userIds })).catch(
            () => ({ data: [] as any[] }),
          ),
          Promise.resolve(
            supabase
              .from("doctor_kyc_documents" as any)
              .select(
                "id, doctor_user_id, document_kind, storage_path, mime_type, verification_status, created_at",
              )
              .in("doctor_user_id", userIds),
          ).catch(() => ({ data: [] as any[] })),
        ]);
        profiles = (profRes as any)?.data || [];
        kycDocs = (kycRes as any)?.data || [];
      }

      const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
      const docsMap = new Map<string, any[]>();
      for (const doc of kycDocs) {
        const list = docsMap.get(doc.doctor_user_id) ?? [];
        list.push(doc);
        docsMap.set(doc.doctor_user_id, list);
      }

      const mapped: DoctorRow[] = dbRows.map((d) => {
        const profile = (profileMap.get(d.user_id) as any) ?? null;
        const fullName = (profile?.full_name ?? d.full_name ?? "").trim();
        const avatarUrl = profile?.avatar_url ?? d.avatar_url ?? null;

        const approved = Boolean(d.is_approved_by_admin);
        const status: string =
          d.approval_status === "blocked" || d.approval_status === "rejected"
            ? "blocked"
            : approved
              ? "approved"
              : "pending";

        return {
          ...d,
          is_approved_by_admin: approved,
          is_approved: approved,
          approval_status: status,
          profile: profile ?? { id: d.user_id, full_name: fullName, avatar_url: avatarUrl },
          kyc_docs: docsMap.get(d.user_id) ?? [],
          full_name: fullName || null,
          avatar_url: avatarUrl,
        };
      });

      // Mais recentes primeiro: novos cadastros aparecem no topo da esteira
      mapped.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at as string).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at as string).getTime() : 0;
        return tb - ta;
      });

      setDoctors(mapped);

      // Fotos legadas salvas inline (data:URI) — buscadas sob demanda
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
      console.warn("[useDoctors] falha ao carregar cadastros médicos:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
    const poll = setInterval(fetchDoctors, 30_000);

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
    const approved = doctors.filter((d) => d.approval_status === "approved").length;
    const pending = doctors.filter((d) => d.approval_status === "pending").length;
    const blocked = doctors.filter((d) => d.approval_status === "blocked").length;
    const withDocs = doctors.filter((d) => (d.kyc_docs || []).length > 0).length;
    return { total, approved, pending, blocked, withDocs };
  }, [doctors]);

  return { doctors, setDoctors, loading, fetchDoctors, counts };
}
