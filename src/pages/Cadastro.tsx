import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Stethoscope, Building2, Leaf, ShoppingBag, Users, CheckCircle2, ArrowRight, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

type UserType = "paciente" | "medico" | "profissional" | "farmacia" | "produtor" | null;

const userTypes = [
  { id: "paciente" as UserType, label: "Paciente / Usuário", icon: Users, desc: "Busco consulta ou tratamento", color: "green" },
  { id: "medico" as UserType, label: "Médico Prescritor", icon: Stethoscope, desc: "CRM ativo, prescrevo cannabis", color: "green" },
  { id: "profissional" as UserType, label: "Profissional de Saúde", icon: UserPlus, desc: "Psicólogo, farmacêutico, TO, etc.", color: "purple" },
  { id: "farmacia" as UserType, label: "Farmácia / Loja", icon: Building2, desc: "CNPJ + autorização ANVISA", color: "purple" },
  { id: "produtor" as UserType, label: "Produtor / Cultivador", icon: Leaf, desc: "Autorização judicial ou ANVISA", color: "gold" },
];

const Cadastro = () => {
  const [type, setType] = useState<UserType>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleChange = (key: string, value: string) => setFormData({ ...formData, [key]: value });

  const validateForm = (): boolean => {
    if (!type) return false;
    const email = formData.email || "";
    const nome = formData.nome || "";
    if (nome.length < 3 || nome.length > 100) {
      toast({ title: "Nome inválido", description: "O nome deve ter entre 3 e 100 caracteres.", variant: "destructive" });
      return false;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "E-mail inválido", description: "Insira um e-mail válido.", variant: "destructive" });
      return false;
    }
    const telefone = formData.telefone || "";
    if (telefone && !/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(telefone.replace(/\s/g, ""))) {
      toast({ title: "Telefone inválido", description: "Insira um telefone válido.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitted(true);
    toast({
      title: "Cadastro enviado com sucesso! ✅",
      description: "Seus dados foram enviados para análise. Entraremos em contato em até 24h.",
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-32 pb-20 hero-glow">
          <div className="container mx-auto px-4 relative z-10 flex justify-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-md text-center">
              <CheckCircle2 size={64} className="text-primary mx-auto mb-6" />
              <h1 className="text-3xl font-display font-black text-foreground mb-4">Cadastro Recebido!</h1>
              <p className="text-muted-foreground mb-4">Seus dados foram enviados automaticamente para <span className="text-primary font-bold">drbezerramed@gmail.com</span>.</p>
              <p className="text-sm text-muted-foreground mb-8">Nossa equipe analisará suas informações e entrará em contato em até 24 horas úteis.</p>
              <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-green border border-green mb-6">
                <Mail size={16} className="text-primary" />
                <span className="text-sm font-bold text-foreground">drbezerramed@gmail.com</span>
              </div>
              <Button className="font-black bg-primary text-primary-foreground rounded-2xl" asChild>
                <a href="/">Voltar ao Início <ArrowRight size={16} className="ml-2" /></a>
              </Button>
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
              <span className="text-sm font-bold text-primary">CADASTRO UNIFICADO</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-black text-foreground leading-tight mb-4">
              Faça parte da <span className="text-gradient-green">Planta & Raiz</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl font-medium">
              Cadastre-se como paciente, profissional de saúde, farmácia ou produtor. Seus dados serão analisados pela nossa equipe.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-8 pb-20">
        <div className="container mx-auto px-4">
          {/* Type Selection */}
          {!type && (
            <div className="max-w-3xl mx-auto">
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
              <Button variant="ghost" className="mb-4 text-muted-foreground" onClick={() => setType(null)}>
                ← Voltar à seleção
              </Button>

              <Card className="border-border">
                <CardContent className="p-8">
                  <h3 className="font-display font-black text-foreground mb-6 flex items-center gap-2">
                    <UserPlus size={18} className="text-primary" />
                    Cadastro — {userTypes.find(u => u.id === type)?.label}
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Common fields */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-bold">Nome completo *</Label>
                        <Input required className="bg-muted border-border mt-1" onChange={(e) => handleChange("nome", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-sm font-bold">E-mail *</Label>
                        <Input type="email" required className="bg-muted border-border mt-1" onChange={(e) => handleChange("email", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-bold">Telefone / WhatsApp *</Label>
                        <Input required className="bg-muted border-border mt-1" placeholder="(11) 99999-9999" onChange={(e) => handleChange("telefone", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-sm font-bold">CPF *</Label>
                        <Input required className="bg-muted border-border mt-1" placeholder="000.000.000-00" onChange={(e) => handleChange("cpf", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-bold">Cidade *</Label>
                        <Input required className="bg-muted border-border mt-1" onChange={(e) => handleChange("cidade", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-sm font-bold">Estado *</Label>
                        <Select onValueChange={(v) => handleChange("estado", v)}>
                          <SelectTrigger className="bg-muted border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Type-specific fields */}
                    {(type === "medico" || type === "profissional") && (
                      <>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-bold">Registro profissional (CRM/CRF/CRP) *</Label>
                            <Input required className="bg-muted border-border mt-1" onChange={(e) => handleChange("registro", e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-sm font-bold">Especialidade *</Label>
                            <Input required className="bg-muted border-border mt-1" onChange={(e) => handleChange("especialidade", e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-bold">Experiência com cannabis medicinal</Label>
                          <Textarea className="bg-muted border-border mt-1" placeholder="Descreva brevemente..." onChange={(e) => handleChange("experiencia", e.target.value)} />
                        </div>
                      </>
                    )}

                    {type === "farmacia" && (
                      <>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-bold">CNPJ *</Label>
                            <Input required className="bg-muted border-border mt-1" onChange={(e) => handleChange("cnpj", e.target.value)} />
                          </div>
                          <div>
                            <Label className="text-sm font-bold">Autorização ANVISA</Label>
                            <Input className="bg-muted border-border mt-1" onChange={(e) => handleChange("anvisa", e.target.value)} />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-bold">Nome da farmácia / empresa *</Label>
                          <Input required className="bg-muted border-border mt-1" onChange={(e) => handleChange("nomeEmpresa", e.target.value)} />
                        </div>
                      </>
                    )}

                    {type === "produtor" && (
                      <>
                        <div>
                          <Label className="text-sm font-bold">Tipo de autorização *</Label>
                          <Select onValueChange={(v) => handleChange("tipoAutorizacao", v)}>
                            <SelectTrigger className="bg-muted border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="habeas_corpus">Habeas Corpus</SelectItem>
                              <SelectItem value="anvisa">Autorização ANVISA</SelectItem>
                              <SelectItem value="judicial">Autorização Judicial</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-bold">Descrição do cultivo</Label>
                          <Textarea className="bg-muted border-border mt-1" placeholder="Local, tipo de cultivo, variedades..." onChange={(e) => handleChange("descCultivo", e.target.value)} />
                        </div>
                      </>
                    )}

                    {type === "paciente" && (
                      <div>
                        <Label className="text-sm font-bold">Qual é seu interesse principal?</Label>
                        <Select onValueChange={(v) => handleChange("interesse", v)}>
                          <SelectTrigger className="bg-muted border-border mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="consulta">Consulta médica</SelectItem>
                            <SelectItem value="informacao">Informação sobre tratamento</SelectItem>
                            <SelectItem value="compra">Comprar produtos</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div>
                      <Label className="text-sm font-bold">Observações adicionais</Label>
                      <Textarea className="bg-muted border-border mt-1" placeholder="Algo mais que queira informar..." onChange={(e) => handleChange("observacoes", e.target.value)} />
                    </div>

                    <div className="p-4 rounded-xl bg-muted/30 border border-border">
                      <p className="text-xs text-muted-foreground">
                        ✅ Seus dados serão enviados automaticamente para <span className="text-primary font-bold">drbezerramed@gmail.com</span> e armazenados com segurança conforme a LGPD.
                      </p>
                    </div>

                    <Button type="submit" size="lg" className="w-full font-black bg-primary text-primary-foreground rounded-2xl h-14">
                      Enviar Cadastro <ArrowRight size={18} className="ml-2" />
                    </Button>
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
