import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { trackPixelEvent } from "@/hooks/useFacebookPixel";
import { linkReferralOnSignup } from "@/hooks/useReferralTracking";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { validateCPF, validateCNPJ, formatCPF, formatCNPJ } from "@/lib/validators";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Stethoscope, Building2, Leaf, Users, CheckCircle2, ArrowRight, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

type UserType = "paciente" | "medico" | "profissional" | "farmacia" | "produtor" | null;

const userTypes = [
  { id: "paciente" as UserType, label: "Paciente / Usuário", icon: Users, desc: "Busco consulta ou tratamento", color: "green", dbType: "patient" },
  { id: "medico" as UserType, label: "Médico Prescritor", icon: Stethoscope, desc: "CRM ativo, prescrevo cannabis", color: "green", dbType: "doctor" },
  { id: "profissional" as UserType, label: "Profissional de Saúde", icon: UserPlus, desc: "Psicólogo, farmacêutico, TO, etc.", color: "purple", dbType: "professional" },
  { id: "farmacia" as UserType, label: "Farmácia / Loja", icon: Building2, desc: "CNPJ + autorização ANVISA", color: "purple", dbType: "pharmacy" },
  { id: "produtor" as UserType, label: "Produtor / Cultivador", icon: Leaf, desc: "Autorização judicial ou ANVISA", color: "gold", dbType: "producer" },
];

