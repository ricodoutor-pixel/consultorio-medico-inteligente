// scripts/disparo-convites.ts

const WAHA_API_URL = 'https://waha-production-4e9c.up.railway.app';
const WAHA_API_KEY = 'planta123';
const WAHA_SESSION = 'default';
const DELAY_MS = 30000;

const MSG_TEMPLATE = `Olá{NAME}! Sou a Enfª Brisa 🌿, Represento a plataforma Planta y Raiz Ltda a Melhor  Mais Completa e segura do Brasil na atualidade.

Gostaria de lhe fazer um convite exclusivo para ser Médico Sócio da nossa plataforma de telemedicina!

Diferente de outros sistemas que cobram taxas abusivas de 25% por consulta, na Planta y Raiz nossa taxa é de apenas 7% (ou TAXA ZERO no Plano VIP).

🌟 Nossos diferenciais para o Médico Sócio:
• Liberdade total para definir o valor da sua consulta
• Recebimento direto via PIX ao término de cada atendimento
• Consultório Virtual Completo em um só Hub: Telemedicina (Chat e Vídeo sem links externos), Prontuário Eletrônico e Emissão de Receitas com Assinatura Digital
• Biblioteca Científica com Suporte de IA e +40 mil estudos científicos de base
• Recomendação do seu perfil por geolocalização (médico próximo ao paciente)
• Programa de Indicação com comissão de 40% na assinatura de colegas e 10% de ganho recorrente até a 3ª geração
• Assistência Jurídica especializada de ponta a ponta e suporte 24/7

👑 No Plano VIP (apenas R$ 99/mês):
Receba 100% do valor das suas consultas (Taxa ZERO), ganhe o Selo de Médico Verificado, telemedicina e prontuários ilimitados e publicação na nossa Biblioteca Científica.

O cadastro é 100% gratuito!
👉 Acesse nosso portal e cadastre-se hoje mesmo: https://plantayraiz.com.br

Se tiver qualquer dúvida, estou à sua inteira disposição aqui no WhatsApp!`;

