import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
}

export const SEO = ({
  title = "Planta y Raíz — Telemedicina e Saúde Integrativa",
  description = "Telemedicina com médicos habilitados e emissão de receita digital válida em todo o Brasil. A prescrição depende de avaliação médica individualizada conforme Resolução CFM nº 2.314/2022.",
  keywords = "telemedicina, consulta médica online, saúde integrativa, receita médica digital, CFM 2314/2022, orientação médica, Planta y Raiz",
  image = "https://plantayraiz.com.br/dr-verdinho-512.png",
  url = "https://plantayraiz.com.br",
  type = "website"
}: SEOProps) => {

  useEffect(() => {
    document.title = title;
    
    const updateMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    updateMeta("description", description);
    updateMeta("keywords", keywords);
    updateMeta("og:title", title, "property");
    updateMeta("og:description", description, "property");
    updateMeta("og:image", image, "property");
    updateMeta("og:url", url, "property");
    updateMeta("og:type", type, "property");
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", title);
    updateMeta("twitter:description", description);
    updateMeta("twitter:image", image);

    // JSON-LD Structured Data for Medical Clinic
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "MedicalClinic",
      "name": "Planta y Raiz",
      "alternateName": "Planta y Raiz Telemedicina",
      "url": "https://plantayraiz.com.br",
      "logo": "https://plantayraiz.com.br/dr-verdinho-512.png",
      "description": description,
      "medicalSpecialty": ["Telemedicina", "Saúde Integrativa", "Clínica Geral"],
      "availableService": [
        {
          "@type": "MedicalTest",
          "name": "Triagem Inteligente por IA"
        },
        {
          "@type": "MedicalWebPage",
          "name": "Teleconsulta de Cannabis"
        }
      ],
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "BR"
      }
    };

    let scriptElement = document.querySelector('script[type="application/ld+json"]');
    if (!scriptElement) {
      scriptElement = document.createElement("script");
      scriptElement.setAttribute("type", "application/ld+json");
      document.head.appendChild(scriptElement);
    }
    scriptElement.textContent = JSON.stringify(schemaData);
  }, [title, description, keywords, image, url, type]);

  return null;
};
