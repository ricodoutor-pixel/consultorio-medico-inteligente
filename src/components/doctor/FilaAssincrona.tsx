import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, FastForward, CheckCircle2, ShieldCheck, Clock, FileText, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for the async queue
const mockRequests = [
  {
    id: "req_1",
    patientName: "João Silva",
    age: 34,
    condition: "Ansiedade (F41.1)",
    currentPrescription: "Óleo CBD 10% (10 gotas/dia)",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Mock public audio
    notes: "O paciente relata melhora no sono, mas a ansiedade continua durante a tarde. Sobrou meio frasco.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    status: "pending"
  },
  {
    id: "req_2",
    patientName: "Maria Fernandes",
    age: 42,
    condition: "Dor Crônica (M79.7)",
    currentPrescription: "THC:CBD 1:1 (5 gotas/noite)",
    audioUrl: null,
    notes: "Não consegui gravar o áudio. As dores nas articulações reduziram cerca de 70%. Acabou o frasco. Gostaria de manter a mesma receita.",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    status: "pending"
  }
];

export const FilaAssincrona = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState(mockRequests);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayback = (req: typeof mockRequests[0]) => {
    if (!req.audioUrl) return;

    if (playingId === req.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = req.audioUrl;
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.play();
        setPlayingId(req.id);
      }
    }
  };

  const toggleSpeed = () => {
    const newSpeed = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleApprove = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "approved" } : r));
    toast({
      title: "Receita Emitida com Sucesso",
      description: "A receita digital foi gerada e enviada ao paciente via WhatsApp.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-black flex items-center gap-2">
            <Clock className="text-primary" /> Fila Assíncrona
          </h2>
          <p className="text-sm text-muted-foreground">Analise as solicitações expressas e renove receitas em 1-Click.</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30">
          {requests.filter(r => r.status === "pending").length} Aguardando Revisão
        </Badge>
      </div>

      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />

      {requests.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <CheckCircle2 size={48} className="text-green-500 mb-4 opacity-50" />
            <p>Fila assíncrona vazia.</p>
            <p className="text-xs">Todas as renovações foram atendidas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map(req => (
            <Card key={req.id} className={`border-border transition-all ${req.status === "approved" ? "opacity-50 grayscale" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{req.patientName}, {req.age} anos</CardTitle>
                    <CardDescription className="font-bold text-foreground">{req.condition}</CardDescription>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock size={12} /> {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-xl border border-border">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Prescrição Atual</span>
                    <span className="text-sm font-bold text-foreground">{req.currentPrescription}</span>
                  </div>
                  
                  {req.audioUrl ? (
                    <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/20 flex flex-col justify-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-blue-500 block">Relato de Áudio</span>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className={`rounded-full h-8 w-8 p-0 flex-shrink-0 ${playingId === req.id ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                          onClick={() => togglePlayback(req)}
                        >
                          {playingId === req.id ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                        </Button>
                        <div className="flex-1 h-1.5 bg-blue-500/20 rounded-full overflow-hidden">
                          {playingId === req.id && <div className="h-full bg-blue-500 w-full animate-pulse" />}
                        </div>
                        <Button variant="outline" size="sm" className="h-8 text-[10px] font-mono px-2" onClick={toggleSpeed}>
                          {playbackRate}x
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-muted/30 rounded-xl border border-border flex items-center gap-2">
                      <FileText size={16} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground italic">Paciente não enviou áudio.</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-background rounded-xl border border-border">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1 flex items-center gap-1">
                    <FileText size={10} /> Notas do Paciente
                  </span>
                  <p className="text-sm text-foreground leading-relaxed">{req.notes}</p>
                </div>

                {req.status === "pending" ? (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border mt-4">
                    <Button variant="outline" className="rounded-xl border-red-500/50 text-red-500 hover:bg-red-500/10">
                      Exigir Consulta por Vídeo
                    </Button>
                    <Button className="rounded-xl bg-green-500 hover:bg-green-600 text-white" onClick={() => handleApprove(req.id)}>
                      <ShieldCheck size={16} className="mr-2" />
                      Aprovar & Emitir Receita
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border mt-4">
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Receita Emitida
                    </Badge>
                  </div>
                )}
                
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
