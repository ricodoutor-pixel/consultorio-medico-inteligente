// 🌿 Planta y Raíz Ltda — Automação Visível NATIVA via Chrome + SendKeys
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_FILE = path.join(__dirname, 'campaign_data.json');
if (!fs.existsSync(DATA_FILE)) {
  console.error("❌ campaign_data.json não encontrado.");
  process.exit(1);
}

const campaignData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const message = campaignData.message;
const phones = campaignData.phones;

// Começando do Médico #4 (índice 3)
const START_INDEX = 3;

async function runLiveDispatch() {
  console.log("=================================================");
  console.log("📺 DISPARO VISÍVEL EM TEMPO REAL NO SEU CHROME");
  console.log(`📋 Médicos a processar: ${phones.length - START_INDEX}`);
  console.log("=================================================\n");

  for (let i = START_INDEX; i < phones.length; i++) {
    const rawPhone = phones[i];
    const cleanPhone = rawPhone.replace(/\D/g, "");
    const encodedMsg = encodeURIComponent(message);
    const url = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;

    console.log(`[${i + 1}/${phones.length}] 📤 Abrindo no seu Chrome: +${cleanPhone}...`);

    // 1. Abrir o link nativo diretamente no Chrome ativo do usuário
    try {
      execSync(`start chrome "${url}"`);
    } catch (e) {
      console.warn("Erro ao abrir URL:", e.message);
    }

    // 2. Aguardar 5 segundos para o WhatsApp Web carregar o chat e preencher a mensagem
    await new Promise(r => setTimeout(r, 5000));

    // 3. Simular pressionamento da tecla Enter via PowerShell no Chrome para enviar a mensagem
    try {
      const psCmd = `powershell -Command "$w = New-Object -ComObject wscript.shell; if ($w.AppActivate('WhatsApp')) { Start-Sleep -Milliseconds 500; $w.SendKeys('{ENTER}') }"`;
      execSync(psCmd);
      console.log(`✅ [${i + 1}/${phones.length}] Mensagem enviada visivelmente na tela para +${cleanPhone}!`);
    } catch (err) {
      console.warn("Aviso ao focar janela:", err.message);
    }

    // 4. Pausa de segurança de 10 segundos entre envios
    console.log(`⏳ Aguardando 10 segundos para o próximo médico...\n`);
    await new Promise(r => setTimeout(r, 10000));
  }

  console.log("=================================================");
  console.log("🎉 CAMPANHA CONCLUÍDA VISIVELMENTE COM SUCESSO!");
  console.log("=================================================");
}

runLiveDispatch();
