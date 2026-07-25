import React, { useState } from 'react';
import { Upload, X, Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface DoctorPhotoUploadProps {
  userId: string;
  currentPhotoUrl?: string | null;
  onUploadSuccess: (url: string) => void;
}

export const DoctorPhotoUpload: React.FC<DoctorPhotoUploadProps> = ({ userId, currentPhotoUrl, onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A foto deve ter no máximo 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      onUploadSuccess(publicUrl);
      toast({
        title: "Foto atualizada",
        description: "Sua foto de perfil foi atualizada com sucesso."
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erro ao fazer upload",
        description: "Ocorreu um erro ao enviar sua foto. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32 rounded-full border-4 border-muted overflow-hidden bg-muted/30 group">
        {currentPhotoUrl ? (
          <img src={currentPhotoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <Camera size={32} />
          </div>
        )}
        <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
          {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={24} />}
          <span className="text-xs mt-1 font-medium">{isUploading ? 'Enviando...' : 'Alterar Foto'}</span>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>
      <div className="text-center">
        <Button variant="outline" size="sm" className="relative">
          {isUploading ? 'Enviando...' : 'Alterar / Baixar Foto'}
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            title="Clique para escolher uma foto"
          />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">JPG, PNG ou GIF. Máximo de 5MB.</p>
      </div>
    </div>
  );
};
