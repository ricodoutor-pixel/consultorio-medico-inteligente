const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

async function pushFile(path, message) {
  if (!fs.existsSync(path)) {
    console.log('SKIP (not found): ' + path);
    return;
  }
  const buffer = fs.readFileSync(path);
  const base64Content = buffer.toString('base64');

  const getRes = await fetch('https://api.github.com/repos/ricodoutor-pixel/consultorio-medico-inteligente/contents/' + path, {
    headers: {
      'Authorization': 'token ' + process.env.GITHUB_TOKEN,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Node.js'
    }
  });

  let sha;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }

  const putRes = await fetch('https://api.github.com/repos/ricodoutor-pixel/consultorio-medico-inteligente/contents/' + path, {
    method: 'PUT',
    headers: {
      'Authorization': 'token ' + process.env.GITHUB_TOKEN,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Node.js'
    },
    body: JSON.stringify({
      message: message,
      content: base64Content,
      sha: sha,
      branch: 'main'
    })
  });

  if (putRes.ok) {
    console.log('✅ ' + path);
  } else {
    const errText = await putRes.text();
    console.error('❌ ' + path + ' → ' + putRes.status + ': ' + errText.slice(0, 200));
  }
}

async function run() {
  console.log('🚀 Deploy Farmácia Virtual & Fachada Oficial\n');
  const msg = 'feat(farmacia): Official Fachada, Logo and 10 medicines catalog for Planta y Raiz Ltda';

  await pushFile('src/assets/farmacia-fachada.jpg', msg);
  await pushFile('src/assets/logo-farmacia.jpg', msg);
  await pushFile('public/farmacia-fachada.jpg', msg);
  await pushFile('public/logo-farmacia.jpg', msg);
  await pushFile('src/lib/productImages.ts', msg);
  await pushFile('src/components/ImageLightboxModal.tsx', msg);
  await pushFile('src/components/FarmaciaCard.tsx', msg);
  await pushFile('src/hooks/useLojista.ts', msg);
  await pushFile('src/hooks/useDeliveryTracking.ts', msg);
  await pushFile('src/components/MasterPortalSwitcher.tsx', msg);
  await pushFile('src/components/delivery/MedicamentoSatelliteTracker.tsx', msg);
  await pushFile('src/components/delivery/RastreioPedidoModal.tsx', msg);
  await pushFile('src/pages/Login.tsx', msg);
  await pushFile('src/pages/CadastroFarmacia.tsx', msg);
  await pushFile('src/pages/LojistaDashboard.tsx', msg);
  await pushFile('src/pages/FarmaciaVirtual.tsx', msg);
  await pushFile('src/pages/DashboardPaciente.tsx', msg);
  await pushFile('src/pages/Prontuario.tsx', msg);
  await pushFile('src/pages/EntregadorGPS.tsx', msg);
  await pushFile('src/components/patient/PatientInvoicesList.tsx', msg);
  await pushFile('src/components/admin/AdminFiscalManagement.tsx', msg);
  await pushFile('src/pages/Admin.tsx', msg);
  await pushFile('src/main.tsx', msg);
  await pushFile('src/lib/runtime-recovery.tsx', msg);
  await pushFile('src/pages/ManualPlataforma.tsx', msg);
  await pushFile('src/data/professionals.ts', msg);
  await pushFile('src/hooks/useRealProfessionals.ts', msg);
  await pushFile('src/pages/Profissionais.tsx', msg);
  await pushFile('src/components/doctor/DoctorContractModal.tsx', msg);
  await pushFile('src/components/admin/DoctorContractViewerModal.tsx', msg);
  await pushFile('src/components/admin/DoctorKycPipeline.tsx', msg);
  await pushFile('src/pages/DashboardMedico.tsx', msg);
  await pushFile('src/pages/admin/AdminAprovacoes.tsx', msg);
  await pushFile('src/pages/admin/AdminAprovacoesFarmacias.tsx', msg);
  await pushFile('src/components/admin/PharmacyKycDocViewer.tsx', msg);
  await pushFile('src/lib/pharmacy-kyc-docs.ts', msg);
  await pushFile('src/App.tsx', msg);
  await pushFile('supabase/migrations/20260830150000_planta_y_raiz_catalog.sql', msg);
  await pushFile('supabase/migrations/20260831000001_automated_invoicing_engine.sql', msg);
  await pushFile('supabase/migrations/20260901000001_doctor_contract_signing.sql', msg);
  await pushFile('supabase/functions/auto-invoice-engine/index.ts', msg);
  await pushFile('supabase/functions/generate-doctor-contract/index.ts', msg);

  console.log('\n🎯 Deploy concluído com sucesso!');
}

run();
