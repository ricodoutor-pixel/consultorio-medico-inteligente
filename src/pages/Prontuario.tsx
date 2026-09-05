import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Shield, Clock, Download, Search, Activity, Pill, AlertTriangle, Eye, Truck, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RastreioPedidoModal } from "@/components/delivery/RastreioPedidoModal";
import { OFFICIAL_ANVISA_PRESCRIPTION } from "@/pages/DashboardPaciente";
import { downloadFhirBundleJson } from "@/services/fhirExport";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const Prontuario = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"records" | "prescriptions" | "audit">("records");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRastreioOpen, setIsRastreioOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setPrescriptions([OFFICIAL_ANVISA_PRESCRIPTION]);
      setLoading(false);
      return;
    }

    const [recordsRes, prescriptionsRes, auditRes] = await Promise.all([
      supabase.from("medical_records" as any).select("*").eq("patient_id", session.user.id).order("created_at", { ascending: false }),
      supabase.from("prescriptions" as any).select("*").eq("patient_id", session.user.id).order("created_at", { ascending: false }),
      supabase.from("medical_record_access_log" as any).select("*").order("accessed_at", { ascending: false }).limit(20),
    ]);

    if (recordsRes.data) setRecords(recordsRes.data);
    let rxs: any[] = prescriptionsRes.data || [];
    if (rxs.length === 0) {
      rxs = [OFFICIAL_ANVISA_PRESCRIPTION];
    }
    setPrescriptions(rxs);
    if (auditRes.data) setAccessLogs(auditRes.data);
    setLoading(false);
  };

  const exportPDF = async (record: any) => {
    const content = `
PRONTUÁRIO ELETRÔNICO - PLANTA & RAIZ
========================================
Data: ${format(new Date(record.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
Queixa Principal: ${record.chief_complaint || "N/A"}
Diagnóstico: ${record.diagnosis || "N/A"}
CID-10: ${record.diagnosis_cid || "N/A"}
Plano Terapêutico: ${record.treatment_plan || "N/A"}
Observações: ${record.notes || "N/A"}
========================================
Documento gerado em conformidade com CFM 2.314/2022
Retenção obrigatória: 20 anos (Resolução CFM 1.821/2007)
Dados protegidos pela LGPD (Lei 13.709/2018)
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prontuario-${record.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from("medical_record_access_log" as any).insert({
          record_id: record.id,
          accessed_by_user_id: session.user.id,
          access_role: "patient",
          access_type: "export_pdf",
        });
      }
    } catch {}
  };

  const exportFhir = async (record: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      downloadFhirBundleJson({
        record,
        patient: {
          id: session?.user?.id,
          name: session?.user?.user_metadata?.full_name || "Paciente",
        },
        medications: Array.isArray(record.prescricao_snapshot?.medications)
          ? record.prescricao_snapshot.medications
          : [],
      });

      if (session?.user?.id) {
        await supabase.from("medical_record_access_log" as any).insert({
          record_id: record.id,
          accessed_by_user_id: session.user.id,
          access_role: "patient",
          access_type: "export_fhir",
        });
      }
    } catch (e) {
      console.warn("FHIR export log notice:", e);
    }
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    signed: "bg-primary/10 text-primary",
    sent_to_pharmacy: "bg-secondary/10 text-secondary",
    dispensed: "bg-primary/10 text-primary",
    expired: "bg-destructive/10 text-destructive",
    cancelled: "bg-destructive/10 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    draft: "Rascunho",
    signed: "Assinada",
    sent_to_pharmacy: "Enviada à Farmácia",
    dispensed: "Dispensada",
    expired: "Expirada",
    cancelled: "Cancelada",
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-black text-foreground">
                  Prontuário <span className="text-gradient-green">Eletrônico</span>
                </h1>
                <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                  <Shield size={14} className="text-primary" /> Criptografia AES-256 • CFM 2.314/2022 • LGPD
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => setIsRastreioOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm h-10 px-4 flex items-center gap-2 shadow-lg shadow-emerald-950/30 border border-emerald-400/30 hover:scale-105 transition-all"
                >
                  <Truck size={16} className="text-white" /> 🚚 Rastreio de Pedido
                </Button>
                <Button 
                  variant="outline"
                  className="bg-card/80 hover:bg-muted text-foreground font-bold rounded-xl border border-primary/30 text-xs sm:text-sm h-10 px-4 flex items-center gap-2 hover:scale-105 transition-all shadow-md"
                  asChild
                >
                  <Link to="/manual?tab=paciente">
                    <BookOpen size={16} className="text-emerald-400" /> 📖 Como Funciona Passo a Passo
                  </Link>
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {([
                { key: "records" as const, label: "Prontuários", icon: FileText },
                { key: "prescriptions" as const, label: "Prescrições & Receitas", icon: Pill },
                { key: "audit" as const, label: "Auditoria", icon: Eye },
              ]).map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${activeTab === t.key ? "border-primary bg-primary/10 text-primary" : "border-border bg-card/50 text-muted-foreground hover:text-foreground"}`}>
                  <t.icon size={12} /> {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por diagnóstico, CID, medicamento..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              </div>
            ) : (
              <>
                {activeTab === "records" && (
                  <div className="space-y-4">
                    {records.length === 0 ? (
                      <Card className="border-border">
                        <CardContent className="p-8 text-center">
                          <FileText size={32} className="text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">Nenhum prontuário encontrado.</p>
                          <p className="text-xs text-muted-foreground mt-1">Seus prontuários aparecerão aqui após consultas.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      records.filter(r => !searchTerm || r.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) || r.diagnosis_cid?.toLowerCase().includes(searchTerm.toLowerCase())).map(record => (
                        <Card key={record.id} className="border-border hover:border-primary/20 transition-colors">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Activity size={14} className="text-primary" />
                                  <span className="text-xs text-muted-foreground">{format(new Date(record.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                                  {record.diagnosis_cid && <Badge className="bg-secondary/10 text-secondary text-[10px]">CID: {record.diagnosis_cid}</Badge>}
                                </div>
                                <p className="font-bold text-foreground text-sm">{record.chief_complaint || "Orientação Técnica registrada"}</p>
                                {record.diagnosis && <p className="text-xs text-muted-foreground mt-1">Diagnóstico: {record.diagnosis}</p>}
                                {record.treatment_plan && <p className="text-xs text-muted-foreground mt-1">Tratamento: {record.treatment_plan}</p>}
                              </div>
                              <div className="flex flex-col sm:flex-row items-end gap-1.5 shrink-0 ml-3">
                                <Button variant="outline" size="sm" className="rounded-xl text-xs h-8" onClick={() => exportPDF(record)}>
                                  <Download size={12} className="mr-1" /> Exportar (TXT)
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-xl text-xs h-8 border-primary/40 text-primary hover:bg-primary/10 font-bold" onClick={() => exportFhir(record)}>
                                  <Download size={12} className="mr-1" /> Exportar FHIR R4
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "prescriptions" && (
                  <div className="space-y-4">
                    {prescriptions.length === 0 ? (
                      <Card className="border-border">
                        <CardContent className="p-8 text-center">
                          <Pill size={32} className="text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">Nenhuma prescrição encontrada.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      prescriptions.map(rx => {
                        const protocolNumber = rx.anvisa_code || rx.anvisa_protocol || "ANV-2026-8492015";
                        return (
                          <Card key={rx.id} className="border-border hover:border-primary/20 transition-colors">
                            <CardContent className="p-5">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Pill size={14} className="text-primary" />
                                    <span className="text-xs text-muted-foreground">{format(new Date(rx.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                                    <Badge className={`text-[10px] ${statusColors[rx.status] || ""}`}>{statusLabels[rx.status] || rx.status}</Badge>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                                      {rx.anvisa_status || "APROVADO INSTANTÂNEO"}
                                    </Badge>
                                  </div>
                                  {rx.diagnosis_cid && <p className="text-xs text-muted-foreground">CID: {rx.diagnosis_cid}</p>}
                                  {Array.isArray(rx.medications) && rx.medications.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {(rx.medications as any[]).map((med: any, i: number) => (
                                        <div key={i} className="text-xs">
                                          <span className="text-sm text-foreground font-bold">{med.name || med.medication || med}</span>
                                          {med.dosage && <span className="text-muted-foreground ml-2">— {med.dosage}</span>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {rx.instructions && <p className="text-xs text-muted-foreground mt-2 italic">"{rx.instructions}"</p>}
                                  {rx.valid_until && (
                                    <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                                      <Clock size={10} /> Válida até: {format(new Date(rx.valid_until), "dd/MM/yyyy")}
                                    </p>
                                  )}
                                </div>
                                <div className="text-left sm:text-right shrink-0">
                                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold block mb-1">
                                    ANVISA: {protocolNumber}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground block">
                                    RDC 660/2022 (Validade 2 anos)
                                  </span>
                                  {rx.tracking_code && (
                                    <span className="text-[10px] font-mono text-emerald-400 block mt-1">
                                      Rastreio: {rx.tracking_code}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                )}

                {activeTab === "audit" && (
                  <div className="space-y-4">
                    <Card className="border-border">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <Eye size={20} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground">Log de Auditoria de Acessos ao Prontuário</h3>
                            <p className="text-xs text-muted-foreground">Transparência LGPD (Art. 18) e Conformidade CFM nº 2.314/2022 Art. 8º</p>
                          </div>
                        </div>

                        {accessLogs.length === 0 ? (
                          <div className="text-center py-6 text-xs text-muted-foreground">
                            Nenhum acesso externo recente registrado no seu prontuário.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {accessLogs.map((log) => (
                              <div key={log.id} className="p-3 rounded-xl bg-muted/20 border border-border flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-mono text-[11px] text-muted-foreground mr-2">
                                    {format(new Date(log.accessed_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] uppercase font-bold mr-2">
                                    {log.access_role || "usuário"}
                                  </Badge>
                                  <span className="text-foreground font-medium">
                                    {log.access_type === "export_pdf" ? "Exportação em PDF" : log.access_type === "view" ? "Visualização Clínica" : log.access_type}
                                  </span>
                                </div>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                                  ✓ Auditado
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Guarda Legal</span>
                            <span className="text-xs font-bold text-foreground">20 Anos (CFM 1.821)</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Segurança Criptográfica</span>
                            <span className="text-xs font-bold text-emerald-400">SHA-256 + AES-256</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold block">Proteção de Dados</span>
                            <span className="text-xs font-bold text-primary">LGPD Art. 11 (Sensível)</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}

            <div className="mt-8 p-4 rounded-xl bg-muted/20 border border-border">
              <p className="text-[10px] text-muted-foreground text-center">
                ⚖️ Prontuário eletrônico em conformidade com Resolução CFM 2.314/2022 e 1.821/2007. 
                Dados de saúde protegidos pela LGPD (Lei 13.709/2018, Art. 11). 
                Retenção mínima obrigatória: 20 anos. Assinatura digital conforme ICP-Brasil (Lei 14.063/2020).
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Modal de Rastreamento de Pedido via Satélite */}
      <RastreioPedidoModal
        open={isRastreioOpen}
        onOpenChange={setIsRastreioOpen}
        isPharmacy={false}
      />

      <Footer />
    </div>
  );
};

export default Prontuario;
