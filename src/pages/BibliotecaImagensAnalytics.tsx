import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, TrendingUp } from 'lucide-react';

const BIBLIOTECA_STATS = [
  { species: 'Cannabis Sativa L.', imageCount: 10, averageResolution: 1500, highQualityCount: 10 },
  { species: 'Cannabis Indica Lam.', imageCount: 10, averageResolution: 1480, highQualityCount: 10 },
  { species: 'CBD Hemp', imageCount: 10, averageResolution: 1620, highQualityCount: 10 },
  { species: 'Harlequin', imageCount: 10, averageResolution: 1500, highQualityCount: 10 },
  { species: 'Charlotte\'s Web', imageCount: 10, averageResolution: 1510, highQualityCount: 10 },
  { species: 'Durban Poison', imageCount: 10, averageResolution: 1540, highQualityCount: 10 },
  { species: 'Blue Dream', imageCount: 10, averageResolution: 1500, highQualityCount: 10 },
  { species: 'OG Kush', imageCount: 10, averageResolution: 1490, highQualityCount: 10 }
];

export default function BibliotecaImagensAnalytics() {
  const stats = useMemo(() => {
    const totalImages = BIBLIOTECA_STATS.reduce((acc, d) => acc + d.imageCount, 0);
    const averageResolution = BIBLIOTECA_STATS.reduce((acc, d) => acc + d.averageResolution, 0) / BIBLIOTECA_STATS.length;
    const highQualityTotal = BIBLIOTECA_STATS.reduce((acc, d) => acc + d.highQualityCount, 0);
    const maxResolution = Math.max(...BIBLIOTECA_STATS.map((d) => d.averageResolution));
    const minResolution = Math.min(...BIBLIOTECA_STATS.map((d) => d.averageResolution));

    return { 
      totalImages, 
      averageResolution: Math.round(averageResolution), 
      highQualityTotal, 
      maxResolution, 
      minResolution, 
      speciesCount: BIBLIOTECA_STATS.length 
    };
  }, []);

  const chartData = useMemo(() => {
    return BIBLIOTECA_STATS.map((item) => ({
      name: item.species.split(' ')[0],
      imagens: item.imageCount,
      resolucao: Math.round(item.averageResolution / 100)
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900/10 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
            <h1 className="text-4xl font-bold text-white">📊 Análise de Imagens da Biblioteca</h1>
          </div>
          <p className="text-slate-400">Comparação do número de imagens e resolução média por espécie</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total de Imagens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">{stats.totalImages}</div>
              <p className="text-xs text-slate-500 mt-1">Todas as espécies</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Resolução Média</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{stats.averageResolution}px</div>
              <p className="text-xs text-slate-500 mt-1">Qualidade alta</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Imagens Premium</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{stats.highQualityTotal}</div>
              <p className="text-xs text-slate-500 mt-1">100% qualidade alta</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Espécies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{stats.speciesCount}</div>
              <p className="text-xs text-slate-500 mt-1">Cannabis medicinal</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Variação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-400">{stats.maxResolution - stats.minResolution}px</div>
              <p className="text-xs text-slate-500 mt-1">Diferença máx-mín</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Comparação: Imagens vs Resolução Média</CardTitle>
            <CardDescription className="text-slate-400">Gráfico de barras duplas por espécie de cannabis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-96 bg-slate-900/50 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100} 
                    tick={{ fill: '#cbd5e1', fontSize: 12 }} 
                  />
                  <YAxis 
                    yAxisId="left" 
                    label={{ value: 'Número de Imagens', angle: -90, position: 'insideLeft', fill: '#10b981' }}
                    tick={{ fill: '#10b981' }} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    label={{ value: 'Resolução (×100px)', angle: 90, position: 'insideRight', fill: '#3b82f6' }}
                    tick={{ fill: '#3b82f6' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #334155', 
                      borderRadius: '8px', 
                      color: '#e2e8f0' 
                    }} 
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                  <Bar 
                    yAxisId="left" 
                    dataKey="imagens" 
                    fill="#10b981" 
                    name="Número de Imagens" 
                    radius={[8, 8, 0, 0]} 
                    opacity={0.8} 
                  />
                  <Bar 
                    yAxisId="right" 
                    dataKey="resolucao" 
                    fill="#3b82f6" 
                    name="Resolução (×100px)" 
                    radius={[8, 8, 0, 0]} 
                    opacity={0.8} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Detalhes por Espécie</CardTitle>
            <CardDescription className="text-slate-400">Informações completas sobre imagens e resoluções</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Espécie</th>
                    <th className="text-center py-3 px-4 text-slate-300 font-semibold">Imagens</th>
                    <th className="text-center py-3 px-4 text-slate-300 font-semibold">Resolução Média</th>
                    <th className="text-center py-3 px-4 text-slate-300 font-semibold">Qualidade Alta</th>
                    <th className="text-center py-3 px-4 text-slate-300 font-semibold">% do Total</th>
                  </tr>
                </thead>
                <tbody>
                  {BIBLIOTECA_STATS.map((item, index) => (
                    <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 text-slate-300 font-medium">{item.species}</td>
                      <td className="text-center py-3 px-4">
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-semibold">
                          {item.imageCount}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-semibold">
                          {item.averageResolution}px
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-semibold">
                          {item.highQualityCount}/{item.imageCount}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-slate-400">
                          {((item.imageCount / stats.totalImages) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">🎯 Principais Insights</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400 space-y-3">
              <p><strong className="text-slate-300">✓ Cobertura Completa:</strong> Todas as 8 espécies têm 10 imagens</p>
              <p><strong className="text-slate-300">✓ Qualidade Consistente:</strong> 100% das imagens são de alta qualidade</p>
              <p><strong className="text-slate-300">✓ Resolução Elevada:</strong> Média de {stats.averageResolution}px</p>
              <p><strong className="text-slate-300">✓ Variação Mínima:</strong> Apenas {stats.maxResolution - stats.minResolution}px de diferença</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">📋 Informações Técnicas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400 space-y-3">
              <p><strong className="text-slate-300">Eixo Esquerdo (Verde):</strong> Número de imagens por espécie</p>
              <p><strong className="text-slate-300">Eixo Direito (Azul):</strong> Resolução média em pixels</p>
              <p><strong className="text-slate-300">Formato:</strong> JPEG, PNG com compressão otimizada</p>
              <p><strong className="text-slate-300">Atualização:</strong> 28 de Fevereiro de 2026</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Dados
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Exportar Gráfico
          </Button>
        </div>
      </div>
    </div>
  );
}
