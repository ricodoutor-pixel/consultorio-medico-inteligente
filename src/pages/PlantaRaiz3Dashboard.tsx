/**
 * PLANTA & RAIZ 3.0 — DASHBOARD COMPLETO
 * 
 * Página web integrada com todas as 5 sugestões:
 * 1. Sistema de IA Autônomo (RAÍZ 2.0)
 * 2. Marketplace Blockchain (Supply Chain 4.0)
 * 3. Telemedicina Neuro-IA (RAÍZ Doctor 3.0)
 * 4. DAO Autônoma (RAÍZ DAO 2.0)
 * 5. Previsão Preditiva (RAÍZ Predict 1.0)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Activity, Brain, Leaf, TrendingUp, AlertCircle, CheckCircle,
  Users, Zap, Shield, Microscope, Vote, Pill, Heart, Droplet,
  Clock, Download, Share2, Settings, Menu, X, Search, Bell
} from 'lucide-react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface WearableData {
  timestamp: Date;
  heartRate: number;
  hrv: number;
  spO2: number;
  temperature: number;
  stressLevel: number;
  sleepQuality: number;
  activityLevel: number;
}

interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  medicalHistory: string[];
  currentMedications: string[];
  allergies: string[];
  wearableData: WearableData[];
}

interface Product {
  id: string;
  name: string;
  species: string;
  thcPercentage: number;
  cbdPercentage: number;
  terpenes: string[];
  price: number;
  matchScore: number;
  image: string;
}

interface Consultation {
  id: string;
  date: Date;
  diagnosis: string;
  confidence: number;
  prescriptions: string[];
  status: 'completed' | 'pending' | 'escalated';
}

interface DAOProposal {
  id: string;
  title: string;
  votesFor: number;
  votesAgainst: number;
  status: 'active' | 'passed' | 'failed';
}

interface PredictiveAnalysis {
  crisisRisk: number;
  predictedDate: Date;
  recommendations: string[];
  confidenceLevel: number;
}

// ============================================================================
// DADOS MOCK
// ============================================================================

const mockPatientProfile: PatientProfile = {
  id: 'PAT-001',
  name: 'João Silva',
  age: 35,
  gender: 'M',
  medicalHistory: ['Ansiedade', 'Insônia', 'Dor Crônica'],
  currentMedications: ['Melatonina', 'Vitamina D'],
  allergies: ['Penicilina'],
  wearableData: [
    {
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      heartRate: 72,
      hrv: 45,
      spO2: 98,
      temperature: 36.5,
      stressLevel: 7,
      sleepQuality: 5,
      activityLevel: 6
    },
    {
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      heartRate: 68,
      hrv: 52,
      spO2: 99,
      temperature: 36.4,
      stressLevel: 6,
      sleepQuality: 6,
      activityLevel: 7
    },
    {
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      heartRate: 65,
      hrv: 58,
      spO2: 99,
      temperature: 36.5,
      stressLevel: 5,
      sleepQuality: 7,
      activityLevel: 8
    },
    {
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      heartRate: 62,
      hrv: 65,
      spO2: 99,
      temperature: 36.5,
      stressLevel: 4,
      sleepQuality: 8,
      activityLevel: 8
    },
    {
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      heartRate: 60,
      hrv: 72,
      spO2: 99,
      temperature: 36.5,
      stressLevel: 3,
      sleepQuality: 8,
      activityLevel: 9
    },
    {
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      heartRate: 58,
      hrv: 80,
      spO2: 99,
      temperature: 36.5,
      stressLevel: 2,
      sleepQuality: 9,
      activityLevel: 9
    },
    {
      timestamp: new Date(),
      heartRate: 56,
      hrv: 88,
      spO2: 99,
      temperature: 36.5,
      stressLevel: 1,
      sleepQuality: 9,
      activityLevel: 10
    }
  ]
};

const mockProducts: Product[] = [
  {
    id: 'PROD-001',
    name: 'Óleo CBD Premium 1500mg',
    species: 'Cannabis Sativa',
    thcPercentage: 0.1,
    cbdPercentage: 15,
    terpenes: ['Limoneno', 'Mirceno', 'Pineno'],
    price: 189.90,
    matchScore: 95,
    image: 'https://images.unsplash.com/photo-1585518419759-47a882e9d3d8?w=400&h=400&fit=crop'
  },
  {
    id: 'PROD-002',
    name: 'Flor CBD Sativa 20%',
    species: 'Cannabis Sativa',
    thcPercentage: 0.5,
    cbdPercentage: 20,
    terpenes: ['Cariofileno', 'Humuleno', 'Limoneno'],
    price: 149.90,
    matchScore: 92,
    image: 'https://images.unsplash.com/photo-1599599810694-b5ac4dd64b11?w=400&h=400&fit=crop'
  },
  {
    id: 'PROD-003',
    name: 'Chá Camomila com CBD',
    species: 'Camomila',
    thcPercentage: 0,
    cbdPercentage: 5,
    terpenes: ['Bisabolol', 'Chamazuleno'],
    price: 45.90,
    matchScore: 88,
    image: 'https://images.unsplash.com/photo-1597318972826-c1e3a8d0b4c9?w=400&h=400&fit=crop'
  }
];

const mockConsultations: Consultation[] = [
  {
    id: 'CONS-001',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    diagnosis: 'Ansiedade Generalizada',
    confidence: 94,
    prescriptions: ['Óleo CBD 1500mg - 5mg 2x/dia', 'Meditação 30min/dia'],
    status: 'completed'
  },
  {
    id: 'CONS-002',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    diagnosis: 'Insônia Crônica',
    confidence: 91,
    prescriptions: ['Flor CBD Sativa - 10mg antes de dormir', 'Higiene do sono'],
    status: 'completed'
  }
];

const mockDAOProposals: DAOProposal[] = [
  {
    id: 'PROP-001',
    title: 'Financiar Pesquisa sobre Cannabis e Ansiedade',
    votesFor: 750000,
    votesAgainst: 250000,
    status: 'active'
  },
  {
    id: 'PROP-002',
    title: 'Expandir Marketplace para 50 novos produtos',
    votesFor: 850000,
    votesAgainst: 150000,
    status: 'passed'
  }
];

const mockPredictiveAnalysis: PredictiveAnalysis = {
  crisisRisk: 15,
  predictedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  recommendations: [
    'Manter CBD atual',
    'Aumentar atividade física',
    'Meditação diária',
    'Monitoramento contínuo'
  ],
  confidenceLevel: 89
};

// ============================================================================
// COMPONENTES
// ============================================================================

// Card de Estatística
const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
}> = ({ icon, title, value, subtitle, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-lg p-6 text-white shadow-lg`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium opacity-90">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
        {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
      </div>
      <div className="text-4xl opacity-20">{icon}</div>
    </div>
  </div>
);

// Gráfico de Biometria
const BiometryChart: React.FC<{ data: WearableData[] }> = ({ data }) => {
  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleDateString('pt-BR'),
    heartRate: d.heartRate,
    stressLevel: d.stressLevel * 10,
    sleepQuality: d.sleepQuality * 10
  }));

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Activity className="text-emerald-500" />
        Monitoramento Biométrico (7 dias)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="heartRate" stroke="#ef4444" name="Freq. Cardíaca" />
          <Line type="monotone" dataKey="stressLevel" stroke="#f59e0b" name="Nível de Estresse" />
          <Line type="monotone" dataKey="sleepQuality" stroke="#10b981" name="Qualidade do Sono" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Gráfico de Recomendações de Produtos
const ProductRecommendationsChart: React.FC<{ products: Product[] }> = ({ products }) => {
  const chartData = products.map((p) => ({
    name: p.name.substring(0, 15),
    matchScore: p.matchScore,
    price: p.price / 10 // Escalar para visualização
  }));

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Leaf className="text-emerald-500" />
        Recomendações de Produtos (Match Score)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="matchScore" fill="#10b981" name="Match Score %" />
          <Bar dataKey="price" fill="#3b82f6" name="Preço (R$)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Gráfico de Votação DAO
const DAOVotingChart: React.FC<{ proposals: DAOProposal[] }> = ({ proposals }) => {
  const chartData = proposals.map((p) => ({
    name: p.title.substring(0, 20),
    'Votos A Favor': p.votesFor / 1000,
    'Votos Contra': p.votesAgainst / 1000
  }));

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Vote className="text-purple-500" />
        Votação DAO (em milhares de tokens)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Votos A Favor" fill="#10b981" />
          <Bar dataKey="Votos Contra" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Gráfico de Distribuição de Risco Preditivo
const PredictiveRiskChart: React.FC<{ analysis: PredictiveAnalysis }> = ({ analysis }) => {
  const data = [
    { name: 'Risco de Crise', value: analysis.crisisRisk },
    { name: 'Segurança', value: 100 - analysis.crisisRisk }
  ];

  const COLORS = ['#ef4444', '#10b981'];

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="text-orange-500" />
        Análise Preditiva (30 dias)
      </h3>
      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <p className="text-center mt-4 text-sm text-gray-600">
        Confiança: {analysis.confidenceLevel}%
      </p>
    </div>
  );
};

// Card de Consulta
const ConsultationCard: React.FC<{ consultation: Consultation }> = ({ consultation }) => (
  <div className="bg-white rounded-lg p-4 shadow border-l-4 border-emerald-500">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-bold text-gray-800">{consultation.diagnosis}</h4>
      <span className={`text-xs font-bold px-2 py-1 rounded ${
        consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
        consultation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {consultation.status.toUpperCase()}
      </span>
    </div>
    <p className="text-sm text-gray-600 mb-2">
      📅 {new Date(consultation.date).toLocaleDateString('pt-BR')}
    </p>
    <p className="text-sm text-gray-600 mb-3">
      🎯 Confiança: {consultation.confidence}%
    </p>
    <div className="space-y-1">
      {consultation.prescriptions.map((p, i) => (
        <p key={i} className="text-xs text-gray-700 flex items-center gap-2">
          <Pill size={14} className="text-emerald-500" /> {p}
        </p>
      ))}
    </div>
  </div>
);

// Card de Proposta DAO
const DAOProposalCard: React.FC<{ proposal: DAOProposal }> = ({ proposal }) => {
  const totalVotes = proposal.votesFor + proposal.votesAgainst;
  const percentFor = (proposal.votesFor / totalVotes) * 100;

  return (
    <div className="bg-white rounded-lg p-4 shadow border-l-4 border-purple-500">
      <h4 className="font-bold text-gray-800 mb-2">{proposal.title}</h4>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Votos a Favor</span>
          <span>{percentFor.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${percentFor}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {proposal.votesFor.toLocaleString()} vs {proposal.votesAgainst.toLocaleString()}
        </p>
        <span className={`text-xs font-bold px-2 py-1 rounded inline-block ${
          proposal.status === 'active' ? 'bg-blue-100 text-blue-800' :
          proposal.status === 'passed' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {proposal.status.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function PlantaRaiz3Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState(3);

  // Cálculos derivados
  const latestBiometry = mockPatientProfile.wearableData[mockPatientProfile.wearableData.length - 1];
  const avgHeartRate = useMemo(() => {
    const sum = mockPatientProfile.wearableData.reduce((acc, d) => acc + d.heartRate, 0);
    return Math.round(sum / mockPatientProfile.wearableData.length);
  }, []);

  const avgStressLevel = useMemo(() => {
    const sum = mockPatientProfile.wearableData.reduce((acc, d) => acc + d.stressLevel, 0);
    return (sum / mockPatientProfile.wearableData.length).toFixed(1);
  }, []);

  const topRecommendation = mockProducts.reduce((prev, current) =>
    prev.matchScore > current.matchScore ? prev : current
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-black/40 backdrop-blur border-b border-emerald-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <Leaf className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white">Planta & Raiz 3.0</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition">
              <Bell className="text-emerald-400" size={20} />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg transition">
              <Settings className="text-emerald-400" size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-black/40 backdrop-blur border-r border-emerald-500/20 transition-all duration-300 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto`}>
          <nav className="p-4 space-y-2">
            {[
              { id: 'overview', icon: Activity, label: 'Visão Geral' },
              { id: 'ai', icon: Brain, label: 'IA Autônoma' },
              { id: 'marketplace', icon: Leaf, label: 'Marketplace' },
              { id: 'telemedicine', icon: Heart, label: 'Telemedicina' },
              { id: 'dao', icon: Vote, label: 'DAO' },
              { id: 'predict', icon: TrendingUp, label: 'Previsão' }
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                  activeTab === id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span className="text-sm">{label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-lg p-6 border border-emerald-500/20">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Bem-vindo, {mockPatientProfile.name}! 👋
                  </h2>
                  <p className="text-gray-300">
                    Seu dashboard integrado com IA autônoma, telemedicina, marketplace e previsão preditiva.
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard
                    icon={<Heart />}
                    title="Frequência Cardíaca"
                    value={`${latestBiometry.heartRate} bpm`}
                    subtitle="Normal"
                    color="from-red-500/20 to-red-600/20"
                  />
                  <StatCard
                    icon={<Brain />}
                    title="Nível de Estresse"
                    value={`${latestBiometry.stressLevel}/10`}
                    subtitle="Baixo"
                    color="from-orange-500/20 to-orange-600/20"
                  />
                  <StatCard
                    icon={<Droplet />}
                    title="Qualidade do Sono"
                    value={`${latestBiometry.sleepQuality}/10`}
                    subtitle="Excelente"
                    color="from-emerald-500/20 to-emerald-600/20"
                  />
                  <StatCard
                    icon={<Zap />}
                    title="Nível de Atividade"
                    value={`${latestBiometry.activityLevel}/10`}
                    subtitle="Ótimo"
                    color="from-blue-500/20 to-blue-600/20"
                  />
                  <StatCard
                    icon={<AlertCircle />}
                    title="Risco de Crise"
                    value={`${mockPredictiveAnalysis.crisisRisk}%`}
                    subtitle="Baixo"
                    color="from-green-500/20 to-green-600/20"
                  />
                  <StatCard
                    icon={<CheckCircle />}
                    title="Confiança IA"
                    value={`${mockPredictiveAnalysis.confidenceLevel}%`}
                    subtitle="Excelente"
                    color="from-purple-500/20 to-purple-600/20"
                  />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BiometryChart data={mockPatientProfile.wearableData} />
                  <ProductRecommendationsChart products={mockProducts} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DAOVotingChart proposals={mockDAOProposals} />
                  <PredictiveRiskChart analysis={mockPredictiveAnalysis} />
                </div>
              </>
            )}

            {/* IA Autônoma Tab */}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Brain className="text-blue-400" />
                  RAÍZ 2.0 — Sistema de IA Autônomo
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-6 border border-blue-500/20">
                    <h3 className="text-lg font-bold text-white mb-4">Análise Multi-Modal</h3>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-400" />
                        NLP para análise de sintomas
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-400" />
                        Integração com wearables (Apple, Fitbit, Oura)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-400" />
                        Análise de farmacogenômica
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-400" />
                        Computer Vision para plantas
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-400" />
                        Monitoramento 24/7
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6 border border-blue-500/20">
                    <h3 className="text-lg font-bold text-white mb-4">Métricas de Performance</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">Precisão de Diagnóstico</span>
                          <span className="text-green-400 font-bold">94%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">Disponibilidade</span>
                          <span className="text-green-400 font-bold">24/7</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">Tempo de Resposta</span>
                          <span className="text-green-400 font-bold">2-5 min</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-blue-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Últimas Análises</h3>
                  <div className="space-y-4">
                    {mockConsultations.map((consultation) => (
                      <ConsultationCard key={consultation.id} consultation={consultation} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Marketplace Tab */}
            {activeTab === 'marketplace' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Leaf className="text-emerald-400" />
                  Marketplace Bio-Inteligente
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {mockProducts.map((product) => (
                    <div key={product.id} className="bg-white/5 rounded-lg overflow-hidden border border-emerald-500/20 hover:border-emerald-500/50 transition">
                      <img src={product.image} alt={product.name} className="w-full h-40 object-cover" />
                      <div className="p-4">
                        <h3 className="font-bold text-white mb-2">{product.name}</h3>
                        <div className="space-y-2 text-sm text-gray-300 mb-4">
                          <p>🌿 {product.species}</p>
                          <p>THC: {product.thcPercentage}% | CBD: {product.cbdPercentage}%</p>
                          <p className="flex items-center gap-2">
                            <Zap size={14} className="text-yellow-400" />
                            Match Score: <span className="text-emerald-400 font-bold">{product.matchScore}%</span>
                          </p>
                          <p className="text-emerald-400 font-bold">R$ {product.price.toFixed(2)}</p>
                        </div>
                        <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-lg transition">
                          Adicionar ao Carrinho
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-emerald-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Recomendação Principal</h3>
                  <div className="flex items-center gap-4">
                    <img src={topRecommendation.image} alt={topRecommendation.name} className="w-24 h-24 rounded-lg object-cover" />
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{topRecommendation.name}</h4>
                      <p className="text-gray-300 mb-2">
                        Match Score: <span className="text-emerald-400 font-bold">{topRecommendation.matchScore}%</span>
                      </p>
                      <p className="text-gray-300 mb-4">
                        Recomendado baseado em sua genética, histórico médico e wearables.
                      </p>
                      <button className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg transition">
                        Comprar Agora
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Telemedicina Tab */}
            {activeTab === 'telemedicine' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Heart className="text-red-400" />
                  RAÍZ Doctor 3.0 — Telemedicina Neuro-IA
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-6 border border-red-500/20">
                    <h3 className="text-lg font-bold text-white mb-4">Agendar Consulta</h3>
                    <div className="space-y-4">
                      <input type="date" className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg" />
                      <select className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg">
                        <option>Selecione o horário</option>
                        <option>09:00</option>
                        <option>10:00</option>
                        <option>14:00</option>
                        <option>15:00</option>
                      </select>
                      <button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg transition">
                        Agendar Consulta IA
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6 border border-red-500/20">
                    <h3 className="text-lg font-bold text-white mb-4">Características</h3>
                    <ul className="space-y-2 text-gray-300 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-400" />
                        Consultas autônomas (11 minutos)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-400" />
                        Diagnóstico 95%+ precisão
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-400" />
                        Prescrição personalizada
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-400" />
                        Monitoramento contínuo
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-400" />
                        Escalação inteligente
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-red-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Histórico de Consultas</h3>
                  <div className="space-y-4">
                    {mockConsultations.map((consultation) => (
                      <ConsultationCard key={consultation.id} consultation={consultation} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DAO Tab */}
            {activeTab === 'dao' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Vote className="text-purple-400" />
                  RAÍZ DAO 2.0 — Governança Descentralizada
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    icon={<Zap />}
                    title="Saldo de Tokens"
                    value="1,250 $RAIZ"
                    subtitle="Valor: R$ 12.500"
                    color="from-purple-500/20 to-purple-600/20"
                  />
                  <StatCard
                    icon={<Users />}
                    title="Membros DAO"
                    value="50,000+"
                    subtitle="Comunidade ativa"
                    color="from-blue-500/20 to-blue-600/20"
                  />
                  <StatCard
                    icon={<Microscope />}
                    title="Pesquisas Financiadas"
                    value="12"
                    subtitle="Em andamento"
                    color="from-green-500/20 to-green-600/20"
                  />
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-purple-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Propostas Ativas</h3>
                  <div className="space-y-4">
                    {mockDAOProposals.map((proposal) => (
                      <DAOProposalCard key={proposal.id} proposal={proposal} />
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-purple-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Recompensas por Participação</h3>
                  <div className="space-y-2 text-gray-300 text-sm">
                    <p>✓ Votação em propostas: +10 tokens</p>
                    <p>✓ Participação em pesquisa: +50 tokens</p>
                    <p>✓ Staking de tokens: 5-20% ao ano</p>
                    <p>✓ Mentoria peer-to-peer: +25 tokens</p>
                  </div>
                </div>
              </div>
            )}

            {/* Previsão Tab */}
            {activeTab === 'predict' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="text-orange-400" />
                  RAÍZ Predict 1.0 — Previsão Preditiva
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-6 border border-orange-500/20">
                    <h3 className="text-lg font-bold text-white mb-4">Análise de Risco</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-300">Risco de Crise (30 dias)</span>
                          <span className="text-green-400 font-bold">{mockPredictiveAnalysis.crisisRisk}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-green-500 to-yellow-500 h-3 rounded-full"
                            style={{ width: `${mockPredictiveAnalysis.crisisRisk}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">
                        Data Prevista: {new Date(mockPredictiveAnalysis.predictedDate).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm text-gray-400">
                        Confiança: {mockPredictiveAnalysis.confidenceLevel}%
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6 border border-orange-500/20">
                    <h3 className="text-lg font-bold text-white mb-4">Recomendações Preventivas</h3>
                    <ul className="space-y-2">
                      {mockPredictiveAnalysis.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                          <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-6 border border-orange-500/20">
                  <h3 className="text-lg font-bold text-white mb-4">Modelos Preditivos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <p className="text-white font-bold mb-2">Previsão de Crises</p>
                      <p className="text-gray-300 text-sm">Precisão: 89%</p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <p className="text-white font-bold mb-2">Otimização de Tratamento</p>
                      <p className="text-gray-300 text-sm">Melhoria: +25%</p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <p className="text-white font-bold mb-2">Previsão de Efeitos Colaterais</p>
                      <p className="text-gray-300 text-sm">Precisão: 92%</p>
                    </div>
                    <div className="bg-gray-700/30 rounded-lg p-4">
                      <p className="text-white font-bold mb-2">Progressão de Doença</p>
                      <p className="text-gray-300 text-sm">Precisão: 87%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
