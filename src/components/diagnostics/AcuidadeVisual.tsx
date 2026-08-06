import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, BookOpen, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Direction = 'up' | 'down' | 'left' | 'right';
type EyeTest = 'right' | 'left' | 'done';

const OPTOTYPE_LEVELS = [
  { snellen: '20/200', sizePx: 200, scale: 10 },
  { snellen: '20/100', sizePx: 100, scale: 5 },
  { snellen: '20/80', sizePx: 80, scale: 4 },
  { snellen: '20/50', sizePx: 50, scale: 2.5 },
  { snellen: '20/40', sizePx: 40, scale: 2 },
  { snellen: '20/30', sizePx: 30, scale: 1.5 },
  { snellen: '20/20', sizePx: 20, scale: 1 }, // Normal vision
];

export const AcuidadeVisual = () => {
  const [testState, setTestState] = useState<EyeTest | null>(null);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [currentDirection, setCurrentDirection] = useState<Direction>('up');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  const [results, setResults] = useState<{
    rightEye: string;
    leftEye: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const speakBrisa = (text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    speechSynthesis.speak(utterance);
  };

  const startTest = () => {
    setResults(null);
    setTestState('right');
    setCurrentLevelIndex(0);
    generateNextOptotype();
    speakBrisa("Vamos começar o teste. Cubra seu olho esquerdo com a palma da mão, sem apertar. Olhe para a letra E e aperte a seta indicando para onde as pernas dela estão apontando.");
  };

  const generateNextOptotype = () => {
    const directions: Direction[] = ['up', 'down', 'left', 'right'];
    const randomDir = directions[Math.floor(Math.random() * directions.length)];
    setCurrentDirection(randomDir);
  };

  const handleAnswer = async (answer: Direction) => {
    if (answer === currentDirection) {
      // Acertou, diminui a letra
      if (currentLevelIndex < OPTOTYPE_LEVELS.length - 1) {
        setCurrentLevelIndex(prev => prev + 1);
        generateNextOptotype();
        speakBrisa("Muito bem. E agora?");
      } else {
        // Chegou no nível máximo (20/20)
        finishEyeTest('20/20');
      }
    } else {
      // Errou. Registra o nível anterior como o limite dele
      const finalSnellen = currentLevelIndex === 0 ? '<20/200' : OPTOTYPE_LEVELS[currentLevelIndex - 1].snellen;
      finishEyeTest(finalSnellen);
    }
  };

  const finishEyeTest = async (snellen: string) => {
    if (testState === 'right') {
      setResults(prev => ({ rightEye: snellen, leftEye: '' }));
      setTestState('left');
      setCurrentLevelIndex(0);
      generateNextOptotype();
      speakBrisa(`Registrei a visão do seu olho direito. Agora, cubra o olho direito e vamos testar o olho esquerdo.`);
    } else if (testState === 'left') {
      setResults(prev => ({ rightEye: prev!.rightEye, leftEye: snellen }));
      setTestState('done');
      speakBrisa(`Exame concluído! Sua visão foi medida com sucesso e enviada ao prontuário.`);
      saveResults(snellen);
    }
  };

  const saveResults = async (leftSnellen: string) => {
    try {
      const finalLeft = leftSnellen;
      const finalRight = results?.rightEye || '';
      
      let isDangerous = false;
      if (finalRight === '<20/200' || finalLeft === '<20/200' || finalRight === '20/200' || finalLeft === '20/200') {
        isDangerous = true;
      }

      const aiResult = {
        diagnosis: `Acuidade Visual medida: Olho Direito (${finalRight}) | Olho Esquerdo (${finalLeft}).`,
        findings: [
          `Olho Direito (OD): ${finalRight}`,
          `Olho Esquerdo (OE): ${finalLeft}`
        ],
        isDangerous,
        brisaSpeech: isDangerous ? "Sua acuidade visual está bastante reduzida. É muito importante consultar um oftalmologista em breve." : "Sua visão está dentro dos parâmetros medidos. Parabéns por cuidar da saúde ocular!"
      };

      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        await supabase.from('diagnostic_exams').insert({
          user_id: session.session.user.id,
          exam_type: 'visual_acuity',
          ai_diagnosis: aiResult,
          risk_level: isDangerous ? 'alto' : 'baixo'
        });
      }
    } catch (err) {
      console.error("Error saving acuity:", err);
    }
  };

  const getOptotypeRotation = () => {
    switch (currentDirection) {
      case 'up': return 'rotate-[-90deg]';
      case 'down': return 'rotate-[90deg]';
      case 'left': return 'rotate-180';
      case 'right': return 'rotate-0';
    }
  };

  const renderComicManual = () => (
    <div className="space-y-4 font-sans text-sm md:text-base text-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-4 border-black rounded-lg p-4 bg-teal-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 1</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Distância Certa</h3>
          <p className="font-bold leading-tight">Segure o celular com o braço esticado (cerca de 40 cm do seu rosto). Não incline a tela.</p>
          <div className="mt-4 flex justify-center text-5xl">📱📏</div>
        </div>
        
        <div className="border-4 border-black rounded-lg p-4 bg-blue-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 2</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Cubra o Olho</h3>
          <p className="font-bold leading-tight">Faça uma concha com a mão e cubra um olho sem apertar! Primeiro testamos o direito.</p>
          <div className="mt-4 flex justify-center text-5xl">👁️✋</div>
        </div>

        <div className="border-4 border-black rounded-lg p-4 bg-pink-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 3</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Qual a direção?</h3>
          <p className="font-bold leading-tight">A letra 'E' aparecerá. Aperte o botão na tela informando para que lado estão as pernas do E.</p>
          <div className="mt-4 flex justify-center text-5xl">👆</div>
        </div>

        <div className="border-4 border-black rounded-lg p-4 bg-yellow-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 4</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Fique Focado</h3>
          <p className="font-bold leading-tight">A letra vai diminuir. Quando não enxergar mais, apenas "chute" ou diga que não sabe!</p>
          <div className="mt-4 flex justify-center text-5xl">🔍</div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-primary/20 overflow-hidden relative">
      <CardHeader className="bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border-b border-border">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-2xl font-black text-teal-700 dark:text-teal-400">
            <Eye className="w-8 h-8 text-teal-500" />
            Acuidade Visual (Snellen)
          </CardTitle>
          <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-2 border-primary/50 text-primary font-bold hover:bg-primary/10 rounded-full">
                <BookOpen className="w-4 h-4" /> Como Funciona
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-4 border-black rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase text-center mb-4 text-teal-600 font-comic">Manual de Acuidade Visual</DialogTitle>
              </DialogHeader>
              {renderComicManual()}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col items-center justify-center p-8 border-4 border-dashed border-muted rounded-3xl bg-muted/30 min-h-[400px]">
          
          {!testState && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
              <Button 
                size="lg" 
                onClick={startTest}
                className="w-32 h-32 rounded-full shadow-[0_0_40px_rgba(20,184,166,0.3)] bg-gradient-to-br from-teal-400 to-emerald-500 hover:scale-105 transition-all text-white border-4 border-teal-200"
              >
                <Play className="w-12 h-12 ml-2" />
              </Button>
              <h3 className="mt-6 text-xl font-black text-center text-foreground">Iniciar Teste Oftalmológico</h3>
              <p className="text-muted-foreground text-center mt-2 max-w-xs font-medium">Estique o braço (40cm), limpe a lente dos seus óculos e vamos lá!</p>
            </motion.div>
          )}

          {(testState === 'right' || testState === 'left') && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center w-full">
              <div className="mb-6 px-4 py-1 bg-teal-100 text-teal-800 rounded-full font-black text-sm uppercase animate-pulse">
                Testando: {testState === 'right' ? 'Olho Direito' : 'Olho Esquerdo'}
              </div>

              {/* Optotype Area */}
              <div className="h-48 flex items-center justify-center mb-8 bg-white w-full rounded-2xl border-4 border-gray-100">
                <span 
                  className={`font-black text-black transition-all duration-300 ${getOptotypeRotation()}`}
                  style={{ fontSize: `${OPTOTYPE_LEVELS[currentLevelIndex].sizePx}px`, lineHeight: 1 }}
                >
                  E
                </span>
              </div>
              
              {/* Controls */}
              <div className="grid grid-cols-3 gap-3 w-64 mx-auto">
                <div />
                <Button onClick={() => handleAnswer('up')} className="h-16 bg-gray-200 hover:bg-teal-500 text-black border-2 border-black rounded-xl text-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]"><ArrowUp /></Button>
                <div />
                <Button onClick={() => handleAnswer('left')} className="h-16 bg-gray-200 hover:bg-teal-500 text-black border-2 border-black rounded-xl text-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]"><ArrowLeft /></Button>
                <div className="flex items-center justify-center font-bold text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded-xl">DIREÇÃO</div>
                <Button onClick={() => handleAnswer('right')} className="h-16 bg-gray-200 hover:bg-teal-500 text-black border-2 border-black rounded-xl text-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]"><ArrowRight /></Button>
                <div />
                <Button onClick={() => handleAnswer('down')} className="h-16 bg-gray-200 hover:bg-teal-500 text-black border-2 border-black rounded-xl text-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]"><ArrowDown /></Button>
                <div />
              </div>
            </motion.div>
          )}

          {testState === 'done' && (
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-2xl font-black text-teal-700">Resultado Acuidade Visual</h3>
                 <Button variant="outline" size="sm" onClick={() => setTestState(null)} className="font-bold border-2 rounded-xl">Refazer</Button>
               </div>
               
               <div className="p-5 rounded-2xl border-l-8 shadow-sm bg-teal-50 border-teal-500">
                 <div className="flex items-start gap-3">
                   <CheckCircle2 className="w-8 h-8 text-teal-500 flex-shrink-0 mt-1" />
                   <div>
                     <h4 className="font-black text-lg text-teal-700">Fração de Snellen</h4>
                     <p className="text-gray-700 font-medium mt-1 leading-relaxed">
                       O teste estimou sua capacidade de enxergar detalhes. Um resultado 20/20 indica visão normal.
                     </p>
                   </div>
                 </div>
               </div>

               <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                 <h4 className="font-black text-sm uppercase text-muted-foreground mb-4 flex items-center gap-2"><Eye className="w-4 h-4"/> Medições</h4>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border-2 border-gray-100 text-center">
                        <p className="text-sm font-bold text-gray-500">Olho Direito</p>
                        <p className="text-3xl font-black text-teal-600">{results?.rightEye}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border-2 border-gray-100 text-center">
                        <p className="text-sm font-bold text-gray-500">Olho Esquerdo</p>
                        <p className="text-3xl font-black text-teal-600">{results?.leftEye}</p>
                    </div>
                 </div>
               </div>
             </motion.div>
          )}
        </div>

        {/* Janela da Enf. Brisa (Assistente de Voz) */}
        <AnimatePresence>
          {(testState) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 border-4 border-black rounded-2xl bg-[#ffde59] p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 rounded-bl-lg">Brisa Voice Assistant</div>
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-white border-2 border-black rounded-full overflow-hidden flex-shrink-0 shadow-inner flex items-center justify-center">
                  <span className="text-4xl">🐸</span>
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <p className="font-black text-lg md:text-xl text-black leading-tight italic">
                    {testState === 'right' && "Estou avaliando seu Olho Direito. Indique para qual lado as pernas da letra apontam!"}
                    {testState === 'left' && "Troque a mão, vamos avaliar seu Olho Esquerdo agora. Indique a direção!"}
                    {testState === 'done' && "Prontinho! Seus resultados foram registrados com sucesso."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </CardContent>
    </Card>
  );
};
