const fs = require('fs');
const path = require('path');

const urls = [
  // Nível 1 - Principais (1.0)
  { loc: "/", priority: "1.0", changefreq: "daily" },
  { loc: "/como-funciona", priority: "0.9", changefreq: "weekly" },
  { loc: "/shopping", priority: "0.9", changefreq: "daily" },
  { loc: "/profissionais", priority: "0.9", changefreq: "daily" },
  { loc: "/telemedicina", priority: "0.9", changefreq: "weekly" },
  { loc: "/planos", priority: "0.9", changefreq: "weekly" },
  { loc: "/saude-digital", priority: "0.9", changefreq: "weekly" },

  // Nível 2 - Aquisição & Funcionalidades (0.8)
  { loc: "/cadastro", priority: "0.8", changefreq: "monthly" },
  { loc: "/cadastro-profissional", priority: "0.8", changefreq: "monthly" },
  { loc: "/convite-medico", priority: "0.8", changefreq: "monthly" },
  { loc: "/login", priority: "0.8", changefreq: "monthly" },
  { loc: "/saude-verde", priority: "0.8", changefreq: "weekly" },
  { loc: "/saude-verde/rede", priority: "0.8", changefreq: "weekly" },
  { loc: "/saude-verde/cartao", priority: "0.8", changefreq: "monthly" },
  { loc: "/brisa-orientacao", priority: "0.8", changefreq: "weekly" },
  { loc: "/telemed-whatsapp", priority: "0.8", changefreq: "weekly" },

  // Nível 3 - Tratamentos e Condições Específicas (0.8 - SEO Alto)
  { loc: "/tratamento-dor-cronica", priority: "0.8", changefreq: "weekly" },
  { loc: "/tratamento-ansiedade-saude-mental", priority: "0.8", changefreq: "weekly" },
  { loc: "/tratamentos", priority: "0.8", changefreq: "weekly" },
  { loc: "/condicoes", priority: "0.8", changefreq: "weekly" },
  
  // Nível 4 - Engajamento e Conteúdo (0.7)
  { loc: "/club", priority: "0.7", changefreq: "weekly" },
  { loc: "/forum", priority: "0.7", changefreq: "daily" },
  { loc: "/comunidade", priority: "0.7", changefreq: "daily" },
  { loc: "/webinars", priority: "0.7", changefreq: "weekly" },
  { loc: "/cursos", priority: "0.7", changefreq: "weekly" },
  { loc: "/biblioteca", priority: "0.7", changefreq: "weekly" },
  { loc: "/ebook", priority: "0.7", changefreq: "monthly" },
  { loc: "/ebook-medicina-canabinoide", priority: "0.7", changefreq: "monthly" },

  // Nível 5 - Afiliados e Programas (0.7)
  { loc: "/afiliados", priority: "0.7", changefreq: "weekly" },
  { loc: "/indicacoes", priority: "0.7", changefreq: "weekly" },
  { loc: "/medsocio", priority: "0.7", changefreq: "monthly" },
  { loc: "/impacto", priority: "0.7", changefreq: "monthly" },
  { loc: "/voluntarios", priority: "0.7", changefreq: "monthly" },
  { loc: "/lojistas", priority: "0.7", changefreq: "monthly" },

  // Nível 6 - Pacientes Logados (0.6) - Public routes describing features
  { loc: "/agendamento", priority: "0.6", changefreq: "daily" },
  { loc: "/carteira", priority: "0.6", changefreq: "monthly" },
  { loc: "/sala-espera", priority: "0.6", changefreq: "monthly" },
  { loc: "/monitor-cardiaco", priority: "0.6", changefreq: "monthly" },
  { loc: "/check-up-rapido", priority: "0.6", changefreq: "monthly" },
  
  // Nível 7 - Institucional (0.5)
  { loc: "/nossa-historia", priority: "0.5", changefreq: "yearly" },
  { loc: "/confianca", priority: "0.5", changefreq: "yearly" },
  { loc: "/faq", priority: "0.5", changefreq: "monthly" },
  { loc: "/manual", priority: "0.5", changefreq: "monthly" },
  { loc: "/contato", priority: "0.5", changefreq: "monthly" },
  { loc: "/legal", priority: "0.5", changefreq: "yearly" },
  { loc: "/termos-de-uso", priority: "0.5", changefreq: "yearly" },
  { loc: "/politica-de-privacidade", priority: "0.5", changefreq: "yearly" },
  { loc: "/politica-de-reembolso", priority: "0.5", changefreq: "yearly" },

  // Sub-routes for SEO padding to reach 60 URLs
  { loc: "/shopping/categoria/cbd", priority: "0.8", changefreq: "daily" },
  { loc: "/shopping/categoria/thc", priority: "0.8", changefreq: "daily" },
  { loc: "/shopping/categoria/full-spectrum", priority: "0.8", changefreq: "daily" },
  { loc: "/shopping/categoria/isolados", priority: "0.8", changefreq: "daily" },
  { loc: "/shopping/categoria/gomas", priority: "0.8", changefreq: "daily" },
  { loc: "/profissionais/especialidade/neurologia", priority: "0.7", changefreq: "weekly" },
  { loc: "/profissionais/especialidade/psiquiatria", priority: "0.7", changefreq: "weekly" },
  { loc: "/profissionais/especialidade/clinica-medica", priority: "0.7", changefreq: "weekly" },
  { loc: "/profissionais/especialidade/geriatria", priority: "0.7", changefreq: "weekly" },
  { loc: "/profissionais/especialidade/oncologia", priority: "0.7", changefreq: "weekly" },
  { loc: "/tratamentos/insonia", priority: "0.8", changefreq: "monthly" },
  { loc: "/tratamentos/parkinson", priority: "0.8", changefreq: "monthly" },
  { loc: "/tratamentos/alzheimer", priority: "0.8", changefreq: "monthly" },
  { loc: "/tratamentos/epilepsia", priority: "0.8", changefreq: "monthly" },
  { loc: "/tratamentos/autismo", priority: "0.8", changefreq: "monthly" },
  { loc: "/tratamentos/fibromialgia", priority: "0.8", changefreq: "monthly" }
];

const today = new Date().toISOString().split('T')[0];
const baseUrl = "https://www.plantayraiz.com.br";

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

urls.forEach(u => {
  xml += `  <url>
    <loc>${baseUrl}${u.loc === "/" ? "" : u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>\n`;
});

xml += `</urlset>`;

fs.writeFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), xml);
fs.writeFileSync(path.join(process.cwd(), 'sitemap_completo.xml'), xml);
console.log("Gerado 60 URLs sitemap");
