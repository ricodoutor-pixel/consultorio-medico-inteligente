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
// med-5 (Dra. Valentina Reyes) removido — substituído pela Dra. Olivia Zimeri (real, BO)
// IDs of test doctors to keep — med-3 (Dr. João Pedro Girardello) is prioritized first
const KEPT_TEST_IDS = ["med-3", "med-1", "med-2", "psi-1"];
const MAX_TEST_SLOTS = 10;

interface RealDoctor {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string;
  specialty: string;
  bio: string | null;
  consultation_price: number;
  price_video_chat?: number | null;
  rating: number | null;
  total_consultations: number | null;
  is_online: boolean;
  is_verified: boolean;
  document_type: string;
  country?: string | null;
  city?: string | null;
  is_available?: boolean | null;
  rqe: string | null;
  available_hours: any;
  created_at: string;
}

interface RealProfile {
  id: string;
  full_name: string | null;
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

function formatConsultationPrice(value: number, country?: string | null): string {
  const normalized = Number.isFinite(value) ? value : 30;
  const prefix = country === "BO" ? "US$" : "R$";
  return `${prefix} ${normalized.toFixed(2).replace(".", ",")}`;
}

function flagForCountry(country?: string | null): string[] {
  if (country === "BO") return ["🇧🇴"];
  if (country === "BR") return ["🇧🇷"];
  return ["🇧🇷"];
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
  const [mockTrigger, setMockTrigger] = useState(0);

  // Update shift every minute to catch hour changes
  useEffect(() => {
    const interval = setInterval(() => {
      const h = new Date().getHours();
      setCurrentHour(prev => prev !== h ? h : prev);
    }, 60_000);
    
    const handleMockChange = () => setMockTrigger(t => t + 1);
    window.addEventListener("mock_online_changed", handleMockChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("mock_online_changed", handleMockChange);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const fetchReal = async () => {
      try {
        const { data: doctors } = await supabase
          .from("doctors_public" as any)
          .select("*") as { data: (RealDoctor & { full_name?: string | null; avatar_url?: string | null })[] | null };

        if (!active) return;
        if (doctors) {
          setRealDoctors(doctors.map((d: any) => ({
            ...d,
            profile: {
              id: d.user_id,
              full_name: d.full_name ?? null,
              avatar_url: d.avatar_url ?? null,
              phone: null,
            },
          })));
        }
      } catch (err) {
        console.error("[useRealProfessionals] Error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchReal();

    // Fallback: revalida a cada 20s caso o realtime falhe
    const poll = setInterval(fetchReal, 20_000);

    const channel = supabase
      .channel("public:doctors-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "doctors" },
        (payload: any) => {
          const row = payload.new ?? payload.old;
          if (!row?.id) return;
          setRealDoctors((prev) => {
            const exists = prev.some((d) => d.id === row.id);
            if (!exists) {
              // médico novo/recém-verificado → recarrega a view completa
              fetchReal();
              return prev;
            }
            return prev.map((d) =>
              d.id === row.id
                ? { ...d, is_online: payload.new?.is_online ?? d.is_online, is_available: payload.new?.is_available ?? d.is_available }
                : d
            );
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, []);


  const merged = useMemo(() => {
    // Build real professionals list directly from DB
    const realPros: Professional[] = realDoctors.map((d) => {
      const fullName = d.profile?.full_name || `Dr(a). ${d.crm}`;
      const countryLabel = d.country === "BO" ? "Bolívia" : "Brasil";
      const cityLabel = d.city ? `${d.city}, ${countryLabel}` : countryLabel;
      const price = formatConsultationPrice(Number(d.consultation_price), d.country);
      const documentLabel = d.document_type === "ci" ? "CI Bolívia" : `CRM ${d.crm_state}`;
      const mockMatch = testProfessionals.find(p => p.crm === d.crm || (p.name && d.profile?.full_name && p.name.toLowerCase().includes(d.profile.full_name.toLowerCase())));
      const finalImage = d.profile?.avatar_url || mockMatch?.imageUrl || "";

      const isEdilson = (d.id === "8b32a5f6-0fce-4c33-a245-2c655764c011" || fullName.toLowerCase().includes("edilson")) && !fullName.toLowerCase().includes("suelen");
      const isSuelen = fullName.toLowerCase().includes("suelen") || d.crm?.includes("49354");
      const isOlivia = fullName.toLowerCase().includes("olivia") || d.crm?.includes("Z-494444");

      const finalCrm = isEdilson 
        ? "10963 - Sta Cruz (BO)" 
        : isSuelen
        ? "49354 - PR"
        : isOlivia
        ? "Z-494444 - BO"
        : (d.document_type === "ci" ? `${d.crm} - BO` : `${d.crm} - ${d.crm_state}`);

      const finalBio = isEdilson
        ? "CEO da Planta y Raíz Ltda e Médico Prescritor em Santa Cruz de la Sierra (Bolívia, Registro 10963). No Brasil, atua prestando Orientação Técnica exclusiva com Relatório de Encaminhamento Completo assinado digitalmente, para que o paciente dê continuidade ao seu atendimento com prescritor referendado."
        : isSuelen
        ? "Diretora Técnica da Planta y Raíz Ltda. Médica Prescritora com atendimento humanizado e individualizado de cannabis medicinal baseado em evidências científicas, com foco na qualidade de vida e cuidado integral."
        : isOlivia
        ? "Diretora Técnica da Planta y Raíz para a Bolívia (Cochabamba) e Médica Prescritora em Cochabamba (Bolívia, Registro Z-494444). No Brasil, atua prestando Orientação Técnica exclusiva, Mentoria Terapêutica e Relatório de Encaminhamento Completo assinado digitalmente, para que o paciente dê continuidade ao seu atendimento com prescritor referendado."
        : (d.bio || `Profissional verificado na Planta & Raiz. Especialidade: ${d.specialty}. ${documentLabel}.`);

      const finalTags = isEdilson
        ? ["CEO Planta y Raíz", "Orientação Técnica (BR)", "Prescritor Sta Cruz (BO)"]
        : isSuelen
        ? ["Diretora Técnica", "CRM 49354 - PR", "Cannabis Medicinal"]
        : isOlivia
        ? ["Diretora Técnica (BO)", "Orientação Técnica (BR)", "Prescritor Cochabamba (BO)"]
        : [d.specialty, documentLabel, cityLabel];

      return {
        id: `real-${d.id}`,
        dbId: d.id,
        premiumPrice: Number(d.price_video_chat) || undefined,
        name: fullName,
        category: mapCategoryFromSpecialty(d.specialty),
        bio: finalBio,
        experience: "Verificado",
        tags: finalTags,
        price: isEdilson ? "R$ 30,00" : isSuelen ? "R$ 100,00" : isOlivia ? "R$ 50,00" : (mockMatch?.price || price),
        priceValue: isEdilson ? 30 : isSuelen ? 100 : isOlivia ? 50 : (mockMatch?.priceValue || Number(d.consultation_price) || 30),
        whatsapp: "5511991363154",
        rating: d.rating || 5.0,
        consults: d.total_consultations || (isEdilson ? 850 : isOlivia ? 520 : 185),
        avatar: fullName.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "PR",
        imageUrl: finalImage,
        paymentLink: mockMatch?.paymentLink || "https://mpago.la/12KAwmH",
        services: isEdilson 
          ? [
              { name: "Orientação Técnica + Relatório de Encaminhamento (Chat 30 min)", price: "R$ 30,00", desc: "Com relatório completo assinado digitalmente (Brasil)" },
              { name: "Orientação Técnica Completa (Chat + Vídeo)", price: "R$ 100,00", desc: "Avaliação por vídeo e relatório completo" },
              { name: "Consulta Prescritiva Internacional (Bolívia)", price: "US$ 50,00", desc: "Com receita e assinatura digital (Santa Cruz - BO)" },
              { name: "Retorno", price: "R$ 30,00", desc: "Acompanhamento" },
            ]
          : isSuelen
          ? [
              { name: "Orientação Inicial via Chat", price: "R$ 100,00", desc: "Avaliação inicial via chat seguro" },
              { name: "Orientação Completa (Chat + Vídeo)", price: "R$ 150,00", desc: "Avaliação completa com teleconsulta" },
              { name: "Retorno", price: "R$ 90,00", desc: "Acompanhamento" },
            ]
          : isOlivia
          ? [
              { name: "Orientação Técnica + Mentoria Terapêutica (Chat 30 min)", price: "R$ 50,00", desc: "Com relatório completo assinado digitalmente (Brasil)" },
              { name: "Orientação Técnica Completa (Chat + Vídeo)", price: "R$ 100,00", desc: "Avaliação por vídeo e mentoria terapêutica" },
              { name: "Consulta Prescritiva Internacional (Bolívia)", price: "US$ 50,00", desc: "Com receita e assinatura digital (Cochabamba - BO)" },
              { name: "Retorno", price: "R$ 30,00", desc: "Acompanhamento" },
            ]
          : (mockMatch?.services || [
          { name: "Orientação Técnica Inicial", price, desc: "Avaliação completa + plano terapêutico" },
          { name: "Retorno", price: formatConsultationPrice((Number(d.consultation_price) || 30) * 0.6, d.country), desc: "Acompanhamento e ajuste" },
        ]),
        slots: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"],
        reviews: [],
        online: true,
        crm: finalCrm,
        hospital: isEdilson ? "Planta y Raíz Ltda / Santa Cruz de la Sierra (BO)" : isSuelen ? "Planta y Raíz Ltda / Paraná (BR)" : isOlivia ? "Planta y Raíz Ltda / Cochabamba (BO)" : cityLabel,
        flags: isEdilson || isOlivia ? ["🇧🇷", "🇧🇴"] : ["🇧🇷"],
      };
    });

    // Helper to check if a mock is replaced by a real DB entry
    const isMockReplaced = (mock: Professional) => {
      return realPros.some(real => {
        const realCrmNum = real.crm ? real.crm.replace(/\D/g, '') : '';
        const mockCrmNum = mock.crm ? mock.crm.replace(/\D/g, '') : '';
        if (realCrmNum && mockCrmNum && realCrmNum === mockCrmNum) return true;
        // fallback to name matching (first and last name)
        if (!mock.name || !real.name) return false;
        const mockNameParts = mock.name.toLowerCase().split(' ');
        const mockLastName = mockNameParts[mockNameParts.length - 1];
        return real.name.toLowerCase().includes(mockLastName);
      });
    };

    let finalPros = [...realPros];

    const getMockOnlineStatus = (id: string, defaultStatus: boolean) => {
      const stored = localStorage.getItem(`mock_online_${id}`);
      return stored !== null ? stored === "true" : defaultStatus;
    };

    // Dr. Edilson fallback (always online)
    const edilsonMock = testProfessionals.find(p => p.id === "med-0");
    if (edilsonMock && !isMockReplaced(edilsonMock)) {
      finalPros.unshift({ ...edilsonMock, online: true });
    }
    
    // Dra. Olivia fallback (offline by default, togglable)
    const oliviaMock = testProfessionals.find(p => p.id === "mock-olivia");
    if (oliviaMock && !isMockReplaced(oliviaMock)) {
      finalPros.push({ ...oliviaMock, online: getMockOnlineStatus("mock-olivia", false) });
    }

    const suelenMock = testProfessionals.find(p => p.id === "mock-suelen");
    if (suelenMock && !isMockReplaced(suelenMock)) {
      finalPros.push({ ...suelenMock, online: getMockOnlineStatus("mock-suelen", false) });
    }

    // Médicos reais recém-cadastrados (KYC pendente): card exposto, mas OFF-LINE
    // até liberação no painel KYC ou ativação pelo próprio médico.
    const PENDING_REAL_IDS = ["med-joao-pedro", "med-marianna", "med-ana-paula", "med-jose-roberto", "med-angela-beatriz", "med-gustavo-nobre", "med-gustavo-simoes", "med-albert-machado", "med-guilherme-campos"];
    for (const pendingId of PENDING_REAL_IDS) {
      const mock = testProfessionals.find((p) => p.id === pendingId);
      if (!mock) continue;
      if (finalPros.some((p) => p.id === mock.id) || isMockReplaced(mock)) continue;
      finalPros.push({ ...mock, online: getMockOnlineStatus(mock.id, false) });
    }

    // How many test slots remain after real doctors fill spots
    const testSlotsRemaining = Math.max(0, MAX_TEST_SLOTS - finalPros.length);

    // Get the 6 curated test doctors
    let keptTests = KEPT_TEST_IDS
      .map(id => testProfessionals.find(p => p.id === id))
      .filter(Boolean) as Professional[];

    // Remove any mocks that are already represented by real DB doctors
    keptTests = keptTests.filter(mock => !isMockReplaced(mock));

    // Only keep enough to fill remaining slots
    const finalTests = keptTests.slice(0, testSlotsRemaining);

    // Apply online status: med-3 (Dr. João Pedro) reads from localStorage or defaults to true
    const shiftIndex = getOnlineShiftIndex();
    const rotatedTests = finalTests.map((p, i) => {
      if (p.id === "med-3") {
        const joaoStatus = localStorage.getItem("doctor_online_status_med-3");
        return { ...p, online: joaoStatus !== null ? joaoStatus === "true" : true };
      }
      return {
        ...p,
        online: i === (shiftIndex % Math.max(1, finalTests.length)),
      };
    });

    return [...finalPros, ...rotatedTests];
  }, [realDoctors, currentHour, mockTrigger]);

  return { professionals: merged, realCount: realDoctors.length, loading };
}
