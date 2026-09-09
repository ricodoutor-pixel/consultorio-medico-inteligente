import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Professional } from "@/types/professional";

interface DoctorRow {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string | null;
  specialty: string | null;
  bio: string | null;
  consultation_price: number | null;
  price_video_chat?: number | null;
  rating: number | null;
  total_consultations: number | null;
  is_online: boolean | null;
  is_verified: boolean | null;
  document_type: string | null;
  country?: string | null;
  city?: string | null;
  is_available?: boolean | null;
  rqe: string | null;
  plan_tier: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  council_type?: string | null;
  council_number?: string | null;
}

function mapCategoryFromSpecialty(specialty: string | null): string {
  const value = (specialty ?? "").toLowerCase();
  if (value.includes("veterin")) return "Médico Veterinário Prescritor";
  if (value.includes("dentist") || value.includes("odonto")) return "Dentista Prescritor";
  if (value.includes("psicol") || value.includes("terap")) return "Psicologia & Terapias";
  if (value.includes("farm")) return "Farmácia Clínica";
  if (value.includes("ocupacional")) return "Saúde Ocupacional";
  if (value.includes("acupuntura")) return "Acupuntura";
  if (value.includes("jardin") || value.includes("cultiv")) return "Jardineiros & Cultivo";
  if (value.includes("aux") && value.includes("enf")) return "Aux. de Enfermagem";
  if (value.includes("téc") && value.includes("enf")) return "Téc. Enfermagem";
  if (value.includes("cuidador")) return "Cuidadores de Idosos";
  if (value.includes("enferma")) return "Enfermagem";
  if (value.includes("integrativa")) return "Medicina Integrativa";
  return "Médicos Prescritores";
}

function formatPrice(value: number, country?: string | null): string {
  const prefix = country === "BO" ? "US$" : "R$";
  return `${prefix} ${value.toFixed(2).replace(".", ",")}`;
}

function initials(name: string): string {
  return name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "PR";
}

// Mapeamento automático de fotos locais disponíveis em /avatars/
function resolveDoctorAvatar(name: string, crm: string, currentAvatar?: string | null): string {
  if (currentAvatar && currentAvatar.trim() !== "") {
    return currentAvatar;
  }
  const n = name.toLowerCase();
  if (n.includes("edilson") || crm === "10963") return "/avatars/dr-edilson-bezerra.jpg";
  if (n.includes("suelen") || crm.includes("49354")) return "/avatars/dra-suelen-naves.jpg";
  if (n.includes("olivia") || crm.includes("4466260")) return "/avatars/dra-olivia-zimeri-pro.jpg";
  if (n.includes("geraldo")) return "/avatars/dr-jose-geraldo.jpg";
  if (n.includes("detoni") || n.includes("girardello")) return "/avatars/dr-joao-pedro-detoni.jpg";
  if (n.includes("gustavo") && (n.includes("damiani") || n.includes("nobre"))) return "/avatars/dr-gustavo-nobre.jpg";
  if (n.includes("gustavo") && n.includes("simoes")) return "/avatars/dr-gustavo-simoes.jpg";
  if (n.includes("marianna") || n.includes("arzamendia")) return "/avatars/dra-marianna-arzamendia.jpg";
  if (n.includes("ana paula")) return "/avatars/dra-ana-paula-ferreira.jpg";
  if (n.includes("adeonis")) return "/avatars/dr-adeonis-oliveira.jpg";
  if (n.includes("albert")) return "/avatars/dr-albert-machado.jpg";
  if (n.includes("alexandre") && n.includes("stramandinoli")) return "/avatars/dr-alexandre-stramandinoli.jpg";
  if (n.includes("daniel") && n.includes("kobayashi")) return "/avatars/dr-daniel-kobayashi.jpg";
  if (n.includes("guilherme") && n.includes("campos")) return "/avatars/dr-guilherme-campos.jpg";
  if (n.includes("jose roberto") || n.includes("coutinho")) return "/avatars/dr-jose-roberto.jpg";
  if (n.includes("angela beatriz")) return "/avatars/dra-angela-beatriz.jpg";
  if (n.includes("ingrid") && n.includes("chiullo")) return "/avatars/dra-ingrid-chiullo.jpg";
  if (n.includes("eduardo") && n.includes("correa")) return "/avatars/dr-eduardo-correa.jpg";
  if (n.includes("fernando") && n.includes("ribeiro")) return "/avatars/dr-fernando-ribeiro.jpg";
  if (n.includes("henrique") && n.includes("almeida")) return "/avatars/dr-henrique-almeida.jpg";
  if (n.includes("mateo") && n.includes("lopez")) return "/avatars/dr-mateo-lopez.jpg";
  if (n.includes("pablo") && n.includes("quispe")) return "/avatars/dr-pablo-quispe.jpg";
  if (n.includes("tiago") && n.includes("barros")) return "/avatars/dr-tiago-barros.jpg";
  if (n.includes("amanda") && n.includes("lima")) return "/avatars/dra-amanda-lima.jpg";
  if (n.includes("bianca") && n.includes("martins")) return "/avatars/dra-bianca-martins.jpg";
  if (n.includes("carolina") && n.includes("vasconcelos")) return "/avatars/dra-carolina-vasconcelos.jpg";
  if (n.includes("isabela") && n.includes("nogueira")) return "/avatars/dra-isabela-nogueira.jpg";
  if (n.includes("natalia") && n.includes("souza")) return "/avatars/dra-natalia-souza.jpg";
  if (n.includes("renata") && n.includes("costa")) return "/avatars/dra-renata-costa.jpg";
  if (n.includes("yuki") && n.includes("tanaka")) return "/avatars/dra-yuki-tanaka.jpg";
  return "";
}

