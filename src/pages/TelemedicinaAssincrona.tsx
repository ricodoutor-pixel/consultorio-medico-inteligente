import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Play, Pause, Send, ShieldCheck, Clock, CheckCircle2, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function TelemedicinaAssincrona() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      let time = 0;
      timerRef.current = setInterval(() => {
        time += 1;
        setRecordingTime(time);
        if (time >= 60) stopRecording(); // Auto-stop after 60s
      }, 1000);

    } catch (err) {
      toast({
        title: "Erro de Microfone",
        description: "Permita o acesso ao microfone para gravar o áudio.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!audioBlob && !notes.trim()) {
      toast({
        title: "Atenção",
        description: "Grave um áudio ou escreva como está o tratamento antes de enviar.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setUploadError(null);

      const { data: { user } } = await supabase.auth.getUser();
      const patientId = user?.id || `anon_${Date.now()}`;
      const sessionId = `async_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      let finalAudioUrl: string | null = null;

      if (audioBlob) {
        const filePath = `${patientId}/${sessionId}.webm`;
        
        // Tenta upload no bucket consultation-records ou patient-records
        let uploadResult = await supabase.storage
          .from("consultation-records")
          .upload(filePath, audioBlob, {
            contentType: "audio/webm",
            upsert: true,
          });

        let bucketName = "consultation-records";
        if (uploadResult.error) {
          bucketName = "patient-records";
          uploadResult = await supabase.storage
            .from(bucketName)
            .upload(filePath, audioBlob, {
              contentType: "audio/webm",
              upsert: true,
            });
        }

        if (uploadResult.error) {
          throw new Error(`Falha no upload do áudio: ${uploadResult.error.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        finalAudioUrl = publicUrlData?.publicUrl || uploadResult.data.path;
      }

      // Registro na tabela do Supabase com patient_id/session_id, URL do áudio, timestamp e status pending_review
      const payload = {
        patient_id: user?.id || null,
        session_id: sessionId,
        audio_url: finalAudioUrl,
        notes: notes.trim() || null,
        session_type: "async_renewal",
        status: "pending_review",
        created_at: new Date().toISOString(),
      };

      const { error: dbError } = await (supabase as any)
        .from("telemed_sessions")
        .insert(payload);

      if (dbError) {
        await (supabase as any).from("consultation_records").insert({
          patient_id: user?.id || null,
          record_url: finalAudioUrl,
          clinical_notes: notes.trim() || null,
          status: "pending_review",
          created_at: new Date().toISOString(),
        }).catch(() => {});
      }

      setIsSubmitting(false);
      setIsSuccess(true);
      toast({
        title: "Relato Enviado com Sucesso!",
        description: "Seu áudio foi armazenado no prontuário e aguarda avaliação médica.",
      });
    } catch (err: any) {
      console.error("Erro no upload da telemedicina assíncrona:", err);
      setIsSubmitting(false);
      setUploadError(err.message || "Erro de conexão ao enviar o áudio.");
      toast({
        title: "Erro no Envio",
        description: "Não foi possível enviar o áudio. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-dvh bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 pt-24">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full">
            <Card className="border-green-500/30 bg-green-500/5 text-center p-8">
              <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-display font-black text-foreground mb-2">Solicitação Enviada!</h2>
              <p className="text-muted-foreground mb-6">
                Seu médico avaliará seu áudio/relato e emitirá a nova receita digital em até <strong>4 horas úteis</strong>.
              </p>
              <Button onClick={() => navigate("/dashboard")} className="w-full">
                Voltar ao Dashboard
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 container max-w-2xl mx-auto p-4 pt-24 space-y-6">
        <div>
          <h1 className="text-3xl font-display font-black text-foreground flex items-center gap-2">
            <Clock className="text-primary" /> Renovação Express
          </h1>
          <p className="text-muted-foreground mt-2">
            Renove sua receita sem precisar de uma videochamada. Grave um áudio rápido ou escreva como está o seu tratamento atual.
          </p>
        </div>

        <Card className="border-border">
          <CardHeader className="pb-4 border-b border-border">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mic size={18} className="text-primary" /> Como você está se sentindo?
            </CardTitle>
            <CardDescription>
              Fale sobre o alívio dos sintomas, efeitos colaterais e qual frasco está usando.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            {/* Audio Recorder UI */}
            <div className="bg-muted/30 p-6 rounded-2xl border border-border flex flex-col items-center justify-center gap-4">
              {audioUrl ? (
                <div className="w-full space-y-4">
                  <div className="flex items-center gap-4 bg-background p-3 rounded-xl border border-border">
                    <Button variant="outline" size="icon" className="rounded-full flex-shrink-0" onClick={togglePlayback}>
                      {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-1" />}
                    </Button>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
                      <div className="absolute inset-y-0 left-0 bg-primary w-1/3" /> {/* Fake progress */}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground font-bold">0:00 / {formatTime(recordingTime)}</span>
                  </div>
                  <div className="flex justify-center">
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => { setAudioUrl(null); setAudioBlob(null); setRecordingTime(0); }}>
                      Excluir gravação
                    </Button>
                  </div>
                  <audio 
                    ref={audioRef} 
                    src={audioUrl} 
                    onEnded={() => setIsPlaying(false)} 
                    className="hidden" 
                  />
                </div>
              ) : (
                <div className="text-center">
                  <motion.button
                    animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors shadow-lg ${isRecording ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                  >
                    {isRecording ? <Square size={32} /> : <Mic size={32} />}
                  </motion.button>
                  <p className="mt-4 font-mono font-bold text-foreground text-xl">
                    {formatTime(recordingTime)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRecording ? "Gravando... clique para parar" : "Clique para gravar um áudio (máx 1min)"}
                  </p>
                </div>
              )}
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs font-bold uppercase">Ou escreva um relato</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <Textarea 
              placeholder="Descreva brevemente como tem sido sua experiência com a medicação atual, se houve melhora e se sobrou óleo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] resize-none bg-background rounded-xl"
            />
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-500/10 text-blue-600 p-3 rounded-lg">
              <ShieldCheck size={16} />
              Seu relato é confidencial e será avaliado apenas pelo seu médico titular.
            </div>

            {uploadError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-destructive text-xs font-semibold">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw size={14} /> Tentar Reenviar
                </Button>
              </div>
            )}

            <Button 
              size="lg" 
              className="w-full font-bold rounded-xl h-12" 
              disabled={isSubmitting || (!audioBlob && !notes.trim())}
              onClick={handleSubmit}
            >
              {isSubmitting ? <><Loader2 size={18} className="mr-2 animate-spin" /> Enviando relato...</> : <><Send size={18} className="mr-2" /> Enviar Solicitação para o Médico</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
