import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, MessageSquare, Clock, MapPin, Star, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

const doctors = [
  {
    id: 1,
    name: 'Dra. Ana Silva',
    specialty: 'Cannabis Medicinal',
    rating: 4.9,
    reviews: 245,
    consultationPrice: 50,
    responseTime: '< 5 min',
    experience: '12 anos',
    available: true,
    image: '👩‍⚕️',
    languages: ['Português', 'Inglês'],
    bio: 'Especialista em tratamento de dor crônica e ansiedade com cannabis medicinal',
  },
  {
    id: 2,
    name: 'Dr. Carlos Mendes',
    specialty: 'Neurologia',
    rating: 4.8,
    reviews: 189,
    consultationPrice: 60,
    responseTime: '< 10 min',
    experience: '15 anos',
    available: true,
    image: '👨‍⚕️',
    languages: ['Português', 'Espanhol'],
    bio: 'Especialista em epilepsia e distúrbios neurológicos',
  },
  {
    id: 3,
    name: 'Dra. Maria Costa',
    specialty: 'Psiquiatria',
    rating: 4.7,
    reviews: 156,
    consultationPrice: 70,
    responseTime: '< 15 min',
    experience: '10 anos',
    available: false,
    image: '👩‍⚕️',
    languages: ['Português', 'Inglês', 'Francês'],
    bio: 'Especialista em tratamento de depressão e transtornos de ansiedade',
  },
  {
    id: 4,
    name: 'Dr. Roberto Alves',
    specialty: 'Reumatologia',
    rating: 4.9,
    reviews: 312,
    consultationPrice: 65,
    responseTime: '< 8 min',
    experience: '18 anos',
    available: true,
    image: '👨‍⚕️',
    languages: ['Português', 'Inglês', 'Italiano'],
    bio: 'Especialista em artrite reumatoide e doenças autoimunes',
  },
];

const consultationProcess = [
  {
    step: 1,
    title: 'Escolha o Médico',
    description: 'Selecione um especialista de acordo com sua necessidade',
    icon: '👨‍⚕️',
  },
  {
    step: 2,
    title: 'Agende a Consulta',
    description: 'Escolha data e hora disponível',
    icon: '📅',
  },
  {
    step: 3,
    title: 'Consulta Online',
    description: 'Atendimento via chat ou vídeo chamada',
    icon: '💬',
  },
  {
    step: 4,
    title: 'Receita Digital',
    description: 'Receba a prescrição assinada digitalmente',
    icon: '📋',
  },
  {
    step: 5,
    title: 'Compre na Loja',
    description: 'Acesse o medicamento no shopping integrado',
    icon: '🛒',
  },
];

export default function Telemedicine() {
  const [selectedDoctor, setSelectedDoctor] = useState<number | null>(null);
  const [consultationType, setConsultationType] = useState<'chat' | 'video'>('chat');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-yellow-400">Telemedicina Cannabis</h1>
          <p className="text-muted-foreground">Consulte especialistas certificados por apenas R$50</p>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-5 gap-4">
          {consultationProcess.map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-4xl mb-2">{item.icon}</div>
              <p className="font-bold text-yellow-400 mb-1">Etapa {item.step}</p>
              <p className="text-sm font-semibold mb-1">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Doctors Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-yellow-400">Médicos Disponíveis</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {doctors.map((doctor) => (
              <Card
                key={doctor.id}
                className={`bg-card/50 border-yellow-500/20 rounded-2xl cursor-pointer transition-all hover:border-yellow-500/50 ${
                  selectedDoctor === doctor.id ? 'border-yellow-500 ring-2 ring-yellow-500/30' : ''
                }`}
                onClick={() => setSelectedDoctor(doctor.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{doctor.image}</div>
                      <div>
                        <p className="font-bold text-yellow-400">{doctor.name}</p>
                        <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-semibold">{doctor.rating}</span>
                          <span className="text-xs text-muted-foreground">({doctor.reviews} avaliações)</span>
                        </div>
                      </div>
                    </div>
                    {doctor.available ? (
                      <Badge className="bg-green-500/20 text-green-400">Disponível</Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400">Indisponível</Badge>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-muted-foreground">{doctor.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {doctor.languages.map((lang) => (
                        <Badge key={lang} className="bg-yellow-500/20 text-yellow-400 text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Experiência</p>
                      <p className="font-bold text-yellow-400">{doctor.experience}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Resposta</p>
                      <p className="font-bold text-yellow-400">{doctor.responseTime}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Consulta</p>
                      <p className="font-bold text-green-400">R$ {doctor.consultationPrice}</p>
                    </div>
                  </div>

                  {selectedDoctor === doctor.id && (
                    <div className="space-y-3 pt-4 border-t border-yellow-500/20">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setConsultationType('chat')}
                          className={`flex-1 ${
                            consultationType === 'chat'
                              ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                              : 'bg-background/50 text-yellow-400 hover:bg-background/70'
                          }`}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                        <Button
                          onClick={() => setConsultationType('video')}
                          className={`flex-1 ${
                            consultationType === 'video'
                              ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                              : 'bg-background/50 text-yellow-400 hover:bg-background/70'
                          }`}
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Vídeo
                        </Button>
                      </div>
                      <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                        <Calendar className="h-4 w-4 mr-2" />
                        Agendar Consulta
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Consultation Info */}
        <Card className="bg-card/50 border-yellow-500/20 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-yellow-400">Como Funciona a Consulta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Consulta Rápida</p>
                    <p className="text-sm text-muted-foreground">Média de 15 minutos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Receita Digital</p>
                    <p className="text-sm text-muted-foreground">Assinada eletronicamente</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Acompanhamento</p>
                    <p className="text-sm text-muted-foreground">Reavaliações incluídas</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Conformidade ANVISA</p>
                    <p className="text-sm text-muted-foreground">RDC 327/2019</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Privacidade Garantida</p>
                    <p className="text-sm text-muted-foreground">Dados criptografados</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Suporte 24/7</p>
                    <p className="text-sm text-muted-foreground">Chat com especialistas</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
