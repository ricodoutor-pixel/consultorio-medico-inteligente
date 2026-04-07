import React, { useState, useEffect } from "react";
import { Globe, Users, TrendingUp, Activity, MapPin, Clock } from "lucide-react";
import BLISS_COLORS from "@/styles/bliss-colors";

export default function OnlineUsersDashboard() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data
  const globalStats = {
    totalOnline: 3847,
    activeConsultations: 156,
    newUsersToday: 234,
    platformUptime: 99.98,
  };

  const regions = [
    {
      id: "br",
      name: "Brasil",
      flag: "🇧🇷",
      users: 2156,
      activeConsultations: 89,
      avgSessionTime: "18 min",
      topCities: ["São Paulo", "Rio de Janeiro", "Belo Horizonte"],
      growth: "+12%",
      specialists: 234,
      pharmacies: 45,
    },
    {
      id: "pt",
      name: "Portugal",
      flag: "🇵🇹",
      users: 567,
      activeConsultations: 34,
      avgSessionTime: "22 min",
      topCities: ["Lisboa", "Porto", "Covilhã"],
      growth: "+8%",
      specialists: 56,
      pharmacies: 12,
    },
    {
      id: "es",
      name: "Espanha",
      flag: "🇪🇸",
      users: 456,
      activeConsultations: 21,
      avgSessionTime: "19 min",
      topCities: ["Madrid", "Barcelona", "Valencia"],
      growth: "+5%",
      specialists: 45,
      pharmacies: 8,
    },
    {
      id: "ar",
      name: "Argentina",
      flag: "🇦🇷",
      users: 345,
      activeConsultations: 12,
      avgSessionTime: "20 min",
      topCities: ["Buenos Aires", "Córdoba", "Rosario"],
      growth: "+3%",
      specialists: 34,
      pharmacies: 6,
    },
    {
      id: "mx",
      name: "México",
      flag: "🇲🇽",
      users: 234,
      activeConsultations: 0,
      avgSessionTime: "0 min",
      topCities: ["Cidade do México", "Guadalajara", "Monterrey"],
      growth: "+1%",
      specialists: 12,
      pharmacies: 3,
    },
    {
      id: "other",
      name: "Outros Países",
      flag: "🌍",
      users: 89,
      activeConsultations: 0,
      avgSessionTime: "0 min",
      topCities: ["Vários", "Dispersos", "Global"],
      growth: "+2%",
      specialists: 8,
      pharmacies: 2,
    },
  ];

  const selectedRegionData = regions.find((r) => r.id === selectedRegion);

  const hourlyActivity = [
    { hour: "00h", users: 234, consultations: 12 },
    { hour: "03h", users: 156, consultations: 8 },
    { hour: "06h", users: 289, consultations: 15 },
    { hour: "09h", users: 567, consultations: 34 },
    { hour: "12h", users: 892, consultations: 56 },
    { hour: "15h", users: 1234, consultations: 89 },
    { hour: "18h", users: 1567, consultations: 123 },
    { hour: "21h", users: 1289, consultations: 98 },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BLISS_COLORS.gray[50] }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: BLISS_COLORS.primary[200] }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8" style={{ color: BLISS_COLORS.primary[500] }} />
              <h1 className="text-3xl font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                Usuários Online Globais
              </h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Activity className="w-4 h-4" style={{ color: "#10b981" }} />
              Atualizado em tempo real
            </div>
          </div>

          {/* Global Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Online Agora",
                value: globalStats.totalOnline,
                icon: <Users className="w-4 h-4" />,
              },
              {
                label: "Consultas Ativas",
                value: globalStats.activeConsultations,
                icon: <Activity className="w-4 h-4" />,
              },
              {
                label: "Novos Usuários",
                value: globalStats.newUsersToday,
                icon: <TrendingUp className="w-4 h-4" />,
              },
              {
                label: "Uptime",
                value: `${globalStats.platformUptime}%`,
                icon: <Clock className="w-4 h-4" />,
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg text-center text-sm"
                style={{ backgroundColor: BLISS_COLORS.primary[50] }}
              >
                <p className="text-gray-600 mb-1">{stat.label}</p>
                <p className="font-bold text-lg" style={{ color: BLISS_COLORS.primary[700] }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Regions Map */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h2 className="font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                Regiões
              </h2>

              <div className="space-y-2">
                {regions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => setSelectedRegion(selectedRegion === region.id ? null : region.id)}
                    className="w-full p-3 rounded-lg border text-left transition"
                    style={{
                      borderColor:
                        selectedRegion === region.id ? BLISS_COLORS.primary[500] : BLISS_COLORS.primary[100],
                      backgroundColor:
                        selectedRegion === region.id ? BLISS_COLORS.primary[50] : "white",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{region.flag}</span>
                        <p className="font-bold text-sm" style={{ color: BLISS_COLORS.primary[700] }}>
                          {region.name}
                        </p>
                      </div>
                      <span className="text-xs font-bold" style={{ color: "#10b981" }}>
                        {region.growth}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>{region.users} online</span>
                      <span>{region.activeConsultations} consultas</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Region Details */}
            {selectedRegionData && (
              <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-5xl">{selectedRegionData.flag}</span>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                      {selectedRegionData.name}
                    </h2>
                    <p className="text-gray-600">Crescimento: {selectedRegionData.growth}</p>
                  </div>
                </div>

                {/* Region Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Usuários Online", value: selectedRegionData.users },
                    { label: "Consultas Ativas", value: selectedRegionData.activeConsultations },
                    { label: "Tempo Médio", value: selectedRegionData.avgSessionTime },
                    { label: "Especialistas", value: selectedRegionData.specialists },
                    { label: "Farmácias", value: selectedRegionData.pharmacies },
                    { label: "Cidades Top", value: selectedRegionData.topCities.length },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg text-center"
                      style={{ backgroundColor: BLISS_COLORS.primary[50] }}
                    >
                      <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                      <p className="font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Top Cities */}
                <div>
                  <p className="font-bold mb-3" style={{ color: BLISS_COLORS.primary[700] }}>
                    Principais Cidades
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRegionData.topCities.map((city, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-sm font-bold"
                        style={{ backgroundColor: BLISS_COLORS.primary[100], color: BLISS_COLORS.primary[700] }}
                      >
                        📍 {city}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Hourly Activity Chart */}
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                Atividade por Hora (últimas 24h)
              </h2>

              <div className="flex items-end gap-2 h-48">
                {hourlyActivity.map((data, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-1">{data.users}</div>
                    <div
                      className="w-full rounded-t transition hover:opacity-80"
                      style={{
                        backgroundColor: BLISS_COLORS.primary[500],
                        height: `${(data.users / 1567) * 100}%`,
                      }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2">{data.hour}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time Activity */}
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                🔴 Atividade em Tempo Real
              </h2>

              <div className="space-y-3">
                {[
                  { action: "Novo usuário cadastrado", location: "São Paulo, BR", time: "agora" },
                  { action: "Consulta iniciada", location: "Lisboa, PT", time: "1 min atrás" },
                  { action: "Receita gerada", location: "Madrid, ES", time: "2 min atrás" },
                  { action: "Compra realizada", location: "Buenos Aires, AR", time: "3 min atrás" },
                  { action: "Indicação confirmada", location: "Rio de Janeiro, BR", time: "4 min atrás" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: BLISS_COLORS.primary[50] }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#10b981" }}></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                        {item.action}
                      </p>
                      <p className="text-xs text-gray-600">{item.location}</p>
                    </div>
                    <p className="text-xs text-gray-600">{item.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
