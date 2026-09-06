const fs = require('fs');
let c = fs.readFileSync('src/components/BrisaChatModal.tsx', 'utf8');

c = c.replace(/className="prose prose-sm prose-invert max-w-none \[\&>p\]:my-1"/g, 'className="prose prose-sm prose-invert max-w-none [&>p]:my-1 prose-a:text-green-500 prose-a:underline prose-a:font-bold hover:prose-a:text-green-400"');

fs.writeFileSync('src/components/BrisaChatModal.tsx', c);
console.log('Fixed styling');
