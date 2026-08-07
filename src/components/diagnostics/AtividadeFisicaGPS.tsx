import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Play, Square, Map as MapIcon, Activity, Flame, Footprints, Clock, Wind, ArrowUp, AlertTriangle, BookOpen, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import L from 'leaflet';

// Haversine formula to calculate distance between two coordinates in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Simple Map Recenter component
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const ACTIVITIES = [
  { id: 'Caminhada', met: 3.5, icon: '🚶' },
  { id: 'Corrida', met: 9.0, icon: '🏃' },
  { id: 'Ciclismo', met: 6.8, icon: '🚴' },
  { id: 'Escadas', met: 9.0, icon: '🪜' },
  { id: 'Livre', met: 4.5, icon: '🧘' }
];

export const AtividadeFisicaGPS = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'finished'>('idle');
  const [selectedActivity, setSelectedActivity] = useState(ACTIVITIES[0]);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  const [path, setPath] = useState<[number, number][]>([]);
  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsedTimeSec, setElapsedTimeSec] = useState(0);
  const [steps, setSteps] = useState(0);
  const [stairs, setStairs] = useState(0);
  const [userWeight, setUserWeight] = useState(70);

  const [aiResult, setAiResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAccelRef = useRef<{ z: number, time: number }>({ z: 0, time: 0 });

  useEffect(() => {
    fetchProfile();
    return () => {
      stopHardwareTracking();
      speechSynthesis.cancel();
    };
  }, []);

  const fetchProfile = async () => {
    // Peso padrão (70kg) — o perfil não armazena peso.
    setUserWeight(70);
  };

  const speakBrisa = (text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    speechSynthesis.speak(utterance);
  };

  const handleDeviceMotion = (e: DeviceMotionEvent) => {
    if (status !== 'running') return;
    
    // Simple Step Detection (Vertical Acceleration Peak)
    const z = e.accelerationIncludingGravity?.z || 0;
    const now = Date.now();
    const last = lastAccelRef.current;
    
    // threshold detection
    if (z > 12 && last.z <= 12 && (now - last.time > 300)) {
      setSteps(s => s + 1);
      // Rough approximation for stairs if activity is stairs or high impact
      if (selectedActivity.id === 'Escadas' && (now - last.time < 800)) {
         setStairs(s => s + 0.05); // roughly 20 steps = 1 flight
      }
    }
    lastAccelRef.current = { z, time: now };
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("GPS não suportado no seu dispositivo.");
      return;
    }

    if (status === 'idle') {
      setPath([]);
      setDistanceKm(0);
      setElapsedTimeSec(0);
      setSteps(0);
      setStairs(0);
      setAiResult(null);
    }

    setStatus('running');
    speakBrisa(`Iniciando ${selectedActivity.id}. Vamos lá, estou monitorando seus sinais.`);

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTimeSec(prev => prev + 1);
    }, 1000);

    // Watch GPS
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPath(prevPath => {
          if (prevPath.length > 0) {
            const [lastLat, lastLon] = prevPath[prevPath.length - 1];
            const dist = calculateDistance(lastLat, lastLon, latitude, longitude);
            if (dist > 0.005) { // Only update if moved > 5m to avoid GPS jitter
              setDistanceKm(d => d + dist);
              return [...prevPath, [latitude, longitude]];
            }
            return prevPath;
          }
          return [[latitude, longitude]];
        });
      },
      (error) => {
        console.warn("GPS Error:", error);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    // Watch Motion
    window.addEventListener('devicemotion', handleDeviceMotion, true);
  };

  const pauseTracking = () => {
    setStatus('paused');
    stopHardwareTracking();
    speakBrisa("Atividade pausada.");
  };

  const stopHardwareTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    window.removeEventListener('devicemotion', handleDeviceMotion, true);
  };

  const finishTracking = async () => {
    setStatus('finished');
    stopHardwareTracking();
    setIsProcessing(true);
    speakBrisa("Excelente trabalho! Finalizando o treino e calculando o impacto no seu coração.");

    const hours = elapsedTimeSec / 3600;
    const calories = Math.round(selectedActivity.met * userWeight * hours);
    const speed = hours > 0 ? (distanceKm / hours).toFixed(1) : "0";

    try {
      const { data: aiResponse, error } = await supabase.functions.invoke('analyze-activity-cardio', {
        body: {
          activityType: selectedActivity.id,
          distanceKm: Number(distanceKm.toFixed(2)),
          timeMinutes: Math.round(elapsedTimeSec / 60),
          speedKmh: Number(speed),
          calories: calories,
          steps: steps,
          stairs: Math.round(stairs)
        }
      });

      if (error) throw error;

      setAiResult(aiResponse);
      if (aiResponse.brisaSpeech) {
        speakBrisa(aiResponse.brisaSpeech);
      }

      // Save to DB
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        await supabase.from('diagnostic_exams').insert({
          user_id: session.session.user.id,
          exam_type: 'cardio_gps',
          ai_diagnosis: aiResponse,
          results: {
            activityType: selectedActivity.id,
            distanceKm,
            elapsedTimeSec,
            calories,
            steps,
            speed
          },
          risk_level: aiResponse.isDangerous ? 'alto' : 'baixo'
        });
      }

    } catch (err) {
      console.error("Error analyzing cardio:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Math conversions
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const caloriesCalc = Math.round(selectedActivity.met * userWeight * (elapsedTimeSec / 3600));
  const pace = distanceKm > 0 ? (elapsedTimeSec / 60) / distanceKm : 0;
  const formatPace = pace > 0 && pace < 60 ? `${Math.floor(pace)}'${Math.round((pace % 1)*60).toString().padStart(2, '0')}"` : "--";
  const speed = elapsedTimeSec > 0 ? (distanceKm / (elapsedTimeSec / 3600)).toFixed(1) : "0.0";

  const renderComicManual = () => (
    <div className="space-y-4 font-sans text-sm md:text-base text-gray-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-4 border-black rounded-lg p-4 bg-sky-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 1</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Ative o GPS</h3>
          <p className="font-bold leading-tight">Autorize a localização no celular. Precisamos dela para desenhar o trajeto e medir a velocidade.</p>
          <div className="mt-4 flex justify-center text-5xl">📍</div>
        </div>
        
        <div className="border-4 border-black rounded-lg p-4 bg-lime-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 2</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">O Bolso Conta</h3>
          <p className="font-bold leading-tight">O celular conta seus passos pelo balanço natural do corpo. Pode deixar no bolso ou na mão!</p>
          <div className="mt-4 flex justify-center text-5xl">👖</div>
        </div>

        <div className="border-4 border-black rounded-lg p-4 bg-purple-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 3</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Tela Ligada</h3>
          <p className="font-bold leading-tight">Para o GPS ser contínuo no navegador, tente não bloquear a tela ou sair do App por muito tempo.</p>
          <div className="mt-4 flex justify-center text-5xl">📱</div>
        </div>

        <div className="border-4 border-black rounded-lg p-4 bg-orange-50 relative shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <div className="absolute -top-3 -left-3 bg-red-500 text-white font-black px-3 py-1 rounded-full border-2 border-black rotate-[-5deg]">PASSO 4</div>
          <h3 className="font-black text-xl mb-2 mt-2 uppercase tracking-tight">Análise IA</h3>
          <p className="font-bold leading-tight">Ao terminar, a Brisa avalia a saúde do seu coração e os endocanabinoides liberados (O "Barato" bom).</p>
          <div className="mt-4 flex justify-center text-5xl">❤️</div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-xl border-primary/20 overflow-hidden relative">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-border">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-2xl font-black text-blue-700 dark:text-blue-400">
            <MapIcon className="w-8 h-8 text-blue-500" />
            Rastreador GPS Cardíaco
          </CardTitle>
          <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-2 border-primary/50 text-primary font-bold hover:bg-primary/10 rounded-full">
                <BookOpen className="w-4 h-4" /> Como Funciona
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-4 border-black rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black uppercase text-center mb-4 text-blue-600 font-comic">Manual de Atividade</DialogTitle>
              </DialogHeader>
              {renderComicManual()}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        
        {/* Map Area */}
        <div className="h-64 md:h-80 w-full relative z-0 bg-gray-900">
          <MapContainer 
            center={path.length > 0 ? path[path.length - 1] : [-23.5505, -46.6333]} 
            zoom={16} 
            scrollWheelZoom={false} 
            className="h-full w-full"
          >
            {/* Esri World Imagery (Satellite) */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri"
            />
            {path.length > 0 && <ChangeView center={path[path.length - 1]} />}
            {path.length > 0 && (
              <Polyline positions={path} color="#00ff00" weight={5} opacity={0.8} />
            )}
            {path.length > 0 && (
              <Marker position={path[path.length - 1]}>
                <Popup>Você está aqui</Popup>
              </Marker>
            )}
          </MapContainer>
          
          {/* Overlay Stats Header */}
          <div className="absolute top-4 left-4 right-4 z-[400] flex justify-between pointer-events-none">
            <div className="bg-black/70 backdrop-blur text-white px-4 py-2 rounded-2xl border border-white/20 shadow-lg pointer-events-auto">
              <span className="text-sm uppercase font-bold text-gray-300">Tempo</span>
              <div className="text-3xl font-black tabular-nums tracking-tighter">{formatTime(elapsedTimeSec)}</div>
            </div>
            
            <div className="bg-black/70 backdrop-blur text-white px-4 py-2 rounded-2xl border border-white/20 shadow-lg pointer-events-auto text-right">
              <span className="text-sm uppercase font-bold text-gray-300">Distância</span>
              <div className="text-3xl font-black tabular-nums tracking-tighter text-blue-400">{distanceKm.toFixed(2)} <span className="text-lg">km</span></div>
            </div>
          </div>
        </div>

        {/* Dashboard Actions & Metrics */}
        <div className="p-6 bg-white dark:bg-gray-900 border-t-4 border-blue-500">
          
          {/* Activity Selector (Only visible if idle/finished) */}
          {(status === 'idle' || status === 'finished') && !isProcessing && (
            <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
              {ACTIVITIES.map(act => (
                <button
                  key={act.id}
                  onClick={() => {
                    setSelectedActivity(act);
                    if (status === 'finished') setStatus('idle'); // reset to start a new one
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-bold whitespace-nowrap transition-all ${
                    selectedActivity.id === act.id 
                      ? 'bg-blue-500 text-white border-blue-700 shadow-[2px_2px_0px_rgba(0,0,0,1)]' 
                      : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">{act.icon}</span> {act.id}
                </button>
              ))}
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 mb-6 mt-2">
            <div className="bg-orange-50 border-2 border-orange-100 p-3 rounded-2xl text-center flex flex-col items-center">
              <Flame className="w-5 h-5 text-orange-500 mb-1" />
              <span className="text-xl font-black text-orange-700">{caloriesCalc}</span>
              <span className="text-[10px] font-bold text-orange-400 uppercase">Kcal</span>
            </div>
            <div className="bg-green-50 border-2 border-green-100 p-3 rounded-2xl text-center flex flex-col items-center">
              <Footprints className="w-5 h-5 text-green-500 mb-1" />
              <span className="text-xl font-black text-green-700">{steps}</span>
              <span className="text-[10px] font-bold text-green-400 uppercase">Passos</span>
            </div>
            <div className="bg-cyan-50 border-2 border-cyan-100 p-3 rounded-2xl text-center flex flex-col items-center">
              <Wind className="w-5 h-5 text-cyan-500 mb-1" />
              <span className="text-xl font-black text-cyan-700">{speed}</span>
              <span className="text-[10px] font-bold text-cyan-400 uppercase">km/h</span>
            </div>
            <div className="bg-purple-50 border-2 border-purple-100 p-3 rounded-2xl text-center flex flex-col items-center">
              <Activity className="w-5 h-5 text-purple-500 mb-1" />
              <span className="text-xl font-black text-purple-700">{formatPace}</span>
              <span className="text-[10px] font-bold text-purple-400 uppercase">Pace</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center items-center gap-4">
            {(status === 'idle' || status === 'paused' || status === 'finished') && !isProcessing && (
              <Button 
                size="lg" 
                onClick={startTracking}
                className="w-full h-16 text-xl font-black bg-blue-600 hover:bg-blue-700 text-white rounded-2xl border-b-4 border-blue-900"
              >
                <Play className="w-6 h-6 mr-2" fill="currentColor" /> {status === 'idle' ? 'INICIAR TREINO' : status === 'finished' ? 'NOVO TREINO' : 'RETOMAR'}
              </Button>
            )}

            {status === 'running' && (
              <>
                <Button 
                  size="lg" 
                  onClick={pauseTracking}
                  className="w-1/2 h-16 text-xl font-black bg-yellow-500 hover:bg-yellow-600 text-white rounded-2xl border-b-4 border-yellow-700"
                >
                  <Pause className="w-6 h-6 mr-2" fill="currentColor" /> PAUSA
                </Button>
                <Button 
                  size="lg" 
                  onClick={finishTracking}
                  className="w-1/2 h-16 text-xl font-black bg-red-600 hover:bg-red-700 text-white rounded-2xl border-b-4 border-red-900"
                >
                  <Square className="w-6 h-6 mr-2" fill="currentColor" /> FINALIZAR
                </Button>
              </>
            )}

            {status === 'paused' && (
              <Button 
                size="lg" 
                onClick={finishTracking}
                className="w-1/2 h-16 text-xl font-black bg-red-600 hover:bg-red-700 text-white rounded-2xl border-b-4 border-red-900"
              >
                <Square className="w-6 h-6 mr-2" fill="currentColor" /> FINALIZAR
              </Button>
            )}
          </div>
          
          {isProcessing && (
            <div className="py-8 text-center text-blue-600 font-bold animate-pulse">
              Processando resultados cardiovasculares com IA...
            </div>
          )}

          {/* AI Result Area */}
          <AnimatePresence>
            {aiResult && !isProcessing && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                <div className={`p-5 rounded-2xl border-2 shadow-sm ${aiResult.isDangerous ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}>
                 <div className="flex items-start gap-3">
                   {aiResult.isDangerous ? <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" /> : <Activity className="w-8 h-8 text-blue-500 flex-shrink-0 mt-1" />}
                   <div>
                     <h4 className={`font-black text-lg uppercase ${aiResult.isDangerous ? 'text-red-700' : 'text-blue-700'}`}>
                       Feedback Cardiovascular
                     </h4>
                     <p className="text-gray-800 font-medium mt-2 leading-relaxed">{aiResult.diagnosis}</p>
                   </div>
                 </div>
               </div>

               {aiResult.findings && aiResult.findings.length > 0 && (
                 <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                   <h4 className="font-black text-sm uppercase text-gray-500 mb-2">Pontos Destacados</h4>
                   <ul className="space-y-1">
                     {aiResult.findings.map((f: string, i: number) => (
                       <li key={i} className="text-sm font-medium text-gray-700 flex items-start gap-2">
                         <span className="text-blue-500 mt-0.5">•</span> {f}
                       </li>
                     ))}
                   </ul>
                 </div>
               )}

                {/* Brisa Voice Box */}
                <div className="mt-6 border-4 border-black rounded-2xl bg-[#ffde59] p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] relative">
                  <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-black uppercase px-2 py-1 rounded-bl-lg">Enf. Brisa</div>
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-white border-2 border-black rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-3xl">🐸</div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="font-bold text-sm md:text-base text-black italic">"{aiResult.brisaSpeech}"</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </CardContent>
    </Card>
  );
};
