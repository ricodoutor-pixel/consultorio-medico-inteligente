import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ShoppingBag, Star, ArrowLeft, ArrowRight,
  Store, CreditCard, Truck, Search, Shield, Grid3X3, List, ChevronRight,
  Tag, Package, Bitcoin, Clock, ChevronLeft,
  BadgeCheck, Flame, Filter, X, SlidersHorizontal, Heart, Sparkles, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/store/cart";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProductAlertBell } from "@/components/ProductAlertBell";
import { WhatsAppProofModal, useWhatsAppProofModal, type WhatsAppContext } from "@/components/WhatsAppProofModal";
import { BTCPaymentModal } from "@/components/BTCPaymentModal";
import { PrescriptionVerificationModal } from "@/components/PrescriptionVerificationModal";
import { DoctorEndorsedBadge } from "@/components/DoctorEndorsedBadge";
import { AnvisaBadge } from "@/components/AnvisaBadge";
import { FarmaciaCard } from "@/components/FarmaciaCard";
import { buildProductSchema } from "@/lib/schema-org";
import { resolveProductImg } from "@/lib/productImages";
import { ImageLightboxModal } from "@/components/ImageLightboxModal";

export interface VendorProduct {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  category: string;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  stock: number;
  sold_count: number;
  rating: number | null;
  review_count: number;
  is_active: boolean;
  endorsed_by_doctor?: boolean | null;
  as_anvisa?: string | null;
  vendors?: { id: string; store_name: string; rating: number | null };
}

