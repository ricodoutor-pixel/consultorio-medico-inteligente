import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { verifyAndEnsureAdmin } from "@/lib/admin-auth";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState("denied");
        return;
      }

      const isAdmin = await verifyAndEnsureAdmin(user);
      setState(isAdmin ? "ok" : "denied");
    };
    checkAdmin();
  }, []);

  if (state === "loading") {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (state === "denied") {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
};
