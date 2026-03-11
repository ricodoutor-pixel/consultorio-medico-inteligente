/**
 * IoMT Sync Hub — Internet of Medical Things Dashboard
 * Apple Health / Google Fit API integration placeholder
 * Patient Health Timeline using HL7 FHIR standards
 */
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Heart, Moon, Footprints, Smartphone, Watch, Link2, RefreshCw, Shield, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface FHIRObservation {
  resourceType: "Observation";
  id: string;
  status: "final" | "preliminary";
  code: { coding: { system: string; code: string; display: string }[] };
  valueQuantity: { value: number; unit: string };
  effectiveDateTime: string;
  device?: { display: string };
}

// Simulated HL7 FHIR Observations from wearables
const MOCK_FHIR_DATA: FHIRObservation[] = [
  { resourceType: "Observation", id: "obs-1", status: "final", code: { coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }] }, valueQuantity: { value: 72, unit: "bpm" }, effectiveDateTime: new Date(Date.now() - 3600000).toISOString(), device: { display: "Apple Watch" } },
  { resourceType: "Observation", id: "obs-2", status: "final", code: { coding: [{ system: "http://loinc.org", code: "55423-8", display: "Steps" }] }, valueQuantity: { value: 8432, unit: "steps" }, effectiveDateTime: new Date(Date.now() - 7200000).toISOString(), device: { display: "Google Fit" } },
  { resourceType: "Observation", id: "obs-3", status: "final", code: { coding: [{ system: "http://loinc.org", code: "93832-4", display: "Sleep duration" }] }, valueQuantity: { value: 7.2, unit: "hours" }, effectiveDateTime: new Date(Date.now() - 28800000).toISOString(), device: { display: "Apple Watch" } },
  { resourceType: "Observation", id: "obs-4", status: "final", code: { coding: [{ system: "http://loinc.org", code: "2708-6", display: "SpO2" }] }, valueQuantity: { value: 98, unit: "%" }, effectiveDateTime: new Date(Date.now() - 5400000).toISOString(), device: { display: "Oxímetro BLE" } },
  { resourceType: "Observation", id: "obs-5", status: "preliminary", code: { coding: [{ system: "http://loinc.org", code: "8310-5", display: "Body temperature" }] }, valueQuantity: { value: 36.5, unit: "°C" }, effectiveDateTime: new Date(Date.now() - 1800000).toISOString(), device: { display: "Termômetro IoT" } },
  { resourceType: "Observation", id: "obs-6", status: "final", code: { coding: [{ system: "http://loinc.org", code: "85354-9", display: "Blood Pressure" }] }, valueQuantity: { value: 120, unit: "mmHg" }, effectiveDateTime: new Date(Date.now() - 10800000).toISOString(), device: { display: "Omron BLE" } },
];

type DeviceStatus = { name: string; icon: React.ReactNode; connected: boolean; lastSync: string };

const IoMTHub = () => {
  const [devices] = useState<DeviceStatus[]>([
    { name: "Apple Health", icon: <Watch size={16} />, connected: true, lastSync: "Há 15 min" },
    { name: "Google Fit", icon: <Smartphone size={16} />, connected: true, lastSync: "Há 1h" },
    { name: "Oxímetro BLE", icon: <Activity size={16} />, connected: false, lastSync: "Desconectado" },
    { name: "Omron BLE", icon: <Heart size={16} />, connected: true, lastSync: "Há 3h" },
  ]);

  const iconMap: Record<string, React.ReactNode> = {
    "8867-4": <Heart size={14} className="text-red-400" />,
    "55423-8": <Footprints size={14} className="text-primary" />,
    "93832-4": <Moon size={14} className="text-indigo-400" />,
    "2708-6": <Activity size={14} className="text-blue-400" />,
    "8310-5": <Activity size={14} className="text-orange-400" />,
    "85354-9": <Heart size={14} className="text-pink-400" />,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 px-4 max-w-6xl mx-auto pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Activity size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">IoMT Sync Hub</h1>
              <p className="text-xs text-muted-foreground">Internet of Medical Things • HL7 FHIR R4</p>
            </div>
            <Badge variant="outline" className="ml-auto text-[10px] border-primary/30 text-primary">
              <Shield size={8} className="mr-1" /> E2E Encrypted
            </Badge>
          </div>
        </motion.div>

        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="timeline">Health Timeline</TabsTrigger>
            <TabsTrigger value="devices">Dispositivos</TabsTrigger>
            <TabsTrigger value="fhir">FHIR Bundle</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-3">
            {MOCK_FHIR_DATA.map((obs, i) => (
              <motion.div key={obs.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="border-border hover:border-primary/20 transition-colors">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      {iconMap[obs.code.coding[0].code] || <Activity size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{obs.code.coding[0].display}</p>
                      <p className="text-[10px] text-muted-foreground">
                        LOINC: {obs.code.coding[0].code} • {obs.device?.display}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-primary">{obs.valueQuantity.value}<span className="text-xs font-normal ml-0.5 text-muted-foreground">{obs.valueQuantity.unit}</span></p>
                      <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 justify-end">
                        <Clock size={8} />
                        {new Date(obs.effectiveDateTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[8px] h-4 ${obs.status === "final" ? "border-primary/30 text-primary" : "border-yellow-400/30 text-yellow-400"}`}>
                      {obs.status}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="devices" className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {devices.map((d, i) => (
              <Card key={i} className={`border-border ${d.connected ? "border-primary/20" : "opacity-60"}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.connected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {d.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{d.name}</p>
                    <p className="text-[10px] text-muted-foreground">{d.lastSync}</p>
                  </div>
                  <Button variant={d.connected ? "outline" : "default"} size="sm" className="text-xs">
                    {d.connected ? <><RefreshCw size={10} className="mr-1" /> Sync</> : <><Link2 size={10} className="mr-1" /> Conectar</>}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="fhir">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">HL7 FHIR R4 Bundle (JSON)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/30 rounded-lg p-3 text-[10px] text-muted-foreground overflow-x-auto max-h-[400px]">
                  {JSON.stringify({ resourceType: "Bundle", type: "collection", entry: MOCK_FHIR_DATA.map(r => ({ resource: r })) }, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IoMTHub;