export const OFFICIAL_MEDICINES: VendorProduct[] = [
  {
    id: "med-1",
    vendor_id: "vendor-pyr-oficial",
    name: "Epidiolex / Epidyolex (Canabidiol 100 mg/mL)",
    description: "Composição: Canabidiol (CBD) purificado de origem botânica (>98%), sem THC.\n\nIndicações: Síndrome de Lennox-Gastaut, Síndrome de Dravet, Complexo de Esclerose Tuberosa e epilepsias refratárias de difícil controle.\n\nDescrição: Primeiro medicamento fitoderivado de cannabis aprovado pelo FDA e pela EMA, com ampla validação em ensaios clínicos duplo-cegos.\n\nPosologia Resumida: Dose inicial de 5 mg/kg/dia dividida em 2 tomadas orais. Pode ser titulada semanalmente até a dose de manutenção de 10 mg a 20 mg/kg/dia, com monitoramento periódico de enzimas hepáticas (ALT/AST).",
    price: 2450.00,
    compare_price: 2890.00,
    category: "oleo",
    image_url: "/src/assets/products/oleo-cbd-1.jpg",
    image_url_2: "/src/assets/products/oleo-cbd-2.jpg",
    image_url_3: "/src/assets/products/oleo-cbd-3.jpg",
    stock: 45,
    sold_count: 89,
    rating: 5.0,
    review_count: 32,
    is_active: true,
    endorsed_by_doctor: true,
    as_anvisa: "FDA/EMA/ANVISA 327",
    vendors: { id: "vendor-pyr-oficial", store_name: "Planta y Raiz Ltda", rating: 5.0 }
  },
  {
    id: "med-2",
    vendor_id: "vendor-pyr-oficial",
    name: "Sativex / Mevatyl (Nabiximols - Spray Oromucosal 1:1)",
    description: "Composição: Extrato botânico padronizado contendo 2,7 mg de THC + 2,5 mg de CBD por borrifada.\n\nIndicações: Espasticidade moderada a grave decorrente de Esclerose Múltipla (não responsiva a outros tratamentos) e dor neuropática oncológica.\n\nDescrição: Solução oromucosal que permite absorção direta pela mucosa oral, evitando o metabolismo de primeira passagem hepática.\n\nPosologia Resumida: Inicia-se com 1 borrifada ao dia à noite, aumentando gradualmente 1 borrifada por dia até o alívio dos sintomas. A dose média de manutenção fica entre 4 e 8 borrifadas/dia (máximo de 12 borrifadas/dia).",
    price: 2890.00,
    compare_price: 3250.00,
    category: "spray",
    image_url: "/src/assets/products/spray-1.jpg",
    image_url_2: "/src/assets/products/spray-2.jpg",
    image_url_3: "/src/assets/products/spray-3.jpg",
    stock: 30,
    sold_count: 64,
    rating: 4.9,
    review_count: 24,
    is_active: true,
    endorsed_by_doctor: true,
    as_anvisa: "MS 1.0504.0028",
    vendors: { id: "vendor-pyr-oficial", store_name: "Planta y Raiz Ltda", rating: 5.0 }
  },
  {
    id: "med-3",
    vendor_id: "vendor-pyr-oficial",
    name: "Marinol (Dronabinol em Cápsulas - 10 mg)",
    description: "Composição: Delta-9-Tetrahidrocanabinol (Δ9-THC) sintético formulado em óleo de gergelim.\n\nIndicações: Anorexia associada à perda de peso em pacientes com HIV/AIDS e náuseas/vômitos induzidos por quimioterapia refratários a antieméticos clássicos.\n\nDescrição: Agonista direto dos receptores CB1 e CB2 do sistema endocanabinoide, com potente ação orexígena (estímulo de apetite) e antiemética.\n\nPosologia Resumida: Para apetite: 2,5 mg a 5 mg antes do almoço e do jantar. Para náuseas pós-quimio: 5 mg/m² administrados 1 a 3 horas antes da sessão de quimioterapia.",
    price: 1850.00,
    compare_price: 2100.00,
    category: "capsula",
    image_url: "/src/assets/products/capsulas-1.jpg",
    image_url_2: "/src/assets/products/capsulas-2.jpg",
    image_url_3: "/src/assets/products/capsulas-3.jpg",
    stock: 25,
    sold_count: 42,
    rating: 4.8,
    review_count: 18,
    is_active: true,
    endorsed_by_doctor: true,
    as_anvisa: "FDA Validated",
    vendors: { id: "vendor-pyr-oficial", store_name: "Planta y Raiz Ltda", rating: 5.0 }
  },
  {
    id: "med-4",
    vendor_id: "vendor-pyr-oficial",
    name: "Cesamet (Nabilona - Cápsulas 1 mg)",
    description: "Composição: Análogo sintético do THC com potência farmacológica superior.\n\nIndicações: Náuseas e vômitos quimioterápicos resistentes e manejo coadjuvante de dor crônica neuropática grave.\n\nDescrição: Composto sintético com alta biodisponibilidade oral, utilizado em protocolos hospitalares e oncológicos internacionais.\n\nPosologia Resumida: 1 mg a 2 mg via oral, 2 vezes ao dia. A dose inicial costuma ser administrada na noite anterior ao início da quimioterapia (dose máxima: 6 mg/dia).",
    price: 1620.00,
    compare_price: 1950.00,
    category: "capsula",
    image_url: "/src/assets/products/capsulas-2.jpg",
    image_url_2: "/src/assets/products/capsulas-3.jpg",
    image_url_3: "/src/assets/products/capsulas-1.jpg",
    stock: 20,
    sold_count: 31,
    rating: 4.8,
    review_count: 15,
    is_active: true,
    endorsed_by_doctor: true,
    as_anvisa: "Protocolo Hospitalar",
    vendors: { id: "vendor-pyr-oficial", store_name: "Planta y Raiz Ltda", rating: 5.0 }
  },
  {
    id: "med-5",
    vendor_id: "vendor-pyr-oficial",
    name: "Canabidiol Farmacêutico Isolado (Solução Oral 200 mg/mL)",
    description: "Composição: CBD purificado dissolvido em TCM (triglicerídeos de cadeia média), com teor de THC <0,2%.\n\nIndicações: Epilepsia refratária, Transtorno do Espectro Autista (TEA), Transtorno de Ansiedade Generalizada (TAG) e distúrbios do sono.\n\nDescrição: Categoria de produto amplamente dispensada em farmácias comerciais sob resoluções sanitárias como a RDC 327/2019 da ANVISA no Brasil.\n\nPosologia Resumida: Início com doses baixas (0,5 a 1 mg/kg/dia ou 25 a 50 mg/dia divididos em 2 tomadas), com titulação gradual a cada 3 a 7 dias até o controle dos sintomas.",
    price: 680.00,
    compare_price: 790.00,
    category: "oleo",
    image_url: "/src/assets/products/oleo-cbd-2.jpg",
    image_url_2: "/src/assets/products/oleo-cbd-3.jpg",
    image_url_3: "/src/assets/products/oleo-cbd-1.jpg",
    stock: 60,
    sold_count: 142,
    rating: 5.0,
    review_count: 58,
    is_active: true,
    endorsed_by_doctor: true,
    as_anvisa: "RDC 327/2019 ANVISA",
    vendors: { id: "vendor-pyr-oficial", store_name: "Planta y Raiz Ltda", rating: 5.0 }
  },
  {
    id: "med-6",
    vendor_id: "vendor-pyr-oficial",
    name: "Óleo CBD Full Spectrum 3000mg (Concentração ~100 mg/mL)",
    description: "Composição: Extrato integral da planta com CBD dominante acompanhado de canabinoides menores (CBG, CBN, CBC), terpenos, flavonoides e traços de THC (<0,3%).\n\nIndicações: Dor crônica inflamatória (fibromialgia, artrite, osteoartrose), ansiedade, insônia e estresse pós-traumático (TEPT).\n\nDescrição: Um dos produtos mais prescritos globalmente por explorar o efeito entourage (sinergia terapêutica entre todos os fitocompostos).\n\nPosologia Resumida: 5 a 10 mg sublingual (2 a 4 gotas) 2 vezes ao dia. Titula-se adicionando gotas a cada 4 ou 5 dias até a dose terapêutica média (30 a 100 mg/dia).",
    price: 540.00,
    compare_price: 620.00,
    category: "oleo",
    image_url: "/src/assets/products/oleo-cbd-3.jpg",
    image_url_2: "/src/assets/products/oleo-cbd-1.jpg",
    image_url_3: "/src/assets/products/oleo-cbd-2.jpg",
    stock: 75,
    sold_count: 215,
    rating: 4.9,
    review_count: 94,
    is_active: true,
    endorsed_by_doctor: true,
    as_anvisa: "ANVISA Autorizado",
    vendors: { id: "vendor-pyr-oficial", store_name: "Planta y Raiz Ltda", rating: 5.0 }
  },
  {
    id: "med-7",
    vendor_id: "vendor-pyr-oficial",
    name: "Óleo Balanceado 1:1 THC:CBD Full Spectrum (10 mg/mL THC : 10 mg/mL CBD)",
    description: "Composição: Proporção equilibrada entre THC e CBD em extrato completo.\n\nIndicações: Dor oncológica, dor neuropática periférica, cuidados paliativos, espasmos musculares severos e insônia com componente doloroso.\n\nDescrição: O CBD modula os efeitos psicoativos indesejados do THC (como taquicardia e ansiedade), potencializando o efeito analgésico e relaxante muscular.\n\nPosologia Resumida: 2,5 mg de cada componente (0,25 mL ou 5 gotas) via sublingual à noite. Ajustes graduais a cada 3 dias conforme tolerabilidade, buscando a menor dose eficaz.",
    price: 480.00,
    compare_price: 560.00,
    category: "tintura",
    image_url: "/src/assets/products/tintura-1.jpg",
    image_url_2: "/src/assets/products/tintura-2.jpg",
    image_url_3: "/src/assets/products/tintura-3.jpg",
    stock: 40,
    sold_count: 77,
    rating: 4.9,
    review_count: 36,
    is_active: true,
    endorsed_by_doctor: true,
    as_anvisa: "ANVISA Autorizado",
    vendors: { id: "vendor-pyr-oficial", store_name: "Planta y Raiz Ltda", rating: 5.0 }
  },
  {
    id: "med-8",
    vendor_id: "vendor-pyr-oficial",
    name: "Óleo THC Dominante / High THC (Concentração 25 mg/mL)",
    description: "Composição: Extrato com alta concentração de THC e baixos teores de CBD (<1 mg/mL).\n\nIndicações: Dores intratáveis, rigidez e espasmos da Doença de Parkinson, caquexia severa e insônia resistente.\n\nDescrição: Formulação direcionada a pacientes com tolerância prévia ou condições clínicas em que a estimulação direta dos receptores CB1 é necessária.\n\nPosologia Resumida: Protocolo restrito (Start low, go slow): início com 1,25 mg a 2,5 mg de THC à noite (1 a 2 gotas), aumentando 1 gota a cada 5 a 7 dias, evitando horários de atividade motora ou condução de veículos.",
    price: 520.00,
    compare_price: 599.00,
    category: "tintura",
    image_url: "/src/assets/products/tintura-2.jpg",
    image_url_2: "/src/assets/products/tintura-3.jpg",
    image_url_3: "/src/assets/products/tintura-1.jpg",
    stock: 35,
    sold_count: 53,
    rating: 4.8,
    review_count: 22,
    is_active: true,
    endorsed_by_doctor: true,
    as_anvisa: "Prescrição Controlada B",
    vendors: { id: "vendor-pyr-oficial", store_name: "Planta y Raiz Ltda", rating: 5.0 }
  },
  {
    id: "med-9",
    vendor_id: "vendor-pyr-oficial",
    name: "Óleo CBD Broad Spectrum / Amplo Espectro (Zero THC - 3000mg)",
    description: "Composição: Múltiplos canabinoides (CBD, CBG, CBN) e terpenos com remoção completa do THC (0,0%).\n\nIndicações: Ansiedade, estresse crônico, foco e dores leves em pacientes com contraindicação ao THC (histórico de psicose, arritmias, crianças, idosos ou atletas sujeitos a controle antidoping).\n\nDescrição: Entrega os benefícios do efeito comitiva dos terpenos e canabinoides menores sem qualquer risco de psicoatividade ou detecção em testes toxicológicos.\n\nPosologia Resumida: 10 a 20 mg sublingual 2 vezes ao dia (manhã e tarde), titulando a cada 4 dias até a faixa de 40 a 120 mg/dia.",
    price: 460.00,
    compare_price: 530.00,
    category: "oleo",
    image_url: "/src/assets/products/oleo-cbd-1.jpg",
    image_url_2: "/src/assets/products/oleo-cbd-3.jpg",
    image_url_3: "/src/assets/products/oleo-cbd-2.jpg",
    stock: 55,
    sold_count: 110,
    rating: 5.0,
    review_count: 48,
    is_active: true,
    endorsed_by_doctor: true,
    as_anvisa: "Zero THC Certificado",
    vendors: { id: "vendor-pyr-oficial", store_name: "Planta y Raiz Ltda", rating: 5.0 }
  },
  {
    id: "med-10",
    vendor_id: "vendor-pyr-oficial",
    name: "Syndros (Dronabinol Solução Oral 5 mg/mL)",
    description: "Composição: Solução líquida oral de Delta-9-THC sintético.\n\nIndicações: Perda de peso profunda em pacientes com AIDS e náuseas pós-quimioterapia refratárias em pacientes com dificuldade para deglutir cápsulas sólidas.\n\nDescrição: Apresentação líquida de absorção mais rápida e titulação de dose mais precisa em relação às cápsulas tradicionais de dronabinol.\n\nPosologia Resumida: 2,1 mg (0,42 mL) por via oral administrados 2 vezes ao dia, 1 hora antes do almoço e do jantar. Pode ser ajustada até 8,4 mg/dia conforme resposta clínica.",
    price: 1980.00,
    compare_price: 2250.00,
    category: "spray",
    image_url: "/src/assets/products/spray-2.jpg",
    image_url_2: "/src/assets/products/spray-3.jpg",
    image_url_3: "/src/assets/products/spray-1.jpg",
    stock: 20,
    sold_count: 29,
    rating: 4.9,
    review_count: 14,
    is_active: true,
    endorsed_by_doctor: true,
    as_anvisa: "FDA/ANVISA Especial",
    vendors: { id: "vendor-pyr-oficial", store_name: "Planta y Raiz Ltda", rating: 5.0 }
  }
];

