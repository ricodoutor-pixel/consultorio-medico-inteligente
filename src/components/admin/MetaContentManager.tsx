import { useEffect, useState } from "react";
import { Facebook, Instagram, Send, Lock, ShieldAlert, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UNLOCK_DATE = new Date("2026-06-18T00:00:00Z");

type LogEntry = {
  platform: "facebook" | "instagram";
  postId?: string;
  containerId?: string;
  ok: boolean;
  raw: any;
  at: string;
};

export default function MetaContentManager() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading, setLoading] = useState<"facebook" | "instagram" | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const locked = new Date() < UNLOCK_DATE;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setIsAdmin(false);
      const { data } = await supabase.from("user_roles")
        .select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
    })();
  }, []);

  async function handleFile(file: File) {
    const ext = file.name.split(".").pop() || "bin";
    const path = `manual-posts/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
      .from("public-assets")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (error) {
      toast.error(`Upload falhou: ${error.message}`);
      return;
    }
    const { data: pub } = supabase.storage.from("public-assets").getPublicUrl(data.path);
    setMediaUrl(pub.publicUrl);
    toast.success("Mídia enviada.");
  }

  async function publish(platform: "facebook" | "instagram") {
    if (caption.trim().length < 10) {
      toast.error("Escreva uma legenda (mín 10 caracteres).");
      return;
    }
    if (platform === "instagram" && !mediaUrl) {
      toast.error("Instagram exige uma imagem/vídeo.");
      return;
    }
    setLoading(platform);
    try {
      const { data, error } = await supabase.functions.invoke("admin-meta-post", {
        body: { platform, caption: caption.trim(), image_url: mediaUrl || undefined },
      });
      if (error) throw new Error(error.message);
      const result = data?.result || {};
      const postId =
        result?.ig?.id ||
        result?.fb?.id ||
        result?.fb?.post_id ||
        result?.posted_id ||
        null;
      const entry: LogEntry = {
        platform,
        postId,
        containerId: result?.container_id,
        ok: !!data?.ok,
        raw: data,
        at: new Date().toLocaleString("pt-BR"),
      };
      setLogs((p) => [entry, ...p].slice(0, 10));
      if (data?.ok) toast.success(`Publicado em ${platform}! ID: ${postId || "—"}`);
      else toast.error(`Falha ao publicar: ${JSON.stringify(result).slice(0, 200)}`);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao publicar");
      setLogs((p) => [{
        platform, ok: false, raw: { error: e?.message }, at: new Date().toLocaleString("pt-BR"),
      }, ...p].slice(0, 10));
    } finally {
      setLoading(null);
    }
  }

  if (isAdmin === null) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Verificando permissões…
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="bg-card border border-destructive/40 rounded-lg p-4 flex items-center gap-2 text-destructive">
        <ShieldAlert className="w-4 h-4" /> Apenas admins podem usar a Gestão de Conteúdo Meta.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" /> Gestão de Conteúdo Meta
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Publicação manual no Facebook e Instagram (sem cron, sem spam).
          </p>
        </div>
        {locked && (
          <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Bloqueado até 18/06/2026
          </span>
        )}
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Conteúdo do post</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={5}
          maxLength={2000}
          disabled={locked}
          placeholder="Escreva o post… use hashtags e finalize com o link plantayraiz.com.br"
          className="mt-1 w-full bg-background border border-border rounded-md p-3 text-sm resize-y disabled:opacity-50"
        />
        <div className="text-[10px] text-muted-foreground text-right">{caption.length}/2000</div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground">Mídia (imagem ou vídeo)</label>
        <div className="mt-1 flex flex-wrap gap-2 items-center">
          <input
            type="file"
            accept="image/*,video/*"
            disabled={locked}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="text-xs file:mr-2 file:px-3 file:py-1.5 file:rounded file:border-0 file:bg-primary/20 file:text-primary disabled:opacity-50"
          />
          <input
            type="url"
            placeholder="ou cole uma URL pública"
            value={mediaUrl}
            disabled={locked}
            onChange={(e) => setMediaUrl(e.target.value)}
            className="flex-1 min-w-[200px] bg-background border border-border rounded-md px-3 py-1.5 text-xs disabled:opacity-50"
          />
        </div>
        {mediaUrl && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl} alt="preview" className="max-h-40 rounded border border-border" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => publish("facebook")}
          disabled={locked || loading !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition"
        >
          {loading === "facebook" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Facebook className="w-4 h-4" />}
          Publicar Agora no Facebook
        </button>
        <button
          onClick={() => publish("instagram")}
          disabled={locked || loading !== null}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition"
        >
          {loading === "instagram" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Instagram className="w-4 h-4" />}
          Publicar Agora no Instagram
        </button>
      </div>

      {logs.length > 0 && (
        <div className="border-t border-border pt-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">Log de publicações</div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {logs.map((l, i) => (
              <div
                key={i}
                className={`text-xs p-2 rounded border ${
                  l.ok
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium capitalize">{l.platform}</span>
                  <span className="opacity-70">{l.at}</span>
                </div>
                {l.ok ? (
                  <div>
                    ✓ Post ID: <code className="font-mono">{l.postId || "—"}</code>
                    {l.containerId && <> · container: <code className="font-mono">{l.containerId}</code></>}
                  </div>
                ) : (
                  <div className="font-mono break-all opacity-80">{JSON.stringify(l.raw).slice(0, 240)}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
