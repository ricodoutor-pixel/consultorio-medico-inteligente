import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "medical_clinic";
}

export const SEO = ({
  title = "Planta y Raiz - Mega Clínica Digital de Cannabis Medicinal",
  description = "Acesso democrático à saúde com telemedicina especializada em cannabis medicinal, triagem por IA e acompanhamento vital 24/7.",
  keywords = "cannabis medicinal, telemedicina, CBD, THC, saúde digital, triagem IA, Dr. Edilson Bezerra",
  image = "/src/assets/verdinho-doctor.png",
  url = "https://plantayraiz.com.br",
  type = "medical_clinic"
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
      "alternateName": "Mega Clínica Digital",
      "url": "https://plantayraiz.com.br",
      "logo": "https://plantayraiz.com.br/src/assets/verdinho-doctor.png",
      "description": description,
      "medicalSpecialty": ["Cannabis Medicinal", "Telemedicina", "Clínica Geral"],
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
