import fs from 'fs';

async function parseApepi() {
  const res = await fetch("https://apepi.org/lista-saude-apepi/");
  const html = await res.text();
  
  const ajaxRegex = /"ajaxurl":"([^"]+)"/;
  const ajaxMatch = html.match(ajaxRegex);
  console.log("Ajax URL: ", ajaxMatch ? ajaxMatch[1] : "not found");
  
  const actionRegex = /"action":"([^"]+)"/;
  const actionMatch = html.match(actionRegex);
  console.log("Action: ", actionMatch ? actionMatch[1] : "not found");
  
  const jetEngineDataRegex = /window\.JetEngineSettings\s*=\s*({.*?});/s;
  const jetEngineDataMatch = html.match(jetEngineDataRegex);
  if (jetEngineDataMatch) {
    console.log("Found JetEngineSettings");
  }
}

parseApepi();
