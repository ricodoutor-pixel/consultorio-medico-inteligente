import fs from 'fs';
import path from 'path';

console.log('[AUDIT] Verificando URLs em index.html e sitemaps...');

// 1. Audit public/sitemap.xml
const sitemapPath = path.resolve('public/sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const countBefore = (sitemap.match(/https:\/\/www\.plantayraiz\.com\.br/g) || []).length;
  sitemap = sitemap.replaceAll('https://www.plantayraiz.com.br', 'https://plantayraiz.com.br');
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
  console.log(`[SITEMAP] Corrigidas ${countBefore} URLs de www para canônico direto (sem redirect 301).`);
}

// 2. Audit index.html
const indexHtmlPath = path.resolve('index.html');
if (fs.existsSync(indexHtmlPath)) {
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

  // Corrigir canonical tags duplicadas e www
  indexHtml = indexHtml.replace(
    '<link rel="canonical" href="https://www.plantayraiz.com.br/" />',
    '<link rel="canonical" href="https://plantayraiz.com.br/" />'
  );
  indexHtml = indexHtml.replace(
    '<meta property="og:url" content="https://www.plantayraiz.com.br/" />',
    '<meta property="og:url" content="https://plantayraiz.com.br/" />'
  );
  indexHtml = indexHtml.replace(
    '<meta property="og:image" content="https://www.plantayraiz.com.br/og-image.png">',
    '<meta property="og:image" content="https://plantayraiz.com.br/og-image.png">'
  );
  indexHtml = indexHtml.replace(
    '<meta property="og:image:secure_url" content="https://www.plantayraiz.com.br/og-image.png" />',
    '<meta property="og:image:secure_url" content="https://plantayraiz.com.br/og-image.png" />'
  );
  indexHtml = indexHtml.replace(
    '<meta name="twitter:image" content="https://www.plantayraiz.com.br/og-image.png">',
    '<meta name="twitter:image" content="https://plantayraiz.com.br/og-image.png">'
  );

  // Remover a segunda canonical redundante (linha 275) se existir
  indexHtml = indexHtml.replace('\n    <link rel="canonical" href="https://plantayraiz.com.br" />', '');

  // Otimizar robots para máxima indexação de snippets e Google AI Overview
  if (!indexHtml.includes('max-snippet:-1')) {
    indexHtml = indexHtml.replace(
      '<meta name="robots" content="index, follow, max-image-preview:large" />',
      '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />\n    <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />\n    <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />'
    );
  }

  fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
  console.log('[INDEX.HTML] Otimizado com canonical canônico único e tags avançadas de robôs Googlebot/Bingbot.');
}
