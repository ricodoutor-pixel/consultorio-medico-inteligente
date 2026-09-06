const https = require('https');

https.get('https://plantayraiz.com.br', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const scripts = [...data.matchAll(/src=\"(\/assets\/index-[^\"]+\.js)\"/g)].map(m => m[1]);
    if (scripts.length > 0) {
      console.log('Fetching JS:', scripts[0]);
      https.get('https://plantayraiz.com.br' + scripts[0], (res2) => {
        let jsData = '';
        res2.on('data', chunk => jsData += chunk);
        res2.on('end', () => {
          const keys = [...jsData.matchAll(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g)].map(m => m[0]);
          const key = keys[0];
          console.log('Fetching doctors from tkxx...');
          fetch('https://tkxxoghzhvhjzdoomgss.supabase.co/rest/v1/doctors?select=id', {
            headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
          }).then(r => r.json()).then(console.log).catch(console.error);
        });
      });
    }
  });
});
