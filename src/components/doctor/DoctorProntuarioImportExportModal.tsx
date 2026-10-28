import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  Download,
  Search,
  FileText,
  UserPlus,
  Video,
  CheckCircle2,
  FolderUp,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Stethoscope,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  Paperclip,
  Save,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export interface ImportedPatientRecord {
  id: string;
  name: string;
  cpf: string;
  phone?: string;
  email?: string;
  age?: number | string;
  birthDate?: string;
  diagnosisCid?: string;
  clinicalNotes?: string;
  treatmentPlan?: string;
  medications?: string;
  sourcePlatform?: string;
  attachedFileName?: string;
  lastConsultationDate?: string;
  createdAt: string;
}

interface DoctorProntuarioImportExportModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  doctorId?: string | null;
  doctorName?: string | null;
  inline?: boolean;
  onSelectPatientForConsultation?: (patient: ImportedPatientRecord) => void;
}

const STORAGE_KEY_PREFIX = "pyr_doctor_patient_records_v1_";

function normalizeDigits(str: string = ""): string {
  return String(str).replace(/\D/g, "");
}

function formatCpf(raw: string = ""): string {
  const digits = normalizeDigits(raw);
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
  return raw.trim() || "Não informado";
}

const DEFAULT_DEMO_RECORDS: ImportedPatientRecord[] = [
  {
    id: "pat-rec-1",
    name: "Maria Silva Oliveira",
    cpf: "123.456.789-01",
    phone: "(11) 98765-4321",
    email: "maria.silva@email.com",
    age: 45,
    diagnosisCid: "M54.5 - Dor lombar baixa / Insônia",
    clinicalNotes: "Paciente acompanhada previamente em outra plataforma. Relata lombalgia crônica há 2 anos com boa resposta inicial a fitocanabinoides.",
    treatmentPlan: "Óleo CBD Full Spectrum 10% — 5 gotas de 12/12h sublingual.",
    medications: "CBD Full Spectrum 10% (30mL)",
    sourcePlatform: "Planta y Raíz",
    lastConsultationDate: "2026-10-15",
    createdAt: new Date().toISOString(),
  },
  {
    id: "pat-rec-2",
    name: "João Carlos dos Santos",
    cpf: "234.567.890-12",
    phone: "(21) 99876-5432",
    email: "joao.santos@email.com",
    age: 34,
    diagnosisCid: "F41.1 - Ansiedade generalizada",
    clinicalNotes: "Histórico de ansiedade generalizada e despertar noturno. Trouxe exames laboratoriais sem alterações hepáticas.",
    treatmentPlan: "CBD Broad Spectrum 5% — 4 gotas manhã e 6 gotas noite.",
    medications: "CBD Broad Spectrum 5%",
    sourcePlatform: "Planta y Raíz",
    lastConsultationDate: "2026-10-20",
    createdAt: new Date().toISOString(),
  },
];

