/**
 * GOOGLE ANALYTICS - INTEGRAÇÃO COMPLETA
 * Monitoramento de todas as atividades da plataforma
 * 
 * Rastreia:
 * - Visitantes e sessões
 * - Eventos de usuário
 * - Conversões
 * - Performance
 * - Comportamento de usuário
 * 
 * Data: 09/03/2026
 */

import { useEffect } from 'react';

// Google Analytics ID
const GA_ID = process.env.VITE_GOOGLE_ANALYTICS_ID || 'G-XXXXXXXXXX';

// ============================================================================
// INICIALIZAR GOOGLE ANALYTICS
// ============================================================================

export function initializeGoogleAnalytics() {
  // Adicionar script do Google Analytics
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // Configurar Google Analytics
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(arguments);
  }
  gtag('js', new Date());
  gtag('config', GA_ID, {
    page_path: window.location.pathname,
    anonymize_ip: true
  });

  console.log('✅ Google Analytics Inicializado');
}

// ============================================================================
// RASTREAR EVENTOS
// ============================================================================

export function trackEvent(eventName: string, eventData?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventData);
    console.log(`📊 Evento rastreado: ${eventName}`, eventData);
  }
}

// ============================================================================
// RASTREAR VISUALIZAÇÕES DE PÁGINA
// ============================================================================

export function trackPageView(pageName: string, pagePath: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_ID, {
      page_title: pageName,
      page_path: pagePath
    });
    console.log(`📄 Página rastreada: ${pageName}`);
  }
}

// ============================================================================
// RASTREAR CONVERSÕES
// ============================================================================

export function trackConversion(conversionType: string, value?: number) {
  trackEvent('conversion', {
    type: conversionType,
    value: value || 0,
    timestamp: new Date().toISOString()
  });

  console.log(`💰 Conversão rastreada: ${conversionType}`);
}

// ============================================================================
// RASTREAR USUÁRIOS
// ============================================================================

export function trackUser(userId: string, userData?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_ID, {
      'user_id': userId,
      'user_properties': userData || {}
    });

    console.log(`👤 Usuário rastreado: ${userId}`);
  }
}

// ============================================================================
// RASTREAR ERROS
// ============================================================================

export function trackError(errorMessage: string, errorStack?: string) {
  trackEvent('error', {
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString()
  });

  console.error(`🚨 Erro rastreado: ${errorMessage}`);
}

// ============================================================================
// RASTREAR PERFORMANCE
// ============================================================================

export function trackPerformance(metricName: string, value: number) {
  trackEvent('performance', {
    metric: metricName,
    value: value,
    timestamp: new Date().toISOString()
  });

  console.log(`⚡ Performance rastreada: ${metricName} = ${value}ms`);
}

// ============================================================================
// RASTREAR CONSULTAS
// ============================================================================

export function trackConsultation(consultationType: string, value: number) {
  trackConversion('consultation', value);
  trackEvent('consultation_booked', {
    type: consultationType,
    value: value,
    timestamp: new Date().toISOString()
  });

  console.log(`📅 Consulta rastreada: ${consultationType}`);
}

// ============================================================================
// RASTREAR PAGAMENTOS
// ============================================================================

export function trackPayment(paymentMethod: string, amount: number) {
  trackConversion('payment', amount);
  trackEvent('payment_completed', {
    method: paymentMethod,
    amount: amount,
    timestamp: new Date().toISOString()
  });

  console.log(`💳 Pagamento rastreado: R$ ${amount}`);
}

// ============================================================================
// RASTREAR CADASTRO
// ============================================================================

export function trackSignup(userType: string) {
  trackConversion('signup', 0);
  trackEvent('user_signup', {
    type: userType,
    timestamp: new Date().toISOString()
  });

  console.log(`📝 Cadastro rastreado: ${userType}`);
}

// ============================================================================
// RASTREAR LOGIN
// ============================================================================

export function trackLogin(userType: string) {
  trackEvent('user_login', {
    type: userType,
    timestamp: new Date().toISOString()
  });

  console.log(`🔓 Login rastreado: ${userType}`);
}

// ============================================================================
// RASTREAR LOGOUT
// ============================================================================

export function trackLogout() {
  trackEvent('user_logout', {
    timestamp: new Date().toISOString()
  });

  console.log('🔒 Logout rastreado');
}

// ============================================================================
// RASTREAR CLIQUES
// ============================================================================

export function trackClick(elementName: string, elementType: string) {
  trackEvent('click', {
    element: elementName,
    type: elementType,
    timestamp: new Date().toISOString()
  });

  console.log(`🖱️ Clique rastreado: ${elementName}`);
}

// ============================================================================
// RASTREAR FORMULÁRIOS
// ============================================================================

export function trackFormSubmit(formName: string, formData?: Record<string, any>) {
  trackEvent('form_submit', {
    form: formName,
    data: formData || {},
    timestamp: new Date().toISOString()
  });

  console.log(`📋 Formulário enviado: ${formName}`);
}

// ============================================================================
// HOOK REACT PARA RASTREAR PÁGINA
// ============================================================================

export function usePageTracking(pageName: string) {
  useEffect(() => {
    trackPageView(pageName, window.location.pathname);
  }, [pageName]);
}

// ============================================================================
// HOOK REACT PARA RASTREAR USUÁRIO
// ============================================================================

export function useUserTracking(userId: string | null, userData?: Record<string, any>) {
  useEffect(() => {
    if (userId) {
      trackUser(userId, userData);
    }
  }, [userId, userData]);
}

// ============================================================================
// DEFINIR TIPOS GLOBAIS
// ============================================================================

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// ============================================================================
// EXPORTAR TODAS AS FUNÇÕES
// ============================================================================

export const googleAnalytics = {
  initialize: initializeGoogleAnalytics,
  trackEvent,
  trackPageView,
  trackConversion,
  trackUser,
  trackError,
  trackPerformance,
  trackConsultation,
  trackPayment,
  trackSignup,
  trackLogin,
  trackLogout,
  trackClick,
  trackFormSubmit,
  usePageTracking,
  useUserTracking
};
