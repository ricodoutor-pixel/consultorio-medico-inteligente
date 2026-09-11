// src/hooks/useRealProfessionals.ts
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Professional } from "@/types/professional";
import { professionals as baseProfessionals } from "@/data/professionals";
import { getDoctorCfmPrint } from "@/data/doctor-cfm-prints";
import { compareDoctorsByCompleteness } from "@/lib/doctor-ranking";

const MEDICOS_CATEGORY = "Médicos Prescritores";

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
  kyc_docs_count?: number | null;
}

/**
 * Mapeamento oficial de imagens tratadas com fundo branco, jaleco e estetoscópio.
 * REGRA CRÍTICA: A imagem tratada oficial configurada tem prioridade absoluta.
 * Fotos informais ou fotos anexadas no cadastro NÃO podem sobrepor a foto tratada.
 */
export function resolveDoctorAvatar(name: string, crm: string, currentAvatar?: string | null): string {
  const n = (name || "").toLowerCase();
  const c = (crm || "").toLowerCase();

  // 1. Prioridade ABSOLUTA para os 18 médicos oficiais com foto tratada (jaleco + esteto + fundo branco)
  if (n.includes("edilson") || c.includes("10963")) return "/avatars/dr-edilson-bezerra.jpg";
  if (n.includes("suelen") || c.includes("49354")) return "/avatars/dra-suelen-naves.jpg";
  if (n.includes("olivia") || c.includes("4466260") || c.includes("494444") || c.includes("z-")) return "/avatars/dra-olivia-zimeri-pro.jpg";
  if (n.includes("geraldo") || c.includes("32584")) return "/avatars/dr-jose-geraldo.jpg";
  if (n.includes("detoni") || n.includes("girardello") || c.includes("42912")) return "/avatars/dr-joao-pedro-detoni.jpg";
  if (n.includes("gustavo") && (n.includes("damiani") || n.includes("nobre") || c.includes("35632"))) return "/avatars/dr-gustavo-nobre.jpg";
  if (n.includes("gustavo") && (n.includes("simoes") || n.includes("llivi") || c.includes("7684"))) return "/avatars/dr-gustavo-simoes.jpg";
  if (n.includes("marianna") || n.includes("arzamendia") || c.includes("12110")) return "/avatars/dra-marianna-arzamendia.jpg";
  if (n.includes("ana paula") || c.includes("36942")) return "/avatars/dra-ana-paula-ferreira.jpg";
  if (n.includes("adeonis") || c.includes("9060")) return "/avatars/dr-adeonis-oliveira.jpg";
  if (n.includes("albert") || c.includes("34660") || c.includes("16118")) return "/avatars/dr-albert-machado.jpg";
  if ((n.includes("alexandre") && (n.includes("stramandinoli") || n.includes("corrêa") || n.includes("correa"))) || c.includes("17266")) return "/avatars/dr-alexandre-stramandinoli.jpg";
  if (n.includes("daniel") && (n.includes("kobayashi") || c.includes("5460") || c.includes("10346"))) return "/avatars/dr-daniel-kobayashi.jpg";
  if (n.includes("guilherme") && (n.includes("campos") || c.includes("49694"))) return "/avatars/dr-guilherme-campos.jpg";
  if (n.includes("jose roberto") || n.includes("coutinho") || c.includes("5266864") || c.includes("520668646")) return "/avatars/dr-jose-roberto.jpg";
  if (n.includes("angela beatriz") || n.includes("mercado") || c.includes("5258084") || c.includes("52580846")) return "/avatars/dra-angela-beatriz.jpg";
  if (n.includes("ingrid") && (n.includes("chiullo") || n.includes("miranda") || c.includes("216629"))) return "/avatars/dra-ingrid-chiullo.jpg";
  if (n.includes("eduardo") && (n.includes("correa") || n.includes("migueis") || c.includes("19333"))) return "/avatars/dr-eduardo-correa.jpg";

  // 2. Especialistas e terapeutas das demais categorias oficiais tratadas
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
  if (n.includes("lucas") && n.includes("ferreira")) return "/avatars/dr-lucas-ferreira.jpg";
  if (n.includes("carlos") && n.includes("herrera")) return "/avatars/dr-carlos-herrera.jpg";
  if (n.includes("valentina") && n.includes("reyes")) return "/avatars/dra-valentina-reyes.jpg";
  if (n.includes("rafael") && n.includes("mendes")) return "/avatars/dr-rafael-mendes.jpg";
  if (n.includes("camila") && n.includes("duarte")) return "/avatars/dra-camila-duarte.jpg";
  if (n.includes("wei") && n.includes("chen")) return "/avatars/dr-wei-chen.jpg";
  if (n.includes("keiko") && n.includes("yamamoto")) return "/avatars/dra-keiko-yamamoto.jpg";
  if (n.includes("thiago") && n.includes("verde")) return "/avatars/prof-thiago-verde.jpg";
  if (n.includes("daniela") && n.includes("rojas")) return "/avatars/prof-daniela-rojas.jpg";
  if (n.includes("bruno") && n.includes("tavares")) return "/avatars/dr-bruno-tavares.jpg";
  if (n.includes("mei") && n.includes("lin")) return "/avatars/dra-mei-lin.jpg";
  if (n.includes("ricardo") && n.includes("campos")) return "/avatars/prof-ricardo-campos.jpg";
  if (n.includes("priscila") && n.includes("andrade")) return "/avatars/dra-priscila-andrade.jpg";
  if (n.includes("paulo") && n.includes("nakamura")) return "/avatars/dr-paulo-nakamura.jpg";
  if (n.includes("leticia") && n.includes("verde")) return "/avatars/profa-leticia-verde.jpg";
  if (n.includes("victor") && n.includes("lima")) return "/avatars/dr-victor-lima.jpg";
  if (n.includes("gabriela") && n.includes("moreira")) return "/avatars/dra-gabriela-moreira.jpg";
  if (n.includes("sakura") && n.includes("ito")) return "/avatars/dra-sakura-ito.jpg";
  if (n.includes("ravi") && n.includes("sharma")) return "/avatars/dr-ravi-sharma.jpg";
  if (n.includes("diego") && n.includes("santos")) return "/avatars/prof-diego-santos.jpg";
  if (n.includes("julia") && n.includes("oliveira")) return "/avatars/profa-julia-oliveira.jpg";
  if (n.includes("maria") && (n.includes("aparecida") || n.includes("aux"))) return "/avatars/aux-enf-maria.jpg";
  if (n.includes("jose") && (n.includes("nascimento") || n.includes("aux"))) return "/avatars/aux-enf-jose.jpg";
  if (n.includes("ana") && (n.includes("beatriz") || n.includes("aux"))) return "/avatars/aux-enf-ana.jpg";
  if (n.includes("francisca") && n.includes("souza")) return "/avatars/aux-enf-francisca.jpg";
  if (n.includes("claudia") && n.includes("regina")) return "/avatars/aux-enf-claudia.jpg";
  if (n.includes("patricia") && n.includes("mendonça")) return "/avatars/enf-patricia.jpg";
  if (n.includes("rodrigo") && n.includes("alves")) return "/avatars/enf-rodrigo.jpg";
  if (n.includes("claudia") && n.includes("nascimento")) return "/avatars/enf-claudia.jpg";
  if (n.includes("marcos") && n.includes("vinicius")) return "/avatars/enf-marcos.jpg";
  if (n.includes("fernanda") && n.includes("bastos")) return "/avatars/enf-fernanda.jpg";
  if (n.includes("luciana") && n.includes("torres")) return "/avatars/enf-luciana.jpg";
  if (n.includes("diego") && n.includes("santana")) return "/avatars/enf-diego.jpg";
  if (n.includes("luciana") && n.includes("pereira")) return "/avatars/tec-enf-luciana.jpg";
  if (n.includes("carlos") && n.includes("santos")) return "/avatars/tec-enf-carlos.jpg";
  if (n.includes("rosangela") && n.includes("dias")) return "/avatars/tec-enf-rosangela.jpg";
  if (n.includes("adriana") && n.includes("gomes")) return "/avatars/tec-enf-adriana.jpg";
  if (n.includes("helena") && n.includes("barbosa")) return "/avatars/cuid-helena.jpg";
  if (n.includes("jorge") && n.includes("moreira")) return "/avatars/cuid-jorge.jpg";
  if (n.includes("sandra") && n.includes("oliveira")) return "/avatars/cuid-sandra.jpg";
  if (n.includes("mariana") && n.includes("castello")) return "/avatars/dra-mariana-integrativa.jpg";
  if (n.includes("roberto") && n.includes("figueiredo")) return "/avatars/dr-roberto-integrativa.jpg";
  if (n.includes("beatriz") && n.includes("herbal")) return "/avatars/dra-beatriz-integrativa.jpg";

  // Se não é um profissional oficial tratado, usa o avatar atual se houver
  if (currentAvatar && currentAvatar.trim() !== "") {
    return currentAvatar;
  }
  return "";
}

