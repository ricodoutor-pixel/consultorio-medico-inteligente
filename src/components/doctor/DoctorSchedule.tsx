import { useState } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, Video, MessageSquare, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  date: Date;
  type: "video" | "chat" | "retorno";
  status: "scheduled" | "completed" | "cancelled";
}

// Mock data generator for today, this week, this month
const generateMockAppointments = (): Appointment[] => {
  const today = new Date();
  const appointments: Appointment[] = [];
  
  // Today's appointments
  appointments.push({
    id: "appt-1",
    patientName: "João Silva",
    patientId: "pat-1",
    date: new Date(today.setHours(9, 0, 0, 0)),
    type: "video",
    status: "scheduled"
  });
  appointments.push({
    id: "appt-2",
    patientName: "Maria Santos",
    patientId: "pat-2",
    date: new Date(today.setHours(10, 30, 0, 0)),
    type: "chat",
    status: "scheduled"
  });
  appointments.push({
    id: "appt-3",
    patientName: "Carlos Pereira",
    patientId: "pat-3",
    date: new Date(today.setHours(14, 0, 0, 0)),
    type: "retorno",
    status: "scheduled"
  });

  // Tomorrow
  const tomorrow = addDays(new Date(), 1);
  appointments.push({
    id: "appt-4",
    patientName: "Ana Clara",
    patientId: "pat-4",
    date: new Date(tomorrow.setHours(11, 0, 0, 0)),
    type: "video",
    status: "scheduled"
  });

  return appointments;
};

export const DoctorSchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments] = useState<Appointment[]>(generateMockAppointments());
  const navigate = useNavigate();

  const handleStartConsultation = (appt: Appointment) => {
    navigate(`/workspace-medico?patient=${appt.patientId}&appt=${appt.id}&type=${appt.type}`);
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(a => isSameDay(a.date, date)).sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const dayAppointments = getAppointmentsForDate(selectedDate);
  const weekStart = startOfWeek(selectedDate, { locale: ptBR });
  const weekEnd = endOfWeek(selectedDate, { locale: ptBR });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <Card className="w-full bg-card shadow-sm border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <CalendarIcon className="text-primary" size={24} /> 
          Agendamentos e Compromissos
        </CardTitle>
        <CardDescription>
          Gerencie sua agenda do consultório virtual.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="day" className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <TabsList className="grid w-full sm:w-[400px] grid-cols-3">
              <TabsTrigger value="day">Dia</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
                <ChevronLeft size={16} />
              </Button>
              <div className="text-sm font-semibold w-32 text-center capitalize">
                {format(selectedDate, "dd 'de' MMM", { locale: ptBR })}
              </div>
              <Button variant="outline" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>

          <TabsContent value="day" className="mt-0">
            <ScrollArea className="h-[400px] pr-4">
              {dayAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <CalendarIcon size={48} className="mb-4 opacity-20" />
                  <p>Nenhum paciente agendado para este dia.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayAppointments.map(appt => (
                    <div key={appt.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center bg-primary/10 text-primary w-14 h-14 rounded-lg font-bold">
                          <span className="text-lg">{format(appt.date, "HH:mm")}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <User size={16} className="text-muted-foreground" />
                            {appt.patientName}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {appt.type === "video" ? <Video size={10} className="mr-1"/> : <MessageSquare size={10} className="mr-1"/>}
                              {appt.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={12} /> 30 min
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => handleStartConsultation(appt)} className="bg-primary/90 hover:bg-primary">
                        Atender
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="week" className="mt-0">
            <div className="grid grid-cols-7 gap-2">
              {daysInWeek.map(day => {
                const appts = getAppointmentsForDate(day);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                return (
                  <div 
                    key={day.toString()} 
                    onClick={() => setSelectedDate(day)}
                    className={`flex flex-col border rounded-xl p-2 min-h-[120px] cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-muted/50'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs uppercase font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                        {format(day, "EEEE", { locale: ptBR }).substring(0, 3)}
                      </span>
                      <span className={`text-lg font-bold ${isToday ? 'text-primary' : ''}`}>
                        {format(day, "d")}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                      {appts.map(appt => (
                        <div key={appt.id} className="text-[10px] p-1 rounded bg-primary/10 text-primary truncate" title={appt.patientName}>
                          {format(appt.date, "HH:mm")} - {appt.patientName}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="month" className="mt-0">
            <div className="flex items-center justify-center h-[400px] border rounded-xl border-dashed">
              <div className="text-center text-muted-foreground">
                <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" />
                <p>Visão mensal do calendário estará disponível na próxima atualização.</p>
                <Button variant="outline" className="mt-4" onClick={() => document.querySelector<HTMLButtonElement>('[value="week"]')?.click()}>Ver Semana</Button>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
};
