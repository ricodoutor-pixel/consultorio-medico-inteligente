import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, FileText, TrendingUp, DollarSign, CheckCircle } from "lucide-react";

export default function DoctorDashboard() {
  const { user } = useAuth();

  const stats = [
    { label: "Pacientes Ativos", value: "247", icon: Users, color: "text-emerald-400" },
    { label: "Consultas Este Mês", value: "32", icon: Calendar, color: "text-cyan-400" },
    { label: "Receitas Validadas", value: "156", icon: CheckCircle, color: "text-emerald-400" },
    { label: "Faturamento", value: "R$ 12.480", icon: DollarSign, color: "text-cyan-400" },
  ];

  const recentPatients = [
    { id: 1, name: "João Silva", lastConsult: "2 dias atrás", status: "Ativo" },
    { id: 2, name: "Maria Santos", lastConsult: "5 dias atrás", status: "Ativo" },
    { id: 3, name: "Pedro Oliveira", lastConsult: "1 semana atrás", status: "Acompanhamento" },
  ];

  const prescriptions = [
    { id: 1, patient: "João Silva", medication: "Dipirona 500mg", date: "Hoje", status: "Validada" },
    { id: 2, patient: "Maria Santos", medication: "Amoxicilina 500mg", date: "Ontem", status: "Pendente" },
    { id: 3, patient: "Ana Costa", medication: "Metformina 500mg", date: "2 dias", status: "Validada" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Bem-vindo, <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{user?.name}</span>
        </h1>
        <p className="text-slate-400">Médico VIP • Verificado • Recebendo 100% das consultas</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="patients" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700/50">
          <TabsTrigger value="patients">Pacientes</TabsTrigger>
          <TabsTrigger value="prescriptions">Receitas</TabsTrigger>
          <TabsTrigger value="earnings">Ganhos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Pacientes Tab */}
        <TabsContent value="patients" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle>Pacientes Recentes</CardTitle>
              <CardDescription>Seus pacientes mais ativos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                  <div key={patient.id} className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{patient.name}</p>
                      <p className="text-sm text-slate-400">{patient.lastConsult}</p>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/50 text-emerald-300">
                      {patient.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receitas Tab */}
        <TabsContent value="prescriptions" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle>Receitas Recentes</CardTitle>
              <CardDescription>Status de validação ANVISA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {prescriptions.map((rx) => (
                  <div key={rx.id} className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <p className="font-semibold text-white">{rx.medication}</p>
                      <p className="text-sm text-slate-400">{rx.patient} • {rx.date}</p>
                    </div>
                    <Badge
                      variant={rx.status === "Validada" ? "default" : "secondary"}
                      className={rx.status === "Validada" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" : ""}
                    >
                      {rx.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ganhos Tab */}
        <TabsContent value="earnings" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm mb-2">Ganhos Este Mês</p>
                <p className="text-3xl font-bold text-emerald-400">R$ 12.480</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm mb-2">Saldo Disponível</p>
                <p className="text-3xl font-bold text-cyan-400">R$ 8.920</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="pt-6">
                <p className="text-slate-400 text-sm mb-2">Saques Realizados</p>
                <p className="text-3xl font-bold text-slate-300">3</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle>Solicitar Saque</CardTitle>
              <CardDescription>Transfira seus ganhos para sua conta bancária</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                Sacar R$ 8.920
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle>Perfil Profissional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">CRM</label>
                <p className="text-white font-semibold">CRM-SP 123456</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Especialidade</label>
                <p className="text-white font-semibold">Clínica Geral</p>
              </div>
              <div>
                <label className="text-sm text-slate-400">Horário de Atendimento</label>
                <p className="text-white font-semibold">Seg-Sex: 08:00 - 18:00</p>
              </div>
              <Button variant="outline" className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10">
                Editar Perfil
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
