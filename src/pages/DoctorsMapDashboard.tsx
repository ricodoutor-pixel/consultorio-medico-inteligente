import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  country: string;
  state: string;
  city: string;
  score: number;
  isOnline: boolean;
  patientRating: number;
  currentConsultations: number;
  maxConcurrentConsultations: number;
  hourlyRate: number;
}

export function DoctorsMapDashboard() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('Brasil');
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);

  // Fetch online doctors
  const { data: onlineDoctorsData } = trpc.doctorNetwork.getOnlineDoctors.useQuery({
    specialty: selectedSpecialty || undefined,
    country: selectedCountry || undefined,
  });

  // Fetch network stats
  const { data: statsData } = trpc.doctorNetwork.getNetworkStats.useQuery();

  useEffect(() => {
    if (onlineDoctorsData?.data) {
      setDoctors(onlineDoctorsData.data);
    }
  }, [onlineDoctorsData]);

  useEffect(() => {
    let filtered = doctors;
    if (selectedSpecialty) {
      filtered = filtered.filter((d) => d.specialty === selectedSpecialty);
    }
    if (selectedCountry) {
      filtered = filtered.filter((d) => d.country === selectedCountry);
    }
    setFilteredDoctors(filtered);
  }, [doctors, selectedSpecialty, selectedCountry]);

  const specialties = Array.from(new Set(doctors.map((d) => d.specialty)));
  const countries = Array.from(new Set(doctors.map((d) => d.country)));

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = (isOnline: boolean) => {
    return isOnline ? 'Online' : 'Offline';
  };

  const getAvailabilityPercentage = (current: number, max: number) => {
    return ((max - current) / max) * 100;
  };

  return (
    <div className="w-full space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-slate-900">Médicos Online</h1>
        <p className="text-slate-600 text-lg">
          Visualize médicos disponíveis em tempo real por especialidade e localização
        </p>
      </div>

      {/* Network Stats */}
      {statsData?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total de Médicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{statsData.data.totalDoctors}</div>
              <p className="text-xs text-slate-500 mt-1">Cadastrados na rede</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Online Agora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{statsData.data.onlineDoctors}</div>
              <p className="text-xs text-slate-500 mt-1">Disponíveis para consulta</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Score Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{statsData.data.averageScore?.toFixed(1)}</div>
              <p className="text-xs text-slate-500 mt-1">De 0 a 100</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Avaliação Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">⭐ {statsData.data.averageRating?.toFixed(1)}</div>
              <p className="text-xs text-slate-500 mt-1">De 0 a 5 estrelas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle>Filtros de Busca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">País</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os países</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Especialidade</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas as especialidades</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Doctors Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">
          {filteredDoctors.length} Médicos Disponíveis
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="bg-white border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-slate-900">{doctor.name}</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">{doctor.specialty}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-5 h-5 rounded-full ${getStatusColor(doctor.isOnline)} ${
                        doctor.isOnline ? 'animate-pulse' : ''
                      }`}
                    />
                    <span className="text-xs font-medium text-slate-600">
                      {getStatusText(doctor.isOnline)}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Location */}
                <div className="text-sm">
                  <p className="text-slate-600">
                    📍 {doctor.city}, {doctor.state}
                  </p>
                  <p className="text-slate-500 text-xs">{doctor.country}</p>
                </div>

                {/* Rating and Score */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-600 font-medium">Avaliação</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">⭐ {doctor.patientRating.toFixed(1)}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs text-slate-600 font-medium">Score</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{doctor.score.toFixed(0)}</p>
                  </div>
                </div>

                {/* Availability */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-600">Disponibilidade</p>
                    <p className="text-sm font-medium text-slate-900">
                      {doctor.currentConsultations}/{doctor.maxConcurrentConsultations}
                    </p>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2.5 rounded-full transition-all"
                      style={{
                        width: `${getAvailabilityPercentage(doctor.currentConsultations, doctor.maxConcurrentConsultations)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Price */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-600 font-medium">Tarifa Horária</p>
                  <p className="text-lg font-bold text-blue-600 mt-1">R$ {doctor.hourlyRate}</p>
                </div>

                {/* Status Badges */}
                <div className="flex gap-2 flex-wrap">
                  <Badge
                    className={`${
                      doctor.isOnline
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {getStatusText(doctor.isOnline)}
                  </Badge>
                  {doctor.currentConsultations < doctor.maxConcurrentConsultations && (
                    <Badge className="bg-blue-100 text-blue-800">Disponível</Badge>
                  )}
                  {doctor.score >= 90 && (
                    <Badge className="bg-purple-100 text-purple-800">Top Médico</Badge>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  className={`w-full ${
                    doctor.isOnline && doctor.currentConsultations < doctor.maxConcurrentConsultations
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-slate-300 hover:bg-slate-300 cursor-not-allowed'
                  }`}
                  disabled={!doctor.isOnline || doctor.currentConsultations >= doctor.maxConcurrentConsultations}
                >
                  {doctor.isOnline
                    ? doctor.currentConsultations < doctor.maxConcurrentConsultations
                      ? 'Agendar Consulta'
                      : 'Sem Vagas'
                    : 'Médico Offline'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-600 text-lg">Nenhum médico disponível com os filtros selecionados</p>
            <p className="text-slate-500 text-sm mt-2">Tente ajustar os filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
}