function buildServices(doctor: DoctorRow, isEdilson: boolean, isSuelen: boolean, isOlivia: boolean) {
  const priceStr = formatPrice(Number(doctor.consultation_price) || 30, doctor.country);

  if (isEdilson) {
    return [
      { name: "Orientação Técnica + Relatório de Encaminhamento (Chat 30 min)", price: "R$ 30,00", desc: "Com relatório completo assinado digitalmente (Brasil)" },
      { name: "Orientação Técnica Completa (Chat + Vídeo)", price: "R$ 100,00", desc: "Avaliação por vídeo e relatório completo" },
      { name: "Consulta Prescritiva Internacional (Bolívia)", price: "US$ 50,00", desc: "Com receita e assinatura digital (Santa Cruz - BO)" },
      { name: "Retorno", price: "R$ 30,00", desc: "Acompanhamento" },
    ];
  }

  if (isSuelen) {
    return [
      { name: "Orientação Inicial via Chat", price: "R$ 100,00", desc: "Avaliação inicial via chat seguro" },
      { name: "Orientação Completa (Chat + Vídeo)", price: "R$ 150,00", desc: "Avaliação completa com teleconsulta" },
      { name: "Retorno", price: "R$ 90,00", desc: "Acompanhamento" },
    ];
  }

  if (isOlivia) {
    return [
      { name: "Orientação Técnica + Mentoria Terapêutica (Chat 30 min)", price: "R$ 50,00", desc: "Com relatório completo assinado digitalmente (Brasil)" },
      { name: "Orientação Técnica Completa (Chat + Vídeo)", price: "R$ 100,00", desc: "Avaliação por vídeo e mentoria terapêutica" },
      { name: "Consulta Prescritiva Internacional (Bolívia)", price: "US$ 50,00", desc: "Com receita e assinatura digital (Cochabamba - BO)" },
      { name: "Retorno", price: "R$ 30,00", desc: "Acompanhamento" },
    ];
  }

  return [
    { name: "Orientação Técnica Inicial", price: priceStr, desc: "Avaliação completa + plano terapêutico individualizado" },
    { name: "Retorno", price: formatPrice((Number(doctor.consultation_price) || 30) * 0.6, doctor.country), desc: "Acompanhamento clínico e ajuste posológico" },
  ];
}

