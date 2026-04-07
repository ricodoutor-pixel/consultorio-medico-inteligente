/**
 * Clinical Research Page
 * Manage clinical trials, patient recruitment, and results tracking
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ClinicalStudy {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'approved' | 'recruiting' | 'active' | 'completed' | 'terminated';
  targetParticipants: number;
  currentParticipants: number;
  principalInvestigator: string;
  institution: string;
  duration: number;
  conepApprovalNumber?: string;
}

interface StudyResult {
  totalParticipants: number;
  completedParticipants: number;
  withdrawnParticipants: number;
  averageImprovement: number;
  sideEffectsProfile: Record<string, number>;
  adherenceRate: number;
}

export default function ClinicalResearch() {
  const [studies, setStudies] = useState<ClinicalStudy[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<ClinicalStudy | null>(null);
  const [studyResults, setStudyResults] = useState<StudyResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Mock data
  useEffect(() => {
    const mockStudies: ClinicalStudy[] = [
      {
        id: 'study_001',
        title: 'Efficacy of CBD in Anxiety Disorders - A Randomized Controlled Trial',
        description: 'A double-blind, placebo-controlled study evaluating the efficacy of CBD in treating generalized anxiety disorder',
        status: 'recruiting',
        targetParticipants: 200,
        currentParticipants: 87,
        principalInvestigator: 'Dr. João Silva',
        institution: 'Universidade de São Paulo',
        duration: 12,
        conepApprovalNumber: 'CONEP/2024-001',
      },
      {
        id: 'study_002',
        title: 'Cannabis-Based Medicine for Chronic Pain Management',
        description: 'A prospective cohort study evaluating cannabis-based medicine in patients with chronic pain',
        status: 'active',
        targetParticipants: 150,
        currentParticipants: 142,
        principalInvestigator: 'Dr. Maria Santos',
        institution: 'Hospital das Clínicas',
        duration: 24,
        conepApprovalNumber: 'CONEP/2023-045',
      },
    ];

    setStudies(mockStudies);
  }, []);

  const handleStudySelect = (study: ClinicalStudy) => {
    setSelectedStudy(study);
    setStudyResults({
      totalParticipants: study.currentParticipants,
      completedParticipants: Math.floor(study.currentParticipants * 0.85),
      withdrawnParticipants: Math.floor(study.currentParticipants * 0.15),
      averageImprovement: 42.5,
      sideEffectsProfile: {
        'Dizziness': 12,
        'Dry Mouth': 18,
        'Fatigue': 8,
        'Headache': 5,
      },
      adherenceRate: 87.3,
    });
  };

  const filteredStudies = studies.filter(study =>
    study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.principalInvestigator.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-500',
      'approved': 'bg-blue-500',
      'recruiting': 'bg-green-500',
      'active': 'bg-emerald-500',
      'completed': 'bg-purple-500',
      'terminated': 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'draft': 'Rascunho',
      'approved': 'Aprovado',
      'recruiting': 'Recrutando',
      'active': 'Ativo',
      'completed': 'Concluído',
      'terminated': 'Encerrado',
    };
    return labels[status] || status;
  };

  const improvementData = [
    { week: 'Semana 1', improvement: 5 },
    { week: 'Semana 4', improvement: 15 },
    { week: 'Semana 8', improvement: 28 },
    { week: 'Semana 12', improvement: 42.5 },
  ];

  const sideEffectsData = studyResults
    ? Object.entries(studyResults.sideEffectsProfile).map(([effect, percentage]) => ({
        effect,
        percentage,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-400 mb-2">Pesquisa Clínica</h1>
          <p className="text-slate-300">Gerenciar estudos clínicos, recrutamento de pacientes e rastreamento de resultados</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            placeholder="Buscar estudos por título ou investigador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-800 border-emerald-500 text-white placeholder-slate-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Studies List */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-emerald-500">
              <CardHeader>
                <CardTitle className="text-emerald-400">Estudos Clínicos</CardTitle>
                <CardDescription className="text-slate-400">
                  {filteredStudies.length} estudos encontrados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {filteredStudies.map((study) => (
                  <div
                    key={study.id}
                    onClick={() => handleStudySelect(study)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedStudy?.id === study.id
                        ? 'bg-emerald-600 border-emerald-400'
                        : 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                    } border`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-white line-clamp-2">{study.title}</h3>
                      <Badge className={`${getStatusBadgeColor(study.status)} text-white text-xs`}>
                        {getStatusLabel(study.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 mb-2">{study.principalInvestigator}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {study.currentParticipants}/{study.targetParticipants} participantes
                      </span>
                      <div className="w-16 h-1 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{ width: `${(study.currentParticipants / study.targetParticipants) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Study Details */}
          <div className="lg:col-span-2 space-y-6">
            {selectedStudy ? (
              <>
                {/* Study Info */}
                <Card className="bg-slate-800 border-emerald-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-emerald-400">{selectedStudy.title}</CardTitle>
                        <CardDescription className="text-slate-400 mt-2">
                          {selectedStudy.description}
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusBadgeColor(selectedStudy.status)} text-white`}>
                        {getStatusLabel(selectedStudy.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Investigador Principal</p>
                        <p className="text-white font-semibold">{selectedStudy.principalInvestigator}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Instituição</p>
                        <p className="text-white font-semibold">{selectedStudy.institution}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Aprovação CONEP</p>
                        <p className="text-white font-semibold">{selectedStudy.conepApprovalNumber || 'Pendente'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Duração</p>
                        <p className="text-white font-semibold">{selectedStudy.duration} semanas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-slate-700 border-slate-600">
                    <TabsTrigger value="overview" className="text-slate-300 data-[state=active]:text-emerald-400">
                      Visão Geral
                    </TabsTrigger>
                    <TabsTrigger value="results" className="text-slate-300 data-[state=active]:text-emerald-400">
                      Resultados
                    </TabsTrigger>
                    <TabsTrigger value="participants" className="text-slate-300 data-[state=active]:text-emerald-400">
                      Participantes
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview">
                    <Card className="bg-slate-800 border-emerald-500">
                      <CardHeader>
                        <CardTitle className="text-emerald-400">Progresso do Estudo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="bg-slate-700 p-4 rounded-lg">
                            <p className="text-sm text-slate-400">Participantes Inscritos</p>
                            <p className="text-2xl font-bold text-emerald-400">{selectedStudy.currentParticipants}</p>
                            <p className="text-xs text-slate-500">de {selectedStudy.targetParticipants}</p>
                          </div>
                          <div className="bg-slate-700 p-4 rounded-lg">
                            <p className="text-sm text-slate-400">Taxa de Inscrição</p>
                            <p className="text-2xl font-bold text-emerald-400">
                              {Math.round((selectedStudy.currentParticipants / selectedStudy.targetParticipants) * 100)}%
                            </p>
                          </div>
                          <div className="bg-slate-700 p-4 rounded-lg">
                            <p className="text-sm text-slate-400">Faltam Inscrever</p>
                            <p className="text-2xl font-bold text-emerald-400">
                              {selectedStudy.targetParticipants - selectedStudy.currentParticipants}
                            </p>
                          </div>
                        </div>

                        {/* Improvement Chart */}
                        <div className="bg-slate-700 p-4 rounded-lg">
                          <h3 className="text-white font-semibold mb-4">Melhora Média ao Longo do Tempo</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={improvementData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                              <XAxis dataKey="week" stroke="#94a3b8" />
                              <YAxis stroke="#94a3b8" />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #10b981' }}
                                labelStyle={{ color: '#10b981' }}
                              />
                              <Line
                                type="monotone"
                                dataKey="improvement"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ fill: '#10b981' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Results Tab */}
                  <TabsContent value="results">
                    {studyResults && (
                      <Card className="bg-slate-800 border-emerald-500">
                        <CardHeader>
                          <CardTitle className="text-emerald-400">Análise de Resultados</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Results Summary */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-700 p-4 rounded-lg">
                              <p className="text-sm text-slate-400">Participantes Completos</p>
                              <p className="text-2xl font-bold text-emerald-400">{studyResults.completedParticipants}</p>
                            </div>
                            <div className="bg-slate-700 p-4 rounded-lg">
                              <p className="text-sm text-slate-400">Taxa de Adesão</p>
                              <p className="text-2xl font-bold text-emerald-400">{studyResults.adherenceRate}%</p>
                            </div>
                            <div className="bg-slate-700 p-4 rounded-lg">
                              <p className="text-sm text-slate-400">Melhora Média</p>
                              <p className="text-2xl font-bold text-emerald-400">{studyResults.averageImprovement}%</p>
                            </div>
                            <div className="bg-slate-700 p-4 rounded-lg">
                              <p className="text-sm text-slate-400">Desistências</p>
                              <p className="text-2xl font-bold text-red-400">{studyResults.withdrawnParticipants}</p>
                            </div>
                          </div>

                          {/* Side Effects Chart */}
                          <div className="bg-slate-700 p-4 rounded-lg">
                            <h3 className="text-white font-semibold mb-4">Perfil de Efeitos Colaterais</h3>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={sideEffectsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis dataKey="effect" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #10b981' }}
                                  labelStyle={{ color: '#10b981' }}
                                />
                                <Bar dataKey="percentage" fill="#10b981" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Participants Tab */}
                  <TabsContent value="participants">
                    <Card className="bg-slate-800 border-emerald-500">
                      <CardHeader>
                        <CardTitle className="text-emerald-400">Gerenciamento de Participantes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                            Adicionar Novo Participante
                          </Button>
                          <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white" variant="outline">
                            Registrar Visita de Acompanhamento
                          </Button>
                          <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white" variant="outline">
                            Exportar Dados de Participantes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <Card className="bg-slate-800 border-emerald-500">
                <CardContent className="pt-8 text-center">
                  <p className="text-slate-400">Selecione um estudo para visualizar detalhes</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
