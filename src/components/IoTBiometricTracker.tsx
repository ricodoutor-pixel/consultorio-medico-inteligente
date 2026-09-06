import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Watch, HeartPulse, Moon, RefreshCw, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SaMDBiofeedbackDisclaimer } from "@/components/compliance/SaMDBiofeedbackDisclaimer";

export function IoTBiometricTracker() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  
  // Estado real: inicia como null até que o dispositivo seja emparelhado
  const [metrics, setMetrics] = useState<{
    hrv: number | null;
    restingHr: number | null;
    sleepDeep: number | null;
    sleepRem: number | null;
    sleepLight: number | null;
  }>({
    hrv: null,
    restingHr: null,
    sleepDeep: null,
    sleepRem: null,
    sleepLight: null,
  });

  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setConnectionMessage(null);
    
    try {
      // Verifica suporte a WebBluetooth real no navegador/dispositivo
      if (typeof navigator !== "undefined" && "bluetooth" in navigator) {
        try {
          const device = await (navigator as any).bluetooth.requestDevice({
            acceptAllDevices: false,
            filters: [{ services: ["heart_rate"] }],
            optionalServices: ["battery_service"]
          });

          if (device && device.gatt) {
            await device.gatt.connect();
            setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            toast.success(`Dispositivo ${device.name || 'IoMT'} conectado com sucesso via Bluetooth!`);
            return;
          }
        } catch (bleErr: any) {
          if (bleErr.name !== "NotFoundError") {
            console.warn("BLE connection info:", bleErr);
          }
        }
      }

      // Sem dispositivo conectado: exibe estado real de desconexão sem dados fictícios
      setMetrics({
        hrv: null,
        restingHr: null,
        sleepDeep: null,
        sleepRem: null,
        sleepLight: null,
      });
      const realStatusMsg = "Nenhum dispositivo IoMT pareado via Bluetooth. Conecte um aparelho compatível ou informe a aferição manualmente.";
      setConnectionMessage(realStatusMsg);
      toast.info(realStatusMsg);
    } catch (err: any) {
      const realStatusMsg = "Nenhum dispositivo IoMT pareado via Bluetooth. Conecte um aparelho compatível ou informe a aferição manualmente.";
      setConnectionMessage(realStatusMsg);
      toast.error(realStatusMsg);
    } finally {
      setIsSyncing(false);
    }
  };

  const isModulated = lastSynced !== null;
  const hasData = metrics.hrv !== null;
  const totalSleep = hasData && metrics.sleepDeep && metrics.sleepRem && metrics.sleepLight
    ? metrics.sleepDeep + metrics.sleepRem + metrics.sleepLight
    : 0;

  return (
    <Card className="w-full border-slate-200 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-emerald-50/30 pb-4 border-b border-slate-100">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold flex items-center text-slate-800">
              <Activity className="w-5 h-5 mr-2 text-emerald-500" />
              Biometria IoT & Wearables
            </CardTitle>
            <CardDescription className="text-slate-500 mt-1">
              Sincronização de biossinais (Smartwatch / Apple Health / Google Fit)
            </CardDescription>
          </div>
          <Badge variant={isModulated ? "default" : "outline"} className={isModulated ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "text-slate-500"}>
            {isModulated ? "Sincronizado" : "Aguardando Conexão"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 space-y-6">
        <SaMDBiofeedbackDisclaimer compact toolName="A telemetria de biossinais de smartwatch" />

        {/* HRV & Heart Rate Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-5">
              <Activity className="w-24 h-24" />
            </div>
            <div className="flex items-center text-slate-500 text-sm font-medium mb-2">
              <HeartPulse className="w-4 h-4 mr-1.5 text-rose-400" />
              HRV (SNA)
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-800">
                {metrics.hrv !== null ? metrics.hrv : "—"}
              </span>
              <span className="text-sm font-medium text-slate-500">
                {metrics.hrv !== null ? "ms" : "Aguardando"}
              </span>
            </div>
            {isModulated && metrics.hrv && (
              <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-1 rounded w-max">
                <TrendingUp className="w-3 h-3 mr-1" /> +54% (Melhora autonômica)
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative overflow-hidden">
            <div className="absolute -right-2 -top-2 opacity-5">
              <HeartPulse className="w-24 h-24" />
            </div>
            <div className="flex items-center text-slate-500 text-sm font-medium mb-2">
              <HeartPulse className="w-4 h-4 mr-1.5 text-rose-500" />
              FC Repouso
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-800">
                {metrics.restingHr !== null ? metrics.restingHr : "—"}
              </span>
              <span className="text-sm font-medium text-slate-500">
                {metrics.restingHr !== null ? "bpm" : "Aguardando"}
              </span>
            </div>
            {isModulated && metrics.restingHr && (
              <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-1 rounded w-max">
                <TrendingUp className="w-3 h-3 mr-1 rotate-180" /> -6 bpm (Relaxamento)
              </div>
            )}
          </div>
        </div>

        {/* Sleep Architecture Section */}
        <div>
          <div className="flex justify-between items-end mb-3">
            <div className="flex items-center text-slate-700 font-semibold">
              <Moon className="w-4 h-4 mr-2 text-indigo-500" />
              Arquitetura do Sono
            </div>
            <div className="text-sm font-medium text-slate-500">
              {totalSleep > 0 ? `${totalSleep.toFixed(1)}h total` : "Nenhum registro de sono"}
            </div>
          </div>
          
          {hasData ? (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-indigo-800">Sono Profundo</span>
                  <span className="text-indigo-600">{metrics.sleepDeep}h</span>
                </div>
                <Progress value={((metrics.sleepDeep || 0) / totalSleep) * 100} className="h-2 bg-indigo-100" indicatorColor="bg-indigo-600" />
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-blue-800">Sono REM</span>
                  <span className="text-blue-600">{metrics.sleepRem}h</span>
                </div>
                <Progress value={((metrics.sleepRem || 0) / totalSleep) * 100} className="h-2 bg-blue-100" indicatorColor="bg-blue-500" />
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-600">Sono Leve</span>
                  <span className="text-slate-500">{metrics.sleepLight}h</span>
                </div>
                <Progress value={((metrics.sleepLight || 0) / totalSleep) * 100} className="h-2 bg-slate-100" indicatorColor="bg-slate-400" />
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <AlertCircle size={15} className="text-amber-500 flex-shrink-0" />
              <span>{connectionMessage || "Nenhum dispositivo IoMT pareado via Bluetooth. Conecte um aparelho compatível ou informe a aferição manualmente."}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="bg-slate-50/50 p-4 border-t border-slate-100 flex justify-between items-center">
        <div className="flex items-center text-xs text-slate-500">
          <Watch className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
          {lastSynced ? `Última sincronização: hoje às ${lastSynced}` : "Dispositivo desconectado"}
        </div>
        <Button 
          onClick={handleSync} 
          disabled={isSyncing} 
          variant="outline" 
          size="sm" 
          className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? "animate-spin text-emerald-500" : "text-slate-500"}`} />
          {isSyncing ? "Sincronizando..." : "Sincronizar Dispositivo"}
        </Button>
      </CardFooter>
    </Card>
  );
}
