// scripts/print-env.mjs
console.log("Environment Keys:", Object.keys(process.env).sort());
// Specifically look for interesting keys
const interesting = [
  'SUPABASE', 'SERVICE', 'SECRET', 'KEY', 'PASS', 'DB', 'URL', 'TOKEN', 'PORT'
];
for (const [key, val] of Object.entries(process.env)) {
  if (interesting.some(i => key.toUpperCase().includes(i))) {
    console.log(`${key}: ${val}`);
  }
}
