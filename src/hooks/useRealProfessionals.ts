// src/hooks/useRealProfessionals.ts
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Professional } from "@/types/professional";
import { professionals as baseProfessionals } from "@/data/professionals";
import { getDoctorCfmPrint } from "@/data/doctor-cfm-prints";
import { compareDoctorsByCompleteness } from "@/lib/doctor-ranking";
import { ensureDoctorTitle } from "@/lib/doctor-title";
import { isPublicProfessionalVisible } from "@/lib/public-professional-visibility";

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
  is_approved?: boolean | null;
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
  if ((n.includes("luiz roberto") && n.includes("medina")) || c.includes("11496")) return "/avatars/dr-luiz-roberto-medina.jpg";
  if (n.includes("julio") || n.includes("sacomori") || c.includes("44830")) return "/avatars/dr-julio-sacomori-jaleco.jpg?v=20261025";
  if (n.includes("stella") || n.includes("martinelli") || c.includes("21102111")) return "/avatars/dra-stella-martinelli.jpg?v=20261022";
  if ((n.includes("victor") && n.includes("fonseca")) || n.includes("victor henrique") || c.includes("206873")) return "/avatars/dr-victor-fonseca.jpg?v=2";
  if (n.includes("otavio") || n.includes("otávio") || n.includes("bassete") || c.includes("21907")) return "/avatars/dr-otavio-bassete.jpg";
  if (n.includes("sadi") || n.includes("menta") || c.includes("16301")) return "/avatars/dr-sadi-menta.jpg?v=1";
  if (n.includes("geovana") || n.includes("mozaner") || c.includes("98083") || c.includes("247790")) return "/avatars/dra-geovana-torres.jpg?v=1";
  if (n.includes("grace") || n.includes("conceicao") || n.includes("conceição") || c.includes("190386") || c.includes("190.386") || c.includes("10372")) return "/avatars/dra-grace-conceicao.jpg?v=1";
  if (n.includes("mariana") && (n.includes("alves") || n.includes("rezende") || c.includes("135012"))) return "/avatars/dra-mariana-alves.jpg";
  if (n.includes("breno") || n.includes("boueri") || n.includes("affonso") || c.includes("75492")) return "/avatars/dr-breno-boueri.jpg?v=4";
  if (n.includes("milton") || n.includes("urban") || c.includes("58169")) return "/avatars/dr-milton-urban.jpg?v=4";
  if (n.includes("raissa") || n.includes("raíssa") || n.includes("ruperto") || n.includes("chagas") || c.includes("26470")) return "/avatars/dra-raissa-chagas.jpg?v=1";
  if (n.includes("ana karoliny") || (n.includes("karoliny") && n.includes("martins")) || c.includes("13942")) return "/avatars/dra-ana-karoliny.jpg?v=1";
  if (n.includes("arthur") || n.includes("barretto") || c.includes("6871")) return "/avatars/dr-arthur-barretto.jpg?v=1";
  if (n.includes("rafaella") || n.includes("soletti") || c.includes("13542")) return "/avatars/dra-rafaella-soletti.jpg?v=1";
  if (n.includes("barbara") || n.includes("matos") || c.includes("12361")) return "/avatars/dra-barbara-matos.jpg?v=3";
  if (n.includes("cartaxo") || (n.includes("diego") && n.includes("jacome")) || c.includes("14828")) return "/avatars/dr-diego-cartaxo.jpg?v=3";
  if (n.includes("leuma") || n.includes("netta") || c.includes("85182")) return "/avatars/dra-leuma-netta.jpg?v=3";
  if (n.includes("edna") || n.includes("marlisia") || c.includes("3227") || c.includes("9727")) return "/avatars/dra-edna-marlisia.jpg?v=1";
  if (n.includes("veronica") || n.includes("verônica") || (n.includes("christine") && n.includes("paiva")) || c.includes("20984") || c.includes("22902")) return "/avatars/dra-veronica-silva.jpg?v=1";
  if (n.includes("lucas") && n.includes("ferreira")) return "/avatars/dr-lucas-ferreira.jpg";
  if (n.includes("juliana") && n.includes("ferreira")) return "/avatars/dra-juliana-ferreira.jpg";

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
  // Remove TODOS os títulos iniciais (Dra., Dr., Profa., Prof., etc.),
  // ordenados com tokens mais longos primeiro, com ponto opcional e espaços.
  const n = (name || "").toLowerCase()
    .replace(/^((dra|dr|profa|prof|enfa|enf|téc|tec|aux)\.?\s*)+/i, "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  return n;
}