export function loadDoctorPatientRecords(doctorId?: string | null): ImportedPatientRecord[] {
  const key = `${STORAGE_KEY_PREFIX}${doctorId || "default"}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const fallbackRaw = localStorage.getItem(`${STORAGE_KEY_PREFIX}default`);
    if (fallbackRaw) {
      const parsed = JSON.parse(fallbackRaw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("[ProntuarioImportExport] Erro ao ler registros locais:", e);
  }
  return DEFAULT_DEMO_RECORDS;
}

export function saveDoctorPatientRecords(records: ImportedPatientRecord[], doctorId?: string | null) {
  const key = `${STORAGE_KEY_PREFIX}${doctorId || "default"}`;
  try {
    localStorage.setItem(key, JSON.stringify(records));
    localStorage.setItem(`${STORAGE_KEY_PREFIX}default`, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent("pyr_patient_records_updated", { detail: { doctorId, count: records.length } }));
  } catch (e) {
    console.warn("[ProntuarioImportExport] Erro ao salvar registros locais:", e);
  }
}

export function DoctorProntuarioImportExportModal({
  open = false,
  onOpenChange,
  doctorId,
  doctorName,
  inline = false,
  onSelectPatientForConsultation,
}: DoctorProntuarioImportExportModalProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("consulta");
  const [records, setRecords] = useState<ImportedPatientRecord[]>(() => loadDoctorPatientRecords(doctorId));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ImportedPatientRecord | null>(null);
  const [attachedFilesLog, setAttachedFilesLog] = useState<{ name: string; count: number; date: string; platform: string }[]>([]);
  const [sourcePlatformInput, setSourcePlatformInput] = useState("iClinic / Doctoralia / Outra Plataforma");
  const [importing, setImporting] = useState(false);

  // Estado para edição / criação manual de prontuário/paciente
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formCpf, setFormCpf] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formCid, setFormCid] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formPlan, setFormPlan] = useState("");
  const [formMeds, setFormMeds] = useState("");

  // Carrega dados do banco Supabase (medical_records + appointments) e mescla com os importados
  useEffect(() => {
    const stored = loadDoctorPatientRecords(doctorId);
    setRecords(stored);

    const syncFromSupabase = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const targetDocId = doctorId || session.user.id;
        const { data: dbRecords } = await supabase
          .from("medical_records")
          .select("*")
          .eq("doctor_id", targetDocId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (dbRecords && dbRecords.length > 0) {
          const patientIds = Array.from(new Set(dbRecords.map((r: any) => r.patient_id).filter(Boolean)));
          let profilesMap: Record<string, any> = {};
          if (patientIds.length > 0) {
            const { data: profs } = await supabase
              .from("profiles")
              .select("id, full_name, cpf, phone, email")
              .in("id", patientIds);
            for (const p of profs || []) {
              profilesMap[p.id] = p;
            }
          }

          setRecords((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const merged = [...prev];
            for (const r of dbRecords as any[]) {
              if (existingIds.has(r.id)) continue;
              const prof = profilesMap[r.patient_id] || {};
              merged.push({
                id: r.id,
                name: prof.full_name || `Paciente #${String(r.patient_id || "").slice(0, 6)}`,
                cpf: prof.cpf ? formatCpf(prof.cpf) : "Não informado",
                phone: prof.phone || "",
                email: prof.email || "",
                diagnosisCid: r.diagnosis || "",
                clinicalNotes: r.notes || "",
                treatmentPlan: r.treatment_plan || "",
                sourcePlatform: "Planta y Raíz (Banco Oficial)",
                lastConsultationDate: r.created_at ? r.created_at.slice(0, 10) : "",
                createdAt: r.created_at || new Date().toISOString(),
              });
            }
            saveDoctorPatientRecords(merged, doctorId);
            return merged;
          });
        }
      } catch (err) {
        console.warn("[ProntuarioImportExport] Sync informativo:", err);
      }
    };

    syncFromSupabase();
  }, [doctorId]);

  // Filtro inteligente por NOME ou CPF (com ou sem pontuação)
  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    const qDigits = normalizeDigits(q);

    return records.filter((rec) => {
      const nameMatch = (rec.name || "").toLowerCase().includes(q);
      const cpfRawMatch = (rec.cpf || "").toLowerCase().includes(q);
      const cpfDigits = normalizeDigits(rec.cpf || "");
      const cpfDigitMatch = qDigits.length > 0 && cpfDigits.includes(qDigits);
      const cidMatch = (rec.diagnosisCid || "").toLowerCase().includes(q);
      const phoneMatch = qDigits.length >= 4 && normalizeDigits(rec.phone || "").includes(qDigits);
      return nameMatch || cpfRawMatch || cpfDigitMatch || cidMatch || phoneMatch;
    });
  }, [records, searchQuery]);

  // ─── Parser de Arquivos Importados (CSV, TSV, JSON, TXT) ───
  const parseCsvLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImporting(true);
    let totalImported = 0;
    const newRecords: ImportedPatientRecord[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileName = file.name;
        const ext = fileName.split(".").pop()?.toLowerCase() || "";
        const text = await file.text();

        if (ext === "json") {
          const parsed = JSON.parse(text);
          const arr = Array.isArray(parsed) ? parsed : (parsed.patients || parsed.records || parsed.data || [parsed]);
          for (const item of arr) {
            if (!item || typeof item !== "object") continue;
            const name = item.name || item.nome || item.full_name || item.paciente || item.patientName || "Paciente Importado";
            const cpf = formatCpf(item.cpf || item.documento || item.document || "");
            newRecords.push({
              id: item.id || `imp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: String(name).trim(),
              cpf,
              phone: String(item.phone || item.telefone || item.whatsapp || item.celular || ""),
              email: String(item.email || item.e_mail || ""),
              age: item.age || item.idade || "",
              birthDate: item.birthDate || item.data_nascimento || item.nascimento || "",
              diagnosisCid: String(item.diagnosisCid || item.cid || item.diagnostico || item.diagnosis || ""),
              clinicalNotes: String(item.clinicalNotes || item.prontuario || item.evolucao || item.anamnese || item.historico || item.notes || ""),
              treatmentPlan: String(item.treatmentPlan || item.conduta || item.plano || item.treatment_plan || ""),
              medications: String(item.medications || item.medicamentos || item.prescricao || item.receita || ""),
              sourcePlatform: item.sourcePlatform || sourcePlatformInput || "Importado JSON",
              attachedFileName: fileName,
              lastConsultationDate: item.lastConsultationDate || item.ultima_consulta || new Date().toISOString().slice(0, 10),
              createdAt: new Date().toISOString(),
            });
            totalImported++;
          }
        } else {
          // CSV, TSV ou TXT estruturado
          const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          if (lines.length > 0) {
            const firstLine = lines[0];
            const delimiter = firstLine.includes(";") ? ";" : firstLine.includes("\t") ? "\t" : ",";
            const headers = parseCsvLine(firstLine, delimiter).map((h) =>
              h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_]/g, "")
            );

            const hasHeader = headers.some((h) =>
              ["nome", "name", "paciente", "cpf", "telefone", "prontuario", "email"].some((k) => h.includes(k))
            );

            const startRow = hasHeader ? 1 : 0;
            for (let i = startRow; i < lines.length; i++) {
              const cols = parseCsvLine(lines[i], delimiter);
              if (cols.length === 0 || cols.every((c) => !c)) continue;

              const getByHeader = (keys: string[], fallbackIdx: number): string => {
                if (hasHeader) {
                  const idx = headers.findIndex((h) => keys.some((k) => h.includes(k)));
                  if (idx !== -1 && cols[idx] !== undefined) return cols[idx];
                }
                return cols[fallbackIdx] || "";
              };

              const name = getByHeader(["nome", "name", "paciente", "fullname"], 0) || `Paciente #${i}`;
              const cpf = formatCpf(getByHeader(["cpf", "documento", "doc"], 1));
              const phone = getByHeader(["telefone", "whatsapp", "celular", "phone", "fone"], 2);
              const email = getByHeader(["email", "mail"], 3);
              const age = getByHeader(["idade", "age", "nascimento"], 4);
              const cid = getByHeader(["cid", "diagnostico", "diagnosis", "patologia"], 5);
              const notes = getByHeader(["prontuario", "evolucao", "anamnese", "historico", "notes", "observac"], 6);
              const plan = getByHeader(["plano", "conduta", "tratamento", "prescricao", "medicamento", "receita"], 7);

              newRecords.push({
                id: `imp-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
                name,
                cpf,
                phone,
                email,
                age,
                diagnosisCid: cid,
                clinicalNotes: notes || `Prontuário anexado via arquivo ${fileName}`,
                treatmentPlan: plan,
                medications: plan,
                sourcePlatform: sourcePlatformInput || "Outra Plataforma",
                attachedFileName: fileName,
                lastConsultationDate: new Date().toISOString().slice(0, 10),
                createdAt: new Date().toISOString(),
              });
              totalImported++;
            }
          }
        }

        setAttachedFilesLog((prev) => [
          {
            name: fileName,
            count: totalImported,
            date: new Date().toLocaleString("pt-BR"),
            platform: sourcePlatformInput,
          },
          ...prev,
        ]);
      }

      if (newRecords.length > 0) {
        const updated = [...newRecords, ...records];
        setRecords(updated);
        saveDoctorPatientRecords(updated, doctorId);
        toast.success(`✅ ${newRecords.length} paciente(s) e prontuário(s) importados com sucesso!`, {
          description: "Você já pode consultar por Nome ou CPF na aba de Busca.",
        });
        setActiveTab("consulta");
      } else {
        toast.warning("Nenhum registro válido encontrado no arquivo. Verifique o modelo CSV/JSON.");
      }
    } catch (err: any) {
      console.error("[Import Error]", err);
      toast.error("Erro ao importar arquivo: " + (err.message || "Verifique o formato do arquivo."));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ─── Exportação Completa (CSV para Excel + JSON Backup + Modelo) ───
  const handleExportCSV = () => {
    if (records.length === 0) {
      toast.warning("Não há prontuários para exportar.");
      return;
    }

    const headers = [
      "Nome Completo",
      "CPF",
      "Telefone_WhatsApp",
      "Email",
      "Idade",
      "CID_Diagnostico",
      "Prontuario_Anamnese_Evolucao",
      "Plano_Terapeutico_Prescricao",
      "Plataforma_Origem",
      "Ultima_Consulta",
    ];

    const escapeCsv = (val: any) => {
      const s = String(val ?? "").replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = records.map((r) =>
      [
        r.name,
        r.cpf,
        r.phone || "",
        r.email || "",
        r.age || "",
        r.diagnosisCid || "",
        r.clinicalNotes || "",
        r.treatmentPlan || r.medications || "",
        r.sourcePlatform || "Planta y Raíz",
        r.lastConsultationDate || "",
      ]
        .map(escapeCsv)
        .join(";")
    );

    // BOM UTF-8 (\uFEFF) garante que o Excel no Windows abra acentos perfeitamente
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prontuario_pacientes_plantayraiz_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`📥 Prontuário e lista de ${records.length} pacientes exportados em CSV (Excel)!`);
  };

  const handleExportJSON = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      platform: "Planta y Raíz — Consultório Virtual Médico",
      doctorName: doctorName || "Médico Prescritor",
      totalPatients: records.length,
      patients: records,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_prontuario_medico_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("📥 Backup completo do prontuário exportado em JSON!");
  };

  const handleDownloadSampleTemplate = () => {
    const sample =
      "\uFEFFNome Completo;CPF;Telefone_WhatsApp;Email;Idade;CID_Diagnostico;Prontuario_Anamnese_Evolucao;Plano_Terapeutico_Prescricao;Plataforma_Origem\r\n" +
      '"Ana Beatriz Souza";"111.222.333-44";"(11) 99999-1111";"ana@email.com";"42";"G43 - Enxaqueca Crônica";"Paciente trazida do consultório externo. Uso prévio de topiramato sem sucesso.";"Óleo CBD Full Spectrum 10% - 4 gotas 12/12h";"iClinic"\r\n' +
      '"Roberto Mendes";"555.666.777-88";"(21) 98888-2222";"roberto@email.com";"59";"G20 - Doença de Parkinson";"Rigidez moderada e insônia. Boa tolerância a canabinoides.";"CBD:THC 20:1 - 5 gotas 3x ao dia";"Doctoralia"\r\n';
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_importacao_pacientes_plantayraiz.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.info("Modelo de planilha CSV baixado! Preencha e anexe na aba Importar.");
  };

  // ─── Salvar / Atualizar Paciente & Prontuário Manualmente ───
  const handleSaveManualRecord = async () => {
    if (!formName.trim()) {
      toast.error("Informe pelo menos o nome do paciente.");
      return;
    }

    const formattedCpf = formCpf ? formatCpf(formCpf) : "Não informado";
    const newRec: ImportedPatientRecord = {
      id: editingId || `manual-${Date.now()}`,
      name: formName.trim(),
      cpf: formattedCpf,
      phone: formPhone.trim(),
      email: formEmail.trim(),
      age: formAge.trim() || undefined,
      diagnosisCid: formCid.trim(),
      clinicalNotes: formNotes.trim(),
      treatmentPlan: formPlan.trim(),
      medications: formMeds.trim() || formPlan.trim(),
      sourcePlatform: sourcePlatformInput || "Cadastro Direto Consultório",
      lastConsultationDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };

    const updated = editingId
      ? records.map((r) => (r.id === editingId ? newRec : r))
      : [newRec, ...records];

    setRecords(updated);
    saveDoctorPatientRecords(updated, doctorId);

    // Tenta persistir também em medical_records se houver sessão ativa
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && formNotes.trim()) {
        await supabase.from("medical_records").insert({
          doctor_id: session.user.id,
          patient_id: session.user.id,
          notes: `[Paciente: ${newRec.name} | CPF: ${newRec.cpf}] ${newRec.clinicalNotes}`,
          diagnosis: newRec.diagnosisCid || null,
          treatment_plan: newRec.treatmentPlan || null,
        });
      }
    } catch {}

    toast.success(editingId ? "✅ Prontuário atualizado com sucesso!" : "✅ Paciente e prontuário cadastrados na sua lista!");
    resetForm();
    setActiveTab("consulta");
  };

  const resetForm = () => {
    setEditingId(null);
    setFormName("");
    setFormCpf("");
    setFormPhone("");
    setFormEmail("");
    setFormAge("");
    setFormCid("");
    setFormNotes("");
    setFormPlan("");
    setFormMeds("");
  };

  const handleEditRecord = (rec: ImportedPatientRecord) => {
    setEditingId(rec.id);
    setFormName(rec.name);
    setFormCpf(rec.cpf === "Não informado" ? "" : rec.cpf);
    setFormPhone(rec.phone || "");
    setFormEmail(rec.email || "");
    setFormAge(rec.age ? String(rec.age) : "");
    setFormCid(rec.diagnosisCid || "");
    setFormNotes(rec.clinicalNotes || "");
    setFormPlan(rec.treatmentPlan || "");
    setFormMeds(rec.medications || "");
    setActiveTab("novo");
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    saveDoctorPatientRecords(updated, doctorId);
    if (selectedRecord?.id === id) setSelectedRecord(null);
    toast.info("Registro removido da lista local.");
  };

  const handleStartVideoWithPatient = (rec: ImportedPatientRecord) => {
    if (onSelectPatientForConsultation) {
      onSelectPatientForConsultation(rec);
    }
    if (onOpenChange) onOpenChange(false);
    navigate(`/workspace-medico?patient=${encodeURIComponent(rec.id)}&appt=appt-${encodeURIComponent(rec.id)}&type=video&name=${encodeURIComponent(rec.name)}&cpf=${encodeURIComponent(rec.cpf)}`);
  };

  const content = (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-auto p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="consulta" className="py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <Search size={15} /> Consultar Nome / CPF ({records.length})
          </TabsTrigger>
          <TabsTrigger value="importar-exportar" className="py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <FolderUp size={15} /> Importar / Exportar Lista
          </TabsTrigger>
          <TabsTrigger value="novo" className="py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5">
            <UserPlus size={15} /> {editingId ? "Editar Prontuário" : "Adicionar Paciente"}
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════════
            ABA 1: CONSULTA POR NOME OU CPF + PRONTUÁRIO E VÍDEO
            ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="consulta" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary h-4 w-4" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar paciente por Nome Completo, CPF (com ou sem pontos), CID ou Telefone..."
                className="pl-10 h-11 rounded-xl border-primary/40 bg-background font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={() => setActiveTab("importar-exportar")}
                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-xl"
              >
                <Paperclip size={15} className="mr-1.5" /> Anexar Lista
              </Button>
              <Button
                onClick={handleExportCSV}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
              >
                <Download size={15} className="mr-1.5" /> Exportar CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Lista de Pacientes Filtrados */}
            <div className="lg:col-span-7">
              <ScrollArea className="h-[380px] pr-2">
                {filteredRecords.length === 0 ? (
                  <Card className="border-dashed border-2 p-8 text-center">
                    <FileText className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                    <p className="font-bold text-sm text-foreground">Nenhum paciente encontrado para "{searchQuery}"</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Verifique o Nome ou CPF digitado ou anexe sua lista de pacientes de outra plataforma.
                    </p>
                    <Button
                      size="sm"
                      className="mt-4 bg-primary font-bold"
                      onClick={() => setActiveTab("importar-exportar")}
                    >
                      <Upload size={14} className="mr-1.5" /> Importar Lista de Pacientes
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-2.5">
                    {filteredRecords.map((rec) => {
                      const isSelected = selectedRecord?.id === rec.id;
                      return (
                        <Card
                          key={rec.id}
                          onClick={() => setSelectedRecord(rec)}
                          className={`p-3.5 cursor-pointer transition-all rounded-xl border ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                              : "border-border hover:border-primary/40 bg-card/70"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-foreground truncate">{rec.name}</span>
                                <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                                  CPF: {rec.cpf}
                                </Badge>
                                {rec.sourcePlatform && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {rec.sourcePlatform}
                                  </Badge>
                                )}
                              </div>

                              {rec.diagnosisCid && (
                                <p className="text-xs text-emerald-400 font-semibold mt-1 truncate">
                                  🩺 {rec.diagnosisCid}
                                </p>
                              )}

                              {rec.clinicalNotes && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {rec.clinicalNotes}
                                </p>
                              )}

                              <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
                                {rec.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone size={11} /> {rec.phone}
                                  </span>
                                )}
                                {rec.lastConsultationDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar size={11} /> Última: {rec.lastConsultationDate}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                className="h-8 px-3 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartVideoWithPatient(rec);
                                }}
                              >
                                <Video size={13} className="mr-1" /> Vídeo
                              </Button>
                              {onSelectPatientForConsultation && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2.5 text-[11px] font-bold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectPatientForConsultation(rec);
                                    if (onOpenChange) onOpenChange(false);
                                    toast.success(`Prontuário de ${rec.name} carregado na tela de atendimento!`);
                                  }}
                                >
                                  <Stethoscope size={12} className="mr-1" /> Atender
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Painel de Visualização Rápida do Prontuário Selecionado */}
            <div className="lg:col-span-5">
              {selectedRecord ? (
                <Card className="border-primary/40 bg-card h-[380px] flex flex-col justify-between p-4 rounded-xl">
                  <div className="space-y-3 overflow-y-auto pr-1">
                    <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                      <div>
                        <h3 className="font-black text-base text-foreground">{selectedRecord.name}</h3>
                        <p className="text-xs font-mono text-primary font-bold">CPF: {selectedRecord.cpf}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleEditRecord(selectedRecord)}
                          title="Editar Prontuário"
                        >
                          <Edit3 size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteRecord(selectedRecord.id)}
                          title="Excluir da Lista"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-muted/40">
                        <span className="text-muted-foreground block text-[10px]">Telefone / WhatsApp</span>
                        <span className="font-semibold">{selectedRecord.phone || "—"}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-muted/40">
                        <span className="text-muted-foreground block text-[10px]">Origem do Prontuário</span>
                        <span className="font-semibold">{selectedRecord.sourcePlatform || "Planta y Raíz"}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase text-primary block mb-1">
                        Diagnóstico / CID
                      </span>
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border text-xs font-medium">
                        {selectedRecord.diagnosisCid || "Sem CID registrado"}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase text-primary block mb-1">
                        Histórico Clínico / Evolução do Prontuário
                      </span>
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border text-xs whitespace-pre-wrap leading-relaxed">
                        {selectedRecord.clinicalNotes || "Sem anotações clínicas."}
                      </div>
                    </div>

                    {selectedRecord.treatmentPlan && (
                      <div>
                        <span className="text-[11px] font-bold uppercase text-emerald-400 block mb-1">
                          Prescrição / Plano Terapêutico
                        </span>
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs">
                          {selectedRecord.treatmentPlan}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border flex flex-col sm:flex-row gap-2">
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
                      onClick={() => handleStartVideoWithPatient(selectedRecord)}
                    >
                      <Video size={14} className="mr-1.5" /> Iniciar Consulta por Vídeo
                    </Button>
                    <Button
                      variant="outline"
                      className="font-bold text-xs rounded-xl"
                      onClick={() => handleEditRecord(selectedRecord)}
                    >
                      <Edit3 size={14} className="mr-1.5" /> Evoluir Prontuário
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="border-dashed border-2 h-[380px] flex flex-col items-center justify-center p-6 text-center text-muted-foreground rounded-xl">
                  <Stethoscope className="h-12 w-12 mb-3 opacity-30 text-primary" />
                  <p className="font-bold text-sm text-foreground">Selecione um paciente ao lado</p>
                  <p className="text-xs mt-1 max-w-xs">
                    Clique em qualquer paciente da lista para visualizar o prontuário completo, evoluir a consulta ou iniciar o atendimento por vídeo.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════
            ABA 2: IMPORTAR (ANEXAR LISTA DE OUTRAS PLATAFORMAS) E EXPORTAR
            ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="importar-exportar" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card de Importação / Anexo */}
            <Card className="border-primary/40 bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                  <Upload className="text-emerald-400" size={20} />
                  Importar Pacientes & Prontuários de Outras Plataformas
                </CardTitle>
                <CardDescription className="text-xs">
                  Traga sua carteira de pacientes e prontuários (iClinic, Doctoralia, Feegow, HiDoctor, Amplimed ou Planilhas Excel/CSV/JSON).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Plataforma de Origem (Opcional)</Label>
                  <Input
                    value={sourcePlatformInput}
                    onChange={(e) => setSourcePlatformInput(e.target.value)}
                    placeholder="Ex: iClinic, Doctoralia, Feegow, Consultório Particular..."
                    className="h-9 text-xs rounded-lg"
                  />
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-emerald-500/50 hover:border-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all rounded-2xl p-6 text-center cursor-pointer"
                >
                  <Paperclip className="mx-auto h-9 w-9 text-emerald-400 mb-2" />
                  <p className="font-bold text-sm text-foreground">
                    {importing ? "Processando arquivo..." : "Clique aqui para Anexar sua Lista de Pacientes / Prontuário"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formatos aceitos: <strong>.CSV (Excel), .JSON, .TXT, .TSV</strong> (identificação automática de Nome, CPF, Telefone e Prontuário)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.json,.txt,.tsv"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadSampleTemplate}
                    className="text-xs font-bold rounded-lg"
                  >
                    <FileSpreadsheet size={14} className="mr-1.5 text-emerald-400" />
                    Baixar Planilha Modelo (.CSV)
                  </Button>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-400" /> Sigilo Médico CFM & LGPD
                  </span>
                </div>

                {attachedFilesLog.length > 0 && (
                  <div className="pt-2 border-t border-border space-y-1.5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase">Arquivos Anexados Nesta Sessão:</p>
                    {attachedFilesLog.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-muted/40 px-2.5 py-1.5 rounded-lg">
                        <span className="font-semibold truncate">{f.name}</span>
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">+{f.count} importados</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card de Exportação */}
            <Card className="border-border bg-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                  <Download className="text-blue-400" size={20} />
                  Exportar Meu Prontuário Médico & Lista de Pacientes
                </CardTitle>
                <CardDescription className="text-xs">
                  Exporte a qualquer momento toda a sua base de pacientes e evoluções clínicas com total portabilidade e autonomia médica.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-semibold">Total de Pacientes no Consultório:</span>
                    <Badge className="bg-primary/20 text-primary font-black">{records.length} pacientes</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Inclui Nome Completo, CPF, Telefone/WhatsApp, Diagnóstico CID, Histórico Clínico e Prescrições.
                  </p>
                </div>

                <Button
                  onClick={handleExportCSV}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl justify-start px-4"
                >
                  <FileSpreadsheet size={18} className="mr-3 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs sm:text-sm font-extrabold">Exportar Lista & Prontuários em Excel (.CSV)</div>
                    <div className="text-[10px] opacity-85 font-normal">Compatível com Microsoft Excel, Google Sheets e outros sistemas</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleExportJSON}
                  className="w-full h-11 border-blue-500/40 text-blue-400 hover:bg-blue-500/10 font-bold rounded-xl justify-start px-4"
                >
                  <FileText size={18} className="mr-3 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs sm:text-sm font-extrabold">Exportar Backup Completo (.JSON)</div>
                    <div className="text-[10px] opacity-85 font-normal">Formato estruturado para interoperabilidade entre sistemas médicos</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════
            ABA 3: CADASTRAR / EDITAR PACIENTE E PRONTUÁRIO MANUALMENTE
            ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="novo" className="space-y-4 mt-4">
          <Card className="border-border bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <UserPlus className="text-primary" size={18} />
                {editingId ? "Editar Prontuário do Paciente" : "Cadastrar Paciente & Prontuário Manualmente"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-xs font-bold">Nome Completo do Paciente *</Label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Maria Aparecida Souza"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">CPF do Paciente *</Label>
                  <Input
                    value={formCpf}
                    onChange={(e) => setFormCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Telefone / WhatsApp</Label>
                  <Input
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">E-mail</Label>
                  <Input
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="paciente@email.com"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Idade</Label>
                  <Input
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    placeholder="Ex: 42"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Diagnóstico / CID-10</Label>
                  <Input
                    value={formCid}
                    onChange={(e) => setFormCid(e.target.value)}
                    placeholder="Ex: G47.0 / F41.1"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Histórico Clínico / Anamnese / Evolução do Prontuário</Label>
                <Textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Descreva a história clínica, queixas principais, tratamentos prévios e evolução do paciente..."
                  className="min-h-[90px] text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">Plano Terapêutico / Prescrição Atual</Label>
                <Textarea
                  value={formPlan}
                  onChange={(e) => setFormPlan(e.target.value)}
                  placeholder="Ex: Óleo CBD Full Spectrum 10% — iniciar com 3 gotas de 12/12h..."
                  className="min-h-[65px] text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {editingId && (
                  <Button variant="outline" onClick={resetForm} className="rounded-xl text-xs font-bold">
                    Cancelar Edição
                  </Button>
                )}
                <Button onClick={handleSaveManualRecord} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl">
                  <Save size={15} className="mr-1.5" />
                  {editingId ? "Salvar Alterações no Prontuário" : "Salvar Paciente na Lista"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (inline) {
    return (
      <Card className="border-border bg-card shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-black flex items-center gap-2 text-foreground">
                <FolderUp className="text-emerald-400" size={22} />
                Gestão de Prontuários & Pacientes (Importar / Exportar / Busca por Nome ou CPF)
              </CardTitle>
              <CardDescription className="text-xs">
                Traga sua lista de pacientes de outras plataformas, consulte por Nome ou CPF e exporte seus prontuários em 1 clique.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">{content}</CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-2 text-foreground">
            <FolderUp className="text-emerald-400" size={22} />
            Prontuário Médico & Lista de Pacientes (Importar / Exportar / Busca Nome ou CPF)
          </DialogTitle>
          <DialogDescription className="text-xs">
            Anexe sua lista de pacientes trazida de outras plataformas, pesquise por Nome ou CPF e inicie consultas por vídeo imediatamente.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
export default DoctorProntuarioImportExportModal;
