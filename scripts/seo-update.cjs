const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '..', 'index.html');
let indexHtml = fs.readFileSync(INDEX_PATH, 'utf8');

const structuredData = `
    <!-- Google Site Verification (Placeholder) -->
    <meta name="google-site-verification" content="" />
    
    <!-- Site Name and Canonical Tags -->
    <meta name="application-name" content="Planta y Raíz" />
    <meta property="og:site_name" content="Planta y Raíz" />
    <link rel="canonical" href="https://plantayraiz.com.br" />

    <!-- Entidade JSON-LD (Schema.org) -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": ["MedicalOrganization", "SoftwareApplication", "HealthAndBeautyBusiness"],
      "name": "Planta y Raíz",
      "legalName": "Planta y Raiz Ltda",
      "alternateName": ["Planta y Raiz Telemedicina", "Planta y Raiz Cannabis Medicinal", "Planta y Raiz Healthtech"],
      "disambiguatingDescription": "Plataforma brasileira de telemedicina e acolhimento clínico para prescrição de fitocanabinoides e Cannabis Medicinal (não relacionada à banda musical homônima).",
      "url": "https://plantayraiz.com.br",
      "logo": "https://plantayraiz.com.br/assets/logo-plantayraiz.png",
      "image": "https://plantayraiz.com.br/assets/og-banner.png",
      "telephone": "+5511991363154",
      "priceRange": "R$ 30 - R$ 180",
      "areaServed": {"@type": "Country", "name": "Brazil"},
      "availableService": [
        {"@type": "MedicalTherapy", "name": "Consulta Médica Canabinoide"},
        {"@type": "MedicalTherapy", "name": "Orientação Técnica de Enfermagem"},
        {"@type": "MedicalTherapy", "name": "Renovação de Receita ICP-Brasil"}
      ],
      "sameAs": [
        "https://www.instagram.com/plantayraiz",
        "https://www.linkedin.com/company/plantayraiz"
      ]
    }
    </script>
`;

// Remove all existing application/ld+json script blocks
indexHtml = indexHtml.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');

// Also insert it into head
indexHtml = indexHtml.replace('</head>', structuredData + '\n  </head>');
fs.writeFileSync(INDEX_PATH, indexHtml);
console.log('index.html updated with JSON-LD and meta tags.');

// Write manifest.json
const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
const manifestData = {
  name: "Planta y Raíz Telemedicina",
  short_name: "Planta y Raíz",
  description: "Plataforma brasileira de telemedicina e acolhimento clínico",
  start_url: "/",
  display: "standalone",
  background_color: "#0A0E27",
  theme_color: "#0A0E27",
  icons: [
    {
      src: "/dr-verdinho.png",
      sizes: "192x192",
      type: "image/png"
    },
    {
      src: "/dr-verdinho.png",
      sizes: "512x512",
      type: "image/png"
    }
  ]
};
fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
console.log('public/manifest.json created/updated.');

// Write robots.txt
const robotsPath = path.join(__dirname, '..', 'public', 'robots.txt');
const robotsData = `User-agent: *
Allow: /
Allow: /*

User-agent: Googlebot
Allow: /
Allow: /*

User-agent: Googlebot-Image
Allow: /
Allow: /*

Sitemap: https://plantayraiz.com.br/sitemap.xml
`;
fs.writeFileSync(robotsPath, robotsData);
console.log('public/robots.txt created/updated.');

// Write sitemap.xml
const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
const sitemapData = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://plantayraiz.com.br/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://plantayraiz.com.br/login</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://plantayraiz.com.br/cadastro-profissional</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://plantayraiz.com.br/saude-verde</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
fs.writeFileSync(sitemapPath, sitemapData);
console.log('public/sitemap.xml created/updated.');
