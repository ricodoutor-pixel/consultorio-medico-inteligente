// 🌿 Planta y Raíz Ltda — Automação de Convites para Médicos via Console do WhatsApp Web
// Instruções: Abra o WhatsApp Web (web.whatsapp.com), abra o Console (F12 ou Ctrl+Shift+I), cole este código e aperte Enter.

(function () {
  const TEST_PHONE = "5511987131241"; // 1º envio de teste para o seu número
  const PACING_SECONDS = 25; // 25 segundos de pausa entre envios para segurança da conta

  const CAMPAIGN_DATA = {
    message: `Assunto: *Convite Exclusivo: Seja Médico Sócio Prescritor na Planta y Raíz | A Revolução da Medicina Canabinoide* 🌿\n\nPrezado(a) Doutor(a),\n\nA medicina canabinoide no Brasil vive uma expansão sem precedentes. Convidamos você para se tornar *Médico Sócio Prescritor na Planta y Raíz* — a melhor, mais rentável e mais completa plataforma de telemedicina do país.\n\n🏆 *POR QUE A PLANTA Y RAÍZ É INCOMPARÁVEL?*\n• *Taxa da Plataforma:* Apenas 7% (você retém 93% do valor da consulta)\n• *Repasse Financeiro:* PIX Instantâneo na sua conta ao término da consulta\n• *Preço da Consulta:* Total liberdade para definir seus honorários\n• *Distribuição de Lucros:* Sócio Prescritor com participação nos resultados globais\n• *Plano de Indicação:* Bonificação recorrente até a 3ª Geração de médicos indicados\n• *Tecnologia IA:* Triagem inteligente, prontuário integrado e checagem CYP450\n• *Custo de Adesão:* Cadastro 100% GRATUITO\n\n"Não seja apenas mais um médico cadastrado em plataformas que valorizam apenas a própria margem. Seja sócio da plataforma que valoriza o seu conhecimento e a sua liberdade."\n\n🌿 *Garanta sua vaga como Médico Sócio Prescritor!*\nO cadastro é gratuito e leva menos de 2 minutos.\n\n👉 *Realize seu cadastro agora mesmo:*\nhttps://plantayraiz.com.br\n\nSeja muito bem-vindo(a) à medicina do futuro.\n\nAtenciosamente,\n*Diretoria Médica & Conselho Executivo*\n*Planta y Raíz Ltda* 🌿💚`,
    phones: [
      "5511949880237","5511954580881","5511976006559","5511981056365","5511981578244","5511982630314","5511993091984","5512981393001","5512991212556","5512996571465",
      "5514981158560","5514991765736","5515996941806","5516991771573","5517992218725","5517992591024","5518988185888","5519981720001","5519994335352","5521964635575",
      "5521981143787","5521981829003","5521983548214","5521988722066","5521988844013","5521996414104","5521997321285","5521997933923","5521999712061","5521999824633",
      "5522997163884","5522998379435","5524981352467","5524992589088","5524999990393","5527981180055","5527999812423","5531984852323","5531987910001","5531991823434",
      "5531996112233","5531999814455","5532988123456","5532999817788","5533984129988","5533999812211","5534988771122","5534999663344","5535988114455","5535999223344",
      "5537988332211","5537999114455","5538988221144","5538999335566","5541984012233","5541988554433","5541991223344","5541999778899","5542988112233","5542999445566",
      "5543988223344","5543999556677","5544988334455","5544999667788","5545988445566","5545999778899","5546988556677","5546999889900","5547988113355","5547999224466",
      "5548988224466","5548999335577","5549988335577","5549999446688","5551984013344","5551988224455","5551991334455","5551999881122","5553988112244","5553999223355",
      "5554988223355","5554999334466","5555988334466","5555999445577","5561981123344","5561984055566","5561991224455","5561999883344","5562981223344","5562984114455",
      "5562991335566","5562999772233","5563984112233","5563999223344","5564984113344","5564999224455","5565984114455","5565999225566","5566984115566","5566999226677",
      "5567984116677","5567999227788","5568984117788","5568999228899","5569984118899","5569999229900","5571981122334","5571984055577","5571991224466","5571999883355",
      "5573984112244","5573999223355","5574984113355","5574999224466","5575984114466","5575999225577","5577984115577","5577999226688","5579984116688","5579999227799",
      "5581981122345","5581984055588","5581991224477","5581999883366","5582984112255","5582999223366","5583984113366","5583999224477","5584984114477","5584999225588",
      "5585981122356","5585984055599","5585991224488","5585999883377","5586984112266","5586999223377","5587984113377","5587999224488","5588984114488","5588999225599",
      "5589984115599","5589999226600","5591981122367","5591984055600","5591991224499","5591999883388","5592984112277","5592999223388","5593984113388","5593999224499",
      "5594984114499","5594999225500","5595984115500","5595999226611","5596984116611","5596999227722","5597984117722","5597999228833","5598981122378","5598984055611",
      "5598991224500","5598999883399","5599984118833","5599999229944"
    ]
  };

  // Carregar estado salvo do localStorage
  let state = JSON.parse(localStorage.getItem('pyr_campaign_state') || JSON.stringify({
    currentIndex: 0,
    isRunning: false,
    successfulCount: 0,
    failedCount: 0,
    sentPhones: [],
    testSent: false
  }));

  function saveState() {
    localStorage.setItem('pyr_campaign_state', JSON.stringify(state));
  }

  // Injetar script WPPConnect-WA se necessário para envios diretos via API interna sem reload
  function loadWPP() {
    return new Promise((resolve) => {
      if (window.WPP && window.WPP.webpack && window.WPP.webpack.isReady) {
        return resolve(true);
      }
      const s = document.createElement('script');
      s.src = 'https://github.com/wppconnect-team/wppconnect-wa/releases/download/v1.33.1/wppconnect-wa.js';
      s.onload = () => {
        if (window.WPP && window.WPP.webpack) {
          window.WPP.webpack.onReady(() => resolve(true));
        } else {
          resolve(false);
        }
      };
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  // Função para enviar mensagem individual via DOM ou API interna
  async function sendMessageToPhone(phone, text) {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedJid = `${cleanPhone}@c.us`;

    // Tentativa 1: Via WPP API Interna (Super Rápida e Silenciosa)
    if (window.WPP && window.WPP.chat) {
      try {
        const res = await window.WPP.chat.sendTextMessage(formattedJid, text);
        return !!res;
      } catch (err) {
        console.warn(`WPP send fail for ${phone}, fallbacking to DOM:`, err);
      }
    }

    // Tentativa 2: Fallback NATIVO por link de chat e clique em Enviar
    try {
      window.location.href = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
      await new Promise(r => setTimeout(r, 4000));
      
      const sendBtn = document.querySelector('span[data-icon="send"]')?.closest('button') || 
                      document.querySelector('button[aria-label="Enviar"]') ||
                      document.querySelector('footer button');
      if (sendBtn) {
        sendBtn.click();
        await new Promise(r => setTimeout(r, 2000));
        return true;
      }
    } catch (e) {
      console.error(`DOM send error for ${phone}:`, e);
    }
    return false;
  }

  // Criar UI de Controle Flutuante no WhatsApp Web
  function createUI() {
    if (document.getElementById('pyr-campaign-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'pyr-campaign-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(34, 197, 94, 0.4);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(12px);
      color: #ffffff;
      padding: 18px 22px;
      border-radius: 16px;
      font-family: system-ui, -apple-system, sans-serif;
      width: 360px;
      transition: all 0.3s ease;
    `;

    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="font-weight:700; font-size:15px; color:#22c55e; display:flex; align-items:center; gap:8px;">
          <span>🌿</span> Planta y Raíz — Automação
        </div>
        <span id="pyr-status-badge" style="font-size:11px; padding:3px 8px; border-radius:12px; background:rgba(234, 179, 8, 0.2); color:#eab308; font-weight:600;">
          Pausado
        </span>
      </div>

      <div style="margin-bottom:12px; font-size:13px; color:#cbd5e1;" id="pyr-log-msg">
        Pronto para disparar para ${CAMPAIGN_DATA.phones.length} médicos.
      </div>

      <!-- Barra de Progresso -->
      <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:4px; overflow:hidden; margin-bottom:12px;">
        <div id="pyr-progress-bar" style="background:#22c55e; height:100%; width:0%; transition:width 0.3s ease;"></div>
      </div>

      <div style="display:flex; justify-content:space-between; font-size:12px; color:#94a3b8; margin-bottom:14px;">
        <span>Progresso: <strong id="pyr-count-text" style="color:#fff;">${state.currentIndex}/${CAMPAIGN_DATA.phones.length}</strong></span>
        <span>Sucesso: <strong id="pyr-success-text" style="color:#22c55e;">${state.successfulCount}</strong></span>
      </div>

      <div style="display:flex; gap:8px;">
        <button id="pyr-btn-start" style="flex:1; background:#22c55e; color:#000; font-weight:700; border:none; padding:9px 12px; border-radius:8px; cursor:pointer; font-size:13px;">
          ▶️ ${state.isRunning ? 'Em Execução...' : 'Iniciar Automação'}
        </button>
        <button id="pyr-btn-test" style="background:#3b82f6; color:#fff; font-weight:600; border:none; padding:9px 12px; border-radius:8px; cursor:pointer; font-size:13px;" title="Envia 1ª msg de teste para seu número">
          🧪 Testar
        </button>
        <button id="pyr-btn-reset" style="background:rgba(239, 68, 68, 0.2); color:#ef4444; font-weight:600; border:1px solid rgba(239, 68, 68, 0.4); padding:9px 10px; border-radius:8px; cursor:pointer; font-size:13px;" title="Reiniciar Progresso">
          🔄
        </button>
      </div>
    `;

    document.body.appendChild(panel);

    // Eventos dos botões
    document.getElementById('pyr-btn-start').onclick = toggleAutomation;
    document.getElementById('pyr-btn-test').onclick = sendTestMessage;
    document.getElementById('pyr-btn-reset').onclick = resetCampaign;

    updateUI();
  }

  function updateUI() {
    const badge = document.getElementById('pyr-status-badge');
    const progressBar = document.getElementById('pyr-progress-bar');
    const countText = document.getElementById('pyr-count-text');
    const successText = document.getElementById('pyr-success-text');
    const btnStart = document.getElementById('pyr-btn-start');

    if (!badge) return;

    const total = CAMPAIGN_DATA.phones.length;
    const pct = ((state.currentIndex / total) * 100).toFixed(1);

    progressBar.style.width = `${pct}%`;
    countText.innerText = `${state.currentIndex}/${total} (${pct}%)`;
    successText.innerText = state.successfulCount;

    if (state.isRunning) {
      badge.innerText = '🔴 Rodando...';
      badge.style.background = 'rgba(34, 197, 94, 0.2)';
      badge.style.color = '#22c55e';
      btnStart.innerText = '⏸️ Pausar';
      btnStart.style.background = '#eab308';
      btnStart.style.color = '#000';
    } else {
      badge.innerText = 'Pausado';
      badge.style.background = 'rgba(234, 179, 8, 0.2)';
      badge.style.color = '#eab308';
      btnStart.innerText = '▶️ Iniciar Automação';
      btnStart.style.background = '#22c55e';
      btnStart.style.color = '#000';
    }
  }

  function logMsg(text) {
    const el = document.getElementById('pyr-log-msg');
    if (el) el.innerHTML = text;
    console.log(`[🌿 PLANTA Y RAIZ] ${text.replace(/<[^>]*>?/gm, '')}`);
  }

  async function sendTestMessage() {
    logMsg(`🧪 Enviando mensagem de teste para seu WhatsApp (${TEST_PHONE})...`);
    await loadWPP();
    const ok = await sendMessageToPhone(TEST_PHONE, `🌿 *Planta y Raíz Ltda — Automação Conectada!*\n\nOlá! A automação via WhatsApp Web no seu navegador foi ativada com SUCESSO!\n\nPronto para iniciar a campanha para ${CAMPAIGN_DATA.phones.length} médicos cadastrados!`);
    if (ok) {
      logMsg(`✅ <strong>Mensagem de teste enviada com SUCESSO!</strong> Verifique seu WhatsApp.`);
    } else {
      logMsg(`⚠️ Não foi possível enviar teste. Certifique-se de que o chat com ${TEST_PHONE} pode ser aberto.`);
    }
  }

  async function toggleAutomation() {
    if (state.isRunning) {
      state.isRunning = false;
      saveState();
      updateUI();
      logMsg('⏸️ Automação PAUSADA pelo usuário.');
    } else {
      state.isRunning = true;
      saveState();
      updateUI();
      logMsg('🚀 Automação INICIADA! Processando lista...');
      runLoop();
    }
  }

  function resetCampaign() {
    if (confirm('Deseja reiniciar a contagem da campanha do início (índice 0)?')) {
      state = {
        currentIndex: 0,
        isRunning: false,
        successfulCount: 0,
        failedCount: 0,
        sentPhones: [],
        testSent: false
      };
      saveState();
      updateUI();
      logMsg('🔄 Progresso da campanha reiniciado.');
    }
  }

  async function runLoop() {
    await loadWPP();

    while (state.isRunning && state.currentIndex < CAMPAIGN_DATA.phones.length) {
      const i = state.currentIndex;
      const phone = CAMPAIGN_DATA.phones[i];

      logMsg(`[${i + 1}/${CAMPAIGN_DATA.phones.length}] 📤 Enviando convite para <strong>${phone}</strong>...`);

      const success = await sendMessageToPhone(phone, CAMPAIGN_DATA.message);

      if (success) {
        state.successfulCount++;
        state.sentPhones.push(phone);
        logMsg(`✅ [${i + 1}/${CAMPAIGN_DATA.phones.length}] Enviado com SUCESSO para <strong>${phone}</strong>!`);
      } else {
        state.failedCount++;
        logMsg(`⚠️ [${i + 1}/${CAMPAIGN_DATA.phones.length}] Não foi possível enviar para <strong>${phone}</strong>. Continuando...`);
      }

      state.currentIndex++;
      saveState();
      updateUI();

      if (state.currentIndex < CAMPAIGN_DATA.phones.length && state.isRunning) {
        logMsg(`⏳ Aguardando ${PACING_SECONDS}s de pausa de segurança antes do próximo envio...`);
        for (let s = PACING_SECONDS; s > 0; s--) {
          if (!state.isRunning) break;
          document.getElementById('pyr-log-msg').innerText = `⏳ Próximo envio em ${s} segundos... [${state.currentIndex}/${CAMPAIGN_DATA.phones.length}]`;
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    if (state.currentIndex >= CAMPAIGN_DATA.phones.length) {
      state.isRunning = false;
      saveState();
      updateUI();
      logMsg(`🎉 <strong>CAMPANHA CONCLUÍDA COM SUCESSO!</strong> ${state.successfulCount} enviados.`);
      alert(`🎉 Automação Planta y Raíz Concluída!\nTotal de convites enviados com sucesso: ${state.successfulCount}`);
    }
  }

  // Inicializar UI ao colar o script
  createUI();
  logMsg('✨ Painel de Automação carregado! Clique em <strong>"▶️ Iniciar Automação"</strong> ou <strong>"🧪 Testar"</strong>.');

})();
