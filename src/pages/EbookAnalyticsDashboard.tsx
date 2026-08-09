import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, Users, Globe, Smartphone } from "lucide-react";

export default function EbookAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for analytics
  const mockSummary = {
    totalDownloads: 1250,
    uniqueEmails: 890,
    uniqueCountries: 45,
    deviceBreakdown: {
      "Desktop": 650,
      "Mobile": 450,
      "Tablet": 150
    },
    professionBreakdown: {
      "Médico": 380,
      "Enfermeiro": 250,
      "Estudante": 320,
      "Farmacêutico": 150,
      "Outro": 150
    },
    sourceBreakdown: {
      "Google": 450,
      "Facebook": 320,
      "Direct": 280,
      "Email": 200
    }
  };

  const mockProfessions = [
    { profession: "Médico", downloads: 380, uniqueEmails: 280, percentage: 30.4 },
    { profession: "Estudante", downloads: 320, uniqueEmails: 240, percentage: 25.6 },
    { profession: "Enfermeiro", downloads: 250, uniqueEmails: 190, percentage: 20.0 },
    { profession: "Farmacêutico", downloads: 150, uniqueEmails: 120, percentage: 12.0 },
    { profession: "Outro", downloads: 150, uniqueEmails: 60, percentage: 12.0 }
  ];

  const mockCountries = [
    { country: "Brasil", downloads: 850, percentage: 68.0 },
    { country: "Portugal", downloads: 180, percentage: 14.4 },
    { country: "Angola", downloads: 90, percentage: 7.2 },
    { country: "Moçambique", downloads: 60, percentage: 4.8 },
    { country: "Outros", downloads: 70, percentage: 5.6 }
  ];

  const mockTrends = [
    { date: "01 Abr", downloads: 45 },
    { date: "02 Abr", downloads: 52 },
    { date: "03 Abr", downloads: 48 },
    { date: "04 Abr", downloads: 61 },
    { date: "05 Abr", downloads: 55 },
    { date: "06 Abr", downloads: 67 },
    { date: "07 Abr", downloads: 72 }
  ];

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const handleExport = () => {
    try {
      // Create CSV content
      const csvContent = [
        ["Profissão", "Downloads", "Emails Únicos", "Percentual"],
        ...mockProfessions.map(p => [p.profession, p.downloads, p.uniqueEmails, p.percentage])
      ]
        .map(row => row.join(","))
        .join("\n");

      // Create and download CSV
      const element = document.createElement("a");
      const file = new Blob([csvContent], { type: "text/csv" });
      element.href = URL.createObjectURL(file);
      element.download = `ebook-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="min-h-dvh bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📊 Analytics de E-book</h1>
          <p className="text-muted-foreground">Rastreamento de downloads, segmentação por profissão e região</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockSummary.totalDownloads}</div>
              <p className="text-xs text-muted-foreground">Todos os tempos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockSummary.uniqueEmails}</div>
              <p className="text-xs text-muted-foreground">Usuários únicos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Países</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockSummary.uniqueCountries}</div>
              <p className="text-xs text-muted-foreground">Regiões geográficas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dispositivos</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(mockSummary.deviceBreakdown).length}</div>
              <p className="text-xs text-muted-foreground">Tipos de dispositivo</p>
            </CardContent>
          </Card>
        </div>

        {/* Export Button */}
        <div className="mb-8 flex justify-end">
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="professions">Profissões</TabsTrigger>
            <TabsTrigger value="countries">Países</TabsTrigger>
            <TabsTrigger value="sources">Fontes</TabsTrigger>
            <TabsTrigger value="devices">Dispositivos</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Professions Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Profissão</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(mockSummary.professionBreakdown).map(([name, value]) => ({
                          name,
                          value,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Devices Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Dispositivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(mockSummary.deviceBreakdown).map(([name, value]) => ({
                          name,
                          value,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Sources Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Downloads por Fonte de Tráfego</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(mockSummary.sourceBreakdown).map(([name, value]) => ({ name, value }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professions Tab */}
          <TabsContent value="professions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Profissões</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={mockProfessions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="profession" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="downloads" fill="#10b981" name="Downloads" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Professions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes por Profissão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Profissão</th>
                        <th className="text-left py-2 px-4">Downloads</th>
                        <th className="text-left py-2 px-4">Emails Únicos</th>
                        <th className="text-left py-2 px-4">Percentual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockProfessions.map((prof) => (
                        <tr key={prof.profession} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{prof.profession}</td>
                          <td className="py-2 px-4">{prof.downloads}</td>
                          <td className="py-2 px-4">{prof.uniqueEmails}</td>
                          <td className="py-2 px-4">{prof.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Countries Tab */}
          <TabsContent value="countries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Países</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={mockCountries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="downloads" fill="#f59e0b" name="Downloads" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Countries Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes por País</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">País</th>
                        <th className="text-left py-2 px-4">Downloads</th>
                        <th className="text-left py-2 px-4">Percentual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockCountries.map((country) => (
                        <tr key={country.country} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{country.country}</td>
                          <td className="py-2 px-4">{country.downloads}</td>
                          <td className="py-2 px-4">{country.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Downloads por Fonte</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={Object.entries(mockSummary.sourceBreakdown).map(([name, value]) => ({ name, value }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Dispositivo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={Object.entries(mockSummary.deviceBreakdown).map(([name, value]) => ({ name, value }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendências (Últimos 7 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={mockTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="downloads" stroke="#3b82f6" name="Downloads" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
