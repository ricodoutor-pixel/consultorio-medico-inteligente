import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Loader2, Upload, ShieldCheck, CheckCircle2, 
  User, CreditCard, MapPin, FileText, Sparkles, AlertCircle, Save 
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { KYC_BUCKET, type KycKind } from "@/lib/kyc-docs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AtualizarDocumentosMedico() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("documentos");

  // Dados Cadastrais
  const [fullName, setFullName] = useState("");
  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("BA");
  const [cpf, setCpf] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [cepLoading, setCepLoading] = useState(false);

  // Documentos KYC
  const [kycFiles, setKycFiles] = useState<Partial<Record<KycKind, File | null>>>({});
  const [uploadedDocs, setUploadedDocs] = useState<KycKind[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const uid = session.user.id;
      setUserId(uid);

      // Carrega dados simultâneos de doctors, profiles e doctor_kyc_documents
      const [docRes, profRes, kycRes] = await Promise.all([
        supabase.from("doctors").select("*").eq("user_id", uid).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("doctor_kyc_documents").select("document_kind").eq("doctor_user_id", uid),
      ]);

      const doc = docRes.data;
      const prof = profRes.data;
      const docs = kycRes.data;

      if (doc) {
        setDoctorId(doc.id);
        setCrm(doc.crm || "");
        setCrmState(doc.crm_state || "BA");
        setSpecialty(doc.specialty || "");
        setBio(doc.bio || "");
        if (doc.signature_url) setSignatureUrl(doc.signature_url);
      }

      if (prof) {
        setFullName(prof.full_name || "");
        setCpf(prof.cpf || "");
        setDateOfBirth(prof.date_of_birth || "");
        if (prof.phone) setPhone(prof.phone);
        if (prof.pix_key) setPixKey(prof.pix_key);
        if (prof.signature_url) setSignatureUrl(prof.signature_url);
        if (prof.cep) setCep(prof.cep);
        const fullAddr = [prof.address_street, prof.address_number, prof.neighborhood, prof.city, prof.state]
          .filter(Boolean)
          .join(", ");
        if (fullAddr) setAddress(fullAddr);
      }

      if (docs) {
        setUploadedDocs(docs.map(d => d.document_kind as KycKind));
      }
    } catch (err: any) {
      console.error("[AtualizarDocumentosMedico] Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  // Busca automática de CEP
  const handleCepLookup = async () => {
    const rawCep = (cep || "").replace(/\D/g, "");
    if (rawCep.length !== 8) {
      toast.error("Informe um CEP válido com 8 dígitos.");
      return;
    }

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        const fullAddr = `${data.logradouro || ""}, ${data.bairro || ""} - ${data.localidade || ""}/${data.uf || ""}`;
        setAddress(fullAddr);
        toast.success(`Endereço localizado: ${data.localidade}/${data.uf}`);
      } else {
        toast.error("CEP não localizado.");
      }
    } catch {
      toast.error("Falha ao consultar CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  // Upload de Assinatura Digital ICP-Brasil
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

      const fileExt = (file.name.split('.').pop() || 'png').toLowerCase();
      const filePath = `${userId}/signature_${Date.now()}.${fileExt}`;

      let publicUrl = '';
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type || undefined });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        publicUrl = publicUrlData?.publicUrl || '';
      } else {
        const kycPath = `${userId}/signature.${fileExt}`;
        const { error: kycErr } = await supabase.storage
          .from(KYC_BUCKET)
          .upload(kycPath, file, { upsert: true, contentType: file.type || undefined });
        if (kycErr) throw kycErr;

        const { data: kycUrlData } = supabase.storage
          .from(KYC_BUCKET)
          .getPublicUrl(kycPath);
        publicUrl = kycUrlData?.publicUrl || '';
      }

      if (publicUrl) {
        await Promise.all([
          supabase.from("doctors").update({ signature_url: publicUrl }).eq("user_id", userId),
          supabase.from("profiles").update({ signature_url: publicUrl } as any).eq("id", userId),
        ]);

        await (supabase.from("doctor_kyc_documents" as any)
          .upsert({
            doctor_user_id: userId,
            document_kind: "icp_brasil",
            storage_path: filePath,
            verification_status: "verified"
          }, { onConflict: "doctor_user_id,document_kind" }) as any);
        
        setSignatureUrl(publicUrl);
        toast.success("✅ Assinatura digital anexada com sucesso!");
      }
    } catch (err: any) {
      console.error(err);
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

  // Salvar Dados Cadastrais e Documentos em 1 Único Clique
  const handleSaveAll = async () => {
    if (!userId) return;

    setUploading(true);
    toast.info("Salvando cadastro e enviando documentos...");

    try {
      // 1. Atualiza profiles
      const profileUpdates: any = {};
      if (fullName) profileUpdates.full_name = fullName;
      if (cpf) profileUpdates.cpf = cpf;
      if (dateOfBirth) profileUpdates.date_of_birth = dateOfBirth;
      if (phone) profileUpdates.phone = phone;
      if (pixKey) profileUpdates.pix_key = pixKey;
      if (cep) profileUpdates.cep = cep;
      if (address) profileUpdates.address_street = address;

      if (Object.keys(profileUpdates).length > 0) {
        await (supabase.from("profiles") as any).update(profileUpdates).eq("id", userId);
      }

      // 2. Atualiza doctors
      const doctorUpdates: any = {};
      if (crm) doctorUpdates.crm = crm;
      if (crmState) doctorUpdates.crm_state = crmState;
      if (specialty) doctorUpdates.specialty = specialty;
      if (bio) doctorUpdates.bio = bio;

      if (Object.keys(doctorUpdates).length > 0) {
        await (supabase.from("doctors") as any).update(doctorUpdates).eq("user_id", userId);
      }

      // 3. Upload dos arquivos KYC selecionados
      const kindsToUpload = Object.keys(kycFiles).filter(kind => kycFiles[kind as KycKind]);
      if (kindsToUpload.length > 0) {
        const uploads: Promise<unknown>[] = [];
        const kycRows: any[] = [];

        for (const kind of kindsToUpload as KycKind[]) {
          const file = kycFiles[kind as KycKind];
          if (!file) continue;

          const ext = (file.name.split(".").pop() || "bin").toLowerCase().slice(0, 5);
          const path = `${userId}/${kind}.${ext}`;

          kycRows.push({
            doctor_user_id: userId,
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
          await supabase
            .from("doctor_kyc_documents" as any)
            .upsert(kycRows, { onConflict: "doctor_user_id,document_kind" });
        }
      }

      toast.success("✅ Cadastro e documentos salvos com sucesso!");
      setKycFiles({});
      fetchSession();
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao salvar: " + (err?.message || "Tente novamente."));
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
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header com botões de navegação */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/consultorio')}
                className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
              >
                <ArrowLeft size={16} className="mr-2" />
                Voltar ao Consultório
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  Atualizar <span className="text-primary">Cadastro & Documentos KYC</span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Preencha seus dados cadastrais e anexe seus comprovantes profissionais em um só lugar.
                </p>
              </div>
            </div>

            <Button 
              onClick={handleSaveAll} 
              disabled={uploading}
              className="bg-primary hover:bg-primary/90 text-white font-extrabold px-6 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 transition-all"
            >
              {uploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Salvar Tudo</>
              )}
            </Button>
          </div>

          {/* Banner de Status */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 text-left flex items-start gap-3">
            <ShieldCheck size={20} className="text-primary mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-sm text-white">Auditoria Técnica & Homologação Médica</span>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Após preencher os dados e anexar os documentos, a Diretoria Técnica (supervisão Dr. Edilson) confere os dados no CFM e libera seu card na vitrine e fila de atendimento.
              </p>
            </div>
          </div>

          {/* Tabs: Documentos KYC / Dados Cadastrais */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <TabsTrigger 
                value="documentos" 
                className="font-bold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                📎 Anexar Documentos KYC
              </TabsTrigger>
              <TabsTrigger 
                value="dados" 
                className="font-bold text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                👤 Dados Pessoais & Chave PIX
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: DOCUMENTOS KYC */}
            <TabsContent value="documentos" className="mt-4 space-y-6">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-primary via-emerald-400 to-primary" />
                <CardContent className="p-6 sm:p-8 space-y-6 mt-2">

                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-slate-200">
                      Envie os comprovantes solicitados (Formatos aceitos: JPG, PNG, PDF até 5MB):
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* CRM Frente */}
                      <div className="space-y-1.5 p-3 rounded-xl border border-slate-700 bg-slate-900/40">
                        <div className="flex items-center justify-between">
                          <Label className={`text-xs font-bold ${uploadedDocs.includes('crm_front') ? 'text-emerald-400' : 'text-amber-400'}`}>
                            CRM — Frente
                          </Label>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${uploadedDocs.includes('crm_front') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {uploadedDocs.includes('crm_front') ? '✅ Anexado' : '⚠️ Pendente'}
                          </span>
                        </div>
                        <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("crm_front")} className="bg-slate-900 border-slate-700 text-slate-300 text-xs" />
                      </div>

                      {/* CRM Verso */}
                      <div className="space-y-1.5 p-3 rounded-xl border border-slate-700 bg-slate-900/40">
                        <div className="flex items-center justify-between">
                          <Label className={`text-xs font-bold ${uploadedDocs.includes('crm_back') ? 'text-emerald-400' : 'text-amber-400'}`}>
                            CRM — Verso
                          </Label>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${uploadedDocs.includes('crm_back') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {uploadedDocs.includes('crm_back') ? '✅ Anexado' : '⚠️ Pendente'}
                          </span>
                        </div>
                        <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("crm_back")} className="bg-slate-900 border-slate-700 text-slate-300 text-xs" />
                      </div>

                      {/* Assinatura Digital ICP-Brasil */}
                      <div className="space-y-2 sm:col-span-2 border border-emerald-500/30 rounded-xl p-4 bg-emerald-950/20">
                        <div className="flex items-center justify-between">
                          <Label className={`text-xs font-bold ${signatureUrl ? 'text-emerald-400' : 'text-amber-400'}`}>
                            ✍️ Assinatura Digital (ICP-Brasil / Carimbo Médico)
                          </Label>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${signatureUrl ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {signatureUrl ? '✅ Anexada para Receituários' : '⚠️ Obrigatória para Receitas'}
                          </span>
                        </div>
                        
                        {signatureUrl && (
                          <div className="p-3 bg-slate-900/60 rounded-lg border border-emerald-500/30 flex items-center gap-4">
                            <img src={signatureUrl} alt="Assinatura Digital" className="h-14 object-contain rounded bg-white/5 p-1" />
                            <div className="text-xs text-slate-400">
                              <p className="text-emerald-400 font-bold">Assinatura ativa no sistema</p>
                              <p className="text-[11px]">Será inserida nas receitas, atestados e pedidos de exame.</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="relative w-full bg-emerald-900/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-800/40 hover:text-white font-semibold text-xs"
                            disabled={isUploadingSignature}
                          >
                            {isUploadingSignature ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                            ) : (
                              <><Upload className="mr-2 h-4 w-4" /> {signatureUrl ? 'Substituir Assinatura Digital' : '📎 Anexar Imagem da Assinatura Digital'}</>
                            )}
                            <input
                              type="file"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              accept="image/*"
                              onChange={handleSignatureUpload}
                              disabled={isUploadingSignature}
                            />
                          </Button>
                        </div>
                      </div>

                      {/* RG / CNH Frente */}
                      <div className="space-y-1.5 p-3 rounded-xl border border-slate-700 bg-slate-900/40">
                        <div className="flex items-center justify-between">
                          <Label className={`text-xs font-bold ${uploadedDocs.includes('id_front') ? 'text-emerald-400' : 'text-slate-400'}`}>
                            RG ou CNH — Frente
                          </Label>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${uploadedDocs.includes('id_front') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                            {uploadedDocs.includes('id_front') ? '✅ Anexado' : 'Opcional'}
                          </span>
                        </div>
                        <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("id_front")} className="bg-slate-900 border-slate-700 text-slate-300 text-xs" />
                      </div>

                      {/* RG / CNH Verso */}
                      <div className="space-y-1.5 p-3 rounded-xl border border-slate-700 bg-slate-900/40">
                        <div className="flex items-center justify-between">
                          <Label className={`text-xs font-bold ${uploadedDocs.includes('id_back') ? 'text-emerald-400' : 'text-slate-400'}`}>
                            RG ou CNH — Verso
                          </Label>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${uploadedDocs.includes('id_back') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                            {uploadedDocs.includes('id_back') ? '✅ Anexado' : 'Opcional'}
                          </span>
                        </div>
                        <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("id_back")} className="bg-slate-900 border-slate-700 text-slate-300 text-xs" />
                      </div>

                      {/* Comprovante de Endereço */}
                      <div className="space-y-1.5 p-3 rounded-xl border border-slate-700 bg-slate-900/40">
                        <div className="flex items-center justify-between">
                          <Label className={`text-xs font-bold ${uploadedDocs.includes('address_proof') ? 'text-emerald-400' : 'text-amber-400'}`}>
                            Comprovante de Residência (Conta de Luz, Água ou Gás)
                          </Label>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${uploadedDocs.includes('address_proof') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {uploadedDocs.includes('address_proof') ? '✅ Anexado' : '⚠️ Pendente'}
                          </span>
                        </div>
                        <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("address_proof")} className="bg-slate-900 border-slate-700 text-slate-300 text-xs" />
                      </div>

                      {/* Documento do CPF */}
                      <div className="space-y-1.5 p-3 rounded-xl border border-slate-700 bg-slate-900/40">
                        <div className="flex items-center justify-between">
                          <Label className={`text-xs font-bold ${uploadedDocs.includes('cpf_doc') ? 'text-emerald-400' : 'text-slate-400'}`}>
                            Comprovante de Inscrição no CPF
                          </Label>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${uploadedDocs.includes('cpf_doc') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                            {uploadedDocs.includes('cpf_doc') ? '✅ Anexado' : 'Opcional'}
                          </span>
                        </div>
                        <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("cpf_doc")} className="bg-slate-900 border-slate-700 text-slate-300 text-xs" />
                      </div>

                      {/* Comprovante VIP */}
                      <div className="space-y-2 sm:col-span-2 border border-sky-500/40 rounded-xl p-4 bg-sky-950/20">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                            💎 Comprovante do Plano Médico VIP
                          </Label>
                          <span className="text-[10px] text-sky-400 font-mono font-bold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
                            Aprovação Prioritária
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Se você realizou o pagamento do Plano VIP ou da mensalidade via Pix ou transferência, anexe aqui o comprovante para liberação imediata do selo VIP na vitrine.
                        </p>
                        <Input type="file" accept="image/*,.pdf" onChange={handleKycFile("vip_receipt")} className="bg-slate-900 border-slate-700 text-slate-300 text-xs" />
                      </div>

                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button 
                      onClick={handleSaveAll} 
                      disabled={uploading}
                      className="bg-primary hover:bg-primary/90 text-white font-black px-8 shadow-lg"
                    >
                      {uploading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" /> Salvar Documentos Anexados</>
                      )}
                    </Button>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 2: DADOS PESSOAIS E CHAVE PIX */}
            <TabsContent value="dados" className="mt-4 space-y-6">
              <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-primary" />
                <CardContent className="p-6 sm:p-8 space-y-6 mt-2">

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Nome Completo */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-slate-300 font-bold">Nome Completo</Label>
                      <Input 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        placeholder="Dr(a). Seu Nome Completo"
                        className="bg-slate-900 border-slate-700 text-white text-xs"
                      />
                    </div>

                    {/* CRM */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300 font-bold">Número do CRM</Label>
                      <Input 
                        value={crm} 
                        onChange={(e) => setCrm(e.target.value)} 
                        placeholder="Ex: 31192"
                        className="bg-slate-900 border-slate-700 text-white text-xs"
                      />
                    </div>

                    {/* CRM UF */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300 font-bold">Estado do CRM (UF)</Label>
                      <Input 
                        value={crmState} 
                        onChange={(e) => setCrmState(e.target.value.toUpperCase().slice(0, 2))} 
                        placeholder="Ex: BA, SP, RJ"
                        maxLength={2}
                        className="bg-slate-900 border-slate-700 text-white text-xs uppercase"
                      />
                    </div>

                    {/* CPF */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300 font-bold">CPF do Titular</Label>
                      <Input 
                        value={cpf} 
                        onChange={(e) => setCpf(e.target.value)} 
                        placeholder="000.000.000-00"
                        className="bg-slate-900 border-slate-700 text-white text-xs"
                      />
                    </div>

                    {/* Data de Nascimento */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300 font-bold">Data de Nascimento</Label>
                      <Input 
                        type="date"
                        value={dateOfBirth} 
                        onChange={(e) => setDateOfBirth(e.target.value)} 
                        className="bg-slate-900 border-slate-700 text-white text-xs"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300 font-bold">WhatsApp / Celular com DDD</Label>
                      <Input 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        placeholder="(75) 99146-2018"
                        className="bg-slate-900 border-slate-700 text-white text-xs"
                      />
                    </div>

                    {/* Chave PIX */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                        <CreditCard size={13} /> Chave PIX (Para Recebimento dos Repasses)
                      </Label>
                      <Input 
                        value={pixKey} 
                        onChange={(e) => setPixKey(e.target.value)} 
                        placeholder="CPF, e-mail, telefone ou chave aleatória"
                        className="bg-slate-900 border-amber-500/40 text-amber-300 text-xs font-mono"
                      />
                    </div>

                    {/* CEP */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                        <MapPin size={13} /> CEP de Residência / Consultório
                      </Label>
                      <div className="flex gap-2">
                        <Input 
                          value={cep} 
                          onChange={(e) => setCep(e.target.value)} 
                          placeholder="00000-000"
                          maxLength={9}
                          className="bg-slate-900 border-slate-700 text-white text-xs"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleCepLookup} 
                          disabled={cepLoading}
                          className="text-xs border-slate-700 text-slate-300 shrink-0"
                        >
                          {cepLoading ? <Loader2 size={13} className="animate-spin" /> : "Buscar"}
                        </Button>
                      </div>
                    </div>

                    {/* Endereço Completo */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-300 font-bold">Endereço Completo</Label>
                      <Input 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                        placeholder="Rua, número, bairro, cidade - UF"
                        className="bg-slate-900 border-slate-700 text-white text-xs"
                      />
                    </div>

                    {/* Especialidade */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-slate-300 font-bold">Especialidade Principal & Áreas de Atuação</Label>
                      <Input 
                        value={specialty} 
                        onChange={(e) => setSpecialty(e.target.value)} 
                        placeholder="Ex: Clínica Geral, Emergências Pediátricas, Medicina Canabinoide"
                        className="bg-slate-900 border-slate-700 text-white text-xs"
                      />
                    </div>

                    {/* Bio */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs text-slate-300 font-bold">Resumo Profissional (Bio para os Pacientes)</Label>
                      <Textarea 
                        value={bio} 
                        onChange={(e) => setBio(e.target.value)} 
                        rows={3}
                        placeholder="Descreva sua formação, anos de experiência e foco no atendimento."
                        className="bg-slate-900 border-slate-700 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button 
                      onClick={handleSaveAll} 
                      disabled={uploading}
                      className="bg-primary hover:bg-primary/90 text-white font-black px-8 shadow-lg"
                    >
                      {uploading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" /> Salvar Dados Cadastrais</>
                      )}
                    </Button>
                  </div>

                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </main>
      <Footer />
    </div>
  );
}
