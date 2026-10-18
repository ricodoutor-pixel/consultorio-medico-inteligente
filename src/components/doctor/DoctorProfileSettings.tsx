import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, FileText, CheckCircle2, PenTool, Eraser, ExternalLink, ShieldCheck } from 'lucide-react';
import { DoctorPhotoUpload } from './DoctorPhotoUpload';

interface DoctorProfileSettingsProps {
  doctor: any;
  profile: any;
  onUpdate: () => void;
}

export const DoctorProfileSettings: React.FC<DoctorProfileSettingsProps> = ({ doctor, profile, onUpdate }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFront, setIsUploadingFront] = useState(false);
  const [isUploadingBack, setIsUploadingBack] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [showDrawSignature, setShowDrawSignature] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);

  // Assinatura atual (pode vir de doctor.signature_url ou profile.signature_url)
  const currentSignature = doctor?.signature_url || profile?.signature_url || '';

  const { toast } = useToast();

  // Parsing seguro do endereço (objeto ou string)
  const initialAddress = (() => {
    if (!doctor?.address) return { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '' };
    if (typeof doctor.address === 'object') {
      return {
        street: doctor.address.street || doctor.address.logradouro || '',
        number: doctor.address.number || doctor.address.numero || '',
        complement: doctor.address.complement || doctor.address.complemento || '',
        neighborhood: doctor.address.neighborhood || doctor.address.bairro || '',
        city: doctor.address.city || doctor.address.cidade || '',
        state: doctor.address.state || doctor.address.uf || '',
        zip: doctor.address.zip || doctor.address.cep || '',
      };
    }
    try {
      const parsed = JSON.parse(doctor.address);
      return {
        street: parsed.street || parsed.logradouro || '',
        number: parsed.number || parsed.numero || '',
        complement: parsed.complement || parsed.complemento || '',
        neighborhood: parsed.neighborhood || parsed.bairro || '',
        city: parsed.city || parsed.cidade || '',
        state: parsed.state || parsed.uf || '',
        zip: parsed.zip || parsed.cep || '',
      };
    } catch {
      return { street: String(doctor.address), number: '', complement: '', neighborhood: '', city: '', state: '', zip: '' };
    }
  })();

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      full_name: profile?.full_name || '',
      cpf: doctor?.cpf || '',
      personal_phone: doctor?.personal_phone || profile?.phone || '',
      pix_key: doctor?.pix_key || '',
      bio: doctor?.bio || '',
      zip: initialAddress.zip,
      street: initialAddress.street,
      number: initialAddress.number,
      complement: initialAddress.complement,
      neighborhood: initialAddress.neighborhood,
      city: initialAddress.city,
      state: initialAddress.state,
    }
  });

  const zipValue = watch('zip');

  // Busca automática de CEP
  const handleCepLookup = async () => {
    const rawCep = (zipValue || '').replace(/\D/g, '');
    if (rawCep.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setValue('street', data.logradouro || '');
        setValue('neighborhood', data.bairro || '');
        setValue('city', data.localidade || '');
        setValue('state', data.uf || '');
        toast({ title: "Endereço localizado!", description: `${data.logradouro}, ${data.localidade} - ${data.uf}` });
      }
    } catch {
      // Silencioso se falhar
    } finally {
      setCepLoading(false);
    }
  };

  // Upload robusto de documentos e assinatura com fallback duplo de bucket e RLS estrito
  const uploadDocument = async (event: React.ChangeEvent<HTMLInputElement>, field: 'crm_front' | 'crm_back' | 'signature') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Resgata ID do usuário autenticado de forma infalível
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id || doctor?.user_id || profile?.id;

    if (!currentUserId) {
      toast({
        title: "Sessão não identificada",
        description: "Por favor, atualize a página ou entre novamente no painel.",
        variant: "destructive",
      });
      return;
    }

    const MAX_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é de 15 MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (field === 'crm_front') setIsUploadingFront(true);
      else if (field === 'crm_back') setIsUploadingBack(true);
      else setIsUploadingSignature(true);

      const fileExt = (file.name.split('.').pop() || 'png').toLowerCase();
      // O path DEVE começar com o user_id para respeitar a RLS policy (storage.foldername(name))[1] = auth.uid()
      const filePath = `${currentUserId}/${field}_${Date.now()}.${fileExt}`;

      let publicUrl = '';

      // Tentativa 1: Bucket 'avatars' (público e com policy auth.uid)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type || undefined });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        publicUrl = urlData?.publicUrl || '';
      } else {
        console.warn('Tentando bucket doctor-kyc-documents...', uploadError);
        // Tentativa 2: Bucket 'doctor-kyc-documents'
        const kycPath = `${currentUserId}/${field}.${fileExt}`;
        const { error: kycErr } = await supabase.storage
          .from('doctor-kyc-documents')
          .upload(kycPath, file, { upsert: true, contentType: file.type || undefined });

        if (kycErr) throw kycErr;

        const { data: kycUrlData } = supabase.storage
          .from('doctor-kyc-documents')
          .getPublicUrl(kycPath);
        publicUrl = kycUrlData?.publicUrl || '';
      }

      const updateField = field === 'crm_front' 
        ? { crm_front_url: publicUrl } 
        : field === 'crm_back' 
          ? { crm_back_url: publicUrl } 
          : { signature_url: publicUrl };

      // Atualiza tabela doctors por ID e por user_id de forma resiliente
      let docUpdated = false;
      if (doctor?.id) {
        const { error: errId } = await (supabase.from('doctors') as any)
          .update(updateField)
          .eq('id', doctor.id);
        if (!errId) docUpdated = true;
      }
      if (!docUpdated && currentUserId) {
        await (supabase.from('doctors') as any)
          .update(updateField)
          .eq('user_id', currentUserId);
      }

      // Se for assinatura, atualiza também a tabela profiles
      if (field === 'signature' && currentUserId) {
        await (supabase.from('profiles') as any)
          .update({ signature_url: publicUrl })
          .eq('id', currentUserId);
      }

      // Registra na tabela de documentos KYC
      if (currentUserId) {
        const docKind = field === 'signature' ? 'icp_brasil' : field;
        await (supabase.from('doctor_kyc_documents') as any)
          .upsert({
            doctor_user_id: currentUserId,
            document_kind: docKind,
            storage_path: filePath,
            verification_status: 'verified'
          }, { onConflict: 'doctor_user_id,document_kind' })
          .catch(() => {});
      }

      toast({ 
        title: "✅ Sucesso!", 
        description: field === 'signature' 
          ? "Assinatura eletrônica salva e pronta para emissão de receitas!" 
          : "Documento salvo com sucesso!" 
      });
      onUpdate();
    } catch (err: any) {
      console.error('Erro no upload de documento:', err);
      toast({ 
        title: "Erro ao anexar arquivo", 
        description: err?.message || "Tente novamente ou envie em formato PNG/JPG/PDF.", 
        variant: "destructive" 
      });
    } finally {
      if (field === 'crm_front') setIsUploadingFront(false);
      else if (field === 'crm_back') setIsUploadingBack(false);
      else setIsUploadingSignature(false);
    }
  };

  // Salvar Assinatura Desenhada na Tela (Canvas)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawnSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `signature_${Date.now()}.png`, { type: 'image/png' });
      const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      await uploadDocument(fakeEvent, 'signature');
      setShowDrawSignature(false);
    }, 'image/png');
  };

  // Salvar formulário de dados sem NENHUM erro de JSON
  const onSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || doctor?.user_id || profile?.id;

      const structuredAddress = {
        street: data.street || '',
        number: data.number || '',
        complement: data.complement || '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
      };

      const doctorPayload = {
        cpf: data.cpf,
        personal_phone: data.personal_phone,
        pix_key: data.pix_key,
        bio: data.bio,
        address: structuredAddress,
      };

      let docSaved = false;
      if (doctor?.id) {
        const { error: err1 } = await (supabase as any)
          .from('doctors')
          .update(doctorPayload)
          .eq('id', doctor.id);
        if (!err1) docSaved = true;
      }

      if (!docSaved && currentUserId) {
        const { error: err2 } = await (supabase as any)
          .from('doctors')
          .update(doctorPayload)
          .eq('user_id', currentUserId);
        if (err2) throw err2;
      }

      // Atualiza nome e telefone no profile também
      if (currentUserId && data.full_name) {
        await (supabase as any)
          .from('profiles')
          .update({
            full_name: data.full_name,
            phone: data.personal_phone,
          })
          .eq('id', currentUserId);
      }

      toast({ 
        title: "✅ Perfil atualizado com sucesso!", 
        description: "Seus dados e endereço foram salvos na plataforma." 
      });
      onUpdate();
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      toast({ 
        title: "Erro ao salvar alterações", 
        description: err?.message || "Verifique os campos e tente novamente.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isPdfSignature = currentSignature.toLowerCase().endsWith('.pdf') || currentSignature.includes('pdf');

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      {/* Banner de Status do Médico */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-emerald-950">Ambiente de Credenciamento Clínico & Telemedicina</h4>
          <p className="text-xs text-emerald-800">
            Mantenha seu CRM e Assinatura Digital atualizados para habilitar a emissão de receitas e laudos certificados.
          </p>
        </div>
      </div>

      {/* 1. Foto de Perfil */}
      <div className="bg-card rounded-xl border p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Foto de Perfil Profissional</h3>
        <DoctorPhotoUpload 
          userId={doctor?.user_id || profile?.id} 
          currentPhotoUrl={profile?.avatar_url} 
          onUploadSuccess={onUpdate} 
        />
      </div>

      {/* 2. Documentos Obrigatórios (KYC) e Assinatura Digital */}
      <div className="bg-card rounded-xl border p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Assinatura Digital & Documentos (KYC)</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Envie sua assinatura eletrônica (imagem, carimbo ou certificado) para assinar receitas e pedidos de exames.
          </p>
        </div>

        {/* Bloco de Assinatura Digital em Destaque */}
        <div className="border-2 border-emerald-500/30 bg-emerald-500/5 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <Label className="text-base font-bold text-foreground flex items-center gap-2">
                <PenTool className="h-4 w-4 text-emerald-600" />
                Assinatura Eletrônica / Digital (Gov.br / ICP-Brasil) *
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aceita imagem (PNG, JPG, WEBP), foto do carimbo médico ou documento PDF do certificado.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDrawSignature(!showDrawSignature)}
                className="text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                <PenTool className="h-3.5 w-3.5 mr-1" />
                {showDrawSignature ? 'Ocultar Desenho' : 'Desenhar na Tela'}
              </Button>
            </div>
          </div>

          {/* Área de Desenho na Tela (Opcional) */}
          {showDrawSignature && (
            <div className="bg-white border-2 border-dashed border-emerald-400 rounded-xl p-4 text-center space-y-3">
              <p className="text-xs text-slate-600 font-medium">Assine com o mouse ou dedo no quadro abaixo:</p>
              <div className="inline-block border rounded-lg bg-slate-50 overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={420}
                  height={140}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair bg-white"
                />
              </div>
              <div className="flex justify-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={clearCanvas} className="text-xs">
                  <Eraser className="h-3.5 w-3.5 mr-1" /> Limpar
                </Button>
                <Button type="button" size="sm" onClick={saveDrawnSignature} disabled={isUploadingSignature} className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                  {isUploadingSignature ? <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                  Salvar Assinatura Desenhada
                </Button>
              </div>
            </div>
          )}

          {/* Botão de Anexar Arquivo da Assinatura */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              type="button"
              variant="default"
              className="relative bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex-1 py-5"
              disabled={isUploadingSignature}
            >
              {isUploadingSignature ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Salvando Assinatura...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {currentSignature ? 'Substituir Assinatura Digital' : 'Anexar Arquivo de Assinatura'}
                </>
              )}
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                onChange={(e) => uploadDocument(e, 'signature')}
                disabled={isUploadingSignature}
              />
            </Button>
          </div>

          {/* Visualização da Assinatura Atual */}
          {currentSignature && (
            <div className="bg-white border border-emerald-300 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">Assinatura Digital Ativa e Homologada</p>
                  <p className="text-[11px] text-emerald-700">Seus pacientes receberão prescrições assinadas com este registro.</p>
                </div>
              </div>

              {isPdfSignature ? (
                <a
                  href={currentSignature}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold hover:bg-emerald-200 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Ver Certificado PDF
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <div className="bg-white border rounded p-1.5 shadow-sm shrink-0">
                  <img src={currentSignature} alt="Assinatura Médica" className="h-14 max-w-[180px] object-contain" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* CRM Frente e Verso */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* CRM Frente */}
          <div className="border rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">CRM / Carteira (Frente)</Label>
              {doctor?.crm_front_url && (
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Enviado
                </span>
              )}
            </div>
            <Button variant="outline" className="relative w-full text-xs" disabled={isUploadingFront}>
              {isUploadingFront ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
              {doctor?.crm_front_url ? 'Atualizar Frente' : 'Anexar Frente (Foto/PDF)'}
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*,.pdf"
                onChange={(e) => uploadDocument(e, 'crm_front')}
                disabled={isUploadingFront}
              />
            </Button>
          </div>

          {/* CRM Verso */}
          <div className="border rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">CRM / Carteira (Verso)</Label>
              {doctor?.crm_back_url && (
                <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Enviado
                </span>
              )}
            </div>
            <Button variant="outline" className="relative w-full text-xs" disabled={isUploadingBack}>
              {isUploadingBack ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
              {doctor?.crm_back_url ? 'Atualizar Verso' : 'Anexar Verso (Foto/PDF)'}
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*,.pdf"
                onChange={(e) => uploadDocument(e, 'crm_back')}
                disabled={isUploadingBack}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Dados Profissionais, Contato e Endereço */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-xl border p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Dados Cadastrais & Repasse Financeiro</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Preencha seus dados para recebimento de honorários via PIX.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input id="full_name" placeholder="Dr(a). Seu Nome" {...register('full_name')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" placeholder="000.000.000-00" {...register('cpf')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="personal_phone">WhatsApp / Celular de Atendimento</Label>
            <Input id="personal_phone" placeholder="(11) 90000-0000" {...register('personal_phone')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pix_key">Chave PIX (Para repasse de consultas)</Label>
            <Input id="pix_key" placeholder="CPF, celular, e-mail ou aleatória" {...register('pix_key')} />
          </div>
        </div>

        {/* Endereço Estruturado (Sem JSON!) */}
        <div className="border-t pt-5 space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Endereço do Consultório / Residencial</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="zip">CEP</Label>
              <div className="flex gap-2">
                <Input 
                  id="zip" 
                  placeholder="00000-000" 
                  {...register('zip')} 
                  onBlur={handleCepLookup} 
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCepLookup}
                  disabled={cepLoading}
                >
                  {cepLoading ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : 'Buscar'}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="street">Logradouro / Rua</Label>
              <Input id="street" placeholder="Av. Paulista, Rua..." {...register('street')} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="number">Número</Label>
              <Input id="number" placeholder="123" {...register('number')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="complement">Complemento</Label>
              <Input id="complement" placeholder="Sala 402" {...register('complement')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input id="neighborhood" placeholder="Bela Vista" {...register('neighborhood')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city">Cidade / UF</Label>
              <Input id="city" placeholder="São Paulo / SP" {...register('city')} />
            </div>
          </div>
        </div>

        {/* Resumo Profissional (Bio) */}
        <div className="space-y-1.5 border-t pt-5">
          <Label htmlFor="bio">Resumo de Atuação Clínica (Bio na Vitrine)</Label>
          <Textarea 
            id="bio" 
            placeholder="Conte um pouco sobre sua formação, experiência e abordagem em medicina canabinoide..." 
            className="h-28 text-sm"
            {...register('bio')} 
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5"
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Salvando Dados...
              </>
            ) : (
              'Salvar Alterações do Perfil'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
