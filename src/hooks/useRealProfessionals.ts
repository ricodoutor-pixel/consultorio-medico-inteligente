/**
 * Hook: useRealProfessionals
 * Fetches real registered doctors from the database.
 * For each real doctor registered, one test placeholder is removed from the list.
 * Dr. Edilson Bezerra (med-0) is NEVER removed.
 */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { professionals as testProfessionals, Professional, categories } from "@/data/professionals";

interface RealDoctor {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string;
  specialty: string;
  bio: string | null;
  consultation_price: number;
  rating: number | null;
  total_consultations: number | null;
  is_online: boolean;
  is_verified: boolean;
  pix_key: string | null;
  rqe: string | null;
  available_hours: any;
  created_at: string;
}

interface RealProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
}

function mapCategoryFromSpecialty(specialty: string): string {
  const lower = specialty.toLowerCase();
  if (lower.includes("psicol") || lower.includes("terap")) return "Psicologia & Terapias";
  if (lower.includes("farm")) return "Farmácia Clínica";
  if (lower.includes("ocupacional")) return "Saúde Ocupacional";
  if (lower.includes("acupuntura")) return "Acupuntura";
  if (lower.includes("jardin") || lower.includes("cultiv")) return "Jardineiros & Cultivo";
  if (lower.includes("aux") && lower.includes("enf")) return "Aux. de Enfermagem";
  if (lower.includes("téc") && lower.includes("enf")) return "Téc. Enfermagem";
  if (lower.includes("cuidador")) return "Cuidadores de Idosos";
  if (lower.includes("enferma")) return "Enfermagem";
  return "Médicos Prescritores";
}

export function useRealProfessionals(): { professionals: Professional[]; realCount: number; loading: boolean } {
  const [realDoctors, setRealDoctors] = useState<(RealDoctor & { profile?: RealProfile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReal = async () => {
      try {
        const { data: doctors } = await supabase
          .from("doctors")
          .select("*")
          .eq("is_verified", true);

        if (doctors && doctors.length > 0) {
          const userIds = doctors.map(d => d.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, phone")
            .in("id", userIds);

          const profileMap = new Map((profiles || []).map(p => [p.id, p]));

          setRealDoctors(doctors.map(d => ({
            ...d,
            profile: profileMap.get(d.user_id),
          })));
        }
      } catch (err) {
        console.error("[useRealProfessionals] Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReal();
  }, []);

  const merged = useMemo(() => {
    if (realDoctors.length === 0) return testProfessionals;

    const realPros: Professional[] = realDoctors.map((d) => ({
      id: `real-${d.id}`,
      name: d.profile?.full_name || `Dr(a). ${d.crm}`,
      category: mapCategoryFromSpecialty(d.specialty),
      bio: d.bio || `Profissional verificado na Planta & Raiz. Especialidade: ${d.specialty}. CRM ${d.crm}/${d.crm_state}.`,
      experience: "Verificado",
      tags: [d.specialty, `CRM ${d.crm_state}`],
      price: `R$ ${d.consultation_price.toFixed(2).replace(".", ",")}`,
      priceValue: d.consultation_price,
      whatsapp: "5511991363154",
      rating: d.rating || 5.0,
      consults: d.total_consultations || 0,
      avatar: (d.profile?.full_name || "PR").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      imageUrl: d.profile?.avatar_url || "",
      paymentLink: "https://mpago.la/12KAwmH",
      online: d.is_online,
      crm: `${d.crm} - ${d.crm_state}`,
      services: [
        { name: "Consulta Inicial", price: `R$ ${d.consultation_price.toFixed(2).replace(".", ",")}`, desc: "Avaliação completa + plano terapêutico" },
        { name: "Retorno", price: `R$ ${(d.consultation_price * 0.6).toFixed(2).replace(".", ",")}`, desc: "Acompanhamento e ajuste" },
      ],
      slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      reviews: [],
      flags: ["🇧🇷"],
    }));

    const testByCat: Record<string, Professional[]> = {};
    const edilson = testProfessionals.find(p => p.id === "med-0")!;

    for (const p of testProfessionals) {
      if (p.id === "med-0") continue;
      if (!testByCat[p.category]) testByCat[p.category] = [];
      testByCat[p.category].push(p);
    }

    const realByCat: Record<string, number> = {};
    for (const rp of realPros) {
      realByCat[rp.category] = (realByCat[rp.category] || 0) + 1;
    }

    const remainingTest: Professional[] = [];
    for (const cat of categories) {
      const tests = testByCat[cat] || [];
      const realInCat = realByCat[cat] || 0;
      const keep = Math.max(0, tests.length - realInCat);
      remainingTest.push(...tests.slice(0, keep));
    }

    return [edilson, ...realPros, ...remainingTest];
  }, [realDoctors]);

  return { professionals: merged, realCount: realDoctors.length, loading };
}
