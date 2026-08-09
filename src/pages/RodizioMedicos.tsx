import { useState, useEffect } from "react";
import { professionals, Professional } from "@/data/professionals";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserCheck, Clock, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

export const RodizioMedicos = () => {
  const navigate = useNavigate();
  const [currentDoctor, setCurrentDoctor] = useState<Professional | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const onlineDoctors = professionals.filter(p => p.category === "Médicos Prescritores" && p.online);

  useEffect(() => {
    if (onlineDoctors.length === 0) return;
    
    // Initial random doctor
    const randomIndex = Math.floor(Math.random() * onlineDoctors.length);
    setCurrentDoctor(onlineDoctors[randomIndex]);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Rotate to next doctor
          setCurrentDoctor((curr) => {
            const currentIndex = onlineDoctors.findIndex(p => p.id === curr?.id);
            const nextIndex = (currentIndex + 1) % onlineDoctors.length;
            return onlineDoctors[nextIndex];
          });
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSelect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      window.location.href = `https://wa.me/5511991363154?text=${encodeURIComponent("Iniciar orientação agora")}`;
    } else {
      navigate(`/login?redirect=${encodeURIComponent("/brisa-orientacao")}`);
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="pt-32 pb-16 container mx-auto px-4 max-w-2xl text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-6">
            <Clock size={16} className="animate-pulse" />
            RODÍZIO DE MÉDICOS ONLINE (30s)
          </div>
          
          <h1 className="text-3xl md:text-4xl font-display font-black text-foreground mb-4">
            Conectando com o Próximo Especialista Disponível
          </h1>
          <p className="text-muted-foreground mb-12">
            Nosso sistema de rodízio garante que você seja atendido pelo médico com maior disponibilidade imediata para sua **Orientação Técnica**.
          </p>

          <AnimatePresence mode="wait">
            {currentDoctor ? (
              <motion.div
                key={currentDoctor.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-primary/30 bg-card shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-muted">
                    <motion.div 
                      className="h-full bg-primary"
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 30, ease: "linear" }}
                      key={currentDoctor.id + "-timer"}
                    />
                  </div>
                  
                  <CardContent className="p-8">
                    <div className="relative w-32 h-32 mx-auto mb-6">
                      <img 
                        src={currentDoctor.imageUrl} 
                        alt={currentDoctor.name} 
                        className="w-full h-full object-cover rounded-3xl border-4 border-background shadow-xl"
                      />
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-background flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                      </div>
                    </div>

                    <h2 className="text-2xl font-display font-black text-foreground mb-1">{currentDoctor.name}</h2>
                    <p className="text-primary font-bold text-sm mb-4 uppercase tracking-widest">{currentDoctor.category}</p>
                    
                    <div className="flex justify-center gap-4 mb-8">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase font-bold">Avaliação</p>
                        <p className="font-black text-foreground">⭐ {currentDoctor.rating}</p>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground uppercase font-bold">Experiência</p>
                        <p className="font-black text-foreground">{currentDoctor.experience}</p>
                      </div>
                    </div>

                    <button 
                      onClick={handleSelect}
                      className="w-full py-4 bg-primary text-primary-foreground font-black rounded-2xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                    >
                      <UserCheck size={20} />
                      INICIAR ORIENTAÇÃO COM ESTE MÉDICO
                    </button>
                    
                    <p className="mt-4 text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                      <ShieldCheck size={12} /> CRM Verificado & Proteção de Dados LGPD
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <div className="py-20">
                <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Buscando médicos online...</p>
              </div>
            )}
          </AnimatePresence>

          <div className="mt-12 grid grid-cols-3 gap-4 opacity-50 grayscale">
            {onlineDoctors.slice(0, 3).map(doc => (
              <div key={doc.id} className="flex flex-col items-center">
                <img src={doc.imageUrl} className="w-12 h-12 rounded-full mb-2" />
                <p className="text-[10px] font-bold truncate w-full">{doc.name}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
      <Footer />
    </div>
  );
};

export default RodizioMedicos;
