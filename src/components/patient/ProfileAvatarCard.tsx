/**
 * ProfileAvatarCard — Cabeçalho de perfil do paciente
 * Mostra foto (ou Verdinho 🐸 como fallback), nome e telefone do usuário.
 * Permite upload da foto de perfil para o bucket "avatars".
 */
import { useRef, useState } from "react";
import { Camera, Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileAvatarCardProps {
  userId: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  completedCount: number;
  onUpdated?: (avatarUrl: string) => void;
}

export const ProfileAvatarCard = ({
  userId,
  fullName,
  phone,
  avatarUrl,
  completedCount,
  onUpdated,
}: ProfileAvatarCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(avatarUrl ?? null);
  const { toast } = useToast();

  const firstName = fullName.split(" ")[0] || "Paciente";

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Máximo 4 MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });

      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updErr) throw updErr;

      setCurrentAvatar(publicUrl);
      onUpdated?.(publicUrl);
      toast({ title: "Foto atualizada ✅", description: "Sua nova foto de perfil já está visível." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast({ title: "Falha no upload", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={handlePick}
          className="relative w-14 h-14 rounded-2xl bg-gradient-green border border-green flex items-center justify-center overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Alterar foto de perfil"
        >
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt={`Foto de ${firstName}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-3xl" role="img" aria-label="Verdinho">🐸</span>
          )}
          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            {uploading ? (
              <Loader2 size={18} className="text-white animate-spin" />
            ) : (
              <Camera size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </button>
        <button
          type="button"
          onClick={handlePick}
          className="text-[9px] text-primary/80 hover:text-primary font-bold transition-colors leading-tight text-center"
        >
          📸 Alterar Foto
        </button>
      </div>

      <div>
        <h1 className="text-2xl md:text-4xl font-display font-black text-foreground leading-tight">
          Olá, {firstName}! 👋
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
          <span>{completedCount} consulta(s) realizadas</span>
          {phone && (
            <span className="inline-flex items-center gap-1">
              <Phone size={11} className="text-primary" /> {phone}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
