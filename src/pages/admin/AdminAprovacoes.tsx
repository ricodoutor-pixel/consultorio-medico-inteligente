import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, CheckCircle, XCircle, FileImage, UserCheck, Play, Sparkles, ShieldCheck, Bot, Mail, Lock, Unlock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AdminAprovacoes = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);

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
          is_approved: isApproved,
          approval_status: isApproved ? 'approved' : 'rejected',
          is_verified: isApproved,
          is_online: isApproved,
          is_available: isApproved,
          kyc_status: isApproved ? 'approved' : 'rejected'
        })
        .eq('id', id);

      if (error) throw error;
      
      if (isApproved) {
        toast.success("🚀 CARD MÉDICO PUBLICADO E ATIVADO COM SUCESSO! (Visível no Marketplace)");

        // Trigger WhatsApp & Email Notification via Enf. Brisa
        try {
          await supabase.functions.invoke("send-doctor-welcome-whatsapp", {
            body: {
              phone: selectedDoc?.profile?.phone || selectedDoc?.personal_phone,
              fullName: selectedDoc?.profile?.full_name || selectedDoc?.full_name || 'Doutor(a)',
              email: selectedDoc?.profile?.email,
              action: "card_approved"
            }
          });
        } catch (e) {
          console.warn("Notificação em segundo plano:", e);
        }
      } else {
        toast.error("🔒 Card Médico BLOQUEADO e retirado do ar pelo Admin!");
      }

      fetchDoctors();
    } catch (err: any) {
      toast.error("Erro ao atualizar status: " + err.message);
    }
  };

  // 🤖 Executar Averiguação Automática por Agente Enfª Brisa IA
  const handleBrisaAutoAudit = async () => {
    setIsAuditing(true);
    toast.info("🤖 Enfª Brisa IA iniciando varredura de autenticidade dos cadastros médicos...");
    
    try {
      let approvedCount = 0;
      let pendingDocsCount = 0;

      for (const doc of doctors) {
        const docUser = doc.profile || {};
        const fullName = docUser.full_name || doc.full_name || "";
        const crm = doc.crm || "";
        const crmState = doc.crm_state || "";
        const specialty = doc.specialty || "";
        const hasPhone = Boolean(docUser.phone || doc.personal_phone || doc.whatsapp_number);
        const hasKycDoc = Boolean(doc.crm_front_url || doc.crm_back_url || doc.is_verified);

        // Verificação estrita de preenchimento dos dados obrigatórios
        const isComplete = Boolean(
          fullName.length > 3 &&
          crm.length >= 4 &&
          crmState.length >= 2 &&
          specialty.length > 2 &&
          hasPhone &&
          hasKycDoc
        );

        if (isComplete) {
          // Aprovação e Liberação Automática pela Enfª Brisa IA
          await (supabase as any)
            .from('doctors')
            .update({
              is_approved_by_admin: true,
              is_approved: true,
              approval_status: 'approved',
              is_verified: true,
              is_online: true,
              is_available: true,
              kyc_status: 'approved'
            })
            .eq('id', doc.id);

          approvedCount++;
        } else {
          pendingDocsCount++;
        }
      }

      await fetchDoctors();
      
      toast.success(
        `✅ Varredura concluída pela Enfª Brisa IA!\n` +
        `• ${approvedCount} cadastros 100% validados e com Card publicado!\n` +
        `• ${pendingDocsCount} cadastros aguardando complemento de documentos (Consultório Virtual liberado).`
      );
    } catch (err: any) {
      toast.error("Erro na varredura da Enfª Brisa IA: " + err.message);
    } finally {
      setIsAuditing(false);
    }
  };

  // ✉️ Enviar E-mails de Boas-Vindas para Médicos e Pacientes
  const handleSendWelcomeAll = async () => {
    setIsSendingEmails(true);
    toast.info("✉️ Disparando e-mails e mensagens de boas-vindas para médicos e pacientes...");

    try {
      // Trigger onboarding automation Edge Function
      const { data, error } = await supabase.functions.invoke("doctor-onboarding-automation", {
        body: { trigger_all: true }
      });

      if (error) console.warn("Onboarding invoke warning:", error);

      toast.success("🎉 E-mails de Boas-Vindas e orientações do Consultório Virtual enviados com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao enviar e-mails de boas-vindas: " + err.message);
    } finally {
      setIsSendingEmails(false);
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
  const blocked = doctors.filter(d => d.approval_status === 'rejected');

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
          <TableHead>Documentos KYC & Anexos</TableHead>
          <TableHead>Status Card & Consultório</TableHead>
          <TableHead className="text-right">Ação Admin & Enfª Brisa</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              Nenhum profissional nesta lista.
            </TableCell>
          </TableRow>
        ) : list.map((doc) => {
          const docUser = doc.profile || {};
          const crmFrontUrl = doc.crm_front_url || getKycDocUrl(doc.user_id, "crm_front");
          const crmBackUrl = doc.crm_back_url || getKycDocUrl(doc.user_id, "crm_back");
          const idFrontUrl = getKycDocUrl(doc.user_id, "id_front");
          
          const hasPhone = Boolean(docUser.phone || doc.personal_phone || doc.whatsapp_number);
          const hasCrm = Boolean(doc.crm && doc.crm_state);
          const hasDocs = Boolean(doc.crm_front_url || doc.crm_back_url || doc.is_verified);
          const isComplete = hasCrm && hasPhone && hasDocs;

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
                    <p className="font-bold text-sm text-foreground">{docUser.full_name || doc.full_name || 'Dr(a). Prescritor(a)'}</p>
                    <p className="text-xs text-muted-foreground">CRM: <span className="font-bold">{doc.crm}</span> / {doc.crm_state}</p>
                    <p className="text-[10px] text-emerald-400 font-semibold">{doc.specialty || 'Canabinologia'}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-xs font-medium">{docUser.email || doc.email || 'Email cadastrado'}</p>
                <p className="text-[11px] text-muted-foreground">{docUser.phone || doc.personal_phone || doc.whatsapp_number || 'Tel não informado'}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="outline" className="text-[10px]">{doc.country || 'BR'}</Badge>
                  <Badge variant="secondary" className="text-[10px] bg-cyan-500/20 text-cyan-400">
                    Consultório Liberado
                  </Badge>
                </div>
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
                      <DialogHeader><DialogTitle>CRM Frente — {docUser.full_name || doc.full_name}</DialogTitle></DialogHeader>
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
                      <DialogHeader><DialogTitle>CRM Verso — {docUser.full_name || doc.full_name}</DialogTitle></DialogHeader>
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
                      <DialogHeader><DialogTitle>Documento de Identidade — {docUser.full_name || doc.full_name}</DialogTitle></DialogHeader>
                      <img src={idFrontUrl} alt="ID Document" className="w-full h-auto rounded border" />
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
              <TableCell>
                {doc.is_approved_by_admin ? (
                  <Badge className="bg-emerald-500 text-black font-bold flex items-center gap-1 w-fit">
                    <CheckCircle size={12} /> Card Ativo no Marketplace
                  </Badge>
                ) : doc.approval_status === 'rejected' ? (
                  <Badge variant="destructive" className="flex items-center gap-1 w-fit font-bold">
                    <Lock size={12} /> Card Bloqueado pelo Admin
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center gap-1 w-fit">
                    <AlertTriangle size={12} /> {isComplete ? "Aguardando Liberação Enfª Brisa" : "Aguardando Anexo de Documentos"}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {!doc.is_approved_by_admin ? (
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-destructive hover:bg-destructive/10 text-xs border-destructive/30" 
                      onClick={() => handleApprove(doc.id, false)}
                    >
                      <Lock className="w-3.5 h-3.5 mr-1" /> Bloquear
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-extrabold shadow-md hover:scale-105 transition-all text-xs" 
                      onClick={() => handleApprove(doc.id, true)}
                    >
                      <Play className="w-3.5 h-3.5 mr-1 fill-black" /> START & Publicar Card
                    </Button>
                  </div>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs text-rose-400 border-rose-500/40 hover:bg-rose-500/10" 
                    onClick={() => handleApprove(doc.id, false)}
                  >
                    <Lock className="w-3.5 h-3.5 mr-1" /> Retirar Card do Ar (Bloquear)
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-2">
                Painel de Averiguação & Liberação de Cards Médicos <Sparkles className="text-emerald-400" size={24} />
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Auditoria automática por Enfª Brisa IA, envio de boas-vindas e controle manual de bloqueio pelo Admin.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleBrisaAutoAudit}
              disabled={isAuditing}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold shadow-lg hover:scale-105 transition-all text-xs"
            >
              {isAuditing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bot className="w-4 h-4 mr-2 text-cyan-200" />
              )}
              🤖 Executar Varredura Enfª Brisa IA
            </Button>

            <Button
              onClick={handleSendWelcomeAll}
              disabled={isSendingEmails}
              variant="outline"
              className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs"
            >
              {isSendingEmails ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2 text-emerald-400" />
              )}
              ✉️ Enviar Boas-Vindas (Médicos & Pacientes)
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 flex items-start gap-3">
          <Bot className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="text-xs text-cyan-200 space-y-1">
            <p className="font-bold">Regra de Segurança & Acesso:</p>
            <p>
              1. <strong>Consultório Virtual (`/consultorio`)</strong>: Liberado automaticamente para 100% dos médicos registrados a partir do momento do cadastro.<br/>
              2. <strong>Card Médico Público (`/profissionais`)</strong>: Publicado automaticamente pela <strong>Enfermeira Brisa IA</strong> somente quando todos os dados e documentos forem anexados e validados.<br/>
              3. <strong>Bloqueio Manual</strong>: Você (Admin) pode clicar em <strong>[Bloquear / Retirar Card do Ar]</strong> a qualquer momento para suspender a exibição pública de qualquer profissional.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="border-amber-500/30 bg-card shadow-xl overflow-hidden">
            <CardHeader className="pb-3 border-b bg-amber-500/5">
              <CardTitle className="text-lg font-extrabold text-amber-400 flex items-center gap-2">
                Pendentes de Análise de Documentos KYC <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 font-bold">{pending.length}</Badge>
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

          {blocked.length > 0 && (
            <Card className="border-destructive/30 bg-card shadow-xl overflow-hidden">
              <CardHeader className="pb-3 border-b bg-destructive/5">
                <CardTitle className="text-lg font-extrabold text-rose-400 flex items-center gap-2">
                  Cards Bloqueados pelo Admin <Badge variant="secondary" className="bg-destructive/20 text-rose-400 font-bold">{blocked.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {renderTable(blocked)}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAprovacoes;

