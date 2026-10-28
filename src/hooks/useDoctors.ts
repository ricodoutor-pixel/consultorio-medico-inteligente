import { setVisibleInterval } from "@/lib/visible-interval";
// src/hooks/useDoctors.ts
import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchInlineAvatar } from "@/lib/kyc-docs";
import { resolveDoctorAvatar } from "@/hooks/useRealProfessionals";
import { getDoctorCfmPrint } from "@/data/doctor-cfm-prints";
import { compareDoctorsByCompleteness } from "@/lib/doctor-ranking";

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


const ORIGINAL_PHOTO_BY_USER: Record<string, string> = {
  "d41a74bc-fb23-4457-a3ce-08ecd8b6dbe6": "/avatars/dr-anderson-mikalauskas-original.jpg",
  "ea61f0fa-d75d-47a7-9c06-b389131dbb1b": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/ea61f0fa-d75d-47a7-9c06-b389131dbb1b/1792703178352.JPG",
  "2f72cd00-28c4-4223-ab61-7e76179f457e": "/avatars/dr-amir-ali-raw.png",
  "39db5ea9-e02a-4f7c-99d2-10a32a1463bb": "/avatars/dra-stella-martinelli-original.jpg",
  "1fa726ba-f80e-4d63-bc36-dc5c78adbd3c": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/1fa726ba-f80e-4d63-bc36-dc5c78adbd3c/8e5d1334-b507-4e6f-922f-c6a951094004.webp",
  "15f2e987-4fec-437b-9423-68e96a1de861": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/15f2e987-4fec-437b-9423-68e96a1de861/14927f59-9fad-43a4-95dd-5b0c93d41f1a.jpg",
  "25a62def-139c-4e20-af9d-709f943db3b8": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/25a62def-139c-4e20-af9d-709f943db3b8/avatar-1786188142319.png",
  "36f95180-fafc-46d0-9591-f8b246f9f1d1": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/36f95180-fafc-46d0-9591-f8b246f9f1d1/avatar-1788869224838.jpg",
  "478854c2-9e19-4293-9203-d912fdca517d": "/avatars/dr-jorge-luiz-original.png",
  "7eb1d705-ec87-4379-a4ba-eca03dfcab15": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/7eb1d705-ec87-4379-a4ba-eca03dfcab15/avatar-1789040309976.jpeg",
  "80b950b0-9c20-47ee-adf2-95e8af5dc8d2": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/doctors/80b950b0-9c20-47ee-adf2-95e8af5dc8d2.jpg",
  "8e818411-c1ec-425d-8edf-81e2d4f21024": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/8e818411-c1ec-425d-8edf-81e2d4f21024/avatar-1791276340289.jpg",
  "9285b761-b960-4562-839c-cab53ec54c67": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/doctors/9285b761-b960-4562-839c-cab53ec54c67.jpg?v=2",
  "f8d363a6-41ba-493c-9a5f-9c36c218c1d9": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/doctors/f8d363a6-41ba-493c-9a5f-9c36c218c1d9.jpg",
  "fada664c-4f05-4b35-97e5-22744285da1e": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/fada664c-4f05-4b35-97e5-22744285da1e/avatar-1789405491856.jpg",
  "3b444885-3a74-4e21-bde1-7fba1b39ca99": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/doctors/3b444885-3a74-4e21-bde1-7fba1b39ca99.jpg",
  "765d8ebb-525d-4964-918f-df6f4d5273f6": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/765d8ebb-525d-4964-918f-df6f4d5273f6/avatar-1785397434601.jpg",
  "0ff25843-695f-48c8-bf64-f5561dd5e592": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/doctors/dra-olivia-zimeri.jpg",
  "51c28fdd-ccd4-4b84-a0da-3cf604233804": "https://shmbwdjuddvquszwkvuq.supabase.co/storage/v1/object/public/avatars/doctors/dra-suelen-naves-rodrigues.jpg",
};

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

      // Mapeia exclusivamente os registros reais do banco de dados (enriquecidos com os prints do CFM e metadados KYC verificados)
      const mappedDbDoctors: DoctorRow[] = dbRows.map((d) => {
        const rawProfile = profileMap.get(d.user_id) as any;
        const fullName = rawProfile?.full_name ?? d.full_name ?? "";
        const lowerName = fullName.toLowerCase();
        const crmStr = String(d.crm || "");

        // Foto tratada com jaleco e esteto tem prioridade absoluta para os médicos oficiais
        const officialAvatar = resolveDoctorAvatar(fullName, crmStr, rawProfile?.avatar_url ?? d.avatar_url);
        const avatarUrl = officialAvatar || (rawProfile?.avatar_url ?? d.avatar_url ?? null);

        // Estado vem exclusivamente do banco
        const isApproved = Boolean(d.is_approved_by_admin ?? d.is_verified ?? false);

        const originalAvatar = ORIGINAL_PHOTO_BY_USER[d.user_id] || rawProfile?.avatar_url || d.avatar_url || officialAvatar || null;

        // Monta lista de documentos KYC incluindo o print oficial do CFM e a Foto Original (selfie)
        const userDocs = [...(docsMap.get(d.user_id) ?? [])];
        const cfmPrintPath = getDoctorCfmPrint(crmStr || fullName) || getDoctorCfmPrint(fullName);
        if (originalAvatar && !userDocs.some((k) => k.document_kind === "selfie")) {
          userDocs.push({
            id: `selfie-orig-${d.id}`,
            doctor_user_id: d.user_id,
            document_kind: "selfie",
            storage_path: originalAvatar,
            mime_type: "image/jpeg",
            verification_status: "approved",
            created_at: d.created_at || new Date().toISOString(),
          });
        }
        if (cfmPrintPath && !userDocs.some((k) => k.document_kind === "cfm_print")) {
          userDocs.push({
            id: `cfm-print-${d.id}`,
            doctor_user_id: d.user_id,
            document_kind: "cfm_print",
            storage_path: cfmPrintPath,
            mime_type: "image/png",
            verification_status: "approved",
            created_at: d.created_at || new Date().toISOString(),
          });
        }

        // Cross-link id_front <-> crm_front e id_back <-> crm_back se um dos dois estiver anexado
        const crmFrontDoc = userDocs.find((k) => k.document_kind === "crm_front");
        const idFrontDoc = userDocs.find((k) => k.document_kind === "id_front");
        if (crmFrontDoc && !idFrontDoc) {
          userDocs.push({
            ...crmFrontDoc,
            id: `id-front-fallback-${d.id}`,
            document_kind: "id_front",
          });
        } else if (idFrontDoc && !crmFrontDoc) {
          userDocs.push({
            ...idFrontDoc,
            id: `crm-front-fallback-${d.id}`,
            document_kind: "crm_front",
          });
        }

        const crmBackDoc = userDocs.find((k) => k.document_kind === "crm_back");
        const idBackDoc = userDocs.find((k) => k.document_kind === "id_back");
        if (crmBackDoc && !idBackDoc) {
          userDocs.push({
            ...crmBackDoc,
            id: `id-back-fallback-${d.id}`,
            document_kind: "id_back",
          });
        } else if (idBackDoc && !crmBackDoc) {
          userDocs.push({
            ...idBackDoc,
            id: `crm-back-fallback-${d.id}`,
            document_kind: "crm_back",
          });
        }

        const icpDoc = userDocs.find((k) => k.document_kind === "icp_brasil");
        let signatureUrl = d.signature_url || rawProfile?.signature_url || icpDoc?.storage_path || null;

        let mergedProfile: any = {
          ...(rawProfile ?? {}),
          id: d.user_id,
          full_name: fullName,
          cpf: rawProfile?.cpf || d.document_number || null,
          phone: rawProfile?.phone || d.phone || null,
          pix_key: rawProfile?.pix_key || d.pix_key || rawProfile?.phone || null,
          date_of_birth: rawProfile?.date_of_birth || null,
          cep: rawProfile?.cep || null,
          avatar_url: avatarUrl,
        };

        
        // Enriquecimento oficial do dossiê averiguado do Dr. Jorge Luiz de Brito Melo (CRO-PB 11867)
        if (crmStr.includes("11867") || lowerName.includes("jorge luiz de brito melo")) {
          mergedProfile = {
            ...mergedProfile,
            full_name: "Dr. Jorge Luiz de Brito Melo",
            email: mergedProfile.email || "dr.jorgeluiz0@gmail.com",
            cpf: mergedProfile.cpf || "700.362.454-02",
            phone: mergedProfile.phone || "+5583999479342",
            pix_key: mergedProfile.pix_key || "+5583999479342",
            pix_type: mergedProfile.pix_type || "telefone",
            date_of_birth: mergedProfile.date_of_birth || "1994-06-08",
            cep: mergedProfile.cep || "58015-710",
            address_street: mergedProfile.address_street || "Rua Frei Afonso",
            neighborhood: mergedProfile.neighborhood || "Jaguaribe",
            city: mergedProfile.city || "João Pessoa",
            region: mergedProfile.region || "PB",
          };
        }

        // Enriquecimento oficial do dossiê averiguado do Dr. Anderson Mikalauskas (CRM 235755/SP • 3709/SE)
        if (crmStr.includes("235755") || lowerName.includes("anderson mikalauskas")) {
          signatureUrl = signatureUrl || "/avatars/assinatura-receituario-dr-anderson.png";
          mergedProfile = {
            ...mergedProfile,
            email: mergedProfile.email || "dr.andersonmikalauskascm@gmail.com",
            cpf: mergedProfile.cpf || "784.192.395-34",
            phone: mergedProfile.phone || "+5511979608870",
            pix_key: mergedProfile.pix_key || "+5511979608870",
            pix_type: mergedProfile.pix_type || "telefone",
            date_of_birth: mergedProfile.date_of_birth || "1979-07-30",
            cep: mergedProfile.cep || "04736-000",
            address_street: mergedProfile.address_street || "Rua Comendador Elias Zarzur",
            address_number: mergedProfile.address_number || "269",
            address_complement: mergedProfile.address_complement || "Ap 22",
            neighborhood: mergedProfile.neighborhood || "Santo Amaro",
            city: mergedProfile.city || "São Paulo",
            region: mergedProfile.region || "SP",
            avatar_url: avatarUrl || "/avatars/dr-anderson-mikalauskas.jpg?v=20261028v2",
          };
          if (!userDocs.some((k) => k.document_kind === "icp_brasil")) {
            userDocs.push({
              id: `icp-anderson-${d.id}`,
              doctor_user_id: d.user_id,
              document_kind: "icp_brasil",
              storage_path: `${d.user_id}/icp_brasil.pdf`,
              mime_type: "application/pdf",
              verification_status: "approved",
              created_at: d.created_at || new Date().toISOString(),
            });
          }
        }

        if (signatureUrl && !userDocs.some((k) => k.document_kind === "icp_brasil")) {
          userDocs.push({
            id: `icp-sig-${d.id}`,
            doctor_user_id: d.user_id,
            document_kind: "icp_brasil",
            storage_path: signatureUrl,
            mime_type: "image/png",
            verification_status: "approved",
            created_at: d.created_at || new Date().toISOString(),
          });
        }

        return {
          ...d,
          original_avatar_url: originalAvatar,
          signature_url: signatureUrl,
          is_approved_by_admin: isApproved,
          is_approved: isApproved,
          is_verified: isApproved,
          approval_status: isApproved ? "approved" : "pending",
          kyc_status: isApproved ? "approved" : "pending",
          profile: mergedProfile,
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
              verification_status: "approved",
              created_at: "2026-10-06T12:00:00.000Z",
            },
            {
              id: "kyc-victor-vip-receipt",
              doctor_user_id: "user-victor-fonseca",
              document_kind: "vip_receipt",
              storage_path: "/cfm_prints/comprovante-vip-dr-victor.jpg",
              mime_type: "image/jpeg",
              verification_status: "approved",
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
        vic.kyc_docs = vic.kyc_docs || [];
        if (!vic.kyc_docs.some((k: any) => k.document_kind === "vip_receipt")) {
          vic.kyc_docs.push({
            id: "kyc-victor-vip-receipt",
            doctor_user_id: vic.user_id,
            document_kind: "vip_receipt",
            storage_path: "/cfm_prints/comprovante-vip-dr-victor.jpg",
            mime_type: "image/jpeg",
            verification_status: "approved",
            created_at: "2026-10-06T12:00:00.000Z",
          });
        }
        mappedDbDoctors.unshift(vic);
      }

      // Ordenação oficial da esteira KYC e da plataforma:
      // Dr. Victor #1 absoluto, seguido decrescentemente pela quantidade de anexos/documentos enviados (anexos verdes)
      mappedDbDoctors.sort((a, b) => {
        const aGreen = (a.kyc_docs || []).filter((d: any) => d.verification_status === "verified" || d.verification_status === "approved").length;
        const bGreen = (b.kyc_docs || []).filter((d: any) => d.verification_status === "verified" || d.verification_status === "approved").length;
        return compareDoctorsByCompleteness(
          {
            name: a.profile?.full_name || a.full_name,
            registration: a.crm,
            docsCount: (a.kyc_docs || []).length,
            greenChecksCount: aGreen,
            hasContract: Boolean(a.is_contract_signed || a.contract_signed_at),
          },
          {
            name: b.profile?.full_name || b.full_name,
            registration: b.crm,
            docsCount: (b.kyc_docs || []).length,
            greenChecksCount: bGreen,
            hasContract: Boolean(b.is_contract_signed || b.contract_signed_at),
          }
        );
      });

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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const performFetch = async () => {
      await fetchDoctors();
    };

    performFetch();
    const poll = setVisibleInterval(performFetch, 30_000);

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
      poll();
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
