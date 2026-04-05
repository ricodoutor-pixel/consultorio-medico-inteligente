import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Slack, Send } from 'lucide-react';

interface WebhookConfig {
  slackWebhook: string;
  discordWebhook: string;
  teamsWebhook: string;
  alertsEnabled: boolean;
  alertLevel: 'info' | 'warning' | 'critical';
  testMessage: string;
}

export function WebhookConfiguration() {
  const [config, setConfig] = useState<WebhookConfig>({
    slackWebhook: '',
    discordWebhook: '',
    teamsWebhook: '',
    alertsEnabled: true,
    alertLevel: 'warning',
    testMessage: '',
  });

  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [savedMessage, setSavedMessage] = useState('');

  // Carregar configurações salvas
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      // Carregar configurações do servidor
      // const response = await fetch('/api/webhooks/config');
      // const data = await response.json();
      // setConfig(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const handleConfigChange = (field: keyof WebhookConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveConfiguration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/webhooks/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setSavedMessage('✅ Configurações salvas com sucesso!');
        setTimeout(() => setSavedMessage(''), 3000);
      }
    } catch (error) {
      setSavedMessage('❌ Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async (platform: 'slack' | 'discord' | 'teams') => {
    setLoading(true);
    try {
      const response = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          webhook: config[`${platform}Webhook` as keyof WebhookConfig],
          message: config.testMessage || `Teste de ${platform}`,
        }),
      });

      const success = response.ok;
      setTestResults((prev) => ({
        ...prev,
        [platform]: success,
      }));

      if (success) {
        setSavedMessage(`✅ Teste de ${platform} enviado com sucesso!`);
      } else {
        setSavedMessage(`❌ Erro ao testar ${platform}`);
      }
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      setSavedMessage(`❌ Erro ao testar ${platform}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Configuração de Webhooks</h2>
        <div className="flex gap-2">
          <Button
            onClick={saveConfiguration}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            💾 Salvar Configurações
          </Button>
        </div>
      </div>

      {savedMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          {savedMessage.includes('✅') ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Configurações Gerais */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">⚙️ Configurações Gerais</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.alertsEnabled}
                onChange={(e) =>
                  handleConfigChange('alertsEnabled', e.target.checked)
                }
                className="w-4 h-4"
              />
              <span>Ativar Alertas</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Nível Mínimo de Alerta
            </label>
            <select
              value={config.alertLevel}
              onChange={(e) =>
                handleConfigChange(
                  'alertLevel',
                  e.target.value as 'info' | 'warning' | 'critical'
                )
              }
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="info">ℹ️ Informação</option>
              <option value="warning">⚠️ Aviso</option>
              <option value="critical">🚨 Crítico</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Mensagem de Teste
            </label>
            <Input
              value={config.testMessage}
              onChange={(e) =>
                handleConfigChange('testMessage', e.target.value)
              }
              placeholder="Digite uma mensagem de teste..."
            />
          </div>
        </div>
      </Card>

      {/* Slack */}
      <Card className="p-6 border-l-4 border-l-[#36C5F0]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Slack className="w-6 h-6 text-[#36C5F0]" />
            <h3 className="text-lg font-semibold">Slack</h3>
          </div>
          {testResults.slack && (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Webhook URL
            </label>
            <Input
              type="password"
              value={config.slackWebhook}
              onChange={(e) =>
                handleConfigChange('slackWebhook', e.target.value)
              }
              placeholder="https://hooks.slack.com/services/..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Obtenha em: https://api.slack.com/apps → Incoming Webhooks
            </p>
          </div>

          <Button
            onClick={() => testWebhook('slack')}
            disabled={loading || !config.slackWebhook}
            variant="outline"
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Testar Slack
          </Button>
        </div>
      </Card>

      {/* Discord */}
      <Card className="p-6 border-l-4 border-l-[#5865F2]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#5865F2] rounded-full flex items-center justify-center text-white text-xs font-bold">
              D
            </div>
            <h3 className="text-lg font-semibold">Discord</h3>
          </div>
          {testResults.discord && (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Webhook URL
            </label>
            <Input
              type="password"
              value={config.discordWebhook}
              onChange={(e) =>
                handleConfigChange('discordWebhook', e.target.value)
              }
              placeholder="https://discord.com/api/webhooks/..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Obtenha em: Server Settings → Integrations → Webhooks
            </p>
          </div>

          <Button
            onClick={() => testWebhook('discord')}
            disabled={loading || !config.discordWebhook}
            variant="outline"
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Testar Discord
          </Button>
        </div>
      </Card>

      {/* Microsoft Teams */}
      <Card className="p-6 border-l-4 border-l-[#0078D4]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#0078D4] rounded text-white text-xs font-bold flex items-center justify-center">
              T
            </div>
            <h3 className="text-lg font-semibold">Microsoft Teams</h3>
          </div>
          {testResults.teams && (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Webhook URL
            </label>
            <Input
              type="password"
              value={config.teamsWebhook}
              onChange={(e) =>
                handleConfigChange('teamsWebhook', e.target.value)
              }
              placeholder="https://outlook.webhook.office.com/..."
            />
            <p className="text-xs text-gray-500 mt-2">
              Obtenha em: Channel → Connectors → Configure → Incoming Webhook
            </p>
          </div>

          <Button
            onClick={() => testWebhook('teams')}
            disabled={loading || !config.teamsWebhook}
            variant="outline"
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Testar Teams
          </Button>
        </div>
      </Card>

      {/* Tipos de Alertas */}
      <Card className="p-6 bg-blue-50">
        <h3 className="text-lg font-semibold mb-4">📢 Tipos de Alertas</h3>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="font-semibold">ℹ️ Informação:</span>
            <span>Eventos normais do sistema</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold">⚠️ Aviso:</span>
            <span>Problemas que requerem atenção</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold">🚨 Crítico:</span>
            <span>Falhas que afetam o serviço</span>
          </div>
        </div>
      </Card>

      {/* Exemplos de Alertas */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📋 Exemplos de Alertas</h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <strong>✅ Agendamento Executado:</strong> Relatório enviado para 5
            usuários
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <strong>⚠️ Taxa de Falha Elevada:</strong> 25% de falha em
            agendamentos
          </div>
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <strong>🚨 Serviço Indisponível:</strong> Email gateway offline
          </div>
        </div>
      </Card>
    </div>
  );
}

export default WebhookConfiguration;
