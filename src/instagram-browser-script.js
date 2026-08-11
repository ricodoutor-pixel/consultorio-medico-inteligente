// 🌿 Planta y Raiz — Script Console para Instagram (@plantayraizltda)
// Como usar: Abra o Console do Chrome (F12 -> Console) na aba do Instagram e cole o código abaixo.

(async function autoFollowDoctors() {
  console.log("%c🌿 [Planta y Raiz] INICIANDO AUTO-SEGUIDOR DE MÉDICOS NO INSTAGRAM", "color: #10b981; font-size: 16px; font-weight: bold;");
  
  const doctorUsernames = [
    "drandrecavallini",
    "dr.carolinanocetti",
    "drmariogrieco",
    "dra.paulatrezena",
    "dr.eduardofaveret",
    "dramarianamaciel",
    "dr.renanabdalla",
    "drapatriciamontagner",
    "drpedromellopierro",
    "dra.amandageneroso",
    "drwellington_dor",
    "drajulianaramos",
    "dr.lucaszanetti",
    "draflaviaguimaraes",
    "drrodrigomesquita",
    "drbernardoalthoff",
    "dravanessamatalon",
    "dr.marceloschaurich",
    "dracamilalourenco",
    "drgabrielrezende",
    "draleticiavasconcelos",
    "drfernandobaggio",
    "dramarianacosta",
    "drrafaelbecker",
    "dradenisezanata",
    "drgustavolinden",
    "drcarlosportela",
    "drafernandanogueira",
    "drtiagoguimaraes",
    "drarenatabittencourt",
    "drviniciusandrade",
    "dratatianabarreto",
    "drhenriquealbuquerque",
    "drabeatrizvasconcelos",
    "cannabismedicinalbrasil",
    "medicinacanabinoide_br",
    "sociedadecanabica",
    "medicinaintegrativabr",
    "neurologiacanabinoide",
    "dorcronica_integrativa",
    "doutoresdocannabis",
    "clinicaverdemed",
    "institutoendocanabico",
    "fitoterapiamedica_br",
    "endocanabinologia"
  ];

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  let count = 0;

  for (const username of doctorUsernames) {
    count++;
    console.log(`%c[${count}/${doctorUsernames.length}] Acessando médico: @${username}`, "color: #059669; font-weight: bold;");

    // Cria um iframe ou navega
    window.location.href = `https://www.instagram.com/${username}/`;
    
    // O navegador recarrega na nova URL e continua
    break;
  }
})();
