import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Copy, Check, ShieldCheck, Calendar, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Passport {
  id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

interface Props {
  /** Use o passaporte mais recente do paciente logado se não passar token */
  token?: string;
  /** Cria automaticamente um passaporte vazio se não houver — útil para demo */
  autoCreateIfMissing?: boolean;
}

const PUBLIC_BASE = typeof window !== "undefined" && window.location.hostname.endsWith("plantayraiz.com.br")
  ? "https://plantayraiz.com.br"
  : (typeof window !== "undefined" ? window.location.origin : "https://plantayraiz.com.br");

export default function PassportQRCard({ token: tokenProp, autoCreateIfMissing }: Props) {
  const [passport, setPassport] = useState<Passport | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      let p: Passport | null = null;

      if (tokenProp) {
        // Não consultamos detalhes — geramos o QR direto a partir do token informado
        p = { id: "", token: tokenProp, expires_at: "", created_at: "" };
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: rows } = await supabase
          .from("patient_passports")
          .select("id, token, expires_at, created_at")
          .eq("patient_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (rows && rows.length > 0) {
          p = rows[0] as Passport;
        } else if (autoCreateIfMissing) {
          const newToken = `${crypto.randomUUID()}${crypto.randomUUID().replace(/-/g, "")}`;
          const { data: created } = await supabase
            .from("patient_passports")
            .insert({ patient_id: user.id, token: newToken, metadata: { patient_display_name: user.email?.split("@")[0] || "Paciente" } })
            .select("id, token, expires_at, created_at")
            .single();
          if (created) p = created as Passport;
        }
      }

      if (!alive) return;
      setPassport(p);

      if (p) {
        const url = `${PUBLIC_BASE}/passaporte/${p.token}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 512,
          margin: 2,
          color: { dark: "#0f172a", light: "#ffffff" },
          errorCorrectionLevel: "H",
        });
        setQrDataUrl(dataUrl);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [tokenProp, autoCreateIfMissing]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!passport) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-6 text-center">
        <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Você ainda não tem um Passaporte Canábico Digital ativo.
          <br />
          Ele será gerado automaticamente após sua consulta.
        </p>
      </div>
    );
  }

  const publicUrl = `${PUBLIC_BASE}/passaporte/${passport.token}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* noop */ }
  };

  const download = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `passaporte-canabico-${passport.token.slice(0, 8)}.png`;
    a.click();
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card/40 to-background p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary font-medium mb-3">
        <ShieldCheck className="w-3.5 h-3.5" /> Passaporte Canábico Digital
      </div>

      <div className="rounded-xl bg-white p-4 flex items-center justify-center">
        {qrDataUrl && (
          <img
            src={qrDataUrl}
            alt="QR Code do Passaporte Canábico"
            className="w-full max-w-[240px] aspect-square"
          />
        )}
      </div>

      {passport.expires_at && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          Válido até {new Date(passport.expires_at).toLocaleDateString("pt-BR")}
        </p>
      )}

      <p className="mt-3 text-[11px] text-center text-muted-foreground break-all font-mono">
        {publicUrl}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={download}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition"
        >
          <Download className="w-3.5 h-3.5" /> Baixar
        </button>
        <button
          onClick={copy}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card/40 px-3 py-2 text-xs font-medium text-foreground hover:bg-card/60 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copiado!" : "Copiar link"}
        </button>
      </div>

      <p className="mt-3 text-[10px] text-center text-muted-foreground leading-relaxed">
        Apresente este QR Code em farmácias, fiscalizações ou abordagens. Mostra sua receita, laudo IA e autorização ANVISA.
      </p>
    </div>
  );
}
