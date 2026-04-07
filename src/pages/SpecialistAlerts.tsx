import React, { useState, useEffect } from "react";
import {
  Bell,
  Users,
  Globe,
  Phone,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BLISS_COLORS from "@/styles/bliss-colors";

export default function SpecialistAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Mock data
  const onlineStats = {
    totalUsersOnline: 1247,
    usersSearchingConsultation: 34,
    activeConsultations: 12,
    waitingForSpecialist: 8,
  };

  const usersByCountry = [
    { country: "Brasil", flag: "🇧🇷", users: 892, searching: 12 },
    { country: "Portugal", flag: "🇵🇹", users: 156, searching: 5 },
    { country: "Espanha", flag: "🇪🇸", users: 89, searching: 3 },
    { country: "Argentina", flag: "🇦🇷", users: 67, searching: 2 },
    { country: "Outros", flag: "🌍", users: 43, searching: 0 },
  ];

  const consultationRequests = [
    {
      id: 1,
      patientName: "João Silva",
      location: "São Paulo, Brasil",
      flag: "🇧🇷",
      specialty: "Neurologia",
      consultationType: "video",
      price: 120,
      waitTime: 2,
      preInterview: {
        age: 45,
        condition: "Enxaqueca crônica",
        medications: "Dipirona",
        allergies: "Penicilina",
        previousConsultations: 3,
      },
      urgency: "normal",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
    },
    {
      id: 2,
      patientName: "Maria Santos",
      location: "Rio de Janeiro, Brasil",
      flag: "🇧🇷",
      specialty: "Oncologia",
      consultationType: "chat",
      price: 150,
      waitTime: 5,
      preInterview: {
        age: 52,
        condition: "Acompanhamento pós-tratamento",
        medications: "Tamoxifeno",
        allergies: "Nenhuma",
        previousConsultations: 8,
      },
      urgency: "high",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: 3,
      patientName: "Pedro Costa",
      location: "Lisboa, Portugal",
      flag: "🇵🇹",
      specialty: "Reumatologia",
      consultationType: "video",
      price: 100,
      waitTime: 1,
      preInterview: {
        age: 38,
        condition: "Artrite reumatoide",
        medications: "Metotrexato",
        allergies: "AINE",
        previousConsultations: 5,
      },
      urgency: "normal",
      timestamp: new Date(Date.now() - 1 * 60 * 1000),
    },
  ];

  // Simulate incoming alerts
  useEffect(() => {
    setAlerts(consultationRequests);

    // Play notification sound if enabled
    if (soundEnabled && consultationRequests.length > 0) {
      const audio = new Audio("data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==");
      audio.play().catch(() => {});
    }
  }, [soundEnabled]);

  const acceptConsultation = (alertId: number) => {
    setAlerts(alerts.filter((a) => a.id !== alertId));
    setSelectedAlert(null);
  };

  const rejectConsultation = (alertId: number) => {
    setAlerts(alerts.filter((a) => a.id !== alertId));
    setSelectedAlert(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BLISS_COLORS.gray[50] }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: BLISS_COLORS.primary[200] }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8" style={{ color: BLISS_COLORS.primary[500] }} />
              <h1 className="text-3xl font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                Central de Alertas
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="px-4 py-2 rounded-lg border flex items-center gap-2"
                style={{
                  borderColor: soundEnabled ? BLISS_COLORS.primary[200] : "#ef4444",
                  color: soundEnabled ? BLISS_COLORS.primary[600] : "#ef4444",
                }}
              >
                <Bell className="w-4 h-4" />
                {soundEnabled ? "Som ON" : "Som OFF"}
              </button>

              <div
                className="px-4 py-2 rounded-lg text-white font-bold flex items-center gap-2"
                style={{ backgroundColor: alerts.length > 0 ? "#ef4444" : "#10b981" }}
              >
                <AlertCircle className="w-4 h-4" />
                {alerts.length} Solicitações
              </div>
            </div>
          </div>

          {/* Online Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Usuários Online",
                value: onlineStats.totalUsersOnline,
                icon: <Users className="w-4 h-4" />,
              },
              {
                label: "Buscando Consulta",
                value: onlineStats.usersSearchingConsultation,
                icon: <TrendingUp className="w-4 h-4" />,
              },
              {
                label: "Consultas Ativas",
                value: onlineStats.activeConsultations,
                icon: <Phone className="w-4 h-4" />,
              },
              {
                label: "Aguardando",
                value: onlineStats.waitingForSpecialist,
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
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Consultation Requests */}
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                📞 Solicitações de Consulta ({alerts.length})
              </h2>

              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlert(selectedAlert === alert.id ? null : alert.id)}
                      className="p-4 rounded-lg border-2 cursor-pointer transition"
                      style={{
                        borderColor:
                          selectedAlert === alert.id ? BLISS_COLORS.primary[500] : BLISS_COLORS.primary[100],
                        backgroundColor: selectedAlert === alert.id ? BLISS_COLORS.primary[50] : "white",
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-3xl">{alert.flag}</div>
                          <div className="flex-1">
                            <p className="font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                              {alert.patientName}
                            </p>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {alert.location}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className="inline-block px-2 py-1 rounded text-xs font-bold mb-1"
                            style={{
                              backgroundColor:
                                alert.urgency === "high" ? "#fee2e2" : "#dbeafe",
                              color: alert.urgency === "high" ? "#7f1d1d" : "#0c2d6b",
                            }}
                          >
                            {alert.urgency === "high" ? "🔴 Urgente" : "🟢 Normal"}
                          </div>
                          <p className="text-sm font-bold" style={{ color: "#10b981" }}>
                            R$ {alert.price}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm mb-3 pb-3 border-b" style={{ borderColor: BLISS_COLORS.primary[100] }}>
                        <div>
                          <p className="text-gray-600">Tipo</p>
                          <p className="font-bold">
                            {alert.consultationType === "video" ? "📹 Vídeo" : "💬 Chat"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Aguardando</p>
                          <p className="font-bold">{alert.waitTime} min</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Consultas</p>
                          <p className="font-bold">{alert.preInterview.previousConsultations}</p>
                        </div>
                      </div>

                      {selectedAlert === alert.id && (
                        <div className="bg-gray-50 rounded p-3 mb-3 text-sm">
                          <p className="font-bold mb-2" style={{ color: BLISS_COLORS.primary[700] }}>
                            📋 Pré-Entrevista:
                          </p>
                          <div className="space-y-1 text-xs">
                            <p>
                              <strong>Idade:</strong> {alert.preInterview.age} anos
                            </p>
                            <p>
                              <strong>Condição:</strong> {alert.preInterview.condition}
                            </p>
                            <p>
                              <strong>Medicamentos:</strong> {alert.preInterview.medications}
                            </p>
                            <p>
                              <strong>Alergias:</strong> {alert.preInterview.allergies}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => acceptConsultation(alert.id)}
                          className="flex-1 py-2 rounded-lg text-white font-bold flex items-center justify-center gap-2"
                          style={{ backgroundColor: "#10b981" }}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Aceitar
                        </Button>
                        <Button
                          onClick={() => rejectConsultation(alert.id)}
                          className="flex-1 py-2 rounded-lg border font-bold flex items-center justify-center gap-2"
                          style={{ borderColor: "#ef4444", color: "#ef4444" }}
                        >
                          <AlertCircle className="w-4 h-4" />
                          Recusar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-600">Nenhuma solicitação no momento</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Users by Country */}
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5" style={{ color: BLISS_COLORS.primary[500] }} />
                <h3 className="font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                  Usuários Online
                </h3>
              </div>

              <div className="space-y-2">
                {usersByCountry.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border"
                    style={{ borderColor: BLISS_COLORS.primary[100] }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-sm">
                        {item.flag} {item.country}
                      </p>
                      <p className="text-sm font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                        {item.users}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            backgroundColor: BLISS_COLORS.primary[500],
                            width: `${(item.users / 892) * 100}%`,
                          }}
                        ></div>
                      </div>
                      {item.searching > 0 && (
                        <span style={{ color: "#ef4444" }}>
                          🔍 {item.searching}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h3 className="font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                📊 Estatísticas
              </h3>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-gray-600">Taxa de Aceitação</p>
                    <p className="text-sm font-bold">94%</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ backgroundColor: BLISS_COLORS.primary[500], width: "94%" }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm text-gray-600">Tempo Médio Resposta</p>
                    <p className="text-sm font-bold">45s</p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{ backgroundColor: "#10b981", width: "90%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
