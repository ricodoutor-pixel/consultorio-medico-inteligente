const fs = require('fs');

// Fix 1: Update brisa-chat edge function
let brisaFile = fs.readFileSync('supabase/functions/brisa-chat/index.ts', 'utf8');
brisaFile = brisaFile.replace(/\[Falar com Agente Humano\]\(https:\/\/wa\.me\/5511991363154\)/g, '[💬 Falar com Agente Humano (WhatsApp)](https://wa.me/5511991363154)');
fs.writeFileSync('supabase/functions/brisa-chat/index.ts', brisaFile);

// Fix 2: Update BrisaChatModal onboarding & styling
let modalFile = fs.readFileSync('src/components/BrisaChatModal.tsx', 'utf8');
modalFile = modalFile.replace(/\[Falar com Agente Humano\]\(https:\/\/wa\.me\/5511991363154\)/g, '[💬 Falar com Agente Humano (WhatsApp)](https://wa.me/5511991363154)');

// Fix the styling classes. Without tailwind typography, 'prose' doesn't work. We use standard arbitrary variants.
modalFile = modalFile.replace(/className="prose prose-sm prose-invert max-w-none \[\&>p\]:my-1 prose-a:text-green-500 prose-a:underline prose-a:font-bold hover:prose-a:text-green-400"/g, 'className="text-sm max-w-none [&>p]:my-1 [&_a]:text-green-500 [&_a]:underline [&_a]:font-bold hover:[&_a]:text-green-400"');
fs.writeFileSync('src/components/BrisaChatModal.tsx', modalFile);

console.log('Fixed texts and styles');
