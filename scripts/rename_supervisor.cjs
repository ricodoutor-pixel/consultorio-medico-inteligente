const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'src');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replacements
    // Match "Dr. Edilson Bezerra ON", "Dr. Edilson Bezerra", "Dr. Edilson Bezerra On", "Dr. Edilson", "Dr Edilson Bezerra"
    // with or without ON.
    content = content.replace(/Dr\.?\s*Edilson\s*Bezerra(\s*ON)?/gi, 'Dra. Suelen Naves Rodrigues');
    content = content.replace(/Dr\.?\s*Edilson/gi, 'Dra. Suelen');
    
    // Also replace CRM 10963 -> CRM-PR 49354
    content = content.replace(/CRM\s*10963/gi, 'CRM-PR 49354');
    
    fs.writeFileSync(filePath, content, 'utf-8');
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.html') || fullPath.endsWith('.md')) {
            replaceInFile(fullPath);
        }
    }
}

console.log("Renaming in src...");
traverse(targetDir);

const supabaseDir = path.join(__dirname, '..', 'supabase');
console.log("Renaming in supabase...");
if(fs.existsSync(supabaseDir)) traverse(supabaseDir);

console.log("Done comprehensively.");
