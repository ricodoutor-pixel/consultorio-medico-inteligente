import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  CreditCard, ShieldCheck, Search, Download, ExternalLink, CheckCircle2, 
  XCircle, Clock, Eye, ArrowLeft, Filter, RefreshCw, FileText, User, AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface ComprovanteItem {
  id: string;
  tipo: "consulta" | "plano_vip" | "orientacao_tecnica";
  remetente_nome: string;
  remetente_tipo: "paciente" | "medico";
  documento_id?: string;
  telefone?: string;
  valor: string;
  data: string;
  metodo: "PIX" | "Cartão" | "Asaas";
  status: "aprovado" | "pendente" | "rejeitado";
  comprovante_url: string;
  observacoes?: string;
}

const MOCK_COMPROVANTES: ComprovanteItem[] = [
  {
    id: "comp-victor-vip-01",
    tipo: "plano_vip",
    remetente_nome: "Dr. Victor Henrique Bueno da Fonseca",
    remetente_tipo: "medico",
    documento_id: "CRM 206873/SP",
    telefone: "5511953045378",
    valor: "R$ 99,00",
    data: "06/10/2026 12:30",
    metodo: "PIX",
    status: "aprovado",
    comprovante_url: "/cfm_prints/cfm-dr-victor-fonseca.png",
    observacoes: "Assinatura Mensal Plano Médico Prescritor VIP (Taxa Zero / Repasse Máximo)",
  },
  {
    id: "comp-paciente-orientacao-02",
    tipo: "orientacao_tecnica",
    remetente_nome: "Paciente Teste (Simulação IA - PAGO)",
    remetente_tipo: "paciente",
    documento_id: "CPF ***.***.000-00",
    telefone: "5511991363154",
    valor: "R$ 30,00",
    data: "06/10/2026 14:15",
    metodo: "PIX",
    status: "aprovado",
    comprovante_url: "/cfm_prints/cfm-dr-victor-fonseca.png",
    observacoes: "Orientação Técnica com Enfermeira Brisa + Roteamento Dr. Victor",
  },
  {
    id: "comp-paciente-video-03",
    tipo: "consulta",
    remetente_nome: "Maria Aparecida Silva",
    remetente_tipo: "paciente",
    documento_id: "CPF ***.***.456-78",
    telefone: "5511988887777",
    valor: "R$ 150,00",
    data: "06/10/2026 15:40",
    metodo: "PIX",
    status: "pendente",
    comprovante_url: "/cfm_prints/cfm-dr-victor-fonseca.png",
    observacoes: "Teleconsulta por Vídeo HD - Dr. Victor Fonseca (Psiquiatria)",
  },
];

