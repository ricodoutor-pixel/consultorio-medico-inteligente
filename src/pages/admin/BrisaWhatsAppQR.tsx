/**
 * /admin/brisa-whatsapp-qr
 *
 * Painel para conectar o WhatsApp da Enfª Brisa / Dr. Edilson On:
 * mostra o QR Code real para escanear, o status da conexão e permite
 * reiniciar a sessão. Todos os dados vêm da edge function
 * `brisa-whatsapp-qr` (restrita a administradores).
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, RefreshCw, CheckCircle2, XCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface StatusResponse {
  ok: boolean;
  provider_ativo: string | null;
  waha: { configurado: boolean; session: string; status: string };
  evolution: { configurado: boolean; instancia: string; state: string | null };
  conectado: boolean;
  numero: string | null;
  precisa_qr: boolean;
}

export default function BrisaWhatsAppQR() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [qr, setQr] = useState<string | null>(null);
  const [qrProvider, setQrProvider] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const call = useCallback(async (action: string) => {
    const { data, error } = await supabase.functions.invoke("brisa-whatsapp-qr", {
      body: { action },
    });
    if (error) throw new Error(error.message);
    return data as Record<string, unknown>;
  }, []);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    setErro(null);
    try {
      const data = await call("status");
      setStatus(data as unknown as StatusResponse);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao consultar o status");
    } finally {
      setLoadingStatus(false);
    }
  }, [call]);

  useEffect(() => {
    void loadStatus();
    const id = window.setInterval(() => void loadStatus(), 20000);
    return () => window.clearInterval(id);
  }, [loadStatus]);

  const gerarQr = async () => {
    setLoadingQr(true);
    setErro(null);
    try {
      const data = await call("qr");
      const url = typeof data?.qr_data_url === "string" ? data.qr_data_url : null;
      if (!url) {
        const msg = typeof data?.detalhe === "string" ? data.detalhe : "QR Code indisponível agora.";
        setErro(msg);
        setQr(null);
      } else {
        setQr(url);
        setQrProvider(typeof data?.provider === "string" ? data.provider : null);
        toast.success("QR Code gerado — escaneie em até 60 segundos");
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao gerar o QR Code");
    } finally {
      setLoadingQr(false);
    }
  };

  const reiniciar = async () => {
    setRestarting(true);
    try {
      await call("restart");
      toast.success("Sessão reiniciada — gere um novo QR Code");
      setQr(null);
      await loadStatus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao reiniciar");
    } finally {
      setRestarting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" />
            WhatsApp da Enfª Brisa — Dr. Edilson On
          </h1>
          <p className="text-sm text-muted-foreground">
            Conecte o número oficial escaneando o QR Code. Enquanto estiver conectado, a Brisa
            atende, faz a triagem e conduz a Orientação Técnica de R$ 30 automaticamente.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status da conexão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingStatus && !status ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
              </div>
            ) : status ? (
              <>
                <div className="flex items-center gap-2">
                  {status.conectado ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Conectado
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Desconectado
                    </Badge>
                  )}
                  {status.numero && (
                    <span className="text-sm text-muted-foreground">+{status.numero}</span>
                  )}
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Canal principal: {status.waha.configurado ? `ativo (${status.waha.status})` : "não configurado"}</li>
                  <li>Canal reserva: {status.evolution.configurado ? `ativo (${status.evolution.state ?? "—"})` : "não configurado"}</li>
                </ul>
              </>
            ) : null}

            {erro && <p className="text-sm text-destructive">{erro}</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={() => void gerarQr()} disabled={loadingQr}>
                {loadingQr ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <QrCode className="h-4 w-4 mr-2" />}
                Gerar QR Code
              </Button>
              <Button variant="outline" onClick={() => void loadStatus()} disabled={loadingStatus}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingStatus ? "animate-spin" : ""}`} />
                Atualizar status
              </Button>
              <Button variant="ghost" onClick={() => void reiniciar()} disabled={restarting}>
                {restarting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Reiniciar sessão
              </Button>
            </div>
          </CardContent>
        </Card>

        {qr && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Escaneie com o WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-center rounded-xl bg-white p-4">
                <img src={qr} alt="QR Code para conectar o WhatsApp da Enfermeira Brisa" className="w-64 h-64" />
              </div>
              <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                <li>Abra o WhatsApp no celular do número oficial.</li>
                <li>Toque em Aparelhos conectados e depois em Conectar um aparelho.</li>
                <li>Aponte a câmera para o código acima.</li>
              </ol>
              {qrProvider && (
                <p className="text-xs text-muted-foreground">Canal: {qrProvider}</p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
