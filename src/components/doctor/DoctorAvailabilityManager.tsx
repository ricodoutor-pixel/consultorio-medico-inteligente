import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Loader2, Save, CalendarRange, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";

const DAYS_OF_WEEK = [
  { id: 1, label: "Segunda-feira" },
  { id: 2, label: "Terça-feira" },
  { id: 3, label: "Quarta-feira" },
  { id: 4, label: "Quinta-feira" },
  { id: 5, label: "Sexta-feira" },
  { id: 6, label: "Sábado" },
  { id: 0, label: "Domingo" },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00"
];

export function DoctorAvailabilityManager() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [activeDays, setActiveDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default Mon-Fri
  const [activeSlots, setActiveSlots] = useState<string[]>(["09:00", "09:30", "10:00", "10:30", "14:00", "14:30", "15:00", "15:30"]);

  useEffect(() => {
    fetchDoctor();
  }, []);

  const fetchDoctor = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data, error } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
        
      if (data) {
        setDoctorId(data.id);
      }
    } catch (e) {
      console.error("Error fetching doctor:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayId: number) => {
    setActiveDays(prev => 
      prev.includes(dayId) ? prev.filter(id => id !== dayId) : [...prev, dayId]
    );
  };

  const toggleSlot = (slot: string) => {
    setActiveSlots(prev => 
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const generateAvailability = async () => {
    if (!doctorId) {
      toast.error("Perfil de médico não encontrado. Atualize seus dados primeiro.");
      return;
    }
    if (activeDays.length === 0 || activeSlots.length === 0) {
      toast.error("Selecione pelo menos um dia e um horário.");
      return;
    }

    setGenerating(true);
    try {
      const today = new Date();
      const slotsToInsert = [];

      // Generate for the next 30 days
      for (let i = 1; i <= 30; i++) {
        const currentDate = addDays(today, i);
        const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 1 is Monday

        if (activeDays.includes(dayOfWeek)) {
          const dateStr = format(currentDate, "yyyy-MM-dd");
          for (const timeSlot of activeSlots) {
            slotsToInsert.push({
              doctor_id: doctorId,
              slot_date: dateStr,
              time_slot: timeSlot,
              status: "available"
            });
          }
        }
      }

      if (slotsToInsert.length === 0) {
         toast.error("Nenhum horário gerado com as configurações atuais.");
         setGenerating(false);
         return;
      }

      // Upsert via Supabase (handles duplicate entries via the UNIQUE constraint automatically)
      const { error } = await supabase.from("doctor_availability").upsert(
        slotsToInsert, 
        { onConflict: 'doctor_id,slot_date,time_slot', ignoreDuplicates: true }
      );

      if (error) throw error;

      toast.success(`${slotsToInsert.length} horários disponibilizados com sucesso na sua agenda!`);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao gerar disponibilidade: " + (err.message || "Tente novamente."));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return null;

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mt-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 text-white">
          <CalendarRange className="text-emerald-400" size={22} />
          Disponibilidade Semanal (Abertura de Horários)
        </CardTitle>
        <CardDescription className="text-slate-400">
          Configure seus dias e horários padrão. O sistema abrirá automaticamente sua agenda para os próximos 30 dias com base nesta regra, permitindo que os pacientes encontrem horários livres para consultas e retornos.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-sm text-emerald-300 flex gap-3 items-start">
          <Info size={18} className="mt-0.5 shrink-0" />
          <p>
            Manter sua grade aberta aumenta em até <strong>60%</strong> as taxas de novas consultas na plataforma e melhora seu rankeamento interno.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-slate-400" /> Dias da Semana
          </h3>
          <div className="flex flex-wrap gap-3">
            {DAYS_OF_WEEK.map(day => (
              <Label 
                key={day.id} 
                className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                  activeDays.includes(day.id) 
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-medium" 
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500"
                }`}
              >
                <Checkbox 
                  checked={activeDays.includes(day.id)} 
                  onCheckedChange={() => toggleDay(day.id)}
                  className="hidden" // hide actual checkbox visually, keep functionality
                />
                {day.label}
              </Label>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-white flex items-center gap-2 text-sm">
            <Clock size={16} className="text-slate-400" /> Horários de Atendimento (Por Dia)
          </h3>
          <div className="flex flex-wrap gap-2">
            {TIME_SLOTS.map(slot => (
              <Label 
                key={slot} 
                className={`flex items-center justify-center px-3 py-1.5 rounded-md border text-sm cursor-pointer transition-colors ${
                  activeSlots.includes(slot)
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 font-medium" 
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500"
                }`}
              >
                <Checkbox 
                  checked={activeSlots.includes(slot)} 
                  onCheckedChange={() => toggleSlot(slot)}
                  className="hidden"
                />
                {slot}
              </Label>
            ))}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button 
            onClick={generateAvailability} 
            disabled={generating || activeDays.length === 0 || activeSlots.length === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando Horários...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Aplicar Grade e Abrir Horários (30 dias)</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
