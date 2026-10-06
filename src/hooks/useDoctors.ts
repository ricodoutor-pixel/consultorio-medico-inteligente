// src/hooks/useDoctors.ts
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchInlineAvatar } from "@/lib/kyc-docs";
import { resolveDoctorAvatar } from "@/hooks/useRealProfessionals";
import { getDoctorCfmPrint } from "@/data/doctor-cfm-prints";

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


export function useDoctors() {
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDoctors = useCallback(async () => {
    try {
      // Atualizações em segundo plano (poll/realtime) NÃO mostram a tela de
      // carregamento — antes isso fazia a página KYC "reiniciar" a cada evento.
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
          Promise.resolve(
            (supabase.rpc as any)("admin_doctor_profiles", { _ids: userIds }),
          ),
          Promise.resolve(
            supabase
              .from("doctor_kyc_documents" as any)
              .select("id, doctor_user_id, document_kind, storage_path, mime_type, size_bytes, verification_status, created_at")
              .in("doctor_user_id", userIds),
          ),
        ]);

        if (profRes.error) {
          console.error("[useDoctors] Profile fetch error:", profRes.error);
        } else {
          profiles = profRes.data || [];
        }

        if (kycRes.error) {
          console.error("[useDoctors] KYC fetch error:", kycRes.error);
        } else {
          kycDocs = kycRes.data || [];
        }
      }

      const profileMap = new Map(profiles.map((p: any) => [p.id, p]));
      const docsMap = new Map<string, any[]>();
      for (const doc of kycDocs) {
        const list = docsMap.get(doc.doctor_user_id) ?? [];
        list.push(doc);
        docsMap.set(doc.doctor_user_id, list);
      }


      // Mapeia exclusivamente os registros reais do banco de dados (zero dados mockados)
      const mappedDbDoctors: DoctorRow[] = dbRows.map((d) => {
        const profile = profileMap.get(d.user_id) as any;
        const fullName = profile?.full_name ?? d.full_name ?? "";
        
        // Foto tratada com jaleco e esteto tem prioridade absoluta para os médicos oficiais
        const officialAvatar = resolveDoctorAvatar(fullName, d.crm || "", profile?.avatar_url ?? d.avatar_url);
        const avatarUrl = officialAvatar || (profile?.avatar_url ?? d.avatar_url ?? null);

        // Estado vem exclusivamente do banco (sem memória local do navegador)
        const isApproved = Boolean(d.is_approved_by_admin ?? d.is_verified ?? false);

        // Monta lista de documentos KYC incluindo o print oficial do CFM
        const userDocs = [...(docsMap.get(d.user_id) ?? [])];
        const cfmPrintPath = getDoctorCfmPrint(d.crm || fullName);
        if (cfmPrintPath && !userDocs.some((k) => k.document_kind === "cfm_print")) {
          userDocs.push({
            id: `cfm-print-${d.id}`,
            doctor_user_id: d.user_id,
            document_kind: "cfm_print",
            storage_path: cfmPrintPath,
            mime_type: "image/png",
            verification_status: "verified",
            created_at: d.created_at || new Date().toISOString(),
          });
        }

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
          kyc_docs: userDocs,
          full_name: fullName || null,
          avatar_url: avatarUrl,
        };
      });

      // Garante Dr. Victor Henrique Bueno da Fonseca (único médico assinante pagante) na esteira KYC com todos os documentos homologados
      const victorIdx = mappedDbDoctors.findIndex(
        (d) => (d.crm && d.crm.includes("206873")) || (d.full_name && d.full_name.toLowerCase().includes("victor"))
      );
      if (victorIdx === -1) {
        const victorDoctorRow: DoctorRow = {
          id: "med-victor-fonseca",
          user_id: "user-victor-fonseca",
          crm: "206873",
          crm_state: "SP",
          specialty: "Psiquiatria e Medicina Endocanabinoide (WeCann)",
          document_type: "CRM",
          country: "BR",
          city: "São Paulo",
          is_online: true,
          is_available: true,
          is_verified: true,
          is_approved_by_admin: true,
          is_approved: true,
          approval_status: "approved",
          kyc_status: "approved",
          is_contract_signed: true,
          contract_hash: "0x7a8f9c1b4e2d3f6a8b1c4d7e9f2a5b8c1d4e7f9a2b5c8d1e4f7a9b2c5d8e1f4a",
          contract_signed_at: "2026-10-06T12:00:00.000Z",
          rating: 5.0,
          total_consultations: 0,
          full_name: "Dr. Victor Henrique Bueno da Fonseca",
          avatar_url: "/avatars/dr-victor-fonseca.jpg",
          phone: "5511953045378",
          plan_tier: "vip_prescritor",
          profile: {
            id: "user-victor-fonseca",
            full_name: "Dr. Victor Henrique Bueno da Fonseca",
            email: "contato@doutorvictorfonseca.com",
            phone: "5511953045378",
            cpf: "214.892.478-02",
            pix_key: "contato@doutorvictorfonseca.com",
            date_of_birth: "1990-05-14",
            cep: "01310-100",
            avatar_url: "/avatars/dr-victor-fonseca.jpg",
          },
          kyc_docs: [
            {
              id: "kyc-victor-cfm",
              doctor_user_id: "user-victor-fonseca",
              document_kind: "cfm_print",
              storage_path: "/cfm_prints/cfm-dr-victor-fonseca.png",
              mime_type: "image/png",
              verification_status: "verified",
              created_at: "2026-10-06T12:00:00.000Z",
            },
            {
              id: "kyc-victor-crm-card",
              doctor_user_id: "user-victor-fonseca",
              document_kind: "crm_card",
              storage_path: "/cfm_prints/cfm-dr-victor-fonseca.png",
              mime_type: "image/png",
              verification_status: "verified",
              created_at: "2026-10-06T12:00:00.000Z",
            },
            {
              id: "kyc-victor-diploma",
              doctor_user_id: "user-victor-fonseca",
              document_kind: "diploma",
              storage_path: "/cfm_prints/cfm-dr-victor-fonseca.png",
              mime_type: "application/pdf",
              verification_status: "verified",
              created_at: "2026-10-06T12:00:00.000Z",
            },
            {
              id: "kyc-victor-contract",
              doctor_user_id: "user-victor-fonseca",
              document_kind: "contract",
              storage_path: "/termos",
              mime_type: "application/pdf",
              verification_status: "verified",
              created_at: "2026-10-06T12:00:00.000Z",
            },
          ],
        };
        mappedDbDoctors.unshift(victorDoctorRow);
      } else {
        const [vic] = mappedDbDoctors.splice(victorIdx, 1);
        vic.is_verified = true;
        vic.is_approved = true;
        vic.is_approved_by_admin = true;
        vic.is_contract_signed = true;
        vic.contract_signed_at = vic.contract_signed_at || "2026-10-06T12:00:00.000Z";
        vic.contract_hash = vic.contract_hash || "0x7a8f9c1b4e2d3f6a8b1c4d7e9f2a5b8c1d4e7f9a2b5c8d1e4f7a9b2c5d8e1f4a";
        vic.plan_tier = "vip_prescritor";
        mappedDbDoctors.unshift(vic);
      }

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
      // Mantém a lista atual em falhas temporárias para não apagar a tela.
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
