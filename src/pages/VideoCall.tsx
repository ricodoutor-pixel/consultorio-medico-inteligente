import React, { useState, useEffect } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Mic, MicOff, VideoOff, PhoneOff, MessageSquare, FileText, Share2, ShieldCheck, Activity, Leaf } from "lucide-react";
import { motion } from "framer-motion";

const VideoCall = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [consultationId, setConsultationId] = useState("CONS-123456");
  const [messages, setMessages] = useState([
    { id: 1, text: "Olá, Dr. Edilson. Estou com dor nas costas.", translated: "Hola, Dr. Edilson. Tengo dolor de espalda.", sender: "patient", lang: "es" },
    { id: 2, text: "Olá! Vamos iniciar o protocolo de CBD Full Spectrum.", translated: "¡Hola! Iniciemos el protocolo de CBD de Espectro Completo.", sender: "doctor", lang: "pt" }
  ]);
  const [inputText, setInputText] = useState("");

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage = {
      id: Date.now(),
      text: inputText,
      translated: "Traduzindo termo médico (Manus CEO)...",
      sender: "doctor",
      lang: "pt"
    };
    setMessages([...messages, newMessage]);
    setInputText("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col">
          <header className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary glow-green">
                <Video size={20} />
              </div>
              <div>
                <h1 className="text-xl font-display font-black text-foreground">Consulta Online</h1>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold text-green-500 border-green-500/20 bg-green-500/5">Conexão Segura</Badge>
                  ID: {consultationId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">Tempo: 12:45</Badge>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow h-[600px]">
            {/* Video Area */}
            <Card className="lg:col-span-3 border-border bg-card/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary mx-auto mb-4 glow-green">
                    <Activity size={40} className="animate-pulse" />
                  </div>
                  <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Aguardando Conexão...</p>
                </div>
              </div>
              
              {/* Local Preview (Small) */}
              <div className="absolute bottom-6 right-6 w-48 h-32 rounded-2xl bg-neutral-800 border-2 border-primary/30 overflow-hidden shadow-2xl z-10">
                <div className="w-full h-full flex items-center justify-center bg-neutral-700">
                  <Video size={24} className="text-muted-foreground" />
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/50 text-[10px] font-bold text-white">Você</div>
              </div>

              {/* Controls Overlay */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
                <Button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-12 h-12 rounded-full border-none shadow-xl ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-neutral-800 hover:bg-neutral-700'}`}
                >
                  {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                </Button>
                <Button 
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`w-12 h-12 rounded-full border-none shadow-xl ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-neutral-800 hover:bg-neutral-700'}`}
                >
                  {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                </Button>
                <Button className="w-16 h-12 rounded-full bg-red-600 hover:bg-red-700 border-none shadow-xl">
                  <PhoneOff size={24} />
                </Button>
              </div>
            </Card>

            {/* Side Tools */}
            <div className="space-y-6 flex flex-col">
              <Card className="border-border bg-card/50 flex-grow">
                <CardHeader>
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} className="text-primary" /> Chat da Consulta
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex-grow space-y-4 mb-4 overflow-y-auto max-h-[350px]">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`p-3 rounded-2xl text-xs ${msg.sender === 'doctor' ? 'bg-primary/10 border border-primary/20 ml-4' : 'bg-muted/50 mr-4'}`}>
                        <p className="font-bold mb-1">{msg.text}</p>
                        <p className="text-[10px] text-muted-foreground italic border-t border-border/50 pt-1 mt-1 flex items-center gap-1">
                          <Leaf size={10} className="text-primary" /> {msg.translated}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <input 
                      type="text" 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Mensagem (Tradução IA ativa)..." 
                      className="flex-grow bg-neutral-900 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
                    />
                    <Button size="sm" className="rounded-xl" onClick={handleSendMessage}><Share2 size={14} /></Button>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-2 text-center">
                    🌐 Tradução Médica em Tempo Real (PT/ES/EN) ativa.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/50">
                <CardHeader>
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <FileText size={14} className="text-primary" /> Prontuário IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <Button variant="outline" className="w-full justify-start text-xs font-bold rounded-xl h-10 border-border hover:bg-primary/5 hover:text-primary transition-all">
                    <FileText size={14} className="mr-2" /> Gerar Receita Digital
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-xs font-bold rounded-xl h-10 border-border hover:bg-primary/5 hover:text-primary transition-all">
                    <ShieldCheck size={14} className="mr-2" /> Atestado Médico
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default VideoCall;
