import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const BRISA_PHONE = "5511991363154";
const BRISA_MSG = "Iniciar orientação agora";

export const BrisaOrientacaoRedirect = () => {
  useEffect(() => {
    const url = `https://wa.me/${BRISA_PHONE}?text=${encodeURIComponent(BRISA_MSG)}`;
    window.location.replace(url);
  }, []);

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center gap-4 p-6 text-center">
      <Loader2 size={40} className="animate-spin text-primary" />
      <h1 className="text-xl font-display font-black text-foreground">
        Conectando você à Enfª Brisa no WhatsApp...
      </h1>
      <p className="text-sm text-muted-foreground max-w-md">
        Se a janela do WhatsApp não abrir automaticamente,{" "}
        <a
          href={`https://wa.me/${BRISA_PHONE}?text=${encodeURIComponent(BRISA_MSG)}`}
          className="text-primary font-bold underline"
        >
          clique aqui
        </a>
        .
      </p>
    </div>
  );
};

export default BrisaOrientacaoRedirect;
