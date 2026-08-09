import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Stethoscope, Loader2, TrendingUp, Wallet, ShieldCheck, LayoutDashboard } from "lucide-react";

export default function SaudeVerdeParceiros() {
  const [form, setForm] = useState({
    company_name: "", cnpj: "", contact_name: "", contact_email: "",
    contact_phone: "", category: "clinica", city: "", state: "", message: "",
  });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.from("saude_verde_partner_requests" as never).insert({
      ...form, country: "BR",
    } as never);
    setSending(false);
    if (error) { toast.error("Erro ao enviar"); return; }
    toast.success("Recebemos sua solicitação! Em breve nossa equipe entra em contato.");
    setForm({ company_name: "", cnpj: "", contact_name: "", contact_email: "", contact_phone: "", category: "clinica", city: "", state: "", message: "" });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Helmet>
        <title>Seja parceiro Cartão Saúde Verde | Planta y Raiz</title>
        <meta name="description" content="Credencie sua clínica ou laboratório no Cartão Saúde Verde. Sem mensalidade nos primeiros 3 meses." />
        <link rel="canonical" href="https://plantayraiz.com.br/saude-verde/seja-parceiro" />
      </Helmet>

      <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-background border-b border-border/40">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <Stethoscope className="w-14 h-14 text-primary mx-auto mb-4" />
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Seja parceiro da rede Saúde Verde</h1>
          <p className="text-lg text-muted-foreground">Atenda milhares de assinantes ativos. Pagamento garantido. Sem mensalidade nos primeiros 3 meses.</p>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {[
            { i: TrendingUp, t: "Exposição garantida", d: "Apareça para milhares de assinantes ativos na sua região." },
            { i: Wallet, t: "Pagamento garantido", d: "Paciente paga pelo app, você recebe direto." },
            { i: ShieldCheck, t: "Sem mensalidade inicial", d: "3 primeiros meses 100% gratuitos para você." },
            { i: LayoutDashboard, t: "Painel de gestão", d: "Agendamentos, histórico e relatórios em tempo real." },
          ].map((b, i) => (
            <Card key={i} className="p-5 border-border/50">
              <b.i className="w-8 h-8 text-primary mb-2" />
              <div className="font-semibold mb-1">{b.t}</div>
              <div className="text-sm text-muted-foreground">{b.d}</div>
            </Card>
          ))}
        </div>

        <Card className="p-7 border-primary/30">
          <h2 className="text-2xl font-bold mb-1">Solicitar credenciamento</h2>
          <p className="text-muted-foreground mb-6 text-sm">Preencha e nossa equipe entra em contato em até 2 dias úteis.</p>
          <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><Label>Nome do estabelecimento *</Label>
              <Input required value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
            <div><Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} /></div>
            <div><Label>Categoria *</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinica">Clínica médica</SelectItem>
                  <SelectItem value="laboratorio">Laboratório</SelectItem>
                  <SelectItem value="farmacia">Farmácia</SelectItem>
                  <SelectItem value="odontologia">Odontologia</SelectItem>
                  <SelectItem value="terapia">Terapias</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Responsável *</Label>
              <Input required value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
            <div><Label>Email *</Label>
              <Input required type="email" value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} /></div>
            <div><Label>WhatsApp *</Label>
              <Input required value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} /></div>
            <div><Label>Cidade</Label>
              <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>Estado</Label>
              <Input maxLength={2} value={form.state} onChange={e => setForm({ ...form, state: e.target.value.toUpperCase() })} /></div>
            <div className="sm:col-span-2"><Label>Especialidades atendidas / observações</Label>
              <Textarea rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Ex: clínica geral, ortopedia, ginecologia..." /></div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={sending} className="w-full bg-primary hover:bg-primary/90 h-12">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Solicitar credenciamento"}
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
