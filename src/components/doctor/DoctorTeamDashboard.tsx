import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Copy, Users, TrendingUp, DollarSign, Download, Share2, Award, 
  ArrowRight, Stethoscope, Video, MessageSquare, UserPlus, CheckCircle2, 
  Loader2, Network, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadPermanentReferralCode } from "@/lib/referral-code";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReferredMember {
  id: string;
  userId: string;
  name: string;
  level: "L1" | "L2" | "L3";
  createdAt: string;
  type: "doctor" | "patient";
}

export const DoctorTeamDashboard = ({ doctor, profile }: { doctor: any, profile: any }) => {
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState({ 
    totalL1: 0,
    totalL2: 0,
    totalL3: 0,
    totalGeral: 0,
    ganhosAcumulados: 0,
    comissoesPendentes: 0,
    nivelAtual: "Bronze",
    proximoNivel: "Prata",
    faltamParaProximo: 5
  });
  const [networkMembers, setNetworkMembers] = useState<ReferredMember[]>([]);

  const userId = doctor?.user_id || profile?.id;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://plantayraiz.com.br";

  useEffect(() => {
    if (!userId) return;
    loadReferralNetwork();
  }, [userId]);

  const loadReferralNetwork = async () => {
    try {
      setLoading(true);

      // 1. Código canônico permanente do servidor
      const code = await loadPermanentReferralCode(userId);
      setReferralCode(code);

      // 2. Dados do referral_links do titular
      const { data: selfRef } = await supabase
        .from("referral_links")
        .select("total_referrals, total_earnings")
        .eq("user_id", userId)
        .maybeSingle();

      // 3. Busca de todos os indicados na árvore de 3 níveis
      const [l1Res, l2Res, l3Res, commsRes] = await Promise.all([
        supabase
          .from("referral_links")
          .select("user_id, created_at, referred_by, level1_referrer")
          .or(`referred_by.eq.${userId},level1_referrer.eq.${userId}`),
        supabase
          .from("referral_links")
          .select("user_id, created_at, level2_referrer")
          .eq("level2_referrer", userId),
        supabase
          .from("referral_links")
          .select("user_id, created_at, level3_referrer")
          .eq("level3_referrer", userId),
        supabase
          .from("affiliate_commissions")
          .select("amount, status")
          .eq("referrer_id", userId)
      ]);

      const l1List = l1Res.data || [];
      const l2List = l2Res.data || [];
      const l3List = l3Res.data || [];
      const comms = commsRes.data || [];

      const totalL1 = l1List.length;
      const totalL2 = l2List.length;
      const totalL3 = l3List.length;
      const totalGeral = totalL1 + totalL2 + totalL3;

      const ganhosAcumulados = comms
        .filter(c => c.status === "paid")
        .reduce((sum, c) => sum + Number(c.amount || 0), 0) || Number(selfRef?.total_earnings || 0);

      const comissoesPendentes = comms
        .filter(c => c.status === "pending")
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);

      // Determina nível
      let nivelAtual = "Bronze";
      let proximoNivel = "Prata";
      let faltam = Math.max(0, 5 - totalGeral);
      if (totalGeral >= 25) {
        nivelAtual = "Diamante";
        proximoNivel = "Elite";
        faltam = Math.max(0, 50 - totalGeral);
      } else if (totalGeral >= 10) {
        nivelAtual = "Ouro";
        proximoNivel = "Diamante";
        faltam = Math.max(0, 25 - totalGeral);
      } else if (totalGeral >= 5) {
        nivelAtual = "Prata";
        proximoNivel = "Ouro";
        faltam = Math.max(0, 10 - totalGeral);
      }

      setStats({
        totalL1,
        totalL2,
        totalL3,
        totalGeral,
        ganhosAcumulados,
        comissoesPendentes,
        nivelAtual,
        proximoNivel,
        faltamParaProximo: faltam
      });

      // Mapeamento dos membros da rede
      const allUserIds = [
        ...l1List.map(r => ({ uid: r.user_id, lvl: "L1" as const, createdAt: r.created_at })),
        ...l2List.map(r => ({ uid: r.user_id, lvl: "L2" as const, createdAt: r.created_at })),
        ...l3List.map(r => ({ uid: r.user_id, lvl: "L3" as const, createdAt: r.created_at })),
      ];

      if (allUserIds.length > 0) {
        const uids = allUserIds.map(x => x.uid).filter(Boolean);
        const [{ data: profs }, { data: docs }] = await Promise.all([
          supabase.from("profiles").select("id, full_name").in("id", uids),
          supabase.from("doctors").select("user_id").in("user_id", uids),
        ]);

        const profMap = new Map((profs || []).map(p => [p.id, p]));
        const docUserSet = new Set((docs || []).map(d => d.user_id));

        const members: ReferredMember[] = allUserIds.map((item, idx) => {
          const p = profMap.get(item.uid);
          const isDoc = docUserSet.has(item.uid);
          const rawName = p?.full_name || `Membro #${idx + 1}`;
          return {
            id: item.uid,
            userId: item.uid,
            name: rawName,
            level: item.lvl,
            createdAt: item.createdAt,
            type: isDoc ? "doctor" : "patient"
          };
        });

        // Ordena mais recentes primeiro
        members.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNetworkMembers(members);
      } else {
        setNetworkMembers([]);
      }
    } catch (e: any) {
      console.error("[DoctorTeamDashboard] Erro ao carregar rede:", e);
    } finally {
      setLoading(false);
    }
  };

  // Links oficiais registrados no servidor
  const colleagueLink = referralCode 
    ? `${origin}/cadastro-profissional?ref=${referralCode}` 
    : `${origin}/cadastro-profissional`;

  const videoConsultLink = referralCode && doctor?.id
    ? `${origin}/consulta/consulta_video?doctor=${encodeURIComponent(doctor.id)}&ref=${referralCode}`
    : `${origin}/consulta/consulta_video`;

  const generalPatientLink = referralCode
    ? `${origin}/cadastro?ref=${referralCode}`
    : `${origin}/cadastro`;

  const handleCopy = (url: string, label = "Link") => {
    navigator.clipboard.writeText(url);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  const shareWhatsApp = (text: string, url: string) => {
    const full = `${text}\n\n👉 Acesse: ${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(full)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-black font-display text-emerald-900 dark:text-emerald-300">
              Minha Rede de Indicações & Time
            </h2>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Cada link é único, individual e registrado no servidor pelo seu código permanente. Ganhe comissões e acompanhe sua rede em até 3 níveis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {referralCode && (
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 font-mono text-xs px-3 py-1">
              Código Oficial: <span className="font-black ml-1 text-emerald-400">{referralCode}</span>
            </Badge>
          )}
          <Badge className="bg-amber-500 text-white hover:bg-amber-600 px-3 py-1 font-bold">
            <Award className="w-4 h-4 mr-1.5" />
            Nível: {stats.nivelAtual}
          </Badge>
        </div>
      </div>

      {/* Cards de Métricas Reais da Rede */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-200/80 dark:bg-emerald-800/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Total na Rede</p>
              <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-200">{stats.totalGeral}</h3>
              <p className="text-[10px] text-muted-foreground">3 níveis integrados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-200/80 dark:bg-blue-800/40 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-400">Nível 1 (Diretos)</p>
              <h3 className="text-xl font-black text-blue-900 dark:text-blue-200">{stats.totalL1}</h3>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">10% de comissão</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-200/80 dark:bg-indigo-800/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-400">Níveis 2 e 3</p>
              <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-200">{stats.totalL2 + stats.totalL3}</h3>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">5% L2 | 2.5% L3</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200/80 dark:bg-amber-800/40 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">Ganhos Acumulados</p>
              <h3 className="text-xl font-black text-amber-900 dark:text-amber-200">
                R$ {stats.ganhosAcumulados.toFixed(2).replace(".", ",")}
              </h3>
              {stats.comissoesPendentes > 0 && (
                <p className="text-[10px] text-amber-600 font-bold">+ R$ {stats.comissoesPendentes.toFixed(2)} pendentes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção 1: Links Personalizados Oficiais */}
      <Card className="border-emerald-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-600" />
            Seus Links Personalizados de Indicação
          </CardTitle>
          <CardDescription>
            Cada cadastro realizado através destes links vincula permanentemente o novo usuário à sua árvore de indicações.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Link 1: Colegas Médicos */}
          <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Stethoscope size={14} className="text-emerald-600" />
                Colegas Médicos & Profissionais da Saúde (Cadastro de Prescritor)
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded">
                Gera comissão sobre assinaturas e consultas
              </span>
            </div>
            <div className="flex gap-2">
              <Input value={colleagueLink} readOnly className="bg-background font-mono text-xs" />
              <Button size="sm" variant="outline" onClick={() => handleCopy(colleagueLink, "Link de Colegas")}>
                <Copy className="w-4 h-4 mr-1.5" /> Copiar
              </Button>
              <Button 
                size="sm" 
                className="bg-[#00a884] hover:bg-[#008f6f] text-white"
                onClick={() => shareWhatsApp(
                  "Olá, colega médico! Convido você a fazer parte do corpo clínico e telemedicina da Planta y Raíz com consultório inteligente e prontuário completo:", 
                  colleagueLink
                )}
              >
                <Share2 className="w-4 h-4 mr-1.5" /> WhatsApp
              </Button>
            </div>
          </div>

          {/* Link 2: Consulta Direta de Pacientes */}
          <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Video size={14} className="text-blue-600" />
                Pacientes — Consulta Direta por Vídeo com Você
              </span>
              <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded">
                Abre o checkout já com você selecionado
              </span>
            </div>
            <div className="flex gap-2">
              <Input value={videoConsultLink} readOnly className="bg-background font-mono text-xs" />
              <Button size="sm" variant="outline" onClick={() => handleCopy(videoConsultLink, "Link de Consulta")}>
                <Copy className="w-4 h-4 mr-1.5" /> Copiar
              </Button>
              <Button 
                size="sm" 
                className="bg-[#00a884] hover:bg-[#008f6f] text-white"
                onClick={() => shareWhatsApp(
                  "Olá! Você pode agendar sua teleconsulta diretamente comigo através do consultório virtual da Planta y Raíz:", 
                  videoConsultLink
                )}
              >
                <Share2 className="w-4 h-4 mr-1.5" /> WhatsApp
              </Button>
            </div>
          </div>

          {/* Link 3: Indicação Geral de Pacientes */}
          <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <UserPlus size={14} className="text-indigo-600" />
                Indicação Geral de Pacientes (Cadastro na Plataforma)
              </span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded">
                Vincula o paciente como seu indicado permanente
              </span>
            </div>
            <div className="flex gap-2">
              <Input value={generalPatientLink} readOnly className="bg-background font-mono text-xs" />
              <Button size="sm" variant="outline" onClick={() => handleCopy(generalPatientLink, "Link de Pacientes")}>
                <Copy className="w-4 h-4 mr-1.5" /> Copiar
              </Button>
              <Button 
                size="sm" 
                className="bg-[#00a884] hover:bg-[#008f6f] text-white"
                onClick={() => shareWhatsApp(
                  "Conheça a plataforma de saúde integrada Planta y Raíz, com orientação técnica médica supervisionada e telemedicina:", 
                  generalPatientLink
                )}
              >
                <Share2 className="w-4 h-4 mr-1.5" /> WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 2: Membros Registrados na Rede do Usuário */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Membros Cadastrados na Sua Rede ({stats.totalGeral})
              </CardTitle>
              <CardDescription>
                Lista completa de usuários que entraram na plataforma através dos seus links e indicações.
              </CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={loadReferralNetwork} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Carregando rede de indicados...
            </div>
          ) : networkMembers.length === 0 ? (
            <div className="py-8 text-center border rounded-xl bg-muted/20">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">Nenhuma indicação cadastrada ainda</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                Compartilhe seus links acima com colegas médicos e pacientes para começar a construir sua rede e acumular comissões automáticas.
              </p>
            </div>
          ) : (
            <div className="border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-bold text-xs">Membro / Nome</TableHead>
                    <TableHead className="font-bold text-xs">Tipo</TableHead>
                    <TableHead className="font-bold text-xs">Nível na Rede</TableHead>
                    <TableHead className="font-bold text-xs">Data de Entrada</TableHead>
                    <TableHead className="font-bold text-xs text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {networkMembers.map((member) => (
                    <TableRow key={member.id} className="text-xs">
                      <TableCell className="font-semibold text-foreground">
                        {member.name}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`text-[10px] font-bold ${
                            member.type === "doctor" 
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" 
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {member.type === "doctor" ? "🩺 Médico Prescritor" : "👤 Paciente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={`text-[10px] font-mono font-bold ${
                            member.level === "L1" 
                              ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10" 
                              : member.level === "L2"
                                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
                                : "border-slate-500 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {member.level === "L1" ? "Nível 1 (Direto)" : member.level === "L2" ? "Nível 2 (Indireto)" : "Nível 3"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.createdAt ? format(new Date(member.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={12} /> Vinculado
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção 3: Regras da Rede e Material */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-600" />
              Como Funciona a Remuneração da Rede
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              • Comissão só para o indicador direto (um nível), sobre vendas reais confirmadas. Não há 2º nem 3º nível.
            </p>
            <p>
              • Nunca há comissão por trazer pacientes: as normas do CFM proíbem pagar por captação de pacientes.
            </p>
            <p className="pt-2 text-[11px] text-foreground font-semibold">
              As comissões são creditadas diretamente na sua carteira digital para saque via PIX instantâneo.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              Plano de Carreira Médica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Status Atual: <strong className="text-foreground">{stats.nivelAtual}</strong></span>
              <span>Próximo: <strong className="text-amber-500">{stats.proximoNivel}</strong></span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-amber-500 h-2 rounded-full transition-all" 
                style={{ width: `${Math.min(100, (stats.totalGeral / Math.max(1, stats.totalGeral + stats.faltamParaProximo)) * 100)}%` }}
              />
            </div>
            <p className="text-[11px]">
              Faltam <strong>{stats.faltamParaProximo}</strong> indicações ativas para alcançar o nível <strong>{stats.proximoNivel}</strong> e desbloquear multiplicadores de comissão.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
