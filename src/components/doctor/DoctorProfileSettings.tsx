import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload } from 'lucide-react';
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
  
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      cpf: doctor.cpf || '',
      personal_phone: doctor.personal_phone || '',
      pix_key: doctor.pix_key || '',
      bio: doctor.bio || '',
      address: doctor.address ? JSON.stringify(doctor.address, null, 2) : '{\n  "street": "",\n  "number": "",\n  "city": "",\n  "state": "",\n  "zip": ""\n}',
    }
  });

  const uploadDocument = async (event: React.ChangeEvent<HTMLInputElement>, field: 'crm_front' | 'crm_back' | 'signature') => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (field === 'crm_front') setIsUploadingFront(true);
      else if (field === 'crm_back') setIsUploadingBack(true);
      else setIsUploadingSignature(true);

      const fileExt = file.name.split('.').pop();
      const filePath = `documents/${doctor.user_id}/${field}_${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars') // using avatars bucket for now, ideally 'documents' bucket
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const updateField = field === 'crm_front' ? { crm_front_url: publicUrl } : field === 'crm_back' ? { crm_back_url: publicUrl } : { signature_url: publicUrl };

      const { error: updateError } = await (supabase as any)
        .from('doctors')
        .update(updateField)
        .eq('id', doctor.id);

      if (updateError) throw updateError;
      
      onUpdate();
      toast({ title: "Documento enviado com sucesso!" });
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao enviar documento", variant: "destructive" });
    } finally {
      if (field === 'crm_front') setIsUploadingFront(false);
      else if (field === 'crm_back') setIsUploadingBack(false);
      else setIsUploadingSignature(false);
    }
  };

  const onSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      let parsedAddress = null;
      try {
        parsedAddress = JSON.parse(data.address);
      } catch (e) {
        toast({ title: "Formato de endereço inválido. Use JSON válido.", variant: "destructive" });
        setIsSaving(false);
        return;
      }

      const { error } = await (supabase as any)
        .from('doctors')
        .update({
          cpf: data.cpf,
          personal_phone: data.personal_phone,
          pix_key: data.pix_key,
          bio: data.bio,
          address: parsedAddress,
        })
        .eq('id', doctor.id);

      if (error) throw error;
      
      toast({ title: "Perfil atualizado com sucesso!" });
      onUpdate();
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-10">
      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-6">Foto de Perfil</h3>
        <DoctorPhotoUpload 
          userId={doctor.user_id} 
          currentPhotoUrl={profile?.avatar_url} 
          onUploadSuccess={onUpdate} 
        />
      </div>

      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-6">Documentos Obrigatórios (KYC)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>CRM Frente</Label>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="relative w-full" disabled={isUploadingFront}>
                {isUploadingFront ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                {doctor.crm_front_url ? 'Atualizar Frente' : 'Enviar Frente'}
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf" onChange={(e) => uploadDocument(e, 'crm_front')} />
              </Button>
            </div>
            {doctor.crm_front_url && <p className="text-xs text-green-600 font-medium">✓ Enviado</p>}
          </div>
          
          <div className="space-y-2">
            <Label>CRM Verso</Label>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="relative w-full" disabled={isUploadingBack}>
                {isUploadingBack ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                {doctor.crm_back_url ? 'Atualizar Verso' : 'Enviar Verso'}
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*,.pdf" onChange={(e) => uploadDocument(e, 'crm_back')} />
              </Button>
            </div>
            {doctor.crm_back_url && <p className="text-xs text-green-600 font-medium">✓ Enviado</p>}
          </div>
        </div>

        <div className="mt-6 space-y-2 max-w-md">
          <Label>Assinatura Digital (Gov.br / ICP-Brasil)</Label>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="relative w-full" disabled={isUploadingSignature}>
              {isUploadingSignature ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
              {doctor.signature_url ? 'Atualizar Assinatura' : 'Enviar Imagem da Assinatura'}
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={(e) => uploadDocument(e, 'signature')} />
            </Button>
          </div>
          {doctor.signature_url && (
            <div className="mt-4 border rounded-lg p-4 bg-white/50">
              <p className="text-xs text-green-600 font-medium mb-2">✓ Assinatura enviada e ativa para receitas</p>
              <div className="bg-white p-2 border inline-block rounded">
                <img src={doctor.signature_url} alt="Assinatura" className="h-20 object-contain" />
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-xl border p-6 space-y-6">
        <h3 className="text-lg font-semibold">Dados Profissionais e Financeiros</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input id="cpf" placeholder="000.000.000-00" {...register('cpf')} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="personal_phone">Celular Pessoal (WhatsApp)</Label>
            <Input id="personal_phone" placeholder="(00) 00000-0000" {...register('personal_phone')} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pix_key">Chave PIX (Para repasses)</Label>
            <Input id="pix_key" placeholder="CPF, Celular, E-mail ou Aleatória" {...register('pix_key')} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Resumo Profissional (Bio)</Label>
          <Textarea 
            id="bio" 
            placeholder="Apresente-se aos seus pacientes..." 
            className="h-24"
            {...register('bio')} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Endereço (JSON - Temporário)</Label>
          <Textarea 
            id="address" 
            className="h-32 font-mono text-sm"
            {...register('address')} 
          />
          <p className="text-xs text-muted-foreground">O endereço deve ser preenchido no formato JSON por enquanto.</p>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
};