/**
 * Normalizador de nome para conferência e deduplicação
 */
function normalizeDoctorKey(name: string, crm?: string | null): string {
  const n = (name || "").toLowerCase()
    .replace(/^dr\.\s*|^dra\.\s*|^prof\.\s*|^profa\.\s*|^enf\.\s*|^téc\.\s*|^aux\.\s*/i, "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  return n;
}

export function useRealProfessionals(): { professionals: Professional[]; realCount: number; loading: boolean } {
  const [dbDoctors, setDbDoctors] = useState<DoctorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchDoctors = async () => {
      try {
        const { data: publicDocs, error } = await supabase.from("doctors_public" as never).select("*");
        if (error) throw error;
        if (!active) return;
        setDbDoctors((publicDocs ?? []) as DoctorRow[]);
      } catch (error) {
        console.warn("[useRealProfessionals] Fallback to base professionals:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchDoctors();
    const poll = window.setInterval(fetchDoctors, 30_000);
    const channel = supabase
      .channel("public:doctors-status-real")
      .on("postgres_changes", { event: "*", schema: "public", table: "doctors" }, fetchDoctors)
      .subscribe();

    return () => {
      active = false;
      window.clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, []);

  const professionals = useMemo<Professional[]>(() => {
    // FONTE ÚNICA: a vitrine exibe SOMENTE os profissionais realmente cadastrados
    // e liberados pelo administrador na página de KYC (view `doctors_public`).
    // Nenhum profissional fictício ou lista fixa é usado aqui.
    const baseByCrm = new Map<string, Professional>();
    const baseByName = new Map<string, Professional>();
    for (const base of baseProfessionals) {
      const cleanCrm = (base.crm || "").replace(/\D/g, "");
      if (cleanCrm) baseByCrm.set(cleanCrm, base);
      const key = normalizeDoctorKey(base.name);
      if (key) baseByName.set(key, base);
    }

    const mapped: Professional[] = dbDoctors
      .filter((doc) => doc.is_verified !== false)
      .map((doc) => {
        const fullName = doc.full_name || "Profissional";
        const cleanCrm = (doc.crm || "").replace(/\D/g, "");
        const base =
          (cleanCrm ? baseByCrm.get(cleanCrm) : undefined) ||
          baseByName.get(normalizeDoctorKey(fullName));

        const registration = doc.crm
          ? `${doc.crm}${doc.crm_state ? ` - ${doc.crm_state}` : ""}`
          : "";
        const isVet =
          /crmv/i.test(doc.crm || "") ||
          /veterin/i.test(doc.specialty || "") ||
          /veterin/i.test(doc.document_type || "");

        const priceValue = Number(doc.price_video_chat ?? doc.consultation_price ?? 150) || 150;
        const avatar = resolveDoctorAvatar(fullName, doc.crm || "", doc.avatar_url) || doc.avatar_url || "";

        return {
          id: base?.id ?? `db-${doc.id}`,
          dbId: doc.id,
          name: fullName,
          category: isVet ? "Médico Veterinário Prescritor" : MEDICOS_CATEGORY,
          councilLabel: isVet ? "CRMV" : "CRM",
          bio: doc.bio || base?.bio || "",
          experience: base?.experience ?? "",
          tags: base?.tags ?? [doc.specialty || "Cannabis Medicinal", "Prescritor"],
          price: `R$ ${priceValue.toFixed(2).replace(".", ",")}`,
          priceValue,
          whatsapp: base?.whatsapp ?? "",
          rating: doc.rating ?? null,
          consults: doc.total_consultations ?? 0,
          avatar: fullName
            .replace(/^(dr|dra|prof|profa)\.?\s*/i, "")
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join(""),
          imageUrl: avatar,
          paymentLink: base?.paymentLink ?? "",
          services: base?.services ?? [],
          slots: base?.slots ?? [],
          reviews: base?.reviews ?? [],
          online: Boolean(doc.is_online && (doc.is_available ?? true)),
          premiumPrice: doc.price_video_chat ?? base?.premiumPrice,
          crm: registration,
          cfmPrintUrl: getDoctorCfmPrint(doc.crm || fullName) || base?.cfmPrintUrl,
          flags: base?.flags ?? (doc.country === "BO" ? ["🇧🇴"] : ["🇧🇷"]),
          plan_tier: doc.plan_tier ?? "free",
          _docsCount: doc.kyc_docs_count ?? 0,
        } as Professional & { _docsCount: number };
      });

    // Ordem oficial: fixos primeiro, depois quem tem mais documentos no cadastro.
    return mapped.sort((a, b) =>
      compareDoctorsByCompleteness(
        { name: a.name, registration: a.crm, docsCount: (a as Professional & { _docsCount?: number })._docsCount ?? 0 },
        { name: b.name, registration: b.crm, docsCount: (b as Professional & { _docsCount?: number })._docsCount ?? 0 },
      ),
    );
  }, [dbDoctors]);

  return { professionals, realCount: professionals.length, loading };
}