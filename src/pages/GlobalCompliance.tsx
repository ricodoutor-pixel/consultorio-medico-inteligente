import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Globe, Lock, FileText, Server, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const REGIONS = [
  {
    flag: "🇧🇷",
    name: "Brasil",
    regulations: ["CFM Res. 2.314/2022", "CFM Res. 2.454/2026 (IA)", "LGPD", "ANVISA RDC 327/2019"],
    signature: "ICP-Brasil (e-CPF A3/Nuvem)",
    dataResidency: "AWS São Paulo (sa-east-1)",
    icd: "CID-10 / CID-11",
    providerVerification: "CRM + RQE via barramento CFM",
    status: "active",
  },
  {
    flag: "🇺🇸",
    name: "United States",
    regulations: ["HIPAA", "HITECH Act", "21st Century Cures Act"],
    signature: "ESIGN Act / UETA",
    dataResidency: "AWS Ohio (us-east-2)",
    icd: "ICD-10-CM / ICD-11",
    providerVerification: "NPI (National Provider Identifier)",
    status: "planned",
  },
  {
    flag: "🇧🇴",
    name: "Bolivia",
    regulations: ["Ley 164 (Telecomunicaciones)", "ASES Sistema de Salud"],
    signature: "ADSIB Assinatura Digital",
    dataResidency: "AWS São Paulo (latam proxy)",
    icd: "CIE-10 / CIE-11",
    providerVerification: "Colegio Médico de Bolivia",
    status: "planned",
  },
  {
    flag: "🌎",
    name: "América Latina",
    regulations: ["Aliança do Pacífico", "Leis locais de proteção de dados"],
    signature: "Leis de Assinatura Eletrônica locais",
    dataResidency: "Multi-região (AWS Local Zones)",
    icd: "CIE-10 / CIE-11",
    providerVerification: "Colegios Médicos nacionais",
    status: "planned",
  },
];

const SECURITY_FEATURES = [
  { icon: Lock, label: "AES-256", desc: "Criptografia de dados em repouso" },
  { icon: Shield, label: "TLS 1.3", desc: "Dados em trânsito criptografados" },
  { icon: Lock, label: "E2EE", desc: "Vídeo e chat com criptografia ponta-a-ponta" },
  { icon: Server, label: "Soberania", desc: "Dados armazenados na região do paciente" },
  { icon: FileText, label: "Audit Trail", desc: "Logs imutáveis de todas as ações" },
  { icon: CheckCircle2, label: "WCAG 2.1", desc: "Acessibilidade universal" },
];

const GlobalCompliance = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-xs border-primary/30">
            <Globe size={12} className="mr-1" /> Global Telemedicine Compliance
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">
            Conformidade <span className="text-primary">Global</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Plataforma preparada para operação multi-jurisdicional com soberania de dados,
            interoperabilidade HL7 FHIR e padrão ICD-11 da OMS.
          </p>
        </motion.div>

        {/* Security Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
          {SECURITY_FEATURES.map((feat, i) => (
            <motion.div key={feat.label} initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: i * 0.05 }}>
              <Card className="text-center h-full border-border/50">
                <CardContent className="p-3">
                  <feat.icon size={20} className="mx-auto text-primary mb-1" />
                  <p className="text-xs font-black">{feat.label}</p>
                  <p className="text-[10px] text-muted-foreground">{feat.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Regions */}
        <div className="grid md:grid-cols-2 gap-6">
          {REGIONS.map((region, i) => (
            <motion.div key={region.name} initial="hidden" animate="visible" variants={fadeUp} transition={{ delay: i * 0.1 }}>
              <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">{region.flag}</span>
                    {region.name}
                    <Badge
                      variant={region.status === "active" ? "default" : "outline"}
                      className={`ml-auto text-[10px] ${region.status === "active" ? "bg-emerald-600" : ""}`}
                    >
                      {region.status === "active" ? "✅ Ativo" : "🔜 Planejado"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div>
                    <p className="font-bold text-muted-foreground mb-1 flex items-center gap-1">
                      <Shield size={10} /> Regulamentações
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {region.regulations.map(r => (
                        <Badge key={r} variant="outline" className="text-[10px] border-primary/20">{r}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-bold text-muted-foreground mb-0.5">📝 Assinatura Digital</p>
                      <p>{region.signature}</p>
                    </div>
                    <div>
                      <p className="font-bold text-muted-foreground mb-0.5">🏥 Classificação</p>
                      <p>{region.icd}</p>
                    </div>
                    <div>
                      <p className="font-bold text-muted-foreground mb-0.5">🖥️ Residência de Dados</p>
                      <p>{region.dataResidency}</p>
                    </div>
                    <div>
                      <p className="font-bold text-muted-foreground mb-0.5">🩺 Verificação Médica</p>
                      <p>{region.providerVerification}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* HL7 FHIR & ICD-11 */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mt-12">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h2 className="text-lg font-black mb-3 flex items-center gap-2">
                <Globe size={18} className="text-primary" />
                Interoperabilidade HL7 FHIR & ICD-11
              </h2>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h3 className="font-bold mb-2">HL7 FHIR R4</h3>
                  <ul className="space-y-1 text-muted-foreground text-xs">
                    <li>✅ Patient Resource (dados demográficos padronizados)</li>
                    <li>✅ Encounter Resource (registros de teleconsulta)</li>
                    <li>✅ Observation Resource (achados clínicos)</li>
                    <li>✅ MedicationRequest (prescrições digitais)</li>
                    <li>✅ Condition Resource (diagnósticos CID-10 → ICD-11)</li>
                    <li>✅ DiagnosticReport (laudos)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-2">ICD-11 (CID-11 — OMS 2022)</h3>
                  <ul className="space-y-1 text-muted-foreground text-xs">
                    <li>✅ Mapeamento automático CID-10 → ICD-11</li>
                    <li>✅ Busca multilíngue (PT/EN/ES)</li>
                    <li>✅ Códigos especializados para cannabis terapêutica</li>
                    <li>✅ Compatível com SUS e sistemas internacionais</li>
                    <li>✅ Exportação JSON/XML para integração</li>
                    <li>✅ Validação contra base da OMS</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* BAA Notice */}
        <div className="mt-8 p-4 border border-yellow-500/30 bg-yellow-500/5 rounded-xl text-xs text-muted-foreground">
          <p className="flex items-center gap-1 font-bold text-yellow-600 mb-1">
            <AlertTriangle size={12} /> Business Associate Agreement (BAA)
          </p>
          <p>
            Para operação nos EUA (HIPAA), a Planta & Raiz mantém BAA assinado com todos os provedores de infraestrutura
            (AWS, Evolution API, Supabase). Documentação disponível sob NDA para parceiros institucionais.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GlobalCompliance;
