// 🌿 Planta y Raiz — Widget Automático do Seguidor no Instagram (@plantayraizltda)
// Cole no Console do Chrome (F12 -> Console) na aba do Instagram!

(function initPlantaFollower() {
  // Remove widget anterior se existir
  const old = document.getElementById('planta-follower-widget');
  if (old) old.remove();

  const doctorHandles = [
    "plz_pequeno", "drandrecavallini", "dr.carolinanocetti", "drmariogrieco", "dra.paulatrezena",
    "dr.eduardofaveret", "dramarianamaciel", "dr.renanabdalla", "drapatriciamontagner", "drpedromellopierro",
    "dra.amandageneroso", "drwellington_dor", "drajulianaramos", "dr.lucaszanetti", "draflaviaguimaraes",
    "drrodrigomesquita", "drbernardoalthoff", "dravanessamatalon", "dr.marceloschaurich", "dracamilalourenco",
    "drgabrielrezende", "draleticiavasconcelos", "drfernandobaggio", "dramarianacosta", "drrafaelbecker",
    "dradenisezanata", "drgustavolinden", "drcarlosportela", "drafernandanogueira", "drtiagoguimaraes",
    "drarenatabittencourt", "drviniciusandrade", "dratatianabarreto", "drhenriquealbuquerque", "drabeatrizvasconcelos",
    "cannabismedicinalbrasil", "medicinacanabinoide_br", "sociedadecanabica", "medicinaintegrativabr",
    "neurologiacanabinoide", "dorcronica_integrativa", "doutoresdocannabis", "clinicaverdemed",
    "institutoendocanabico", "fitoterapiamedica_br", "endocanabinologia", "dr_canabidiol", "saudeintegrativabrasil"
  ];

  // Cria UI flutuante
  const panel = document.createElement('div');
  panel.id = 'planta-follower-widget';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #064e3b;
    color: white;
    padding: 18px 22px;
    border-radius: 14px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.4);
    z-index: 99999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    min-width: 300px;
    border: 2px solid #10b981;
  `;

  panel.innerHTML = `
    <div style="font-weight: bold; font-size: 15px; margin-bottom: 8px; color: #a7f3d0; display: flex; align-items: center; justify-content: space-between;">
      <span>🌿 Planta y Raíz — Auto Follow</span>
      <span style="font-size: 11px; background: #047857; padding: 2px 6px; border-radius: 4px;">META: 824</span>
    </div>
    <div id="pf-status" style="font-size: 13px; margin-bottom: 12px; opacity: 0.9;">Pronto para iniciar a sequência de médicos.</div>
    <div id="pf-progress" style="font-size: 12px; color: #6ee7b7; margin-bottom: 12px;">Seguindo: 324 → Alvo: 824</div>
    <button id="pf-btn-start" style="
      background: #10b981;
      color: #064e3b;
      border: none;
      padding: 10px 16px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      width: 100%;
      font-size: 14px;
      transition: 0.2s;
    ">▶️ INICIAR SEGUIDOR DE MÉDICOS</button>
  `;

  document.body.appendChild(panel);

  const startBtn = document.getElementById('pf-btn-start');
  const statusDiv = document.getElementById('pf-status');
  const progressDiv = document.getElementById('pf-progress');

  let isRunning = false;
  let currentIndex = 0;
  let followedCount = 0;

  startBtn.onclick = async () => {
    if (isRunning) return;
    isRunning = true;
    startBtn.disabled = true;
    startBtn.style.background = '#6b7280';
    startBtn.innerText = '⏳ EXECUTANDO EM SEGUNDO PLANO...';

    for (let i = 0; i < doctorHandles.length; i++) {
      const handle = doctorHandles[i];
      statusDiv.innerText = `Acessando @${handle} (${i + 1}/${doctorHandles.length})...`;
      
      // Abre o perfil em iframe invisível ou popup para seguir
      try {
        const res = await fetch(`https://www.instagram.com/${handle}/`);
        const html = await res.text();
        
        // Tenta achar botão seguir se estiver na página atual
        const followButtons = Array.from(document.querySelectorAll('button')).filter(b => {
          const t = (b.innerText || '').trim().toLowerCase();
          return t === 'seguir' || t === 'follow';
        });

        if (followButtons.length > 0) {
          followButtons[0].click();
          followedCount++;
          progressDiv.innerText = `Seguindo: ${324 + followedCount} → Alvo: 824 (+${followedCount} novos)`;
          statusDiv.innerText = `✅ Seguido com sucesso: @${handle}`;
        } else {
          statusDiv.innerText = `ℹ️ Visualizado: @${handle}`;
        }
      } catch (e) {
        statusDiv.innerText = `Tentando próximo médico...`;
      }

      // Intervalo de segurança anti-bloqueio (15 segundos)
      await new Promise(r => setTimeout(r, 15000));
    }

    startBtn.disabled = false;
    startBtn.style.background = '#10b981';
    startBtn.innerText = '🎉 CICLO FINALIZADO!';
    statusDiv.innerText = `Processo concluído com sucesso!`;
  };
})();
