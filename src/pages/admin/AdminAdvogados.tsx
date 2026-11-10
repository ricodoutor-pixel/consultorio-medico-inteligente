import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function AdminAdvogados() {
  const cache = useQueryClient();
  const [source, setSource] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const registrations = useQuery({ queryKey: ["lawyer-admin-review"], queryFn: async () => {
    const { data, error } = await supabase.from("lawyer_profiles").select("*").order("created_at", { ascending: false });
    if (error) throw error; return data;
  }});
  const review = async (id: string, status: "approved" | "rejected") => {
    if (busy) return;
    if (status === "approved" && (source[id]?.trim().length ?? 0) < 5) { toast.error("Registre a fonte e a conferência da inscrição na OAB."); return; }
    setBusy(true);
    const { error } = await supabase.from("lawyer_profiles").update({ status, verification_source: source[id]?.trim() || null, verified_at: status === "approved" ? new Date().toISOString() : null }).eq("id", id);
    setBusy(false);
    if (error) toast.error("Não foi possível revisar o cadastro."); else { toast.success("Revisão registrada."); void cache.invalidateQueries({ queryKey: ["lawyer-admin-review"] }); void cache.invalidateQueries({ queryKey: ["legal-directory"] }); }
  };
  return <div className="min-h-dvh bg-background"><Navbar /><section className="container mx-auto max-w-4xl px-4 pt-32 pb-16 space-y-6"><Link to="/advogados" className="text-primary">Voltar para Advogados</Link><h1 className="text-2xl font-bold">Revisão de advogados</h1><p className="text-sm text-muted-foreground">Confira identidade, inscrição ativa na OAB e experiência declarada antes de publicar. Nenhum cadastro é aprovado automaticamente.</p><a href="https://cna.oab.org.br/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Consultar Cadastro Nacional dos Advogados</a>
    {registrations.isLoading ? <p>Carregando cadastros…</p> : registrations.isError ? <p role="alert">Não foi possível consultar os cadastros.</p> : !registrations.data?.length ? <p>Nenhum advogado cadastrado.</p> : registrations.data.map(p => <section key={p.id} className="border-t border-border pt-5 space-y-3"><h2 className="text-lg font-bold">{p.full_name}</h2><p>OAB/{p.oab_state} {p.oab_number} · {p.city}</p><p className="text-sm text-muted-foreground whitespace-pre-wrap">{p.bio}</p><p className="text-sm">Situação: {p.status === "pending" ? "Pendente" : p.status === "approved" ? "Aprovado" : "Não aprovado"}</p><Label htmlFor={`source-${p.id}`}>Fonte e resultado da conferência</Label><Input id={`source-${p.id}`} value={source[p.id] ?? p.verification_source ?? ""} onChange={e => setSource(s => ({ ...s, [p.id]: e.target.value }))} /><div className="flex gap-2"><Button disabled={busy} onClick={() => void review(p.id, "approved")}>Aprovar após conferência</Button><Button variant="outline" disabled={busy} onClick={() => void review(p.id, "rejected")}>Não aprovar</Button></div></section>)}
  </section></div>;
}