import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, Users, BarChart3, FileText, Check, Loader2 } from "lucide-react";

export default function SaudeVerdeEmpresas() {
  const [form, setForm] = useState({
    company_name: "", cnpj: "", contact_name: "",
    contact_email: "", contact_phone: "", city: "", state: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.from("saude_verde_partner_requests" as never).insert({
      ...form, category: "empresa", country: "BR",
    } as never);
    setSending(false);
    if (error) { toast.error("Erro ao enviar. Tente novamente."); return; }
    toast.success("Recebemos seu pedido! A Brisa entrará em contato em breve.");
    setForm({ company_name: "", cnpj: "", contact_name: "", contact_email: "", contact_phone: "", city: "", state: "", message: "" });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Helmet>
        <title>Cartão Saúde Verde para empresas | Planta y Raiz</title>
        <meta name="description" content="Ofereça Cartão Saúde Verde para sua equipe a partir de R$29/funcionário/mês. Painel de RH, cobrança unificada, relatórios." />
        <link rel="canonical" href="https://plantayraiz.com.br/saude-verde/empresas" />
      </Helmet>

      <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-background border-b border-border/40">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <Building2 className="w-14 h-14 text-primary mx-auto mb-4" />
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Cartão Saúde Verde para empresas</h1>
          <p className="text-lg text-muted-foreground">
            Ofereça saúde para sua equipe por menos de <span className="text-primary font-bold">R$ 1,17/dia por pessoa</span>.
          </p>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {[
            { i: Users, t: "Painel de RH", d: "Cadastre, edite e remova funcionários em segundos." },
            { i: FileText, t: "Cobrança unificada", d: "Um único boleto/Pix mensal para toda a empresa." },
            { i: BarChart3, t: "Relatórios de uso", d: "Acompanhe agendamentos e economia gerada." },
            { i: Check, t: "Mínimo 5 funcionários", d: "Preço corporativo a partir de R$ 29/funcionário/mês." },
          ].map((b, i) => (
            <Card key={i} className="p-5 border-border/50">
              <b.i className="w-8 h-8 text-primary mb-2" />
              <div className="font-semibold mb-1">{b.t}</div>
              <div className="text-sm text-muted-foreground">{b.d}</div>
            </Card>
          ))}
        </div>

        <Card className="p-7 border-primary/30">
          <h2 className="text-2xl font-bold mb-1">Quero conhecer</h2>
          <p className="text-muted-foreground mb-6 text-sm">Preencha e a Brisa entra em contato em até 1 dia útil.</p>
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Label>Nome da empresa *</Label>
              <Input required value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
            <div><Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} /></div>
            <div><Label>Nome do contato *</Label>
              <Input required value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
            <div><Label>Email *</Label>
              <Input required type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
            <div><Label>WhatsApp *</Label>
              <Input required value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></div>
            <div><Label>Cidade</Label>
              <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>Estado</Label>
              <Input maxLength={2} value={form.state} onChange={e => setForm({ ...form, state: e.target.value.toUpperCase() })} /></div>
            <div className="sm:col-span-2"><Label>Nº de funcionários e mensagem</Label>
              <Textarea rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Ex: temos 50 funcionários em SP..." /></div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={sending} className="w-full bg-primary hover:bg-primary/90 h-12">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Solicitar contato"}
              </Button>
            </div>
          </form>
        </Card>

        <div className="text-center mt-10">
          <Button asChild variant="outline"><Link to="/saude-verde">← Voltar ao Cartão Saúde Verde</Link></Button>
        </div>
      </section>
    </div>
  );
}
