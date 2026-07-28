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
  title = "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas R$30 - Planta y Raiz Ltda",
  description = "Inicie Agora Seu Tratamento Com Cannabis Medicinal Com Apenas 30rs - Planta y Raiz Ltda a Melhor e Mais Completa Clínica Digital do Planeta! Assistência Jurídica de Ponta a Ponta LGPD-ANVISA-CFM - Orientação Técnica Personalizada Via WhatsApp - Comunidade Científica com mais de 300 mil membros (Supervisão Técnica: Dra. Suelen Naves Rodrigues (CRM-PR 49354)) Cadastro e Ebook Gratuito!",
  keywords = "cannabis medicinal, telemedicina, CBD, THC, saúde digital, triagem IA, supervisão IA 24x7",
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
