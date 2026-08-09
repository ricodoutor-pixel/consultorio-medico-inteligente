import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star, ArrowLeft, CheckCircle2, Stethoscope, CreditCard, MessageSquare, Video, ArrowRight, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { professionals as staticProfessionals } from "@/data/professionals";
import { useRealProfessionals } from "@/hooks/useRealProfessionals";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const objectives = ["Sono", "Dor crônica", "Ansiedade", "Epilepsia", "Bem-estar geral", "Cultivo legal", "Outro"];

const FalarComEspecialista = () => {
  const [searchParams] = useSearchParams();
  const proId = searchParams.get("pro");
  const { professionals } = useRealProfessionals();
  const pro = proId ? professionals.find((p) => p.id === proId) : null;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nomePaciente || !form.telefoneWhatsapp || !form.objetivo || !form.resumoCaso) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Erro", description: "Você precisa fazer login para continuar.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // real-id is used for real professionals in useRealProfessionals hook
      const doctorId = pro?.id.startsWith("real-") ? pro.id.replace("real-", "") : pro?.id;

      // Check for return visit within 90 days
      const { data: pastVisits } = await supabase
        .from("appointments")
        .select("id")
        .eq("patient_id", session.user.id)
        .eq("doctor_id", doctorId)
        .eq("payment_status", "paid")
        .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      const isReturn = pastVisits && pastVisits.length > 0;
      const price = isReturn ? 90 : (form.preferencia === "video" ? 150 : 100);
      
      const { data: appt, error: apptErr } = await supabase
        .from("appointments")
        .insert({
          patient_id: session.user.id,
          doctor_id: doctorId,
          type: form.preferencia,
          amount: price,
          notes: form.resumoCaso,
          status: "scheduled",
          payment_status: "pending",
          scheduled_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (apptErr) throw apptErr;

      // Call Mercado Pago webhook
      const { data: payData, error: payErr } = await supabase.functions.invoke("create-payment", {
        body: {
          appointmentId: appt.id,
          doctorName: pro?.name,
          patientEmail: form.email || session.user.email,
          description: isReturn ? `Retorno 90 dias - ${pro?.name}` : `Orientação Técnica ${form.preferencia === "video" ? "Vídeo" : "Chat"} - ${pro?.name}`
        }
      });

      if (payErr || !payData?.init_point) throw new Error("Erro ao gerar link de pagamento.");
      
      toast({ title: "Redirecionando...", description: "Você será levado ao Mercado Pago." });
      window.location.href = payData.init_point;
    } catch (err: any) {
      toast({ title: "Erro na solicitação", description: err.message || "Erro desconhecido.", variant: "destructive" });
      setLoading(false);
    }
  };

  if (!pro) {
    return (
      <div className="min-h-dvh bg-background">
        <Navbar />
        <section className="pt-24 pb-16 md:pt-32">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <Stethoscope size={48} className="text-primary mx-auto mb-6" />
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-4 tracking-tight">
              Falar com <span className="text-gradient-green">Especialista</span>
            </h1>
            <p className="text-muted-foreground mb-8 font-medium">
              Selecione um profissional na página de profissionais ou escolha "auto-match" para ser encaminhado automaticamente.
            </p>
            <Button className="font-black bg-primary text-primary-foreground rounded-2xl h-14 px-8" asChild>
              <Link to="/profissionais">Escolher Profissional <ArrowRight size={18} className="ml-2" /></Link>
            </Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/profissionais" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={16} /> Voltar para Profissionais
          </Link>

          <motion.div className="mb-8" initial="hidden" animate="visible" variants={fadeUp}>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground mb-3 tracking-tight">
              Falar com <span className="text-gradient-green">Especialista</span>
            </h1>
            <p className="text-muted-foreground text-lg font-medium">Preencha a pré-entrevista e pague via Pix ou PayPal para liberar o atendimento — supervisionado por IA de última geração 24×7.</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="border-border sticky top-24">
                <CardContent className="p-5">
                  <img src={pro.imageUrl} alt={`Ilustração - ${pro.name}`} className="w-16 h-16 rounded-2xl object-cover border border-border mb-3" />
                  <h2 className="font-display font-black text-foreground">{pro.name}</h2>
                  <p className="text-sm text-muted-foreground mb-2">{pro.category}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={14} className="text-primary fill-primary" />
                    <span className="text-sm font-black">{pro.rating}</span>
                    <span className="text-xs text-muted-foreground">• {pro.consults} consultas</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{pro.bio}</p>
                  <div className="border-t border-border pt-3">
                    <p className="text-xs text-muted-foreground mb-1">Valor da consulta</p>
                    <p className="text-2xl font-display font-black text-gradient-green">{pro.price}</p>
                  </div>

                  <div className="border-t border-border pt-4 mt-4 space-y-3">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">Como funciona</h3>
                      {[
                        { n: "1", text: "Preencha a pré-entrevista" },
                        { n: "2", text: "Pague via Pix ou PayPal" },
                        { n: "3", text: "Atendimento liberado automaticamente" },
                      ].map((s) => (
                      <div key={s.n} className="flex items-start gap-2">
                        <span className="step-number !w-6 !h-6 !rounded-lg !text-xs">{s.n}</span>
                        <span className="text-xs text-muted-foreground">{s.text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {step === "form" ? (
                <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                  <Card className="border-border">
                    <CardContent className="p-6">
                      <h2 className="text-lg font-display font-black text-foreground mb-5 flex items-center gap-2">
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
                          <Label htmlFor="resumoCaso">Resumo do caso (2-5 linhas) *</Label>
                          <Textarea id="resumoCaso" placeholder="Descreva brevemente sua situação, sintomas e o que busca..." rows={4} value={form.resumoCaso} onChange={(e) => handleChange("resumoCaso", e.target.value)} required />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full font-black bg-primary text-primary-foreground h-12 rounded-2xl">
                          {loading ? "Enviando..." : "Gerar Resumo"}
                        </Button>

                        <p className="text-xs text-muted-foreground text-center">
                          Após enviar, você será direcionado para o pagamento via Pix ou PayPal.
                        </p>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                  <Card className="border-border">
                    <CardContent className="p-6 text-center">
                      <CheckCircle2 size={48} className="text-primary mx-auto mb-4" />
                      <h2 className="text-xl font-display font-black text-foreground mb-2">Resumo Pronto!</h2>
                      <p className="text-muted-foreground mb-2">
                        Paciente: <strong>{form.nomePaciente}</strong> • Profissional: <strong>{pro.name}</strong>
                      </p>
                      <p className="text-muted-foreground mb-6">
                        Finalize o pagamento via Pix ou PayPal para liberar o atendimento.
                      </p>
                      <div className="bg-muted/30 border border-border rounded-2xl p-4 mb-4">
                        <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
                        <p className="text-3xl font-display font-black text-gradient-green">{pro.price}</p>
                      </div>

                      {/* Link copia e cola */}
                      <div className="mb-4">
                        <label className="text-xs font-bold text-muted-foreground mb-2 block">Link de pagamento (Copia e Cola)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={pro.paymentLink}
                            className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-xs text-foreground font-mono"
                          />
                          <Button variant="outline" size="sm" className="rounded-xl border-primary/30 text-primary" onClick={() => {
                            navigator.clipboard.writeText(pro.paymentLink);
                            toast({ title: "Link copiado!", description: "Cole no navegador para pagar." });
                          }}>
                            <Copy size={14} className="mr-1" /> Copiar
                          </Button>
                        </div>
                      </div>

                      <Button className="w-full font-black bg-primary text-primary-foreground h-12 text-lg rounded-2xl" asChild>
                        <a href={pro.paymentLink} target="_blank" rel="noopener noreferrer">
                          <CreditCard size={20} className="mr-2" /> Pagar Agora <ArrowRight size={18} className="ml-2" />
                        </a>
                      </Button>
                      <p className="text-xs text-muted-foreground mt-4">
                        Pagamento seguro via Mercado Pago ou PayPal. Atendimento liberado automaticamente.
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
