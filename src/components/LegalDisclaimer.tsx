import { Shield } from "lucide-react";

export const LegalDisclaimer = () => (
  <div className="mx-auto max-w-4xl px-4 py-3">
    <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-3 flex items-start gap-3">
      <Shield size={16} className="text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        <strong className="text-foreground/70">Aviso Legal:</strong> A Planta & Raiz é uma infraestrutura tecnológica autônoma de intermediação. A responsabilidade técnica pelo ato médico e a qualidade do produto comercializado cabem exclusivamente aos respectivos profissionais e lojistas cadastrados. Operação em conformidade com RDC 660/2022 e CFM 2314/2022.
      </p>
    </div>
  </div>
);