/**
 * Extrai apenas o número do CRM principal, ignorando sufixos como RQE, UFs ou múltiplos CRMs.
 * Ex: "34660/PE (Regular) RQE: 19896" -> "34660"
 * Ex: "98083/MG • 247790/SP" -> "98083"
 */
function extractPrimaryCrm(crmRaw?: string | null): string {
  if (!crmRaw) return "";
  const firstChunk = crmRaw.split(/rqe|•|\/|\s-\s/i)[0] || "";
  return firstChunk.replace(/\D/g, "");
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
    // 1. Mapeamento de busca rápida dos dados reais do banco
    const dbMapByCrm = new Map<string, DoctorRow>();
    const dbMapByName = new Map<string, DoctorRow>();

    for (const doc of dbDoctors) {
      if (doc.crm) {
        const cleanCrm = extractPrimaryCrm(doc.crm);
        if (cleanCrm) dbMapByCrm.set(cleanCrm, doc);
      }
      const normName = normalizeDoctorKey(doc.full_name || "");
      if (normName) dbMapByName.set(normName, doc);
    }

    const matchedDbDoctorIds = new Set<string>();
    const docsCountById = new Map<string, number>();

    // 2. Itera sobre os profissionais oficiais configurados (baseProfessionals)
    // Isso garante que TODOS os médicos tratados com jaleco e esteto, além das demais categorias (veterinários, terapeutas, etc.),
    // apareçam com 100% de estabilidade mesmo se o banco estiver indisponível ou vazio.
    const enrichedList: Professional[] = baseProfessionals.map((base) => {
      if (!base) return base;

      const cleanBaseCrm = extractPrimaryCrm(base.crm);
      const normBaseName = normalizeDoctorKey(base.name);

      const matchedDb = (cleanBaseCrm ? dbMapByCrm.get(cleanBaseCrm) : null) || 
                        dbMapByName.get(normBaseName);

      if (matchedDb) {
        matchedDbDoctorIds.add(matchedDb.id);
      }

      // Foto tratada oficial SEMPRE tem prioridade absoluta
      const treatedAvatar = resolveDoctorAvatar(base.name, base.crm || "", matchedDb?.avatar_url || base.imageUrl);
      const cfmPrint = getDoctorCfmPrint(base.crm || base.name) || base.cfmPrintUrl;

      const isEdilson = cleanBaseCrm === "10963" || (base.name && base.name.toLowerCase().includes("edilson"));
      const registration = isEdilson ? "10963 - Sta Cruz (BO)" : (base.crm || (matchedDb?.crm ? `${matchedDb.crm}${matchedDb.crm_state ? ` - ${matchedDb.crm_state}` : ""}` : ""));

      if (!matchedDb) {
        docsCountById.set(base.id, 0);
        return {
          ...base,
          crm: registration,
          imageUrl: treatedAvatar || base.imageUrl,
          cfmPrintUrl: cfmPrint,
          tags: isEdilson ? ["CEO Planta y Raíz", "Orientação Técnica (BR)", "Prescritor Sta Cruz (BO)"] : base.tags,
        };
      }

      docsCountById.set(base.id, matchedDb.kyc_docs_count ?? 0);

      const priceValue = Number(matchedDb.price_video_chat ?? matchedDb.consultation_price ?? base.priceValue ?? 150) || 150;

      // Enriquece com informações em tempo real do banco de dados
      return {
        ...base,
        dbId: matchedDb.id,
        crm: registration,
        imageUrl: treatedAvatar || base.imageUrl,
        cfmPrintUrl: cfmPrint,
        bio: (matchedDb.bio && matchedDb.bio.trim() !== "") ? matchedDb.bio.trim() : base.bio,
        online: Boolean(matchedDb.is_online && (matchedDb.is_available ?? true)),
        rating: matchedDb.rating ?? base.rating,
        consults: matchedDb.total_consultations ?? base.consults,
        price: `R$ ${priceValue.toFixed(2).replace(".", ",")}`,
        priceValue,
        premiumPrice: matchedDb.price_video_chat ?? base.premiumPrice,
        plan_tier: matchedDb.plan_tier ?? base.plan_tier,
        tags: isEdilson ? ["CEO Planta y Raíz", "Orientação Técnica (BR)", "Prescritor Sta Cruz (BO)"] : (base.tags ?? [matchedDb.specialty || "Cannabis Medicinal", "Prescritor"]),
      };
    });

    // 3. Adicionar novos profissionais cadastrados no banco APROVADOS que não estavam na lista base
    // REGRAS ESTRITAS:
    // a) Apenas profissionais com is_approved === true (aprovados formalmente pelo Dr. Edilson).
    // b) Excluir contas de teste/mock/e2e.
    // c) Cada profissional deve ser classificado em sua categoria correta (médicos em Médicos Prescritores,
    //    veterinários em Médico Veterinário, enfermeiros em Enfermagem, etc.). Jamais jogar não-médicos em Médicos Prescritores.
    const newlyAddedFromDb: Professional[] = [];

    for (const doc of dbDoctors) {
      if (matchedDbDoctorIds.has(doc.id)) continue;
      if (!isPublicProfessionalVisible(doc)) continue;
      // Somente aprovados pelo Dr. Edilson
      if (doc.is_approved !== true) continue;

      const crmStr = (doc.crm || "").trim();
      const rawFullName = (doc.full_name || "").trim();

      // Ignora contas de teste/mock e códigos fictícios do seed 08/09
      if (
        /test|mock|e2e/i.test(crmStr) ||
        /^(12345|34567|45678|56789|67890|67891)$/i.test(crmStr.replace(/\D/g, "")) ||
        /^(ENF|JAR|ACU|OCU|CUID|PSI|TEC|AUX|INT)-\d+/i.test(crmStr) ||
        /teste|demo|perfil demonstrativo/i.test(rawFullName)
      ) {
        continue;
      }

      const fullName = ensureDoctorTitle(rawFullName || "Profissional");
      const cleanCrm = crmStr.replace(/\D/g, "");
      const isEdilson = cleanCrm === "10963" || (fullName && fullName.toLowerCase().includes("edilson"));
      const registration = isEdilson
        ? "10963 - Sta Cruz (BO)"
        : (crmStr ? `${crmStr}${doc.crm_state ? ` - ${doc.crm_state}` : ""}` : "");

      const isVet =
        /crmv/i.test(crmStr) ||
        /veterin/i.test(doc.specialty || "") ||
        /veterin/i.test(doc.document_type || "");

      let category = "";
      let councilLabel = "CRM";

      if (isVet) {
        category = "Médico Veterinário Prescritor";
        councilLabel = "CRMV";
      } else if (doc.council_type === "CRF" || /farm/i.test(doc.specialty || "")) {
        // Farmacêuticos e farmácias pertencem exclusivamente à vitrine do Shopping / Saúde Verde
        continue;
      } else if (doc.council_type === "CRN" || /^crn/i.test(crmStr) || /nutri/i.test(doc.specialty || "")) {
        category = "Nutricionistas";
        councilLabel = "CRN";
      } else if (doc.council_type === "CREFITO" || /^crefito/i.test(crmStr) || /fisio/i.test(doc.specialty || "")) {
        category = "Fisioterapeutas";
        councilLabel = "CREFITO";
      } else if (doc.council_type === "CRM" || (!doc.council_type && /^\d+/.test(crmStr))) {
        category = MEDICOS_CATEGORY;
        councilLabel = "CRM";
      } else if (doc.council_type === "COREN" || crmStr.startsWith("ENF")) {
        category = "Enfermagem";
        councilLabel = "COREN";
      } else if (crmStr.startsWith("TEC")) {
        category = "Téc. Enfermagem";
        councilLabel = "COREN-TÉC";
      } else if (crmStr.startsWith("AUX")) {
        category = "Aux. de Enfermagem";
        councilLabel = "COREN-AUX";
      } else if (crmStr.startsWith("PSI")) {
        category = "Psicologia & Terapias";
        councilLabel = "CRP";
      } else if (crmStr.startsWith("CUID")) {
        category = "Cuidadores de Idosos";
        councilLabel = "—";
      } else if (crmStr.startsWith("ACU")) {
        category = "Acupuntura";
        councilLabel = "CRM / COFFITO";
      } else if (crmStr.startsWith("JAR")) {
        category = "Jardineiros & Cultivo";
        councilLabel = "CREA / CFB";
      } else if (crmStr.startsWith("OCU")) {
        category = "Saúde Ocupacional";
        councilLabel = "CRM / CREA";
      } else if (crmStr.startsWith("INT")) {
        category = "Medicina Integrativa";
        councilLabel = "CRM";
      }

      // Se não pertencer a nenhuma categoria válida ou for não-médico sem conselho, não exibe na vitrine de prescritores
      if (!category) continue;

      const priceValue = Number(doc.price_video_chat ?? doc.consultation_price ?? 150) || 150;
      const avatar = resolveDoctorAvatar(fullName, doc.crm || "", doc.avatar_url) || doc.avatar_url || "";

      docsCountById.set(`db-${doc.id}`, doc.kyc_docs_count ?? 0);

      newlyAddedFromDb.push({
        id: `db-${doc.id}`,
        dbId: doc.id,
        name: fullName,
        category,
        councilLabel,
        bio: doc.bio || "",
        experience: "",
        tags: isEdilson ? ["CEO Planta y Raíz", "Orientação Técnica (BR)", "Prescritor Sta Cruz (BO)"] : [doc.specialty || "Cannabis Medicinal", "Prescritor"],
        price: `R$ ${priceValue.toFixed(2).replace(".", ",")}`,
        priceValue,
        whatsapp: "",
        rating: doc.rating ?? null,
        consults: doc.total_consultations ?? 0,
        avatar: fullName
          .replace(/^(dr|dra|prof|profa)\.?\s*/i, "")
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part.charAt(0).toUpperCase())
          .join(""),
        imageUrl: avatar,
        paymentLink: "",
        services: [],
        slots: [],
        reviews: [],
        online: Boolean(doc.is_online && (doc.is_available ?? true)),
        premiumPrice: doc.price_video_chat,
        crm: registration,
        cfmPrintUrl: getDoctorCfmPrint(doc.crm || fullName),
        flags: doc.country === "BO" ? ["🇧🇴"] : ["🇧🇷"],
        plan_tier: doc.plan_tier ?? "free",
      });
    }

    const rawList = [...enrichedList, ...newlyAddedFromDb];

    // 4. DEDUPLICAÇÃO BLINDADA: Garante que NENHUM profissional apareça duplicado (por CRM ou nome normalizado)
    const seenKeys = new Set<string>();
    const deduplicatedList: Professional[] = [];

    for (const p of rawList) {
      if (!p) continue;
      if (!isPublicProfessionalVisible(p)) continue;
      const cleanCrm = (p.crm || "").replace(/\D/g, "");
      const normName = normalizeDoctorKey(p.name);
      
      // Chaves únicas por categoria + CRM ou categoria + nome normalizado
      const crmKey = cleanCrm && cleanCrm.length >= 4 ? `${p.category}:crm:${cleanCrm}` : null;
      const nameKey = normName ? `${p.category}:name:${normName}` : null;

      if (crmKey && seenKeys.has(crmKey)) {
        continue;
      }
      if (nameKey && seenKeys.has(nameKey)) {
        continue;
      }

      if (crmKey) seenKeys.add(crmKey);
      if (nameKey) seenKeys.add(nameKey);
      deduplicatedList.push(p);
    }

    // 5. Separa os médicos prescritores para ordenar com precisão (Dr. Victor #1 VIP e completude)
    const medicos = deduplicatedList.filter((p) => p && p.category === MEDICOS_CATEGORY);
    const nonMedicos = deduplicatedList.filter((p) => p && p.category !== MEDICOS_CATEGORY);

    medicos.sort((a, b) =>
      compareDoctorsByCompleteness(
        { name: a.name, registration: a.crm, docsCount: docsCountById.get(a.id) ?? 0 },
        { name: b.name, registration: b.crm, docsCount: docsCountById.get(b.id) ?? 0 },
      ),
    );

    // Dr. Victor Henrique Bueno da Fonseca sempre em 1º lugar absoluto na vitrine médica (posição 0)
    const victorIdx = medicos.findIndex(
      (m) => m.id === "med-victor-fonseca" || (m.crm && m.crm.includes("206873")) || m.name.toLowerCase().includes("victor")
    );
    if (victorIdx > 0) {
      const [victorDoc] = medicos.splice(victorIdx, 1);
      medicos.unshift(victorDoc);
    }

    return [...medicos, ...nonMedicos];
  }, [dbDoctors]);

  return { professionals, realCount: professionals.length, loading };
}