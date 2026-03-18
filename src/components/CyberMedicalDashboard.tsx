import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, DollarSign, Users, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * PLANTA & RAIZ 2030 - UI TECH-LUXURY/CYBER-MEDICAL
 * 
 * Estilo: Tech-Luxury / Cyber-Medical
 * Cores: Fundo Black Deep (#0A0E27), Acentos Verde Neon (#00FF00)
 * Efeito: Glassmorphism em todos os cards
 * Gráficos: Faturamento em tempo real
 */

interface DashboardData {
  totalRevenue: number;
  activeConsultations: number;
  totalPatients: number;
  conversionRate: number;
  revenueHistory: Array<{ time: string; revenue: number }>;
  doctorPerformance: Array<{ doctor: string; consultations: number; revenue: number }>;
  storePerformance: Array<{ store: string; sales: number; revenue: number }>;
}

export function CyberMedicalDashboard() {
  const [data, setData] = useState<DashboardData>({
    totalRevenue: 125000,
    activeConsultations: 42,
    totalPatients: 1850,
    conversionRate: 78.5,
    revenueHistory: [
      { time: '00:00', revenue: 0 },
      { time: '04:00', revenue: 5000 },
      { time: '08:00', revenue: 12000 },
      { time: '12:00', revenue: 35000 },
      { time: '16:00', revenue: 65000 },
      { time: '20:00', revenue: 125000 },
    ],
    doctorPerformance: [
      { doctor: 'Dr. Edilson Bezerra', consultations: 45, revenue: 44550 },
      { doctor: 'Dra. Marina Silva', consultations: 38, revenue: 37620 },
      { doctor: 'Dr. Carlos Santos', consultations: 32, revenue: 31680 },
    ],
    storePerformance: [
      { store: 'Farmácia Central', sales: 156, revenue: 28900 },
      { store: 'Loja Verde', sales: 142, revenue: 26300 },
      { store: 'Medicamentos Plus', sales: 128, revenue: 23700 },
    ],
  });

  // Simular atualização em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        totalRevenue: prev.totalRevenue + Math.random() * 1000,
        activeConsultations: Math.floor(Math.random() * 50) + 20,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E27] via-[#0F1535] to-[#0A0E27] p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          🌿 Planta & Raiz 2030
        </h1>
        <p className="text-[#00FF00] text-lg">
          Plataforma Autônoma de Telemedicina Canábica
        </p>
      </div>

      {/* Aviso de Isenção Jurídica */}
      <div className="mb-8 p-4 rounded-lg backdrop-blur-md bg-white/5 border border-[#00FF00]/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#00FF00] flex-shrink-0 mt-1" />
          <p className="text-sm text-gray-300">
            <strong>Aviso Legal:</strong> A Planta & Raiz é uma infraestrutura tecnológica autônoma. 
            A responsabilidade técnica pelo ato médico e a qualidade do produto comercializado cabem 
            exclusivamente aos respectivos profissionais e lojistas cadastrados.
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="backdrop-blur-md bg-white/5 border border-[#00FF00]/20 rounded-lg p-6 hover:border-[#00FF00]/40 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-300 text-sm font-semibold">Faturamento Total</h3>
            <DollarSign className="w-5 h-5 text-[#00FF00]" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            R$ {(data.totalRevenue / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-[#00FF00]">↑ 12.5% hoje</div>
        </div>

        {/* Active Consultations */}
        <div className="backdrop-blur-md bg-white/5 border border-[#00FF00]/20 rounded-lg p-6 hover:border-[#00FF00]/40 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-300 text-sm font-semibold">Consultas Ativas</h3>
            <Activity className="w-5 h-5 text-[#00FF00]" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {data.activeConsultations}
          </div>
          <div className="text-xs text-[#00FF00]">Em andamento agora</div>
        </div>

        {/* Total Patients */}
        <div className="backdrop-blur-md bg-white/5 border border-[#00FF00]/20 rounded-lg p-6 hover:border-[#00FF00]/40 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-300 text-sm font-semibold">Total de Pacientes</h3>
            <Users className="w-5 h-5 text-[#00FF00]" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {data.totalPatients.toLocaleString()}
          </div>
          <div className="text-xs text-[#00FF00]">Cadastrados</div>
        </div>

        {/* Conversion Rate */}
        <div className="backdrop-blur-md bg-white/5 border border-[#00FF00]/20 rounded-lg p-6 hover:border-[#00FF00]/40 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-300 text-sm font-semibold">Taxa de Conversão</h3>
            <TrendingUp className="w-5 h-5 text-[#00FF00]" />
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {data.conversionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-[#00FF00]">Triagem → Consulta</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue History */}
        <div className="backdrop-blur-md bg-white/5 border border-[#00FF00]/20 rounded-lg p-6">
          <h3 className="text-white text-lg font-semibold mb-4">Faturamento em Tempo Real</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenueHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00FF00" opacity={0.1} />
              <XAxis dataKey="time" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0E27',
                  border: '1px solid #00FF00',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#00FF00' }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#00FF00"
                strokeWidth={2}
                dot={{ fill: '#00FF00', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Doctor Performance */}
        <div className="backdrop-blur-md bg-white/5 border border-[#00FF00]/20 rounded-lg p-6">
          <h3 className="text-white text-lg font-semibold mb-4">Desempenho de Médicos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.doctorPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00FF00" opacity={0.1} />
              <XAxis dataKey="doctor" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0E27',
                  border: '1px solid #00FF00',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#00FF00' }}
              />
              <Legend />
              <Bar dataKey="consultations" fill="#00FF00" name="Consultas" />
              <Bar dataKey="revenue" fill="#00AA00" name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Store Performance */}
      <div className="backdrop-blur-md bg-white/5 border border-[#00FF00]/20 rounded-lg p-6">
        <h3 className="text-white text-lg font-semibold mb-4">Desempenho de Lojas</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.storePerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#00FF00" opacity={0.1} />
            <XAxis dataKey="store" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0A0E27',
                border: '1px solid #00FF00',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#00FF00' }}
            />
            <Legend />
            <Bar dataKey="sales" fill="#00FF00" name="Vendas" />
            <Bar dataKey="revenue" fill="#00AA00" name="Receita" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status Operacional */}
      <div className="mt-8 backdrop-blur-md bg-white/5 border border-[#00FF00]/20 rounded-lg p-6">
        <h3 className="text-white text-lg font-semibold mb-4">Status Operacional</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#00FF00]" />
            <span className="text-gray-300">Enfermeira Brisa: Online</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#00FF00]" />
            <span className="text-gray-300">Manus CEO: Online</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#00FF00]" />
            <span className="text-gray-300">Guardião ANVISA: Online</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#00FF00]" />
            <span className="text-gray-300">Verdinho: Online</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#00FF00]" />
            <span className="text-gray-300">Jitsi: Operacional</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#00FF00]" />
            <span className="text-gray-300">Mercado Pago: Operacional</span>
          </div>
        </div>
      </div>
    </div>
  );
}
