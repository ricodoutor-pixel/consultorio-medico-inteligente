import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'react-router-dom';
import { Users, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDash() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: statsData } = trpc.admin.getStats.useQuery();
  const { data: withdrawalsData } = trpc.admin.getPendingWithdrawals.useQuery();
  const approveWithdrawalMutation = trpc.admin.approveWithdrawal.useMutation();
  const rejectWithdrawalMutation = trpc.admin.rejectWithdrawal.useMutation();

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>Voce nao tem permissao para acessar esta area</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar para Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = statsData?.data;
  const withdrawals = withdrawalsData?.data || [];

  const handleApproveWithdrawal = async (withdrawalId: number) => {
    try {
      const result = await approveWithdrawalMutation.mutateAsync({ withdrawalId });
      if (result.success) {
        toast.success('Saque aprovado com sucesso');
      } else {
        toast.error(result.error || 'Erro ao aprovar saque');
      }
    } catch (error) {
      toast.error('Erro ao processar');
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: number) => {
    try {
      const result = await rejectWithdrawalMutation.mutateAsync({
        withdrawalId,
        reason: 'Rejeitado pelo administrador',
      });
      if (result.success) {
        toast.success('Saque rejeitado');
      } else {
        toast.error(result.error || 'Erro ao rejeitar saque');
      }
    } catch (error) {
      toast.error('Erro ao processar');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerenciamento da plataforma</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">{stats?.regularUsers || 0} usuarios regulares</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.adminUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Usuarios com acesso admin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saques Pendentes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{withdrawals.length}</div>
              <p className="text-xs text-muted-foreground">Aguardando aprovacao</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="withdrawals" className="space-y-4">
          <TabsList>
            <TabsTrigger value="withdrawals">Saques Pendentes</TabsTrigger>
            <TabsTrigger value="settings">Configuracoes</TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Solicitacoes de Saque</CardTitle>
                <CardDescription>Saques aguardando aprovacao</CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum saque pendente</p>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((w) => (
                      <div key={w.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">Usuario #{w.userId}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(w.createdAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <p className="font-bold text-lg">R$ {(w.amount / 100).toFixed(2)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApproveWithdrawal(w.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectWithdrawal(w.id)}
                          >
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuracoes da Plataforma</CardTitle>
                <CardDescription>Ajustes gerais do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