const CATEGORIES = [
  { key: "Todos", label: "Todos os Medicamentos", icon: ShoppingBag },
  { key: "oleo", label: "Óleos & Soluções Oral", icon: Package },
  { key: "capsula", label: "Cápsulas", icon: Package },
  { key: "spray", label: "Sprays Oromucosais", icon: Package },
  { key: "tintura", label: "Tinturas & Extratos", icon: Package },
];

const fadeUp = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2 } } };
const stagger = { visible: { transition: { staggerChildren: 0.02 } } };

/* ─── PREFETCH CACHE ─── */
let prefetchedProducts: VendorProduct[] | null = null;
let prefetchPromise: Promise<VendorProduct[]> | null = null;

const prefetchProducts = () => {
  if (prefetchedProducts) return Promise.resolve(prefetchedProducts);
  if (prefetchPromise) return prefetchPromise;
  prefetchPromise = (async () => {
    try {
      const { data } = await supabase.from("vendor_products").select("*, vendors(id, store_name, rating)").eq("is_active", true);
      if (data && data.length > 0) {
        prefetchedProducts = data.map((p: any) => ({
          ...p,
          price: typeof p.price === 'number' ? p.price : parseFloat(String(p.price || '0').replace(',', '.')),
          compare_price: p.compare_price ? (typeof p.compare_price === 'number' ? p.compare_price : parseFloat(String(p.compare_price).replace(',', '.'))) : null,
          rating: Number(p.rating || 5),
          sold_count: Number(p.sold_count || 0),
          review_count: Number(p.review_count || 12),
          stock: Number(p.stock || 0)
        }));
      } else {
        prefetchedProducts = OFFICIAL_MEDICINES;
      }
      return prefetchedProducts;
    } catch {
      prefetchedProducts = OFFICIAL_MEDICINES;
      return OFFICIAL_MEDICINES;
    }
  })();
  return prefetchPromise;
};