export function useRealProfessionals(): { professionals: Professional[]; realCount: number; loading: boolean } {
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchDoctors = async () => {
      try {
        const { data: publicDocs, error } = await supabase.from("doctors_public" as never).select("*");
        if (error) throw error;
        if (!active) return;

        const docs = (publicDocs ?? []) as DoctorRow[];
        const userIds = Array.from(new Set(docs.map((d) => d.user_id).filter(Boolean)));
        
        let profileMap = new Map<string, string>();
        if (userIds.length > 0) {
          try {
            const { data: profs } = await supabase
              .from("profiles")
              .select("id, avatar_url")
              .in("id", userIds);
            if (profs) {
              for (const p of profs) {
                if (p.avatar_url) profileMap.set(p.id, p.avatar_url);
              }
            }
          } catch (pErr) {
            console.warn("[useRealProfessionals] Fallback profiles fetch:", pErr);
          }
        }

        const mergedDocs = docs.map((doc) => ({
          ...doc,
          avatar_url: profileMap.get(doc.user_id) || doc.avatar_url || null,
        }));

        if (active) setDoctors(mergedDocs);
      } catch (error) {
        console.error("[useRealProfessionals] Error:", error);
        if (active) setDoctors([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchDoctors();
    const poll = window.setInterval(fetchDoctors, 30_000);
    const channel = supabase
      .channel("public:doctors-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "doctors" }, fetchDoctors)
      .subscribe();

    return () => {
      active = false;
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, []);

  const professionals = useMemo<Professional[]>(() => doctors.map((doctor) => {
    const name = doctor.full_name?.trim() || `Profissional ${doctor.crm}`;
    const priceValue = Number(doctor.consultation_price ?? 30) || 30;
    const isEdilson = (doctor.crm === "10963" || name.toLowerCase().includes("edilson")) && !name.toLowerCase().includes("suelen");
    const isSuelen = doctor.crm?.includes("49354") || name.toLowerCase().includes("suelen");
    const isOlivia = doctor.crm?.toLowerCase().includes("olivia") || doctor.crm?.toLowerCase().includes("z-") || name.toLowerCase().includes("olivia");

    const countryName = doctor.country === "BO" ? "Bolívia" : "Brasil";
    const location = [doctor.city, countryName].filter(Boolean).join(", ");
    const councilType = doctor.council_type || "CRM";
    const councilNum = doctor.council_number || doctor.crm || "";

    let document = "";
    if (isEdilson) {
      document = "CRM 10963 - Sta Cruz (BO)";
    } else if (isOlivia) {
      document = "CRM Z-4466260 - BO";
    } else if (isSuelen) {
      document = "CRM 49354/PR";
    } else if (doctor.document_type === "ci") {
      document = `CI ${councilNum}`;
    } else {
      const stateSuffix = doctor.crm_state && doctor.crm_state !== "BR" && !doctor.crm_state.includes("Sta-Cruz") ? `/${doctor.crm_state}` : "";
      document = `${councilType} ${councilNum}${stateSuffix}`;
    }

    const finalBio = isEdilson
      ? "CEO da Planta y Raíz Ltda e Médico Prescritor em Santa Cruz de la Sierra (Bolívia, Registro 10963). No Brasil, atua prestando Orientação Técnica exclusiva com Relatório de Encaminhamento Completo assinado digitalmente."
      : isSuelen
      ? "Supervisora Técnica da Planta y Raíz Ltda e Médica Prescritora com atendimento humanizado e individualizado. Prescrição de cannabis medicinal baseada em evidências científicas."
      : isOlivia
      ? "Diretora Técnica da Planta y Raíz para a Bolívia (Cochabamba) e Médica Prescritora em Cochabamba (Bolívia, Registro Z-4466260). No Brasil, atua prestando Orientação Técnica exclusiva e Mentoria Terapêutica."
      : (doctor.bio || `Profissional cadastrado na Planta & Raiz. Especialidade: ${doctor.specialty}.`);

    const finalAvatar = resolveDoctorAvatar(name, doctor.crm, doctor.avatar_url);

    return {
      id: `real-${doctor.id}`,
      dbId: doctor.id,
      name,
      category: mapCategoryFromSpecialty(doctor.specialty),
      bio: finalBio,
      experience: doctor.is_verified ? "Verificado" : "Cadastro em análise",
      tags: [doctor.specialty, document, location].filter((value): value is string => Boolean(value)),
      price: formatPrice(priceValue, doctor.country),
      priceValue,
      whatsapp: "5511991363154",
      rating: doctor.rating,
      consults: doctor.total_consultations ?? 0,
      avatar: initials(name),
      imageUrl: finalAvatar,
      paymentLink: "https://mpago.la/12KAwmH",
      services: buildServices(doctor, isEdilson, isSuelen, isOlivia),
      slots: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
      reviews: [],
      online: Boolean(doctor.is_online && (doctor.is_available ?? true)),
      premiumPrice: doctor.price_video_chat ?? undefined,
      crm: document,
      hospital: isEdilson ? "Planta y Raíz Ltda / Santa Cruz (BO)" : isSuelen ? "Planta y Raíz Ltda / Paraná (BR)" : isOlivia ? "Planta y Raíz Ltda / Cochabamba (BO)" : location,
      flags: isEdilson || isOlivia ? ["🇧🇷", "🇧🇴"] : ["🇧🇷"],
      plan_tier: doctor.plan_tier ?? "free",
    };
  }), [doctors]);

  return { professionals, realCount: doctors.length, loading };
}