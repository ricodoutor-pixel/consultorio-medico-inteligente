/**
 * /admin/telemed-brisa-check
 *
 * Painel administrativo unificado de validacao de producao:
 *
 *  Tarefa 1 — Jitsi Telemedicina: monta uma sala Jitsi publica de diagnostico
 *  (`plantayraiz-diag-<hash-fixo>`) para o admin autenticado, com opcao de
 *  entrar como "medico" ou "paciente". Basta abrir esta pagina em dois
 *  navegadores/abas com papeis diferentes para validar audio + video ponta a
 *  ponta sem depender de consulta agendada.
 *
 *  Tarefa 2 — Brisa ON: dispara o endpoint `whatsapp-brisa-bot` com
 *  action:"brisa_on" (autenticado como admin via JWT) e exibe em tempo real
 *  qual provedor entregou a mensagem (WAHA / Evolution / Twilio), o HTTP
 *  status, a latencia e o erro (se houver).
 *
 * Este arquivo NAO altera a producao — e uma pagina isolada, protegida por
 * AdminRoute, apenas para o Dr. Edilson validar os dois fluxos antes de
 * liberar o funil ao vivo.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { JitsiRoom } from "@/components/consultation/JitsiRoom";
import { Video, MessageSquare, Loader2, CheckCircle2, XCircle } from "lucide-react";

const DIAG_ROOM = "plantayraiz-diag-telemed-2026";

interface BrisaResult {
  ok: boolean;
  provider?: string;
  status?: number;
  error?: string;
  latencyMs: number;
  raw?: unknown;
}

export default function TelemedBrisaCheck() {
  // Jitsi
  const [role, setRole] = useState<"doctor" | "patient">("doctor");
  const [joined, setJoined] = useState(false);
  const [displayName, setDisplayName] = useState("");

  // Brisa
  const [phone, setPhone] = useState("5511987131241");
  const [text, setText] = useState("🌿 Brisa ON — teste administrativo de produção (Planta y Raíz).");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BrisaResult | null>(null);

  const dispararBrisaOn = async () => {
    setSending(true);
    setResult(null);
    const started = performance.now();
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-brisa-bot", {
        body: { action: "brisa_on", number: phone, text },
      });
      const latencyMs = Math.round(performance.now() - started);
      if (error) {
        setResult({
          ok: false,
          latencyMs,
          error: error.message,
          raw: error,
        });
      } else {
        setResult({
          ok: Boolean(data?.ok),
          provider: data?.provider,
          status: data?.status,
          error: data?.error,
          latencyMs,
          raw: data,
        });
      }
    } catch (e) {
      setResult({
        ok: false,
        latencyMs: Math.round(performance.now() - started),
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-20 max-w-5xl">
        <header className="mb-8">
          <h1 className="text-2xl font-black">Diagnóstico de Produção — Telemedicina + Brisa</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Página administrativa isolada. Não afeta consultas reais.
          </p>
        </header>

        {/* Tarefa 1 — Jitsi */}
        <Card className="mb-8 border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Video className="text-primary" size={18} />
              Tarefa 1 · Validar Jitsi (áudio + vídeo)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!joined ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Escolha o papel e clique em <b>Entrar</b>. Para validar a ponta-a-ponta,
                  abra esta página em outro navegador (ou aba anônima) com o outro papel — ambos
                  entrarão na sala <code className="text-primary">{DIAG_ROOM}</code>.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={role === "doctor" ? "default" : "outline"}
                    onClick={() => setRole("doctor")}
                    size="sm"
                  >
                    Entrar como Médico
                  </Button>
                  <Button
                    variant={role === "patient" ? "default" : "outline"}
                    onClick={() => setRole("patient")}
                    size="sm"
                  >
                    Entrar como Paciente
                  </Button>
                </div>
                <Input
                  placeholder={role === "doctor" ? "Dr. Edilson (teste)" : "Paciente (teste)"}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <Button onClick={() => setJoined(true)} className="w-full sm:w-auto">
                  Entrar na sala de diagnóstico
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-primary border-primary/30">
                    Sala: {DIAG_ROOM} · {role === "doctor" ? "médico" : "paciente"}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => setJoined(false)}>
                    Sair
                  </Button>
                </div>
                <div className="h-[520px] rounded-xl overflow-hidden border border-border">
                  <JitsiRoom
                    roomName={DIAG_ROOM}
                    displayName={displayName || (role === "doctor" ? "Médico (diag)" : "Paciente (diag)")}
                    isDoctor={role === "doctor"}
                    onClose={() => setJoined(false)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarefa 2 — Brisa ON */}
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="text-primary" size={18} />
              Tarefa 2 · Disparar “Brisa ON” (WAHA → Evolution → Twilio)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Número</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5511987131241" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mensagem</label>
                <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} />
              </div>
            </div>

            <Button onClick={dispararBrisaOn} disabled={sending} className="w-full sm:w-auto">
              {sending ? (
                <><Loader2 className="mr-2 animate-spin" size={14} /> Disparando…</>
              ) : (
                <>Disparar Brisa ON</>
              )}
            </Button>

            {result && (
              <div className="rounded-xl border border-border bg-background/60 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {result.ok ? (
                    <CheckCircle2 className="text-primary" size={18} />
                  ) : (
                    <XCircle className="text-destructive" size={18} />
                  )}
                  <b>{result.ok ? "Enviado com sucesso" : "Falha no envio"}</b>
                  <Badge variant="outline" className="ml-auto">{result.latencyMs} ms</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Provedor:</span> <b className="text-primary">{result.provider || "—"}</b></div>
                  <div><span className="text-muted-foreground">HTTP status:</span> <b>{result.status ?? "—"}</b></div>
                </div>
                {result.error && (
                  <p className="text-xs text-destructive break-all"><b>Erro:</b> {result.error}</p>
                )}
                <details className="text-[10px] text-muted-foreground">
                  <summary className="cursor-pointer">Resposta bruta</summary>
                  <pre className="overflow-auto max-h-64 mt-2">{JSON.stringify(result.raw, null, 2)}</pre>
                </details>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground">
              Endpoint: <code>supabase.functions.invoke("whatsapp-brisa-bot", &#123; action: "brisa_on" &#125;)</code> ·
              autenticação por JWT admin (checado em <code>user_roles.role = 'admin'</code>).
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
