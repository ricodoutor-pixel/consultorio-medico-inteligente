const fs = require('fs');
const path = 'src/components/BrisaChatModal.tsx';
let code = fs.readFileSync(path, 'utf8');

// We will replace the onboarding flow logic to make it much smarter.
// Look for `if (onboardingStep === 0) {` and replace up to `if (onboardingStep === 3) {`

const newLogic = `
    const isHumanRequest = /humano|atendente|pessoa|falar com algu[eé]m/i.test(text);
    if (isHumanRequest && onboardingStep < 4) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: "Entendo. Se preferir falar diretamente com um agente humano da nossa equipe, basta clicar neste link: [Falar com Agente Humano](https://wa.me/5511991363154)",
          sender: "ai",
          timestamp: new Date(),
        }]);
      }, 500);
      // Optional: keep them in the same step so they can still fill it out if they change their mind, or let them bypass. We'll just return.
      return;
    }

    // Onboarding flow
    if (onboardingStep === 0) {
      const firstName = text.split(' ')[0];
      setLeadData(prev => ({ ...prev, name: text }));
      setOnboardingStep(1);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: \`Muito prazer, \${firstName}! 🌿 Agora, por favor, me informe o seu melhor endereço de e-mail:\`,
          sender: "ai",
          timestamp: new Date(),
        }]);
      }, 500);
      return;
    }

    if (onboardingStep === 1) {
      setLeadData(prev => ({ ...prev, email: text }));
      setOnboardingStep(2);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: \`Ótimo! Agora digite seu número de celular/WhatsApp (com DDD):\`,
          sender: "ai",
          timestamp: new Date(),
        }]);
      }, 500);
      return;
    }

    if (onboardingStep === 2) {
      setLeadData(prev => ({ ...prev, phone: text }));
      setOnboardingStep(3);
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: \`Perfeito! Uma última perguntinha: você já tem cadastro em nossa plataforma? (Sim ou Não)\`,
          sender: "ai",
          timestamp: new Date(),
        }]);
      }, 500);
      return;
    }`;

// Replace the block
const regex = /\/\/ Onboarding flow\s*if\s*\(onboardingStep === 0\) \{[\s\S]*?(?=if\s*\(onboardingStep === 3\))/;
code = code.replace(regex, newLogic + '\n\n    ');

fs.writeFileSync(path, code);
console.log("Patched BrisaChatModal onboarding flow");
