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
}

function mapCategoryFromSpecialty(specialty: string | null): string {
  const value = (specialty ?? "").toLowerCase();
  if (value.includes("psicol") || value.includes("terap")) return "Psicologia & Terapias";
  if (value.includes("farm")) return "Farmácia Clínica";
  if (value.includes("ocupacional")) return "Saúde Ocupacional";
  if (value.includes("acupuntura")) return "Acupuntura";
  if (value.includes("jardin") || value.includes("cultiv")) return "Jardineiros & Cultivo";
  if (value.includes("aux") && value.includes("enf")) return "Aux. de Enfermagem";
  if (value.includes("téc") && value.includes("enf")) return "Téc. Enfermagem";
  if (value.includes("cuidador")) return "Cuidadores de Idosos";
  if (value.includes("enferma")) return "Enfermagem";
  return "Médicos Prescritores";
}

function formatPrice(value: number, country?: string | null): string {
  const prefix = country === "BO" ? "US$" : "R$";
  return `${prefix} ${value.toFixed(2).replace(".", ",")}`;
}

function initials(name: string): string {
  return name.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "PR";
}

export function useRealProfessionals(): { professionals: Professional[]; realCount: number; loading: boolean } {
  const [doctors, setDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchDoctors = async () => {
      try {
        const { data, error } = await supabase.from("doctors_public" as never).select("*");
        if (error) throw error;
        if (active) setDoctors((data ?? []) as DoctorRow[]);
      } catch (error) {
        console.error("[useRealProfessionals] Error:", error);
        if (active) setDoctors([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchDoctors();
    const poll = window.setInterval(fetchDoctors, 20_000);
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
    const priceValue = Number(doctor.consultation_price ?? 0);
    const countryName = doctor.country === "BO" ? "Bolívia" : "Brasil";
    const location = [doctor.city, countryName].filter(Boolean).join(", ");
    const document = doctor.document_type === "ci"
      ? `CI ${doctor.crm}`
      : `CRM ${doctor.crm}${doctor.crm_state ? `/${doctor.crm_state}` : ""}`;

    return {
      id: `real-${doctor.id}`,
      dbId: doctor.id,
      name,
      category: mapCategoryFromSpecialty(doctor.specialty),
      bio: doctor.bio ?? "Profissional verificado na Planta y Raiz.",
      experience: doctor.is_verified ? "Verificado" : "Cadastro em análise",
      tags: [doctor.specialty, document, location].filter((value): value is string => Boolean(value)),
      price: formatPrice(priceValue, doctor.country),
      priceValue,
      whatsapp: "",
      rating: doctor.rating,
      consults: doctor.total_consultations ?? 0,
      avatar: initials(name),
      imageUrl: doctor.avatar_url ?? "",
      paymentLink: "",
      services: [],
      slots: [],
      reviews: [],
      online: Boolean(doctor.is_online && (doctor.is_available ?? true)),
      premiumPrice: doctor.price_video_chat ?? undefined,
      crm: document,
      hospital: location,
      flags: [doctor.country === "BO" ? "BO" : "BR"],
      plan_tier: doctor.plan_tier ?? "free",
    };
  }), [doctors]);

  return { professionals, realCount: doctors.length, loading };
}