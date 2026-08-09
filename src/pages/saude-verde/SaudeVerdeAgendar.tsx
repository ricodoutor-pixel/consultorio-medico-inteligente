import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarCheck, Loader2, Check, ArrowRight, ArrowLeft } from "lucide-react";

type Specialty = { id: string; name: string; slug: string; category: string; price_from_brl: number | null };
type Partner = { id: string; name: string; city: string; state: string; rating: number; discount_pct_max: number };

const TIMES = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

export default function SaudeVerdeAgendar() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetPartner = params.get("partner");

  const [step, setStep] = useState(1);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [specialty, setSpecialty] = useState<Specialty | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasSub, setHasSub] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setHasSub(false); return; }
      const { data: sub } = await supabase
        .from("saude_verde_subscriptions" as never)
        .select("id, status").eq("user_id", user.id).eq("status", "active").maybeSingle();
      setHasSub(!!sub);
    })();
    supabase.from("saude_verde_specialties" as never)
      .select("*").order("sort_order")
      .then(({ data }) => setSpecialties((data as unknown as Specialty[]) || []));
  }, []);

  useEffect(() => {
    if (!specialty) return;
    let q = supabase.from("saude_verde_partners_public" as never)
      .select("id, name, city, state, rating, discount_pct_max")
      .eq("is_active", true).order("rating", { ascending: false }).limit(20);
    if (specialty.category === "consulta") q = q.eq("category", "clinica");
    else if (specialty.category === "exame") q = q.eq("category", "laboratorio");
    else q = q.eq("category", specialty.category);
    q.then(({ data }) => {
      const list = (data as unknown as Partner[]) || [];
      setPartners(list);
      if (presetPartner) {
        const m = list.find(p => p.id === presetPartner);
        if (m) { setPartner(m); setStep(3); }
      }
    });
  }, [specialty, presetPartner]);

  const finalPrice = specialty && partner
    ? Number(specialty.price_from_brl || 100) * (1 - partner.discount_pct_max / 100)
    : 0;
  const original = Number(specialty?.price_from_brl || 100);

  const submit = async () => {
    if (!specialty || !partner || !date || !time) {
      toast.error("Preencha todos os campos");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("saude-verde-book", {
        body: {
          partnerId: partner.id,
          specialtyId: specialty.id,
          date, time, beneficiaryName, notes,
          appointmentType: specialty.category,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Falha ao agendar");
      toast.success(`Agendado! Economia de R$ ${data.savings.toFixed(2)}`);
      navigate("/saude-verde/cartao");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao agendar");
    } finally {
      setSubmitting(false);
    }
  };

  if (hasSub === false) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-6">
        <Card className="p-8 max-w-md text-center">
          <CalendarCheck className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Cartão necessário</h2>
          <p className="text-muted-foreground mb-5">Para agendar com desconto, você precisa de um Cartão Saúde Verde ativo.</p>
          <Button asChild className="bg-primary hover:bg-primary/90"><Link to="/saude-verde/cartao">Ativar meu cartão</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground py-12">
      <Helmet><title>Agendar serviço — Cartão Saúde Verde</title></Helmet>
      <div className="container mx-auto px-4 max-w-3xl">
        <Link to="/saude-verde/cartao" className="text-sm text-muted-foreground hover:text-primary mb-6 inline-block">← Voltar</Link>
        <h1 className="text-3xl font-bold mb-2">Agendar serviço</h1>
        <p className="text-muted-foreground mb-8">Etapa {step} de 4</p>

        {step === 1 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">1. Selecione o serviço</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {specialties.map(s => (
                <button key={s.id} onClick={() => { setSpecialty(s); setStep(2); }}
                  className={`text-left p-4 rounded-lg border transition-colors ${specialty?.id === s.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/40"}`}>
                  <div className="font-semibold text-sm">{s.name}</div>
                  <Badge variant="outline" className="text-[10px] mt-1 capitalize">{s.category}</Badge>
                  {s.price_from_brl && <div className="text-xs text-muted-foreground mt-2">a partir de R$ {Number(s.price_from_brl).toFixed(2)}</div>}
                </button>
              ))}
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">2. Escolha o parceiro</h2>
            {partners.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">Nenhum parceiro disponível ainda para esta especialidade. Em breve!</p>
            ) : (
              <div className="space-y-2">
                {partners.map(p => (
                  <button key={p.id} onClick={() => { setPartner(p); setStep(3); }}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${partner?.id === p.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/40"}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.city}, {p.state} · ⭐ {Number(p.rating).toFixed(1)}</div>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/30">{p.discount_pct_max}% OFF</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-6"><Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button></div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">3. Data, horário e dados</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Data</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <Label>Horário</Label>
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {TIMES.map(t => (
                    <button key={t} onClick={() => setTime(t)}
                      className={`py-2 text-sm rounded border ${time === t ? "border-primary bg-primary/10 text-primary" : "border-border/50 hover:border-primary/40"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label>Beneficiário (opcional — deixe em branco se for para você)</Label>
              <Input value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} placeholder="Nome do dependente" />
            </div>
            <div>
              <Label>Observações (opcional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
              <Button disabled={!date || !time} onClick={() => setStep(4)} className="bg-primary hover:bg-primary/90">
                Revisar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        )}

        {step === 4 && specialty && partner && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">4. Confirmação</h2>
            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between border-b border-border/40 pb-2"><span className="text-muted-foreground">Serviço</span><span className="font-medium">{specialty.name}</span></div>
              <div className="flex justify-between border-b border-border/40 pb-2"><span className="text-muted-foreground">Parceiro</span><span className="font-medium">{partner.name}</span></div>
              <div className="flex justify-between border-b border-border/40 pb-2"><span className="text-muted-foreground">Data / hora</span><span className="font-medium">{date} às {time}</span></div>
              <div className="flex justify-between border-b border-border/40 pb-2"><span className="text-muted-foreground">Preço original</span><span className="line-through">R$ {original.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span className="text-primary font-bold">{partner.discount_pct_max}% OFF</span></div>
              <div className="flex justify-between bg-primary/5 -mx-3 px-3 py-3 rounded-lg border border-primary/20">
                <span className="font-semibold">Você paga</span>
                <span className="font-bold text-primary text-xl">R$ {finalPrice.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-5">Pague diretamente no parceiro apresentando seu Cartão Saúde Verde digital.</p>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Button>
              <Button onClick={submit} disabled={submitting} className="bg-primary hover:bg-primary/90">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Confirmar agendamento</>}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
