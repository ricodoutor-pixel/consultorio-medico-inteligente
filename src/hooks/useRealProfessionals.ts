/**
 * Hook: useRealProfessionals
 * Fetches real registered doctors from the database.
 * Limits test professionals to 6 + Dr. Edilson (med-0) = 7 total.
 * Rotates online status hourly among test doctors. Edilson is ALWAYS online.
 * Real doctors replace test placeholders.
 */
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { professionals as testProfessionals, Professional, categories } from "@/data/professionals";

// IDs of the 6 test doctors to keep (diverse specialties)
const KEPT_TEST_IDS = ["med-1", "med-2", "med-3", "med-4", "med-5", "psi-1"];
const MAX_TEST_SLOTS = 6;

interface RealDoctor {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string;
  specialty: string;
  bio: string | null;
  orientação técnication_price: number;
  rating: number | null;
  total_orientação técnications: number | null;
  is_online: boolean;
  is_verified: boolean;
  document_type: string;
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

/**
 * Returns the index (0-5) of the test doctor that should be "online" this hour.
 * Rotates every hour based on UTC time.
 */
function getOnlineShiftIndex(): number {
  const now = new Date();
  const hour = now.getHours();
  return hour % MAX_TEST_SLOTS;
}

export function useRealProfessionals(): { professionals: Professional[]; realCount: number; loading: boolean } {
  const [realDoctors, setRealDoctors] = useState<(RealDoctor & { profile?: RealProfile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());

  // Update shift every minute to catch hour changes
  useEffect(() => {
    const interval = setInterval(() => {
      const h = new Date().getHours();
      setCurrentHour(prev => prev !== h ? h : prev);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchReal = async () => {
      try {
        const { data: doctors } = await supabase
          .from("doctors_public" as any)
          .select("*") as { data: RealDoctor[] | null };

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
    const edilson = testProfessionals.find(p => p.id === "med-0")!;
    const edilsonOnline = { ...edilson, online: true };

    // Build real professionals list
    const realPros: Professional[] = realDoctors.map((d) => ({
      id: `real-${d.id}`,
      name: d.profile?.full_name || `Dr(a). ${d.crm}`,
      category: mapCategoryFromSpecialty(d.specialty),
      bio: d.bio || `Profissional verificado na Planta & Raiz. Especialidade: ${d.specialty}. CRM ${d.crm}/${d.crm_state}.`,
      experience: "Verificado",
      tags: [d.specialty, `CRM ${d.crm_state}`],
      price: `R$ ${d.orientação técnication_price.toFixed(2).replace(".", ",")}`,
      priceValue: d.orientação técnication_price,
      whatsapp: "5511991363154",
      rating: d.rating || 5.0,
      consults: d.total_orientação técnications || 0,
      avatar: (d.profile?.full_name || "PR").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase(),
      imageUrl: d.profile?.avatar_url || "",
      paymentLink: "https://mpago.la/12KAwmH",
      online: d.is_online,
      crm: `${d.crm} - ${d.crm_state}`,
      services: [
        { name: "Orientação Técnica Inicial", price: `R$ ${d.orientação técnication_price.toFixed(2).replace(".", ",")}`, desc: "Avaliação completa + plano terapêutico" },
        { name: "Retorno", price: `R$ ${(d.orientação técnication_price * 0.6).toFixed(2).replace(".", ",")}`, desc: "Acompanhamento e ajuste" },
      ],
      slots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
      reviews: [],
      flags: ["🇧🇷"],
    }));

    // How many test slots remain after real doctors fill spots
    const testSlotsRemaining = Math.max(0, MAX_TEST_SLOTS - realPros.length);

    // Get the 6 curated test doctors
    const keptTests = KEPT_TEST_IDS
      .map(id => testProfessionals.find(p => p.id === id))
      .filter(Boolean) as Professional[];

    // Only keep enough to fill remaining slots
    const finalTests = keptTests.slice(0, testSlotsRemaining);

    // Apply hourly online rotation
    const shiftIndex = getOnlineShiftIndex();
    const rotatedTests = finalTests.map((p, i) => ({
      ...p,
      online: i === (shiftIndex % finalTests.length),
    }));

    return [edilsonOnline, ...realPros, ...rotatedTests];
  }, [realDoctors, currentHour]);

  return { professionals: merged, realCount: realDoctors.length, loading };
}