const CONTACTS = [
  {"phone": "556499816052", "name": "Dr. Tiago Rosa"},
  {"phone": "554399943257", "name": "Dr. Gedson"},
  {"phone": "557193590355", "name": "Dra. Jandy"},
  {"phone": "5519997917409", "name": "Dra. Rosanny"},
  {"phone": "5511985825340", "name": "Luiz Ossamu Sanda"},
  {"phone": "5511982820158", "name": "Maria Le..."},
  {"phone": "5511911284320"}, {"phone": "5511940031876"}, {"phone": "5511947346628"}, 
  {"phone": "5511959233659"}, {"phone": "5511964454272"}, {"phone": "5511972041097"}, 
  {"phone": "5511991551471"}, {"phone": "5511996090769"}, {"phone": "5512997252524"}, 
  {"phone": "5514997912536"}, {"phone": "5514998209728"}, {"phone": "5516981153977"},
  {"phone": "5516993508068"}, {"phone": "5517997772500"}, {"phone": "5519974101361"}, 
  {"phone": "5519982552525"}, {"phone": "5519996242211"}, {"phone": "5519996496699"}, 
  {"phone": "5519996536606"}, {"phone": "5521970217221"}, {"phone": "5521972906296"}, 
  {"phone": "5521988844013"}, {"phone": "5522992872271"}, {"phone": "5524999666142"},
  {"phone": "5527999485727"}, {"phone": "553197058600"}, {"phone": "554491762004"}, 
  {"phone": "554498684560"}, {"phone": "554591131076"}, {"phone": "554899091753"}, 
  {"phone": "555191080654"}, {"phone": "555194444073"}, {"phone": "555198359155"}, 
  {"phone": "555198919819"}, {"phone": "555199360693"}, {"phone": "555384472897"},
  {"phone": "555399105341"}, {"phone": "555484327276"}, {"phone": "555591667600"}, 
  {"phone": "555599612555"}, {"phone": "556181082559"}, {"phone": "556181173173"}, 
  {"phone": "556182993535"}, {"phone": "556183840122"}, {"phone": "556199789266"}, 
  {"phone": "556282581227"}, {"phone": "556285861206"}, {"phone": "556291560213"},
  {"phone": "556293081141"}, {"phone": "556299100216"}, {"phone": "556299272388"}, 
  {"phone": "556299845533"}, {"phone": "556392388997"}, {"phone": "556399700917"}, 
  {"phone": "556484479808"}, {"phone": "556499814666"}, {"phone": "556598013158"}, 
  {"phone": "556599019309"}, {"phone": "556692237744"}, {"phone": "556799406457"},
  {"phone": "556899503717"}, {"phone": "556899998040"}, {"phone": "556984244805"}, 
  {"phone": "556999046940"}, {"phone": "556999736077"}, {"phone": "557186861722"}, 
  {"phone": "557188023782"}, {"phone": "557192565504"}, {"phone": "557196007818"}, 
  {"phone": "557196657452"}, {"phone": "557199381700"}, {"phone": "557399100190"},
  {"phone": "557488189984"}, {"phone": "557498031315"}, {"phone": "557499619689"}, 
  {"phone": "557599681836"}, {"phone": "557799104363"}, {"phone": "557799811447"}, 
  {"phone": "557991704000"}, {"phone": "558181883527"}, {"phone": "558183437305"}, 
  {"phone": "558188365260"}, {"phone": "558192718268"}, {"phone": "558194678255"},
  {"phone": "558197268083"}, {"phone": "558198870849"}, {"phone": "558296742383"}, 
  {"phone": "558387006122"}, {"phone": "558393297618"}, {"phone": "558399129973"}, 
  {"phone": "558399833460"}, {"phone": "558488279131"}, {"phone": "558491344049"}, 
  {"phone": "558499169414"}, {"phone": "558499846152"}, {"phone": "558586048303"},
  {"phone": "558596126655"}, {"phone": "558681811737"}, {"phone": "558688957721"}, 
  {"phone": "558791850250"}, {"phone": "558896683077"}, {"phone": "558896982941"}, 
  {"phone": "558994539028"}, {"phone": "559189168862"}, {"phone": "559189435624"}, 
  {"phone": "559281830026"}, {"phone": "559281869902"}, {"phone": "559288550147"},
  {"phone": "559292312964"}, {"phone": "559299061294"}, {"phone": "559491291558"}, 
  {"phone": "559491554633"}, {"phone": "559491647567"}, {"phone": "559584018108"}, 
  {"phone": "559981339493"}, {"phone": "559991910186"}, {"phone": "595987307238"}, 
  {"phone": "595992812050"}
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log(`Iniciando disparo para ${CONTACTS.length} contatos...`);
  console.log(`Delay de envio configurado para: ${DELAY_MS / 1000} segundos.\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < CONTACTS.length; i++) {
    const contact = CONTACTS[i];
    const chatId = `${contact.phone}@c.us`;
    const namePart = contact.name ? `, ${contact.name}` : '';
    const text = MSG_TEMPLATE.replace('{NAME}', namePart);

    const displayName = contact.name || "Sem Nome";

    try {
      const response = await fetch(`${WAHA_API_URL}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': WAHA_API_KEY
        },
        body: JSON.stringify({
          session: WAHA_SESSION,
          chatId: chatId,
          text: text
        })
      });

      if (response.ok) {
        console.log(`[${i + 1}/${CONTACTS.length}] ✅ Enviado para ${displayName} (${contact.phone}) | Aguardando 30s...`);
        successCount++;
      } else {
        const errorText = await response.text();
        console.log(`[${i + 1}/${CONTACTS.length}] ❌ Falha (HTTP ${response.status}) ao enviar para ${displayName} (${contact.phone}): ${errorText.slice(0,100)} | Aguardando 30s...`);
        failCount++;
      }
    } catch (error) {
      console.log(`[${i + 1}/${CONTACTS.length}] ❌ Erro Crítico ao enviar para ${displayName} (${contact.phone}): ${error} | Aguardando 30s...`);
      failCount++;
    }

    if (i < CONTACTS.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n🏁 Disparo concluído!\n✅ Sucessos: ${successCount}\n❌ Falhas: ${failCount}`);
}

main().catch(console.error);
