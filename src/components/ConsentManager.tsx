import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Eye, MapPin, HeartPulse } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


const CONSENT_VERSION = "2.1";
const CONSENT_TYPES = [
  "terms_of_use",
  "privacy_policy",
  "medical_data_processing",
  "geolocation_emergency",
  "health_data_wearables",
] as const;

export function ConsentManager() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => { checkConsent(); }, []);

  const checkConsent = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("user_consents")
      .select("consent_type")
      .eq("user_id", session.user.id)
      .eq("version", CONSENT_VERSION)
      .eq("accepted", true);
    const accepted = new Set((data || []).map((c: any) => c.consent_type));
    const missing = CONSENT_TYPES.filter((t) => !accepted.has(t));
    if (missing.length > 0) setShow(true);
  };

  const handleAcceptAll = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const inserts = CONSENT_TYPES.map((type) => ({
      user_id: session.user.id,
      consent_type: type,
      version: CONSENT_VERSION,
      accepted: true,
      user_agent: navigator.userAgent,
    }));

    const { error } = await supabase.from("user_consents").insert(inserts);
    if (!error) {
      setShow(false);
      toast({ title: "Consentimento registrado ✅", description: "Termos LGPD, geolocalização e saúde aceitos." });
      // A localização NÃO é solicitada aqui. Só é pedida quando o médico fica ONLINE
      // ou quando um paciente logado busca médicos (ver src/lib/geolocation-capture.ts).

    }
    setLoading(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-emerald-500/20 bg-[#0a0c10]/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Termos, Privacidade & Saúde</h2>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Para acessar a Mega Clínica Digital Planta y Raiz, aceite os termos abaixo conforme a LGPD (Lei 13.709/2018), RDC 660/2022 (ANVISA) e Resolução CFM 2.314/2022.
        </p>

        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
          {[
            { icon: FileText, label: "Termos de Uso v2.1", desc: "Condições de utilização da plataforma de telemedicina." },
            { icon: Shield, label: "Política de Privacidade", desc: "Tratamento de dados pessoais e sensíveis (LGPD)." },
            { icon: Eye, label: "Processamento de Dados Médicos", desc: "Consentimento específico para dados de saúde (LGPD Art. 11)." },
            { icon: MapPin, label: "Geolocalização para Emergência", desc: "Autorizo o uso da minha localização (cidade/região e coordenadas) para socorro médico em situação de risco." },
            { icon: HeartPulse, label: "Dados de Saúde & Wearables", desc: "Autorizo a leitura de batimentos cardíacos, atividade e saúde via dispositivos conectados (Smartwatch, Google Fit, Apple Health) para acompanhamento clínico." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <item.icon className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={handleAcceptAll}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3"
        >
          {loading ? "Registrando..." : "Aceitar Todos os Termos"}
        </Button>
        <p className="text-[10px] text-gray-600 text-center mt-3">
          Você pode revogar qualquer consentimento a qualquer momento em <a href="/lgpd" className="underline">Meus Direitos LGPD</a>. DPO: dpo@plantayraiz.com.br
        </p>
      </div>
    </div>
  );
}
