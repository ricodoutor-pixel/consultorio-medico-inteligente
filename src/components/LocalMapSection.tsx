import { MapPin, Phone, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LocalMapSection() {
  return (
    <section
      className="border-t border-border bg-card/30 py-12"
      aria-label="Onde Estamos"
      itemScope
      itemType="https://schema.org/LocalBusiness"
    >
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">
          Atendimento em São Paulo
        </h2>
        <p className="text-muted-foreground text-center mb-8 max-w-xl mx-auto text-sm">
          Sede na Av. Paulista — Prescrição Digital para pacientes da capital paulista e todo o Brasil.
        </p>

        <div className="grid md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto">
          {/* Map embed (lite) */}
          <div className="rounded-xl overflow-hidden border border-border aspect-video">
            <iframe
              title="Localização Planta y Raiz — Av. Paulista, São Paulo"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.0!2d-46.6564!3d-23.5632!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sAv.+Paulista%2C+1000+-+Bela+Vista!5e0!3m2!1spt-BR!2sbr!4v1"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Info card */}
          <div className="space-y-5">
            <div className="flex items-start gap-3" itemProp="address" itemScope itemType="https://schema.org/PostalAddress">
              <MapPin className="text-primary mt-1 shrink-0" size={18} />
              <div>
                <p className="font-semibold text-foreground text-sm">Endereço</p>
                <p className="text-muted-foreground text-sm">
                  <span itemProp="streetAddress">Av. Paulista, 1000 — Bela Vista</span><br />
                  <span itemProp="addressLocality">São Paulo</span>, <span itemProp="addressRegion">SP</span> — <span itemProp="postalCode">01310-100</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="text-primary mt-1 shrink-0" size={18} />
              <div>
                <p className="font-semibold text-foreground text-sm">Telefone / WhatsApp</p>
                <a
                  href="tel:+5511991363154"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  itemProp="telephone"
                >
                  (11) 99136-3154
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="text-primary mt-1 shrink-0" size={18} />
              <div>
                <p className="font-semibold text-foreground text-sm">Horários</p>
                <p className="text-muted-foreground text-sm">Telemedicina: <strong>24/7</strong></p>
                <p className="text-muted-foreground text-sm">Suporte: Seg-Sex 08h–18h</p>
              </div>
            </div>

            <Button asChild variant="outline" size="sm" className="mt-2">
              <a
                href="https://www.google.com/maps/place/Av.+Paulista,+1000+-+Bela+Vista,+S%C3%A3o+Paulo+-+SP,+01310-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={14} className="mr-2" />
                Abrir no Google Maps
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
