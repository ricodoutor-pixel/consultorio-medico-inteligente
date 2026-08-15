import puppeteer from 'puppeteer';
import fs from 'fs';

async function scrape() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  console.log("Navigating...");
  await page.goto("https://apepi.org/lista-saude-apepi/", { waitUntil: 'networkidle2', timeout: 60000 });
  
  console.log("Page loaded. Looking for pagination or load more buttons...");
  
  // Try to click "Load More" or "Carregar mais" if it exists
  let keepClicking = true;
  let clicks = 0;
  while(keepClicking && clicks < 50) {
    keepClicking = await page.evaluate(() => {
      // Find elements that look like "Load More"
      const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
      const loadMore = buttons.find(b => b.innerText && b.innerText.toLowerCase().includes('carregar mais'));
      
      if (loadMore && loadMore.offsetParent !== null) { // visible
        loadMore.click();
        return true;
      }
      return false;
    });
    
    if (keepClicking) {
      console.log(`Clicked load more (${clicks + 1}). Waiting...`);
      await new Promise(r => setTimeout(r, 2000));
      clicks++;
    } else {
      // Maybe pagination? Let's just try to extract everything visible
    }
  }

  console.log("Extracting raw cards...");
  const cardsText = await page.evaluate(() => {
    // JetEngine usually wraps items in .jet-listing-grid__item
    const items = Array.from(document.querySelectorAll('.jet-listing-grid__item'));
    if (items.length > 0) {
      return items.map(i => i.innerText).join("\n\n---\n\n");
    }
    return document.body.innerText;
  });
  
  fs.writeFileSync("apepi_dump.txt", cardsText);
  console.log("Saved dump to apepi_dump.txt");

  await browser.close();
}

scrape().catch(console.error);
