const fs = require('fs');

function extract() {
  const html = fs.readFileSync('apepi_download.html', 'utf-8');
  const emails = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  
  // Clean up emails
  const cleanEmails = emails.filter(e => 
    !e.includes('sentry.io') && 
    !e.includes('apepi.org') &&
    !e.includes('w3.org')
  );
  
  const uniqueEmails = [...new Set(cleanEmails)];
  
  console.log(`Found ${uniqueEmails.length} unique emails.`);
  fs.writeFileSync('apepi_emails.json', JSON.stringify(uniqueEmails, null, 2));
}

extract();
