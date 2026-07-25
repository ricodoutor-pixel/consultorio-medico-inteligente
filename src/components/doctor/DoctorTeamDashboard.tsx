import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Users, TrendingUp, DollarSign, Download, Share2, Award, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const DoctorTeamDashboard = ({ doctor, profile }: { doctor: any, profile: any }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ 
    totalIndicados: 0, 
    ganhosMes: 0, 
    nivelAtual: "Bronze",
    proximoNivel: "Prata",
    faltamParaProximo: 5
  });

  const uniqueLink = `https://plantayraiz.com.br/cadastro-profissional?ref=${doctor.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(uniqueLink);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Faça parte da Planta y Raiz',
        text: 'Cadastre-se como médico na Planta y Raiz e tenha acesso ao Consultório Virtual Inteligente.',
        url: uniqueLink,
      }).catch(console.error);
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-black font-display text-emerald-800">Meu Time (Afiliados)</h2>
          <p className="text-muted-foreground text-sm">Convide colegas médicos e ganhe % sobre assinaturas e consultas.</p>
        </div>
        <Badge className="bg-amber-500 text-white hover:bg-amber-600 px-3 py-1">
          <Award className="w-4 h-4 mr-2" />
          Status: {stats.nivelAtual}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-800">Total Indicados</p>
              <h3 className="text-2xl font-black text-emerald-900">{stats.totalIndicados}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-700">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Ganhos neste mês</p>
              <h3 className="text-2xl font-black text-blue-900">R$ {stats.ganhosMes.toFixed(2)}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center text-amber-700">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">Próximo Nível</p>
              <h3 className="text-lg font-black text-amber-900">{stats.proximoNivel}</h3>
              <p className="text-[10px] text-amber-700/80 mt-1">Faltam {stats.faltamParaProximo} indicações</p>
              <div className="w-full bg-amber-200 rounded-full h-1.5 mt-2">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '40%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seu Link Exclusivo</CardTitle>
          <CardDescription>Compartilhe este link com colegas. Quando eles se cadastrarem, entrarão automaticamente para o seu time.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={uniqueLink} readOnly className="bg-muted/50 font-mono text-sm" />
            <Button variant="outline" onClick={handleCopy}><Copy className="w-4 h-4 mr-2" /> Copiar</Button>
            <Button onClick={handleShare} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Share2 className="w-4 h-4 mr-2" /> Compartilhar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Material de Divulgação</CardTitle>
          <CardDescription>Baixe imagens prontas para postar no seu Instagram, WhatsApp ou LinkedIn.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="group relative rounded-xl border overflow-hidden aspect-square bg-muted">
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="secondary" size="sm"><Download className="w-4 h-4 mr-2" /> Baixar</Button>
                </div>
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <Award className="w-8 h-8 text-primary/30 mb-2" />
                  <span className="text-xs font-semibold text-muted-foreground">Banner {i}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
