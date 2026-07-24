import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { MessageSquare, Plus, Edit, Trash2, Check, Copy } from "lucide-react";

export interface MessageTemplate {
  id: string;
  doctor_id: string;
  title: string;
  body: string;
  created_at: string;
}

interface DoctorMessageTemplatesProps {
  onSelectTemplate?: (body: string) => void;
}

export function DoctorMessageTemplates({ onSelectTemplate }: DoctorMessageTemplatesProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const doctorId = sessionData?.session?.user?.id;
      if (!doctorId) { setLoading(false); return; }

      const { data, error } = await (supabase as any)
        .from("doctor_message_templates")
        .select("*")
        .eq("doctor_id", doctorId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTemplates(data as MessageTemplate[]);
      }
    } catch (err) {
      console.error("[DoctorMessageTemplates] Erro ao buscar templates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Preencha o título e a mensagem.");
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const doctorId = sessionData?.session?.user?.id;
      if (!doctorId) return;

      if (editingId) {
        const { error } = await (supabase as any)
          .from("doctor_message_templates")
          .update({ title, body, updated_at: new Date().toISOString() })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Template atualizado com sucesso!");
      } else {
        const { error } = await (supabase as any)
          .from("doctor_message_templates")
          .insert({ doctor_id: doctorId, title, body });
        if (error) throw error;
        toast.success("Template criado com sucesso!");
      }

      setTitle("");
      setBody("");
      setEditingId(null);
      setDialogOpen(false);
      fetchTemplates();
    } catch (err: any) {
      toast.error("Erro ao salvar template: " + (err.message || ""));
    }
  };

  const handleEdit = (tpl: MessageTemplate) => {
    setEditingId(tpl.id);
    setTitle(tpl.title);
    setBody(tpl.body);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("doctor_message_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Template removido!");
      fetchTemplates();
    } catch (err: any) {
      toast.error("Erro ao remover template.");
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b border-border">
        <CardTitle className="text-sm font-black flex items-center gap-2 text-foreground">
          <MessageSquare className="w-4 h-4 text-primary" />
          Templates de Resposta Rápidas
        </CardTitle>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setEditingId(null); setTitle(""); setBody(""); }}
              className="text-xs font-bold gap-1 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Criar Template
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-black text-lg">
                {editingId ? "Editar Template" : "Novo Template de Resposta"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Título do Atalho</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Orientação Posologia CBD Inicial"
                  className="mt-1 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Mensagem Padrão</label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Digite a mensagem rápida para enviar ao paciente..."
                  className="mt-1 rounded-xl min-h-[120px]"
                />
              </div>

              <Button onClick={handleSave} className="w-full bg-primary font-black rounded-xl">
                Salvar Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-3">Carregando atalhos...</p>
        ) : templates.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            Nenhum template salvo. Crie atalhos para agilizar seu atendimento.
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-3 rounded-xl bg-muted/40 border border-border flex items-start justify-between gap-2 hover:border-primary/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-foreground block truncate">{tpl.title}</span>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{tpl.body}</p>
                </div>

                <div className="flex items-center gap-1">
                  {onSelectTemplate && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onSelectTemplate(tpl.body)}
                      title="Inserir texto"
                      className="h-7 text-[10px] font-bold px-2 rounded-lg gap-1"
                    >
                      <Copy className="w-3 h-3" /> Usar
                    </Button>
                  )}

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(tpl)}
                    className="w-7 h-7 text-muted-foreground hover:text-foreground"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(tpl.id)}
                    className="w-7 h-7 text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
