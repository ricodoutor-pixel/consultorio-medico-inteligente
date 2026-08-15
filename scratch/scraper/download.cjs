const fs = require('fs');
const https = require('https');

function downloadApepi() {
  const url = "https://apepi.org/lista-saude-apepi/";
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      fs.writeFileSync('apepi_download.html', data);
      console.log('Saved to apepi_download.html. Length: ' + data.length);
    });
  }).on('error', err => {
    console.error('Error: ', err.message);
  });
}

downloadApepi();
