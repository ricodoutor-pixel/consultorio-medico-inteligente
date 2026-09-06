const fs = require('fs');
let c = fs.readFileSync('src/components/WhatsAppButton.tsx', 'utf8');

if (!c.includes('id: "humano"')) {
  const humanoCategory = `,
  {
    id: "humano",
    keyword: "#HUMANO",
    label: "Falar com Agente Humano",
    icon: MessageCircle,
    description: "Atendimento direto pelo WhatsApp",
    greeting: "",
    landing: null,
    color: "hsl(142 71% 45%)",
  }
] as const;`;
  c = c.replace('] as const;', humanoCategory);
}

const originalClickHandler = `const handleOptionClick = async (option: (typeof VISITOR_OPTIONS)[number]) => {
    trackPixelEvent("Contact", { content_name: \`brisa_\${option.id}\` });

    window.dispatchEvent(
      new CustomEvent("open-brisa-chat", {
        detail: { id: option.id, label: option.label },
      })
    );

    setIsOpen(false);
  };`;

const newClickHandler = `const handleOptionClick = async (option: (typeof VISITOR_OPTIONS)[number]) => {
    trackPixelEvent("Contact", { content_name: \`brisa_\${option.id}\` });

    if (option.id === "humano") {
      window.open("https://wa.me/5511991363154?text=Olá, gostaria de falar com um agente humano da Planta y Raiz.", "_blank");
      setIsOpen(false);
      return;
    }

    window.dispatchEvent(
      new CustomEvent("open-brisa-chat", {
        detail: { id: option.id, label: option.label },
      })
    );

    setIsOpen(false);
  };`;

if (c.includes(originalClickHandler)) {
  c = c.replace(originalClickHandler, newClickHandler);
} else {
  // Try regex if spacing is different
  c = c.replace(/const handleOptionClick[\s\S]*?setIsOpen\(false\);\n  };/m, newClickHandler);
}

fs.writeFileSync('src/components/WhatsAppButton.tsx', c);
console.log('Added Humano category');