const Cadastro = () => {
  const [type, setType] = useState<UserType>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (key: string, value: string) => setFormData({ ...formData, [key]: value });

  const validateForm = (): boolean => {
    if (!type) return false;
    const email = formData.email || "";
    const nome = formData.nome || "";
    const senha = formData.senha || "";

    if (nome.length < 3 || nome.length > 100) {
      toast({ title: "Nome inválido", description: "O nome deve ter entre 3 e 100 caracteres.", variant: "destructive" });
      return false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "E-mail inválido", description: "Insira um e-mail válido.", variant: "destructive" });
      return false;
    }
    if (senha.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo de 6 caracteres.", variant: "destructive" });
      return false;
    }
    const telefone = formData.telefone || "";
    if (telefone && !/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(telefone.replace(/\s/g, ""))) {
      toast({ title: "Telefone inválido", description: "Insira um telefone válido.", variant: "destructive" });
      return false;
    }
    const cpf = formData.cpf || "";
    if (cpf && !validateCPF(cpf)) {
      toast({ title: "CPF inválido", description: "Insira um CPF válido.", variant: "destructive" });
      return false;
    }
    const cnpj = formData.cnpj || "";
    if (cnpj && !validateCNPJ(cnpj)) {
      toast({ title: "CNPJ inválido", description: "Insira um CNPJ válido.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    const selectedType = userTypes.find(u => u.id === type);
    const dbType = selectedType?.dbType || "patient";

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: formData.nome,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          toast({ title: "E-mail já cadastrado", description: "Tente fazer login ou use outro e-mail.", variant: "destructive" });
        } else {
          toast({ title: "Erro no cadastro", description: authError.message, variant: "destructive" });
        }
        setLoading(false);
        return;
      }

      // 2. Update profile with additional data
      if (authData.user) {
        await supabase.from("profiles").update({
          full_name: formData.nome,
          phone: formData.telefone || null,
          cpf: formData.cpf || null,
          user_type: dbType,
          date_of_birth: formData.dataNascimento || null,
        }).eq("id", authData.user.id);

        // 3. If doctor, create doctor record
        if (type === "medico" && formData.crm) {
          await supabase.from("doctors").insert({
            user_id: authData.user.id,
            crm: formData.crm,
            crm_state: formData.crmUf || "SP",
            rqe: formData.rqe || null,
            specialty: formData.especialidade || "Cannabis Medicinal",
            bio: formData.bio || null,
          });
        }
        // 4. Link referral (3-level MLM tree)
        await linkReferralOnSignup(authData.user.id);
      }

      trackPixelEvent("Lead", { content_name: "patient_signup", content_category: type }, {
        leadScore: 30, funnelStage: "intent", category: "conversion",
      });
      setSubmitted(true);
      toast({ title: "Cadastro realizado! ✅", description: "Verifique seu e-mail para confirmar a conta." });
    } catch (err) {
      toast({ title: "Erro", description: "Falha ao criar conta. Tente novamente.", variant: "destructive" });
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-32 pb-20 hero-glow">
          <div className="container mx-auto px-4 relative z-10 flex justify-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-md text-center">
              <CheckCircle2 size={64} className="text-primary mx-auto mb-6" />
              <h1 className="text-3xl font-display font-black text-foreground mb-4">Cadastro Realizado!</h1>
              <p className="text-muted-foreground mb-4">
                Enviamos um e-mail de confirmação para <span className="text-primary font-bold">{formData.email}</span>.
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Clique no link do e-mail para ativar sua conta. Depois, faça login para acessar a plataforma.
              </p>
                      <div className="flex flex-col gap-2 p-4 rounded-xl bg-gradient-green border border-green mb-6">
                <div className="flex items-center justify-center gap-2">
                  <Mail size={16} className="text-primary" />
                  <span className="text-sm font-bold text-foreground">Verifique sua caixa de entrada</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Dúvidas? Entre em contato: contato@plantayraiz.com.br ou (11) 99136-3154
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button className="font-black bg-primary text-primary-foreground rounded-2xl" asChild>
                  <Link to="/login">Fazer Login <ArrowRight size={16} className="ml-2" /></Link>
                </Button>
                <Button variant="outline" className="font-bold rounded-2xl" asChild>
                  <Link to="/">Voltar ao Início</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-12 md:pt-32 hero-glow">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-green border border-green flex items-center justify-center glow-green">
                <UserPlus size={24} className="text-primary" />
              </div>
              <span className="text-sm font-bold text-primary">CRIAR CONTA</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-4">
              Faça parte da <span className="text-gradient-green">Planta & Raiz</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl font-medium">
              Crie sua conta para acessar consultas, prontuários e toda a plataforma.{" "}
              <Link to="/login" className="text-primary font-bold hover:underline">Já tem conta? Faça login</Link>
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 pb-20">
        <div className="container mx-auto px-4">
          {/* Type Selection */}
          {!type && (
            <div className="max-w-3xl mx-auto">
              <div className="mb-6 max-w-md mx-auto">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full font-bold h-12 rounded-xl border-border"
                  onClick={async () => {
                    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                    if (result.error) {
                      toast({ title: "Erro com Google", description: "Não foi possível continuar com Google.", variant: "destructive" });
                      return;
                    }
                    if (result.redirected) return;
                    navigate("/dashboard");
                  }}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continuar com Google
                </Button>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider"><span className="bg-background px-2 text-muted-foreground">ou escolha seu perfil</span></div>
                </div>
              </div>

              <h3 className="font-display font-black text-foreground mb-6">Selecione seu perfil</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {userTypes.map((ut) => (
                  <Card
                    key={ut.id}
                    className="border-border hover:border-primary/30 cursor-pointer transition-all hover:-translate-y-1"
                    onClick={() => setType(ut.id)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                        ut.color === "green" ? "bg-gradient-green border border-green" :
                        ut.color === "purple" ? "bg-gradient-purple border border-purple" :
                        "bg-gradient-gold border border-gold"
                      }`}>
                        <ut.icon size={28} className={ut.color === "green" ? "text-primary" : ut.color === "purple" ? "text-secondary" : "text-[hsl(45,76%,52%)]"} />
                      </div>
                      <h4 className="font-display font-black text-foreground mb-1">{ut.label}</h4>
                      <p className="text-xs text-muted-foreground">{ut.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          {type && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl mx-auto">
              <button onClick={() => setType(null)} className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
                ← Trocar perfil
              </button>

              <Card className="border-border">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Common fields */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">Nome completo *</Label>
                        <Input value={formData.nome || ""} onChange={(e) => handleChange("nome", e.target.value)} placeholder="Seu nome" className="bg-muted border-border" required />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">E-mail *</Label>
                        <Input type="email" value={formData.email || ""} onChange={(e) => handleChange("email", e.target.value)} placeholder="seu@email.com" className="bg-muted border-border" required />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">Senha *</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={formData.senha || ""}
                            onChange={(e) => handleChange("senha", e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="bg-muted border-border pr-10"
                            required
                            minLength={6}
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">Telefone</Label>
                        <Input value={formData.telefone || ""} onChange={(e) => handleChange("telefone", e.target.value)} placeholder="(11) 99999-9999" className="bg-muted border-border" />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">CPF</Label>
                        <Input value={formData.cpf || ""} onChange={(e) => handleChange("cpf", formatCPF(e.target.value))} placeholder="000.000.000-00" className="bg-muted border-border" />
                      </div>
                      <div>
                        <Label className="text-xs font-bold text-muted-foreground">Data de Nascimento</Label>
                        <Input type="date" value={formData.dataNascimento || ""} onChange={(e) => handleChange("dataNascimento", e.target.value)} className="bg-muted border-border" />
                      </div>
                    </div>

                    {/* Doctor-specific fields */}
                    {type === "medico" && (
                      <>
                        <div className="grid sm:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs font-bold text-muted-foreground">CRM *</Label>
                            <Input value={formData.crm || ""} onChange={(e) => handleChange("crm", e.target.value)} placeholder="123456" className="bg-muted border-border" required />
                          </div>
                          <div>
                            <Label className="text-xs font-bold text-muted-foreground">UF do CRM</Label>
                            <Select value={formData.crmUf || "SP"} onValueChange={(v) => handleChange("crmUf", v)}>
                              <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"].map(uf => (
                                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs font-bold text-muted-foreground">RQE</Label>
                            <Input value={formData.rqe || ""} onChange={(e) => handleChange("rqe", e.target.value)} placeholder="Opcional" className="bg-muted border-border" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-muted-foreground">Especialidade</Label>
                          <Input value={formData.especialidade || ""} onChange={(e) => handleChange("especialidade", e.target.value)} placeholder="Ex: Cannabis Medicinal, Neurologia..." className="bg-muted border-border" />
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-muted-foreground">Bio</Label>
                          <Textarea value={formData.bio || ""} onChange={(e) => handleChange("bio", e.target.value)} placeholder="Breve descrição profissional..." className="bg-muted border-border" rows={3} />
                        </div>
                      </>
                    )}

                    {/* Pharmacy fields */}
                    {type === "farmacia" && (
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs font-bold text-muted-foreground">CNPJ *</Label>
                          <Input value={formData.cnpj || ""} onChange={(e) => handleChange("cnpj", formatCNPJ(e.target.value))} placeholder="00.000.000/0000-00" className="bg-muted border-border" required />
                        </div>
                        <div>
                          <Label className="text-xs font-bold text-muted-foreground">Autorização ANVISA</Label>
                          <Input value={formData.anvisaAuth || ""} onChange={(e) => handleChange("anvisaAuth", e.target.value)} placeholder="Número da autorização" className="bg-muted border-border" />
                        </div>
                      </div>
                    )}

                    <Button type="submit" className="w-full bg-primary text-primary-foreground font-black rounded-2xl h-12" disabled={loading}>
                      {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <UserPlus size={16} className="mr-2" />}
                      Criar Conta
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      Já tem uma conta?{" "}
                      <Link to="/login" className="text-primary font-bold hover:underline">Fazer login</Link>
                    </p>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Cadastro;
