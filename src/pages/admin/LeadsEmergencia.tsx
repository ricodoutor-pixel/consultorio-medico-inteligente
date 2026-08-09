import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ShieldAlert, RefreshCw, Eye, MessageCircle, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type EmergencyLead = {
  id: string;
  name: string;
  phone: string;
  category: string;
  created_at: string;
  chat_history: any;
};

export default function LeadsEmergencia() {
  const [leads, setLeads] = useState<EmergencyLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<EmergencyLead | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("emergency_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads((data as any) || []);
    } catch (error) {
      console.error("Erro ao buscar leads de emergência:", error);
      toast.error("Não foi possível carregar os leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="p-6 space-y-6 bg-muted/30 min-h-dvh">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="text-red-500" />
            Leads de Emergência (Fallback)
          </h1>
          <p className="text-muted-foreground mt-1">
            Contatos gerados através do chat de emergência durante panes no WAHA.
          </p>
        </div>
        <Button onClick={fetchLeads} variant="outline" className="flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw size={16} />}
          Atualizar Lista
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Contatos ({leads.length})</CardTitle>
          <CardDescription>Visualize e responda os pacientes que usaram o canal alternativo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Nenhum lead de emergência registrado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{format(new Date(lead.created_at), "dd/MM/yyyy HH:mm")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        <a 
                          href={`https://wa.me/55${lead.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-green-600 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border
                          ${lead.category === 'Urgência Médica' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-green-100 text-green-800 border-green-200'}
                        `}>
                          {lead.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLead(lead)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Histórico
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Histórico do Chat - {selectedLead?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 bg-muted/20 p-4 rounded-lg border">
            {(!selectedLead?.chat_history || (Array.isArray(selectedLead.chat_history) && selectedLead.chat_history.length === 0)) ? (
              <p className="text-center text-muted-foreground text-sm my-8">
                Nenhum histórico de chat gravado para este lead.
              </p>
            ) : (
              (selectedLead.chat_history as any[]).map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : msg.role === "system" ? "justify-center" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                    msg.role === "user" ? "bg-[#22C55E] text-white rounded-br-none" : 
                    msg.role === "system" ? "bg-amber-500/10 text-amber-600 text-xs border border-amber-500/20" :
                    "bg-card border text-foreground rounded-bl-none"
                  }`}>
                    {msg.content}
                    <span className={`block text-[9px] mt-1 text-right opacity-70`}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 flex justify-end">
             <Button 
                onClick={() => window.open(`https://wa.me/55${selectedLead?.phone.replace(/\D/g, "")}`, "_blank")}
                className="bg-[#22C55E] hover:bg-[#16a34a] text-white"
              >
                <Phone className="w-4 h-4 mr-2" />
                Continuar no WhatsApp
              </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
