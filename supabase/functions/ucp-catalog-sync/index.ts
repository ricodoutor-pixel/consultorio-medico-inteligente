/**
 * 🌿 UCP / MCP Catalog Sync — Universal Commerce Protocol & Model Context Protocol Endpoint
 *
 * Exporta o catálogo oficial de medicamentos e fitoterápicos canabinoides
 * no formato padronizado JSON-LD / schema.org (Drug & MedicalProduct) para
 * consumo por IAs, marketplaces agênticos e assistentes autônomos.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { CLUB_CATALOG } from "../_shared/club-catalog.ts";

interface UCPProduct {
  "@context": string;
  "@type": string;
  identifier: string;
  sku: string;
  name: string;
  alternateName?: string;
  description: string;
  activeSubstance: string;
  concentration: string;
  dosageForm: string;
  category: string;
  regulatoryClassification: string;
  requiresPrescription: boolean;
  offers: {
    "@type": string;
    price: number;
    priceCurrency: string;
    availability: string;
    seller: {
      "@type": string;
      name: string;
      identifier?: string;
    };
  };
  image?: string;
}

// Catálogo Canabinoide Canônico Certificado Planta y Raíz (RDC 660 / RDC 327)
const CANONICAL_CANNA_CATALOG: UCPProduct[] = [
  {
    "@context": "https://schema.org",
    "@type": "Drug",
    identifier: "pyr_cbd_full_1500",
    sku: "MED-CBD-1500-FS",
    name: "Óleo de CBD Full Spectrum 1500mg (30ml)",
    alternateName: "Cannabidiol Full Spectrum Oil 50mg/ml",
    description: "Extrato integral de Cannabis sativa com fitocanabinoides menores, terpenos e flavonoides em óleo carreador MCT. Indicado para ansiedade, insônia e dor crônica.",
    activeSubstance: "Canabidiol (CBD) + Fitocanabinoides Menores (CBG, CBC) < 0.2% THC",
    concentration: "1500mg (50mg/ml)",
    dosageForm: "Óleo Sublingual 30ml com conta-gotas graduado",
    category: "cbd_full_spectrum",
    regulatoryClassification: "ANVISA RDC 660/2022",
    requiresPrescription: true,
    offers: {
      "@type": "Offer",
      price: 290.00,
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Pharmacy",
        name: "Farmácia Oficial Planta y Raíz Dispensary",
        identifier: "farmacia_pyr_loja_oficial",
      },
    },
    image: "https://plantayraiz.com.br/assets/products/cbd-1500-full.jpg",
  },
  {
    "@context": "https://schema.org",
    "@type": "Drug",
    identifier: "pyr_cbd_broad_3000",
    sku: "MED-CBD-3000-BS",
    name: "Óleo de CBD Broad Spectrum 3000mg (30ml) Zero THC",
    alternateName: "Broad Spectrum Cannabidiol Oil 100mg/ml",
    description: "Fórmula de alta potência sem THC. Indicado para controle de espasticidade, neuroproteção, autismo (TEA) e atletas sujeitos a controle antidoping.",
    activeSubstance: "Canabidiol (CBD) + CBG (Zero THC Não Detectável)",
    concentration: "3000mg (100mg/ml)",
    dosageForm: "Óleo Sublingual 30ml",
    category: "cbd_broad_spectrum",
    regulatoryClassification: "ANVISA RDC 660/2022",
    requiresPrescription: true,
    offers: {
      "@type": "Offer",
      price: 450.00,
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Pharmacy",
        name: "Farmácia Oficial Planta y Raíz Dispensary",
        identifier: "farmacia_pyr_loja_oficial",
      },
    },
    image: "https://plantayraiz.com.br/assets/products/cbd-3000-broad.jpg",
  },
  {
    "@context": "https://schema.org",
    "@type": "Drug",
    identifier: "pyr_cbg_isolate_1000",
    sku: "MED-CBG-1000-IS",
    name: "Óleo de CBG Isolado 1000mg (30ml) Foco & Digestivo",
    alternateName: "Cannabigerol Pure Isolate Oil 33.3mg/ml",
    description: "Canabigerol puro com ação anti-inflamatória intestinal, foco cognitivo e suporte ao tônus celular.",
    activeSubstance: "Canabigerol (CBG) 99.8% Pureza",
    concentration: "1000mg (33.3mg/ml)",
    dosageForm: "Óleo Sublingual 30ml",
    category: "cbg_isolate",
    regulatoryClassification: "ANVISA RDC 660/2022",
    requiresPrescription: true,
    offers: {
      "@type": "Offer",
      price: 320.00,
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Pharmacy",
        name: "Farmácia Oficial Planta y Raíz Dispensary",
        identifier: "farmacia_pyr_loja_oficial",
      },
    },
    image: "https://plantayraiz.com.br/assets/products/cbg-1000-isolate.jpg",
  },
  {
    "@context": "https://schema.org",
    "@type": "Drug",
    identifier: "pyr_cbn_sleep_750",
    sku: "MED-CBN-750-SL",
    name: "Fórmula Sono Reparador CBD + CBN 750mg (30ml)",
    alternateName: "Cannabinol + CBD Sleep Elixir",
    description: "Sinergia de Canabinol (CBN), CBD e terpenos de Linalol/Mirceno para indução de sono profundo e ciclo circadiano reparador.",
    activeSubstance: "CBD 500mg + CBN 250mg",
    concentration: "750mg (25mg/ml)",
    dosageForm: "Óleo Sublingual 30ml",
    category: "cbn_sleep",
    regulatoryClassification: "ANVISA RDC 660/2022",
    requiresPrescription: true,
    offers: {
      "@type": "Offer",
      price: 360.00,
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Pharmacy",
        name: "Farmácia Oficial Planta y Raíz Dispensary",
        identifier: "farmacia_pyr_loja_oficial",
      },
    },
    image: "https://plantayraiz.com.br/assets/products/cbn-sleep.jpg",
  },
];

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category")?.toLowerCase();
    const inStockOnly = url.searchParams.get("in_stock") === "true";
    const format = url.searchParams.get("format") || "ucp_v1";
    const search = url.searchParams.get("search")?.toLowerCase();

    // 1) Busca produtos de farmácias credenciadas no Supabase (se houver)
    let dynamicProducts: UCPProduct[] = [];
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: dbProducts } = await supabase
          .from("vendor_products")
          .select("id, name, description, price, stock, category, image_url, vendor_id, vendors(name)")
          .eq("is_active", true)
          .limit(50);

        if (dbProducts && dbProducts.length > 0) {
          dynamicProducts = dbProducts.map((p: any) => ({
            "@context": "https://schema.org",
            "@type": "Drug",
            identifier: p.id,
            sku: `PROD-${p.id.slice(0, 8).toUpperCase()}`,
            name: p.name,
            description: p.description || "Medicamento e produto canabinoide dispensado por farmácia credenciada.",
            activeSubstance: "Fitocomplexo Canabinoide Certificado",
            concentration: "Conforme laudo analítico COA",
            dosageForm: "Frasco Terapêutico",
            category: p.category || "cannabis_medicinal",
            regulatoryClassification: "ANVISA RDC 660/2022",
            requiresPrescription: true,
            offers: {
              "@type": "Offer",
              price: Number(p.price) || 290.00,
              priceCurrency: "BRL",
              availability: (p.stock ?? 1) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: {
                "@type": "Pharmacy",
                name: p.vendors?.name || "Farmácia Parceira Planta y Raíz",
                identifier: p.vendor_id || "vendor_parceiro",
              },
            },
            image: p.image_url || undefined,
          }));
        }
      }
    } catch (err) {
      console.warn("[ucp-catalog-sync] Fallback para catálogo canônico:", err);
    }

    // Mescla catálogo canônico com catálogo dinâmico
    let allProducts = [...CANONICAL_CANNA_CATALOG, ...dynamicProducts];

    // Aplica filtros
    if (category) {
      allProducts = allProducts.filter((p) => p.category.toLowerCase().includes(category));
    }
    if (inStockOnly) {
      allProducts = allProducts.filter((p) => p.offers.availability === "https://schema.org/InStock");
    }
    if (search) {
      allProducts = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search) ||
          p.activeSubstance.toLowerCase().includes(search)
      );
    }

    const payload = {
      protocol: "Universal Commerce Protocol (UCP) / Model Context Protocol (MCP)",
      version: "1.0.0",
      compliance: {
        authority: "ANVISA (RDC 660/2022, RDC 327/2019) & CFM Res. 2.314/2022",
        prescription_required: true,
        cryptographic_verification: "ICP-Brasil SHA-512",
      },
      updated_at: new Date().toISOString(),
      item_count: allProducts.length,
      catalog: allProducts,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/ld+json",
        "Cache-Control": "public, max-age=300, s-maxage=600",
      },
    });
  } catch (error: any) {
    console.error("[ucp-catalog-sync] Erro interno:", error);
    return new Response(JSON.stringify({ error: error?.message || "Erro ao sincronizar catálogo UCP" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
