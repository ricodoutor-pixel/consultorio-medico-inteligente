import React, { useState } from "react";
import {
  Copy,
  Share2,
  TrendingUp,
  Users,
  DollarSign,
  Award,
  QrCode,
  Download,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BLISS_COLORS from "@/styles/bliss-colors";

export default function ReferralsDashboard() {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Mock data
  const referralCode = "SPECIALIST-a1b2c3d4-X9Y8Z7";
  const shareUrl = `https://plantaeraiz.com/join?ref=${referralCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;

  const stats = {
    totalReferrals: 12,
    confirmedReferrals: 10,
    totalEarnings: 1000,
    pendingEarnings: 200,
    paidEarnings: 800,
    rank: 45,
  };

  const leaderboard = [
    {
      rank: 1,
      name: "Dr. João Silva",
      avatar: "👨‍⚕️",
      type: "Médico",
      totalReferrals: 87,
      totalEarnings: 8700,
      badge: "🏆 Top Referrer",
    },
    {
      rank: 2,
      name: "Farmácia Bem-Estar",
      avatar: "💚",
      type: "Farmácia",
      totalReferrals: 65,
      totalEarnings: 6500,
      badge: "⭐ Excellent",
    },
    {
      rank: 3,
      name: "Dra. Maria Santos",
      avatar: "👩‍⚕️",
      type: "Médica",
      totalReferrals: 54,
      totalEarnings: 5400,
      badge: "🌟 Rising Star",
    },
    {
      rank: 4,
      name: "Produtor Premium RJ",
      avatar: "🌿",
      type: "Produtor",
      totalReferrals: 43,
      totalEarnings: 4300,
      badge: "",
    },
    {
      rank: 5,
      name: "Dr. Carlos Mendes",
      avatar: "👨‍⚕️",
      type: "Médico",
      totalReferrals: 38,
      totalEarnings: 3800,
      badge: "",
    },
  ];

  const referrals = [
    {
      id: 1,
      name: "João Silva",
      type: "Paciente",
      email: "joao@example.com",
      status: "completed",
      commission: 100,
      date: "7 dias atrás",
    },
    {
      id: 2,
      name: "Farmácia Vida Verde",
      type: "Farmácia",
      email: "contato@vidaverde.com.br",
      status: "completed",
      commission: 150,
      date: "5 dias atrás",
    },
    {
      id: 3,
      name: "Dr. Pedro Costa",
      type: "Especialista",
      email: "pedro@example.com",
      status: "pending",
      commission: 50,
      date: "2 dias atrás",
    },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BLISS_COLORS.gray[50] }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b" style={{ borderColor: BLISS_COLORS.primary[200] }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: BLISS_COLORS.primary[700] }}>
            Sistema de Indicação Premiada
          </h1>
          <p className="text-gray-600">
            Indique pacientes, especialistas ou farmácias e ganhe comissões recorrentes
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {[
            {
              label: "Total de Indicações",
              value: stats.totalReferrals,
              icon: <Users className="w-6 h-6" />,
              color: BLISS_COLORS.primary[500],
            },
            {
              label: "Confirmadas",
              value: stats.confirmedReferrals,
              icon: <Award className="w-6 h-6" />,
              color: BLISS_COLORS.accent[500],
            },
            {
              label: "Ganhos Totais",
              value: `R$ ${stats.totalEarnings}`,
              icon: <DollarSign className="w-6 h-6" />,
              color: "#10b981",
            },
            {
              label: "Pendente",
              value: `R$ ${stats.pendingEarnings}`,
              icon: <TrendingUp className="w-6 h-6" />,
              color: "#f59e0b",
            },
            {
              label: "Posição",
              value: `#${stats.rank}`,
              icon: <Award className="w-6 h-6" />,
              color: BLISS_COLORS.primary[600],
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-lg border"
              style={{ borderColor: BLISS_COLORS.primary[200], backgroundColor: BLISS_COLORS.primary[50] }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <div style={{ color: stat.color }}>{stat.icon}</div>
              </div>
              <p className="text-2xl font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Share Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                Seu Código de Indicação
              </h2>

              {/* Code Display */}
              <div
                className="p-4 rounded-lg mb-4 font-mono text-center border-2"
                style={{ borderColor: BLISS_COLORS.primary[300], backgroundColor: BLISS_COLORS.primary[50] }}
              >
                <p className="text-sm text-gray-600 mb-1">Código</p>
                <p className="text-lg font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                  {referralCode}
                </p>
              </div>

              {/* Share URL */}
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">Link de Convite</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-50"
                    style={{ borderColor: BLISS_COLORS.primary[200] }}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 rounded-lg border flex items-center gap-2"
                    style={{ borderColor: BLISS_COLORS.primary[200], color: BLISS_COLORS.primary[600] }}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copied && <p className="text-xs text-green-600 mt-1">✓ Copiado!</p>}
              </div>

              {/* QR Code */}
              <button
                onClick={() => setShowQR(!showQR)}
                className="w-full px-4 py-2 rounded-lg border flex items-center justify-center gap-2 mb-4"
                style={{ borderColor: BLISS_COLORS.primary[200], color: BLISS_COLORS.primary[600] }}
              >
                <QrCode className="w-4 h-4" />
                {showQR ? "Esconder QR Code" : "Mostrar QR Code"}
              </button>

              {showQR && (
                <div className="mb-4 p-4 bg-white border rounded-lg text-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-full max-w-xs mx-auto" />
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = qrCodeUrl;
                      link.download = `referral-${referralCode}.png`;
                      link.click();
                    }}
                    className="mt-2 text-sm flex items-center justify-center gap-2 mx-auto"
                    style={{ color: BLISS_COLORS.primary[600] }}
                  >
                    <Download className="w-4 h-4" />
                    Baixar QR Code
                  </button>
                </div>
              )}

              {/* Share Buttons */}
              <div className="space-y-2">
                <Button
                  className="w-full py-2 rounded-lg text-white font-bold flex items-center justify-center gap-2"
                  style={{ backgroundColor: BLISS_COLORS.primary[500] }}
                >
                  <Share2 className="w-4 h-4" />
                  Compartilhar
                </Button>
              </div>

              {/* Info Box */}
              <div
                className="mt-6 p-4 rounded-lg text-sm"
                style={{ backgroundColor: BLISS_COLORS.primary[50] }}
              >
                <p className="font-bold mb-2" style={{ color: BLISS_COLORS.primary[700] }}>
                  💰 Como Funciona:
                </p>
                <ul className="space-y-1 text-gray-700 text-xs">
                  <li>✓ Indique um paciente, especialista ou farmácia</li>
                  <li>✓ Receba 10% de comissão quando confirmarem</li>
                  <li>✓ Ganhe mais indicando mais pessoas</li>
                  <li>✓ Saque via PIX sempre que quiser</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Leaderboard & Referrals */}
          <div className="lg:col-span-2 space-y-8">
            {/* Leaderboard */}
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                🏆 Top Indicadores
              </h2>

              <div className="space-y-3">
                {leaderboard.map((person, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 rounded-lg border"
                    style={{ borderColor: BLISS_COLORS.primary[100] }}
                  >
                    <div className="text-2xl">{person.avatar}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                          #{person.rank} {person.name}
                        </p>
                        {person.badge && <span className="text-xs">{person.badge}</span>}
                      </div>
                      <p className="text-xs text-gray-600">{person.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ color: BLISS_COLORS.primary[700] }}>
                        {person.totalReferrals}
                      </p>
                      <p className="text-xs text-gray-600">indicações</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ color: "#10b981" }}>
                        R$ {person.totalEarnings}
                      </p>
                      <p className="text-xs text-gray-600">ganhos</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referrals History */}
            <div className="bg-white rounded-lg border p-6" style={{ borderColor: BLISS_COLORS.primary[200] }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: BLISS_COLORS.primary[700] }}>
                Histórico de Indicações
              </h2>

              <div className="space-y-3">
                {referrals.map((ref, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ borderColor: BLISS_COLORS.primary[100] }}
                  >
                    <div className="flex-1">
                      <p className="font-bold" style={{ color: BLISS_COLORS.primary[700] }}>
                        {ref.name}
                      </p>
                      <p className="text-xs text-gray-600">{ref.email}</p>
                      <p className="text-xs text-gray-500 mt-1">{ref.date}</p>
                    </div>
                    <div className="text-right">
                      <div
                        className="inline-block px-2 py-1 rounded text-xs font-bold mb-2"
                        style={{
                          backgroundColor:
                            ref.status === "completed" ? "#d1fae5" : "#fef3c7",
                          color: ref.status === "completed" ? "#065f46" : "#92400e",
                        }}
                      >
                        {ref.status === "completed" ? "✓ Confirmado" : "⏳ Pendente"}
                      </div>
                      <p className="font-bold" style={{ color: "#10b981" }}>
                        R$ {ref.commission}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="w-full mt-4 px-4 py-2 rounded-lg border flex items-center justify-center gap-2"
                style={{ borderColor: BLISS_COLORS.primary[200], color: BLISS_COLORS.primary[600] }}
              >
                <ChevronDown className="w-4 h-4" />
                Ver Mais
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
