import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle, FileImage, UserCheck, Play, Sparkles, Eye, Download, ShieldCheck } from "lucide-react";
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
          profile:profiles(full_name, avatar_url, email, phone)
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
      const selectedDoc = doctors.find(d => d.id === id);

      const { error } = await (supabase as any)
        .from('doctors')
        .update({ 
          is_approved_by_admin: isApproved,
          approval_status: isApproved ? 'approved' : 'rejected',
          is_verified: isApproved,
          is_online: isApproved,
          is_available: isApproved,
          kyc_status: isApproved ? 'approved' : 'rejected'
        })
        .eq('id', id);

      if (error) throw error;
      
      if (isApproved) {
        toast.success("🚀 CARD MÉDICO PUBLICADO E ATIVADO COM SUCESSO! (Modo Atendimento Habilitado)");

        // Trigger WhatsApp Notification via Enf. Brisa
        try {
          await supabase.functions.invoke("send-doctor-welcome-whatsapp", {
            body: {
              phone: selectedDoc?.profile?.phone || selectedDoc?.personal_phone,
              fullName: selectedDoc?.profile?.full_name || 'Doutor(a)',
              email: selectedDoc?.profile?.email,
              action: "card_approved"
            }
          });
        } catch (e) {
          console.warn("Notificação WhatsApp em segundo plano:", e);
        }
      } else {
        toast.error("Cadastro desativado/rejeitado pelo Admin.");
      }

      fetchDoctors();
    } catch (err: any) {
      toast.error("Erro ao atualizar status: " + err.message);
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

  const getKycDocUrl = (userId: string, kind: string) => {
    const { data } = supabase.storage.from("kyc_documents").getPublicUrl(`${userId}/${kind}.png`);
    return data.publicUrl;
  };

  const renderTable = (list: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Médico Prescritor</TableHead>
          <TableHead>Contato & E-mail</TableHead>
          <TableHead>Documentos KYC</TableHead>
          <TableHead>Status Card Público</TableHead>
          <TableHead className="text-right">Ação Admin (START)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              Nenhum profissional nesta fila.
            </TableCell>
          </TableRow>
        ) : list.map((doc) => {
          const docUser = doc.profile || {};
          const crmFrontUrl = doc.crm_front_url || getKycDocUrl(doc.user_id, "crm_front");
          const crmBackUrl = doc.crm_back_url || getKycDocUrl(doc.user_id, "crm_back");
          const idFrontUrl = getKycDocUrl(doc.user_id, "id_front");

          return (
            <TableRow key={doc.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img 
                    src={docUser.avatar_url || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"} 
                    className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500/40" 
                    alt="Avatar" 
                  />
                  <div>
                    <p className="font-bold text-sm text-foreground">{docUser.full_name || 'Dr(a). Prescritor(a)'}</p>
                    <p className="text-xs text-muted-foreground">CRM: <span className="font-bold">{doc.crm}</span> / {doc.crm_state}</p>
                    <p className="text-[10px] text-emerald-400 font-semibold">{doc.specialty || 'Canabinologia'}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-xs font-medium">{docUser.email || doc.email}</p>
                <p className="text-[11px] text-muted-foreground">{docUser.phone || doc.personal_phone || doc.whatsapp_number}</p>
                <Badge variant="outline" className="text-[10px] mt-1">{doc.country || 'BR'}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1.5">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] bg-muted/50">
                        <FileImage className="w-3 h-3 mr-1 text-emerald-500" /> CRM Frente
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader><DialogTitle>CRM Frente — {docUser.full_name}</DialogTitle></DialogHeader>
                      <img src={crmFrontUrl} alt="CRM Frente" className="w-full h-auto rounded border" />
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] bg-muted/50">
                        <FileImage className="w-3 h-3 mr-1 text-emerald-500" /> CRM Verso
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader><DialogTitle>CRM Verso — {docUser.full_name}</DialogTitle></DialogHeader>
                      <img src={crmBackUrl} alt="CRM Verso" className="w-full h-auto rounded border" />
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] bg-muted/50">
                        <ShieldCheck className="w-3 h-3 mr-1 text-indigo-400" /> RG / CNH
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader><DialogTitle>Documento de Identidade — {docUser.full_name}</DialogTitle></DialogHeader>
                      <img src={idFrontUrl} alt="ID Document" className="w-full h-auto rounded border" />
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={doc.is_approved_by_admin ? "bg-emerald-500 text-black font-bold" : "bg-amber-500/20 text-amber-500"}>
                  {doc.is_approved_by_admin ? "🟢 Card Ativo no Marketplace" : "🟡 Em Análise KYC"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {!doc.is_approved_by_admin ? (
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 text-xs" onClick={() => handleApprove(doc.id, false)}>
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Rejeitar
                    </Button>
                    <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-extrabold shadow-md hover:scale-105 transition-all text-xs" onClick={() => handleApprove(doc.id, true)}>
                      <Play className="w-3.5 h-3.5 mr-1 fill-black" /> START & Publicar Card
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="text-xs text-zinc-400" onClick={() => handleApprove(doc.id, false)}>
                    Desativar Card
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto py-8 mt-16 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
              Painel de Aprovações & Botão START <Sparkles className="text-emerald-400" size={24} />
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Conferência de documentos KYC e liberação com 1 clique ("START") para publicação pública no Marketplace.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="border-amber-500/30 bg-card shadow-xl overflow-hidden">
            <CardHeader className="pb-3 border-b bg-amber-500/5">
              <CardTitle className="text-lg font-extrabold text-amber-400 flex items-center gap-2">
                Pendentes de Verificação KYC <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 font-bold">{pending.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {renderTable(pending)}
            </CardContent>
          </Card>

          <Card className="border-emerald-500/30 bg-card shadow-xl overflow-hidden">
            <CardHeader className="pb-3 border-b bg-emerald-500/5">
              <CardTitle className="text-lg font-extrabold text-emerald-400 flex items-center gap-2">
                Médicos Aprovados & Cards Ativos no Marketplace <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 font-bold">{approved.length}</Badge>
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
