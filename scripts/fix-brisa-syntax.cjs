const fs = require('fs');
let c = fs.readFileSync('supabase/functions/brisa-chat/index.ts', 'utf8');

c = c.replace(/Authorization:\s*`Bearer \\\\?\$\\{apiKey\\}`/g, 'Authorization: `Bearer ${apiKey}`');
// Let's just fix all of them:
c = c.replace(/\\\\?\$\{/g, '${');
c = c.replace(/\\\\n/g, '\\n');
c = c.replace(/\\`/g, '`');

fs.writeFileSync('supabase/functions/brisa-chat/index.ts', c);
console.log('Fixed');
