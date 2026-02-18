import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star, ArrowLeft, CheckCircle2, Stethoscope, CreditCard, MessageSquare, Video, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { professionals } from "@/data/professionals";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const objectives = ["Sono", "Dor crônica", "Ansiedade", "Epilepsia", "Bem-estar geral", "Outro"];

const FalarComEspecialista = () => {
  const [searchParams] = useSearchParams();
  const proId = searchParams.get("pro");
  const pro = professionals.find((p) => p.id === proId);
  const { toast } = useToast();

  const [step, setStep] = useState<"form" | "payment">("form");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nomePaciente: "",
    telefoneWhatsapp: "",
    email: "",
    objetivo: "",
    preferencia: "chat",
    resumoCaso: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nomePaciente || !form.telefoneWhatsapp || !form.objetivo || !form.resumoCaso) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("payment");
      toast({ title: "Pré-entrevista registrada!", description: "Agora finalize o pagamento via Pix." });
    }, 1200);
  };

  if (!pro) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <WhatsAppButton />
        <section className="pt-24 pb-16 md:pt-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-display font-bold text-foreground mb-4">Profissional não encontrado</h1>
            <p className="text-muted-foreground mb-6">Selecione um profissional na página de profissionais.</p>
            <Button asChild>
              <Link to="/profissionais">Ver Profissionais</Link>
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/profissionais" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={16} /> Voltar para Profissionais
          </Link>

          <motion.div className="text-center mb-8" initial="hidden" animate="visible" variants={fadeUp}>
            <Stethoscope size={40} className="text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-3">
              Falar com <span className="text-gradient-gold">Especialista</span>
            </h1>
            <p className="text-muted-foreground text-lg">Preencha a pré-entrevista e pague via Pix para liberar o atendimento</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Professional Card */}
            <div className="lg:col-span-1">
              <Card className="border-border sticky top-24">
                <CardContent className="p-5">
                  <img src={pro.imageUrl} alt={`Ilustração - ${pro.name}`} className="w-16 h-16 rounded-xl object-cover border border-border mb-3" />
                  <h2 className="font-display font-bold text-foreground">{pro.name}</h2>
                  <p className="text-sm text-muted-foreground mb-2">{pro.category}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={14} className="text-primary fill-primary" />
                    <span className="text-sm font-bold">{pro.rating}</span>
                    <span className="text-xs text-muted-foreground">• {pro.consults} consultas</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{pro.bio}</p>
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground mb-1">Valor da consulta</p>
                    <p className="text-2xl font-display font-bold text-gradient-gold">{pro.price}</p>
                  </div>

                  <div className="border-t border-border pt-4 mt-4 space-y-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Como funciona</h3>
                    {[
                      { n: "1", text: "Preencha a pré-entrevista" },
                      { n: "2", text: "Pague via Pix Mercado Pago" },
                      { n: "3", text: "Atendimento é liberado automaticamente" },
                    ].map((s) => (
                      <div key={s.n} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-md bg-gradient-green border border-green flex items-center justify-center text-[10px] font-bold text-secondary shrink-0">{s.n}</span>
                        <span className="text-xs text-muted-foreground">{s.text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form or Payment */}
            <div className="lg:col-span-2">
              {step === "form" ? (
                <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                  <Card className="border-border">
                    <CardContent className="p-6">
                      <h2 className="text-lg font-display font-bold text-foreground mb-5 flex items-center gap-2">
                        <MessageSquare size={18} /> Pré-entrevista
                      </h2>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="nomePaciente">Seu Nome *</Label>
                            <Input id="nomePaciente" placeholder="Nome completo" value={form.nomePaciente} onChange={(e) => handleChange("nomePaciente", e.target.value)} required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="telefoneWhatsapp">WhatsApp *</Label>
                            <Input id="telefoneWhatsapp" placeholder="(11) 99999-9999" value={form.telefoneWhatsapp} onChange={(e) => handleChange("telefoneWhatsapp", e.target.value)} required />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">E-mail (opcional)</Label>
                          <Input id="email" type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="objetivo">Objetivo principal *</Label>
                          <Select value={form.objetivo} onValueChange={(v) => handleChange("objetivo", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o objetivo" />
                            </SelectTrigger>
                            <SelectContent>
                              {objectives.map((obj) => (
                                <SelectItem key={obj} value={obj}>{obj}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Preferência de atendimento *</Label>
                          <RadioGroup value={form.preferencia} onValueChange={(v) => handleChange("preferencia", v)} className="flex gap-4">
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="chat" id="pref-chat" />
                              <Label htmlFor="pref-chat" className="flex items-center gap-1 cursor-pointer">
                                <MessageSquare size={14} /> Chat
                              </Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <RadioGroupItem value="video" id="pref-video" />
                              <Label htmlFor="pref-video" className="flex items-center gap-1 cursor-pointer">
                                <Video size={14} /> Vídeo
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="resumoCaso">Resumo do caso *</Label>
                          <Textarea id="resumoCaso" placeholder="Descreva brevemente sua situação, sintomas e o que busca..." rows={4} value={form.resumoCaso} onChange={(e) => handleChange("resumoCaso", e.target.value)} required />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground h-11">
                          {loading ? "Enviando..." : "Enviar Pré-entrevista"}
                        </Button>

                        <p className="text-xs text-muted-foreground text-center">
                          Após enviar, você será direcionado para o pagamento via Pix. O atendimento será liberado automaticamente após a confirmação.
                        </p>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                  <Card className="border-border">
                    <CardContent className="p-6 text-center">
                      <CheckCircle2 size={48} className="text-secondary mx-auto mb-4" />
                      <h2 className="text-xl font-display font-bold text-foreground mb-2">Pré-entrevista Registrada!</h2>
                      <p className="text-muted-foreground mb-2">
                        Paciente: <strong>{form.nomePaciente}</strong> • Profissional: <strong>{pro.name}</strong>
                      </p>
                      <p className="text-muted-foreground mb-6">
                        Agora finalize o pagamento para liberar o atendimento.
                      </p>
                      <div className="bg-muted/30 border border-border rounded-xl p-4 mb-6">
                        <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
                        <p className="text-3xl font-display font-bold text-gradient-gold">{pro.price}</p>
                      </div>
                      <Button className="w-full font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground h-12 text-lg" asChild>
                        <Link to={`/pay?type=intake&proId=${pro.id}&amount=${pro.priceValue}`}>
                          <CreditCard size={20} className="mr-2" /> Pagar via Pix <ArrowRight size={18} className="ml-2" />
                        </Link>
                      </Button>
                      <p className="text-xs text-muted-foreground mt-4">
                        Pagamento seguro via Pix Mercado Pago. Atendimento liberado automaticamente após confirmação.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FalarComEspecialista;
