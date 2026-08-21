import { ManualMedicoModal } from '@/components/medico/ManualMedicoModal';
import { DoctorIoMTDashboard } from '@/components/diagnostics/DoctorIoMTDashboard';
import { useVitalSignsMonitoring } from '@/hooks/useVitalSignsMonitoring';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, HeartPulse, Activity, Moon, Wifi, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function MonitoramentoCSI() {
  const wsUrl = import.meta.env.VITE_RUVIEW_WS_URL || 'ws://127.0.0.1:3001';
  const { currentVitals, connectionStatus, vitalsHistory } = useVitalSignsMonitoring(wsUrl);

  const getHrBadge = (status: string) => {
    switch (status) {
      case 'tachycardia': return <Badge variant="destructive">Taquicardia</Badge>;
      case 'bradycardia': return <Badge variant="destructive">Bradicardia</Badge>;
      case 'noise': return <Badge variant="secondary">Ruído/Interferência</Badge>;
      default: return <Badge className="bg-emerald-500/20 text-emerald-500">Normal</Badge>;
    }
  };

  const getRespBadge = (status: string) => {
    switch (status) {
      case 'apnea_suspected': return <Badge variant="destructive" className="animate-pulse">Suspeita Apneia</Badge>;
      case 'tachypnea': return <Badge variant="destructive">Taquipneia</Badge>;
      case 'shallow': return <Badge variant="secondary">Resp. Rasa</Badge>;
      default: return <Badge className="bg-emerald-500/20 text-emerald-500">Normal</Badge>;
    }
  };

  const getSleepStatus = () => {
    if (!currentVitals) return 'Desconhecido';
    if (!currentVitals.semantic_states.is_sleeping) return 'Acordado';
    return 'Dormindo';
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wifi className="text-emerald-500 h-8 w-8" />
            Telemetria Wi-Fi (RuView)
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-muted-foreground">Monitoramento passivo de sinais vitais sem contato.</p>
            <ManualMedicoModal />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' ? (
            <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/50 flex items-center gap-1.5 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Conectado (Ao Vivo)
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-500 border-amber-500/50 flex items-center gap-1.5 px-3 py-1">
              <Activity className="h-3 w-3 animate-spin" />
              Conectando...
            </Badge>
          )}
        </div>
      </div>

      {currentVitals?.semantic_states.fall_detected && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-md flex items-start gap-3">
          <AlertCircle className="text-destructive h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-destructive">Alerta de Queda ou Agitação Severa Detectada!</h3>
            <p className="text-sm text-destructive/80">O sensor identificou um padrão compatível com queda ou estresse físico agudo no ambiente monitorado.</p>
          </div>
        </div>
      )}

      {currentVitals?.semantic_states.is_distressed && (
        <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-md flex items-start gap-3">
          <AlertCircle className="text-amber-500 h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-500">Possível Inquietação / Estresse</h3>
            <p className="text-sm text-amber-600/80">O padrão de movimentação e respiração sugere agitação no leito.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BPM Card */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-rose-500" />
              Freq. Cardíaca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-4xl font-bold">
                {currentVitals?.heart_rate.bpm || '--'}
                <span className="text-sm font-normal text-muted-foreground ml-1">BPM</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              {currentVitals ? getHrBadge(currentVitals.heart_rate.status) : <Badge variant="outline">Aguardando...</Badge>}
              <span className="text-muted-foreground">Conf. {currentVitals ? Math.round(currentVitals.heart_rate.confidence * 100) : 0}%</span>
            </div>
          </CardContent>
        </Card>

        {/* RPM Card */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-500" />
              Freq. Respiratória
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-4xl font-bold">
                {currentVitals?.respiration.rpm || '--'}
                <span className="text-sm font-normal text-muted-foreground ml-1">RPM</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              {currentVitals ? getRespBadge(currentVitals.respiration.status) : <Badge variant="outline">Aguardando...</Badge>}
              <span className="text-muted-foreground">Conf. {currentVitals ? Math.round(currentVitals.respiration.confidence * 100) : 0}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Presence Card */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wifi className="h-4 w-4 text-indigo-500" />
              Status de Presença
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {currentVitals?.rf_signal.presence ? 'Ocupado' : 'Vazio'}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Pessoas: {currentVitals?.rf_signal.persons_count || 0}
              </span>
              <span className="text-muted-foreground">
                Mov. {currentVitals?.rf_signal.motion_energy.toFixed(1) || '0.0'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Sleep Card */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Moon className="h-4 w-4 text-violet-500" />
              Padrão de Sono
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">
                {getSleepStatus()}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Estado: {currentVitals?.semantic_states.motion_state || '--'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-sm mt-6">
        <CardHeader>
          <CardTitle>Histórico Recente de Sinais Vitais (BPM e RPM)</CardTitle>
          <CardDescription>Variação correlacionada entre ritmo cardíaco e ventilatório.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            {vitalsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vitalsHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="time" tick={{fontSize: 10}} minTickGap={30} />
                  <YAxis yAxisId="left" domain={[30, 150]} orientation="left" stroke="#f43f5e" />
                  <YAxis yAxisId="right" domain={[0, 40]} orientation="right" stroke="#06b6d4" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="hr" name="Freq. Cardíaca (BPM)" stroke="#f43f5e" activeDot={{ r: 8 }} isAnimationActive={false} />
                  <Line yAxisId="right" type="monotone" dataKey="resp" name="Freq. Respiratória (RPM)" stroke="#06b6d4" isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Aguardando dados da telemetria...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-muted/30 rounded-lg border border-border mt-8">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Aviso de Conformidade ANVISA/CFM</p>
            <p>Monitoramento passivo complementar para suporte à titulação canabinoide. Não substitui equipamentos médicos de UTI nem constitui diagnóstico autônomo. Os dados aqui extraídos utilizam interferometria Wi-Fi (CSI) sem captura de imagens, preservando integralmente a privacidade do ambiente (LGPD).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
