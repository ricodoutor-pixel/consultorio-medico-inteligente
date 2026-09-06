const fs = require('fs');

// 1. Fix Cadastro.tsx
let cadastro = fs.readFileSync('src/pages/Cadastro.tsx', 'utf8');
if (!cadastro.includes("{type === 'paciente' && (")) {
  cadastro = cadastro.replace(
    "{/* Google login dedicado por categoria */}", 
    "{type === 'paciente' && (\n              <>\n              {/* Google login dedicado por categoria */}"
  );
  cadastro = cadastro.replace(
    "Ao continuar, você aceita os Termos LGPD e autoriza captura de localização para emergências.\n                </p>\n              </div>",
    "Ao continuar, você aceita os Termos LGPD e autoriza captura de localização para emergências.\n                </p>\n              </div>\n              </>\n              )}"
  );
  fs.writeFileSync('src/pages/Cadastro.tsx', cadastro);
}

// 2. Fix Login.tsx
let login = fs.readFileSync('src/pages/Login.tsx', 'utf8');
// Only allow if loginType is 'paciente'
if (!login.includes("{loginType === 'paciente' && (")) {
  login = login.replace(
    /<Button\s+type="button"\s+variant="outline"\s+className="w-full relative h-12 hover:bg-muted\/50 transition-all"\s+onClick=\{handleGoogleLogin\}\s+disabled=\{isLoading\}\s+>/,
    "{loginType === 'paciente' && (\n                    <Button\n                      type=\"button\"\n                      variant=\"outline\"\n                      className=\"w-full relative h-12 hover:bg-muted/50 transition-all\"\n                      onClick={handleGoogleLogin}\n                      disabled={isLoading}\n                    >"
  );
  login = login.replace(
    /Continuar com Google<\/span>\n                    <\/Button>/,
    "Continuar com Google</span>\n                    </Button>\n                  )}"
  );
  fs.writeFileSync('src/pages/Login.tsx', login);
}

// 3. AdminLogin.tsx
let admin = fs.readFileSync('src/pages/AdminLogin.tsx', 'utf8');
if (admin.includes('handleGoogleLogin')) {
  // Remove the Google login button from AdminLogin
  admin = admin.replace(/<div className="relative my-6">[\s\S]*?Entrar com Google\s*<\/span>\s*<\/Button>/, '');
  fs.writeFileSync('src/pages/AdminLogin.tsx', admin);
}

console.log('Fixed auth pages');
