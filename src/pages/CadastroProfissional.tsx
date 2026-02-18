import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Upload, UserPlus, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@/data/professionals";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const CadastroProfissional = () => {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nomeCompleto: "",
    email: "",
    telefone: "",
    categoria: "",
    valorCobrado: "",
    resumoAtuacao: "",
    registroProfissional: "",
    cidadeUF: "",
  });
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nomeCompleto || !form.email || !form.telefone || !form.categoria || !form.valorCobrado || !form.resumoAtuacao) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast({ title: "Cadastro enviado!", description: "Sua solicitação será analisada pela equipe." });
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <WhatsAppButton />
        <section className="pt-24 pb-16 md:pt-32">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <CheckCircle2 size={64} className="text-secondary mx-auto mb-6" />
              <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
                Cadastro <span className="text-gradient-gold">Enviado!</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-2">
                Seu cadastro foi recebido com status <strong className="text-primary">PENDENTE DE VERIFICAÇÃO</strong>.
              </p>
              <p className="text-muted-foreground mb-8">
                Nossa equipe irá analisar seus dados e documentos. Você receberá uma notificação por e-mail e WhatsApp assim que for aprovado.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button className="font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground" asChild>
                  <a href="/profissionais">Ver Profissionais <ArrowRight size={16} className="ml-2" /></a>
                </Button>
                <Button variant="outline" className="font-bold border-border" asChild>
                  <a href="https://wa.me/5511987131241?text=Olá!%20Enviei%20meu%20cadastro%20de%20profissional" target="_blank" rel="noopener noreferrer">
                    Falar com Suporte
                  </a>
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
      <WhatsAppButton />

      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div className="text-center mb-10" initial="hidden" animate="visible" variants={fadeUp}>
            <UserPlus size={40} className="text-primary mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              Cadastro de <span className="text-gradient-gold">Profissional</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Atenda pacientes de todo o Brasil com preços populares. Preencha o formulário abaixo e aguarde a verificação.
            </p>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <Card className="border-border">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                      <Input id="nomeCompleto" placeholder="Seu nome completo" value={form.nomeCompleto} onChange={(e) => handleChange("nomeCompleto", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input id="email" type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => handleChange("email", e.target.value)} required />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone / WhatsApp *</Label>
                      <Input id="telefone" placeholder="(11) 98713-1241" value={form.telefone} onChange={(e) => handleChange("telefone", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria *</Label>
                      <Select value={form.categoria} onValueChange={(v) => handleChange("categoria", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="valorCobrado">Valor por Consulta (R$) *</Label>
                      <Input id="valorCobrado" type="number" min="0" step="0.01" placeholder="120.00" value={form.valorCobrado} onChange={(e) => handleChange("valorCobrado", e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registroProfissional">Registro Profissional (CRM/CRF/CREFITO)</Label>
                      <Input id="registroProfissional" placeholder="Opcional" value={form.registroProfissional} onChange={(e) => handleChange("registroProfissional", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cidadeUF">Cidade / UF</Label>
                    <Input id="cidadeUF" placeholder="São Paulo / SP (opcional)" value={form.cidadeUF} onChange={(e) => handleChange("cidadeUF", e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="resumoAtuacao">Resumo de Atuação (bio) *</Label>
                    <Textarea id="resumoAtuacao" placeholder="Descreva sua experiência, especialidades e abordagem..." rows={4} value={form.resumoAtuacao} onChange={(e) => handleChange("resumoAtuacao", e.target.value)} required />
                  </div>

                  <div className="space-y-2">
                    <Label>Foto de Perfil</Label>
                    <div className="flex items-center gap-4">
                      {fotoPreview ? (
                        <img src={fotoPreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-border" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                          <Upload size={20} className="text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <Input id="foto" type="file" accept="image/*" onChange={handleFoto} className="max-w-[250px]" />
                        <p className="text-xs text-muted-foreground mt-1">JPG ou PNG, até 2MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={loading} className="w-full font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-lg h-12">
                      {loading ? "Enviando..." : "Enviar Cadastro"}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Ao enviar, você concorda com os Termos de Uso e Política de Privacidade. Seu cadastro será analisado pela equipe administrativa.
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CadastroProfissional;
