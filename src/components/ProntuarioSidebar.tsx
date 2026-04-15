import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Save, Shield, X, Search, Pill, Stethoscope, ClipboardList, Globe, ShoppingCart, Loader2 } from "lucide-react";
import { AITriagePreFill } from "@/components/doctor/AITriagePreFill";
import { useToast } from "@/hooks/use-toast";
import { CID10_TO_ICD11_MAP, ICD11_CODES } from "@/data/icd11";
import { usePrescriptionCart } from "@/hooks/usePrescriptionCart";
import { supabase } from "@/integrations/supabase/client";

const CID10_COMMON = [
  { code: "F41.1", name: "Ansiedade generalizada" },
  { code: "F32.0", name: "Episódio depressivo leve" },
  { code: "F32.1", name: "Episódio depressivo moderado" },
  { code: "G43.0", name: "Enxaqueca sem aura" },
  { code: "G40.0", name: "Epilepsia idiopática" },
  { code: "R52", name: "Dor não classificada" },
  { code: "M54.5", name: "Dor lombar baixa" },
  { code: "G47.0", name: "Insônia" },
  { code: "F90.0", name: "TDAH" },
  { code: "G20", name: "Doença de Parkinson" },
  { code: "M79.7", name: "Fibromialgia" },
  { code: "F43.1", name: "TEPT" },
  { code: "K58", name: "Síndrome do intestino irritável" },
  { code: "G35", name: "Esclerose múltipla" },
  { code: "N94.6", name: "Dismenorreia" },
];

interface ProntuarioSidebarProps {
  appointmentId?: string | null;
  patientId?: string | null;
  onClose: () => void;
  onSave?: (data: ProntuarioData) => void;
}

export interface ProntuarioData {
  chiefComplaint: string;
  history: string;
  examination: string;
  diagnosisCid: string;
  diagnosisText: string;
  treatmentPlan: string;
  medications: string;
  notes: string;
}

