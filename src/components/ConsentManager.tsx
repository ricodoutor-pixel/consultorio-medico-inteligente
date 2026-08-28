import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, FileText, Eye, MapPin, HeartPulse, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CONSENT_VERSION = "2.1";
const STORAGE_KEY = `pyr_terms_accepted_v${CONSENT_VERSION.replace(".", "_")}`;

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

  useEffect(() => {
    checkConsent();
  }, []);

  const checkConsent = async () => {
    // 1. Se já aceitou no localStorage deste dispositivo, nunca trava o usuário
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") {
        setShow(false);
        return;
      }
    } catch {
      // ignore
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        // Usuário visitante: só mostra se não tiver aceito localmente
        const isAccepted = localStorage.getItem(STORAGE_KEY) === "true";
        if (!isAccepted) {
          setShow(true);
        }
        return;
      }

      const { data, error } = await supabase
        .from("user_consents")
        .select("consent_type")
        .eq("user_id", session.user.id)
        .eq("version", CONSENT_VERSION)
        .eq("accepted", true);

      if (!error && data) {
        const accepted = new Set(data.map((c: any) => c.consent_type));
        const missing = CONSENT_TYPES.filter((t) => !accepted.has(t));
        if (missing.length === 0) {
          localStorage.setItem(STORAGE_KEY, "true");
          setShow(false);
          return;
        }
      }
      setShow(true);
    } catch {
      // Fallback seguro: se falhar conexão, confia no localStorage
      if (localStorage.getItem(STORAGE_KEY) === "true") {
        setShow(false);
      }
    }
  };

  const handleAcceptAll = async () => {
    setLoading(true);

    // 1. SEMPRE grava no localStorage imediatamente para NUNCA travar a tela
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      localStorage.setItem("plr_cookie_consent", JSON.stringify({
        version: CONSENT_VERSION,
        accepted_at: new Date().toISOString(),
        categories: { essential: true, analytics: true, marketing: true, personalization: true }
      }));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }

    // 2. Fecha o modal imediatamente
    setShow(false);
    setLoading(false);
    toast({
      title: "Termos aceitos com sucesso ✅",
      description: "Acesso liberado à Mega Clínica Digital Planta y Raíz."
    });

    // 3. Sincroniza em background no Supabase caso o usuário esteja logado
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const inserts = CONSENT_TYPES.map((type) => ({
          user_id: session.user.id,
          consent_type: type,
          version: CONSENT_VERSION,
          accepted: true,
          user_agent: navigator.userAgent || "WebClient",
        }));

        await supabase.from("user_consents").upsert(inserts as any).catch(() => {});
      }
    } catch (e) {
      console.warn("Background consent sync error:", e);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-[#0a0c10]/98 p-6 shadow-2xl backdrop-blur-2xl max-h-[90dvh] flex flex-col justify-between overflow-y-auto">
        {/* Botão de Fechar no Topo */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fechar termos"
        >
          <X size={20} />
        </button>

        <div>
          <div className="flex items-center gap-3 mb-3 pr-8">
            <Shield className="h-7 w-7 text-emerald-400 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">Termos, Privacidade & Saúde</h2>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 mb-4 leading-relaxed">
            Para acessar a Mega Clínica Digital Planta y Raíz, confirme a concordância com os termos conforme a LGPD (Lei 13.709/2018), RDC 660/2022 (ANVISA) e Resolução CFM 2.314/2022.
          </p>

          <div className="space-y-2 mb-5 max-h-56 overflow-y-auto pr-1">
            {[
              { icon: FileText, label: "Termos de Uso v2.1", desc: "Condições de utilização da plataforma de telemedicina." },
              { icon: Shield, label: "Política de Privacidade", desc: "Tratamento de dados pessoais e sensíveis (LGPD)." },
              { icon: Eye, label: "Processamento de Dados Médicos", desc: "Consentimento específico para dados de saúde (LGPD Art. 11)." },
              { icon: MapPin, label: "Geolocalização para Emergência", desc: "Autorizo o uso da localização para socorro médico e busca de especialistas próximos." },
              { icon: HeartPulse, label: "Dados de Saúde & Wearables", desc: "Acompanhamento clínico integrado a dispositivos de saúde e biometria." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-2.5">
                <item.icon className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white leading-tight">{item.label}</p>
                  <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Button
            onClick={handleAcceptAll}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-sm rounded-xl shadow-lg shadow-emerald-950 transition-all active:scale-[0.99]"
          >
            {loading ? "Registrando..." : "Aceitar Todos os Termos"}
          </Button>

          <p className="text-[10px] text-zinc-400 text-center mt-3">
            Você pode gerenciar ou revogar seu consentimento a qualquer momento em <a href="/lgpd" className="underline text-emerald-400">Meus Direitos LGPD</a>. DPO: dpo@plantayraiz.com.br
          </p>
        </div>
      </div>
    </div>
  );
}
