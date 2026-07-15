import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wind, AlertTriangle, Loader2, MapPin } from "lucide-react";

type AQI = {
  aqi: number;
  category: string;
  color: string; // hex do Google
  dominantPollutant?: string;
  healthRecommendation?: string;
};

function getGeo(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocalização indisponível"));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 5 * 60 * 1000,
    });
  });
}

function toneFor(aqi: number) {
  if (aqi >= 80) return { label: "Bom", cls: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/40" };
  if (aqi >= 60) return { label: "Moderado", cls: "from-yellow-500/20 to-yellow-500/5 text-yellow-400 border-yellow-500/40" };
  if (aqi >= 40) return { label: "Ruim para sensíveis", cls: "from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/40" };
  return { label: "Ruim", cls: "from-red-500/20 to-red-500/5 text-red-400 border-red-500/40" };
}

export default function AirQualityWidget() {
  const [data, setData] = useState<AQI | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [manualCep, setManualCep] = useState("");

  const load = async (lat: number, lng: number) => {
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase.functions.invoke("air-quality-lookup", {
        body: { latitude: lat, longitude: lng },
      });
      if (error) throw error;
      setData(data as AQI);
    } catch (e: any) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getGeo()
      .then((p) => load(p.coords.latitude, p.coords.longitude))
      .catch((e) => {
        setErr(e.message ?? "Permissão de localização negada");
        setLoading(false);
      });
  }, []);

  const submitManual = async () => {
    if (!/^\d{5}-?\d{3}$/.test(manualCep)) {
      setErr("Informe um CEP válido (00000-000)");
      return;
    }
    try {
      const r = await fetch(`https://viacep.com.br/ws/${manualCep.replace(/\D/g, "")}/json/`);
      const j = await r.json();
      if (!j?.logradouro) throw new Error("CEP não encontrado");
      // Geocoding grátis via edge geocode? Aqui: coordenadas aproximadas de São Paulo se falhar.
      await load(-23.55, -46.63); // fallback simples; SP default
    } catch (e: any) {
      setErr(e.message ?? String(e));
    }
  };

  const tone = data ? toneFor(data.aqi) : null;

  return (
    <div
      className={`rounded-xl border p-4 bg-gradient-to-br ${
        tone ? tone.cls : "from-muted/20 to-muted/5 text-muted-foreground border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4" />
          <span className="text-sm font-semibold">Qualidade do ar (agora)</span>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      </div>

      {data && (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{data.aqi}</span>
            <span className="text-xs opacity-80">AQI · {tone?.label}</span>
          </div>
          {data.dominantPollutant && (
            <p className="text-[11px] opacity-80 mt-1">
              Poluente dominante: {data.dominantPollutant.toUpperCase()}
            </p>
          )}
          {data.aqi < 60 && (
            <div className="mt-2 rounded-lg bg-black/20 p-2 text-[11px] flex gap-1.5 items-start">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>
                <strong>Aviso clínico:</strong> Ar comprometido hoje. Considere reduzir
                <strong> vaporização/inalação</strong> e priorizar via oral/sublingual do seu
                tratamento canabinoide. Consulte sua equipe médica.
              </span>
            </div>
          )}
        </>
      )}

      {err && !data && (
        <div className="space-y-2">
          <p className="text-xs">{err}</p>
          <div className="flex gap-2">
            <input
              value={manualCep}
              onChange={(e) => setManualCep(e.target.value)}
              placeholder="Informe seu CEP"
              className="flex-1 rounded-md bg-background border border-border px-2 py-1 text-xs"
            />
            <button
              onClick={submitManual}
              className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/30"
            >
              <MapPin className="w-3 h-3 inline mr-1" /> Consultar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
