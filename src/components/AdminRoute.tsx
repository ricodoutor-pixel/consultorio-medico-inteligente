import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { verifyAndEnsureAdmin } from "@/lib/admin-auth";
import { useAccount } from "@/contexts/AccountContext";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { loading, user, isAdmin } = useAccount();

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }

  return <>{children}</>;
};
