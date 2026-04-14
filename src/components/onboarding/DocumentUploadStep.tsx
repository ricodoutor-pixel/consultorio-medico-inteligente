import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileCheck2, AlertTriangle, Loader2, X, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: "validating" | "valid" | "invalid";
  error?: string;
  url?: string;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const REQUIRED_DOCS = ["Documento de Identidade (RG/CNH)", "Comprovante de Residência"];

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "Formato não aceito. Use PDF, JPG ou PNG." };
  }
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "Arquivo maior que 10MB." };
  }
  if (file.size < 1024) {
    return { valid: false, error: "Arquivo muito pequeno. Pode estar corrompido." };
  }
  // Basic header check for PDF
  if (file.type === "application/pdf" && file.name && !file.name.toLowerCase().endsWith(".pdf")) {
    return { valid: false, error: "Extensão não corresponde ao tipo do arquivo." };
  }
  return { valid: true };
}

interface DocumentUploadStepProps {
  userId: string;
  onComplete: () => void;
}

export function DocumentUploadStep({ userId, onComplete }: DocumentUploadStepProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;

    for (const file of Array.from(selected)) {
      const validation = validateFile(file);

      const newFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        status: "validating",
      };

      setFiles((prev) => [...prev, newFile]);

      if (!validation.valid) {
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: "invalid", error: validation.error } : f
          )
        );
        continue;
      }

      // Upload to storage
      try {
        setUploading(true);
        const path = `onboarding/${userId}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage
          .from("experience-images")
          .upload(path, file, { upsert: true });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("experience-images")
          .getPublicUrl(path);

        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: "valid", url: urlData.publicUrl } : f
          )
        );
        toast.success(`${file.name} enviado com sucesso!`);
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: "invalid", error: "Falha no upload." } : f
          )
        );
      } finally {
        setUploading(false);
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const validCount = files.filter((f) => f.status === "valid").length;
  const canProceed = validCount >= 1;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Shield className="mx-auto text-primary mb-2" size={32} />
        <h3 className="text-lg font-display font-black text-foreground">
          Verificação de Documentos
        </h3>
        <p className="text-xs text-muted-foreground">
          Envie seus documentos para validação automática. Formatos aceitos: PDF, JPG, PNG (máx 10MB).
        </p>
      </div>

      <div className="space-y-2">
        {REQUIRED_DOCS.map((doc, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${validCount > i ? "bg-primary border-primary" : "border-border"}`}>
              {validCount > i && <FileCheck2 size={10} className="text-primary-foreground" />}
            </div>
            {doc}
          </div>
        ))}
      </div>

      {/* Upload Area */}
      <Card
        className="border-dashed border-2 border-border hover:border-primary/40 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <CardContent className="p-6 text-center">
          <Upload className="mx-auto text-muted-foreground mb-2" size={24} />
          <p className="text-sm font-medium text-foreground">Clique para selecionar arquivos</p>
          <p className="text-[10px] text-muted-foreground">ou arraste e solte aqui</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </CardContent>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.name} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
              {file.status === "validating" && <Loader2 size={16} className="animate-spin text-primary" />}
              {file.status === "valid" && <FileCheck2 size={16} className="text-green-500" />}
              {file.status === "invalid" && <AlertTriangle size={16} className="text-destructive" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                {file.error && <p className="text-[10px] text-destructive">{file.error}</p>}
                {file.status === "valid" && (
                  <p className="text-[10px] text-green-500">✓ Validado ({(file.size / 1024).toFixed(0)} KB)</p>
                )}
              </div>
              <button onClick={() => removeFile(file.name)} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        className="w-full rounded-xl font-bold"
        disabled={!canProceed || uploading}
        onClick={onComplete}
      >
        {uploading ? (
          <><Loader2 size={14} className="animate-spin mr-2" /> Enviando...</>
        ) : canProceed ? (
          "Continuar →"
        ) : (
          "Envie ao menos 1 documento"
        )}
      </Button>
    </div>
  );
}
