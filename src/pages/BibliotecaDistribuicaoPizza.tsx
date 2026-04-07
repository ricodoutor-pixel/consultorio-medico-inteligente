import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, PieChart as PieChartIcon } from 'lucide-react';

const BIBLIOTECA_STATS = [
  { species: 'Cannabis Sativa L.', imageCount: 10 },
  { species: 'Cannabis Indica Lam.', imageCount: 10 },
  { species: 'CBD Hemp', imageCount: 10 },
  { species: 'Harlequin', imageCount: 10 },
  { species: 'Charlotte\'s Web', imageCount: 10 },
  { species: 'Durban Poison', imageCount: 10 },
  { species: 'Blue Dream', imageCount: 10 },
  { species: 'OG Kush', imageCount: 10 }
];

const COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
  '#f97316'  // Orange
];

export default function BibliotecaDistribuicaoPizza() {
  const stats = useMemo(() => {
    const totalImages = BIBLIOTECA_STATS.reduce((acc, d) => acc + d.imageCount, 0);
    return {
      totalImages,
      speciesCount: BIBLIOTECA_STATS.length,
      averageImagesPerSpecies: Math.round(totalImages / BIBLIOTECA_STATS.length)
    };
  }, []);

  const pieData = useMemo(() => {
    return BIBLIOTECA_STATS.map((item) => ({
      name: item.species.split(' ')[0],
      value: item.imageCount,
      fullName: item.species,
      percentage: ((item.imageCount / stats.totalImages) * 100).toFixed(1)
    }));
  }, [stats.totalImages]);

  const handleDownload = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = (canvas as any).toDataURL('image/png');
      link.download = 'biblioteca-distribuicao-pizza.png';
      link.click();
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 font-semibold">{data.fullName}</p>
          <p className="text-emerald-400">Imagens: {data.value}</p>
          <p className="text-blue-400">Percentual: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <PieChartIcon className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">
              🥧 Distribuição de Imagens por Espécie
            </h1>
          </div>
          <p className="text-slate-400">
            Visualização percentual da distribuição de imagens entre as 8 espécies de cannabis medicinal
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
              <CardTitle className="text-sm font-medium text-slate-400">Espécies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{stats.speciesCount}</div>
              <p className="text-xs text-slate-500 mt-1">Cannabis medicinal</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Média por Espécie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{stats.averageImagesPerSpecies}</div>
              <p className="text-xs text-slate-500 mt-1">Imagens/espécie</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Pizza */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Distribuição Percentual de Imagens</CardTitle>
            <CardDescription className="text-slate-400">
              Cada fatia representa o percentual de imagens de uma espécie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-96 bg-slate-900/50 rounded-lg p-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percentage }) => `${percentage}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: any) => entry.payload.fullName}
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Distribuição */}
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Detalhes da Distribuição</CardTitle>
            <CardDescription className="text-slate-400">
              Breakdown completo de imagens e percentuais por espécie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-300 font-semibold">Espécie</th>
                    <th className="text-center py-3 px-4 text-slate-300 font-semibold">Imagens</th>
                    <th className="text-center py-3 px-4 text-slate-300 font-semibold">Percentual</th>
                    <th className="text-center py-3 px-4 text-slate-300 font-semibold">Visualização</th>
                  </tr>
                </thead>
                <tbody>
                  {pieData.map((item, index) => (
                    <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 text-slate-300 font-medium">{item.fullName}</td>
                      <td className="text-center py-3 px-4">
                        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-semibold">
                          {item.value}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-semibold">
                          {item.percentage}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className="h-3 rounded-full"
                            style={{
                              width: `${parseFloat(item.percentage) * 2}px`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                          <span className="text-slate-400 text-xs">{item.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">📊 Análise de Distribuição</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400 space-y-3">
              <p>
                <strong className="text-slate-300">✓ Distribuição Uniforme:</strong> Todas as espécies têm exatamente 10 imagens (12.5% cada)
              </p>
              <p>
                <strong className="text-slate-300">✓ Cobertura Equilibrada:</strong> Nenhuma espécie é privilegiada
              </p>
              <p>
                <strong className="text-slate-300">✓ Representatividade:</strong> Cada espécie tem igual importância
              </p>
              <p>
                <strong className="text-slate-300">✓ Qualidade Consistente:</strong> Mesma quantidade de imagens por espécie
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">🎨 Legenda de Cores</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-400 space-y-2">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-300">{item.fullName}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Gráfico
          </Button>
        </div>
      </div>
    </div>
  );
}
