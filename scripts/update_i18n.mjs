import fs from 'fs';

const file = 'src/contexts/LanguageContext.tsx';
let content = fs.readFileSync(file, 'utf8');

const newStrings = {
  pt: `
    "pro.book": "Agendar Orientação Técnica",
    "pro.startingAt": "a partir de",
    "pro.online": "Online",
    "pro.offline": "Offline",
    "pro.reviews": "Avaliações",
    "pro.experience": "Experiência:",
    "telemed.title": "Telemedicina 24/7",
    "telemed.subtitle": "Atendimento rápido, seguro e sem sair de casa.",
    "telemed.triage": "Triagem Rápida",
    "telemed.chat": "Orientação por Chat",
  `,
  en: `
    "pro.book": "Book Technical Guidance",
    "pro.startingAt": "starting at",
    "pro.online": "Online",
    "pro.offline": "Offline",
    "pro.reviews": "Reviews",
    "pro.experience": "Experience:",
    "telemed.title": "Telemedicine 24/7",
    "telemed.subtitle": "Fast, secure, and from your home.",
    "telemed.triage": "Quick Triage",
    "telemed.chat": "Chat Guidance",
  `,
  es: `
    "pro.book": "Programar Orientación Técnica",
    "pro.startingAt": "a partir de",
    "pro.online": "En línea",
    "pro.offline": "Desconectado",
    "pro.reviews": "Reseñas",
    "pro.experience": "Experiencia:",
    "telemed.title": "Telemedicina 24/7",
    "telemed.subtitle": "Atención rápida, segura y desde casa.",
    "telemed.triage": "Triaje Rápido",
    "telemed.chat": "Orientación por Chat",
  `
};

for (const lang of ['pt', 'en', 'es']) {
  if (content.includes(`"pro.book"`)) {
    // If it exists in that section, skip it
    const sectionStart = content.indexOf(`${lang}: {`);
    const nextSectionStart = content.indexOf(`},`, sectionStart);
    const section = content.substring(sectionStart, nextSectionStart);
    if (!section.includes(`"pro.book"`)) {
      content = content.slice(0, sectionStart + 6) + '\n' + newStrings[lang] + content.slice(sectionStart + 6);
      console.log(`Added strings to ${lang}`);
    }
  } else {
      const sectionStart = content.indexOf(`${lang}: {`);
      content = content.slice(0, sectionStart + 6) + '\n' + newStrings[lang] + content.slice(sectionStart + 6);
      console.log(`Added strings to ${lang}`);
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log('LanguageContext.tsx fixed');
