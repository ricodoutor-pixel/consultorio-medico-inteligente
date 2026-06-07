import React from "react";
import { useDiretoriaRealtimeData } from "@/hooks/useDiretoriaRealtimeData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Activity, MessageSquare, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RelatorioIA } from "@/hooks/useDiretoriaRealtimeData";

interface DiretorInfo {
  nome: string;
  cargo: string;
  icon: React.ReactNode;
  cor: string;
}

const DashboardDiretoria = () => {
  const { relatorios, isLoading, error } = useDiretoriaRealtimeData();

  const getDiretorInfo = (depto: string): DiretorInfo => {
    switch (depto.toLowerCase()) {
      case "cfo":
        return { nome: "Mateus", cargo: "CFO", icon: <TrendingUp className="h-5 w-5 text-emerald-500" />, cor: "border-emerald-500" };
      case "r&d":
        return { nome: "Tomé", cargo: "R&D", icon: <Activity className="h-5 w-5 text-blue-500" />, cor: "border-blue-500" };
      case "cs":
        return { nome: "Tadeu", cargo: "CS", icon: <MessageSquare className="h-5 w-5 text-purple-500" />, cor: "border-purple-500" };
      default:
        return { nome: "Diretor", cargo: depto, icon: <Activity className="h-5 w-5" />, cor: "border-gray-200" };
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Erro ao carregar dados</h3>
            <p className="text-sm text-red-700">Não foi possível conectar ao banco de dados. Verifique sua conexão com Supabase.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cristo Corp AI</h2>
          <p className="text-muted-foreground">Monitoramento em tempo real dos Agentes Departamentais</p>
        </div>
        <Badge variant="outline" className="flex gap-2 py-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Sistema Ativo
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {["cfo", "r&d", "cs"].map((depto) => {
          const info = getDiretorInfo(depto);
          const ultimoRelatorio = relatorios?.find(r => r.departamento.toLowerCase() === depto.toLowerCase());

          return (
            <Card key={depto} className={`border-l-4 ${info.cor} transition-all hover:shadow-md`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold">{info.nome}</CardTitle>
                  <CardDescription className="font-medium text-xs uppercase tracking-wider">{info.cargo}</CardDescription>
                </div>
                {info.icon}
              </CardHeader>
              <CardContent>
                {ultimoRelatorio ? (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold truncate">{ultimoRelatorio.titulo}</div>
                    <div className="text-xs text-muted-foreground line-clamp-3 bg-muted/50 p-2 rounded">
                      {typeof ultimoRelatorio.conteudo_json === 'string' 
                        ? ultimoRelatorio.conteudo_json 
                        : JSON.stringify(ultimoRelatorio.conteudo_json)}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(ultimoRelatorio.created_at), "HH:mm 'em' dd/MM", { locale: ptBR })}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic py-4">
                    Aguardando primeiro relatório...
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Logs Recentes ({relatorios?.length || 0} registros)</h3>
        <div className="bg-card border rounded-lg overflow-hidden">
          {relatorios && relatorios.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">Data/Hora</th>
                    <th className="text-left p-3 font-medium">Departamento</th>
                    <th className="text-left p-3 font-medium">Título</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorios.slice(0, 10).map((rel) => (
                    <tr key={rel.id} className="border-b hover:bg-muted/10 transition-colors">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(rel.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">{rel.departamento.toUpperCase()}</Badge>
                      </td>
                      <td className="p-3 font-medium">{rel.titulo}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                          {rel.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground italic">
              Nenhum relatório encontrado no banco de dados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardDiretoria;
