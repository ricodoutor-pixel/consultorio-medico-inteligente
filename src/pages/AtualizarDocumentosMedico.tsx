import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Upload, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { KYC_BUCKET, type KycKind } from "@/lib/kyc-docs";
import { Card, CardContent } from "@/components/ui/card";

export default function AtualizarDocumentosMedico() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [kycFiles, setKycFiles] = useState<Partial<Record<KycKind, File | null>>>({});
  const [uploadedDocs, setUploadedDocs] = useState<KycKind[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    setUserId(session.user.id);

    const { data: docs } = await supabase
      .from('doctor_kyc_documents')
      .select('document_kind')
      .eq('doctor_user_id', session.user.id);
      
    if (docs) {
      setUploadedDocs(docs.map(d => d.document_kind as KycKind));
    }

    // Load existing signature from profiles (same as photo)
    const { data: profile } = await supabase
      .from('profiles')
      .select('signature_url')
      .eq('id', session.user.id)
      .single();
    
    if (profile?.signature_url) setSignatureUrl(profile.signature_url);

    setLoading(false);
  };

  // ✅ Same pattern as DoctorPhotoUpload — uses avatars bucket + profiles table
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    try {
      setIsUploadingSignature(true);
      toast.info("Enviando assinatura...");

      const fileExt = file.name.split('.').pop();
      const filePath = `documents/${userId}/signature_${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')  // mesmo bucket da foto de perfil — já funciona!
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Salva na tabela profiles — mesma lógica da foto de perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ signature_url: publicUrl } as any)
        .eq('id', userId);

      if (updateError) throw updateError;

      setSignatureUrl(publicUrl);
      toast.success("✅ Assinatura digital enviada com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao enviar assinatura: " + (err?.message || "Tente novamente."));
    } finally {
      setIsUploadingSignature(false);
    }
  };

  const handleKycFile = (kind: KycKind) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f && f.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }
    setKycFiles((prev) => ({ ...prev, [kind]: f }));
  };


  const handleUpload = async () => {
    const kindsToUpload = Object.keys(kycFiles).filter(kind => kycFiles[kind as KycKind]);
    if (kindsToUpload.length === 0) {
      toast.info("Nenhum arquivo selecionado.");
      return;
    }

    setUploading(true);
    toast.info("Enviando documentos...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const uploads: Promise<unknown>[] = [];
      const kycRows: any[] = [];

      for (const kind of kindsToUpload as KycKind[]) {
        const file = kycFiles[kind];
        if (!file) continue;

        const ext = (file.name.split(".").pop() || "bin").toLowerCase().slice(0, 5);
        const path = `${user.id}/${kind}.${ext}`;

        kycRows.push({
          doctor_user_id: user.id,
          document_kind: kind,
          storage_path: path,
          verification_status: "pending",
        });

        uploads.push(
          supabase.storage
            .from(KYC_BUCKET)
            .upload(path, file, { upsert: true, contentType: file.type || undefined })
            .then(({ error }) => { if (error) throw error; })
        );
      }

      await Promise.all(uploads);

      if (kycRows.length) {
        const { error: kycErr } = await supabase
          .from("doctor_kyc_documents" as any)
          .upsert(kycRows, { onConflict: "doctor_user_id,document_kind" });
        if (kycErr) throw kycErr;
      }

      toast.success("Documentos enviados com sucesso!");
      setKycFiles({});
      setTimeout(() => navigate('/configuracoes-medico'), 1500);
    } catch (err: any) {
      toast.error("Erro no Upload: " + (err?.message || "Tente novamente."));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0A0F1C] flex flex-col font-sans selection:bg-primary/30">
      <Navbar />
      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/configuracoes-medico')}
              className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
            >
              <ArrowLeft size={16} className="mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-black text-white">Atualizar <span className="text-primary">Documentos KYC</span></h1>
          </div>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-emerald-400 to-primary" />
            <CardContent className="p-6 sm:p-8 space-y-6 mt-6">
              
              <div className="p-4 rounded-2xl bg-muted/30 border border-border text-left">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={18} className="text-primary" />
                  <span className="font-bold text-sm text-foreground">Envio de Documentação Pendente</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  Faça o upload dos documentos solicitados ou faltantes no seu cadastro para liberar o seu acesso à plataforma.
                </p>
              </div>

              <div className="mt-4 space-y-3 border border-slate-700/50 rounded-lg p-4 bg-slate-900/30">
                <p className="text-sm font-medium text-slate-200 mb-4">Selecione os documentos faltantes</p>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className={`text-xs ${uploadedDocs.includes('crm_front') ? 'text-emerald-400' : 'text-red-400'}`}>
                      CRM — frente {uploadedDocs.includes('crm_front') ? '(Anexado)' : '(Faltante)'}
                    </Label>
                    <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("crm_front")} className="bg-slate-900 border-slate-700 text-slate-300" />
                  </div>
                  <div className="space-y-1">
                    <Label className={`text-xs ${uploadedDocs.includes('crm_back') ? 'text-emerald-400' : 'text-red-400'}`}>
                      CRM — verso {uploadedDocs.includes('crm_back') ? '(Anexado)' : '(Faltante)'}
                    </Label>
                    <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("crm_back")} className="bg-slate-900 border-slate-700 text-slate-300" />
                  </div>
                  
                  <div className="space-y-1 sm:col-span-2 mt-2 border border-emerald-500/30 rounded-lg p-3 bg-emerald-900/10">
                    <Label className={`text-xs font-bold ${signatureUrl ? 'text-emerald-400' : 'text-amber-400'}`}>
                      ✍️ Assinatura Digital (ICP-Brasil) — Imagem {signatureUrl ? '(✅ Anexada)' : '(Faltante)'}
                    </Label>
                    {signatureUrl && (
                      <div className="mt-2 p-2 bg-slate-800 rounded border border-emerald-500/30">
                        <p className="text-xs text-emerald-400 mb-1">Prévia da assinatura atual:</p>
                        <img src={signatureUrl} alt="Assinatura Digital" className="h-16 object-contain" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="relative w-full bg-emerald-900/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-800/40 hover:text-white font-semibold"
                        disabled={isUploadingSignature}
                      >
                        {isUploadingSignature ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                        ) : (
                          <><Upload className="mr-2 h-4 w-4" /> {signatureUrl ? 'Atualizar Assinatura Digital' : '📎 Enviar Imagem da Assinatura'}</>
                        )}
                        <input
                          type="file"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          disabled={isUploadingSignature}
                        />
                      </Button>
                      {signatureUrl && <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Aceita JPG, PNG. Máximo 5MB. Sem constraint de banco de dados.</p>
                  </div>

                  <div className="space-y-1 mt-2">
                    <Label className={`text-xs ${uploadedDocs.includes('id_front') ? 'text-emerald-400' : 'text-red-400'}`}>
                      RG/CNH — frente {uploadedDocs.includes('id_front') ? '(Anexado)' : '(Faltante)'}
                    </Label>
                    <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("id_front")} className="bg-slate-900 border-slate-700 text-slate-300" />
                  </div>
                  <div className="space-y-1 mt-2">
                    <Label className={`text-xs ${uploadedDocs.includes('id_back') ? 'text-emerald-400' : 'text-red-400'}`}>
                      RG/CNH — verso {uploadedDocs.includes('id_back') ? '(Anexado)' : '(Faltante)'}
                    </Label>
                    <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("id_back")} className="bg-slate-900 border-slate-700 text-slate-300" />
                  </div>

                  <div className="space-y-1 mt-2">
                    <Label className={`text-xs ${uploadedDocs.includes('cpf_doc') ? 'text-emerald-400' : 'text-red-400'}`}>
                      Documento do CPF {uploadedDocs.includes('cpf_doc') ? '(Anexado)' : '(Faltante)'}
                    </Label>
                    <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("cpf_doc")} className="bg-slate-900 border-slate-700 text-slate-300" />
                  </div>
                  <div className="space-y-1 mt-2">
                    <Label className={`text-xs ${uploadedDocs.includes('address_proof') ? 'text-emerald-400' : 'text-red-400'}`}>
                      Comprovante de endereço (CEP) {uploadedDocs.includes('address_proof') ? '(Anexado)' : '(Faltante)'}
                    </Label>
                    <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("address_proof")} className="bg-slate-900 border-slate-700 text-slate-300" />
                  </div>
                  
                  <div className="space-y-1 sm:col-span-2 mt-2">
                    <Label className={`text-xs ${uploadedDocs.includes('selfie') ? 'text-emerald-400' : 'text-red-400'}`}>
                      Selfie de Confirmação (com documento) {uploadedDocs.includes('selfie') ? '(Anexado)' : '(Faltante)'}
                    </Label>
                    <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("selfie")} className="bg-slate-900 border-slate-700 text-slate-300" />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <Button 
                  onClick={handleUpload} 
                  disabled={uploading}
                  className="bg-primary hover:bg-primary/90 text-white font-bold px-8"
                >
                  {uploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                  ) : (
                    <><Upload className="mr-2 h-4 w-4" /> Enviar Documentos Selecionados</>
                  )}
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
