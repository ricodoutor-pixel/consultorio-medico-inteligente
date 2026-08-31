import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, ZoomIn, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageLightboxModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  description?: string;
}

export function ImageLightboxModal({
  open,
  onClose,
  imageUrl,
  title = "Visualização da Imagem",
  description = "Farmácia Planta y Raíz"
}: ImageLightboxModalProps) {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] p-2 sm:p-4 bg-card/95 backdrop-blur-xl border border-emerald-500/30 rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-border/40">
          <div>
            <DialogTitle className="text-sm sm:text-base font-display font-bold text-foreground flex items-center gap-2">
              <ZoomIn size={16} className="text-emerald-400" /> {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                {description}
              </DialogDescription>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-muted/40 hover:bg-muted text-foreground transition-all hover:scale-105"
            aria-label="Fechar visualizador de imagem"
          >
            <X size={18} />
          </button>
        </div>

        {/* Imagem em Alta Resolução */}
        <div className="relative flex-1 flex items-center justify-center p-2 sm:p-4 min-h-[300px] max-h-[70vh] overflow-hidden rounded-2xl bg-black/40 border border-border/30 my-2">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>

        {/* Footer com Ações */}
        <div className="flex items-center justify-between px-2 pt-1">
          <span className="text-[10px] sm:text-xs text-emerald-400 font-bold flex items-center gap-1">
            🌿 Planta y Raíz • Imagem Oficial Certificada
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 rounded-xl font-bold border-border/60"
              onClick={() => window.open(imageUrl, "_blank")}
            >
              <ExternalLink size={12} className="mr-1.5" /> Abrir Original
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 rounded-xl font-bold"
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
