import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { verifyAndEnsureAdmin } from "@/lib/admin-auth";
import { adminIdleState, completeLogout, isAccountStorageKey } from "@/lib/account-session";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";

type Account = { user: User | null; fullName: string; avatarUrl?: string; isAdmin: boolean; loading: boolean; signingOut: boolean; logout: (global?: boolean) => Promise<void> };
const AccountContext = createContext<Account | null>(null);
export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("AccountProvider required");
  return value;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [warning, setWarning] = useState(false);
  const lastActivity = useRef(Date.now());
  const busy = useRef(false);
  const verifiedId = useRef<string | null>(null);

  useEffect(() => {
    let alive = true; let generation = 0;
    const refresh = async (auditLogin = false) => {
      const current = ++generation;
      const { data: { user: verified } } = await supabase.auth.getUser();
      if (!alive || current !== generation) return;
      if (!verified) { verifiedId.current = null; setUser(null); setIsAdmin(false); setFullName(""); setAvatarUrl(undefined); setLoading(false); return; }
      // Same account re-verifying (token refresh, back/forward): keep current access until the
      // server answers, so guards never see a false "not admin" gap. New account: hold the guards.
      if (verifiedId.current !== verified.id) { setIsAdmin(false); setLoading(true); }
      verifiedId.current = verified.id;
      setUser(verified);
      const [admin, profile] = await Promise.all([
        verifyAndEnsureAdmin(verified),
        supabase.from("profiles").select("full_name,avatar_url").eq("id", verified.id).maybeSingle(),
      ]);
      if (!alive || current !== generation) return;
      setIsAdmin(admin); setFullName(profile.data?.full_name || verified.email?.split("@")[0] || "Minha conta");
      setAvatarUrl(profile.data?.avatar_url || undefined); setLoading(false);
      if (admin && auditLogin) {
        const { error } = await supabase.from("audit_log").insert({ user_id: verified.id, record_id: verified.id, table_name: "auth_sessions", action: "admin_login", new_data: { device: navigator.userAgent, logged_in_at: new Date().toISOString() } });
        if (error) toast.warning("Não foi possível registrar a entrada na auditoria.");
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        generation++; verifiedId.current = null; setUser(null); setIsAdmin(false); setFullName(""); setAvatarUrl(undefined); setWarning(false); setLoading(false);
        void queryClient.cancelQueries(); queryClient.clear();
      } else {
        // A fresh sign-in must hold route guards until verification finishes.
        if (event === "SIGNED_IN" && !verifiedId.current) setLoading(true);
        window.setTimeout(() => { if (alive) void refresh(event === "SIGNED_IN"); }, 0); }
    });
    void refresh();
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) void refresh(); };
    window.addEventListener("pageshow", onPageShow);
    if (sessionStorage.getItem("account-logout-notice")) {
      sessionStorage.removeItem("account-logout-notice"); toast.success("Você saiu da conta.");
    }
    return () => { alive = false; generation++; subscription.unsubscribe(); window.removeEventListener("pageshow", onPageShow); };
  }, [queryClient]);

  const logout = async (global = false) => {
    if (busy.current) return;
    busy.current = true; setSigningOut(true);
    try {
      if (isAdmin && user) {
        // Records the request, not a fabricated successful logout; Auth records revocation.
        const { error } = await supabase.from("audit_log").insert({ user_id: user.id, record_id: user.id, table_name: "auth_sessions", action: global ? "admin_logout_global_requested" : "admin_logout_requested", new_data: { device: navigator.userAgent, requested_at: new Date().toISOString() } });
        if (error) toast.warning("Não foi possível registrar a solicitação na auditoria.");
      }
      await completeLogout(() => supabase.auth.signOut({ scope: global ? "global" : "local" }), async () => {
        setUser(null); setIsAdmin(false); setWarning(false);
        await queryClient.cancelQueries(); queryClient.clear();
        await supabase.removeAllChannels();
        for (const store of [localStorage, sessionStorage]) {
          for (const key of Object.keys(store)) if (isAccountStorageKey(key)) store.removeItem(key);
        }
        for (const cookie of document.cookie.split(";")) {
          const name = cookie.split("=")[0].trim();
          if (isAccountStorageKey(name)) document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
        }
        sessionStorage.setItem("account-logout-notice", "1");
      }, () => window.location.replace("/"));
    } catch {
      toast.error("Não foi possível sair. Verifique sua conexão e tente novamente.");
      busy.current = false; setSigningOut(false);
    }
  };

  useEffect(() => {
    if (!isAdmin || !user) return;
    lastActivity.current = Date.now();
    const activity = () => {
      if (adminIdleState(lastActivity.current, Date.now()) === "expired") { void logout(); return; }
      if (adminIdleState(lastActivity.current, Date.now()) === "active") lastActivity.current = Date.now();
    };
    const check = () => {
      const state = adminIdleState(lastActivity.current, Date.now());
      setWarning(state === "warning"); if (state === "expired") void logout();
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, activity, { passive: true }));
    document.addEventListener("visibilitychange", check);
    const timer = window.setInterval(check, 1000);
    return () => { clearInterval(timer); events.forEach(e => window.removeEventListener(e, activity)); document.removeEventListener("visibilitychange", check); };
  }, [isAdmin, user?.id]);

  return <AccountContext.Provider value={{ user, fullName, avatarUrl, isAdmin, loading, signingOut, logout }}>
    {children}
    <AlertDialog open={warning}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Sua sessão vai terminar</AlertDialogTitle><AlertDialogDescription>Você está há 29 minutos sem usar sua conta. Continuar conectado?</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><Button variant="outline" disabled={signingOut} onClick={() => void logout()}>Sair da conta</Button><Button onClick={() => { lastActivity.current = Date.now(); setWarning(false); }}>Continuar conectado</Button></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </AccountContext.Provider>;
}