export const ProntuarioSidebar = ({ onClose, onSave, patientId }: ProntuarioSidebarProps) => {
  const { toast } = useToast();
  const { loading: cartLoading, createCartFromPrescription } = usePrescriptionCart();
  const [cidSearch, setCidSearch] = useState("");
  const [data, setData] = useState<ProntuarioData>({
    chiefComplaint: "",
    history: "",
    examination: "",
    diagnosisCid: "",
    diagnosisText: "",
    treatmentPlan: "",
    medications: "",
    notes: "",
  });

  const filteredCid = cidSearch.length >= 2
    ? CID10_COMMON.filter(c =>
        c.code.toLowerCase().includes(cidSearch.toLowerCase()) ||
        c.name.toLowerCase().includes(cidSearch.toLowerCase())
      )
    : [];

  const selectCid = (code: string, name: string) => {
    setData(p => ({ ...p, diagnosisCid: code, diagnosisText: name }));
    setCidSearch("");
  };

  const handleSave = () => {
    onSave?.(data);
    toast({ title: "Prontuário salvo ✅", description: "Registro clínico atualizado com sucesso." });
  };

  const handleSign = () => {
    toast({ 
      title: "Assinatura Digital ICP-Brasil 🔐", 
      description: "Integração com certificado e-CPF A3/Nuvem necessária para assinatura qualificada." 
    });
  };

  const handleGenerateCart = async () => {
    if (!data.medications.trim()) {
      toast({ title: "Prescrição vazia", description: "Preencha as medicações antes de gerar o carrinho.", variant: "destructive" });
      return;
    }

    // Parse medications into cart items
    const items = data.medications.split("\n").filter(Boolean).map(line => ({
      product_name: line.trim(),
      quantity: 1,
      dosage: line.trim(),
    }));

    // Generate a pseudo prescription ID from the current session
    const prescriptionId = crypto.randomUUID();
    const doctorId = "current";
    const pid = patientId || "unknown";

    const result = await createCartFromPrescription(prescriptionId, doctorId, pid, items);
    
    // Dispatch WhatsApp notification with cart link
    if (result?.cart_token) {
      const cartUrl = `${window.location.origin}/checkout/${result.cart_token}`;
      const patientPhone = localStorage.getItem("pr_lead_phone") || "";
      const patientName = localStorage.getItem("pr_lead_name") || "paciente";
      
      try {
        await supabase.functions.invoke("whatsapp-cart-notify", {
          body: {
            action: "cart_ready",
            patient_phone: patientPhone,
            patient_name: patientName,
            cart_url: cartUrl,
            cart_token: result.cart_token,
          },
        });
        toast({ title: "WhatsApp enviado!", description: "Link do carrinho enviado ao paciente." });
      } catch {
        // Non-blocking: cart was still created
        console.warn("WhatsApp notify failed, cart still created");
      }
    }
  };

  return (
    <div className="w-80 lg:w-96 border-l border-border bg-card flex flex-col shrink-0 h-full">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-bold text-foreground flex items-center gap-2">
          <ClipboardList size={14} className="text-primary" /> Prontuário Eletrônico (PEP)
        </span>
        <Button variant="ghost" size="sm" onClick={onClose}><X size={14} /></Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {/* AI Pre-fill from triage */}
          {patientId && (
            <AITriagePreFill
              patientId={patientId}
              onApply={(prefill) => setData((p) => ({ ...p, ...prefill }))}
            />
          )}

          {/* Queixa Principal */}
          <div>
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1">
              <Stethoscope size={10} /> Queixa Principal (QP)
            </label>
            <Input
              value={data.chiefComplaint}
              onChange={(e) => setData(p => ({ ...p, chiefComplaint: e.target.value }))}
              placeholder="Ex: Dor crônica há 6 meses..."
              className="bg-muted border-border text-xs"
            />
          </div>

          {/* HDA */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">
              📋 História da Doença Atual (HDA)
            </label>
            <Textarea
              value={data.history}
              onChange={(e) => setData(p => ({ ...p, history: e.target.value }))}
              placeholder="Descreva a evolução dos sintomas..."
              className="bg-muted border-border text-xs min-h-[80px]"
            />
          </div>

          {/* Exame */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">
              🔍 Exame Clínico (observações via vídeo)
            </label>
            <Textarea
              value={data.examination}
              onChange={(e) => setData(p => ({ ...p, examination: e.target.value }))}
              placeholder="Aspecto geral, estado emocional..."
              className="bg-muted border-border text-xs min-h-[60px]"
            />
          </div>

          {/* CID-10 */}
          <div>
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1">
              <Search size={10} /> Diagnóstico (CID-10)
            </label>
            <Input
              value={cidSearch}
              onChange={(e) => setCidSearch(e.target.value)}
              placeholder="Buscar CID-10..."
              className="bg-muted border-border text-xs"
            />
            {filteredCid.length > 0 && (
              <div className="mt-1 space-y-0.5 max-h-28 overflow-y-auto border border-border rounded-lg p-1">
                {filteredCid.map(c => (
                  <div
                    key={c.code}
                    onClick={() => selectCid(c.code, c.name)}
                    className="flex items-center justify-between p-1.5 rounded text-xs cursor-pointer hover:bg-muted transition-colors"
                  >
                    <span className="font-mono font-bold text-primary">{c.code}</span>
                    <span className="text-muted-foreground text-right text-[10px]">{c.name}</span>
                  </div>
                ))}
              </div>
            )}
            {data.diagnosisCid && (
              <div className="mt-1.5 space-y-1">
                <Badge variant="outline" className="text-[10px] border-primary/30">
                  CID-10: {data.diagnosisCid} — {data.diagnosisText}
                </Badge>
                {CID10_TO_ICD11_MAP[data.diagnosisCid] && (
                  <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-600 flex items-center gap-1">
                    <Globe size={8} /> ICD-11: {CID10_TO_ICD11_MAP[data.diagnosisCid]} — {
                      ICD11_CODES.find(c => c.code === CID10_TO_ICD11_MAP[data.diagnosisCid])?.name_pt || ""
                    }
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Conduta */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">
              💊 Conduta Terapêutica
            </label>
            <Textarea
              value={data.treatmentPlan}
              onChange={(e) => setData(p => ({ ...p, treatmentPlan: e.target.value }))}
              placeholder="Plano de tratamento..."
              className="bg-muted border-border text-xs min-h-[60px]"
            />
          </div>

          {/* Medicações */}
          <div>
            <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1">
              <Pill size={10} /> Prescrição / Medicações
            </label>
            <Textarea
              value={data.medications}
              onChange={(e) => setData(p => ({ ...p, medications: e.target.value }))}
              placeholder="CBD Full Spectrum 3000mg — 0,5mL 2x/dia sublingual..."
              className="bg-muted border-border text-xs min-h-[60px]"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">
              📝 Observações Adicionais
            </label>
            <Textarea
              value={data.notes}
              onChange={(e) => setData(p => ({ ...p, notes: e.target.value }))}
              placeholder="Notas internas..."
              className="bg-muted border-border text-xs min-h-[40px]"
            />
          </div>

          <p className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded-lg">
            ⚠️ Registro obrigatório conforme CFM Res. 2.314/2022, Art. 7º. 
            Inclui: data/hora, meio utilizado, CRM, CID-10, conduta e orientações.
          </p>
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border space-y-2">
        <Button className="w-full bg-primary text-primary-foreground font-bold text-xs" onClick={handleSave}>
          <Save size={14} className="mr-1" /> Salvar Prontuário
        </Button>
        <Button
          variant="outline"
          className="w-full text-xs border-primary/30 text-primary hover:bg-primary/10"
          onClick={handleGenerateCart}
          disabled={cartLoading || !data.medications.trim()}
        >
          {cartLoading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <ShoppingCart size={14} className="mr-1" />}
          Gerar Carrinho One-Click
        </Button>
        <Button variant="outline" className="w-full text-xs" onClick={handleSign}>
          <Shield size={14} className="mr-1" /> Assinar Digitalmente (ICP-Brasil)
        </Button>
      </div>
    </div>
  );
};
