const https = require('https');

const URLS = [
  'https://plantayraiz.com.br',
  'https://plantayraiz.com.br/telemedicina',
  'https://plantayraiz.com.br/admin-login',
  'https://plantayraiz.com.br/planos',
  'https://plantayraiz.com.br/shopping',
  'https://plantayraiz.com.br/manifest.json',
];

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          statusCode: res.statusCode,
          size: data.length,
          title: data.match(/<title>(.*?)<\/title>/i)?.[1] || 'No title found',
          hasBundle: data.includes('/assets/index-')
        });
      });
    }).on('error', (e) => {
      resolve({ url, error: e.message });
    });
  });
}

async function main() {
  console.log("=== AUDITORIA DE STATUS DE PRODUÇÃO (HTTP / HOSTINGER / SSL) ===");
  for (const url of URLS) {
    const res = await checkUrl(url);
    console.log(`[${res.statusCode || 'ERR'}] ${url} -> Size: ${res.size || 0} bytes | Title: "${res.title}" | Bundle: ${res.hasBundle}`);
  }
}

main();
