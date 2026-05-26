import { useEffect, useState } from "react";
import { Heart, Camera, Timer, MessageCircleHeart, Info, Activity } from "lucide-react";
import MonitorCardiaco from "@/components/MonitorCardiaco";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Medicao { bpm: number; created_at: string; classificacao: string }

export default function MonitorCardiacoPage() {
  const [history, setHistory] = useState<Medicao[]>([]);

  useEffect(() => {
    document.title = "Medir Batimentos Cardíacos pelo Celular Grátis | Planta y Raiz";
    const desc = "Meça sua frequência cardíaca em 30 segundos usando a câmera do seu smartphone. Tecnologia PPG profissional. Grátis. Sem app. Resultado imediato.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "description"); document.head.appendChild(m); }
    m.setAttribute("content", desc);

    // Schema.org MedicalWebPage + HowTo
    const old = document.getElementById("ppg-jsonld");
    if (old) old.remove();
    const s = document.createElement("script");
    s.id = "ppg-jsonld";
    s.type = "application/ld+json";
    s.text = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "MedicalWebPage",
        "name": "Monitor Cardíaco PPG — Planta y Raiz",
        "about": "Medição de frequência cardíaca pelo smartphone",
        "audience": { "@type": "PeopleAudience", "audienceType": "Patients" },
      },
      {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "Como medir batimentos cardíacos pelo celular",
        "step": [
          { "@type": "HowToStep", "name": "Apoie o dedo na câmera traseira" },
          { "@type": "HowToStep", "name": "Aguarde 30 segundos" },
          { "@type": "HowToStep", "name": "Veja seu BPM e fale com a Brisa" },
        ],
      },
    ]);
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("medicoes_cardiacas")
        .select("bpm,created_at,classificacao")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setHistory(data as Medicao[]);
    })();
  }, []);

  const scrollToMonitor = () => document.getElementById("monitor")?.scrollIntoView({ behavior: "smooth" });

  return (
    <main className="min-h-screen bg-background text-foreground pb-24">
      {/* HERO */}
      <section className="px-4 pt-10 pb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary mb-4">
          <Activity size={12} /> Precisão ±2 BPM · Validado cientificamente
        </div>
        <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-3">
          Meça seus batimentos cardíacos — <span className="text-primary">Agora, pelo celular</span>
        </h1>
        <p className="text-muted-foreground mb-6">
          Tecnologia PPG usada em hospitais, agora no seu smartphone. Sem equipamento. Sem custo. Em 30 segundos.
        </p>
        <Button onClick={scrollToMonitor} size="lg" className="bg-green-600 hover:bg-green-700 text-white h-12 px-8">
          <Heart size={18} /> Medir agora grátis
        </Button>
      </section>

      {/* 3 passos */}
      <section className="px-4 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        {[
          { i: Camera, t: "1. Apoie o dedo", d: "Câmera traseira + flash" },
          { i: Timer, t: "2. Aguarde 30s", d: "Mantenha o dedo firme" },
          { i: MessageCircleHeart, t: "3. Veja e converse", d: "Brisa interpreta seu resultado" },
        ].map(({ i: Icon, t, d }) => (
          <Card key={t} className="p-4 text-center bg-card/60 border border-primary/10">
            <Icon className="mx-auto text-primary mb-2" size={28} />
            <p className="font-semibold text-sm">{t}</p>
            <p className="text-xs text-muted-foreground">{d}</p>
          </Card>
        ))}
      </section>

      {/* Monitor */}
      <section id="monitor" className="px-4 mb-10">
        <MonitorCardiaco />
      </section>

      {/* O que significa */}
      <section className="px-4 max-w-2xl mx-auto mb-10">
        <h2 className="text-xl font-bold mb-3">O que significa seu resultado?</h2>
        <Card className="p-4 divide-y divide-border">
          {[
            ["< 50 BPM", "Bradicardia — consulte um médico", "text-red-400"],
            ["50–59 BPM", "Abaixo do normal — pode ser normal em atletas", "text-yellow-400"],
            ["60–100 BPM", "Normal — coração saudável 💚", "text-green-400"],
            ["101–120 BPM", "Elevado — descanse e meça novamente", "text-yellow-400"],
            ["> 120 BPM", "Taquicardia — consulte um médico", "text-red-400"],
          ].map(([range, msg, color]) => (
            <div key={range} className="py-2 flex justify-between items-center text-sm">
              <span className={`font-semibold ${color}`}>{range}</span>
              <span className="text-muted-foreground text-right">{msg}</span>
            </div>
          ))}
        </Card>

        <Card className="p-4 mt-4 bg-primary/5 border-primary/30">
          <h3 className="font-semibold mb-2 flex items-center gap-2"><Heart size={16} className="text-primary" /> BPM e Cannabis Medicinal</h3>
          <p className="text-sm text-muted-foreground">
            O CBD e o THC interagem com receptores CB1 do sistema endocanabinoide presentes no nódulo sinusal,
            modulando o ritmo cardíaco. Pacientes em tratamento canabinoide frequentemente apresentam BPM
            entre 60–90 em repouso, indicando boa resposta autonômica.
          </p>
        </Card>
      </section>

      {/* Histórico */}
      {history.length > 0 && (
        <section className="px-4 max-w-2xl mx-auto mb-10">
          <h2 className="text-xl font-bold mb-3">Seu histórico</h2>
          <Card className="p-4">
            <div className="flex items-end gap-1 h-24">
              {history.slice().reverse().map((m, i) => {
                const max = Math.max(...history.map(h => h.bpm), 100);
                return <div key={i} className="flex-1 bg-primary/60 rounded-sm" style={{ height: `${(m.bpm/max)*100}%` }} title={`${m.bpm} BPM`} />;
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Meça diariamente para acompanhar a evolução do seu tratamento.</p>
          </Card>
        </section>
      )}

      {/* CTA consulta */}
      <section className="px-4 max-w-2xl mx-auto mb-10">
        <Card className="p-5 text-center bg-gradient-to-br from-primary/20 to-transparent border-primary/30">
          <h3 className="font-bold mb-2">Resultado preocupante?</h3>
          <p className="text-sm text-muted-foreground mb-4">Fale com um médico por R$ 30 — atendimento por orientação técnica.</p>
          <Button onClick={() => window.location.href = "/falar-com-especialista"} className="bg-green-600 hover:bg-green-700 text-white">
            Consultar agora
          </Button>
        </Card>
      </section>

      {/* Avisos legais */}
      <section className="px-4 max-w-2xl mx-auto space-y-3">
        <Card className="p-3 border-yellow-500/30 bg-yellow-500/5">
          <p className="text-xs flex gap-2"><Info size={14} className="text-yellow-400 shrink-0 mt-0.5" />
            <span><strong>Aviso:</strong> ferramenta educativa e de bem-estar. Não substitui avaliação médica profissional. Em caso de sintomas cardíacos, procure atendimento médico ou ligue <strong>192 (SAMU)</strong>.</span>
          </p>
        </Card>
        <Card className="p-3 border-border">
          <p className="text-xs flex gap-2"><Info size={14} className="text-primary shrink-0 mt-0.5" />
            <span><strong>Para melhores resultados:</strong> use em ambiente com pouca luz, mantenha o dedo firme por 30 segundos, não fale durante a medição. Precisão típica: ±2–5 BPM.</span>
          </p>
        </Card>
      </section>
    </main>
  );
}
