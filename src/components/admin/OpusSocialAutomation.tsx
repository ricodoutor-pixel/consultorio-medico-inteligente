import { useState } from "react";
import { motion } from "framer-motion";
import {
  Video, Sparkles, Youtube, CheckCircle2, Copy, ExternalLink,
  Download, Clock, Share2, Play, Calendar, Zap, MessageSquare
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

interface SocialVideoClip {
  id: string;
  index: number;
  title: string;
  durationSeconds: number;
  videoUrl: string;
  copy: string;
  targetPlatforms: string[];
  scheduledAt: string;
  status: string;
}

const SAMPLE_CLIPS: SocialVideoClip[] = [
  {
    id: "clip-1",
    index: 1,
    title: "Autonomia: O Poder da Consciência e Escolhas Humanas",
    durationSeconds: 72,
    videoUrl: "https://signed-ext.cdn.opus.pro/media/org_1k14bfc9kqSy0loV8A465/user_01M14BFA1N2AXZ1QHA5S1CA465/P3082818t1c0/c.vLL5f2cml5/VIDEO_PREVIEW.mp4",
    copy: "🌿 Autonomia: O Poder da Consciência e Escolhas Humanas\n\nVocê sabia que a medicina canabinoide está transformando vidas no Brasil com embasamento científico e respaldo legal?\n\n🔗 Acesse: https://plantayraiz.com.br\n📲 WhatsApp: (11) 99136-3154\n#plantayraiz #cannabismedicinal #telemedicina",
    targetPlatforms: ["YouTube Shorts", "TikTok"],
    scheduledAt: "Hoje às 18:00",
    status: "pronto",
  },
  {
    id: "clip-2",
    index: 2,
    title: "Correlação vs. Causalidade: A Diferença Fundamental na Ciência",
    durationSeconds: 75,
    videoUrl: "https://signed-ext.cdn.opus.pro/media/org_1k14bfc9kqSy0loV8A465/user_01M14BFA1N2AXZ1QHA5S1CA465/P3082818t1c0/c.vLL5f2cml5/VIDEO_PREVIEW.mp4",
    copy: "🌿 Correlação vs. Causalidade na Saúde\n\nEntenda as evidências clínicas por trás dos tratamentos canabinoides na maior plataforma do Brasil.\n\n🔗 Acesse: https://plantayraiz.com.br\n📲 WhatsApp: (11) 99136-3154\n#plantayraiz #saude #shorts",
    targetPlatforms: ["YouTube Shorts", "TikTok"],
    scheduledAt: "Hoje às 20:00",
    status: "pronto",
  },
  {
    id: "clip-3",
    index: 3,
    title: "Teoria da Porta de Entrada: Álcool vs. Substâncias Medicamentosas",
    durationSeconds: 99,
    videoUrl: "https://signed-ext.cdn.opus.pro/media/org_1k14bfc9kqSy0loV8A465/user_01M14BFA1N2AXZ1QHA5S1CA465/P3082818t1c0/c.vLL5f2cml5/VIDEO_PREVIEW.mp4",
    copy: "🌿 Mitos e Verdades sobre Cannabis Medicinal\n\nConsulte médicos especialistas e inicie seu acompanhamento 100% legalizado e seguro.\n\n🔗 Agende agora: https://plantayraiz.com.br\n📲 WhatsApp: (11) 99136-3154\n#plantayraiz #telemedicina #saudeintegrativa",
    targetPlatforms: ["YouTube Shorts", "TikTok"],
    scheduledAt: "Amanhã às 09:00",
    status: "pronto",
  },
  {
    id: "clip-4",
    index: 4,
    title: "Canábis no Brasil: Nova Era Farmacêutica e Regulação ANVISA",
    durationSeconds: 176,
    videoUrl: "https://signed-ext.cdn.opus.pro/media/org_1k14bfc9kqSy0loV8A465/user_01M14BFA1N2AXZ1QHA5S1CA465/P3082818t1c0/c.vLL5f2cml5/VIDEO_PREVIEW.mp4",
    copy: "🌿 O Avanço da Regulação ANVISA no Brasil\n\nConectamos pacientes aos melhores médicos e produtos do mercado com prontuário CFM e prescrição digital.\n\n🔗 Conheça: https://plantayraiz.com.br\n📲 WhatsApp: (11) 99136-3154\n#plantayraiz #cannabisbrasil #rdc660",
    targetPlatforms: ["YouTube Shorts", "TikTok"],
    scheduledAt: "Amanhã às 11:00",
    status: "pronto",
  },
  {
    id: "clip-5",
    index: 5,
    title: "Planta é Porta de Entrada para Drogas? Mito vs Realidade",
    durationSeconds: 22,
    videoUrl: "https://signed-ext.cdn.opus.pro/media/org_1k14bfc9kqSy0loV8A465/user_01M14BFA1N2AXZ1QHA5S1CA465/P3082818t1c0/c.cnqHvIMw8L/VIDEO_PREVIEW_-0-22326.mp4",
    copy: "🌿 Desmistificando a Cannabis Medicinal no Brasil.\n\n🔗 Acesse: https://plantayraiz.com.br\n📲 WhatsApp: (11) 99136-3154\n#plantayraiz #telemedicina #shorts #tiktok",
    targetPlatforms: ["YouTube Shorts", "TikTok"],
    scheduledAt: "Amanhã às 14:00",
    status: "pronto",
  }
];

export const OpusSocialAutomation = () => {
  const [selectedClip, setSelectedClip] = useState<SocialVideoClip | null>(null);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("📋 Copy com link e WhatsApp copiada para a área de transferência!");
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur-xl relative overflow-hidden">
      <CardContent className="p-5 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-red-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-500/10">
              <Video size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-black text-sm md:text-base text-foreground flex items-center gap-1.5">
                  Fila de Publicação Automatizada · 43 Vídeos Opus Clip
                </h3>
                <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/30 text-[10px] font-bold">
                  🟢 43 VÍDEOS COM LINK & WHATSAPP
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Campanha com Whindersson Nunes / WhinCBD · Link oficial https://plantayraiz.com.br e WhatsApp (11) 99136-3154
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30 font-bold py-1 px-3">
              <Youtube size={14} className="mr-1.5" /> YouTube Shorts
            </Badge>
            <Badge variant="outline" className="text-xs bg-pink-500/10 text-pink-400 border-pink-500/30 font-bold py-1 px-3">
              <Share2 size={14} className="mr-1.5" /> TikTok Feed/Inbox
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Total na Fila</span>
            <p className="text-2xl font-black text-foreground mt-0.5">43 Vídeos</p>
            <span className="text-[10px] text-emerald-400 font-medium">100% Processados</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Links Injetados</span>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">43 / 43</p>
            <span className="text-[10px] text-emerald-400/90 font-medium">plantayraiz.com.br</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">WhatsApp Injetado</span>
            <p className="text-2xl font-black text-sky-400 mt-0.5">43 / 43</p>
            <span className="text-[10px] text-sky-400/90 font-medium">(11) 99136-3154</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
            <span className="text-[10px] text-rose-400 uppercase font-bold">Canais Conectados</span>
            <p className="text-2xl font-black text-rose-400 mt-0.5">2 Canais</p>
            <span className="text-[10px] text-rose-400/90 font-bold">YouTube + TikTok</span>
          </div>
        </div>

        {/* Table of Queued Clips */}
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="p-3.5 bg-muted/30 border-b border-border flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Zap size={14} className="text-rose-400" /> Cronograma de Postagens Sequenciais
            </span>
            <Badge variant="outline" className="text-[9px] bg-rose-500/10 text-rose-400 border-rose-500/30 font-mono">
              OPUS PROJECT P3082818t1c0
            </Badge>
          </div>
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="text-[10px] font-bold w-12">#</TableHead>
                <TableHead className="text-[10px] font-bold">Título / Headline</TableHead>
                <TableHead className="text-[10px] font-bold">Duração</TableHead>
                <TableHead className="text-[10px] font-bold">Destino</TableHead>
                <TableHead className="text-[10px] font-bold">Link & Contato</TableHead>
                <TableHead className="text-[10px] font-bold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SAMPLE_CLIPS.map((clip) => (
                <TableRow key={clip.id} className="hover:bg-muted/30 transition-colors text-xs">
                  <TableCell className="py-2.5 font-mono font-bold text-muted-foreground">
                    {clip.index}
                  </TableCell>
                  <TableCell className="py-2.5 font-bold text-foreground max-w-xs truncate">
                    {clip.title}
                  </TableCell>
                  <TableCell className="py-2.5 font-mono text-[11px] text-rose-400 font-bold">
                    {clip.durationSeconds}s
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex items-center gap-1">
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/30 text-[9px] font-bold">YT Shorts</Badge>
                      <Badge className="bg-pink-500/10 text-pink-400 border-pink-500/30 text-[9px] font-bold">TikTok</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                      ✓ Link + WhatsApp
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyText(clip.copy)}
                        className="h-7 px-2 text-[11px] font-bold text-foreground hover:bg-muted"
                      >
                        <Copy size={12} className="mr-1" /> Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedClip(clip)}
                        className="h-7 px-2 text-[11px] font-bold border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                      >
                        <Play size={12} className="mr-1" /> Ver Vídeo
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Modal para Visualizar Vídeo e Copy */}
      <Dialog open={!!selectedClip} onOpenChange={() => setSelectedClip(null)}>
        <DialogContent className="sm:max-w-md bg-slate-950 border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Video size={16} className="text-rose-400" /> {selectedClip?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Duração: {selectedClip?.durationSeconds}s · Pronto para YouTube Shorts e TikTok
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="p-3 rounded-xl bg-slate-900 border border-border text-xs whitespace-pre-wrap font-sans text-foreground">
              {selectedClip?.copy}
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectedClip && handleCopyText(selectedClip.copy)}
                className="text-xs font-bold"
              >
                <Copy size={13} className="mr-1.5" /> Copiar Legenda Completa
              </Button>
              <a
                href={selectedClip?.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-xs font-bold text-rose-400 hover:underline"
              >
                <Download size={13} className="mr-1" /> Baixar Vídeo MP4
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
