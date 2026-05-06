import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShieldCheck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreditAuditEntry {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  created_at: string;
  verified_at?: string;
}

export const AdminCreditAudit = () => {
  const [audits, setAudits] = useState<CreditAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('credit_audits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudits(data || []);
    } catch (err) {
      console.error("Error fetching audits:", err);
      toast.error("Erro ao carregar auditoria de créditos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('credit_audits')
        .update({ status: 'approved', verified_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success("Crédito aprovado com sucesso");
      fetchAudits();
    } catch (err) {
      toast.error("Erro ao aprovar crédito");
    }
  };

  const filteredAudits = audits.filter(a => 
    a.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
            <ShieldCheck className="text-primary" /> Auditoria de Créditos
          </h2>
          <p className="text-sm text-muted-foreground">Validação e compliance de transações financeiras</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Buscar por usuário ou motivo..." 
            className="pl-10 rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-border bg-card/50 backdrop-blur">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="font-bold">Data</TableHead>
                <TableHead className="font-bold">Usuário</TableHead>
                <TableHead className="font-bold">Valor</TableHead>
                <TableHead className="font-bold">Tipo</TableHead>
                <TableHead className="font-bold">Motivo</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10">Carregando...</TableCell></TableRow>
              ) : filteredAudits.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10">Nenhuma auditoria encontrada</TableCell></TableRow>
              ) : filteredAudits.map((audit) => (
                <TableRow key={audit.id} className="border-border">
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(audit.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="font-bold">{audit.user_name}</TableCell>
                  <TableCell className={audit.type === 'credit' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                    {audit.type === 'credit' ? '+' : '-'} R$ {audit.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-lg uppercase text-[10px]">
                      {audit.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs">{audit.reason}</TableCell>
                  <TableCell>
                    {audit.status === 'approved' ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                        <CheckCircle2 size={10} /> Aprovado
                      </Badge>
                    ) : audit.status === 'rejected' ? (
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/20 gap-1">
                        <AlertTriangle size={10} /> Rejeitado
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-1">
                        <Clock size={10} /> Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {audit.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-lg h-8 text-xs border-primary text-primary hover:bg-primary hover:text-white"
                        onClick={() => handleApprove(audit.id)}
                      >
                        Aprovar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
