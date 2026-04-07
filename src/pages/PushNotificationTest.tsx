/**
 * Página de Teste - Web Push Notifications
 * 
 * Teste notificações em múltiplos navegadores:
 * - Chrome/Edge
 * - Firefox
 * - Safari (iOS 16+)
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface NotificationTest {
  id: string;
  browser: string;
  status: 'pending' | 'supported' | 'not_supported' | 'testing' | 'success' | 'error';
  message: string;
}

export default function PushNotificationTest() {
  const [tests, setTests] = useState<NotificationTest[]>([
    {
      id: '1',
      browser: '🌐 Chrome/Chromium',
      status: 'pending',
      message: 'Verificando suporte...',
    },
    {
      id: '2',
      browser: '🦊 Firefox',
      status: 'pending',
      message: 'Verificando suporte...',
    },
    {
      id: '3',
      browser: '🧭 Safari',
      status: 'pending',
      message: 'Verificando suporte...',
    },
    {
      id: '4',
      browser: '📱 Mobile (iOS)',
      status: 'pending',
      message: 'Verificando suporte...',
    },
    {
      id: '5',
      browser: '🤖 Mobile (Android)',
      status: 'pending',
      message: 'Verificando suporte...',
    },
  ]);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    checkNotificationSupport();
  }, []);

  const checkNotificationSupport = async () => {
    // Verificar suporte a Notification API
    if ('Notification' in window) {
      updateTest('1', 'supported', 'Suporte detectado');

      // Verificar suporte a Service Worker
      if ('serviceWorker' in navigator) {
        updateTest('2', 'supported', 'Service Worker suportado');

        // Verificar suporte a Push API
        if ('PushManager' in window) {
          updateTest('3', 'supported', 'Push API suportada');

          // Detectar navegador
          const userAgent = navigator.userAgent;
          if (userAgent.includes('Chrome')) {
            updateTest('1', 'supported', '✅ Chrome com suporte completo');
          } else if (userAgent.includes('Firefox')) {
            updateTest('2', 'supported', '✅ Firefox com suporte completo');
          } else if (userAgent.includes('Safari')) {
            updateTest('3', 'supported', '✅ Safari com suporte completo');
          }

          // Detectar mobile
          if (/Android/i.test(userAgent)) {
            updateTest('5', 'supported', '✅ Android com suporte completo');
          } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
            updateTest('4', 'supported', '✅ iOS 16+ com suporte');
          }
        } else {
          updateTest('3', 'not_supported', 'Push API não suportada');
        }
      } else {
        updateTest('2', 'not_supported', 'Service Worker não suportado');
      }
    } else {
      updateTest('1', 'not_supported', 'Notification API não suportada');
    }
  };

  const updateTest = (id: string, status: NotificationTest['status'], message: string) => {
    setTests((prev) =>
      prev.map((test) => (test.id === id ? { ...test, status, message } : test))
    );
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações');
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        setIsSubscribed(true);
        alert('✅ Permissão concedida! Notificações ativadas.');
      } else if (permission === 'denied') {
        alert('❌ Permissão negada. Você pode ativar em configurações do navegador.');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      alert('❌ Erro ao solicitar permissão');
    }
  };

  const sendTestNotification = async () => {
    if (!isSubscribed) {
      alert('Primeiro, ative as notificações');
      return;
    }

    setIsTesting(true);

    try {
      // Simular notificação
      new Notification('✅ Teste - Planta y Raiz', {
        body: 'Se você viu esta notificação, o sistema está funcionando!',
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'test-notification',
        requireInteraction: false,
      });

      updateTest('1', 'success', 'Notificação de teste enviada com sucesso');
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      updateTest('1', 'error', 'Erro ao enviar notificação');
    } finally {
      setIsTesting(false);
    }
  };

  const testConsultationNotification = () => {
    if (!isSubscribed) {
      alert('Primeiro, ative as notificações');
      return;
    }

    new Notification('🏥 Nova Consulta Agendada', {
      body: 'Sua consulta com Dr. Edilson foi confirmada para hoje às 14:00',
      icon: '/logo.png',
      tag: 'consultation',
      requireInteraction: true,
    });
  };

  const testPaymentNotification = () => {
    if (!isSubscribed) {
      alert('Primeiro, ative as notificações');
      return;
    }

    new Notification('💳 Pagamento Confirmado', {
      body: 'Seu pagamento de R$ 130,00 foi processado com sucesso',
      icon: '/logo.png',
      tag: 'payment',
    });
  };

  const testPrescriptionNotification = () => {
    if (!isSubscribed) {
      alert('Primeiro, ative as notificações');
      return;
    }

    new Notification('💊 Prescrição Disponível', {
      body: 'Sua prescrição está pronta para retirada na farmácia',
      icon: '/logo.png',
      tag: 'prescription',
      requireInteraction: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            🔔 Teste de Notificações Push
          </h1>
          <p className="text-gray-400">
            Teste Web Push API em múltiplos navegadores e dispositivos
          </p>
        </div>

        {/* Status */}
        <Card className="bg-slate-800 border-slate-700 mb-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">📊 Status</h2>
              <p className="text-gray-400">
                {isSubscribed
                  ? '✅ Notificações ativadas'
                  : '❌ Notificações desativadas'}
              </p>
            </div>
            <Button
              onClick={requestPermission}
              disabled={isSubscribed}
              className={`${
                isSubscribed
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {isSubscribed ? '✅ Ativado' : '🔔 Ativar'}
            </Button>
          </div>
        </Card>

        {/* Compatibilidade */}
        <Card className="bg-slate-800 border-slate-700 mb-6 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">🌐 Compatibilidade</h2>

          <div className="space-y-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className={`p-4 rounded border-l-4 ${
                  test.status === 'supported'
                    ? 'bg-green-900 border-l-green-500'
                    : test.status === 'not_supported'
                      ? 'bg-red-900 border-l-red-500'
                      : test.status === 'success'
                        ? 'bg-green-900 border-l-green-500'
                        : test.status === 'error'
                          ? 'bg-red-900 border-l-red-500'
                          : 'bg-slate-700 border-l-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{test.browser}</p>
                    <p className="text-sm text-gray-300 mt-1">{test.message}</p>
                  </div>
                  <div className="text-2xl">
                    {test.status === 'supported' && '✅'}
                    {test.status === 'not_supported' && '❌'}
                    {test.status === 'success' && '✅'}
                    {test.status === 'error' && '❌'}
                    {test.status === 'pending' && '⏳'}
                    {test.status === 'testing' && '⚙️'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Testes */}
        <Card className="bg-slate-800 border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">🧪 Testes de Notificação</h2>

          <div className="space-y-3">
            <Button
              onClick={sendTestNotification}
              disabled={!isSubscribed || isTesting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isTesting ? '⏳ Enviando...' : '📬 Teste Genérico'}
            </Button>

            <Button
              onClick={testConsultationNotification}
              disabled={!isSubscribed}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              🏥 Teste: Consulta Agendada
            </Button>

            <Button
              onClick={testPaymentNotification}
              disabled={!isSubscribed}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              💳 Teste: Pagamento Confirmado
            </Button>

            <Button
              onClick={testPrescriptionNotification}
              disabled={!isSubscribed}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              💊 Teste: Prescrição Disponível
            </Button>
          </div>

          <div className="mt-6 p-4 bg-slate-700 rounded text-gray-300 text-sm">
            <p className="font-semibold mb-2">💡 Dicas:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ative as notificações para receber alertas em tempo real</li>
              <li>Teste em diferentes navegadores para garantir compatibilidade</li>
              <li>Verifique as configurações de notificação do seu dispositivo</li>
              <li>Em mobile, as notificações funcionam mesmo com o app fechado</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