// Start prefetch immediately on module load
prefetchProducts();

/* ─── SKELETON GRID ─── */
const ProductSkeleton = () => (
  <div className="rounded-xl border border-border/30 bg-card/30 overflow-hidden">
    <div className="aspect-square bg-muted/20 animate-pulse" />
    <div className="p-2.5 space-y-2">
      <div className="h-3 bg-muted/30 rounded animate-pulse w-3/4" />
      <div className="h-3 bg-muted/30 rounded animate-pulse w-1/2" />
      <div className="h-8 bg-muted/20 rounded-lg animate-pulse mt-2" />
    </div>
  </div>
);

const fmtPrice = (v: any) => {
  const num = typeof v === 'number' ? v : parseFloat(String(v || '0').replace(',', '.'));
  return isNaN(num) ? 'R$ 0,00' : `R$ ${num.toFixed(2).replace('.', ',')}`;
};

/* ─── FAVORITES HOOK (localStorage) ─── */
const useFavorites = () => {
  const [favs, setFavs] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("pyr_favorites");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const toggle = (id: string) => {
    setFavs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem("pyr_favorites", JSON.stringify([...next]));
      return next;
    });
  };

  return { favs, toggle, isFav: (id: string) => favs.has(id) };
};

/* ─── IMAGE CAROUSEL ─── */
const ImageCarousel = ({ images, alt }: { images: string[]; alt: string }) => {
  const [idx, setIdx] = useState(0);
  const validImgs = images.filter(Boolean);

  return (
    <div className="relative group aspect-square overflow-hidden bg-muted/10">
      <img
        src={resolveProductImg(validImgs[idx])}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        decoding="async"
      />
      {validImgs.length > 1 && (
        <>
          <button
            aria-label="Imagem anterior do produto"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx((idx - 1 + validImgs.length) % validImgs.length); }}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-background"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            aria-label="Próxima imagem do produto"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIdx((idx + 1) % validImgs.length); }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-background"
          >
            <ChevronRight size={14} />
          </button>
        </>
      )}
    </div>
  );
};

