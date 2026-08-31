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

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const Prontuario = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"records" | "prescriptions" | "audit">("records");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRastreioOpen, setIsRastreioOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const [recordsRes, prescriptionsRes] = await Promise.all([
      supabase.from("medical_records").select("*").eq("patient_id", session.user.id).order("created_at", { ascending: false }),
      supabase.from("prescriptions").select("*").eq("patient_id", session.user.id).order("created_at", { ascending: false }),
    ]);

    if (recordsRes.data) setRecords(recordsRes.data);
    if (prescriptionsRes.data) setPrescriptions(prescriptionsRes.data);
    setLoading(false);
  };

  const exportPDF = (record: any) => {
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
                { key: "prescriptions" as const, label: "Prescrições", icon: Pill },
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
                              <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => exportPDF(record)}>
                                <Download size={12} className="mr-1" /> Exportar
                              </Button>
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
                      prescriptions.map(rx => (
                        <Card key={rx.id} className="border-border hover:border-primary/20 transition-colors">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Pill size={14} className="text-primary" />
                                  <span className="text-xs text-muted-foreground">{format(new Date(rx.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                                  <Badge className={`text-[10px] ${statusColors[rx.status] || ""}`}>{statusLabels[rx.status] || rx.status}</Badge>
                                </div>
                                {rx.diagnosis_cid && <p className="text-xs text-muted-foreground">CID: {rx.diagnosis_cid}</p>}
                                {Array.isArray(rx.medications) && rx.medications.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {(rx.medications as any[]).map((med: any, i: number) => (
                                      <p key={i} className="text-sm text-foreground font-bold">{med.name || med}</p>
                                    ))}
                                  </div>
                                )}
                                {rx.instructions && <p className="text-xs text-muted-foreground mt-2">{rx.instructions}</p>}
                                {rx.valid_until && (
                                  <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                                    <Clock size={10} /> Válida até: {format(new Date(rx.valid_until), "dd/MM/yyyy")}
                                  </p>
                                )}
                              </div>
                              {rx.anvisa_code && <Badge className="bg-primary/10 text-primary text-[10px]">ANVISA: {rx.anvisa_code}</Badge>}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "audit" && (
                  <Card className="border-border">
                    <CardContent className="p-8 text-center">
                      <Eye size={32} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-bold text-foreground">Log de Auditoria</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Todo acesso ao prontuário é registrado conforme CFM 2.314/2022 Art. 8º.
                        <br />O log completo está disponível para o administrador do sistema.
                      </p>
                      <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border">
                        <p className="text-[10px] text-muted-foreground">
                          🔒 Retenção: 20 anos (Resolução CFM 1.821/2007)<br />
                          🔐 Criptografia: AES-256<br />
                          📋 Conformidade: CFM 2.314/2022 + LGPD
                        </p>
                      </div>
                    </CardContent>
                  </Card>
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
