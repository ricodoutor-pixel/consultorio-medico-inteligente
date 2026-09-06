import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `            <LocalCTABanner />
            <AccessibilitySkipLink />
            <FacebookPixelProvider />
            <ReferralCaptureProvider />
            <FrogChatModal />
            <ShoppingCart />
            <OnboardingModal />
            <ConsentManager />
            <Suspense fallback={<Loading />}>
              <main id="main-content" role="main">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/onboarding" element={<OnboardingFlow />} />
                <Route path="/onboarding-match" element={<OnboardingMatch />} />
                <Route path="/cadastro-completo" element={<OnboardingFlow />} />
                <Route path="/como-funciona" element={<ComoFunciona />} />
                <Route path="/profissionais" element={<Profissionais />} />
                <Route path="/profissionais/:id" element={<Profissionais />} />
                <Route path="/shopping" element={<Shopping />} />
                <Route path="/shopping/:id" element={<Shopping />} />
                <Route path="/loja" element={<Shopping />} />
                <Route path="/loja/:id" element={<Shopping />} />
                <Route path="/planos" element={<Precos />} />
                <Route path="/precos" element={<Precos />} />
                <Route path="/saude-digital" element={<SaudeDigital />} />
                <Route path="/convite-medico" element={<ConviteMedico />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/manual" element={<ManualPlataforma />} />
                <Route path="/contato" element={<Contato />} />
                <Route path="/pay" element={<Pay />} />
                <Route path="/carteira" element={<Carteira />} />
                <Route path="/cadastro-profissional" element={<CadastroProfissional />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/falar-com-especialista" element={<FalarComEspecialista />} />`;

// We replace everything between <DynamicSEOHead /> and <Route path="/telemedicina" element={<Telemedicina />} />

const startMarker = '<DynamicSEOHead />';
const endMarker = '<Route path="/telemedicina" element={<Telemedicina />} />';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex + startMarker.length) + '\n' + replacement + '\n                ' + content.substring(endIndex);
    fs.writeFileSync('src/App.tsx', newContent, 'utf8');
    console.log('App.tsx fixed');
} else {
    console.log('Markers not found');
}
