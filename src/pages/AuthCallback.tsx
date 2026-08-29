import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ROUTE_BY_ROLE: Record<string, string> = {
  paciente: "/dashboard",
  medico: "/dashboard-medico",
  profissional: "/dashboard-medico",
  cuidador: "/dashboard-medico",
  farmacia: "/lojistas",
  lojista: "/lojistas",
  vendor: "/lojistas",
  produtor: "/dashboard/professional",
};

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const role = localStorage.getItem("pr_pending_signup_role") || "paciente";
      const redirect = localStorage.getItem("pr_pending_redirect");

      // Aguarda sessão
      let session = null;
      for (let i = 0; i < 20; i++) {
        const r = await supabase.auth.getSession();
        if (r.data.session) { session = r.data.session; break; }
        await new Promise((res) => setTimeout(res, 200));
      }

      if (session?.user) {
        // Grava role e tipo no profile
        await supabase.from("profiles").update({
          signup_role: role,
          user_type: role === "medico" || role === "profissional" || role === "cuidador" ? "doctor"
                   : role === "farmacia" || role === "lojista" ? "pharmacy"
                   : role === "produtor" ? "producer"
                   : "patient",
        }).eq("id", session.user.id);

        // Geolocalização NÃO é solicitada no login. Apenas quando o médico fica ONLINE
        // ou quando um paciente logado busca médicos.

      }

      localStorage.removeItem("pr_pending_signup_role");
      localStorage.removeItem("pr_pending_redirect");

      const target = redirect || ROUTE_BY_ROLE[role] || "/dashboard";
      navigate(target, { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-emerald-400 font-bold">Finalizando login…</p>
      </div>
    </div>
  );
}
