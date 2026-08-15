import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function scrapeApepi() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new"
  });

  const page = await browser.newPage();
  await page.goto("https://apepi.org/lista-saude-apepi/", { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 5000)); // wait extra 5s for jet engine to load initial grid

  const extractCurrentPage = async () => {
    return await page.evaluate(() => {
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
  };

  const allDoctors = [];
  
  for (let p = 1; p <= 37; p++) {
    console.log(`Extracting page ${p}...`);
    
    try {
      const docs = await extractCurrentPage();
      if (docs.length === 0) {
         console.log("Empty page, waiting and trying again...");
         await new Promise(r => setTimeout(r, 3000));
         const docsRetry = await extractCurrentPage();
         if (docsRetry.length === 0) break;
         docs.push(...docsRetry);
      }
      
      allDoctors.push(...docs);
      fs.writeFileSync('apepi_doctors_final.json', JSON.stringify(allDoctors, null, 2));
      console.log(`Got ${docs.length} doctors. Total so far: ${allDoctors.length}`);

      // Click next page
      const clicked = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('.jet-filters-pagination__link'));
        let nextLink = links.find(l => l.innerText && l.innerText.toLowerCase().includes('próximo'));
        
        if (!nextLink) {
           const active = document.querySelector('.jet-filters-pagination__link.jet-filters-pagination__item--active');
           if (active && active.nextElementSibling) {
              nextLink = active.nextElementSibling;
           }
        }
        
        if (nextLink) {
          nextLink.click();
          return true;
        }
        return false;
      });

      if (!clicked) {
         console.log("No next button clicked, breaking");
         break;
      }
      await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
      console.error("Crash na página", p, e.message);
      break;
    }
  }

  // Deduplicate
  const uniqueDoctors = [];
  const names = new Set();
  for (const d of allDoctors) {
    if (!names.has(d.nome)) {
      names.add(d.nome);
      uniqueDoctors.push(d);
    }
  }

  fs.writeFileSync('apepi_doctors_final.json', JSON.stringify(uniqueDoctors, null, 2));
  console.log(`Extracted ${uniqueDoctors.length} unique doctors.`);
  await browser.close();
}

scrapeApepi().catch(console.error);
