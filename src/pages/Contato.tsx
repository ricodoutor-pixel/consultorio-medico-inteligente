import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, Clock, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { motion } from "framer-motion";
import { trackPixelEvent } from "@/hooks/useFacebookPixel";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const Contato = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `Olá! Meu nome é ${formData.name}.%0A%0AEmail: ${formData.email}%0ATelefone: ${formData.phone}%0A%0AMensagem: ${formData.message}`;
    window.open(`https://wa.me/5511991363154?text=${message}`, "_blank");
    trackPixelEvent("Lead", { content_name: "contact_form", content_category: "contato" }, {
      leadScore: 30,
      funnelStage: "intent",
      category: "conversion",
    });
    toast({ title: "Redirecionando para WhatsApp", description: "Você será direcionado para conversar conosco!" });
  };

  const contactInfo = [
    { icon: Phone, title: "WhatsApp", value: "(11) 99136-3154", href: "https://wa.me/5511991363154", color: "primary" },
    { icon: Mail, title: "Email", value: "contato@plantayraiz.com.br", href: "mailto:contato@plantayraiz.com.br", color: "secondary" },
    { icon: MapPin, title: "Localização", value: "São Paulo, SP", color: "primary" },
    { icon: Clock, title: "Atendimento", value: "Seg-Sex: 9h às 18h | Sáb: 9h às 13h", color: "secondary" },
  ];

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4">
          <motion.div className="text-center mb-16" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-4">
              Entre em <span className="text-gradient-green">Contato</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Estamos aqui para ajudar. Fale conosco por WhatsApp ou envie uma mensagem.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="space-y-4">
              {contactInfo.map((info, i) => (
                <Card key={i} className="border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl ${info.color === 'primary' ? 'bg-gradient-gold border-gold' : 'bg-gradient-green border-green'} border flex items-center justify-center shrink-0`}>
                      <info.icon size={20} className={info.color === 'primary' ? 'text-primary' : 'text-secondary'} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm mb-1">{info.title}</h3>
                      {info.href ? (
                        <a href={info.href} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{info.value}</a>
                      ) : (
                        <p className="text-sm text-muted-foreground">{info.value}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border">
              <CardContent className="p-8">
                <h2 className="text-xl font-display font-bold text-foreground mb-6">Envie uma Mensagem</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contato-nome" className="block text-xs font-bold text-muted-foreground mb-2">Nome</label>
                      <Input id="contato-nome" name="nome" required placeholder="Seu nome" className="bg-muted border-border" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor="contato-telefone" className="block text-xs font-bold text-muted-foreground mb-2">Telefone</label>
                      <Input id="contato-telefone" name="telefone" required type="tel" placeholder="(11) 99999-9999" className="bg-muted border-border" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="contato-email" className="block text-xs font-bold text-muted-foreground mb-2">Email</label>
                    <Input id="contato-email" name="email" required type="email" placeholder="seu@email.com" className="bg-muted border-border" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="contato-mensagem" className="block text-xs font-bold text-muted-foreground mb-2">Mensagem</label>
                    <Textarea id="contato-mensagem" name="mensagem" required placeholder="Como podemos ajudar?" rows={4} className="bg-muted border-border" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                    Enviar via WhatsApp <ArrowRight size={18} className="ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contato;
