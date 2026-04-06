import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import carousel1 from "@/assets/carousel-1.jpg";
import carousel2 from "@/assets/carousel-2.jpg";
import carousel3 from "@/assets/carousel-3.jpg";
import carousel4 from "@/assets/carousel-4.jpg";
import carousel5 from "@/assets/carousel-5.jpg";
import carousel6 from "@/assets/carousel-6.jpg";

const slides = [
  { src: carousel1, alt: "Teleconsulta médica via smartphone" },
  { src: carousel2, alt: "Produtos CBD de qualidade farmacêutica" },
  { src: carousel3, alt: "Paciente feliz com tratamento digital" },
  { src: carousel4, alt: "Marketplace cannabis medicinal" },
  { src: carousel5, alt: "Prescrição digital cannabis" },
  { src: carousel6, alt: "Comunidade de saúde e bem-estar" },
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

  return (
    <div className="relative w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px] mx-auto">
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
                  height={1024}
                  loading={i === 0 ? undefined : "lazy"}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-foreground/30 rounded-full z-20" />
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {slides.map((_, i) => (
          <button
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === selectedIndex
                ? "bg-primary w-6"
                : "bg-muted-foreground/30"
            }`}
            onClick={() => emblaApi?.scrollTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
