const fs = require('fs');
const path = 'supabase/functions/brisa-chat/index.ts';
let code = fs.readFileSync(path, 'utf8');

const additionalPrompt = `

REGRA IMPORTANTE DE TRANSFERÊNCIA PARA HUMANO:
Se o usuário solicitar falar com um agente humano, se demonstrar insatisfação com suas respostas, ou se a conversa ficar muito complexa, você DEVE oferecer educadamente transferir a conversa. Diga algo como "Se preferir, posso transferir esta conversa para um agente humano da nossa equipe. Basta clicar neste link:" e forneça EXATAMENTE este link em formato markdown: [Falar com Agente Humano (WhatsApp)](https://wa.me/5511991363154). 
O objetivo é filtrar as dúvidas básicas e transferir para o agente humano apenas o que for de real importância ou quando o usuário desejar.`;

code = code.replace('Lembre-se que você NÃO diagnostica nem prescreve, apenas orienta e tira dúvidas operacionais ou fornece informações gerais sobre tratamentos canabinoides e o fluxo da plataforma.`;', 'Lembre-se que você NÃO diagnostica nem prescreve, apenas orienta e tira dúvidas operacionais ou fornece informações gerais sobre tratamentos canabinoides e o fluxo da plataforma.' + additionalPrompt + '`;');

fs.writeFileSync(path, code);
console.log('Brisa system prompt updated.');
