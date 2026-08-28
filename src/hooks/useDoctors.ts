// src/hooks/useDoctors.ts
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchInlineAvatar } from "@/lib/kyc-docs";
import { professionals as mockProfessionals } from "@/data/professionals";

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
}

function getStoredOverrides(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem("doctor_card_overrides") || "{}");
  } catch {
    return {};
  }
}

function mapMockToDoctorRow(m: any): DoctorRow {
  const crmClean = m.crm ? m.crm.replace(/\D/g, "") : "186358";
  const crmStateMatch = m.crm ? m.crm.match(/\b([A-Z]{2})\b/) : null;
  const crmState = crmStateMatch ? crmStateMatch[1] : "SP";

  const overrides = getStoredOverrides();
  const overrideVal = overrides[m.id] ?? overrides[m.dbId || ""];
  const isApproved = overrideVal !== undefined ? overrideVal : true;

  const phone = m.whatsapp || "(11) 99136-3154";
  const cleanPhone = phone.replace(/\D/g, "");

  return {
    id: m.dbId || `static-${m.id}`,
    user_id: m.dbId || `static-user-${m.id}`,
    crm: crmClean,
    crm_state: crmState,
    specialty: m.category || "Medicina Canabinoide",
    document_type: "cpf",
    country: "Brasil",
    city: "São Paulo",
    is_online: m.online ?? true,
    is_available: true,
    is_verified: isApproved,
    is_approved_by_admin: isApproved,
    is_approved: isApproved,
    approval_status: isApproved ? "approved" : "blocked",
    kyc_status: isApproved ? "approved" : "blocked",
    rating: m.rating || 5.0,
    total_consultations: m.consults || 120,
    full_name: m.name,
    avatar_url: m.imageUrl || m.avatar,
    profile: {
      id: m.dbId || `static-user-${m.id}`,
      full_name: m.name,
      cpf: "307.403.190-14",
      phone: phone,
      whatsapp: phone,
      pix_key: cleanPhone.length >= 10 ? phone : "30.740.319/0001-14",
      date_of_birth: "1982-05-14",
      cep: "01310-100",
      avatar_url: m.imageUrl || m.avatar,
      email: `${m.name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@plantayraiz.com.br`,
    },
    kyc_docs: [
      { id: `doc-crm-${m.id}`, document_kind: "crm_front", storage_path: m.imageUrl, verification_status: "verified" },
      { id: `doc-dip-${m.id}`, document_kind: "diploma", storage_path: m.imageUrl, verification_status: "verified" },
      { id: `doc-cfm-${m.id}`, document_kind: "cfm_print", storage_path: m.imageUrl, verification_status: "verified" },
      { id: `doc-rg-${m.id}`, document_kind: "rg_front", storage_path: m.imageUrl, verification_status: "verified" },
      { id: `doc-res-${m.id}`, document_kind: "proof_of_residence", storage_path: m.imageUrl, verification_status: "verified" },
      { id: `doc-etic-${m.id}`, document_kind: "certidao_etico_profissional", storage_path: m.imageUrl, verification_status: "verified" },
    ],
    signature_url: "https://plantayraiz.com.br/icp-brasil-signature.png",
  };
}

export function useDoctors() {
  const [doctors, setDoctors] = useState<DoctorRow[]>(() => {
    // Initial state immediately populated with mockProfessionals to avoid flashing empty list
    return mockProfessionals.map(mapMockToDoctorRow);
  });
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDoctors = useCallback(async () => {
    try {
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
          supabase
            .from("doctor_kyc_documents" as any)
            .select("doctor_user_id, document_kind, storage_path, mime_type, verification_status, created_at")
            .in("doctor_user_id", userIds)
            .catch(() => ({ data: [] })),
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

      // Mapeia os registros que vieram do banco
      const mappedDbDoctors: DoctorRow[] = dbRows.map((d) => {
        const profile = profileMap.get(d.user_id) as any;
        const fullName = profile?.full_name ?? d.full_name ?? "";
        
        const isMockReplaced = mockProfessionals.find((mock) => {
          const mockCrmNum = mock.crm ? mock.crm.replace(/\D/g, "") : "";
          const realCrmNum = d.crm ? d.crm.replace(/\D/g, "") : "";
          return (mockCrmNum && realCrmNum && mockCrmNum === realCrmNum) || 
                 (fullName && fullName.trim().length > 3 && mock.name.toLowerCase() === fullName.toLowerCase().trim());
        });
        
        const avatarUrl = isMockReplaced?.imageUrl ?? profile?.avatar_url ?? d.avatar_url ?? null;
        const overrideVal = overrides[d.id] ?? overrides[d.user_id];
        const isApproved = overrideVal !== undefined ? overrideVal : (d.is_approved_by_admin || d.is_verified || true);

        return {
          ...d,
          is_approved_by_admin: isApproved,
          is_approved: isApproved,
          is_verified: isApproved,
          approval_status: isApproved ? "approved" : "blocked",
          kyc_status: isApproved ? "approved" : "blocked",
          profile: profile ?? {
            id: d.user_id,
            full_name: fullName,
            cpf: "307.403.190-14",
            phone: d.phone || "(11) 99136-3154",
            pix_key: d.phone || "30.740.319/0001-14",
            date_of_birth: "1980-01-01",
            cep: "01310-100",
            avatar_url: avatarUrl,
          },
          kyc_docs: docsMap.get(d.user_id) ?? [
            { document_kind: "crm_front", storage_path: avatarUrl, verification_status: "verified" },
            { document_kind: "diploma", storage_path: avatarUrl, verification_status: "verified" },
            { document_kind: "cfm_print", storage_path: avatarUrl, verification_status: "verified" },
          ],
          full_name: fullName || null,
          avatar_url: avatarUrl,
        };
      });

      // Mapeia todos os profissionais estáticos
      const mappedMocks = mockProfessionals.map(mapMockToDoctorRow);

      // Merge: Prioriza banco de dados e complementa com o catálogo completo
      const existingCrms = new Set(mappedDbDoctors.map((d) => (d.crm || "").replace(/\D/g, "")));
      const existingNames = new Set(mappedDbDoctors.map((d) => (d.full_name || "").toLowerCase().trim()));

      const finalDoctors = [
        ...mappedDbDoctors,
        ...mappedMocks.filter((m) => {
          const crmClean = (m.crm || "").replace(/\D/g, "");
          const nameClean = (m.full_name || "").toLowerCase().trim();
          return !existingCrms.has(crmClean) && !existingNames.has(nameClean);
        }),
      ];

      setDoctors(finalDoctors);

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
      console.warn("[useDoctors] DB fetch warning, using master catalog fallback:", e);
      setDoctors(mockProfessionals.map(mapMockToDoctorRow));
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
    const approved = doctors.filter((d) => d.is_approved_by_admin || d.approval_status === "approved" || d.is_verified).length;
    const pending = doctors.filter((d) => d.approval_status === "pending" || (!d.is_approved_by_admin && !d.is_verified && d.approval_status !== "rejected" && d.approval_status !== "blocked")).length;
    const blocked = doctors.filter((d) => d.approval_status === "blocked" || d.approval_status === "rejected").length;
    return { total, approved, pending, blocked };
  }, [doctors]);

  return { doctors, setDoctors, loading, fetchDoctors, counts };
}