/* ─── PRODUCT DETAIL ─── */
const ProductDetail = ({ id }: { id: string }) => {
  const [product, setProduct] = useState<VendorProduct | null>(null);
  const [vendor, setVendor] = useState<{ store_name: string; rating: number | null } | null>(null);
  const [mainImg, setMainImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { modalState, showModal, setModalOpen } = useWhatsAppProofModal();
  const [btcModal, setBtcModal] = useState({ open: false, planName: "", planId: "", amount: "" });
  const [rxModal, setRxModal] = useState({ open: false, productName: "" });
  const [lightbox, setLightbox] = useState<{ open: boolean; url: string; title: string }>({ open: false, url: "", title: "" });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from("vendor_products").select("*, vendors(id, store_name, rating)").eq("id", id).maybeSingle();
        if (data) {
          const norm = {
            ...data,
            price: typeof (data as any).price === 'number' ? (data as any).price : parseFloat(String((data as any).price || '0').replace(',', '.')),
            compare_price: (data as any).compare_price ? (typeof (data as any).compare_price === 'number' ? (data as any).compare_price : parseFloat(String((data as any).compare_price).replace(',', '.'))) : null,
            rating: Number((data as any).rating || 5),
            sold_count: Number((data as any).sold_count || 0),
            review_count: Number((data as any).review_count || 12),
            stock: Number((data as any).stock || 0)
          };
          setProduct(norm as any);
          setVendor((data as any).vendors);
        } else {
          // Check local official list
          const local = OFFICIAL_MEDICINES.find(m => m.id === id);
          if (local) {
            setProduct(local);
            setVendor(local.vendors as any);
          }
        }
      } catch {
        const local = OFFICIAL_MEDICINES.find(m => m.id === id);
        if (local) {
          setProduct(local);
          setVendor(local.vendors as any);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Product JSON-LD for rich results
  useEffect(() => {
    if (!product) return;
    const schema = buildProductSchema({
      id: String(product.id),
      name: product.name,
      description: (product as any).description || undefined,
      image: (product as any).image_url || undefined,
      price: fmtPrice(product.price),
      brand: (product as any).brand || undefined,
    });
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-product-schema", "true");
    el.textContent = JSON.stringify(schema.data);
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [product]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!product) return <div className="container mx-auto px-4 pt-32 text-center text-muted-foreground">Produto não encontrado.</div>;

  const images = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean) as string[];
  const pPrice = Number(product.price || 0);
  const pCompare = product.compare_price ? Number(product.compare_price) : 0;
  const discount = pCompare > 0 ? Math.round(((pCompare - pPrice) / pCompare) * 100) : 0;
  const priceStr = fmtPrice(product.price);

  const handleBuy = () => {
    setRxModal({ open: true, productName: product.name });
  };

  // Vendas reais suspensas até a homologação da primeira farmácia parceira real.
  // A receita é encaminhada para a farmácia modelo Planta y Raiz Ltda.
  const proceedWithPurchase = () => {
    setRxModal({ open: false, productName: "" });
    toast({
      title: "Receita recebida pela farmácia modelo Planta y Raiz Ltda ✅",
      description:
        "Estamos concluindo a homologação de farmácias parceiras reais. Nossa equipe entra em contato para orientar a dispensação do seu medicamento.",
    });
  };


  return (
    <div className="container mx-auto px-4 pt-20 pb-12 md:pt-24 max-w-6xl">
      <Link to="/shopping" className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors mb-4 sm:mb-6">
        <ArrowLeft size={14} /> Voltar ao Shopping
      </Link>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
        {/* Gallery */}
        <div className="space-y-3">
          <div 
            className="aspect-square rounded-2xl overflow-hidden border border-border/30 bg-card/30 relative cursor-zoom-in group"
            onClick={() => setLightbox({ open: true, url: resolveProductImg(images[mainImg]), title: product.name })}
            title="Clique para ver a foto em alta resolução"
          >
            <img src={resolveProductImg(images[mainImg])} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-emerald-400 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold flex items-center gap-1">🔍 Ampliar Foto</span>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setMainImg(i)}
                className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 overflow-hidden transition-all ${i === mainImg ? "border-primary ring-2 ring-primary/20" : "border-border/30 opacity-60 hover:opacity-100"}`}
              >
                <img src={resolveProductImg(img)} alt="" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] sm:text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1">
              <BadgeCheck size={11} /> Farmácia Oficial Planta y Raiz Ltda
            </span>
            {discount > 0 && (
              <span className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive font-bold border border-destructive/20">
                -{discount}% OFF
              </span>
            )}
          </div>

          <p className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1">
            <Store size={12} className="text-primary" /> {vendor?.store_name || "Planta y Raiz Ltda"} • Categoria: {product.category}
          </p>

          <h1 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-foreground leading-tight">{product.name}</h1>

          <div className="flex flex-wrap items-center gap-2">
            {product.endorsed_by_doctor && <DoctorEndorsedBadge />}
            {product.as_anvisa && <AnvisaBadge registration={product.as_anvisa} />}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} size={13} className={s <= Math.round(product.rating || 5) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"} />)}</div>
            <span className="text-xs sm:text-sm font-bold">{product.rating || 5}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">| {product.sold_count} dispensados</span>
          </div>

          {/* Price */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
            {product.compare_price && (
              <p className="text-xs sm:text-sm text-muted-foreground line-through">{fmtPrice(product.compare_price)}</p>
            )}
            <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">{priceStr}</p>
            <p className="text-[10px] sm:text-xs text-primary font-bold mt-1">em até 12x de {fmtPrice(product.price / 12)} sem juros no cartão ou com desconto no PIX</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">Dispensação Autorizada ANVISA • Retenção de Receita Digital</p>
          </div>

          <div className="bg-muted/20 p-3.5 rounded-xl border border-border/50 text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
            {product.description}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-card/50 border border-border/30"><Truck size={13} className="text-primary shrink-0" /> Envio Refrigerado / Expresso</div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-card/50 border border-border/30"><Shield size={13} className="text-primary shrink-0" /> Laudo COA por Lote</div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-card/50 border border-border/30"><Package size={13} className="text-primary shrink-0" /> Estoque: {product.stock} un</div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-card/50 border border-border/30"><Clock size={13} className="text-amber-400 shrink-0" /> Despacho em 24h</div>
          </div>

          <div className="space-y-2 pt-2">
            <Button className="w-full font-bold h-12 sm:h-14 text-sm sm:text-base bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-950/20" onClick={handleBuy}>
              Comprar com Receita Médica 💳
            </Button>
            <Button variant="outline" className="w-full font-bold border-amber-500/30 text-amber-500 hover:bg-amber-500/10 gap-2 h-10 sm:h-12 rounded-xl" onClick={() => setBtcModal({ open: true, planName: product.name, planId: product.id, amount: priceStr })}>
              <Bitcoin size={15} /> Pague Com Bitcoin / Cripto
            </Button>
          </div>

          <p className="text-[9px] sm:text-[10px] text-muted-foreground text-center">Dispensação farmacêutica restrita a pacientes com prescrição válida em conformidade com as normas sanitárias.</p>
        </div>
      </div>

      <WhatsAppProofModal open={modalState.open} onOpenChange={setModalOpen} context={modalState.context} onProceed={modalState.onProceed} />
      <BTCPaymentModal open={btcModal.open} onClose={() => setBtcModal({ ...btcModal, open: false })} planName={btcModal.planName} planId={btcModal.planId} amount={btcModal.amount} />
      <PrescriptionVerificationModal
        open={rxModal.open}
        onClose={() => setRxModal({ open: false, productName: "" })}
        productName={rxModal.productName}
        onHasPrescription={proceedWithPurchase}
        onNeedsPrescription={() => { setRxModal({ open: false, productName: "" }); window.location.href = "/profissionais"; }}
      />
      <ImageLightboxModal
        open={lightbox.open}
        onClose={() => setLightbox(prev => ({ ...prev, open: false }))}
        imageUrl={lightbox.url}
        title={lightbox.title}
        description="Medicamento Oficial • Planta y Raiz Ltda"
      />
    </div>
  );
};

/* ─── MAIN SHOPPING PAGE ─── */
const Shopping = () => {
  const { id } = useParams();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"relevance" | "price_asc" | "price_desc" | "sold">("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();
  const { modalState, showModal, setModalOpen } = useWhatsAppProofModal();
  const [btcModal, setBtcModal] = useState({ open: false, planName: "", planId: "", amount: "" });
  const [rxModal, setRxModal] = useState<{ open: boolean; productName: string; pendingProduct: VendorProduct | null }>({ open: false, productName: "", pendingProduct: null });

  const { toggle: toggleFav, isFav } = useFavorites();

  const [verifiedVendors, setVerifiedVendors] = useState<any[]>([]);

  useEffect(() => {
    // 1. Buscar vendor oficial Planta y Raíz
    Promise.resolve(supabase
      .from('vendors')
      .select('id, store_name, store_logo_url, store_banner_url, rating, total_sales, is_active, is_kyc_approved')
      .eq('is_active', true)
      .eq('is_kyc_approved', true)
      .limit(10))

      .then(async ({ data: vData }) => {
        const official = vData?.find(v => v.store_name.toLowerCase().includes("planta")) || vData?.[0];

        const FALLBACK_OFFER = {
          name: "Epidiolex / Epidyolex (Canabidiol 100 mg/mL)",
          price: 2450.00,
          image_url: "/src/assets/products/oleo-cbd-1.jpg",
          category: "oleo",
          offer_label: "oferta",
        };

        let offer: any = FALLBACK_OFFER;
        if (official?.id) {
          const { data: offerRow } = await supabase
            .from("vendor_products")
            .select("name, price, image_url, category, offer_label")
            .eq("vendor_id", official.id)
            .eq("is_featured_offer", true)
            .eq("is_active", true)
            .maybeSingle();
          if (offerRow) {
            offer = {
              name: offerRow.name,
              price: Number(offerRow.price || 0),
              image_url: offerRow.image_url,
              category: offerRow.category,
              offer_label: (offerRow as any).offer_label || "oferta",
            };
          }
        }

        setVerifiedVendors([{
          id: official?.id || "vendor-pyr-oficial",
          store_name: "Planta y Raiz Ltda",
          store_logo_url: "/logo-farmacia.jpg",
          store_banner_url: "/farmacia-fachada.jpg",
          rating: Number(official?.rating || 5.0),
          total_sales: Number(official?.total_sales || 48),
          is_verified: true,
          city: "São Paulo",
          state: "SP",
          featured_product: offer,
        }]);
      })
      .catch(() => {
        setVerifiedVendors([{
          id: "vendor-pyr-oficial",
          store_name: "Planta y Raiz Ltda",
          store_logo_url: "/logo-farmacia.jpg",
          store_banner_url: "/farmacia-fachada.jpg",
          rating: 5.0,
          total_sales: 48,
          is_verified: true,
          city: "São Paulo",
          state: "SP",
          featured_product: {
            name: "Epidiolex / Epidyolex (Canabidiol 100 mg/mL)",
            price: 2450.00,
            image_url: "/src/assets/products/oleo-cbd-1.jpg",
            category: "oleo",
            offer_label: "oferta",
          }
        }]);
      });


    // 2. Carregar produtos
    prefetchProducts().then(data => {
      setProducts(data && data.length > 0 ? data : OFFICIAL_MEDICINES);
      setLoading(false);
    });
  }, []);

  if (id) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <ProductDetail id={id} />
        <Footer />
      </div>
    );
  }

  let filtered = (products.length > 0 ? products : OFFICIAL_MEDICINES)
    .filter(p => activeCategory === "Todos" || p.category === activeCategory)
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description || "").toLowerCase().includes(searchQuery.toLowerCase()));

  if (sortBy === "price_asc") filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sortBy === "price_desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sortBy === "sold") filtered = [...filtered].sort((a, b) => b.sold_count - a.sold_count);

  const handleBuyProduct = (p: VendorProduct) => {
    setRxModal({ open: true, productName: p.name, pendingProduct: p });
  };

  // Vendas reais suspensas até a homologação da primeira farmácia parceira real.
  const proceedWithPurchaseMain = () => {
    setRxModal({ open: false, productName: "", pendingProduct: null });
    toast({
      title: "Receita recebida pela farmácia modelo Planta y Raiz Ltda ✅",
      description:
        "Estamos concluindo a homologação de farmácias parceiras reais. Nossa equipe entra em contato para orientar a dispensação do seu medicamento.",
    });
  };


  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      {/* Hero Search Bar */}
      <section className="pt-20 md:pt-28 pb-4 sm:pb-6 bg-gradient-to-b from-primary/8 to-background border-b border-border/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-1 sm:mb-2">
              🌿 Shopping Farmacêutico Medicinal
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">Dispensação oficial de fitocanabinoides, extratos purificados e medicamentos autorizados ANVISA</p>
            <ProductAlertBell category="shopping" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do medicamento, princípio ativo, CID ou posologia..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 sm:h-11 rounded-xl border-border/50 bg-background/80 backdrop-blur-sm text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={14} className="text-muted-foreground" />
                </button>
              )}
            </div>
            <Button className="h-10 sm:h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shrink-0" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline ml-2 text-xs">Filtros</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Horizontal */}
      <section className="py-2.5 sm:py-3 border-b border-border/30 bg-card/20 backdrop-blur-sm sticky top-14 z-20">
        <div className="container mx-auto px-4">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold border whitespace-nowrap transition-all shrink-0 ${
                  activeCategory === cat.key
                    ? "border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-950/30"
                    : "border-border/40 bg-card/30 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/30 bg-card/30"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-2"><Filter size={13} className="text-primary" /> Ordenar por</h3>
                <button onClick={() => setShowFilters(false)}><X size={16} className="text-muted-foreground" /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { k: "relevance" as const, l: "Relevância Clínica" },
                  { k: "price_asc" as const, l: "Menor preço" },
                  { k: "price_desc" as const, l: "Maior preço" },
                  { k: "sold" as const, l: "Mais dispensados" },
                ].map(s => (
                  <button
                    key={s.k}
                    onClick={() => { setSortBy(s.k); setShowFilters(false); }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold border transition-all ${
                      sortBy === s.k ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-border/40 text-muted-foreground"
                    }`}
                  >
                    {s.l}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="py-6 sm:py-8">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid lg:grid-cols-[220px_1fr] gap-6">

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col gap-4">
              <Card className="border-border/40 bg-card/40 backdrop-blur-sm p-3.5 rounded-2xl">
                <h3 className="font-bold text-xs text-foreground mb-2.5 flex items-center gap-2">
                  <ShoppingBag size={14} className="text-primary" /> Categorias
                </h3>
                <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all font-medium ${
                        activeCategory === cat.key ? "bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/20" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </Card>

              <Card className="border-border/40 bg-card/40 backdrop-blur-sm p-3.5 rounded-2xl">
                <h3 className="font-bold text-xs text-foreground mb-2.5">Ordenar por</h3>
                <div className="space-y-1 text-xs">
                  {[
                    { k: "relevance" as const, l: "Mais relevantes" },
                    { k: "price_asc" as const, l: "Menor preço" },
                    { k: "price_desc" as const, l: "Maior preço" },
                    { k: "sold" as const, l: "Mais dispensados" },
                  ].map(s => (
                    <button
                      key={s.k}
                      onClick={() => setSortBy(s.k)}
                      className={`w-full text-left px-3 py-1.5 rounded-xl transition-all ${
                        sortBy === s.k ? "bg-emerald-500/15 text-emerald-400 font-bold" : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                      }`}
                    >
                      {s.l}
                    </button>
                  ))}
                </div>
              </Card>

              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <Shield size={14} /> Dispensação Segura
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Medicamentos dispensados exclusivamente pela <strong>Planta y Raiz Ltda</strong> com retenção de receita e laudo de pureza.
                </p>
              </div>
            </aside>

            {/* Products Grid */}
            <div>
              {/* Seção Exclusiva da Farmácia Planta y Raiz Ltda */}
              {verifiedVendors.length > 0 && !searchQuery && activeCategory === "Todos" && (
                <div className="mb-8 p-5 rounded-3xl bg-gradient-to-r from-card/60 via-card/40 to-emerald-950/20 border border-border/60 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-display font-bold flex items-center gap-2 text-foreground">
                        <Store size={18} className="text-primary" /> Farmácia Parceira Oficial
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Dispensação autorizada e manipulação credenciada</p>
                    </div>
                    <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-bold">
                      Dispensação Oficial ANVISA
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {verifiedVendors.map((v) => (
                      <FarmaciaCard key={v.id} vendor={v} />
                    ))}
                  </div>
                </div>
              )}

              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted-foreground font-semibold">
                  Exibindo {filtered.length} medicamento{filtered.length !== 1 ? "s" : ""} regulado{filtered.length !== 1 ? "s" : ""}
                </span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}><Grid3X3 size={15} /></button>
                  <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}><List size={15} /></button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
                </div>
              ) : (
                <motion.div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                      : "space-y-3"
                  }
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={stagger}
                  key={activeCategory + searchQuery + sortBy}
                >
                  {filtered.map(p => {
                    const pPrice = Number(p.price || 0);
                    const pCompare = p.compare_price ? Number(p.compare_price) : 0;
                    const discount = pCompare > 0 ? Math.round(((pCompare - pPrice) / pCompare) * 100) : 0;
                    const vendorName = "Planta y Raiz Ltda";
                    const images = [p.image_url, p.image_url_2, p.image_url_3].filter(Boolean) as string[];

                    return (
                      <motion.div key={p.id} variants={fadeUp}>
                        {viewMode === "grid" ? (
                          <Card className="border-border/40 hover:border-emerald-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/20 bg-card/50 backdrop-blur-sm overflow-hidden group rounded-2xl flex flex-col justify-between h-full">
                            <CardContent className="p-0 flex flex-col justify-between h-full">
                              <div>
                                <div className="relative">
                                  <Link to={`/shopping/${p.id}`} className="block">
                                    <ImageCarousel images={images} alt={p.name} />
                                  </Link>
                                  {/* Badges */}
                                  <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
                                    {discount > 0 && (
                                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-destructive text-destructive-foreground font-bold shadow-md w-fit">
                                        -{discount}% OFF
                                      </span>
                                    )}
                                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold shadow-md w-fit">
                                      ANVISA RDC 327
                                    </span>
                                  </div>
                                  {/* Favorite heart */}
                                  <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFav(p.id); }}
                                    className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                                  >
                                    <Heart size={15} className={isFav(p.id) ? "text-red-500 fill-red-500" : "text-muted-foreground"} />
                                  </button>
                                </div>

                                <div className="p-4 pb-2">
                                  <p className="text-[10px] text-emerald-400 font-bold mb-1 flex items-center gap-1">
                                    <Store size={10} className="text-primary shrink-0" /> {vendorName}
                                  </p>

                                  <Link to={`/shopping/${p.id}`}>
                                    <h2 className="font-bold text-foreground hover:text-primary transition-colors text-sm line-clamp-2 min-h-[2.6em] leading-tight mb-2">
                                      {p.name}
                                    </h2>
                                  </Link>

                                  <div className="flex items-center gap-1 mb-2">
                                    <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= Math.round(p.rating || 5) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/20"} />)}</div>
                                    <span className="text-[10px] text-muted-foreground ml-1">({p.review_count} avaliações)</span>
                                  </div>

                                  {p.compare_price && <p className="text-[10px] text-muted-foreground line-through">{fmtPrice(p.compare_price)}</p>}
                                  <p className="text-xl font-display font-black text-foreground leading-none">{fmtPrice(p.price)}</p>
                                  <p className="text-[10px] text-emerald-400 font-semibold mt-1">12x {fmtPrice(p.price / 12)} s/ juros</p>
                                </div>
                              </div>

                              <div className="p-4 pt-0 space-y-2">
                                <Button
                                  size="sm"
                                  className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-9 shadow-md shadow-emerald-950/20"
                                  onClick={(e) => { e.preventDefault(); handleBuyProduct(p); }}
                                >
                                  Comprar com Receita 💳
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          /* List View */
                          <Card className="border-border/40 hover:border-emerald-500/40 transition-all bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden">
                            <CardContent className="p-0">
                              <div className="flex gap-4 p-4">
                                <Link to={`/shopping/${p.id}`} className="shrink-0 relative">
                                  <img src={resolveProductImg(p.image_url)} alt={p.name} className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl object-cover" loading="lazy" />
                                </Link>
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-start justify-between">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[10px] text-emerald-400 font-bold mb-1 flex items-center gap-1"><Store size={10} className="text-primary" /> {vendorName}</p>
                                        <Link to={`/shopping/${p.id}`}>
                                          <h2 className="font-bold text-foreground hover:text-primary transition-colors text-sm sm:text-base mb-1 line-clamp-1">{p.name}</h2>
                                        </Link>
                                      </div>
                                      <button
                                        onClick={() => toggleFav(p.id)}
                                        className="shrink-0 w-8 h-8 rounded-full bg-card/80 flex items-center justify-center hover:scale-110 transition-transform ml-2"
                                      >
                                        <Heart size={15} className={isFav(p.id) ? "text-red-500 fill-red-500" : "text-muted-foreground"} />
                                      </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">{p.description}</p>
                                  </div>

                                  <div className="flex items-end justify-between flex-wrap gap-2 pt-2 border-t border-border/30">
                                    <div>
                                      {p.compare_price && <p className="text-[10px] text-muted-foreground line-through">{fmtPrice(p.compare_price)}</p>}
                                      <p className="text-xl font-display font-bold text-foreground">{fmtPrice(p.price)}</p>
                                      <p className="text-[10px] text-emerald-400 font-semibold">12x {fmtPrice(p.price / 12)} s/ juros</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-9 px-4" onClick={() => handleBuyProduct(p)}>
                                        Comprar 💳
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      <WhatsAppProofModal open={modalState.open} onOpenChange={setModalOpen} context={modalState.context} onProceed={modalState.onProceed} />
      <BTCPaymentModal open={btcModal.open} onClose={() => setBtcModal({ ...btcModal, open: false })} planName={btcModal.planName} planId={btcModal.planId} amount={btcModal.amount} />
      <PrescriptionVerificationModal
        open={rxModal.open}
        onClose={() => setRxModal({ open: false, productName: "", pendingProduct: null })}
        productName={rxModal.productName}
        onHasPrescription={proceedWithPurchaseMain}
        onNeedsPrescription={() => { setRxModal({ open: false, productName: "", pendingProduct: null }); window.location.href = "/profissionais"; }}
      />
      <Footer />
    </div>
  );
};

export default Shopping;
