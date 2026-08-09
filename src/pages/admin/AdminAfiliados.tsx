import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, DollarSign, ArrowUpRight, CheckCircle2, Clock, XCircle, Gift, AlertTriangle, ShieldCheck, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AdminAfiliados() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    // Checking if the user is an admin
    const { data: currentUser } = await supabase.from("profiles").select("user_type").eq("id", session.user.id).single();
    if (currentUser?.user_type !== "admin") {
      toast({ title: "Acesso Negado", description: "Apenas administradores podem acessar esta página.", variant: "destructive" });
      navigate("/dashboard");
      return;
    }

    // Fetch affiliates (profiles with planta_coins > 0 or referrers)
    const { data: affiliatesData } = await supabase
      .from("profiles")
      .select("id, full_name, planta_coins, is_vip, pix_key, pix_type, referral_code")
      .order("planta_coins", { ascending: false })
      .limit(20);

    setProfiles(affiliatesData || []);
    
    // Simulating withdrawal requests as we don't have a specific table for this in the schema overview provided
    // In a real scenario, this would come from `affiliate_withdrawals` table.
    setWithdrawals([
      { id: "1", patient_name: "Marcos T.", amount_rc: 500, amount_brl: 50.00, status: "pending", pix_key: "marcos@email.com", is_vip: true, created_at: new Date().toISOString() },
      { id: "2", patient_name: "Ana Clara", amount_rc: 1200, amount_brl: 120.00, status: "approved", pix_key: "000.111.222-33", is_vip: true, created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: "3", patient_name: "Carlos V.", amount_rc: 300, amount_brl: 30.00, status: "pending", pix_key: "11999999999", is_vip: false, created_at: new Date().toISOString() },
    ]);
    
    setLoading(false);
  };

  const handleApprove = (id: string, isVip: boolean) => {
    if (!isVip) {
      toast({ title: "Bloqueado", description: "O usuário não é VIP. O pagamento não pode ser aprovado.", variant: "destructive" });
      return;
    }
    toast({ title: "Sucesso", description: "Saque aprovado com sucesso!" });
    setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: "approved" } : w));
  };

  const handleReject = (id: string) => {
    toast({ title: "Rejeitado", description: "Saque rejeitado." });
    setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: "rejected" } : w));
  };

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="min-h-dvh bg-muted/30">
      <Navbar />
      <div className="container mx-auto py-8 px-4 pt-24 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-black text-foreground flex items-center gap-3">
              <ShieldCheck className="text-primary h-8 w-8" />
              Gestão de Afiliados
            </h1>
            <p className="text-muted-foreground mt-1">Acompanhe indicações, aprovações de PIX e status VIP.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase">Total Afiliados</p>
                  <h3 className="text-3xl font-black text-foreground mt-1">{profiles.length}</h3>
                </div>
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <Users className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase">Saques Pendentes</p>
                  <h3 className="text-3xl font-black text-foreground mt-1">{withdrawals.filter(w => w.status === 'pending').length}</h3>
                </div>
                <div className="bg-yellow-500/10 p-3 rounded-2xl">
                  <Clock className="text-yellow-500 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase">Total Pago (PIX)</p>
                  <h3 className="text-3xl font-black text-foreground mt-1">R$ 120,00</h3>
                </div>
                <div className="bg-green-500/10 p-3 rounded-2xl">
                  <DollarSign className="text-green-500 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Ranking de Afiliados (RaizCoins)</CardTitle>
              <CardDescription>Pacientes que mais acumularam pontos.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>VIP</TableHead>
                    <TableHead className="text-right">Saldo (RC)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.slice(0, 5).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{p.full_name}</TableCell>
                      <TableCell>
                        {p.is_vip ? (
                          <Badge className="bg-yellow-500 text-black border-none"><Crown size={12} className="mr-1" /> VIP</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Padrão</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-black text-primary">{p.planta_coins || 0} RC</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Aprovações de Saque PIX</CardTitle>
              <CardDescription>Solicitações recentes dos pacientes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {withdrawals.map((w) => (
                  <div key={w.id} className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-foreground">{w.patient_name}</h4>
                        {w.is_vip ? (
                          <Badge className="bg-yellow-500/20 text-yellow-500 text-[10px] border-none">VIP</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]"><AlertTriangle size={10} className="mr-1" /> NÃO VIP</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Chave: <span className="font-mono text-foreground">{w.pix_key}</span></p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(w.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-foreground">R$ {w.amount_brl.toFixed(2)}</span>
                        {w.status === "pending" && <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10">Pendente</Badge>}
                        {w.status === "approved" && <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10">Aprovado</Badge>}
                        {w.status === "rejected" && <Badge variant="destructive">Rejeitado</Badge>}
                      </div>
                      {w.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs border-red-500 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => handleReject(w.id)}>Recusar</Button>
                          <Button size="sm" className="h-7 text-xs" onClick={() => handleApprove(w.id, w.is_vip)}>Aprovar Pagamento</Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