export default function AdminComprovantesPagamento() {
  const [comprovantes, setComprovantes] = useState<ComprovanteItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [selectedComp, setSelectedComp] = useState<ComprovanteItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComprovantes();
  }, []);

  const loadComprovantes = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem("admin_comprovantes_pagamento");
      if (stored) {
        setComprovantes(JSON.parse(stored));
      } else {
        setComprovantes(MOCK_COMPROVANTES);
        localStorage.setItem("admin_comprovantes_pagamento", JSON.stringify(MOCK_COMPROVANTES));
      }
    } catch (e) {
      setComprovantes(MOCK_COMPROVANTES);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id: string, newStatus: "aprovado" | "rejeitado") => {
    const updated = comprovantes.map((c) => (c.id === id ? { ...c, status: newStatus } : c));
    setComprovantes(updated);
    localStorage.setItem("admin_comprovantes_pagamento", JSON.stringify(updated));
    toast.success(newStatus === "aprovado" ? "✓ Comprovante aprovado e liberado no sistema!" : "Comprovante rejeitado.");
  };

  const filtered = comprovantes.filter((c) => {
    const matchesSearch = 
      c.remetente_nome.toLowerCase().includes(search.toLowerCase()) ||
      (c.documento_id && c.documento_id.toLowerCase().includes(search.toLowerCase())) ||
      c.valor.toLowerCase().includes(search.toLowerCase());
    const matchesTipo = filterTipo === "todos" || c.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const totalAprovado = comprovantes
    .filter((c) => c.status === "aprovado")
    .reduce((acc, c) => acc + (parseFloat(c.valor.replace("R$", "").replace(".", "").replace(",", ".").trim()) || 0), 0);

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mb-6">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft size={14} /> Voltar ao Command Center
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-foreground flex items-center gap-2">
                <CreditCard className="text-emerald-500" /> Repositório de Comprovantes de Pagamento
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Auditoria e conferência centralizada de pagamentos recebidos via WhatsApp (Enfermeira Brisa), PIX e Asaas.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={loadComprovantes} variant="outline" size="sm" className="rounded-xl">
                <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} /> Atualizar
              </Button>
            </div>
          </div>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase">Total de Comprovantes</p>
              <p className="text-2xl font-black text-foreground mt-1">{comprovantes.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase">Pendentes de Auditoria</p>
              <p className="text-2xl font-black text-amber-500 mt-1">
                {comprovantes.filter((c) => c.status === "pendente").length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase">Volume Homologado</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                R$ {totalAprovado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FILTROS E BUSCA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CRM, CPF ou valor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {["todos", "plano_vip", "consulta", "orientacao_tecnica"].map((t) => (
              <Button
                key={t}
                size="sm"
                variant={filterTipo === t ? "default" : "outline"}
                onClick={() => setFilterTipo(t)}
                className="rounded-xl text-xs capitalize whitespace-nowrap"
              >
                {t === "todos" ? "Todos" : t === "plano_vip" ? "Plano VIP Médico" : t === "consulta" ? "Consultas" : "Orientação Técnica"}
              </Button>
            ))}
          </div>
        </div>

        {/* TABELA DE COMPROVANTES */}
        <Card className="border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold">Remetente</TableHead>
                <TableHead className="text-xs font-bold">Finalidade</TableHead>
                <TableHead className="text-xs font-bold">Valor</TableHead>
                <TableHead className="text-xs font-bold">Método</TableHead>
                <TableHead className="text-xs font-bold">Data/Hora</TableHead>
                <TableHead className="text-xs font-bold">Status</TableHead>
                <TableHead className="text-xs font-bold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum comprovante encontrado com os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell className="py-3">
                      <p className="font-bold text-xs text-foreground">{c.remetente_nome}</p>
                      <p className="text-[10px] text-muted-foreground">{c.documento_id} {c.telefone ? `• ${c.telefone}` : ""}</p>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className={`text-[10px] font-bold ${
                        c.tipo === "plano_vip" ? "bg-purple-500/10 text-purple-400 border-purple-500/30" :
                        c.tipo === "consulta" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" :
                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      }`}>
                        {c.tipo === "plano_vip" ? "Assinatura VIP Mensal" : c.tipo === "consulta" ? "Consulta Vídeo/Chat" : "Orientação Técnica"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 font-black text-sm text-foreground">{c.valor}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{c.metodo}</TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground">{c.data}</TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className={`text-[10px] font-bold ${
                        c.status === "aprovado" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40" :
                        c.status === "rejeitado" ? "bg-rose-500/15 text-rose-400 border-rose-500/40" :
                        "bg-amber-500/15 text-amber-400 border-amber-500/40"
                      }`}>
                        {c.status === "aprovado" ? "✓ Aprovado" : c.status === "rejeitado" ? "✗ Rejeitado" : "⏳ Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-right space-x-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedComp(c)}
                        className="h-7 text-xs rounded-lg px-2 text-primary border-primary/30"
                      >
                        <Eye size={12} className="mr-1" /> Ver Print
                      </Button>
                      {c.status !== "aprovado" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(c.id, "aprovado")}
                          className="h-7 text-xs rounded-lg px-2 bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <CheckCircle2 size={12} className="mr-1" /> Aprovar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </main>

      {/* MODAL DE VISUALIZAÇÃO DO COMPROVANTE */}
      <Dialog open={!!selectedComp} onOpenChange={(o) => !o && setSelectedComp(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-lg font-black flex items-center gap-2">
              <ShieldCheck className="text-emerald-500" /> Dossiê de Comprovante de Pagamento
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedComp?.remetente_nome} · {selectedComp?.valor} ({selectedComp?.metodo})
            </DialogDescription>
          </DialogHeader>

          {selectedComp && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-border p-3 bg-muted/20 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Finalidade:</span>
                  <span className="font-bold">{selectedComp.tipo === "plano_vip" ? "Assinatura Mensal VIP Médico" : "Atendimento Clínico"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data/Hora:</span>
                  <span className="font-bold">{selectedComp.data}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Observação:</span>
                  <span className="font-medium text-muted-foreground">{selectedComp.observacoes || "N/A"}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border overflow-hidden bg-black/40 flex items-center justify-center min-h-[260px] p-2">
                <img
                  src={selectedComp.comprovante_url}
                  alt="Comprovante"
                  className="max-h-[340px] rounded-lg object-contain shadow-md"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <a
                  href={selectedComp.comprovante_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                >
                  <ExternalLink size={14} /> Abrir em Nova Aba
                </a>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleStatusChange(selectedComp.id, "rejeitado");
                      setSelectedComp(null);
                    }}
                    className="text-xs text-rose-500 border-rose-500/30"
                  >
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      handleStatusChange(selectedComp.id, "aprovado");
                      setSelectedComp(null);
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    <CheckCircle2 size={14} className="mr-1" /> Aprovar Pagamento
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
