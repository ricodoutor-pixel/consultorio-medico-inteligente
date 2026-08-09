import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, DollarSign, TrendingUp, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminIndicacoes = () => {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pendingPayouts: 0, completedPayouts: 0 });

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    // In a real scenario, this would query a 'referrals' or 'affiliate_sales' table
    // For now, we mock it or fetch from users that have a referrer_id
    const mockData = [
      { id: 1, type: "Pacientes", referrer_name: "Dr. João", user_name: "Maria S.", amount: 100, commission: 20, status: "pending", created_at: new Date().toISOString() },
      { id: 2, type: "Médicos", referrer_name: "Lojista Vida", user_name: "Dr. Carlos", amount: 99, commission: 15, status: "paid", created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 3, type: "Lojistas", referrer_name: "Ana (Paciente)", user_name: "Farmácia Verde", amount: 300, commission: 50, status: "pending", created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
    ];
    setReferrals(mockData);
    setStats({
      total: mockData.length,
      pendingPayouts: mockData.filter(m => m.status === "pending").reduce((acc, curr) => acc + curr.commission, 0),
      completedPayouts: mockData.filter(m => m.status === "paid").reduce((acc, curr) => acc + curr.commission, 0),
    });
  };

  const handlePayout = (id: number) => {
    setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: "paid" } : r));
    toast({ title: "Repasse Confirmado", description: "O valor foi marcado como pago no sistema." });
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto py-8 flex-1">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black font-display tracking-tight text-foreground">Painel de Indicações (Admin)</h1>
            <p className="text-muted-foreground mt-2">Monitore os repasses e benefícios de médicos, pacientes e lojistas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="text-primary h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total de Indicações</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-full">
                <DollarSign className="text-amber-500 h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Repasses Pendentes</p>
                <h3 className="text-2xl font-bold">R$ {stats.pendingPayouts.toFixed(2)}</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle className="text-green-500 h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Repasses Concluídos</p>
                <h3 className="text-2xl font-bold">R$ {stats.completedPayouts.toFixed(2)}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Conversões</CardTitle>
            <CardDescription>Acompanhe quem indicou quem e gerencie os pagamentos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Indicador (Referrer)</TableHead>
                    <TableHead>Indicado (Novo Usuário)</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor Venda</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell>{new Date(ref.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{ref.referrer_name}</TableCell>
                      <TableCell>{ref.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ref.type}</Badge>
                      </TableCell>
                      <TableCell>R$ {ref.amount.toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-green-600">R$ {ref.commission.toFixed(2)}</TableCell>
                      <TableCell>
                        {ref.status === "paid" ? (
                          <Badge className="bg-green-500">Pago</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-500 text-white">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {ref.status === "pending" && (
                          <Button size="sm" onClick={() => handlePayout(ref.id)} className="rounded-xl">
                            Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default AdminIndicacoes;
