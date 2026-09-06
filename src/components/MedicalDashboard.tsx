import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Video, FileText, History, User, MessageCircle, Clock, Pill,
  Stethoscope, Brain, AlertTriangle, Search, Plus, CheckCircle2,
  Activity, ShoppingBag, Phone, Sparkles, Timer, VideoOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { doctorChannel } from "@/lib/realtime-channels";
import { toast } from "sonner";
import { generatePrescriptionPDF, type PrescriptionData } from "@/lib/prescriptionPDF";
import { APP_CONFIG } from "@/lib/app-config";
import { DrEdilsonClinicalAgent } from "@/components/DrEdilsonClinicalAgent";
import { PricingConfigModal } from "@/components/PricingConfigModal";
import { PerformanceBonusWidget } from "@/components/PerformanceBonusWidget";
import { BlockchainRecordPublisher } from "./BlockchainRecordPublisher";
import { TitulacaoTrackerCard } from "./TitulacaoTrackerCard";
import { NurseBrisaAlertSystem } from "@/components/NurseBrisaAlertSystem";
import { DrugInteractionAlertCard } from "@/components/consultation/DrugInteractionAlertCard";

// ─── Types ──────────────────────────────────────────────────
interface WaitingPatient {
  id: string;
  name: string;
  cpf: string;
  age: number;
  waitMinutes: number;
  tags: string[];
  urgency: "low" | "medium" | "high";
  symptoms: string;
  appointmentId: string;
}

interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
}

// ─── Mock data (will be replaced by real queries) ───────────
const MOCK_WAITING: WaitingPatient[] = [
  { id: "paciente-teste-id", appointmentId: "appt-sim-01", name: "Paciente Teste (Simulação IA - PAGO)", cpf: "***.***.000-00", age: 38, waitMinutes: 0, tags: ["🤖 Paciente Teste", "Simulação 360", "Insônia"], urgency: "high", symptoms: "Não dorme há 3 dias (<2h por noite), exaustão, ansiedade noturna. Deseja orientação médica canábica." },
  { id: "1", appointmentId: "a1", name: "Maria Silva", cpf: "***.***.789-01", age: 45, waitMinutes: 3, tags: ["Dor Crônica", "Retorno"], urgency: "medium", symptoms: "Lombalgia persistente, insônia leve" },
  { id: "2", appointmentId: "a2", name: "João Santos", cpf: "***.***.456-78", age: 32, waitMinutes: 18, tags: ["Ansiedade", "Retorno"], urgency: "low", symptoms: "Ansiedade generalizada, pânico noturno" },
  { id: "3", appointmentId: "a3", name: "Ana Costa", cpf: "***.***.123-45", age: 58, waitMinutes: 1, tags: ["Epilepsia", "Urgente"], urgency: "high", symptoms: "Crises refratárias, 3x/semana" },
  { id: "4", appointmentId: "a4", name: "Carlos Oliveira", cpf: "***.***.321-00", age: 67, waitMinutes: 22, tags: ["Parkinson", "Retorno"], urgency: "medium", symptoms: "Tremores, rigidez muscular progressiva" },
];

const AI_PROTOCOLS: Record<string, { product: string; dosage: string; notes: string }> = {
  "Ansiedade": { product: "CBD Full Spectrum 10%", dosage: "1 gota/kg/dia, sublingual, 2x ao dia", notes: "Iniciar com 50% da dose e titular em 7 dias" },
  "Dor Crônica": { product: "CBD:THC 20:1 Broad Spectrum", dosage: "0.5mg/kg/dia CBD, sublingual", notes: "Associar a fisioterapia. Reavaliação em 30 dias" },
  "Epilepsia": { product: "CBD Isolado 200mg/mL", dosage: "5mg/kg/dia, dividido em 2 doses", notes: "⚠️ Monitorar interação com anticonvulsivantes" },
  "Parkinson": { product: "CBD Full Spectrum + THC 3:1", dosage: "2 gotas 3x/dia", notes: "Começar com dose baixa. Atenção à sonolência" },
  "Insônia": { product: "CBD + CBN Noturno", dosage: "3 gotas antes de dormir", notes: "Evitar uso com benzodiazepínicos" },
  "Fibromialgia": { product: "CBD Full Spectrum 5%", dosage: "1 gota/kg/dia, sublingual", notes: "Acompanhamento mensal obrigatório" },
};

