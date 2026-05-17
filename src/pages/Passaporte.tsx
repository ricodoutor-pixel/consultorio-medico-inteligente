import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, ShieldCheck, FileText, Sparkles, AlertTriangle, Calendar, Stethoscope, ExternalLink, Loader2 } from "lucide-react";

interface PassportMetadata {
  patient_display_name?: string;
  doctor_name?: string;
  doctor_crm?: string;
  prescription?: {
    medications?: Array<{ name: string; dosage?: string; instructions?: string }>;
    diagnosis_cid?: string;
    instructions?: string;
    signed_pdf_url?: string;
    signature_hash?: string;
    valid_until?: string;
  };
  ai_report?: string;
  ai_protocol?: string;
  anvisa_code?: string;
  anvisa_url?: string;
}

interface PassportResponse {
  id: string;
  appointment_id: string | null;
  metadata: PassportMetadata;
  expires_at: string;
  created_at: string;
  is_expired: boolean;
}

export default function Passaporte() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PassportResponse | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) { setNotFound(true); setLoading(false); return; }
      const { data: rows, error } = await supabase.rpc("get_passport_by_token", { _token: token });
      if (!alive) return;
      if (error || !rows || (rows as any[]).length === 0) {
        setNotFound(true);
      } else {
        setData((rows as any[])[0] as PassportResponse);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <PassportShell>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto text-destructive mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Passaporte não encontrado</h2>
          <p className="text-sm text-muted-foreground">
            O token informado é inválido ou foi removido. Solicite uma nova via ao seu médico responsável.
          </p>
        </div>
      </PassportShell>
    );
  }

  if (data?.is_expired) {
    return (
      <PassportShell>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-3" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Passaporte expirado</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Este passaporte venceu em <strong>{formatDate(data.expires_at)}</strong>.
            <br />
            Solicite uma nova via ao suporte ou ao seu médico responsável.
          </p>
          <a
            href="https://wa.me/5511991363154?text=Olá%20Brisa,%20meu%20Passaporte%20Canábico%20expirou%20e%20preciso%20renovar."
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            Falar com a Brisa
          </a>
        </div>
      </PassportShell>
    );
  }

  const m = data!.metadata || {};
  const meds = m.prescription?.medications || [];

  return (
    <PassportShell>
      <Helmet><title>Passaporte Canábico Digital — Planta y Raiz</title></Helmet>

      {/* Header card */}
      <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-background p-5 mb-4">
        <div className="flex items-center gap-2 text-xs text-primary font-medium uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> Documento verificado
        </div>
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          {m.patient_display_name || "Paciente"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Passaporte Canábico Digital</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5" />
          Válido até <span className="text-foreground font-medium">{formatDate(data!.expires_at)}</span>
        </div>
      </section>

      {/* Doctor */}
      {(m.doctor_name || m.doctor_crm) && (
        <Card icon={<Stethoscope className="w-4 h-4" />} title="Médico Responsável">
          <p className="text-sm text-foreground font-medium">{m.doctor_name || "—"}</p>
          {m.doctor_crm && <p className="text-xs text-muted-foreground">CRM {m.doctor_crm}</p>}
        </Card>
      )}

      {/* Prescription */}
      <Card icon={<FileText className="w-4 h-4" />} title="Receita Médica Digital">
        {meds.length > 0 ? (
          <ul className="space-y-2.5">
            {meds.map((med, i) => (
              <li key={i} className="rounded-lg bg-muted/30 p-3 border border-border/50">
                <p className="text-sm font-medium text-foreground">{med.name}</p>
                {med.dosage && <p className="text-xs text-muted-foreground mt-0.5">Posologia: {med.dosage}</p>}
                {med.instructions && <p className="text-xs text-muted-foreground mt-0.5">{med.instructions}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Receita anexada digitalmente.</p>
        )}
        {m.prescription?.diagnosis_cid && (
          <p className="mt-3 text-xs text-muted-foreground">CID: <span className="text-foreground">{m.prescription.diagnosis_cid}</span></p>
        )}
        {m.prescription?.signature_hash && (
          <p className="mt-2 text-[10px] text-muted-foreground font-mono break-all">
            Hash ICP-Brasil: {m.prescription.signature_hash.slice(0, 40)}…
          </p>
        )}
        {m.prescription?.signed_pdf_url && (
          <a
            href={m.prescription.signed_pdf_url} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            Baixar PDF assinado <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </Card>

      {/* AI Report */}
      {(m.ai_report || m.ai_protocol) && (
        <Card icon={<Sparkles className="w-4 h-4" />} title="Laudo IA Recomendações">
          {m.ai_protocol && (
            <div className="mb-3 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-primary font-medium">Protocolo sugerido</p>
              <p className="text-sm text-foreground font-medium mt-0.5">{m.ai_protocol}</p>
            </div>
          )}
          {m.ai_report && (
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{m.ai_report}</p>
          )}
        </Card>
      )}

      {/* ANVISA */}
      {(m.anvisa_code || m.anvisa_url) && (
        <Card icon={<ShieldCheck className="w-4 h-4" />} title="Autorização ANVISA">
          {m.anvisa_code && (
            <p className="text-sm text-foreground">
              Código: <span className="font-mono font-medium">{m.anvisa_code}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">RDC 660/2022 — Importação de produtos derivados de Cannabis</p>
          {m.anvisa_url && (
            <a
              href={m.anvisa_url} target="_blank" rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              Verificar na ANVISA <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </Card>
      )}

      <footer className="mt-6 pt-4 border-t border-border/50 text-center">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
          <Leaf className="w-3.5 h-3.5" /> plantayraiz.com.br
        </Link>
        <p className="text-[10px] text-muted-foreground mt-2">
          Documento gerado em {formatDate(data!.created_at)} • Plataforma de intermediação CNAE 6209-1/00
        </p>
      </footer>
    </PassportShell>
  );
}

function PassportShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto max-w-md px-4 py-6 sm:py-10">
        {children}
      </div>
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/40 backdrop-blur p-5 mb-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
        <span className="text-primary">{icon}</span> {title}
      </div>
      {children}
    </section>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso; }
}
