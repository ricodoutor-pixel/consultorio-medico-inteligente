import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, AlertTriangle, BarChart3, PieChart } from 'lucide-react';

interface ReviewAnalytics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  topSpecialties: Array<{ specialty: string; avgRating: number; reviewCount: number }>;
  recentNegativeReviews: Array<{ doctorName: string; rating: number; comment: string }>;
  trendData: Array<{ date: string; avgRating: number; reviewCount: number }>;
}

const ReviewsAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<ReviewAnalytics>({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    topSpecialties: [],
    recentNegativeReviews: [],
    trendData: [],
  });

  useEffect(() => {
    // Simulate loading analytics
    const mockAnalytics: ReviewAnalytics = {
      totalReviews: 1250,
      averageRating: 4.6,
      ratingDistribution: {
        1: 25,
        2: 45,
        3: 150,
        4: 380,
        5: 650,
      },
      topSpecialties: [
        { specialty: 'Clínica Geral', avgRating: 4.8, reviewCount: 320 },
        { specialty: 'Psiquiatria', avgRating: 4.5, reviewCount: 280 },
        { specialty: 'Dermatologia', avgRating: 4.7, reviewCount: 200 },
        { specialty: 'Cardiologia', avgRating: 4.4, reviewCount: 180 },
      ],
      recentNegativeReviews: [
        {
          doctorName: 'Dr. Silva',
          rating: 2,
          comment: 'Atendimento demorado, pouco atencioso',
        },
        {
          doctorName: 'Dra. Santos',
          rating: 1,
          comment: 'Não recomendo, falta de profissionalismo',
        },
        {
          doctorName: 'Dr. Oliveira',
          rating: 2,
          comment: 'Prescrição inadequada para meu caso',
        },
      ],
      trendData: [
        { date: '2026-03-10', avgRating: 4.5, reviewCount: 45 },
        { date: '2026-03-11', avgRating: 4.6, reviewCount: 52 },
        { date: '2026-03-12', avgRating: 4.7, reviewCount: 48 },
        { date: '2026-03-13', avgRating: 4.6, reviewCount: 55 },
        { date: '2026-03-14', avgRating: 4.8, reviewCount: 62 },
        { date: '2026-03-15', avgRating: 4.7, reviewCount: 58 },
        { date: '2026-03-16', avgRating: 4.6, reviewCount: 50 },
      ],
    };

    setAnalytics(mockAnalytics);
  }, []);

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-400';
    if (rating >= 3.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(rating)
                ? 'fill-[#00FF00] text-[#00FF00]'
                : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const getPercentage = (count: number) => {
    return analytics.totalReviews > 0 ? ((count / analytics.totalReviews) * 100).toFixed(1) : '0';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-[#00FF00]" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Análise de Reviews e Avaliações
            </h1>
          </div>
          <p className="text-gray-400">
            Gráficos de satisfação, tendências de avaliações e alertas para reviews negativos
          </p>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Total Reviews */}
          <Card className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Total de Avaliações</h3>
              <TrendingUp className="w-5 h-5 text-[#00FF00]" />
            </div>
            <p className="text-3xl font-bold text-[#00FF00]">{analytics.totalReviews}</p>
            <p className="text-xs text-gray-500 mt-2">+15% este mês</p>
          </Card>

          {/* Average Rating */}
          <Card className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">Avaliação Média</h3>
              <Star className="w-5 h-5 text-[#00FF00]" />
            </div>
            <div className="flex items-center gap-3">
              <p className={`text-3xl font-bold ${getRatingColor(analytics.averageRating)}`}>
                {analytics.averageRating.toFixed(1)}
              </p>
              <div>{renderStars(analytics.averageRating)}</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Baseado em {analytics.totalReviews} avaliações</p>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6 mb-8">
          <h3 className="text-[#00FF00] font-semibold mb-4">Distribuição de Avaliações</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-20">
                  {renderStars(stars)}
                  <span className="text-gray-400 text-sm">{stars}★</span>
                </div>
                <div className="flex-1 bg-gray-700/30 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-[#00FF00]/60 h-full transition-all"
                    style={{
                      width: `${getPercentage(analytics.ratingDistribution[stars as keyof typeof analytics.ratingDistribution])}%`,
                    }}
                  />
                </div>
                <div className="text-right w-24">
                  <p className="text-white font-semibold">
                    {analytics.ratingDistribution[stars as keyof typeof analytics.ratingDistribution]}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {getPercentage(analytics.ratingDistribution[stars as keyof typeof analytics.ratingDistribution])}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Specialties */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Rated Specialties */}
          <Card className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6">
            <h3 className="text-[#00FF00] font-semibold mb-4">Especialidades Melhor Avaliadas</h3>
            <div className="space-y-4">
              {analytics.topSpecialties.map((specialty, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{specialty.specialty}</p>
                    <p className="text-gray-500 text-sm">{specialty.reviewCount} avaliações</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getRatingColor(specialty.avgRating)}`}>
                      {specialty.avgRating.toFixed(1)}
                    </span>
                    {renderStars(specialty.avgRating)}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Trend Chart */}
          <Card className="bg-[#0A0E27]/50 border-[#00FF00]/20 p-6">
            <h3 className="text-[#00FF00] font-semibold mb-4">Tendência de Avaliações (7 dias)</h3>
            <div className="space-y-2">
              {analytics.trendData.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-400 text-sm">{data.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`font-semibold ${getRatingColor(data.avgRating)}`}>
                        {data.avgRating.toFixed(1)}★
                      </p>
                      <p className="text-gray-500 text-xs">{data.reviewCount} reviews</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Negative Reviews Alert */}
        {analytics.recentNegativeReviews.length > 0 && (
          <Card className="bg-red-500/10 border-red-500/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-red-400 font-semibold text-lg">
                Alertas de Reviews Negativos
              </h3>
            </div>
            <div className="space-y-4">
              {analytics.recentNegativeReviews.map((review, index) => (
                <div key={index} className="bg-[#0A0E27]/50 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-white font-semibold">{review.doctorName}</p>
                      <div className="mt-1">{renderStars(review.rating)}</div>
                    </div>
                    <Badge className="bg-red-500/20 text-red-400">⚠ Atenção</Badge>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">"{review.comment}"</p>
                  <Button className="mt-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm">
                    Revisar
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReviewsAnalyticsDashboard;
