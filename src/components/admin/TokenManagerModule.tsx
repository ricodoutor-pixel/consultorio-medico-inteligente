import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2, Shield, Key, ExternalLink } from "lucide-react";

export function TokenManagerModule() {
  const [testingFb, setTestingFb] = useState(false);
  const [testingIg, setTestingIg] = useState(false);
  const [fbStatus, setFbStatus] = useState<"idle" | "ok" | "error">("idle");
  const [igStatus, setIgStatus] = useState<"idle" | "ok" | "error">("idle");
  const [fbError, setFbError] = useState("");
  const [igError, setIgError] = useState("");
  const [tokenAuditLog, setTokenAuditLog] = useState<Array<{ time: string; status: string; platform: string }>>(() => {
    const saved = localStorage.getItem("token_audit_log");
    return saved ? JSON.parse(saved) : [];
  });

  const addAuditEntry = (platform: string, status: string) => {
    const entry = { time: new Date().toISOString(), status, platform };
    const updated = [entry, ...tokenAuditLog].slice(0, 10);
    setTokenAuditLog(updated);
    localStorage.setItem("token_audit_log", JSON.stringify(updated));
  };

  const testFacebookConnection = async () => {
    setTestingFb(true);
    setFbStatus("idle");
    setFbError("");
    try {
      const { data, error } = await supabase.functions.invoke("social-analytics", {
        body: { action: "page_insights", period: "day" },
      });
      if (error) {
        setFbStatus("error");
        setFbError(error.message);
        addAuditEntry("Facebook", "error");
        toast.error("Facebook: Conexão falhou");
      } else if (data?.success) {
        setFbStatus("ok");
        addAuditEntry("Facebook", "ok");
        toast.success("Facebook: Conexão OK!");
      } else {
        setFbStatus("error");
        setFbError(data?.error || "Unknown error");
        addAuditEntry("Facebook", "error");
        toast.error("Facebook: " + (data?.error || "Erro desconhecido"));
      }
    } catch (e) {
      setFbStatus("error");
      setFbError(String(e));
      toast.error("Facebook: Erro de rede");
    }
    setTestingFb(false);
  };

  const testInstagramConnection = async () => {
    setTestingIg(true);
    setIgStatus("idle");
    setIgError("");
    try {
      const { data, error } = await supabase.functions.invoke("social-analytics", {
        body: { action: "ig_insights", period: "day" },
      });
      if (error) {
        setIgStatus("error");
        setIgError(error.message);
        addAuditEntry("Instagram", "error");
        toast.error("Instagram: Conexão falhou");
      } else if (data?.success) {
        setIgStatus("ok");
        addAuditEntry("Instagram", "ok");
        toast.success("Instagram: Conexão OK!");
      } else {
        setIgStatus("error");
        setIgError(data?.error || "Unknown error");
        addAuditEntry("Instagram", "error");
        toast.error("Instagram: " + (data?.error || "Erro desconhecido"));
      }
    } catch (e) {
      setIgStatus("error");
      setIgError(String(e));
      toast.error("Instagram: Erro de rede");
    }
    setTestingIg(false);
  };

  const credentials = [
    { name: "FACEBOOK_APP_ID", display: "Facebook App ID", value: "931014069567110" },
    { name: "FACEBOOK_PAGE_ID", display: "Facebook Page ID", value: "61582712519325" },
    { name: "INSTAGRAM_BUSINESS_ACCOUNT_ID", display: "Instagram Business ID", value: "1283674517188119" },
    { name: "FACEBOOK_GRAPH_API_TOKEN", display: "Graph API Token", value: "••••••••" },
    { name: "FACEBOOK_APP_TOKEN", display: "App Token", value: "••••••••" },
    { name: "MANYCHAT_API_KEY", display: "ManyChat API Key", value: "••••••••" },
  ];

  return (
    <div className="space-y-4">
      {/* Connection Test */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-600/20 flex items-center justify-center">
                <span className="text-xs">f</span>
              </div>
              Facebook Page
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex items-center gap-2">
              <Button
                onClick={testFacebookConnection}
                disabled={testingFb}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-xs h-8"
              >
                {testingFb ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                Test Connection
              </Button>
              {fbStatus === "ok" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
              {fbStatus === "error" && <XCircle className="w-4 h-4 text-red-400" />}
            </div>
            {fbError && (
              <p className="text-[10px] text-red-300 bg-red-500/10 rounded p-2 break-all">{fbError}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <span className="text-xs">📷</span>
              </div>
              Instagram Business
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex items-center gap-2">
              <Button
                onClick={testInstagramConnection}
                disabled={testingIg}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs h-8"
              >
                {testingIg ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                Test Connection
              </Button>
              {igStatus === "ok" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
              {igStatus === "error" && <XCircle className="w-4 h-4 text-red-400" />}
            </div>
            {igError && (
              <p className="text-[10px] text-red-300 bg-red-500/10 rounded p-2 break-all">{igError}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Credentials Overview */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Key className="w-4 h-4" /> Credenciais Configuradas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {credentials.map((cred) => (
              <div key={cred.name} className="flex items-center justify-between bg-slate-700/20 rounded-lg px-3 py-2">
                <div>
                  <p className="text-[11px] text-slate-400">{cred.display}</p>
                  <p className="text-xs text-slate-200 font-mono">{cred.value}</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] h-4">✓</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Required Permissions */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm text-slate-300">Permissões Necessárias (Facebook App)</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            {[
              { perm: "pages_manage_posts", desc: "Publicar posts na página" },
              { perm: "pages_read_engagement", desc: "Ler métricas de engajamento" },
              { perm: "pages_read_user_content", desc: "Ler conteúdo de usuários" },
              { perm: "instagram_basic", desc: "Acesso básico ao Instagram" },
              { perm: "instagram_content_publish", desc: "Publicar conteúdo no IG" },
              { perm: "instagram_manage_insights", desc: "Acessar insights do IG" },
            ].map((p) => (
              <div key={p.perm} className="flex items-center justify-between bg-slate-700/20 rounded px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <code className="text-[10px] text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded">{p.perm}</code>
                  <span className="text-[10px] text-slate-500">{p.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <a
            href="https://developers.facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-3"
          >
            <ExternalLink className="w-3 h-3" /> Abrir Facebook Developer Console
          </a>
        </CardContent>
      </Card>

      {/* Token Audit Log */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Log de Auditoria de Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {tokenAuditLog.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Nenhum teste de conexão registrado ainda. Clique em "Test Connection" acima.</p>
          ) : (
            <div className="space-y-1.5">
              {tokenAuditLog.map((entry, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-700/20 rounded px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    {entry.status === "ok" ? (
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-400" />
                    )}
                    <span className="text-[11px] text-slate-300">{entry.platform}</span>
                    <Badge className={`text-[9px] h-4 ${entry.status === "ok" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                      {entry.status === "ok" ? "Validado" : "Falhou"}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(entry.time).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
