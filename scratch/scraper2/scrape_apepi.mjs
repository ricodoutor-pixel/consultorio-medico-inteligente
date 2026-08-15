import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function scrapeApepi() {
  console.log("Launching Chrome...");
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  console.log("Navigating to APEPI...");
  await page.goto("https://apepi.org/lista-saude-apepi/", { waitUntil: 'networkidle2', timeout: 60000 });

  let hasMore = true;
  let clicks = 0;
  
  while (hasMore && clicks < 50) {
    try {
      hasMore = await page.evaluate(() => {
        // JetEngine "Carregar mais" button
        const btn = document.querySelector('.jet-filters-pagination__item.next, .jet-listing-grid__load-more, a[data-action="load-more"]');
        if (btn && btn.offsetParent !== null) { // if visible
          btn.click();
          return true;
        }
        
        // Let's also look for buttons with specific text
        const anyBtn = Array.from(document.querySelectorAll('a, button, div[role="button"]')).find(el => el.innerText && el.innerText.toLowerCase().includes('carregar mais'));
        if (anyBtn && anyBtn.offsetParent !== null) {
          anyBtn.click();
          return true;
        }
        
        return false;
      });
      
      if (hasMore) {
        clicks++;
        console.log(`Clicked load more (${clicks}). Waiting for network...`);
        // Wait 3 seconds for AJAX to complete
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (e) {
      console.error(e);
      hasMore = false;
    }
  }

  console.log("Finished clicking. Extracting data...");
  const html = await page.content();
  fs.writeFileSync('apepi_full.html', html);
  
  // Extract simple objects directly from DOM
  const doctors = await page.evaluate(() => {
    const items = document.querySelectorAll('.jet-listing-grid__item');
    const results = [];
    
    items.forEach(item => {
       const text = item.innerText;
       const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
       
       let doc = { nome: lines[0], raw: text };
       lines.forEach(l => {
         if (l.includes('@')) doc.email = l;
         else if (l.includes('CRM') || l.includes('CRO') || l.includes('CRMV')) doc.crm = l;
         else if ((/\(\d{2}\)/.test(l) || /^\d{8,11}$/.test(l)) && !l.includes('@') && !l.includes('CRM')) doc.telefone = l;
       });
       results.push(doc);
    });
    
    return results;
  });

  console.log(`Extracted ${doctors.length} doctors.`);
  fs.writeFileSync('apepi_doctors_final.json', JSON.stringify(doctors, null, 2));

  await browser.close();
}

scrapeApepi().catch(console.error);
