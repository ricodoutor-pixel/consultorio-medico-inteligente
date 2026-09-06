const fs = require('fs');
const path = 'src/components/BrisaChatModal.tsx';
let c = fs.readFileSync(path, 'utf8');

// Remove the orphaned brevo-sync block around line 83
const badBlockRegex = /\s*\/\/\s*Sync with Brevo\s*supabase\.functions\.invoke\('brevo-sync'[\s\S]*?\}\s*catch\s*\(e\)\s*\{/;
c = c.replace(badBlockRegex, '\n    } catch (e) {');

// Add it to the correct saveLeadToCRM function
const insertBlockRegex = /(await supabase\.from\("leads_contatos"\)\.insert\(\{[\s\S]*?\}\);)/;
c = c.replace(insertBlockRegex, `$1\n\n      // Sync with Brevo\n      supabase.functions.invoke('brevo-sync', {\n        body: { nome: finalData.name, email: finalData.email, telefone: finalData.phone, categoria: category, origem: 'brisa_chat_onboarding' }\n      }).catch(e => console.error('Brevo sync failed:', e));`);

fs.writeFileSync(path, c);
console.log('BrisaChatModal fixed');
