import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Building2, Plus, Trash2, Edit3, Globe, MessageCircle, Palette, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ClinicProfile {
  id: string;
  doctor_name: string;
  specialty: string;
  whatsapp: string;
  email: string | null;
  domain: string | null;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  tagline: string | null;
  description: string | null;
  active: boolean;
}

const emptyForm = {
  doctor_name: "",
  specialty: "",
  whatsapp: "",
  email: "",
  domain: "",
  slug: "",
  logo_url: "",
  primary_color: "#1B4332",
  secondary_color: "#15803d",
  tagline: "",
  description: "",
  active: true,
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const AdminClinicas = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinics, setClinics] = useState<ClinicProfile[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin-login"); return; }
      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!roleData) { navigate("/admin-login"); return; }
      await loadClinics();
    })();
  }, [navigate]);

  const loadClinics = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("clinic_profiles").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar clínicas");
    else setClinics((data as ClinicProfile[]) || []);
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: ClinicProfile) => {
    setEditingId(c.id);
    setForm({
      doctor_name: c.doctor_name,
      specialty: c.specialty,
      whatsapp: c.whatsapp,
      email: c.email || "",
      domain: c.domain || "",
      slug: c.slug,
      logo_url: c.logo_url || "",
      primary_color: c.primary_color,
      secondary_color: c.secondary_color,
      tagline: c.tagline || "",
      description: c.description || "",
      active: c.active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.doctor_name || !form.specialty || !form.whatsapp) {
      toast.error("Preencha nome, especialidade e WhatsApp");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.doctor_name),
      email: form.email || null,
      domain: form.domain || null,
      logo_url: form.logo_url || null,
      tagline: form.tagline || null,
      description: form.description || null,
    };

    const { error } = editingId
      ? await supabase.from("clinic_profiles").update(payload).eq("id", editingId)
      : await supabase.from("clinic_profiles").insert(payload);

    if (error) {
      toast.error(error.message.includes("duplicate") ? "Slug ou domínio já em uso" : "Erro ao salvar");
    } else {
      toast.success(editingId ? "Clínica atualizada ✅" : "Clínica criada 🏥");
      setOpen(false);
      await loadClinics();
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Remover esta clínica? Esta ação é permanente.")) return;
    const { error } = await supabase.from("clinic_profiles").delete().eq("id", id);
    if (error) toast.error("Erro ao remover");
    else { toast.success("Clínica removida"); await loadClinics(); }
  };

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <section className="pt-24 pb-16 md:pt-32">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Building2 className="text-primary" size={24} />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-display font-black text-foreground">Clínicas Online</h1>
                <p className="text-muted-foreground text-sm">White-label · Configure cada clínica e domínio individualmente</p>
              </div>
            </div>
            <Button onClick={openNew} className="gap-2">
              <Plus size={16} /> Nova Clínica
            </Button>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : clinics.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Building2 className="mx-auto mb-4 text-muted-foreground" size={48} />
                <p className="text-muted-foreground mb-4">Nenhuma clínica cadastrada ainda.</p>
                <Button onClick={openNew} variant="outline" className="gap-2"><Plus size={16} /> Criar a primeira</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {clinics.map((c) => (
                <Card key={c.id} className="border-border hover:border-primary/40 transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{ background: c.primary_color + "20", borderColor: c.primary_color + "60" }}
                        >
                          {c.logo_url ? (
                            <img src={c.logo_url} alt={c.doctor_name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Building2 size={20} style={{ color: c.primary_color }} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{c.doctor_name}</CardTitle>
                          <p className="text-xs text-muted-foreground truncate">{c.specialty}</p>
                        </div>
                      </div>
                      <Badge variant={c.active ? "default" : "secondary"} className="shrink-0">
                        {c.active ? "Ativa" : "Pausada"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageCircle size={12} /> {c.whatsapp}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe size={12} />
                      {c.domain ? (
                        <a href={`https://${c.domain}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary inline-flex items-center gap-1 truncate">
                          {c.domain} <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span>/{c.slug}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Palette size={12} className="text-muted-foreground" />
                      <span className="w-4 h-4 rounded border border-border" style={{ background: c.primary_color }} />
                      <span className="w-4 h-4 rounded border border-border" style={{ background: c.secondary_color }} />
                    </div>
                    <div className="flex gap-2 pt-3">
                      <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => openEdit(c)}>
                        <Edit3 size={12} /> Editar
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => remove(c.id)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Clínica" : "Nova Clínica Online"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome do Médico *</Label>
              <Input value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value, slug: form.slug || slugify(e.target.value) })} placeholder="Dr. João Silva" />
            </div>
            <div className="space-y-1.5">
              <Label>Especialidade *</Label>
              <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Cannabis Medicinal" />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp *</Label>
              <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+55 11 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contato@clinica.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Slug (URL) *</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="dr-joao-silva" />
            </div>
            <div className="space-y-1.5">
              <Label>Domínio personalizado</Label>
              <Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="drjoao.com.br" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>URL do Logo</Label>
              <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Cor Primária</Label>
              <div className="flex gap-2">
                <Input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="w-16 h-10 p-1 cursor-pointer" />
                <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Cor Secundária</Label>
              <div className="flex gap-2">
                <Input type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="w-16 h-10 p-1 cursor-pointer" />
                <Input value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Slogan</Label>
              <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Saúde canabinoide com excelência" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label className="cursor-pointer">Clínica ativa (visível publicamente)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingId ? "Salvar alterações" : "Criar clínica"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default AdminClinicas;
