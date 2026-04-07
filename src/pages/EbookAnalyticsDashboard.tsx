import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, Users, Globe, Smartphone } from "lucide-react";

export default function EbookAnalyticsDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect if not admin - handled by AdminRoute component

  // Fetch analytics data
  const summaryQuery = trpc.ebookAnalytics.getSummary.useQuery();
  const byProfessionQuery = trpc.ebookAnalytics.getByProfession.useQuery();
  const byCountryQuery = trpc.ebookAnalytics.getByCountry.useQuery();
  const bySourceQuery = trpc.ebookAnalytics.getBySource.useQuery();
  const byDeviceQuery = trpc.ebookAnalytics.getByDevice.useQuery();
  const trendsQuery = trpc.ebookAnalytics.getTrends.useQuery({ days: 30 });
  const topCountriesQuery = trpc.ebookAnalytics.getTopCountries.useQuery({ limit: 10 });
  const topProfessionsQuery = trpc.ebookAnalytics.getTopProfessions.useQuery({ limit: 10 });
  const exportMutation = trpc.ebookAnalytics.exportCSV.useMutation();

  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync();
      // Create and download CSV
      const element = document.createElement("a");
      const file = new Blob([result.csv], { type: "text/csv" });
      element.href = URL.createObjectURL(file);
      element.download = result.filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar este dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
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
              <div className="text-2xl font-bold">{summaryQuery.data?.totalDownloads || 0}</div>
              <p className="text-xs text-muted-foreground">Todos os tempos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryQuery.data?.uniqueEmails || 0}</div>
              <p className="text-xs text-muted-foreground">Usuários únicos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Países</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryQuery.data?.uniqueCountries || 0}</div>
              <p className="text-xs text-muted-foreground">Regiões geográficas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dispositivos</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.keys(summaryQuery.data?.deviceBreakdown || {}).length}
              </div>
              <p className="text-xs text-muted-foreground">Tipos de dispositivo</p>
            </CardContent>
          </Card>
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
                        data={Object.entries(summaryQuery.data?.professionBreakdown || {}).map(([name, value]) => ({
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
                        data={Object.entries(summaryQuery.data?.deviceBreakdown || {}).map(([name, value]) => ({
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
                  <BarChart data={Object.entries(summaryQuery.data?.sourceBreakdown || {}).map(([name, value]) => ({ name, value }))}>
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
                  <BarChart data={topProfessionsQuery.data || []}>
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
                        <th className="text-left py-2 px-4">Top Países</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byProfessionQuery.data?.map((prof: any) => (
                        <tr key={prof.profession} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{prof.profession}</td>
                          <td className="py-2 px-4">{prof.totalDownloads}</td>
                          <td className="py-2 px-4">{prof.uniqueEmails}</td>
                          <td className="py-2 px-4">{prof.percentage}%</td>
                          <td className="py-2 px-4">{prof.topCountries?.join(", ") || "N/A"}</td>
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
                  <BarChart data={topCountriesQuery.data || []}>
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
                        <th className="text-left py-2 px-4">Emails Únicos</th>
                        <th className="text-left py-2 px-4">Percentual</th>
                        <th className="text-left py-2 px-4">Top Profissões</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byCountryQuery.data?.map((country: any) => (
                        <tr key={country.country} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{country.country}</td>
                          <td className="py-2 px-4">{country.totalDownloads}</td>
                          <td className="py-2 px-4">{country.uniqueEmails}</td>
                          <td className="py-2 px-4">{country.percentage}%</td>
                          <td className="py-2 px-4">{country.topProfessions?.join(", ") || "N/A"}</td>
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
                <CardTitle>Análise de Fontes de Tráfego</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Fonte</th>
                        <th className="text-left py-2 px-4">Downloads</th>
                        <th className="text-left py-2 px-4">Emails Únicos</th>
                        <th className="text-left py-2 px-4">Percentual</th>
                        <th className="text-left py-2 px-4">Top Países</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bySourceQuery.data?.map((source: any) => (
                        <tr key={source.source} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4 font-medium">{source.source}</td>
                          <td className="py-2 px-4">{source.totalDownloads}</td>
                          <td className="py-2 px-4">{source.uniqueEmails}</td>
                          <td className="py-2 px-4">{source.percentage}%</td>
                          <td className="py-2 px-4">{source.topCountries?.join(", ") || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Dispositivos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Dispositivo</th>
                        <th className="text-left py-2 px-4">Downloads</th>
                        <th className="text-left py-2 px-4">Emails Únicos</th>
                        <th className="text-left py-2 px-4">Percentual</th>
                        <th className="text-left py-2 px-4">Top Browsers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byDeviceQuery.data?.map((device: any) => (
                        <tr key={device.deviceType} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4 font-medium">{device.deviceType}</td>
                          <td className="py-2 px-4">{device.totalDownloads}</td>
                          <td className="py-2 px-4">{device.uniqueEmails}</td>
                          <td className="py-2 px-4">{device.percentage}%</td>
                          <td className="py-2 px-4">{device.topBrowsers?.join(", ") || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendências de Downloads (Últimos 30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trendsQuery.data || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="downloads" stroke="#3b82f6" strokeWidth={2} name="Downloads" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Export Button */}
        <div className="mt-8 flex justify-end">
          <Button onClick={handleExport} disabled={exportMutation.isPending} className="gap-2">
            <Download className="h-4 w-4" />
            {exportMutation.isPending ? "Exportando..." : "Exportar CSV"}
          </Button>
        </div>
      </div>
    </div>
  );
}
