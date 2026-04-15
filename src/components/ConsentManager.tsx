import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CONSENT_VERSION = "2.0";
const CONSENT_TYPES = ["terms_of_use", "privacy_policy", "medical_data_processing"] as const;

export function ConsentManager() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConsent();
  }, []);

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
    if (!session) return;

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
      toast({ title: "Consentimento registrado", description: "Seus termos foram aceitos com sucesso." });
    }
    setLoading(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-emerald-500/20 bg-[#0a0c10]/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Termos & Privacidade</h2>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Para continuar usando a plataforma, é necessário aceitar os termos atualizados conforme a LGPD e regulamentações ANVISA.
        </p>

        <div className="space-y-3 mb-6">
          {[
            { icon: FileText, label: "Termos de Uso v2.0", desc: "Condições gerais de utilização da plataforma" },
            { icon: Shield, label: "Política de Privacidade", desc: "Como tratamos seus dados pessoais e sensíveis" },
            { icon: Eye, label: "Processamento de Dados Médicos", desc: "Consentimento específico para dados de saúde (LGPD Art. 11)" },
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
          Ao aceitar, você concorda com o tratamento dos seus dados conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
        </p>
      </div>
    </div>
  );
}
