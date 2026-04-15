import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import carousel1 from "@/assets/carousel-1.jpg";
import carousel2 from "@/assets/carousel-2.jpg";
import carousel3 from "@/assets/carousel-3.jpg";
import carousel4 from "@/assets/carousel-4.jpg";
import carousel5 from "@/assets/carousel-5.jpg";
import carousel6 from "@/assets/carousel-6.jpg";
import carousel7 from "@/assets/carousel-7.jpg";
import carousel8 from "@/assets/carousel-8.jpg";
import carousel9 from "@/assets/carousel-9.jpg";
import carousel10 from "@/assets/carousel-10.jpg";
import carousel11 from "@/assets/carousel-11.jpg";
import carousel12 from "@/assets/carousel-12.jpg";
import carousel13 from "@/assets/carousel-13.jpg";
import carousel14 from "@/assets/carousel-14.jpg";

const slides = [
  { src: carousel1, alt: "Teleconsulta médica via smartphone" },
  { src: carousel2, alt: "Produtos CBD de qualidade farmacêutica" },
  { src: carousel3, alt: "Paciente feliz com tratamento digital" },
  { src: carousel4, alt: "Marketplace cannabis medicinal" },
  { src: carousel5, alt: "Prescrição digital cannabis" },
  { src: carousel6, alt: "Comunidade de saúde e bem-estar" },
  { src: carousel7, alt: "Consulta médica cannabis medicinal online" },
  { src: carousel8, alt: "Dr. Verdinho - Mascote Planta y Raiz" },
  { src: carousel9, alt: "Brisa - Enfermeira Chefe IA Planta y Raiz" },
  { src: carousel10, alt: "Médico especialista Planta y Raiz" },
  { src: carousel11, alt: "Teleconsulta médica com especialista" },
  { src: carousel12, alt: "App mobile de telemedicina cannabis" },
  { src: carousel13, alt: "Pagamento PIX via Mercado Pago" },
  { src: carousel14, alt: "Produtos cannabis medicinal com prescrição" },
];

export function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3500, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

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

  return (
    <div className="relative w-[240px] xs:w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px] mx-auto">
      {/* Phone frame */}
      <div className="relative rounded-[2.5rem] border-[6px] border-foreground/20 bg-background overflow-hidden shadow-2xl shadow-primary/20">
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
                  loading={i === 0 ? undefined : "lazy"}
                  decoding={i === 0 ? "sync" : "async"}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-foreground/30 rounded-full z-20" />
      </div>

      {/* Pagination dots */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            aria-label={`Ir para slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === selectedIndex
                ? "w-6 h-2 bg-primary"
                : "w-2 h-2 bg-foreground/20 hover:bg-foreground/40"
            }`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <p className="text-center text-xs text-muted-foreground mt-1">
        {selectedIndex + 1} / {slides.length}
      </p>
    </div>
  );
}
