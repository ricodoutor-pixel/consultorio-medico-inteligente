import fs from 'fs';

async function extractApepi() {
  try {
    console.log("Fetching APEPI...");
    const res = await fetch("https://apepi.org/lista-saude-apepi/");
    const html = await res.text();
    
    // Check if it's JetEngine or similar
    const matches = html.match(/jet-listing-dynamic-field__content/g);
    console.log("Found jet-listing-dynamic-field__content: " + (matches ? matches.length : 0));
    
    // Let's try to extract basic info with regex just to see if it's there
    const emails = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    const uniqueEmails = [...new Set(emails)];
    console.log("Found emails: " + uniqueEmails.length);
    
    const drs = html.match(/Dr\.\s[^<]+/g);
    console.log("Found Dr.: " + (drs ? drs.length : 0));
    
  } catch (e) {
    console.error(e);
  }
}

extractApepi();
