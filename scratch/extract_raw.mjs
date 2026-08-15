import fs from 'fs';

function extractFromHTML() {
  const html = fs.readFileSync("apepi_raw.html", "utf-8");
  
  const emails = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const uniqueEmails = [...new Set(emails)];
  
  console.log(`Found ${uniqueEmails.length} unique emails on the first page.`);
  console.log(uniqueEmails);
}

extractFromHTML();
