import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Settings, BarChart3, Shield, Search, Edit, Trash2, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { AdminScheduleExport } from '@/components/AdminScheduleExport';
import { AdminScheduleMonitor } from '@/components/AdminScheduleMonitor';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');

  const users = [
    { id: 1, name: 'João Silva', email: 'joao@example.com', role: 'user', status: 'active', joinDate: '2025-06-15' },
    { id: 2, name: 'Maria Santos', email: 'maria@example.com', role: 'professional', status: 'active', joinDate: '2025-07-20' },
    { id: 3, name: 'Carlos Costa', email: 'carlos@example.com', role: 'user', status: 'inactive', joinDate: '2025-08-10' },
  ];

  const professionals = [
    { id: 1, name: 'Dr. Carlos Silva', specialty: 'Psiquiatria', verified: true, rating: 4.9, patients: 45 },
    { id: 2, name: 'Dra. Maria Santos', specialty: 'Neurologia', verified: true, rating: 4.8, patients: 32 },
    { id: 3, name: 'Dr. João Oliveira', specialty: 'Farmácia', verified: false, rating: 4.6, patients: 18 },
  ];

  const transactions = [
    { id: 1, user: 'João Silva', amount: 79.90, type: 'subscription', status: 'completed', date: '2026-02-23' },
    { id: 2, user: 'Maria Santos', amount: 150.00, type: 'consultation', status: 'completed', date: '2026-02-22' },
    { id: 3, user: 'Carlos Costa', amount: 29.90, type: 'subscription', status: 'pending', date: '2026-02-21' },
  ];

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0E27] via-[#1a1f3a] to-[#0A0E27]">
      {/* HEADER */}
      <div className="bg-[#0A0E27]/80 backdrop-blur-sm border-b border-[#00FF00]/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-2">
                <Shield className="w-8 h-8 text-[#00FF00]" />
                Painel Administrativo
              </h1>
              <p className="text-gray-400">Gerenciamento completo da plataforma</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* TABS */}
        <div className="flex gap-4 mb-8 border-b border-[#00FF00]/20">
          {[
            { id: 'users', label: 'Usuários', icon: Users },
            { id: 'professionals', label: 'Profissionais', icon: Users },
            { id: 'transactions', label: 'Transações', icon: BarChart3 },
            { id: 'schedules', label: 'Agendamentos', icon: Mail },
            { id: 'monitor', label: 'Monitoramento', icon: BarChart3 },
            { id: 'settings', label: 'Configurações', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-semibold flex items-center gap-2 transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-[#00FF00] text-[#00FF00]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <div className="mb-6 flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 bg-white/10 border-[#00FF00]/30 text-white"
                />
              </div>
              <Button className="bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00] font-bold">
                Adicionar Usuário
              </Button>
            </div>

            <Card className="bg-white/5 border border-[#00FF00]/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/10 border-b border-[#00FF00]/20">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Nome</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Tipo</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Data</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-white font-semibold">{user.name}</td>
                        <td className="px-6 py-4 text-gray-400">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#9D4EDD]/30 text-[#9D4EDD]">
                            {user.role === 'user' ? 'Paciente' : 'Profissional'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {user.status === 'active' ? (
                              <CheckCircle className="w-4 h-4 text-[#00FF00]" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                            <span className={user.status === 'active' ? 'text-[#00FF00]' : 'text-red-500'}>
                              {user.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">{user.joinDate}</td>
                        <td className="px-6 py-4 flex gap-2">
                          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-[#00FF00]" />
                          </button>
                          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* PROFESSIONALS TAB */}
        {activeTab === 'professionals' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.map(prof => (
              <Card key={prof.id} className="bg-gradient-to-br from-[#9D4EDD]/10 to-[#00FF00]/5 border border-[#00FF00]/20 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{prof.name}</h3>
                    <p className="text-sm text-gray-400">{prof.specialty}</p>
                  </div>
                  {prof.verified ? (
                    <CheckCircle className="w-6 h-6 text-[#00FF00]" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Rating</span>
                    <span className="text-[#00FF00] font-bold">{prof.rating} ⭐</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Pacientes</span>
                    <span className="text-[#9D4EDD] font-bold">{prof.patients}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00] font-bold text-sm">
                    Editar
                  </Button>
                  {!prof.verified && (
                    <Button className="flex-1 bg-[#9D4EDD] text-white hover:bg-[#8a3fbf] font-bold text-sm">
                      Verificar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <Card className="bg-white/5 border border-[#00FF00]/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/10 border-b border-[#00FF00]/20">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Usuário</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Valor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Tipo</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-white font-semibold">{tx.user}</td>
                      <td className="px-6 py-4 text-[#00FF00] font-bold">R$ {tx.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#9D4EDD]/30 text-[#9D4EDD]">
                          {tx.type === 'subscription' ? 'Assinatura' : 'Consulta'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tx.status === 'completed'
                            ? 'bg-[#00FF00]/30 text-[#00FF00]'
                            : 'bg-yellow-500/30 text-yellow-500'
                        }`}>
                          {tx.status === 'completed' ? 'Concluída' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* SCHEDULES TAB */}
        {activeTab === 'schedules' && (
          <div>
            <AdminScheduleExport />
          </div>
        )}

        {/* MONITOR TAB */}
        {activeTab === 'monitor' && (
          <div>
            <AdminScheduleMonitor />
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-white/5 border border-[#00FF00]/20 p-6">
              <h3 className="text-xl font-bold text-white mb-6">Configurações Gerais</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Nome da Plataforma</label>
                  <Input
                    type="text"
                    defaultValue="Planta & Raiz"
                    className="bg-white/10 border-[#00FF00]/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Email de Suporte</label>
                  <Input
                    type="email"
                    defaultValue="support@plantaeraiz.com"
                    className="bg-white/10 border-[#00FF00]/30 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Telefone</label>
                  <Input
                    type="tel"
                    defaultValue="+55 11 98765-4321"
                    className="bg-white/10 border-[#00FF00]/30 text-white"
                  />
                </div>
                <Button className="w-full bg-[#00FF00] text-[#0A0E27] hover:bg-[#00dd00] font-bold">
                  Salvar Alterações
                </Button>
              </div>
            </Card>

            <Card className="bg-white/5 border border-[#9D4EDD]/20 p-6">
              <h3 className="text-xl font-bold text-white mb-6">Configurações de Segurança</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Autenticação 2FA</label>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">Ativado</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Backup Automático</label>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">Diário</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Logs de Auditoria</label>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-400">Ativado</span>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </div>
                </div>
                <Button className="w-full bg-[#9D4EDD] text-white hover:bg-[#8a3fbf] font-bold">
                  Aplicar Segurança
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
