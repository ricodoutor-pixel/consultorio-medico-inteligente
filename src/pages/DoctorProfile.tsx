import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, Phone, Mail, Award } from 'lucide-react';

export default function DoctorProfile() {
  const doctor = {
    id: 'dr-edilson-bezerra',
    name: 'Dr. Edilson Bezerra',
    specialty: 'Clínico Geral',
    crm: 'CRM-SP 123456',
    rating: 4.9,
    reviews: 247,
    consultationValue: 130,
    image: '/dr-edilson-profile-real.jpg',
    bio: 'Médico experiente com mais de 15 anos de prática em telemedicina. Especializado em atendimento clínico geral com foco em bem-estar e prevenção.',
    availability: 'Segunda a Sexta, 9h às 18h',
    phone: '+55 11 98713-1241',
    email: 'dr.edilson@plantayraiz.com.br',
    certifications: [
      'CFM - Conselho Federal de Medicina',
      'LGPD - Lei Geral de Proteção de Dados',
      'ANVISA - Agência Nacional de Vigilância Sanitária'
    ],
    languages: ['Português', 'Espanhol'],
    experience: '15+ anos de experiência',
    patients: '2.500+ pacientes atendidos',
    responseTime: 'Responde em média em 5 minutos'
  };

  const brisa = {
    id: 'brisa-ia',
    name: 'Brisa',
    role: 'Enfermeira Chefe IA',
    image: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663065229674/XQPvBCLCnwZajUp4KoE3Kh/brisa_enfermeira_ia-2piqdm5p44TPJrY67Fq8nR.webp',
    bio: 'Brisa é a enfermeira chefe inteligente do sistema Planta y Raiz. Responsável pela triagem clínica preliminar, análise de sintomas e recomendação de especialidades. Combina inteligência artificial avançada com empatia e cuidado genuíno pelo bem-estar dos pacientes.',
    specialties: ['Triagem Clínica', 'Análise de Sintomas', 'Recomendação de Especialistas', 'Suporte 24/7'],
    availability: 'Disponível 24 horas, 7 dias por semana',
    responseTime: 'Resposta instantânea',
    features: [
      'Análise inteligente com LLM avançado',
      'Diagnóstico preliminar com código ICD-10',
      'Conformidade ANVISA/CFM garantida',
      'Atendimento personalizado e carinhoso'
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Perfil Profissional</h1>
          <p className="text-green-100">Conheça nosso médico especialista</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="grid md:grid-cols-3 gap-8 p-8">
            {/* Photo */}
            <div className="md:col-span-1 flex flex-col items-center">
              <img
                src={doctor.image}
                alt={doctor.name}
                className="w-48 h-48 rounded-lg object-cover shadow-lg mb-4"
              />
              <Badge className="bg-green-600 text-white mb-4">Verificado CFM</Badge>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-lg">{doctor.rating}</span>
                  <span className="text-gray-600">({doctor.reviews} avaliações)</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="md:col-span-2">
              <h2 className="text-3xl font-bold mb-2">{doctor.name}</h2>
              <p className="text-xl text-green-600 font-semibold mb-4">{doctor.specialty}</p>
              <p className="text-gray-600 mb-6">{doctor.crm}</p>

              <p className="text-gray-700 mb-6 leading-relaxed">{doctor.bio}</p>

              {/* Key Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Experiência</p>
                  <p className="font-bold text-lg text-green-700">{doctor.experience}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Pacientes</p>
                  <p className="font-bold text-lg text-green-700">{doctor.patients}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tempo de Resposta</p>
                  <p className="font-bold text-lg text-green-700">{doctor.responseTime}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Consulta</p>
                  <p className="font-bold text-lg text-green-700">R$ {doctor.consultationValue}</p>
                </div>
              </div>

              {/* CTA Button */}
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg">
                Agendar Consulta Agora
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* Left Column */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Informações de Contato</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">WhatsApp</p>
                    <p className="font-semibold">{doctor.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{doctor.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Disponibilidade</p>
                    <p className="font-semibold">{doctor.availability}</p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold mt-8 mb-4 text-gray-800">Idiomas</h3>
              <div className="flex gap-2">
                {doctor.languages.map((lang) => (
                  <Badge key={lang} variant="outline" className="border-green-600 text-green-600">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-gray-800">Certificações e Conformidade</h3>
              <div className="space-y-3">
                {doctor.certifications.map((cert) => (
                  <div key={cert} className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{cert}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-700">
                  ✅ Todos os dados do médico são verificados e certificados de acordo com as normas CFM, LGPD e ANVISA.
                </p>
              </div>
            </div>
          </div>

          {/* Brisa - Enfermeira Chefe IA */}
          <div className="border-t border-gray-200 p-8 bg-gradient-to-r from-green-50 to-blue-50">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">🤖 Brisa - Enfermeira Chefe IA</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Brisa Image */}
              <div className="flex flex-col items-center">
                <img
                  src={brisa.image}
                  alt={brisa.name}
                  className="w-48 h-64 rounded-lg object-cover shadow-lg mb-4"
                />
                <Badge className="bg-blue-600 text-white mb-4">{brisa.role}</Badge>
              </div>

              {/* Brisa Info */}
              <div className="md:col-span-2">
                <h4 className="text-2xl font-bold mb-2 text-gray-800">{brisa.name}</h4>
                <p className="text-gray-600 mb-4 leading-relaxed">{brisa.bio}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600">Disponibilidade</p>
                    <p className="font-bold text-blue-700">{brisa.availability}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600">Tempo de Resposta</p>
                    <p className="font-bold text-blue-700">{brisa.responseTime}</p>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-gray-800 mb-3">Especialidades:</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {brisa.specialties.map((spec) => (
                      <Badge key={spec} className="bg-blue-100 text-blue-700 border border-blue-300">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-gray-800 mb-3">Recursos:</p>
                  <ul className="space-y-2">
                    {brisa.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-blue-600 font-bold mt-1">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="border-t border-gray-200 p-8">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Avaliações de Pacientes</h3>
            <div className="space-y-4">
              {[
                {
                  name: 'Maria Silva',
                  rating: 5,
                  comment: 'Excelente atendimento, muito profissional e atencioso!'
                },
                {
                  name: 'João Santos',
                  rating: 5,
                  comment: 'Recomendo! Médico muito competente e dedicado.'
                },
                {
                  name: 'Ana Costa',
                  rating: 4,
                  comment: 'Ótima consulta, esclareceu todas as minhas dúvidas.'
                }
              ].map((review, idx) => (
                <div key={idx} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-800">{review.name}</p>
                    <div className="flex gap-1">
                      {Array(review.rating).fill(0).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
