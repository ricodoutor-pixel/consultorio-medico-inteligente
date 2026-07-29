import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle, FileImage, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AdminAprovacoes = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          profile:profiles(full_name, avatar_url, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao buscar médicos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleApprove = async (id: string, isApproved: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('doctors')
        .update({ 
          is_approved_by_admin: isApproved,
          approval_status: isApproved ? 'approved' : 'rejected'
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(isApproved ? "Médico aprovado!" : "Cadastro rejeitado!");
      fetchDoctors();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary h-8 w-8" />
        </div>
      </div>
    );
  }

  const pending = doctors.filter(d => !d.is_approved_by_admin && d.approval_status !== 'rejected');
  const approved = doctors.filter(d => d.is_approved_by_admin);

  const renderTable = (list: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Médico</TableHead>
          <TableHead>Contato</TableHead>
          <TableHead>Documentos</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
              Nenhum médico nesta categoria
            </TableCell>
          </TableRow>
        ) : list.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <img src={doc.profile?.avatar_url || "/placeholder.svg"} className="w-10 h-10 rounded-full object-cover bg-muted" alt="Avatar" />
                <div>
                  <p className="font-semibold text-sm">{doc.profile?.full_name || 'Sem nome'}</p>
                  <p className="text-xs text-muted-foreground">CRM: {doc.crm} {doc.crm_state}</p>
                  {doc.cpf && <p className="text-[10px] text-muted-foreground">CPF: {doc.cpf}</p>}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <p className="text-sm">{doc.profile?.email}</p>
              <p className="text-xs text-muted-foreground">{doc.personal_phone || doc.whatsapp_number}</p>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                {doc.crm_front_url && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                        <FileImage className="w-3 h-3 mr-1" /> CRM Frente
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>CRM Frente</DialogTitle></DialogHeader>
                      <img src={doc.crm_front_url} alt="CRM Frente" className="w-full h-auto rounded" />
                    </DialogContent>
                  </Dialog>
                )}
                {doc.crm_back_url && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                        <FileImage className="w-3 h-3 mr-1" /> CRM Verso
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>CRM Verso</DialogTitle></DialogHeader>
                      <img src={doc.crm_back_url} alt="CRM Verso" className="w-full h-auto rounded" />
                    </DialogContent>
                  </Dialog>
                )}
                {!doc.crm_front_url && !doc.crm_back_url && (
                  <span className="text-xs text-muted-foreground">Pendente</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={doc.is_approved_by_admin ? "default" : "secondary"}>
                {doc.is_approved_by_admin ? "Aprovado" : "Em Análise"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {!doc.is_approved_by_admin ? (
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleApprove(doc.id, false)}>
                    <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                  </Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprove(doc.id, true)}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => handleApprove(doc.id, false)}>
                  Desativar
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto py-8 mt-16">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-black">Aprovações Médicas</h1>
            <p className="text-muted-foreground text-sm mt-1">Gestão de KYC e cards públicos de profissionais de saúde.</p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg font-bold text-amber-500 flex items-center gap-2">
                Pendentes de Aprovação <Badge variant="secondary" className="bg-amber-500/20 text-amber-500">{pending.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {renderTable(pending)}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg font-bold text-emerald-500 flex items-center gap-2">
                Médicos Aprovados e Ativos <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-500">{approved.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {renderTable(approved)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAprovacoes;
