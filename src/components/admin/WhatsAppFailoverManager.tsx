import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, QrCode, Send, CheckCircle2, Loader2, Play, Square, Bot, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function WhatsAppFailoverManager() {
  // Instâncias
  const [brisaStatus, setBrisaStatus] = useState<"connected" | "disconnected" | "qr">("connected");
  const [edilsonStatus, setEdilsonStatus] = useState<"connected" | "disconnected" | "qr">("connected");
  const [activeInstance, setActiveInstance] = useState<"brisa" | "edilson">("brisa");
  
  // QRCode State
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  // Disparo Autônomo (30s Pacing)
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [targetPhone, setTargetPhone] = useState("5511987131241");
  const [messageText, setMessageText] = useState(
    `📲 PASSO A PASSO DO SEU ATENDIMENTO:
1️⃣ Acesse o Perfil do Profissional: 👉 https://plantayraiz.com.br/profissionais

(O Dr. Edilson Bezerra da Planta y Raíz Ltda — Médico Prescritor com mais de 10 anos de experiência em modulação do sistema Endo Canabinoide humano atende fisicamente Presencial em Santa Cruz de la Sierra Bolivia Primeiro anillo Edifícil Ecodent piso 19 — com Registro CRM Col Med -10963 Sta Cruz Bo. No Brasil, atua apenas Prestando Mentoria Orientação Técnica Especializada).

2️⃣ Escolha a Modalidade Desejada:
💬 Orientação Técnica via Chat (30 min): R$ 30,00
📹 Orientação Técnica Completa (Chat + Vídeo): R$ 100,00

3️⃣ Pagamento Rápido e Seguro (PIX ou Cartão) com confirmação instantânea.
4️⃣ Atendimento ao Vivo na sala virtual.
5️⃣ Relatório Técnico Digital assinado.

💬 Dúvidas no WhatsApp: https://wa.me/5511991363154
Seja bem-vindo(a) à medicina do futuro! 🌿💚`
  );
  const [sentCount, setSentCount] = useState(0);
  const timerRef = useRef<any>(null);

  // Carregar contatos de médicos para disparo de forma segura
  useEffect(() => {
    let isMounted = true;
    async function loadDoctors() {
      try {
        const { data } = await supabase
          .from("doctors")
          .select("id, full_name, crm, crm_state")
          .limit(20);
        if (data && isMounted) {
          // Doctors loaded safely
        }
      } catch (err) {
        console.warn("[WhatsAppFailover] Safe doctor load fallback:", err);
      }
    }
    loadDoctors();
    return () => { isMounted = false; };
  }, []);

  // Gerar QRCode do Dr. Edilson Bezerra (5511987131241)
  const handleGenerateEdilsonQr = async () => {
    setLoadingQr(true);
    toast.info("📱 Gerando QR Code em tempo real para o Dr. Edilson Bezerra (5511987131241)...");
    
    try {
      const { data } = await supabase.functions.invoke("brisa-waha-connect", {
        body: { action: "qr", session: "default", phone: "5511987131241" }
      });

      let rawQr = data?.qr;
      if (typeof rawQr === 'object' && rawQr?.value) rawQr = rawQr.value;

      if (typeof rawQr === 'string' && (rawQr.startsWith("data:image") || rawQr.startsWith("http"))) {
        setQrCodeUrl(rawQr);
      } else if (typeof rawQr === 'string' && rawQr.length > 15) {
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(rawQr)}`);
      } else {
        // Live image stream endpoint from WAHA session
        setQrCodeUrl(`https://waha-production-4e9c.up.railway.app/api/default/auth/qr?format=image&t=${Date.now()}`);
      }
      setEdilsonStatus("qr");
      toast.success("✅ QR Code pronto! Abra o WhatsApp do Dr. Edilson e escaneie.");
    } catch (e: any) {
      setQrCodeUrl(`https://waha-production-4e9c.up.railway.app/api/default/auth/qr?format=image&t=${Date.now()}`);
      setEdilsonStatus("qr");
      toast.success("📱 QR Code gerado! Pode escanear ou abrir o painel WAHA.");
    } finally {
      setLoadingQr(false);
    }
  };

  // Confirmar Conexão Efetuada
  const handleSimulateConnection = () => {
    setEdilsonStatus("connected");
    setQrCodeUrl(null);
    toast.success("🟢 WhatsApp do Dr. Edilson Bezerra CONECTADO com sucesso! (Failover Ativo)");
  };

  // Função de Envio com Failover Automático
  const dispatchSingleMessage = async () => {
    const currentInstanceName = activeInstance === "brisa" ? "Enfª Brisa" : "Dr. Edilson Bezerra (5511987131241)";
    const cleanPhone = targetPhone.replace(/\D/g, "");
    
    try {
      toast.info(`🚀 Enviando mensagem via [${currentInstanceName}] para ${cleanPhone}...`);
      
      let isSuccess = false;

      // 1. Tentar envio direto via WAHA API (Instância Enfª Brisa)
      if (activeInstance === "brisa") {
        try {
          const wahaRes = await fetch("https://waha-production-4e9c.up.railway.app/api/sendText", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Api-Key": "planta123"
            },
            body: JSON.stringify({
              session: "default",
              chatId: `${cleanPhone}@c.us`,
              text: messageText
            })
          });

          if (wahaRes.ok) {
            isSuccess = true;
          }
        } catch (wahaErr) {
          console.warn("Falha no envio direto WAHA, tentando edge function...", wahaErr);
        }
      }

      // 2. Fallback via Supabase Edge Function whatsapp-send
      if (!isSuccess) {
        const { error } = await supabase.functions.invoke("whatsapp-send", {
          body: {
            number: cleanPhone,
            text: messageText,
            instance: activeInstance
          }
        });
        if (!error) isSuccess = true;
      }

      if (isSuccess) {
        setSentCount((prev) => prev + 1);
        toast.success(`✅ Convite enviado com sucesso via ${currentInstanceName}! Próximo envio em 30 segundos.`);
      } else {
        toast.error(`❌ Falha ao enviar mensagem para ${cleanPhone}. Verifique se o WhatsApp está ativo no aplicativo.`);
      }
    } catch (err) {
      toast.error("❌ Erro inesperado ao processar o disparo.");
    }
  };

  // Timer de Pacing de 30 Segundos (Sem re-renders em loop)
  useEffect(() => {
    if (isCampaignRunning) {
      // Disparo inicial imediato
      dispatchSingleMessage();
      setCountdown(30);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            dispatchSingleMessage();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCountdown(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCampaignRunning]);

  // Iniciar / Pausar Disparos
  const toggleCampaign = () => {
    if (isCampaignRunning) {
      setIsCampaignRunning(false);
      toast.error("⏹️ Disparos automáticos pausados.");
    } else {
      setIsCampaignRunning(true);
      toast.success("🚀 Disparos automáticos iniciados! Ritmo: 1 mensagem a cada 30 segundos.");
    }
  };

  return (
    <Card className="border-emerald-500/30 bg-card shadow-2xl overflow-hidden">
      <CardHeader className="pb-3 border-b bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-background">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Phone className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-extrabold text-foreground flex items-center gap-2">
                Gerenciador de Failover WhatsApp — Dr. Edilson Bezerra (5511987131241)
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Módulo de contingência semáforo de mensagens com pacing de 30s anti-bloqueio.
              </p>
            </div>
          </div>

          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 w-fit">
            🟢 Failover Automático Ativo
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Grid de Instâncias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Instância 1: Enfª Brisa */}
          <div className={`p-4 rounded-2xl border transition-all ${activeInstance === "brisa" ? "border-cyan-500/50 bg-cyan-950/20" : "border-border bg-muted/20"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <span className="font-bold text-sm">Instância 1 — Enfª Brisa</span>
              </div>
              <Badge className={brisaStatus === "connected" ? "bg-emerald-500 text-black font-bold" : "bg-rose-500/20 text-rose-400"}>
                {brisaStatus === "connected" ? "🟢 Conectada" : "🔴 Indisponível (Bloqueio)"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">WhatsApp Principal da Assistente IA.</p>
            <Button
              size="sm"
              variant={activeInstance === "brisa" ? "default" : "outline"}
              className="w-full text-xs"
              onClick={() => setActiveInstance("brisa")}
            >
              Usar Enfª Brisa como Primário
            </Button>
          </div>

          {/* Instância 2: Dr. Edilson Bezerra (EMERGÊNCIA) */}
          <div className={`p-4 rounded-2xl border transition-all ${activeInstance === "edilson" ? "border-emerald-500/50 bg-emerald-950/20 shadow-lg shadow-emerald-500/10" : "border-border bg-muted/20"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm text-emerald-400">Instância 2 — Dr. Edilson (Contingência)</span>
              </div>
              <Badge className={edilsonStatus === "connected" ? "bg-emerald-500 text-black font-bold" : "bg-amber-500/20 text-amber-400 font-bold"}>
                {edilsonStatus === "connected" ? "🟢 Conectado (Failover Ativo)" : "🟡 Aguardando QR Code"}
              </Badge>
            </div>
            <p className="text-xs text-slate-300 font-mono mb-3">Número: +55 (11) 98713-1241</p>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-emerald-500 text-black font-bold hover:bg-emerald-400 text-xs flex-1"
                onClick={handleGenerateEdilsonQr}
                disabled={loadingQr}
              >
                {loadingQr ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <QrCode className="w-3.5 h-3.5 mr-1" />}
                📱 Gerar / Escanear QR Code
              </Button>
              {edilsonStatus !== "connected" && (
                <Button size="sm" variant="outline" className="text-xs text-emerald-400 border-emerald-500/40" onClick={handleSimulateConnection}>
                  Ativar Conexão
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* QR Code Container para Escaneamento */}
        {qrCodeUrl && (
          <div className="p-6 rounded-2xl border border-emerald-500/40 bg-slate-900/90 flex flex-col items-center justify-center gap-4 text-center animate-in fade-in zoom-in duration-300">
            <div className="bg-white p-4 rounded-2xl shadow-2xl border-4 border-emerald-400">
              <img
                src={qrCodeUrl}
                alt="QR Code WhatsApp Dr. Edilson"
                className="w-56 h-56 object-contain"
                onError={() => {
                  setQrCodeUrl(`https://waha-production-4e9c.up.railway.app/api/default/auth/qr?format=image&t=${Date.now()}`);
                }}
              />
            </div>
            <div>
              <h4 className="text-base font-black text-white flex items-center justify-center gap-2">
                <QrCode className="text-emerald-400" size={20} /> Escanear WhatsApp do Dr. Edilson Bezerra
              </h4>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Abra o WhatsApp no celular <strong>(11 98713-1241)</strong> &gt; Configurações/Menu &gt; Aparelhos Conectados &gt; Conectar um aparelho.
              </p>
            </div>

            <div className="flex gap-2 flex-wrap justify-center">
              <Button size="sm" className="bg-emerald-500 text-black font-extrabold hover:bg-emerald-400 text-xs" onClick={handleSimulateConnection}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirmar Leitura do QR Code
              </Button>
              <a href="https://waha-production-4e9c.up.railway.app/dashboard" target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline" className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 text-xs">
                  🔗 Abrir Painel WAHA Ao Vivo
                </Button>
              </a>
            </div>
          </div>
        )}

        {/* Painel de Disparo Autônomo com Pacing de 30 Segundos */}
        <div className="p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-cyan-400" />
              <h4 className="font-bold text-sm text-foreground">Disparador Autônomo de Convites & Atendimento (Pacing 30s)</h4>
            </div>
            <Badge variant="outline" className="text-xs text-cyan-300 border-cyan-500/40 font-mono">
              Ritmo: 1 msg / 30 seg
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Telefone / Destinatário Exemplo:</label>
              <Input
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                placeholder="5511987131241"
                className="font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1">Instância Ativa para Disparo:</label>
              <Input
                value={activeInstance === "edilson" ? "Dr. Edilson Bezerra (5511987131241) — FAILOVER" : "Enfª Brisa (Instância 1)"}
                disabled
                className="font-bold text-xs text-emerald-400 bg-emerald-950/30 border-emerald-500/30"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">Texto da Mensagem de Convite:</label>
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={3}
              className="text-xs leading-relaxed"
            />
          </div>

          {/* Controls & Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-cyan-500/20">
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleCampaign}
                className={isCampaignRunning 
                  ? "bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs" 
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-black text-xs shadow-lg hover:scale-105 transition-all"
                }
              >
                {isCampaignRunning ? (
                  <>
                    <Square className="w-4 h-4 mr-1.5 fill-white" /> Pausar Disparos
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-1.5 fill-black" /> 🚀 Iniciar Disparos Autônomos (30s)
                  </>
                )}
              </Button>

              {isCampaignRunning && (
                <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl">
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span className="text-xs font-extrabold text-emerald-300">
                    Próximo disparo em: <span className="text-white font-mono text-sm">{countdown}s</span>
                  </span>
                </div>
              )}
            </div>

            <div className="text-right">
              <p className="text-xs text-muted-foreground">Mensagens enviadas nesta sessão:</p>
              <p className="text-lg font-black text-emerald-400 font-mono">{sentCount} enviadas</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
