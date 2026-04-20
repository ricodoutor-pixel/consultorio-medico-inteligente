import { useEffect, useState, useCallback, memo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import carousel1 from "@/assets/carousel-1.jpg";

// Lazy-load remaining carousel images
const carouselImports = [
  () => import("@/assets/carousel-2.jpg"),
  () => import("@/assets/carousel-3.jpg"),
  () => import("@/assets/carousel-4.jpg"),
  () => import("@/assets/carousel-5.jpg"),
  () => import("@/assets/carousel-6.jpg"),
  () => import("@/assets/carousel-7.jpg"),
  () => import("@/assets/carousel-8.jpg"),
  () => import("@/assets/carousel-9.jpg"),
  () => import("@/assets/carousel-10.jpg"),
  () => import("@/assets/carousel-11.jpg"),
  () => import("@/assets/carousel-12.jpg"),
  () => import("@/assets/carousel-13.jpg"),
  () => import("@/assets/carousel-14.jpg"),
];

const slideAlts = [
  "Teleconsulta médica via smartphone",
  "Produtos CBD de qualidade farmacêutica",
  "Paciente feliz com tratamento digital",
  "Marketplace cannabis medicinal",
  "Prescrição digital cannabis",
  "Comunidade de saúde e bem-estar",
  "Consulta médica cannabis medicinal online",
  "Dr. Verdinho - Mascote Planta y Raiz",
  "Brisa - Enfermeira Chefe IA Planta y Raiz",
  "Médico especialista Planta y Raiz",
  "Teleconsulta médica com especialista",
  "App mobile de telemedicina cannabis",
  "Pagamento PIX via Mercado Pago",
  "Produtos cannabis medicinal com prescrição",
];

export const HeroCarousel = memo(function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3500, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadedSrcs, setLoadedSrcs] = useState<string[]>([]);

  // Load remaining images after first paint
  useEffect(() => {
    const id = requestIdleCallback
      ? requestIdleCallback(() => loadRest())
      : setTimeout(() => loadRest(), 200);

    function loadRest() {
      Promise.all(carouselImports.map((fn) => fn().then((m) => m.default))).then(
        setLoadedSrcs
      );
    }

    return () => {
      if (typeof cancelIdleCallback !== "undefined") cancelIdleCallback(id as number);
      else clearTimeout(id as number);
    };
  }, []);

  const slides = [
    { src: carousel1, alt: slideAlts[0] },
    ...loadedSrcs.map((src, i) => ({ src, alt: slideAlts[i + 1] })),
  ];

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  const totalSlides = slideAlts.length;

  return (
    <div className="relative w-[240px] xs:w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px] mx-auto">
      {/* Phone frame */}
      <div className="relative rounded-[2.5rem] border-[6px] border-foreground/20 bg-background overflow-hidden shadow-2xl shadow-primary/20 will-change-transform">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-foreground/20 rounded-b-2xl z-20" />

        {/* Carousel */}
        <div ref={emblaRef} className="overflow-hidden aspect-[9/16]">
          <div className="flex h-full">
            {slides.map((slide, i) => (
              <div key={i} className="flex-[0_0_100%] min-w-0 h-full">
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="w-full h-full object-cover"
                  width={640}
                  height={1138}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding={i === 0 ? "sync" : "async"}
                  {...(i === 0 ? { fetchpriority: "high" } : {})}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-foreground/30 rounded-full z-20" />
      </div>

      {/* Slide counter */}
      <p className="text-center text-xs text-muted-foreground mt-3">
        {selectedIndex + 1} / {totalSlides}
      </p>
    </div>
  );
});
