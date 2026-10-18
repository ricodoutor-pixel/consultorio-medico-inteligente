import https from 'https';

const key = '4a8f9b2d3c1e7a5b6d9e0f1a2b3c4d5e';
const host = 'plantayraiz.com.br';
const keyLocation = `https://${host}/${key}.txt`;

const urlList = [
  `https://${host}/`,
  `https://${host}/triagem`,
  `https://${host}/profissionais`,
  `https://${host}/medicos/ativar`,
  `https://${host}/saude-verde`,
  `https://${host}/como-funciona`,
  `https://${host}/shopping`,
  `https://${host}/cadastro`,
  `https://${host}/planos`,
  `https://${host}/telemedicina`
];

const payload = JSON.stringify({
  host,
  key,
  keyLocation,
  urlList
});

function postIndexNow(endpointHost, endpointPath) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: endpointHost,
      port: 443,
      path: endpointPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[INDEXNOW] ${endpointHost} -> HTTP ${res.statusCode}: ${data || 'OK'}`);
        resolve({ host: endpointHost, status: res.statusCode, body: data });
      });
    });

    req.on('error', (err) => {
      console.warn(`[INDEXNOW] ${endpointHost} erro:`, err.message);
      resolve({ host: endpointHost, error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('[INDEXNOW] Disparando sinal de indexação imediata para os mecanismos de busca...');
  await postIndexNow('api.indexnow.org', '/indexnow');
  await postIndexNow('www.bing.com', '/indexnow');
  console.log('[INDEXNOW] Concluído!');
}

run();