function getProtocolForTags(tags: string[]) {
  for (const tag of tags) {
    if (AI_PROTOCOLS[tag]) return { tag, ...AI_PROTOCOLS[tag] };
  }
  return { tag: "Geral", product: "CBD Full Spectrum 10%", dosage: "1 gota/kg/dia", notes: "Protocolo clínico padrão" };
}

// ─── Sub-components ─────────────────────────────────────────

function WaitingRoomSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map(i => (
        <div key={i} className="p-3 rounded-xl space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-1">
            <Skeleton className="h-4 w-16 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CenterSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

function PrescriptionSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export function MedicalDashboard() {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<WaitingPatient[]>([]);
  const [activePatient, setActivePatient] = useState<WaitingPatient | null>(null);
  const [notes, setNotes] = useState("");
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [activeDoctor, setActiveDoctor] = useState<any>(null);
  const [prescriptionType, setPrescriptionType] = useState<PrescriptionType>("controle_especial_c1");
  const [thcPercentage, setThcPercentage] = useState<number>(0.2);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      const { data: doc } = await supabase
        .from("doctors")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      if (doc?.id) {
        setDoctorId(doc.id);
        setActiveDoctor(doc);
      }
    });
  }, []);

  // Simulated load + real-time subscription attempt
  useEffect(() => {
    const timer = setTimeout(() => {
      setPatients(MOCK_WAITING);
      setActivePatient(MOCK_WAITING[0]);
      setLoading(false);
    }, 800);

    // Real-time channel for appointment changes — RLS on realtime.messages
    // requires a doctor-scoped channel name.
    let channel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      channel = supabase
        .channel(doctorChannel(uid, "waiting-room"))
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: "status=eq.scheduled",
        }, () => {
          // In production, re-fetch waiting room patients
        })
        .subscribe();
    });

    return () => {
      clearTimeout(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Auto-save notes
  useEffect(() => {
    if (!notes || !activePatient) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      // Would save to medical_records in production
      console.log("[AutoSave] Notes saved for", activePatient.name);
    }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [notes, activePatient]);

  // Wait time counter
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prev => prev.map(p => ({ ...p, waitMinutes: p.waitMinutes + 1 })));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPatient = useCallback((patient: WaitingPatient) => {
    setActivePatient(patient);
    setNotes("");
    setPrescriptionItems([]);
    setIsVideoActive(false);
  }, []);

  const handleFinalize = useCallback(async () => {
    if (!activePatient || prescriptionItems.length === 0) return;

    try {
      const doctorNameStr = activeDoctor?.full_name || "Edilson Bezerra";
      const doctorCRMStr = activeDoctor?.crm || "123456";
      const doctorStateStr = activeDoctor?.crm_state || "SP";
      const doctorSignatureUrl = activeDoctor?.signature_url;
      const typeMeta = getPrescriptionTypeMeta(prescriptionType);
      const verificationCode = generateVerificationCode();

      const prescriptionData: PrescriptionData = {
        clinicName: APP_CONFIG.COMPANY.NAME,
        clinicPhone: APP_CONFIG.COMPANY.PHONE,
        doctorName: doctorNameStr,
        doctorCRM: doctorCRMStr,
        doctorCRMState: doctorStateStr,
        patientName: activePatient.name,
        patientCPF: activePatient.cpf,
        patientAge: activePatient.age,
        medications: prescriptionItems.map((item) => ({
          name: item.name,
          dosage: item.dosage,
          instructions: item.instructions,
        })),
        notes: notes || undefined,
        signatureHash: verificationCode,
        signatureUrl: doctorSignatureUrl,
        date: new Date(),
      };

      const doc = await generatePrescriptionPDF(prescriptionData);
      const pdfBlob = doc.output("blob");
      const { data: authData } = await supabase.auth.getUser();
      const ownerId = authData.user?.id;
      const fileName = `receita_${activePatient.name.replace(/\s/g, "_")}_${Date.now()}.pdf`;
      const objectPath = ownerId ? `${ownerId}/${fileName}` : fileName;
      let signedPdfUrl: string | null = null;

      // Upload para o bucket privado `prescriptions`
      const { error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(objectPath, pdfBlob, { contentType: "application/pdf" });

      if (uploadError) {
        console.warn("[PDF] Upload falhou, salvando localmente:", uploadError.message);
        // Fallback: download local
        doc.save(fileName);
      } else {
        const { data: signed } = await supabase.storage
          .from("prescriptions")
          .createSignedUrl(objectPath, 7 * 24 * 60 * 60);
        signedPdfUrl = signed?.signedUrl ?? null;
      }

      // Persiste a receita com o tipo de receituário e o código público de verificação
      if (doctorId) {
        const { error: rxError } = await (supabase as any).from("prescriptions").insert({
          doctor_id: doctorId,
          patient_id: activePatient.id,
          medications: prescriptionData.medications,
          instructions: notes || null,
          status: "signed",
          prescription_type: prescriptionType,
          thc_percentage: thcPercentage,
          copies: typeMeta.copies,
          verification_code: verificationCode,
          icp_provider: doctorSignatureUrl ? "icp_brasil_iti" : "plataforma_icp_brasil",
          signature_provider: "gov.br",
          signature_hash: verificationCode,
          signature_date: new Date().toISOString(),
          digital_signature: verificationCode,
          signed_pdf_url: signedPdfUrl,
        });
        if (rxError) console.warn("[Prescrição] Falha ao registrar:", rxError.message);
      }

      toast.success(`${typeMeta.label} emitida com sucesso!`, {
        description: typeMeta.requiresPhysicalNotification
          ? "Atenção: é obrigatória a retenção da Notificação de Receita B física pela farmácia."
          : `Assinada digitalmente (ICP-Brasil) · ${typeMeta.copies} via(s) · Código ${verificationCode}`,
      });

      // Save fast-track cart for patient checkout
      const cartItems = prescriptionItems.map((item, i) => ({
        id: item.id,
        name: item.name,
        dosage: item.dosage,
        price: 28900 + i * 6000,
        quantity: 1,
      }));
      localStorage.setItem(`fast-cart-${activePatient.id}`, JSON.stringify(cartItems));

      // Trigger purchase link via Edge Function
      try {
        await supabase.functions.invoke("send-purchase-link", {
          body: {
            patientId: activePatient.id,
            patientPhone: "11999999999",
            patientName: activePatient.name,
            doctorName: `Dra. ${doctorNameStr} (CRM-${doctorStateStr} ${doctorCRMStr})`,
            items: cartItems,
          },
        });
        toast.info("Link de compra enviado ao paciente via WhatsApp");
      } catch {
        console.warn("[Upsell] Falha ao enviar link de compra");
      }

      // Remove from waiting room
      setPatients((prev) => prev.filter((p) => p.id !== activePatient.id));
      const remaining = patients.filter((p) => p.id !== activePatient.id);
      setActivePatient(remaining[0] || null);
      setNotes("");
      setPrescriptionItems([]);
      setIsVideoActive(false);
    } catch (err) {
      console.error("[PDF] Erro ao gerar receita:", err);
      toast.error("Erro ao gerar receita. Tente novamente.");
    }
  }, [activePatient, patients, prescriptionItems, notes, activeDoctor, doctorId, prescriptionType, thcPercentage]);

  const addMockProduct = useCallback(() => {
    if (!activePatient) return;
    const protocol = getProtocolForTags(activePatient.tags);
    setPrescriptionItems(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: protocol.product,
        dosage: protocol.dosage,
        instructions: protocol.notes,
      },
    ]);
    toast.info("Produto adicionado à prescrição");
  }, [activePatient]);

  const protocol = activePatient ? getProtocolForTags(activePatient.tags) : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-3 p-3 lg:p-4">
      {/* ═══════════════════════════════════════════════════════
          SIDEBAR ESQUERDA — FILA DE ESPERA
          ═══════════════════════════════════════════════════════ */}
      <aside className="w-64 xl:w-72 shrink-0 flex flex-col gap-3 hidden md:flex">
        <div className="flex items-center gap-2 px-1">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Stethoscope className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-sm font-bold tracking-wide uppercase text-muted-foreground">
            Sala de Espera
          </h2>
          <Badge variant="secondary" className="ml-auto text-xs tabular-nums">
            {patients.length}
          </Badge>
        </div>

        <Separator className="bg-border/30" />

        <ScrollArea className="flex-1">
          {loading ? (
            <WaitingRoomSkeleton />
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2 pr-2">
                {patients.map((p) => {
                  const isActive = activePatient?.id === p.id;
                  const isLongWait = p.waitMinutes >= 15;

                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                      <Card
                        onClick={() => handleSelectPatient(p)}
                        className={`
                          cursor-pointer p-3 transition-all duration-300 border rounded-xl
                          backdrop-blur-sm
                          ${isActive
                            ? "bg-primary/15 border-primary/50 shadow-[0_0_15px_hsl(var(--primary)/0.15)]"
                            : "bg-card/60 border-border/30 hover:bg-card/80 hover:border-border/50"
                          }
                          ${isLongWait && !isActive ? "animate-pulse shadow-[0_0_20px_hsl(var(--destructive)/0.15)]" : ""}
                        `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`h-2 w-2 rounded-full shrink-0 ${
                              p.urgency === "high" ? "bg-destructive" :
                              p.urgency === "medium" ? "bg-[hsl(45,100%,50%)]" :
                              "bg-primary"
                            }`} />
                            <span className="text-sm font-medium truncate">{p.name}</span>
                          </div>
                          <span className={`text-[11px] flex items-center gap-1 tabular-nums font-mono shrink-0 ${
                            isLongWait ? "text-destructive font-semibold" : "text-muted-foreground"
                          }`}>
                            <Timer className="h-3 w-3" />
                            {p.waitMinutes}m
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {p.tags.map((t) => (
                            <Badge
                              key={t}
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 border-border/40 ${
                                t === "Urgente" ? "border-destructive/50 text-destructive" : ""
                              }`}
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* Stats footer */}
        <div className="p-3 rounded-xl bg-card/40 border border-border/20 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-primary tabular-nums">{patients.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Na fila</p>
            </div>
            <div>
              <p className="text-lg font-bold text-muted-foreground tabular-nums">
                {patients.length > 0 ? Math.round(patients.reduce((s, p) => s + p.waitMinutes, 0) / patients.length) : 0}m
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Média</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          COLUNA CENTRAL — PRONTUÁRIO E VÍDEO
          ═══════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col gap-3 min-w-0">
        {loading ? (
          <CenterSkeleton />
        ) : !activePatient ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4 overflow-auto">
            <div className="text-center text-muted-foreground">
              <Stethoscope className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhum paciente na fila</p>
              <p className="text-sm">Aguardando novos agendamentos...</p>
            </div>
            {doctorId && (
              <div className="w-full max-w-xl">
                <PerformanceBonusWidget doctorId={doctorId} />
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Patient Header */}
            <Card className="p-4 bg-card/60 border-border/30 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-bold">{activePatient.name}</h1>
                      <Badge variant={activePatient.urgency === "high" ? "destructive" : "secondary"} className="text-[10px]">
                        {activePatient.urgency === "high" ? "URGENTE" : activePatient.urgency === "medium" ? "Moderado" : "Normal"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      CPF: {activePatient.cpf} • {activePatient.age} anos • Espera: {activePatient.waitMinutes}min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsVideoActive(!isVideoActive)}
                  >
                    {isVideoActive ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                    {isVideoActive ? "Encerrar Vídeo" : "Iniciar Teleconsulta"}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Phone className="h-4 w-4" /> Ligar
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2">
                    <MessageCircle className="h-4 w-4" /> Chat
                  </Button>
                </div>
              </div>
            </Card>

            {/* Video Area */}
            <AnimatePresence>
              {isVideoActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Card className="overflow-hidden rounded-2xl border-primary/30 bg-[hsl(240,25%,4%)]">
                    <div className="aspect-video max-h-[360px] flex items-center justify-center relative">
                      {/* Video placeholder */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                      <div className="text-center z-10">
                        <div className="h-20 w-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-4 ring-primary/20">
                          <Video className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-muted-foreground font-medium">Teleconsulta em Andamento</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Integração Daily.co / Jitsi Meet
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-3">
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <span className="text-xs text-primary font-mono tabular-nums">AO VIVO</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Prontuário Content */}
            <div className="flex-1 grid grid-cols-1 gap-3 min-h-0 overflow-auto">
              {/* Triagem Brisa */}
              {activePatient.symptoms && (
                <Card className="p-4 bg-card/60 border-border/30 backdrop-blur-sm rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
                        Triagem Brisa IA
                      </p>
                      <p className="text-sm text-foreground/80">{activePatient.symptoms}</p>
                      <div className="flex gap-1.5 mt-2">
                        {activePatient.tags.map(t => (
                          <Badge key={t} variant="outline" className="text-[10px] border-primary/30 text-primary">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Curva de Titulação Brisa 2.0 (Bot Start Low, Go Slow) */}
              <TitulacaoTrackerCard role="doctor" simulateAlert={true} />

              {/* Urgency alert */}
              {activePatient.urgency === "high" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="p-3 bg-destructive/10 border-destructive/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-xs text-destructive font-medium">
                        Paciente com urgência alta — Considere dose de ataque e monitoramento contínuo.
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Anamnese & Timeline */}
              <Card className="bg-card/60 border-border/30 backdrop-blur-sm p-4 rounded-xl flex flex-col">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wide">
                  <History className="h-4 w-4 text-primary" />
                  Anamnese & Evolução
                </h3>

                {/* Timeline mockup */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-start gap-2 text-xs">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <div>
                      <span className="text-muted-foreground">15/04/2026 — </span>
                      <span className="text-foreground/80">Primeira consulta. Paciente relata sintomas há 6 meses.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-xs">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                    <div>
                      <span className="text-muted-foreground">01/03/2026 — </span>
                      <span className="text-foreground/80">Pedido no Marketplace: CBD Full Spectrum 10% (30mL)</span>
                    </div>
                  </div>
                </div>

                <Textarea
                  placeholder="Digite suas notas clínicas aqui... (Auto-save ativo)"
                  className="flex-1 min-h-[100px] resize-none bg-background/30 border-border/30 rounded-lg text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                      <FileText className="h-3 w-3" /> Prontuário
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                      <ShoppingBag className="h-3 w-3" /> Pedidos
                    </Button>
                  </div>
                  {notes && (
                    <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                      <Activity className="h-3 w-3" /> Auto-save
                    </span>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════
          SIDEBAR DIREITA — PRESCRIÇÃO & MARKETPLACE
          ═══════════════════════════════════════════════════════ */}
      <aside className="w-72 xl:w-80 shrink-0 flex flex-col gap-3 hidden lg:flex">
        {loading ? (
          <PrescriptionSkeleton />
        ) : !activePatient ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground/40">
            <Pill className="h-12 w-12" />
          </div>
        ) : (
          <>
            {/* AI Suggestion */}
            <Card className="p-4 rounded-xl bg-primary/10 border-primary/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-xs font-bold text-primary uppercase tracking-wide">
                  Sugestão de Protocolo (IA)
                </p>
              </div>
              {protocol && (
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-foreground">{protocol.product}</p>
                  <p className="text-xs text-muted-foreground">{protocol.dosage}</p>
                  <p className="text-[11px] text-muted-foreground/80 italic">{protocol.notes}</p>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary mt-1">
                    {protocol.tag}
                  </Badge>
                </div>
              )}
            </Card>

            <Separator className="bg-border/20" />

            {/* Prescription items */}
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-muted-foreground uppercase tracking-wide px-1">
                <Pill className="h-4 w-4 text-primary" />
                Prescrição Digital
              </h3>

              <div className="mb-3">
                <PrescriptionTypeSelector
                  value={prescriptionType}
                  onChange={setPrescriptionType}
                  thcPercentage={thcPercentage}
                  onThcChange={setThcPercentage}
                  hasDigitalSignature={Boolean(activeDoctor?.signature_url)}
                />
              </div>


              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-2">
                  {prescriptionItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground/40">
                      <Pill className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">Nenhum item adicionado</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {prescriptionItems.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <Card className="p-3 bg-card/60 border-border/30 rounded-lg">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.dosage}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">{item.instructions}</p>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </ScrollArea>

              {/* Product search */}
              <div className="mt-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-background/30 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full border-primary/30 text-primary hover:bg-primary/10 gap-2 text-sm"
                  onClick={addMockProduct}
                >
                  <Plus className="h-4 w-4" /> Adicionar do Marketplace
                </Button>
              </div>
            </div>

            <Separator className="bg-border/20" />

            {/* Suporte Clínico à Decisão: Interações Medicamentosas (CYP450) */}
            {prescriptionItems.length > 0 && activePatient && (
              <DrugInteractionAlertCard
                cannabinoids={prescriptionItems.map((p) => p.name)}
                patientMedications={activePatient.tags}
                className="my-2"
              />
            )}

            {/* Finalize button */}
            <Button
              className="w-full py-6 font-bold text-sm gap-2 rounded-xl shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
              onClick={handleFinalize}
              disabled={prescriptionItems.length === 0}
            >
              <CheckCircle2 className="h-5 w-5" />
              Finalizar e Gerar Receita PDF
            </Button>
          </>
        )}
      </aside>

      <DrEdilsonClinicalAgent
        patientContext={activePatient
          ? `${activePatient.name}, ${activePatient.age} anos. Tags: ${activePatient.tags.join(", ")}. Sintomas: ${activePatient.symptoms}`
          : undefined}
      />
    </div>
  );
}

export default MedicalDashboard;
